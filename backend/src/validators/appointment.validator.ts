import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createAppointmentSchema = z.object({
  doctorId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
  time: z.string().regex(timeRegex, "time must be in HH:mm format"),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
