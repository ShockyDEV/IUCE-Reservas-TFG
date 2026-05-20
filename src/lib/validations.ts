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

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"], {
    errorMap: () => ({
      message: "El rol debe ser USER, ADMIN o SUPER_ADMIN",
    }),
  }),
});

export const createSpaceSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(40, "El código no puede superar los 40 caracteres")
    .regex(/^[A-Z0-9-]+$/i, "Solo letras, números y guiones"),
  description: z
    .string()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional(),
  capacity: z
    .number()
    .int()
    .min(1, "La capacidad debe ser al menos 1")
    .max(1000, "La capacidad no puede superar 1000"),
  floor: z.number().int().optional(),
  building: z.string().max(120).optional(),
  equipment: z.array(z.string().min(1).max(80)).max(40).optional(),
  accessibility: z.boolean().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "El color debe ser un código hexadecimal")
    .optional(),
  imageUrl: z.string().max(300).optional(),
});

export const updateSpaceSchema = createSpaceSchema.partial();

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReviewReservationInput = z.infer<typeof reviewReservationSchema>;
export type CreateBlockedSlotInput = z.infer<typeof createBlockedSlotSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
