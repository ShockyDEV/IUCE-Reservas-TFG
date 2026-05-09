import { prisma } from "@/lib/prisma";
import { ReviewActions } from "./review-actions";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-red-700">
          Administración
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Gestión de solicitudes de reserva
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Aprueba o rechaza las solicitudes pendientes del IUCE.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
          const isActive = validStatus === s;
          return (
            <a
              key={s}
              href={`/admin/reservations?status=${s.toLowerCase()}`}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {STATUS_LABEL[s]}
              <span
                className={`rounded-full px-1.5 text-xs font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {countOf(s)}
              </span>
            </a>
          );
        })}
      </nav>

      {reservations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            No hay reservas con estado{" "}
            <strong>{STATUS_LABEL[validStatus].toLowerCase()}</strong>.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
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
                <tr key={r.id} className="hover:bg-gray-50">
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
                      <span className="text-gray-900">{r.space.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{r.space.code}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-gray-700">
                    {formatter.format(r.startTime)}
                    <p className="text-xs text-gray-500">
                      hasta {formatter.format(r.endTime)}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top text-gray-700">
                    {r.attendees}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_CLASS[r.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
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
      )}
    </div>
  );
}
