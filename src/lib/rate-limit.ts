/**
 * Rate limiter en memoria simple para proteger endpoints contra el spam
 * accidental por parte de usuarios autenticados.
 *
 * No es un sustituto de un WAF: si el sistema se despliega detrás de
 * Apache + ModSecurity, las protecciones más sólidas vienen de la capa
 * de infraestructura. Este módulo cubre el caso de un usuario o script
 * autenticado que dispara cientos de peticiones en pocos segundos.
 *
 * El estado se mantiene por proceso. En despliegues con varios procesos
 * Node (PM2 cluster, Vercel multi-region) este limitador se relaja al
 * factor de procesos, lo cual sigue siendo útil sin ser perfecto.
 */

interface Window {
  start: number;
  count: number;
}

interface LimiterOptions {
  /** Identificador único del limitador (por endpoint). */
  scope: string;
  /** Duración de la ventana en milisegundos. */
  windowMs: number;
  /** Número máximo de peticiones permitidas dentro de la ventana. */
  max: number;
}

const stores: Map<string, Map<string, Window>> = new Map();

function storeFor(scope: string): Map<string, Window> {
  let s = stores.get(scope);
  if (!s) {
    s = new Map();
    stores.set(scope, s);
  }
  return s;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Comprueba si una `key` (típicamente el id de usuario o su IP) puede
 * continuar dentro de la cuota del scope dado. La función ES síncrona y
 * ya cuenta la petición actual.
 */
export function checkRateLimit(
  key: string,
  options: LimiterOptions,
): RateLimitResult {
  const now = Date.now();
  const store = storeFor(options.scope);
  const current = store.get(key);

  if (!current || now - current.start > options.windowMs) {
    store.set(key, { start: now, count: 1 });
    return {
      allowed: true,
      remaining: options.max - 1,
      resetAt: now + options.windowMs,
    };
  }

  if (current.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.start + options.windowMs,
    };
  }

  current.count++;
  return {
    allowed: true,
    remaining: options.max - current.count,
    resetAt: current.start + options.windowMs,
  };
}

/** Limpia el estado del limitador (uso exclusivo en tests). */
export function resetRateLimitStore(): void {
  stores.clear();
}

export const RESERVATION_RATE_LIMIT: LimiterOptions = {
  scope: "reservations:create",
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
};
