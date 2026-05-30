"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  TrendingUp,
  Users as UsersIcon,
  Building2,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";

interface Stats {
  overview: {
    totalReservations: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    expired: number;
  };
  dailyChart: {
    date: string;
    label: string;
    total: number;
    approved: number;
    rejected: number;
  }[];
  spaceUsage: {
    spaceId: string;
    name: string;
    color: string;
    count: number;
  }[];
  topUsers: {
    userId: string;
    name: string;
    email: string;
    count: number;
  }[];
  auditLog: {
    id: string;
    action: string;
    userName: string;
    targetType: string;
    targetId: string;
    createdAt: string;
  }[];
}

const ACTION_LABEL: Record<string, string> = {
  RESERVATION_APPROVED: "Reserva aprobada",
  RESERVATION_REJECTED: "Reserva rechazada",
  RESERVATION_CANCELLED: "Reserva cancelada",
  BLOCKED_SLOT_CREATED: "Bloqueo creado",
  BLOCKED_SLOT_DELETED: "Bloqueo eliminado",
  USER_ROLE_CHANGED: "Cambio de rol",
  USER_BANNED: "Usuario suspendido",
  USER_UNBANNED: "Usuario reactivado",
  USER_NAME_CHANGED: "Nombre actualizado",
  SPACE_CREATED: "Espacio creado",
  SPACE_UPDATED: "Espacio actualizado",
  SPACE_DEACTIVATED: "Espacio desactivado",
  SETTING_UPDATED: "Configuración actualizada",
  EXPORT_CSV: "Exportación CSV",
};

const dateTimeFmt = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function AdminReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <p className="text-sm text-gray-500">
          No se han podido cargar las estadísticas.
        </p>
      </div>
    );
  }

  const maxDaily = Math.max(...stats.dailyChart.map((d) => d.total), 1);
  const maxSpaceUsage = Math.max(...stats.spaceUsage.map((s) => s.count), 1);
  const maxTopUsers = Math.max(...stats.topUsers.map((u) => u.count), 1);

  const overviewCards = [
    {
      label: "Total",
      value: stats.overview.totalReservations,
      icon: BarChart3,
      bg: "bg-gray-100",
      color: "text-gray-700",
    },
    {
      label: "Pendientes",
      value: stats.overview.pending,
      icon: Clock,
      bg: "bg-warning-50",
      color: "text-warning-700",
    },
    {
      label: "Aprobadas",
      value: stats.overview.approved,
      icon: CheckCircle2,
      bg: "bg-success-50",
      color: "text-success-700",
    },
    {
      label: "Rechazadas",
      value: stats.overview.rejected,
      icon: XCircle,
      bg: "bg-danger-50",
      color: "text-danger-700",
    },
    {
      label: "Canceladas",
      value: stats.overview.cancelled,
      icon: Activity,
      bg: "bg-gray-100",
      color: "text-gray-600",
    },
    {
      label: "Expiradas",
      value: stats.overview.expired,
      icon: Activity,
      bg: "bg-gray-100",
      color: "text-gray-600",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge variant="danger">Administración</Badge>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Estadísticas y reportes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visión agregada del uso del sistema en los últimos 30 días.
          </p>
        </div>
        <a
          href="/api/admin/exports/audit"
          className={buttonClassName({ variant: "outline", size: "sm" })}
        >
          <Download className="h-3.5 w-3.5 mr-1.5" /> Audit log CSV
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {overviewCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                      {c.label}
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {c.value}
                    </p>
                  </div>
                  <div className={`${c.bg} p-1.5 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-iuce-blue" />
            Actividad diaria (últimos 30 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-48 border-b border-gray-100 pb-2">
            {stats.dailyChart.map((d) => {
              const totalHeight = (d.total / maxDaily) * 100;
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center group relative"
                  title={`${d.label}: ${d.total} reservas (${d.approved} aprobadas, ${d.rejected} rechazadas)`}
                >
                  <div
                    className="w-full bg-iuce-blue/70 rounded-t hover:bg-iuce-blue transition-colors"
                    style={{ height: `${totalHeight}%`, minHeight: d.total > 0 ? "2px" : "0" }}
                  />
                  <span className="absolute -bottom-5 text-[9px] text-gray-400 truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-xs text-gray-500 text-center">
            Total ventana: <strong>{stats.dailyChart.reduce((s, d) => s + d.total, 0)}</strong> reservas creadas
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-iuce-blue" />
              Espacios más reservados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.spaceUsage.length === 0 ? (
              <p className="text-sm text-gray-500">
                Sin datos de uso en los últimos 30 días.
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.spaceUsage.map((s) => (
                  <li key={s.spaceId}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 font-medium text-gray-700">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </span>
                      <span className="text-gray-500">{s.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.count / maxSpaceUsage) * 100}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-iuce-blue" />
              Top 5 usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topUsers.length === 0 ? (
              <p className="text-sm text-gray-500">
                Sin actividad de usuarios todavía.
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.topUsers.map((u) => (
                  <li key={u.userId}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 truncate">
                        {u.name}
                      </span>
                      <span className="text-gray-500 flex-shrink-0">
                        {u.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-iuce-blue"
                        style={{
                          width: `${(u.count / maxTopUsers) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      {u.email}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-iuce-blue" />
            Audit log reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.auditLog.length === 0 ? (
            <p className="text-sm text-gray-500">No hay entradas todavía.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {stats.auditLog.map((entry) => (
                <li
                  key={entry.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {entry.userName} · {entry.targetType}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 flex-shrink-0">
                    {dateTimeFmt.format(new Date(entry.createdAt))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
