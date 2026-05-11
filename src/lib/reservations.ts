import type { ReservationStatus, UserRole } from "@prisma/client";

/**
 * Comprueba si una reserva puede transicionar de un estado a otro
 * en función del rol del usuario que solicita el cambio.
 *
 * Reglas (Sprint 4):
 *   - PENDING → APPROVED  : solo ADMIN o SUPER_ADMIN
 *   - PENDING → REJECTED  : solo ADMIN o SUPER_ADMIN
 *   - Estados terminales (APPROVED, REJECTED): no admiten más transiciones
 */
export function canTransitionTo(
  current: ReservationStatus,
  next: ReservationStatus,
  role: UserRole
): boolean {
  // Estados terminales: no se puede salir de ellos en este sprint.
  if (current === "APPROVED" || current === "REJECTED") {
    return false;
  }

  // Desde PENDING solo se permiten APPROVED o REJECTED, y solo a admins.
  if (current === "PENDING") {
    if (next !== "APPROVED" && next !== "REJECTED") return false;
    return role === "ADMIN" || role === "SUPER_ADMIN";
  }

  return false;
}

export function isAdminRole(role: UserRole | string | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
