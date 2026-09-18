import { FastifyReply, FastifyRequest } from "fastify";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }
  const token = header.slice("Bearer ".length);
  try {
    request.user = verifyToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export function requireRole(...roles: Array<"ADMIN" | "PATIENT">) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    if (!request.user || !roles.includes(request.user.role)) {
      throw new ForbiddenError("You do not have permission to perform this action");
    }
  };
}
