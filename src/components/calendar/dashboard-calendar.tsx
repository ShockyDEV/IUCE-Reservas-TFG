"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DashboardCalendarEntry {
  id: string;
  startTime: string | Date;
  spaceColor: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
}

interface DashboardCalendarProps {
  reservations?: DashboardCalendarEntry[];
}

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Mini-calendario mensual compacto para el dashboard del usuario. No
 * permite navegación entre meses; muestra exclusivamente el mes en
 * curso con un punto del color del espacio bajo cada día que contiene
 * alguna reserva del usuario.
 */
export function DashboardCalendar({ reservations = [] }: Readonly<DashboardCalendarProps>) {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const offset = (monthStart.getDay() + 6) % 7;
  const cells = useMemo(() => {
    const days = monthEnd.getDate();
    return Array.from({ length: offset + days }).map((_, i) => {
      if (i < offset) return null;
      return new Date(today.getFullYear(), today.getMonth(), i - offset + 1);
    });
  }, [offset, monthEnd, today]);

  function entriesForDay(day: Date | null): DashboardCalendarEntry[] {
    if (!day) return [];
    return reservations.filter((r) => isSameDay(new Date(r.startTime), day));
  }

  const monthLabel = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(today);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize text-base">{monthLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-gray-400 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            const entries = entriesForDay(day);
            const isToday = day && isSameDay(day, today);
            return (
              <div
                key={i}
                className={`h-9 rounded-md flex flex-col items-center justify-center text-xs ${
                  day
                    ? isToday
                      ? "bg-iuce-blue-pale text-iuce-blue-dark font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                    : ""
                }`}
              >
                {day ? day.getDate() : ""}
                {entries.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {entries.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className="h-1 w-1 rounded-full"
                        style={{ backgroundColor: e.spaceColor }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
