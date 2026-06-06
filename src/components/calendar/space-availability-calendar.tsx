"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarSearch,
  Lock,
  Clock,
} from "lucide-react";

/**
 * Calendario mensual de disponibilidad de un espacio. Muestra de un vistazo
 * qué días están libres, parcialmente reservados o bloqueados, y opcionalmente
 * permite al usuario seleccionar un día (modo `interactive`) para alimentar
 * un campo `<input type="date">` externo.
 *
 * El componente consulta `GET /api/spaces/:id/occupancy` para obtener los
 * intervalos ocupados de cada mes que el usuario visita, e infiere por sí
 * mismo si cada día contiene 0 / 1‑2 / 3+ intervalos para pintarlos.
 */
export interface OccupancyInterval {
  id: string;
  startTime: string;
  endTime: string;
  kind: "RESERVATION_APPROVED" | "RESERVATION_PENDING" | "BLOCKED";
  label: string;
}

interface SpaceAvailabilityCalendarProps {
  spaceId: string;
  mode?: "view" | "interactive";
  selectedDate?: string; // YYYY-MM-DD (usado en modo interactive)
  onDateSelect?: (isoDate: string) => void;
  /**
   * Si es true (por defecto en modo interactive), las fechas pasadas son
   * visibles pero no seleccionables. En modo view solo se aplica al ring
   * visual de "hoy".
   */
  disablePast?: boolean;
}

const WEEKDAYS_ES = ["L", "M", "X", "J", "V", "S", "D"] as const;
const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const timeFmt = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
});

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

interface DayCell {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  intervalCount: number;
  hasBlock: boolean;
}

/** Determina el tono del indicador según los intervalos del día. */
function dotClasses(cell: DayCell): string {
  if (cell.intervalCount === 0) return "bg-success-500/70";
  if (cell.hasBlock) return "bg-danger-500/80";
  if (cell.intervalCount >= 3) return "bg-warning-500";
  return "bg-iuce-blue/70";
}

