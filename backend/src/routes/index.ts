import { FastifyInstance } from "fastify";
import { authRoutes } from "./auth.routes";
import { doctorRoutes } from "./doctor.routes";
import { appointmentRoutes } from "./appointment.routes";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ status: "ok" }));

  app.register(authRoutes, { prefix: "/auth" });
  app.register(doctorRoutes, { prefix: "/doctors" });
  app.register(appointmentRoutes, { prefix: "/appointments" });
}
