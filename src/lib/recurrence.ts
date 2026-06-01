/**
 * Patrones de recurrencia soportados por el motor de reservas.
 *
 * - `WEEKLY`   — se repite cada semana en el mismo día y hora.
 * - `BIWEEKLY` — se repite cada dos semanas.
 * - `MONTHLY`  — se repite cada mes en el mismo día y hora.
 */
export type RecurrencePattern = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

/**
 * Número máximo de ocurrencias que el motor expandirá para una sola
 * solicitud recurrente, como salvaguarda frente a recurrencias accidentales
 * con fecha de fin muy lejana. Equivale aproximadamente a un curso académico
 * completo en cadencia semanal.
 */
export const MAX_RECURRENCE_OCCURRENCES = 52;

/**
 * Expande una recurrencia en la lista completa de fechas de inicio que
 * caen dentro del rango `[baseDate, endDate]`.
 *
 * La primera ocurrencia coincide siempre con `baseDate`. A partir de ahí,
 * se añade una nueva fecha por iteración aplicando el incremento propio del
 * patrón. La función se detiene cuando la siguiente fecha supera `endDate`
 * o cuando se alcanza el límite de seguridad `MAX_RECURRENCE_OCCURRENCES`.
 *
 * Si el patrón recibido no es uno de los soportados, devuelve únicamente la
 * fecha base, sin lanzar excepción.
 */
export function generateRecurrenceDates(
  baseDate: Date,
  pattern: string,
  endDate: Date,
): Date[] {
  const dates: Date[] = [new Date(baseDate)];
  let current = new Date(baseDate);

  for (let i = 0; i < MAX_RECURRENCE_OCCURRENCES; i++) {
    const next = new Date(current);

    switch (pattern) {
      case "WEEKLY":
        next.setDate(next.getDate() + 7);
        break;
      case "BIWEEKLY":
        next.setDate(next.getDate() + 14);
        break;
      case "MONTHLY":
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        return dates;
    }

    if (next > endDate) break;
    dates.push(new Date(next));
    current = next;
  }

  return dates;
}
