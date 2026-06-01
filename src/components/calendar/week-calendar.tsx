"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface WeekCalendarReservation {
  id: string;
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  spaceName: string;
  spaceColor: string;
}

export interface WeekCalendarBlock {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  reason: string;
}

interface WeekCalendarProps {
  reservations?: WeekCalendarReservation[];
  blockedSlots?: WeekCalendarBlock[];
  startHour?: number;
  endHour?: number;
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Lunes = 0
  d.setDate(d.getDate() - day);
  return d;
}

function formatDayHeader(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Vista semanal de reservas aprobadas y bloqueos administrativos.
 *
 * Cada reserva se renderiza como un bloque con el color del espacio
 * sobre la franja horaria correspondiente. Los `BlockedSlot` aparecen
 * con un patrón rayado en gris para distinguirlos de las reservas.
 */
export function WeekCalendar({
  reservations = [],
  blockedSlots = [],
  startHour = 8,
  endHour = 21,
}: Readonly<WeekCalendarProps>) {
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map(
        (_, i) => new Date(weekStart.getTime() + i * MS_PER_DAY),
      ),
    [weekStart],
  );

  const hours = useMemo(
    () =>
      Array.from({ length: endHour - startHour + 1 }).map(
        (_, i) => startHour + i,
      ),
    [startHour, endHour],
  );

  const goPrev = () =>
    setAnchorDate((d) => new Date(d.getTime() - 7 * MS_PER_DAY));
  const goNext = () =>
    setAnchorDate((d) => new Date(d.getTime() + 7 * MS_PER_DAY));
  const goToday = () => setAnchorDate(new Date());

  const monthLabel = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(weekStart);

  function blockStyle(
    start: Date,
    end: Date,
    bgColor: string,
  ): React.CSSProperties {
    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);
    const top = ((start.getHours() + start.getMinutes() / 60 - startHour) /
      (endHour - startHour + 1)) * 100;
    const heightHours =
      end.getHours() + end.getMinutes() / 60 -
      (start.getHours() + start.getMinutes() / 60);
    const height = (heightHours / (endHour - startHour + 1)) * 100;
    return {
      position: "absolute",
      top: `${Math.max(0, top)}%`,
      height: `${Math.max(2, height)}%`,
      left: 4,
      right: 4,
      backgroundColor: bgColor,
    };
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="capitalize">{monthLabel}</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday}>
              Hoy
            </Button>
            <Button variant="ghost" size="sm" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100 pb-2 text-center text-xs font-medium text-gray-500">
            <div />
            {days.map((d, i) => (
              <div key={i}>
                <p>{DAY_LABELS[i]}</p>
                <p className="text-gray-900 font-semibold">
                  {formatDayHeader(d)}
                </p>
              </div>
            ))}
          </div>
          <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
            <div>
              {hours.map((h) => (
                <div
                  key={h}
                  className="h-12 text-right pr-2 text-[10px] text-gray-400"
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {days.map((day, i) => {
              const dayStart = day.getTime();
              const dayEnd = dayStart + MS_PER_DAY;
              const dayReservations = reservations.filter((r) => {
                const t = new Date(r.startTime).getTime();
                return t >= dayStart && t < dayEnd;
              });
              const dayBlocks = blockedSlots.filter((b) => {
                const t = new Date(b.startTime).getTime();
                return t >= dayStart && t < dayEnd;
              });
              return (
                <div
                  key={i}
                  className="relative border-l border-gray-100"
                  style={{ height: `${hours.length * 48}px` }}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="h-12 border-b border-dashed border-gray-100"
                    />
                  ))}
                  {dayBlocks.map((b) => (
                    <div
                      key={b.id}
                      style={blockStyle(
                        new Date(b.startTime),
                        new Date(b.endTime),
                        "rgba(156, 163, 175, 0.25)",
                      )}
                      className="rounded border border-gray-300 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_8px)] text-[10px] text-gray-700 p-1"
                      title={b.reason}
                    >
                      Bloqueado
                    </div>
                  ))}
                  {dayReservations.map((r) => (
                    <div
                      key={r.id}
                      style={blockStyle(
                        new Date(r.startTime),
                        new Date(r.endTime),
                        r.spaceColor,
                      )}
                      className="rounded text-white text-[10px] leading-tight p-1 overflow-hidden shadow-sm"
                      title={`${r.title} · ${r.spaceName}`}
                    >
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="opacity-80 truncate">{r.spaceName}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
