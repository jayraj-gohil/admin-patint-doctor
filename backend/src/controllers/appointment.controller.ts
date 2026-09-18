import { FastifyReply, FastifyRequest } from "fastify";
import { createAppointmentSchema } from "../validators/appointment.validator";
import * as appointmentService from "../services/appointment.service";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

function requirePatientId(request: FastifyRequest): number {
  if (!request.user) throw new UnauthorizedError();
  return request.user.userId;
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const patientId = requirePatientId(request);
  const input = createAppointmentSchema.parse(request.body);
  const appointment = await appointmentService.bookAppointment(patientId, input);
  return reply.status(201).send(appointment);
}

export async function listMine(request: FastifyRequest, reply: FastifyReply) {
  const patientId = requirePatientId(request);
  const appointments = await appointmentService.listMyAppointments(patientId);
  return reply.send(appointments);
}

export async function cancel(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const patientId = requirePatientId(request);
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError("Invalid id");
  const appointment = await appointmentService.cancelAppointment(patientId, id);
  return reply.send(appointment);
}
