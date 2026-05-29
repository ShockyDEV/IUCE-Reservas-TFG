import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { usersToCsv, buildCsvFilename } from "@/lib/export-utils";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      banReason: true,
      createdAt: true,
      lastLogin: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const csv = usersToCsv(users);

  await logAudit({
    action: "EXPORT_CSV",
    userId: guard.userId,
    targetType: "user",
    targetId: "bulk",
    details: { entity: "users", count: users.length },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildCsvFilename("users")}"`,
    },
  });
}
