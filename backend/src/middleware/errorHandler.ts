import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors";

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }

  if (error instanceof ZodError) {
    const message = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    return reply.status(400).send({ error: message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return reply.status(409).send({ error: "A record with this value already exists" });
    }
    if (error.code === "P2025") {
      return reply.status(404).send({ error: "Record not found" });
    }
  }

  request.log.error(error);
  return reply.status(500).send({ error: "Internal server error" });
}
