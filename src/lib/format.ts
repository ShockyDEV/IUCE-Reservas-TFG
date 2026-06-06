/**
 * Helpers de formateo compartidos entre los componentes cliente y los
 * generadores de CSV. Se centralizan en un único módulo para eliminar
 * duplicaciones detectadas durante el análisis estático con SonarCloud
 * y facilitar la coherencia visual en el sistema.
 */

export const RESERVATION_STATUS_BADGE = {
  PENDING: { label: "Pendiente", variant: "warning" as const },
  APPROVED: { label: "Aprobada", variant: "success" as const },
  REJECTED: { label: "Rechazada", variant: "danger" as const },
  CANCELLED: { label: "Cancelada", variant: "secondary" as const },
  EXPIRED: { label: "Expirada", variant: "secondary" as const },
};

export type ReservationStatusKey = keyof typeof RESERVATION_STATUS_BADGE;

export const ROLE_LABEL: Record<string, string> = {
  USER: "Usuario",
  ADMIN: "Administrador",
  SUPER_ADMIN: "Super Administrador",
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  RESERVATION_APPROVED: "Reserva aprobada",
  RESERVATION_REJECTED: "Reserva rechazada (revisión)",
  RESERVATION_REJECTED_AFTER_APPROVAL: "Reserva anulada por administración",
  RESERVATION_CANCELLED: "Reserva cancelada por el usuario",
  RESERVATION_MODIFIED_BY_ADMIN: "Reserva modificada por administración",
  BLOCKED_SLOT_CREATED: "Bloqueo creado",
  BLOCKED_SLOT_DELETED: "Bloqueo eliminado",
  USER_ROLE_CHANGED: "Cambio de rol",
  USER_BANNED: "Usuario suspendido",
  USER_UNBANNED: "Usuario reactivado",
  USER_NAME_CHANGED: "Nombre actualizado",
  SPACE_CREATED: "Espacio creado",
  SPACE_UPDATED: "Espacio actualizado",
  SPACE_DEACTIVATED: "Espacio desactivado",
  SETTING_UPDATED: "Configuración actualizada",
  EXPORT_CSV: "Exportación CSV",
};

/**
 * Lee la lista de equipamiento del campo `equipment` (Json/Text) de la
 * tabla Space. Acepta tanto un array nativo como un string JSON.
 * Devuelve un array vacío si el contenido no es interpretable.
 */
export function parseEquipment(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === "string",
        );
      }
    } catch {
      // ignored: fall through to empty array
    }
  }
  return [];
}

/** Etiqueta legible para una acción del audit log, con fallback al code. */
export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action;
}

/** Etiqueta legible para un rol, con fallback al code. */
export function getRoleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}
