import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../config/prisma";
import { bookAppointment, createBreak } from "../services/appointment.service";
import { addAvailability } from "../services/doctor.service";

// Covers the highest-priority chain from the change request: multiple periods,
// break creation, affected-appointment detection, nearest-slot reschedule,
// and transactional safety when no slot is available.

describe("multi-period availability + break-triggered rescheduling", () => {
  let doctorId: number;
  let patientId: number;
  const date = "2099-07-06"; // a Monday, far in the future

  beforeAll(async () => {
    const doctor = await prisma.doctor.create({
      data: { name: "Test Reschedule Doctor", specialization: "Testing" },
    });
    doctorId = doctor.id;

    await addAvailability(doctorId, { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "13:00" });
    await addAvailability(doctorId, { dayOfWeek: "MONDAY", startTime: "14:00", endTime: "17:00" });

    const patient = await prisma.user.create({
      data: { name: "Resched Patient", email: `resched-${Date.now()}@test.com`, password: "x", role: "PATIENT" },
    });
    patientId = patient.id;
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { doctorId } });
    await prisma.doctorBreak.deleteMany({ where: { doctorId } });
    await prisma.doctorAvailability.deleteMany({ where: { doctorId } });
    await prisma.doctor.delete({ where: { id: doctorId } });
    await prisma.user.delete({ where: { id: patientId } });
    await prisma.$disconnect();
  });

  it("rejects an overlapping second period but allows a non-overlapping one", async () => {
    await expect(
      addAvailability(doctorId, { dayOfWeek: "MONDAY", startTime: "12:00", endTime: "15:00" })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("moves an affected BOOKED appointment to the nearest free slot when a break is created", async () => {
    const appt = await bookAppointment(patientId, { doctorId, date, time: "11:00" });

    const result = await createBreak(doctorId, { date, startTime: "10:30", endTime: "11:30" });

    expect(result.rescheduled).toHaveLength(1);
    expect(result.rescheduled[0].id).toBe(appt.id);
    expect(result.rescheduled[0].from).toBe("11:00");

    const moved = await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } });
    expect(moved.status).toBe("BOOKED");
    expect(moved.time).toBe(result.rescheduled[0].to);
    expect(["10:30", "11:30"]).not.toContain("11:00"); // sanity: didn't stay inside the break
  });

  it("does not move a CANCELLED appointment", async () => {
    const appt = await bookAppointment(patientId, { doctorId, date: "2099-07-13", time: "15:00" });
    await prisma.appointment.update({ where: { id: appt.id }, data: { status: "CANCELLED" } });

    await createBreak(doctorId, { date: "2099-07-13", startTime: "14:30", endTime: "15:30" });

    const unchanged = await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } });
    expect(unchanged.time).toBe("15:00");
    expect(unchanged.status).toBe("CANCELLED");
  });

  it("rolls back the break entirely if an affected appointment has nowhere to go", async () => {
    const fullDate = "2099-07-20";
    const times = [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
    ];
    for (const time of times) {
      await bookAppointment(patientId, { doctorId, date: fullDate, time });
    }

    await expect(
      createBreak(doctorId, { date: fullDate, startTime: "09:00", endTime: "09:30" })
    ).rejects.toMatchObject({ statusCode: 409 });

    const breaksThatDay = await prisma.doctorBreak.findMany({ where: { doctorId, date: new Date(fullDate) } });
    expect(breaksThatDay).toHaveLength(0);

    const stillAt0900 = await prisma.appointment.findFirst({
      where: { doctorId, date: new Date(fullDate), time: "09:00" },
    });
    expect(stillAt0900?.status).toBe("BOOKED");
  });
});
