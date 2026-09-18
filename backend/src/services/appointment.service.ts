import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import {
  dayOfWeekFromDateString,
  filterAvailableSlots,
  generateSlots,
  rangesOverlap,
  slotOverlapsRange,
  timeDiffMinutes,
} from "../utils/slots";
import { CreateAppointmentInput } from "../validators/appointment.validator";
import { CreateBreakInput } from "../validators/doctor.validator";

type Db = PrismaClient | Prisma.TransactionClient;

/** All slots generated from the doctor's periods for that day, with any break-covered slots removed. Does NOT filter out already-booked slots or past times. */
async function getRawSlotsForDay(db: Db, doctorId: number, date: string): Promise<string[]> {
  const dayOfWeek = dayOfWeekFromDateString(date);
  const periods = await db.doctorAvailability.findMany({ where: { doctorId, dayOfWeek } });
  if (periods.length === 0) return [];

  const breaks = await db.doctorBreak.findMany({ where: { doctorId, date: new Date(date) } });

  const allSlots = Array.from(new Set(periods.flatMap((p) => generateSlots(p.startTime, p.endTime))));
  return allSlots
    .filter((slot) => !breaks.some((b) => slotOverlapsRange(slot, b.startTime, b.endTime)))
    .sort();
}

export async function getAvailableSlots(doctorId: number, date: string) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new NotFoundError("Doctor not found");

  const rawSlots = await getRawSlotsForDay(prisma, doctorId, date);

  const bookedAppointments = await prisma.appointment.findMany({
    where: { doctorId, date: new Date(date), status: "BOOKED" },
    select: { time: true },
  });

  const slots = filterAvailableSlots(
    rawSlots,
    bookedAppointments.map((a) => a.time),
    date
  );

  return { doctorId, date, slots };
}

export async function bookAppointment(patientId: number, input: CreateAppointmentInput) {
  const doctor = await prisma.doctor.findUnique({ where: { id: input.doctorId } });
  if (!doctor) throw new NotFoundError("Doctor not found");

  const validSlots = await getRawSlotsForDay(prisma, input.doctorId, input.date);
  if (validSlots.length === 0) {
    throw new BadRequestError("Doctor is not available on this day");
  }
  if (!validSlots.includes(input.time)) {
    throw new BadRequestError("Requested time is not a valid appointment slot");
  }

  // Atomic, race-safe upsert: creates the slot if it has never existed, or
  // flips it back to BOOKED if it was previously CANCELLED. If a row already
  // exists with status BOOKED, the WHERE guard blocks the update and no row
  // is returned -> we know someone else won the race for this slot.
  const rows = await prisma.$queryRaw<
    Array<{ id: number; doctorId: number; patientId: number; date: Date; time: string; status: string }>
  >(Prisma.sql`
    INSERT INTO "Appointment" ("doctorId", "patientId", "date", "time", "status", "updatedAt")
    VALUES (${input.doctorId}, ${patientId}, ${input.date}::date, ${input.time}, 'BOOKED'::"AppointmentStatus", now())
    ON CONFLICT ("doctorId", "date", "time")
    DO UPDATE SET "patientId" = EXCLUDED."patientId", "status" = 'BOOKED'::"AppointmentStatus", "updatedAt" = now()
    WHERE "Appointment"."status" = 'CANCELLED'::"AppointmentStatus"
    RETURNING id, "doctorId", "patientId", "date", "time", "status";
  `);

  if (rows.length === 0) {
    throw new ConflictError("This appointment slot is no longer available");
  }

  return prisma.appointment.findUniqueOrThrow({
    where: { id: rows[0].id },
    include: { doctor: true },
  });
}

export async function listMyAppointments(patientId: number) {
  return prisma.appointment.findMany({
    where: { patientId },
    include: { doctor: true },
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });
}

export async function cancelAppointment(patientId: number, appointmentId: number) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment || appointment.patientId !== patientId) {
    throw new NotFoundError("Appointment not found");
  }
  if (appointment.status === "CANCELLED") {
    throw new BadRequestError("Appointment is already cancelled");
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
    include: { doctor: true },
  });
}

export async function listBreaks(doctorId: number) {
  return prisma.doctorBreak.findMany({
    where: { doctorId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function deleteBreak(doctorId: number, breakId: number) {
  const brk = await prisma.doctorBreak.findUnique({ where: { id: breakId } });
  if (!brk || brk.doctorId !== doctorId) throw new NotFoundError("Break not found");
  await prisma.doctorBreak.delete({ where: { id: breakId } });
}

/**
 * "Nearest" = smallest absolute time difference from the original slot; ties
 * are broken in favor of the later slot (see README assumptions).
 */
function pickNearestSlot(originalTime: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, candidate) => {
    const bestDiff = timeDiffMinutes(originalTime, best);
    const candidateDiff = timeDiffMinutes(originalTime, candidate);
    if (candidateDiff < bestDiff) return candidate;
    if (candidateDiff === bestDiff && candidate > best) return candidate;
    return best;
  });
}

/**
 * Creates a break for a doctor on a specific date, then finds and reschedules
 * any BOOKED appointments that fall inside it, atomically. If any affected
 * appointment cannot be moved to a valid, available slot, the entire
 * operation (break creation + any moves) is rolled back and rejected.
 */
export async function createBreak(doctorId: number, input: CreateBreakInput) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new NotFoundError("Doctor not found");

  return prisma.$transaction(async (tx) => {
    const rawSlots = await getRawSlotsForDay(tx, doctorId, input.date);
    const dayOfWeek = dayOfWeekFromDateString(input.date);
    const periods = await tx.doctorAvailability.findMany({ where: { doctorId, dayOfWeek } });
    const overlapsAvailability = periods.some((p) =>
      rangesOverlap(input.startTime, input.endTime, p.startTime, p.endTime)
    );
    if (!overlapsAvailability) {
      throw new BadRequestError(
        "This break does not overlap the doctor's availability on this date"
      );
    }

    const brk = await tx.doctorBreak.create({
      data: { doctorId, date: new Date(input.date), startTime: input.startTime, endTime: input.endTime },
    });

    // Every appointment ever created for this doctor+date (any status) occupies
    // its (doctorId, date, time) slot permanently at the DB level, so reschedule
    // targets must avoid all of them, not just currently-BOOKED ones.
    const allAppointmentsThatDay = await tx.appointment.findMany({
      where: { doctorId, date: new Date(input.date) },
    });
    const occupiedTimes = new Set(allAppointmentsThatDay.map((a) => a.time));

    const affected = allAppointmentsThatDay
      .filter((a) => a.status === "BOOKED")
      .filter((a) => slotOverlapsRange(a.time, input.startTime, input.endTime))
      .sort((a, b) => (a.time < b.time ? -1 : 1));

    if (affected.length === 0) {
      return { break: brk, rescheduled: [] as Array<{ id: number; from: string; to: string }> };
    }

    let candidatePool = rawSlots.filter((s) => !occupiedTimes.has(s));
    const rescheduled: Array<{ id: number; from: string; to: string }> = [];

    for (const appointment of affected) {
      const newTime = pickNearestSlot(appointment.time, candidatePool);
      if (!newTime) {
        throw new ConflictError(
          `Cannot create this break: appointment #${appointment.id} at ${appointment.time} has no available slot to move to`
        );
      }
      candidatePool = candidatePool.filter((s) => s !== newTime);
      rescheduled.push({ id: appointment.id, from: appointment.time, to: newTime });
    }

    for (const move of rescheduled) {
      await tx.appointment.update({ where: { id: move.id }, data: { time: move.to } });
    }

    return { break: brk, rescheduled };
  });
}
