import Link from "next/link";
import {
  CalendarCheck,
  CalendarOff,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Download,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

export default async function AdminHomePage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MILLIS_PER_DAY);

  const [statusCounts, spaceUsage, recentAudit] = await Promise.all([
    prisma.reservation.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.reservation.groupBy({
      by: ["spaceId"],
      where: { status: "APPROVED", startTime: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.auditLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const counts = {
    PENDING: statusCounts.find((s) => s.status === "PENDING")?._count._all ?? 0,
    APPROVED: statusCounts.find((s) => s.status === "APPROVED")?._count._all ?? 0,
    REJECTED: statusCounts.find((s) => s.status === "REJECTED")?._count._all ?? 0,
  };

  const spaceIds = spaceUsage.map((s) => s.spaceId);
  const spaces = await prisma.space.findMany({
    where: { id: { in: spaceIds } },
    select: { id: true, name: true, color: true, code: true },
  });
  const spaceMap = Object.fromEntries(spaces.map((s) => [s.id, s]));

  const dateFmt = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const actionLabel: Record<string, string> = {
    RESERVATION_APPROVED: "Reserva aprobada",
    RESERVATION_REJECTED: "Reserva rechazada",
    RESERVATION_CANCELLED: "Reserva cancelada",
    BLOCKED_SLOT_CREATED: "Bloqueo creado",
    BLOCKED_SLOT_DELETED: "Bloqueo eliminado",
    USER_ROLE_CHANGED: "Cambio de rol",
    USER_BANNED: "Usuario suspendido",
    USER_UNBANNED: "Usuario reactivado",
    USER_NAME_CHANGED: "Nombre actualizado",
    EXPORT_CSV: "Exportación CSV",
    SPACE_CREATED: "Espacio creado",
    SPACE_UPDATED: "Espacio actualizado",
    SPACE_DEACTIVATED: "Espacio desactivado",
    SETTING_UPDATED: "Configuración actualizada",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <Badge variant="danger">
        <ShieldCheck className="h-3 w-3" />
        Administración
      </Badge>
      <h1 className="mt-3 text-3xl font-bold text-gray-900">
        Panel de administración
      </h1>
      <p className="mt-2 text-sm text-gray-500 max-w-2xl">
        Resumen del uso del sistema en los últimos 30 días, cola de solicitudes
        pendientes y últimas acciones registradas en el audit log.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-warning-700">
                Pendientes
              </p>
              <Clock className="h-4 w-4 text-warning-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{counts.PENDING}</p>
            <Link
              href="/admin/reservations?status=pending"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-iuce-blue hover:underline"
            >
              Revisar cola
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-success-700">
                Aprobadas
              </p>
              <CheckCircle2 className="h-4 w-4 text-success-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{counts.APPROVED}</p>
            <p className="mt-2 text-xs text-gray-500">Total histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-danger-700">
                Rechazadas
              </p>
              <XCircle className="h-4 w-4 text-danger-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{counts.REJECTED}</p>
            <p className="mt-2 text-xs text-gray-500">Total histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-iuce-blue-dark">
                Total
              </p>
              <CalendarCheck className="h-4 w-4 text-iuce-blue" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {counts.PENDING + counts.APPROVED + counts.REJECTED}
            </p>
            <p className="mt-2 text-xs text-gray-500">Solicitudes en la plataforma</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-iuce-blue" />
              Espacios más reservados (30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {spaceUsage.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no hay reservas aprobadas en los últimos 30 días.
              </p>
            ) : (
              <ul className="space-y-2">
                {spaceUsage.map((s) => {
                  const space = spaceMap[s.spaceId];
                  return (
                    <li
                      key={s.spaceId}
                      className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50/60 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: space?.color }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {space?.name ?? "—"}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {space?.code}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {s._count._all}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-iuce-blue" />
              Audit log reciente
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <a href="/api/admin/exports/audit">
                <Download className="h-3 w-3 mr-1" /> CSV
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay entradas todavía.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {recentAudit.map((entry) => (
                  <li key={entry.id} className="border-l-2 border-iuce-blue pl-3">
                    <p className="font-medium text-gray-900">
                      {actionLabel[entry.action] ?? entry.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.user.name} · {dateFmt.format(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/reservations">
          <Button>
            <CalendarCheck className="h-4 w-4 mr-1.5" />
            Cola de reservas
          </Button>
        </Link>
        <Link href="/admin/spaces">
          <Button variant="secondary">
            <Building2 className="h-4 w-4 mr-1.5" />
            Gestionar espacios
          </Button>
        </Link>
        <Link href="/admin/blocked-slots">
          <Button variant="secondary">
            <CalendarOff className="h-4 w-4 mr-1.5" />
            Bloqueos de calendario
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="secondary">
            <Users className="h-4 w-4 mr-1.5" />
            Gestionar usuarios
          </Button>
        </Link>
        <Link href="/admin/normas">
          <Button variant="secondary">
            <BookOpen className="h-4 w-4 mr-1.5" />
            Editar normas
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost">Volver al panel personal</Button>
        </Link>
      </div>
    </div>
  );
}
