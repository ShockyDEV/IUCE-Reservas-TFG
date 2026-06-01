import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

/**
 * GET /api/health
 *
 * Endpoint público de monitorización utilizado por el CPD-USAL para
 * comprobar la salud del servicio. Responde:
 *
 *   200 OK    cuando la aplicación está arriba Y la base de datos
 *             responde a una consulta trivial.
 *   503       cuando la aplicación está arriba pero la base de datos
 *             no responde. El monitor de Apache puede reaccionar a esta
 *             señal sin tirar todo el contenedor.
 *
 * El payload incluye la versión, el timestamp del servidor y la latencia
 * de la comprobación a la base de datos, para facilitar la diagnosis
 * desde herramientas tipo Uptime Kuma o Grafana.
 */
export async function GET() {
  const startedAt = Date.now();
  let dbOk = true;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
  } catch (error) {
    dbOk = false;
    dbError = error instanceof Error ? error.message : "unknown";
  }

  const payload = {
    status: dbOk ? "ok" : "degraded",
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    db: {
      ok: dbOk,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    durationMs: Date.now() - startedAt,
  };

  return NextResponse.json(payload, {
    status: dbOk ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
