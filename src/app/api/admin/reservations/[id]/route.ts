import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reviewReservationSchema } from "@/lib/validations";
import { canTransitionTo, isAdminRole } from "@/lib/reservations";
import {
  sendReservationDecisionEmail,
  buildReservationEmailData,
} from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = (session.user as { role?: UserRole }).role;
  if (!isAdminRole(role)) {
    return NextResponse.json(
      { error: "Permisos insuficientes" },
      { status: 403 }
    );
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
  });
  if (!reservation) {
    return NextResponse.json(
      { error: "Reserva no encontrada" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = reviewReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { status, adminNotes } = parsed.data;

  if (!canTransitionTo(reservation.status, status, role as UserRole)) {
    return NextResponse.json(
      {
        error: `No se permite la transición ${reservation.status} → ${status} para el rol actual`,
      },
      { status: 409 }
    );
  }

  // Si la decisión es APPROVED, comprobamos que no haya conflicto con otra
  // reserva ya aprobada en el mismo espacio para el mismo intervalo.
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
        { status: 409 }
      );
    }
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status,
      adminNotes: adminNotes ?? null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
    include: {
      space: { select: { name: true, code: true } },
      user: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  // Notificación al solicitante de la decisión adoptada.
  try {
    const emailData = buildReservationEmailData(updated);
    await sendReservationDecisionEmail(emailData, status);
  } catch (error) {
    console.error("Error enviando email de decisión de reserva:", error);
  }

  return NextResponse.json(updated);
}
