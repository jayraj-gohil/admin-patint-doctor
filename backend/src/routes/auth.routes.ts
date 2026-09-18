import { FastifyInstance } from "fastify";
import * as authController from "../controllers/auth.controller";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", authController.register);
  app.post("/login", authController.login);
}
