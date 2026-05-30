import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  sendReservationCancelledEmail,
  buildReservationEmailData,
} from "@/lib/email";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      space: true,
      user: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (reservation.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(reservation);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
  });
  if (!reservation) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  // Cancelación por el propietario (o admin)
  if (body.status === "CANCELLED" || body.action === "cancel") {
    if (reservation.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (reservation.status !== "PENDING" && reservation.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Solo se pueden cancelar reservas pendientes o aprobadas" },
        { status: 400 }
      );
    }

    const updated = await prisma.reservation.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
      include: {
        space: { select: { name: true, code: true } },
        user: { select: { name: true, email: true } },
      },
    });

    try {
      const emailData = buildReservationEmailData(updated);
      await sendReservationCancelledEmail(emailData);
    } catch (error) {
      console.error("Error enviando email de cancelación:", error);
    }

    await logAudit({
      action: "RESERVATION_CANCELLED",
      userId: session.user.id,
      targetType: "reservation",
      targetId: params.id,
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
