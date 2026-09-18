import { z } from "zod";

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  specialization: z.string().trim().min(2, "Specialization must be at least 2 characters"),
});

export const updateDoctorSchema = createDoctorSchema.partial();

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const upsertAvailabilitySchema = z
  .object({
    dayOfWeek: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    startTime: z.string().regex(timeRegex, "startTime must be in HH:mm format"),
    endTime: z.string().regex(timeRegex, "endTime must be in HH:mm format"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
});

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createBreakSchema = z
  .object({
    date: z.string().regex(dateRegex, "date must be in YYYY-MM-DD format"),
    startTime: z.string().regex(timeRegex, "startTime must be in HH:mm format"),
    endTime: z.string().regex(timeRegex, "endTime must be in HH:mm format"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type UpsertAvailabilityInput = z.infer<typeof upsertAvailabilitySchema>;
export type CreateBreakInput = z.infer<typeof createBreakSchema>;
