import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/spaces/availability?startTime=ISO&endTime=ISO
 *
 * Devuelve la lista de identificadores de espacios que están OCUPADOS en
 * la franja consultada. Un espacio se considera ocupado si tiene al menos
 * una reserva en estado APROBADA o PENDIENTE que se solape con la franja,
 * o un BlockedSlot administrativo que se solape con ella.
 *
 *   - APPROVED → claramente ocupado (decisión final).
 *   - PENDING  → potencialmente ocupado (a la espera de revisión); se
 *     incluye para que el filtro del catálogo refleje la disponibilidad
 *     real con la que el solicitante se va a encontrar.
 *   - BlockedSlot → bloqueo manual del administrador.
 *
 * Las reservas REJECTED, CANCELLED y EXPIRED se ignoran: ya no compiten
 * por la franja.
 *
 * El cliente filtra el catálogo localmente eliminando de la lista los
 * espacios cuyo ID aparezca en la respuesta.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startStr = searchParams.get("startTime");
  const endStr = searchParams.get("endTime");

  if (!startStr || !endStr) {
    return NextResponse.json(
      { error: "Faltan los parámetros 'startTime' y 'endTime'" },
      { status: 400 },
    );
  }

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json(
      { error: "Fechas no válidas" },
      { status: 400 },
    );
  }
  if (start >= end) {
    return NextResponse.json(
      { error: "La hora de fin debe ser posterior a la de inicio" },
      { status: 400 },
    );
  }

  // Reservas en estados que reservan la franja.
  const busyByReservation = await prisma.reservation.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
    select: { spaceId: true },
    distinct: ["spaceId"],
  });

  // Bloqueos administrativos en la misma franja.
  const busyByBlock = await prisma.blockedSlot.findMany({
    where: {
      startTime: { lt: end },
      endTime: { gt: start },
    },
    select: { spaceId: true },
    distinct: ["spaceId"],
  });

  const busySpaceIds = Array.from(
    new Set([
      ...busyByReservation.map((r) => r.spaceId),
      ...busyByBlock.map((b) => b.spaceId),
    ]),
  );

  return NextResponse.json({
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    busySpaceIds,
  });
}
