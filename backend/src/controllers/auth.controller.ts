import { FastifyReply, FastifyRequest } from "fastify";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import * as authService from "../services/auth.service";

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const input = registerSchema.parse(request.body);
  const result = await authService.registerPatient(input);
  return reply.status(201).send(result);
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const input = loginSchema.parse(request.body);
  const result = await authService.login(input);
  return reply.status(200).send(result);
}
