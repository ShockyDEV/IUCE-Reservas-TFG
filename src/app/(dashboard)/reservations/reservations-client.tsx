"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Search,
  Plus,
  Building2,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobadas" },
  { value: "REJECTED", label: "Rechazadas" },
  { value: "CANCELLED", label: "Canceladas" },
  { value: "EXPIRED", label: "Expiradas" },
] as const;

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "warning" | "success" | "danger" | "secondary" | "default" }
> = {
  PENDING: { label: "Pendiente", variant: "warning" },
  APPROVED: { label: "Aprobada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "danger" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
  EXPIRED: { label: "Expirada", variant: "secondary" },
};

export interface ReservationRow {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: string;
  attendees: number;
  createdAt: string;
  space: { id: string; name: string; code: string; color: string };
}

const dateTimeFmt = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dayFmt = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function ReservationsClient({
  reservations,
}: Readonly<{
  reservations: ReservationRow[];
}>) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      const start = new Date(r.startTime).getTime();
      if (dateFrom && start < new Date(dateFrom).getTime()) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (start > endOfDay.getTime()) return false;
      }
      return true;
    });
  }, [reservations, search, statusFilter, dateFrom, dateTo]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: reservations.length };
    for (const r of reservations) {
      map[r.status] = (map[r.status] ?? 0) + 1;
    }
    return map;
  }, [reservations]);

  const hasFilters =
    search !== "" ||
    statusFilter !== "ALL" ||
    dateFrom !== "" ||
    dateTo !== "";

  return (
    <>
      <Card className="mt-6">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buscar por título
              </label>
              <div className="mt-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Reunión de claustro, formación, ..."
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Desde
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hasta
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {STATUS_OPTIONS.map((opt) => {
              const active = statusFilter === opt.value;
              const count =
                opt.value === "ALL"
                  ? counts.ALL ?? 0
                  : counts[opt.value] ?? 0;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                    active
                      ? "border-iuce-blue bg-iuce-blue-pale text-iuce-blue-dark"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                  <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-semibold text-gray-700">
                    {count}
                  </span>
                </button>
              );
            })}
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 ml-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Mostrando <strong>{filtered.length}</strong> de{" "}
            <strong>{reservations.length}</strong> reservas
          </p>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="mt-6 border-dashed">
          <CardContent className="py-10 text-center">
            <CalendarDays className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {reservations.length === 0
                ? "Aún no has solicitado ninguna reserva."
                : "Ninguna reserva coincide con los filtros aplicados."}
            </p>
            <Link
              href="/reservations/new"
              className="mt-3 inline-flex items-center gap-1 text-sm text-iuce-blue hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Solicitar una nueva reserva
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-2">
          {filtered.map((r) => {
            const badge = STATUS_BADGE[r.status] ?? {
              label: r.status,
              variant: "default" as const,
            };
            return (
              <Link
                key={r.id}
                href={`/reservations/${r.id}`}
                className="block"
              >
                <Card className="hover:border-iuce-blue/30 hover:shadow-sm transition-all">
                  <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                      style={{ backgroundColor: r.space.color + "15" }}
                    >
                      <Building2
                        className="h-4 w-4"
                        style={{ color: r.space.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {r.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {r.space.name} · {r.space.code}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500 hidden sm:block">
                      <p className="capitalize">{dayFmt.format(new Date(r.startTime))}</p>
                      <p className="flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {dateTimeFmt.format(new Date(r.startTime))}
                      </p>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
