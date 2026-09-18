import { FastifyInstance } from "fastify";
import * as doctorController from "../controllers/doctor.controller";
import { authenticate, requireRole } from "../middleware/auth";

export async function doctorRoutes(app: FastifyInstance) {
  // Public: patients (and anyone) can browse doctors, their availability, and open slots.
  app.get("/", doctorController.list);
  app.get<{ Params: { id: string } }>("/:id", doctorController.getOne);
  app.get<{ Params: { id: string } }>("/:id/availability", doctorController.listAvailability);
  app.get<{ Params: { id: string }; Querystring: { date: string } }>(
    "/:id/slots",
    doctorController.getSlots
  );
  app.get<{ Params: { id: string } }>("/:id/breaks", doctorController.listBreaks);

  // Admin-only: doctor management.
  app.post("/", { preHandler: [authenticate, requireRole("ADMIN")] }, doctorController.create);
  app.put<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticate, requireRole("ADMIN")] },
    doctorController.update
  );
  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticate, requireRole("ADMIN")] },
    doctorController.remove
  );
  app.post<{ Params: { id: string } }>(
    "/:id/availability",
    { preHandler: [authenticate, requireRole("ADMIN")] },
    doctorController.addAvailability
  );
  app.delete<{ Params: { id: string; availabilityId: string } }>(
    "/:id/availability/:availabilityId",
    { preHandler: [authenticate, requireRole("ADMIN")] },
    doctorController.deleteAvailability
  );
  app.post<{ Params: { id: string } }>(
    "/:id/breaks",
    { preHandler: [authenticate, requireRole("ADMIN")] },
    doctorController.createBreak
  );
  app.delete<{ Params: { id: string; breakId: string } }>(
    "/:id/breaks/:breakId",
    { preHandler: [authenticate, requireRole("ADMIN")] },
    doctorController.deleteBreak
  );
}
