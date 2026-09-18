import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { signToken } from "../utils/jwt";
import { ConflictError, UnauthorizedError } from "../utils/errors";
import { LoginInput, RegisterInput } from "../validators/auth.validator";

const SALT_ROUNDS = 10;

function toSafeUser(user: { id: number; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function registerPatient(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      role: "PATIENT",
    },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: toSafeUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);
  if (!passwordMatches) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: toSafeUser(user) };
}
