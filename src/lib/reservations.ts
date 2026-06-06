import type { ReservationStatus, UserRole } from "@prisma/client";

/**
 * Comprueba si una reserva puede transicionar de un estado a otro
 * en función del rol del usuario que solicita el cambio.
 *
 * Reglas:
 *   - PENDING  → APPROVED  : solo ADMIN o SUPER_ADMIN (revisión)
 *   - PENDING  → REJECTED  : solo ADMIN o SUPER_ADMIN (revisión)
 *   - PENDING  → CANCELLED : propietario (la propiedad se valida en la ruta)
 *   - APPROVED → REJECTED  : solo ADMIN o SUPER_ADMIN (anulación posterior;
 *     el resultado para el usuario es el mismo «no se le concede»)
 *   - APPROVED → CANCELLED : propietario (cancelación de su reserva ya aprobada)
 *   - REJECTED, CANCELLED, EXPIRED son estados terminales
 *
 * Nota: la propiedad (ownership) de la reserva se valida fuera de este
 * helper porque no recibe el ID del usuario actor; aquí solo se comprueba
 * el rol y la legalidad de la transición de estados.
 */
export function canTransitionTo(
  current: ReservationStatus,
  next: ReservationStatus,
  role: UserRole,
): boolean {
  // CANCELLED, REJECTED y EXPIRED son terminales.
  if (
    current === "CANCELLED" ||
    current === "REJECTED" ||
    current === "EXPIRED"
  ) {
    return false;
  }

  if (current === "APPROVED") {
    // El admin puede anular una reserva ya aprobada (acaba en REJECTED).
    if (next === "REJECTED") {
      return role === "ADMIN" || role === "SUPER_ADMIN";
    }
    // El propietario puede cancelar su reserva (la ruta valida quién es).
    if (next === "CANCELLED") return true;
    return false;
  }

  if (current === "PENDING") {
    if (next === "APPROVED" || next === "REJECTED") {
      return role === "ADMIN" || role === "SUPER_ADMIN";
    }
    if (next === "CANCELLED") return true;
    return false;
  }

  return false;
}

export function isAdminRole(role: UserRole | string | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
