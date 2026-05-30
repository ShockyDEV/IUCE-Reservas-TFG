"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  Building2,
  Send,
  AlertCircle,
  Repeat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Space {
  id: string;
  name: string;
  code: string;
  capacity: number;
  color: string;
  building: string;
  floor: number | null;
}

const RECURRENCE_OPTIONS = [
  { value: "", label: "Sin recurrencia" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
];

export default function NewReservationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    spaceId: searchParams.get("spaceId") || "",
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    attendees: 1,
    recurrenceRule: "",
    recurrenceEndDate: "",
  });

  useEffect(() => {
    fetch("/api/spaces")
      .then((r) => r.json())
      .then((data: Space[]) => {
        setSpaces(data);
        if (!form.spaceId && data.length > 0) {
          setForm((prev) => ({ ...prev, spaceId: data[0].id }));
        }
      })
      .catch(() => toast.error("Error cargando los espacios"))
      .finally(() => setLoadingSpaces(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSpace = spaces.find((s) => s.id === form.spaceId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.spaceId) {
      setError("Selecciona un espacio");
      return;
    }
    if (!form.title || !form.date || !form.startTime || !form.endTime) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    if (form.startTime >= form.endTime) {
      setError("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    if (selectedSpace && form.attendees > selectedSpace.capacity) {
      setError(
        `Máximo ${selectedSpace.capacity} asistentes para este espacio`
      );
      return;
    }
    if (form.recurrenceRule && !form.recurrenceEndDate) {
      setError("Indica una fecha de finalización para la recurrencia");
      return;
    }

    setLoading(true);
    try {
      const startTime = new Date(
        `${form.date}T${form.startTime}:00`
      ).toISOString();
      const endTime = new Date(
        `${form.date}T${form.endTime}:00`
      ).toISOString();

      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        spaceId: form.spaceId,
        startTime,
        endTime,
        attendees: form.attendees,
      };
      if (form.recurrenceRule) {
        payload.isRecurring = true;
        payload.recurrenceRule = form.recurrenceRule;
        payload.recurrenceEndDate = form.recurrenceEndDate;
      }

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const message = data.error || "Error al crear la reserva";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(
        form.recurrenceRule
          ? `Recurrencia creada: ${data.created} reservas solicitadas`
          : "Solicitud de reserva enviada"
      );
      router.push("/reservations");
    } catch {
      const message = "Error de conexión con el servidor";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link
        href="/reservations"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mis reservas
      </Link>

      <div className="mt-6">
        <Badge variant="info">Nueva solicitud</Badge>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Solicitar reserva
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Selecciona el espacio que necesitas y rellena los datos de la reserva.
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Datos de la reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Building2 className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                Espacio <span className="text-usal-red">*</span>
              </label>
              {loadingSpaces ? (
                <p className="text-xs text-gray-400">Cargando espacios…</p>
              ) : (
                <select
                  required
                  value={form.spaceId}
                  onChange={(e) =>
                    setForm({ ...form, spaceId: e.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="" disabled>
                    Selecciona un espacio…
                  </option>
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.code} (capacidad {s.capacity})
                    </option>
                  ))}
                </select>
              )}
              {selectedSpace && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Capacidad máxima: {selectedSpace.capacity} personas · planta{" "}
                  {selectedSpace.floor ?? 0}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Título <span className="text-usal-red">*</span>
              </label>
              <Input
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej.: Seminario de investigación"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Descripción
              </label>
              <Textarea
                rows={3}
                maxLength={500}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe brevemente el uso del espacio (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <CalendarDays className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                Fecha <span className="text-usal-red">*</span>
              </label>
              <Input
                type="date"
                required
                min={today}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Clock className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                  Hora inicio <span className="text-usal-red">*</span>
                </label>
                <Input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Clock className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                  Hora fin <span className="text-usal-red">*</span>
                </label>
                <Input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Users className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                Número de asistentes
              </label>
              <Input
                type="number"
                min={1}
                max={selectedSpace?.capacity || 500}
                value={form.attendees}
                onChange={(e) =>
                  setForm({
                    ...form,
                    attendees: parseInt(e.target.value) || 1,
                  })
                }
                className="w-32"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Repeat className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                  Recurrencia
                </label>
                <select
                  value={form.recurrenceRule}
                  onChange={(e) =>
                    setForm({ ...form, recurrenceRule: e.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {form.recurrenceRule && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hasta fecha
                  </label>
                  <Input
                    type="date"
                    min={form.date || today}
                    value={form.recurrenceEndDate}
                    onChange={(e) =>
                      setForm({ ...form, recurrenceEndDate: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-danger-500/20 bg-danger-50 p-3 text-sm text-danger-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <Link href="/reservations">
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Solicitar reserva
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
