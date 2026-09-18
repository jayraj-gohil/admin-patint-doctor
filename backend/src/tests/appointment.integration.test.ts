import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../config/prisma";
import { bookAppointment, cancelAppointment, getAvailableSlots } from "../services/appointment.service";

// Integration tests: require a running PostgreSQL instance reachable via DATABASE_URL
// (see README "Running Tests"). They exercise the exact rule the assessment
// emphasises: no double-booking, and cancellation frees the slot again.

describe("appointment booking + cancellation", () => {
  let doctorId: number;
  let patientAId: number;
  let patientBId: number;
  const date = "2099-06-01"; // a Monday, far in the future so it never collides
  const time = "10:00";

  beforeAll(async () => {
    const doctor = await prisma.doctor.create({
      data: { name: "Test Doctor", specialization: "Testing" },
    });
    doctorId = doctor.id;

    await prisma.doctorAvailability.create({
      data: { doctorId, dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00" },
    });

    const patientA = await prisma.user.create({
      data: { name: "Patient A", email: `patient-a-${Date.now()}@test.com`, password: "x", role: "PATIENT" },
    });
    const patientB = await prisma.user.create({
      data: { name: "Patient B", email: `patient-b-${Date.now()}@test.com`, password: "x", role: "PATIENT" },
    });
    patientAId = patientA.id;
    patientBId = patientB.id;
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { doctorId } });
    await prisma.doctorAvailability.deleteMany({ where: { doctorId } });
    await prisma.doctor.delete({ where: { id: doctorId } });
    await prisma.user.deleteMany({ where: { id: { in: [patientAId, patientBId] } } });
    await prisma.$disconnect();
  });

  it("lists the slot as available before any booking", async () => {
    const { slots } = await getAvailableSlots(doctorId, date);
    expect(slots).toContain(time);
  });

  it("books the slot for patient A", async () => {
    const appointment = await bookAppointment(patientAId, { doctorId, date, time });
    expect(appointment.status).toBe("BOOKED");
    expect(appointment.patientId).toBe(patientAId);
  });

  it("no longer lists the slot as available", async () => {
    const { slots } = await getAvailableSlots(doctorId, date);
    expect(slots).not.toContain(time);
  });

  it("rejects patient B booking the same slot with 409-style conflict", async () => {
    await expect(bookAppointment(patientBId, { doctorId, date, time })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("frees the slot again once patient A cancels", async () => {
    const booked = await prisma.appointment.findFirstOrThrow({
      where: { doctorId, date: new Date(date), time },
    });
    await cancelAppointment(patientAId, booked.id);

    const { slots } = await getAvailableSlots(doctorId, date);
    expect(slots).toContain(time);
  });

  it("allows patient B to book the now-cancelled slot", async () => {
    const appointment = await bookAppointment(patientBId, { doctorId, date, time });
    expect(appointment.status).toBe("BOOKED");
    expect(appointment.patientId).toBe(patientBId);
  });
});
