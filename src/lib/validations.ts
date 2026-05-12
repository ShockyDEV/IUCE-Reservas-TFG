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
    isRecurring: z.boolean().optional().default(false),
    recurrenceRule: z.string().optional(),
    recurrenceEndDate: z.string().optional(),
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
  )
  .refine(
    (data) => {
      if (data.isRecurring) {
        return (
          data.recurrenceRule !== undefined &&
          ["WEEKLY", "BIWEEKLY", "MONTHLY"].includes(data.recurrenceRule)
        );
      }
      return true;
    },
    {
      message: "Selecciona un patrón de recurrencia válido (WEEKLY, BIWEEKLY o MONTHLY)",
      path: ["recurrenceRule"],
    }
  )
  .refine(
    (data) => {
      if (data.isRecurring) {
        return (
          data.recurrenceEndDate !== undefined &&
          !isNaN(Date.parse(data.recurrenceEndDate))
        );
      }
      return true;
    },
    {
      message: "Selecciona una fecha de fin de recurrencia válida",
      path: ["recurrenceEndDate"],
    }
  );

export const reviewReservationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    errorMap: () => ({
      message: "El estado debe ser APPROVED o REJECTED",
    }),
  }),
  adminNotes: z
    .string()
    .max(500, "Las notas no pueden superar los 500 caracteres")
    .optional(),
});

export const createBlockedSlotSchema = z
  .object({
    spaceId: z.string().min(1, "Debes seleccionar un espacio"),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Fecha de inicio no válida",
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Fecha de fin no válida",
    }),
    reason: z
      .string()
      .min(3, "El motivo debe tener al menos 3 caracteres")
      .max(300, "El motivo no puede superar los 300 caracteres"),
  })
  .refine(
    (data) => new Date(data.startTime) < new Date(data.endTime),
    {
      message: "La hora de fin debe ser posterior a la hora de inicio",
      path: ["endTime"],
    }
  );

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReviewReservationInput = z.infer<typeof reviewReservationSchema>;
export type CreateBlockedSlotInput = z.infer<typeof createBlockedSlotSchema>;
