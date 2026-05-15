import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createBlockedSlotSchema } from "@/lib/validations";
import { isAdminRole } from "@/lib/reservations";

/**
 * GET /api/admin/blocked-slots
 *
 * Devuelve los bloqueos administrativos cuya fecha de fin es posterior al
 * momento actual. Opcionalmente se filtra por `spaceId`.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId");

  const slots = await prisma.blockedSlot.findMany({
    where: {
      ...(spaceId ? { spaceId } : {}),
      endTime: { gte: new Date() },
    },
    include: {
      space: { select: { name: true, code: true, color: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(slots);
}

/**
 * POST /api/admin/blocked-slots
 *
 * Crea un nuevo bloqueo administrativo. Requiere rol ADMIN o SUPER_ADMIN.
 * Si existen reservas APPROVED que solapen con la franja bloqueada, se
 * devuelve un aviso (warnings) pero el bloqueo se crea igualmente; será
 * responsabilidad de la administración decidir qué hacer con esas
 * reservas previas.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!isAdminRole(role)) {
    return NextResponse.json(
      { error: "Solo el personal administrativo puede crear bloqueos" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createBlockedSlotSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { spaceId, startTime, endTime, reason } = parsed.data;

  const space = await prisma.space.findUnique({ where: { id: spaceId } });
  if (!space) {
    return NextResponse.json(
      { error: "Espacio no encontrado" },
      { status: 404 }
    );
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  const overlapping = await prisma.reservation.findMany({
    where: {
      spaceId,
      status: "APPROVED",
      startTime: { lt: end },
      endTime: { gt: start },
    },
    select: { id: true, title: true, startTime: true, endTime: true },
  });

  const slot = await prisma.blockedSlot.create({
    data: {
      spaceId,
      startTime: start,
      endTime: end,
      reason,
      createdById: session.user.id,
    },
    include: {
      space: { select: { name: true, code: true } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(
    {
      ...slot,
      warnings:
        overlapping.length > 0
          ? `Hay ${overlapping.length} reserva(s) aprobada(s) que se solapan con este bloqueo.`
          : undefined,
    },
    { status: 201 }
  );
}

/**
 * DELETE /api/admin/blocked-slots?id=...
 *
 * Elimina el bloqueo indicado. Requiere rol ADMIN o SUPER_ADMIN.
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!isAdminRole(role)) {
    return NextResponse.json(
      { error: "Solo el personal administrativo puede eliminar bloqueos" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "El parámetro id es obligatorio" },
      { status: 400 }
    );
  }

  const slot = await prisma.blockedSlot.findUnique({ where: { id } });
  if (!slot) {
    return NextResponse.json(
      { error: "Bloqueo no encontrado" },
      { status: 404 }
    );
  }

  await prisma.blockedSlot.delete({ where: { id } });
  return NextResponse.json({ message: "Bloqueo eliminado" });
}
