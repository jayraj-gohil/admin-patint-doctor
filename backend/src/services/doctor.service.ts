import { prisma } from "../config/prisma";
import { ConflictError, NotFoundError } from "../utils/errors";
import { rangesOverlap } from "../utils/slots";
import {
  CreateDoctorInput,
  UpdateDoctorInput,
  UpsertAvailabilityInput,
} from "../validators/doctor.validator";

export async function listDoctors() {
  return prisma.doctor.findMany({ orderBy: { name: "asc" } });
}

export async function getDoctorById(id: number) {
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) throw new NotFoundError("Doctor not found");
  return doctor;
}

export async function createDoctor(input: CreateDoctorInput) {
  return prisma.doctor.create({ data: input });
}

export async function updateDoctor(id: number, input: UpdateDoctorInput) {
  await getDoctorById(id);
  return prisma.doctor.update({ where: { id }, data: input });
}

export async function deleteDoctor(id: number) {
  await getDoctorById(id);
  await prisma.doctor.delete({ where: { id } });
}

export async function listAvailability(doctorId: number) {
  await getDoctorById(doctorId);
  return prisma.doctorAvailability.findMany({
    where: { doctorId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

// A doctor may have multiple, non-overlapping periods on the same day (e.g.
// 09:00-13:00 and 14:00-17:00). Touching boundaries (13:00/13:00) are allowed;
// genuine overlaps (12:00-15:00 vs 09:00-13:00) are rejected.
export async function addAvailability(doctorId: number, input: UpsertAvailabilityInput) {
  await getDoctorById(doctorId);

  const existing = await prisma.doctorAvailability.findMany({
    where: { doctorId, dayOfWeek: input.dayOfWeek },
  });
  const overlap = existing.some((p) => rangesOverlap(input.startTime, input.endTime, p.startTime, p.endTime));
  if (overlap) {
    throw new ConflictError("This period overlaps an existing availability period for this day");
  }

  return prisma.doctorAvailability.create({ data: { doctorId, ...input } });
}

export async function deleteAvailability(doctorId: number, availabilityId: number) {
  const period = await prisma.doctorAvailability.findUnique({ where: { id: availabilityId } });
  if (!period || period.doctorId !== doctorId) throw new NotFoundError("Availability period not found");
  await prisma.doctorAvailability.delete({ where: { id: availabilityId } });
}
