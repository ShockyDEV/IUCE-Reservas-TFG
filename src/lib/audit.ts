import { prisma } from "@/lib/prisma";

/**
 * Catálogo de acciones administrativas que el sistema registra en el audit
 * log. Mantener este tipo cerrado evita que se persistan acciones con
 * nombres inconsistentes y facilita la generación de informes y filtros.
 */
export type AuditAction =
  | "RESERVATION_APPROVED"
  | "RESERVATION_REJECTED"
  | "RESERVATION_CANCELLED"
  | "BLOCKED_SLOT_CREATED"
  | "BLOCKED_SLOT_DELETED"
  | "USER_ROLE_CHANGED"
  | "USER_BANNED"
  | "USER_UNBANNED"
  | "USER_NAME_CHANGED"
  | "SPACE_CREATED"
  | "SPACE_UPDATED"
  | "SPACE_DEACTIVATED"
  | "SETTING_UPDATED";

export type AuditTargetType =
  | "reservation"
  | "blocked_slot"
  | "user"
  | "space"
  | "setting";

interface AuditEntry {
  action: AuditAction;
  userId: string;
  targetType: AuditTargetType;
  targetId: string;
  details?: Record<string, unknown>;
}

/**
 * Registra una acción administrativa en la tabla `AuditLog`.
 *
 * Este helper está diseñado para que la operación de auditoría no pueda
 * romper nunca el flujo principal del endpoint que la invoca: cualquier
 * error de escritura se captura, se loguea por consola y se descarta. El
 * coste de perder una entrada de audit es asumible frente a abortar la
 * operación de negocio que la generó.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        userId: entry.userId,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details ? JSON.stringify(entry.details) : null,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
