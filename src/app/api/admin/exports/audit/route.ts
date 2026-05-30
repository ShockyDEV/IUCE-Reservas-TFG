import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { auditLogToCsv, buildCsvFilename } from "@/lib/export-utils";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const entries = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const csv = auditLogToCsv(entries);

  await logAudit({
    action: "EXPORT_CSV",
    userId: guard.userId,
    targetType: "user",
    targetId: "bulk",
    details: { entity: "audit", count: entries.length },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildCsvFilename("audit")}"`,
    },
  });
}
