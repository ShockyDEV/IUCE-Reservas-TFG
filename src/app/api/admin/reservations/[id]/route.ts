import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  reviewReservationSchema,
  adminUpdateReservationSchema,
} from "@/lib/validations";
import { canTransitionTo } from "@/lib/reservations";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import {
  sendReservationDecisionEmail,
  sendReservationAnulledByAdminEmail,
  sendReservationModifiedEmail,
  buildReservationEmailData,
} from "@/lib/email";

/**
 * PATCH /api/admin/reservations/[id]
 *
 * Punto de entrada de los cambios de estado iniciados por un administrador.
 * El handler discrimina por el ESTADO ACTUAL de la reserva en BD:
 *
 *   - reservation.status === PENDING → revisión clásica:
 *       body.status ∈ { APPROVED, REJECTED }
 *       resultado: la reserva pasa al estado solicitado.
 *
 *   - reservation.status === APPROVED → anulación posterior:
 *       body.status === REJECTED
 *       resultado: la reserva pasa a REJECTED. Para el usuario es
 *       indistinguible de un rechazo de la revisión (ve «Rechazada»);
 *       internamente registramos en el audit log la acción específica
 *       `RESERVATION_REJECTED_AFTER_APPROVAL` para preservar la traza
 *       fina del proceso que llevó hasta aquí.
 *
 * Para modificar los datos de una reserva (título, fechas, asistentes)
 * existe el handler PUT más abajo.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const session = await auth();
  const role = (session?.user as { role?: UserRole }).role;

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
  });
  if (!reservation) {
    return NextResponse.json(
      { error: "Reserva no encontrada" },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => null);

  // Anulación posterior: la reserva ya estaba aprobada y el admin la
  // retira. El resultado para el usuario es «Rechazada».
  if (reservation.status === "APPROVED" && body?.status === "REJECTED") {
    return handleAdminAnul({
      body,
      reservation,
      role: role as UserRole,
      actorId: guard.userId,
    });
  }

  // Revisión clásica de una reserva PENDING.
  return handleReview({
    body,
    reservation,
    role: role as UserRole,
    actorId: guard.userId,
  });
}

/**
 * PUT /api/admin/reservations/[id]
 *
 * Modificación administrativa completa de una reserva existente. Sólo se
 * permite sobre reservas PENDING o APPROVED; el resto de estados son
 * terminales y se rechaza con 409. Si el nuevo intervalo solapa con otra
 * reserva APROBADA del mismo espacio, también devolvemos 409.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      space: { select: { name: true, code: true, capacity: true } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!reservation) {
    return NextResponse.json(
      { error: "Reserva no encontrada" },
      { status: 404 },
    );
  }

  if (
    reservation.status !== "PENDING" &&
    reservation.status !== "APPROVED"
  ) {
    return NextResponse.json(
      {
        error:
          "Solo se pueden modificar reservas en estado PENDING o APPROVED",
      },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminUpdateReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { title, description, startTime, endTime, attendees, adminNotes } =
    parsed.data;

  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);

  if (attendees > reservation.space.capacity) {
    return NextResponse.json(
      {
        error: `Máximo ${reservation.space.capacity} asistentes para este espacio`,
      },
      { status: 400 },
    );
  }

  const overlapping = await prisma.reservation.findFirst({
    where: {
      id: { not: reservation.id },
      spaceId: reservation.spaceId,
      status: "APPROVED",
      startTime: { lt: newEnd },
      endTime: { gt: newStart },
    },
  });
  if (overlapping) {
    return NextResponse.json(
      {
        error:
          "El nuevo intervalo solapa con otra reserva aprobada en este mismo espacio",
      },
      { status: 409 },
    );
  }

  const previousSnapshot = {
    title: reservation.title,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    attendees: reservation.attendees,
    description: reservation.description,
  };

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      title,
      description: description ?? null,
      startTime: newStart,
      endTime: newEnd,
      attendees,
      adminNotes: adminNotes ?? reservation.adminNotes,
    },
    include: {
      space: { select: { name: true, code: true } },
      user: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  await logAudit({
    action: "RESERVATION_MODIFIED_BY_ADMIN",
    userId: guard.userId,
    targetType: "reservation",
    targetId: reservation.id,
    details: {
      previous: {
        title: previousSnapshot.title,
        startTime: previousSnapshot.startTime.toISOString(),
        endTime: previousSnapshot.endTime.toISOString(),
        attendees: previousSnapshot.attendees,
      },
      next: {
        title,
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        attendees,
      },
      adminNotes: adminNotes ?? null,
    },
  });

  try {
    const emailData = buildReservationEmailData(updated);
    const previousDateFmt = previousSnapshot.startTime.toLocaleDateString(
      "es-ES",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
    const previousTimeRange = `${previousSnapshot.startTime.toLocaleTimeString(
      "es-ES",
      { hour: "2-digit", minute: "2-digit" },
    )} - ${previousSnapshot.endTime.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    await sendReservationModifiedEmail(emailData, {
      title: previousSnapshot.title,
      date: previousDateFmt,
      timeRange: previousTimeRange,
    });
  } catch (error) {
    console.error("Error enviando email de modificación de reserva:", error);
  }

  return NextResponse.json(updated);
}

// ---------------------------------------------------------------------------
// Handlers internos
// ---------------------------------------------------------------------------

interface ReservationLike {
  id: string;
  title: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXPIRED";
  startTime: Date;
  endTime: Date;
  spaceId: string;
  userId: string;
}

async function handleReview({
  body,
  reservation,
  role,
  actorId,
}: {
  body: unknown;
  reservation: ReservationLike;
  role: UserRole;
  actorId: string;
}) {
  const parsed = reviewReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { status, adminNotes } = parsed.data;

  if (!canTransitionTo(reservation.status, status, role)) {
    return NextResponse.json(
      {
        error: `No se permite la transición ${reservation.status} → ${status} para el rol actual`,
      },
      { status: 409 },
    );
  }

  if (status === "APPROVED") {
    const overlapping = await prisma.reservation.findFirst({
      where: {
        id: { not: reservation.id },
        spaceId: reservation.spaceId,
        status: "APPROVED",
        startTime: { lt: reservation.endTime },
        endTime: { gt: reservation.startTime },
      },
    });
    if (overlapping) {
      return NextResponse.json(
        {
          error:
            "No se puede aprobar: existe otra reserva aprobada que se solapa con esta franja",
        },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status,
      adminNotes: adminNotes ?? null,
      reviewedById: actorId,
      reviewedAt: new Date(),
    },
    include: {
      space: { select: { name: true, code: true } },
      user: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  await logAudit({
    action:
      status === "APPROVED" ? "RESERVATION_APPROVED" : "RESERVATION_REJECTED",
    userId: actorId,
    targetType: "reservation",
    targetId: reservation.id,
    details: {
      title: reservation.title,
      spaceId: reservation.spaceId,
      previousStatus: reservation.status,
      newStatus: status,
      adminNotes: adminNotes ?? null,
    },
  });

  try {
    const emailData = buildReservationEmailData(updated);
    await sendReservationDecisionEmail(emailData, status);
  } catch (error) {
    console.error("Error enviando email de decisión de reserva:", error);
  }

  return NextResponse.json(updated);
}

/**
 * Anulación administrativa de una reserva previamente APPROVED. El estado
 * final en BD es REJECTED para unificar lo que el usuario percibe («te la
 * han denegado») independientemente del momento procesal. El audit log
 * usa una acción específica para mantener la traza fina del proceso.
 */
