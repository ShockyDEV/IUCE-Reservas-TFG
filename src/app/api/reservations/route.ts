import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createReservationSchema } from "@/lib/validations";
import { ReservationStatus } from "@prisma/client";
import {
  generateRecurrenceDates,
  MAX_RECURRENCE_OCCURRENCES,
  RecurrencePattern,
} from "@/lib/recurrence";
import {
  sendReservationCreatedEmail,
  sendNewRequestToAdminEmail,
  buildReservationEmailData,
} from "@/lib/email";

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

  const {
    title,
    description,
    spaceId,
    startTime,
    endTime,
    attendees,
    isRecurring,
    recurrenceRule,
    recurrenceEndDate,
  } = parsed.data;

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

  const baseStart = new Date(startTime);
  const baseEnd = new Date(endTime);
  const durationMs = baseEnd.getTime() - baseStart.getTime();

  // ============================================
  // Reservas recurrentes
  // ============================================
  if (isRecurring && recurrenceRule && recurrenceEndDate) {
    const recEndDate = new Date(recurrenceEndDate);
    recEndDate.setHours(23, 59, 59, 999);

    const dates = generateRecurrenceDates(
      baseStart,
      recurrenceRule as RecurrencePattern,
      recEndDate
    );

    if (dates.length > MAX_RECURRENCE_OCCURRENCES) {
      return NextResponse.json(
        {
          error: `La recurrencia genera más de ${MAX_RECURRENCE_OCCURRENCES} ocurrencias. Acorta el rango.`,
        },
        { status: 400 }
      );
    }

    const recurrenceGroupId = randomUUID();
    const skipped: { start: string; reason: string }[] = [];
    const createdIds: string[] = [];

    for (const instanceStart of dates) {
      const instanceEnd = new Date(instanceStart.getTime() + durationMs);

      const overlapping = await prisma.reservation.findFirst({
        where: {
          spaceId,
          status: { in: ["APPROVED", "PENDING"] },
          startTime: { lt: instanceEnd },
          endTime: { gt: instanceStart },
        },
      });

      if (overlapping) {
        skipped.push({
          start: instanceStart.toISOString(),
          reason: "Conflicto con otra reserva existente",
        });
        continue;
      }

      const created = await prisma.reservation.create({
        data: {
          title,
          description,
          startTime: instanceStart,
          endTime: instanceEnd,
          attendees,
          userId: session.user.id,
          spaceId,
          isRecurring: true,
          recurrenceRule,
          recurrenceGroupId,
        },
      });
      createdIds.push(created.id);
    }

    return NextResponse.json(
      {
        recurrenceGroupId,
        created: createdIds.length,
        total: dates.length,
        skipped,
      },
      { status: 201 }
    );
  }

  // ============================================
  // Reserva individual
  // ============================================
  const overlapping = await prisma.reservation.findFirst({
    where: {
      spaceId,
      status: { in: ["APPROVED", "PENDING"] },
      startTime: { lt: baseEnd },
      endTime: { gt: baseStart },
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
      startTime: baseStart,
      endTime: baseEnd,
      attendees,
      userId: session.user.id,
      spaceId,
    },
    include: {
      space: { select: { name: true, code: true } },
      user: { select: { name: true, email: true } },
    },
  });

  // Notificaciones por correo: confirmación al usuario y aviso al admin.
  // Si el envío falla la reserva ya está creada y se loguea el error, sin abortar.
  try {
    const emailData = buildReservationEmailData(reservation);
    await sendReservationCreatedEmail(emailData);

    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { email: true },
    });
    if (admins.length > 0) {
      await sendNewRequestToAdminEmail(
        emailData,
        admins.map((a) => a.email)
      );
    }
  } catch (error) {
    console.error("Error enviando emails de la nueva reserva:", error);
  }

  return NextResponse.json(reservation, { status: 201 });
}
