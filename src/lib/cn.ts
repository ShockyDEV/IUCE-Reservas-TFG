import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind resolviendo colisiones.
 *
 * Por ejemplo, `cn("px-4 py-2", "py-3")` devuelve `"px-4 py-3"`. El uso
 * habitual es componer la clase final de un componente fusionando una
 * lista de variantes con la `className` opcional recibida por props.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
