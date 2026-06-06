import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/spaces/[id]/occupancy?from=ISO&to=ISO
 *
 * Devuelve todos los intervalos ocupados de un espacio dentro de la
 * ventana `[from, to)`. Se utiliza para pintar el calendario mensual de
 * disponibilidad tanto en la página de detalle del espacio como en el
 * formulario de reservar.
 *
 * Tipos de intervalo retornados:
 *   - RESERVATION_APPROVED → reserva ya confirmada
 *   - RESERVATION_PENDING  → solicitud pendiente de revisión
 *   - BLOCKED              → bloqueo administrativo (BlockedSlot)
 *
 * Las reservas REJECTED, CANCELLED y EXPIRED se ignoran porque ya no
 * compiten por la franja.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: "Faltan los parámetros 'from' y 'to'" },
      { status: 400 },
    );
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json(
      { error: "Fechas no válidas" },
      { status: 400 },
    );
  }
  if (from >= to) {
    return NextResponse.json(
      { error: "'to' debe ser posterior a 'from'" },
      { status: 400 },
    );
  }

  const space = await prisma.space.findUnique({
    where: { id: params.id },
    select: { id: true, isActive: true },
  });
  if (!space?.isActive) {
    return NextResponse.json(
      { error: "Espacio no encontrado" },
      { status: 404 },
    );
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      spaceId: params.id,
      status: { in: ["APPROVED", "PENDING"] },
      startTime: { lt: to },
      endTime: { gt: from },
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      status: true,
    },
    orderBy: { startTime: "asc" },
  });

  const blocks = await prisma.blockedSlot.findMany({
    where: {
      spaceId: params.id,
      startTime: { lt: to },
      endTime: { gt: from },
    },
    select: {
      id: true,
      reason: true,
      startTime: true,
      endTime: true,
    },
    orderBy: { startTime: "asc" },
  });

  const intervals = [
    ...reservations.map((r) => ({
      id: r.id,
      startTime: r.startTime.toISOString(),
      endTime: r.endTime.toISOString(),
      kind:
        r.status === "APPROVED"
          ? ("RESERVATION_APPROVED" as const)
          : ("RESERVATION_PENDING" as const),
      label: r.title,
    })),
    ...blocks.map((b) => ({
      id: b.id,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      kind: "BLOCKED" as const,
      label: b.reason,
    })),
  ];

  // Por orden cronológico para que el cliente pueda renderizar el detalle
  // del día sin tener que reordenar.
  intervals.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return NextResponse.json({
    spaceId: params.id,
    from: from.toISOString(),
    to: to.toISOString(),
    intervals,
  });
}
