import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { reservationsToCsv } from "@/lib/export-utils";

/**
 * GET /api/admin/exports/reservations-calendar?month=YYYY-MM
 *
 * Devuelve un CSV con todas las reservas APROBADAS y PENDIENTES cuyo inicio
 * cae dentro del mes solicitado. Pensado para que un administrador o
 * superadministrador descargue la agenda mensual del IUCE en formato
 * abierto (Excel/LibreOffice) y la pueda imprimir o compartir.
 *
 * Reservas RECHAZADAS, CANCELADAS y EXPIRADAS no se incluyen porque no
 * forman parte de la planificación efectiva del mes.
 *
 * Restringido a roles ADMIN y SUPER_ADMIN.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const monthStr = searchParams.get("month");

  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    return NextResponse.json(
      {
        error:
          "Parámetro 'month' obligatorio en formato YYYY-MM (por ejemplo, 2026-06).",
      },
      { status: 400 },
    );
  }

  const [year, month] = monthStr.split("-").map(Number);
  if (month < 1 || month > 12) {
    return NextResponse.json(
      { error: "El mes debe estar entre 01 y 12." },
      { status: 400 },
    );
  }

  // [monthStart, monthEnd) — intervalo semiabierto del mes solicitado.
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const reservations = await prisma.reservation.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      startTime: { gte: monthStart, lt: monthEnd },
    },
    include: {
      space: { select: { name: true, code: true } },
      user: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const csv = reservationsToCsv(reservations);

  await logAudit({
    action: "EXPORT_CSV",
    userId: guard.userId,
    targetType: "user",
    targetId: "bulk",
    details: {
      entity: "reservations-calendar",
      month: monthStr,
      count: reservations.length,
    },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="iuce-calendario-${monthStr}.csv"`,
    },
  });
}
