import { CalendarDays, Download } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";

/**
 * Bloque de descarga del calendario mensual de reservas. Genera tres
 * enlaces de descarga ya parametrizados con el mes anterior, actual y
 * siguiente al momento de renderizar la página.
 *
 * El cálculo es server-side (`new Date()` se ejecuta en cada request del
 * componente padre) y el endpoint subyacente filtra reservas APROBADAS y
 * PENDIENTES cuyo inicio cae dentro del mes solicitado.
 */
export function CalendarExport() {
  const now = new Date();
  const months = [
    { offset: -1, label: "Mes anterior" },
    { offset: 0, label: "Mes actual" },
    { offset: 1, label: "Mes siguiente" },
  ];

  const monthName = (d: Date) =>
    d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const monthQuery = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-600">
        <CalendarDays className="h-3.5 w-3.5 text-iuce-blue" />
        Calendario mensual
      </span>
      {months.map(({ offset, label }) => {
        const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const query = monthQuery(target);
        return (
          <a
            key={query}
            href={`/api/admin/exports/reservations-calendar?month=${query}`}
            className={buttonClassName({ variant: "outline", size: "sm" })}
            title={`Descargar reservas de ${monthName(target)}`}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            {label}
          </a>
        );
      })}
      <span className="text-[11px] text-gray-400">
        Incluye reservas aprobadas y pendientes del mes.
      </span>
    </div>
  );
}
