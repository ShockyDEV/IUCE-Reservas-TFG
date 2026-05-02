import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createReservationSchema } from "@/lib/validations";
import { ReservationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const spaceId = searchParams.get("spaceId");

  const reservations = await prisma.reservation.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status: status as ReservationStatus } : {}),
      ...(spaceId ? { spaceId } : {}),
    },
    include: {
      space: { select: { id: true, name: true, code: true, color: true } },
    },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createReservationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { title, description, spaceId, startTime, endTime, attendees } =
    parsed.data;

  const space = await prisma.space.findUnique({ where: { id: spaceId } });
  if (!space || !space.isActive) {
    return NextResponse.json(
      { error: "Espacio no encontrado o inactivo" },
      { status: 404 }
    );
  }

  if (attendees > space.capacity) {
    return NextResponse.json(
      {
        error: `El espacio tiene una capacidad máxima de ${space.capacity} personas`,
      },
      { status: 400 }
    );
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  const overlapping = await prisma.reservation.findFirst({
    where: {
      spaceId,
      status: { in: ["APPROVED", "PENDING"] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  if (overlapping) {
    return NextResponse.json(
      { error: "Ya existe una reserva en ese horario para este espacio" },
      { status: 409 }
    );
  }

  const reservation = await prisma.reservation.create({
    data: {
      title,
      description,
      startTime: start,
      endTime: end,
      attendees,
      userId: session.user.id,
      spaceId,
    },
    include: {
      space: { select: { name: true, code: true } },
    },
  });

  return NextResponse.json(reservation, { status: 201 });
}
