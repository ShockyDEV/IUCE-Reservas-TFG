import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { reservationsToCsv, buildCsvFilename } from "@/lib/export-utils";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const reservations = await prisma.reservation.findMany({
    include: {
      space: { select: { name: true, code: true } },
      user: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: { startTime: "desc" },
  });

  const csv = reservationsToCsv(reservations);

  await logAudit({
    action: "EXPORT_CSV",
    userId: guard.userId,
    targetType: "reservation",
    targetId: "bulk",
    details: { entity: "reservations", count: reservations.length },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildCsvFilename("reservations")}"`,
    },
  });
}