async function handleAdminAnul({
  body,
  reservation,
  role,
  actorId,
}: {
  body: unknown;
  reservation: ReservationLike;
  role: UserRole;
  actorId: string;
}) {
  const parsed = reviewReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (parsed.data.status !== "REJECTED") {
    return NextResponse.json(
      { error: "Solo se admite REJECTED como nuevo estado en esta ruta" },
      { status: 400 },
    );
  }

  const { adminNotes } = parsed.data;

  if (!canTransitionTo(reservation.status, "REJECTED", role)) {
    return NextResponse.json(
      {
        error: `No se permite la transición ${reservation.status} → REJECTED para el rol actual`,
      },
      { status: 409 },
    );
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status: "REJECTED",
      adminNotes: adminNotes ?? null,
      reviewedById: actorId,
      reviewedAt: new Date(),
    },
    include: {
      space: { select: { name: true, code: true } },
      user: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  await logAudit({
    action: "RESERVATION_REJECTED_AFTER_APPROVAL",
    userId: actorId,
    targetType: "reservation",
    targetId: reservation.id,
    details: {
      title: reservation.title,
      spaceId: reservation.spaceId,
      previousStatus: reservation.status,
      reason: adminNotes ?? null,
    },
  });

  try {
    const emailData = buildReservationEmailData(updated);
    await sendReservationAnulledByAdminEmail(emailData);
  } catch (error) {
    console.error(
      "Error enviando email de anulación de reserva por admin:",
      error,
    );
  }

  return NextResponse.json(updated);
}
