import Link from "next/link";
import { Building2, Users, ArrowLeft, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewActions } from "./review-actions";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const STATUS_VARIANT: Record<string, "warning" | "success" | "danger" | "default"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status?.toUpperCase();
  const validStatus =
    status === "PENDING" || status === "APPROVED" || status === "REJECTED"
      ? status
      : "PENDING";

  const reservations = await prisma.reservation.findMany({
    where: { status: validStatus },
    include: {
      space: { select: { name: true, code: true, color: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const counts = await prisma.reservation.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countOf = (s: string) =>
    counts.find((c) => c.status === s)?._count._all ?? 0;

  const formatter = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <div className="mt-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge variant="danger">Administración</Badge>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Gestión de solicitudes de reserva
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Aprueba o rechaza las solicitudes pendientes del IUCE.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/api/admin/exports/reservations">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exportar CSV
          </a>
        </Button>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
          const isActive = validStatus === s;
          return (
            <a
              key={s}
              href={`/admin/reservations?status=${s.toLowerCase()}`}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-iuce-blue-dark text-white"
                  : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {STATUS_LABEL[s]}
              <span
                className={`rounded-full px-1.5 text-xs font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {countOf(s)}
              </span>
            </a>
          );
        })}
      </nav>

      {reservations.length === 0 ? (
        <Card className="mt-6 border-dashed">
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              No hay reservas con estado{" "}
              <strong>{STATUS_LABEL[validStatus].toLowerCase()}</strong>.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Solicitante</th>
                  <th className="px-4 py-3 text-left font-medium">Espacio</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha y hora</th>
                  <th className="px-4 py-3 text-left font-medium">Asistentes</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-gray-900">{r.user.name}</p>
                      <p className="text-xs text-gray-500">{r.user.email}</p>
                      <p className="mt-1 text-xs text-gray-700">{r.title}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: r.space.color }}
                        />
                        <span className="text-gray-900 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          {r.space.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 ml-4">{r.space.code}</p>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">
                      {formatter.format(r.startTime)}
                      <p className="text-xs text-gray-500">
                        hasta {formatter.format(r.endTime)}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        {r.attendees}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>
                        {STATUS_LABEL[r.status] || r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      {r.status === "PENDING" ? (
                        <ReviewActions reservationId={r.id} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