export function SpaceAvailabilityCalendar({
  spaceId,
  mode = "view",
  selectedDate,
  onDateSelect,
  disablePast,
}: Readonly<SpaceAvailabilityCalendarProps>) {
  const isInteractive = mode === "interactive";
  const past = disablePast ?? isInteractive;

  // Computamos "hoy" sin horas para comparar por igualdad de día.
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    if (selectedDate) {
      const d = parseIsoDate(selectedDate);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [intervals, setIntervals] = useState<OccupancyInterval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicio del grid: lunes de la semana en la que cae el día 1.
  const gridStart = useMemo(() => {
    const first = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1,
    );
    const weekIndex = (first.getDay() + 6) % 7; // 0 = lunes
    const start = new Date(first);
    start.setDate(start.getDate() - weekIndex);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [visibleMonth]);

  const gridEnd = useMemo(() => {
    const end = new Date(gridStart);
    end.setDate(end.getDate() + 42);
    return end;
  }, [gridStart]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/spaces/${spaceId}/occupancy?from=${encodeURIComponent(
        gridStart.toISOString(),
      )}&to=${encodeURIComponent(gridEnd.toISOString())}`,
    )
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Error consultando ocupación");
        return data as { intervals: OccupancyInterval[] };
      })
      .then((data) => {
        if (!cancelled) setIntervals(data.intervals || []);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Error de conexión";
          setError(msg);
          setIntervals([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId, gridStart, gridEnd]);

  const days: DayCell[] = useMemo(() => {
    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      const iso = toIsoDate(d);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      let count = 0;
      let hasBlock = false;
      for (const interval of intervals) {
        const s = new Date(interval.startTime);
        const e = new Date(interval.endTime);
        if (s < dayEnd && e > dayStart) {
          count += 1;
          if (interval.kind === "BLOCKED") hasBlock = true;
        }
      }
      cells.push({
        date: iso,
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === visibleMonth.getMonth(),
        isToday: d.getTime() === today.getTime(),
        isPast: d.getTime() < today.getTime(),
        isSelected: selectedDate === iso,
        intervalCount: count,
        hasBlock,
      });
    }
    return cells;
  }, [gridStart, intervals, today, visibleMonth, selectedDate]);

  // Intervalos del día seleccionado (si lo hay) para el panel inferior.
  const selectedDayIntervals = useMemo(() => {
    if (!selectedDate) return [];
    const d = parseIsoDate(selectedDate);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    return intervals.filter((interval) => {
      const s = new Date(interval.startTime);
      const e = new Date(interval.endTime);
      return s < dayEnd && e > dayStart;
    });
  }, [selectedDate, intervals]);

  function goPrev() {
    setVisibleMonth(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
    );
  }
  function goNext() {
    setVisibleMonth(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
    );
  }
  function goToday() {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  function handleDayClick(cell: DayCell) {
    if (!isInteractive || !onDateSelect) return;
    if (past && cell.isPast) return;
    onDateSelect(cell.date);
  }

  const monthLabel = `${MONTHS_ES[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarSearch className="h-4 w-4 text-iuce-blue" />
          <span className="text-sm font-medium text-gray-700 capitalize">
            {monthLabel}
          </span>
          {loading && (
            <span className="text-[11px] text-gray-400">Consultando…</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Mes anterior"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-md px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Mes siguiente"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <p className="px-4 py-2 text-[11px] text-danger-700">
          No se pudo cargar la disponibilidad: {error}
        </p>
      )}

      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-7 gap-1 px-3 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {WEEKDAYS_ES.map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-3 pt-2">
        {days.map((cell) => {
          const clickable =
            isInteractive && (!past || !cell.isPast) && cell.isCurrentMonth;
          const baseClasses =
            "relative flex h-12 flex-col items-center justify-start rounded-md border px-1 py-1 text-xs transition-colors";

          let stateClasses = "";
          if (!cell.isCurrentMonth) {
            stateClasses = "border-transparent text-gray-300";
          } else if (cell.isSelected) {
            stateClasses =
              "border-iuce-blue bg-iuce-blue-pale text-iuce-blue-dark font-semibold";
          } else if (cell.isToday) {
            stateClasses = "border-iuce-blue/50 text-gray-800";
          } else if (cell.isPast) {
            stateClasses = "border-transparent bg-gray-50 text-gray-400";
          } else {
            stateClasses = "border-gray-100 text-gray-700 hover:bg-gray-50";
          }

          if (clickable) {
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => handleDayClick(cell)}
                className={`${baseClasses} ${stateClasses} cursor-pointer`}
                aria-pressed={cell.isSelected}
                aria-label={`Seleccionar ${cell.date}`}
              >
                <DayCellContent cell={cell} />
              </button>
            );
          }

          return (
            <div
              key={cell.date}
              className={`${baseClasses} ${stateClasses}`}
              aria-disabled={!cell.isCurrentMonth || cell.isPast}
            >
              <DayCellContent cell={cell} />
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 px-4 py-2 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success-500/70" />
          Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-iuce-blue/70" />
          1–2 reservas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning-500" />
          3 o más
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger-500/80" />
          Bloqueado
        </span>
      </div>

      {/* Detalle del día seleccionado en modo interactive */}
      {isInteractive && selectedDate && (
        <SelectedDayPanel
          dateIso={selectedDate}
          dayIntervals={selectedDayIntervals}
        />
      )}
    </div>
  );
}

function DayCellContent({ cell }: Readonly<{ cell: DayCell }>) {
  return (
    <>
      <span className="text-xs leading-none">{cell.day}</span>
      {cell.intervalCount > 0 ? (
        <div className="mt-1 flex items-center gap-1">
          <span
            className={`h-1.5 w-1.5 rounded-full ${dotClasses(cell)}`}
            aria-hidden="true"
          />
          <span className="text-[9px] text-gray-500">{cell.intervalCount}</span>
        </div>
      ) : (
        cell.isCurrentMonth &&
        !cell.isPast && (
          <span
            className="mt-1 h-1.5 w-1.5 rounded-full bg-success-500/70"
            aria-hidden="true"
          />
        )
      )}
    </>
  );
}

function SelectedDayPanel({
  dateIso,
  dayIntervals,
}: Readonly<{
  dateIso: string;
  dayIntervals: OccupancyInterval[];
}>) {
  const d = parseIsoDate(dateIso);
  const labelFmt = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (dayIntervals.length === 0) {
    return (
      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-500">
          <span className="font-medium text-gray-700 capitalize">
            {labelFmt.format(d)}
          </span>{" "}
          · sin reservas registradas, el día está libre.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
        Ocupación de{" "}
        <span className="text-gray-700 capitalize">{labelFmt.format(d)}</span>
      </p>
      <ul className="mt-2 space-y-1.5">
        {dayIntervals.map((interval) => {
          const start = new Date(interval.startTime);
          const end = new Date(interval.endTime);
          let kindClasses: string;
          if (interval.kind === "BLOCKED") {
            kindClasses = "bg-danger-50 text-danger-700";
          } else if (interval.kind === "RESERVATION_PENDING") {
            kindClasses = "bg-warning-50 text-warning-700";
          } else {
            kindClasses = "bg-iuce-blue-pale text-iuce-blue-dark";
          }
          let kindLabel: string;
          if (interval.kind === "BLOCKED") {
            kindLabel = "Bloqueada";
          } else if (interval.kind === "RESERVATION_PENDING") {
            kindLabel = "Pendiente";
          } else {
            kindLabel = "Aprobada";
          }
          return (
            <li
              key={interval.id}
              className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                {interval.kind === "BLOCKED" ? (
                  <Lock className="h-3.5 w-3.5 text-danger-500 flex-shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-iuce-blue flex-shrink-0" />
                )}
                <span className="text-xs text-gray-700 truncate">
                  {interval.label}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${kindClasses}`}
                >
                  {kindLabel}
                </span>
                <span className="text-[11px] text-gray-500 whitespace-nowrap">
                  {timeFmt.format(start)} – {timeFmt.format(end)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
