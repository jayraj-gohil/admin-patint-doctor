import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerRoutes } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });
  app.setErrorHandler(errorHandler);
  app.register(registerRoutes, { prefix: "/api/v1" });

  return app;
}
