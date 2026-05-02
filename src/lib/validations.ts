import { z } from "zod";

export const createReservationSchema = z
  .object({
    title: z
      .string()
      .min(3, "El título debe tener al menos 3 caracteres")
      .max(120, "El título no puede superar 120 caracteres"),
    description: z
      .string()
      .max(500, "La descripción no puede superar 500 caracteres")
      .optional(),
    spaceId: z.string().min(1, "Debes seleccionar un espacio"),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Fecha de inicio no válida",
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Fecha de fin no válida",
    }),
    attendees: z
      .number()
      .int()
      .min(1, "Debe haber al menos 1 asistente")
      .max(500, "Máximo 500 asistentes"),
  })
  .refine(
    (data) => new Date(data.startTime) < new Date(data.endTime),
    {
      message: "La hora de fin debe ser posterior a la hora de inicio",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => new Date(data.startTime) > new Date(),
    {
      message: "No puedes reservar en una fecha pasada",
      path: ["startTime"],
    }
  );

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
