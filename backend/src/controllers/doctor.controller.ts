import { FastifyReply, FastifyRequest } from "fastify";
import {
  createBreakSchema,
  createDoctorSchema,
  slotsQuerySchema,
  updateDoctorSchema,
  upsertAvailabilitySchema,
} from "../validators/doctor.validator";
import * as doctorService from "../services/doctor.service";
import * as appointmentService from "../services/appointment.service";
import { BadRequestError } from "../utils/errors";

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError("Invalid id");
  return id;
}

export async function list(_request: FastifyRequest, reply: FastifyReply) {
  const doctors = await doctorService.listDoctors();
  return reply.send(doctors);
}

export async function getOne(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const doctor = await doctorService.getDoctorById(parseId(request.params.id));
  return reply.send(doctor);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const input = createDoctorSchema.parse(request.body);
  const doctor = await doctorService.createDoctor(input);
  return reply.status(201).send(doctor);
}

export async function update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const input = updateDoctorSchema.parse(request.body);
  const doctor = await doctorService.updateDoctor(parseId(request.params.id), input);
  return reply.send(doctor);
}

export async function remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  await doctorService.deleteDoctor(parseId(request.params.id));
  return reply.status(204).send();
}

export async function listAvailability(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const availability = await doctorService.listAvailability(parseId(request.params.id));
  return reply.send(availability);
}

export async function addAvailability(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const input = upsertAvailabilitySchema.parse(request.body);
  const availability = await doctorService.addAvailability(parseId(request.params.id), input);
  return reply.status(201).send(availability);
}

export async function deleteAvailability(
  request: FastifyRequest<{ Params: { id: string; availabilityId: string } }>,
  reply: FastifyReply
) {
  await doctorService.deleteAvailability(parseId(request.params.id), parseId(request.params.availabilityId));
  return reply.status(204).send();
}

export async function getSlots(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { date: string } }>,
  reply: FastifyReply
) {
  const { date } = slotsQuerySchema.parse(request.query);
  const result = await appointmentService.getAvailableSlots(parseId(request.params.id), date);
  return reply.send(result);
}

export async function listBreaks(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const breaks = await appointmentService.listBreaks(parseId(request.params.id));
  return reply.send(breaks);
}

export async function createBreak(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const input = createBreakSchema.parse(request.body);
  const result = await appointmentService.createBreak(parseId(request.params.id), input);
  return reply.status(201).send(result);
}

export async function deleteBreak(
  request: FastifyRequest<{ Params: { id: string; breakId: string } }>,
  reply: FastifyReply
) {
  await appointmentService.deleteBreak(parseId(request.params.id), parseId(request.params.breakId));
  return reply.status(204).send();
}
