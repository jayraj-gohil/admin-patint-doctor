import { FastifyInstance } from "fastify";
import * as appointmentController from "../controllers/appointment.controller";
import { authenticate, requireRole } from "../middleware/auth";

export async function appointmentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireRole("PATIENT"));

  app.post("/", appointmentController.create);
  app.get("/", appointmentController.listMine);
  app.patch<{ Params: { id: string } }>("/:id/cancel", appointmentController.cancel);
}
