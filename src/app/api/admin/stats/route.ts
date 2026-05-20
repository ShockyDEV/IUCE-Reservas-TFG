import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/reservations";

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

function toIsoDate(date: Date): string {
  // YYYY-MM-DD a partir de la fecha en hora local
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toShortLabel(isoDate: string): string {
  // DD/MM para los ticks del eje X
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}

/**
 * GET /api/admin/stats
 *
 * Devuelve un volcado agregado del estado del sistema para el panel
 * administrativo: totales globales, serie diaria de los últimos 30 días,
 * ranking de espacios más utilizados, top de usuarios solicitantes y las
 * últimas entradas del audit log.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!isAdminRole(role)) {
    return NextResponse.json(
      { error: "Solo el personal administrativo puede consultar estadísticas" },
      { status: 403 }
    );
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MILLIS_PER_DAY);

  const [
    totalReservations,
    statusCounts,
    reservationsLast30,
    spaceUsage,
    topUsers,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.reservation.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.reservation.groupBy({
      by: ["spaceId"],
      where: { status: "APPROVED", startTime: { gte: thirtyDaysAgo } },
      _count: { _all: true },
    }),
    prisma.reservation.groupBy({
      by: ["userId"],
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const spaceIds = spaceUsage.map((s) => s.spaceId);
  const spaces = await prisma.space.findMany({
    where: { id: { in: spaceIds } },
    select: { id: true, name: true, color: true },
  });
  const spaceMap = Object.fromEntries(spaces.map((s) => [s.id, s]));

  const userIds = topUsers.map((u) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  // Construcción de la serie diaria: inicializamos los 30 días a cero y
  // acumulamos las reservas encontradas en su día correspondiente.
  const dailyMap: Record<string, { total: number; approved: number; rejected: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const dateKey = toIsoDate(new Date(now.getTime() - i * MILLIS_PER_DAY));
    dailyMap[dateKey] = { total: 0, approved: 0, rejected: 0 };
  }
  reservationsLast30.forEach((r) => {
    const dateKey = toIsoDate(r.createdAt);
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].total++;
      if (r.status === "APPROVED") dailyMap[dateKey].approved++;
      if (r.status === "REJECTED") dailyMap[dateKey].rejected++;
    }
  });

  const statusMap: Record<string, number> = {};
  statusCounts.forEach((s) => {
    statusMap[s.status] = s._count._all;
  });

  return NextResponse.json({
    overview: {
      totalReservations,
      pending: statusMap.PENDING || 0,
      approved: statusMap.APPROVED || 0,
      rejected: statusMap.REJECTED || 0,
    },
    dailyChart: Object.entries(dailyMap).map(([date, data]) => ({
      date,
      label: toShortLabel(date),
      ...data,
    })),
    spaceUsage: spaceUsage
      .map((s) => ({
        spaceId: s.spaceId,
        name: spaceMap[s.spaceId]?.name || "Desconocido",
        color: spaceMap[s.spaceId]?.color || "#ccc",
        count: s._count._all,
      }))
      .sort((a, b) => b.count - a.count),
    topUsers: topUsers.map((u) => ({
      userId: u.userId,
      name: userMap[u.userId]?.name || "Desconocido",
      email: userMap[u.userId]?.email || "",
      count: u._count._all,
    })),
    auditLog: recentAuditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      userName: l.user.name,
      targetType: l.targetType,
      targetId: l.targetId,
      details: l.details ? JSON.parse(l.details) : null,
      createdAt: l.createdAt,
    })),
  });
}
