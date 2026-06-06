"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Clock,
  Users,
  Save,
  AlertCircle,
  Building2,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EditFormSpace {
  id: string;
  name: string;
  code: string;
  capacity: number;
}

interface EditFormInitial {
  title: string;
  description: string;
  startTime: string; // ISO
  endTime: string; // ISO
  attendees: number;
  adminNotes: string;
}

interface EditReservationFormProps {
  reservationId: string;
  space: EditFormSpace;
  initial: EditFormInitial;
}

/** Convierte un ISO string (UTC) a campos locales date / time (HH:mm). */
function isoToLocalParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function validateEditForm(
  form: { title: string; date: string; startTime: string; endTime: string; attendees: number },
  capacity: number,
): string | null {
  if (!form.title || !form.date || !form.startTime || !form.endTime) {
    return "Completa todos los campos obligatorios";
  }
  if (form.startTime >= form.endTime) {
    return "La hora de fin debe ser posterior a la de inicio";
  }
  if (form.attendees > capacity) {
    return `Máximo ${capacity} asistentes para este espacio`;
  }
  return null;
}

export function EditReservationForm({
  reservationId,
  space,
  initial,
}: Readonly<EditReservationFormProps>) {
  const router = useRouter();
  const startParts = isoToLocalParts(initial.startTime);
  const endParts = isoToLocalParts(initial.endTime);

  const [form, setForm] = useState({
    title: initial.title,
    description: initial.description,
    date: startParts.date,
    startTime: startParts.time,
    endTime: endParts.time,
    attendees: initial.attendees,
    adminNotes: initial.adminNotes,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateEditForm(form, space.capacity);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const startTime = new Date(
        `${form.date}T${form.startTime}:00`,
      ).toISOString();
      const endTime = new Date(
        `${form.date}T${form.endTime}:00`,
      ).toISOString();

      const res = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          startTime,
          endTime,
          attendees: form.attendees,
          adminNotes: form.adminNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.error || "Error al actualizar la reserva";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success("Reserva actualizada correctamente");
      router.push(`/admin/reservations/${reservationId}`);
      router.refresh();
    } catch {
      const message = "Error de conexión con el servidor";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-iuce-blue" />
          Datos de la reserva — {space.name}{" "}
          <span className="text-xs font-normal text-gray-500">
            ({space.code} · capacidad {space.capacity})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="edit-res-title"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Título <span className="text-usal-red">*</span>
            </label>
            <Input
              id="edit-res-title"
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label
              htmlFor="edit-res-desc"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Descripción
            </label>
            <Textarea
              id="edit-res-desc"
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
            <label
              htmlFor="edit-res-date"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              <CalendarDays className="inline-block h-4 w-4 mr-1 -mt-0.5" />
              Fecha <span className="text-usal-red">*</span>
            </label>
            <Input
              id="edit-res-date"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-res-start"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                <Clock className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                Hora inicio <span className="text-usal-red">*</span>
              </label>
              <Input
                id="edit-res-start"
                type="time"
                required
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="edit-res-end"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                <Clock className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                Hora fin <span className="text-usal-red">*</span>
              </label>
              <Input
                id="edit-res-end"
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-res-attendees"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              <Users className="inline-block h-4 w-4 mr-1 -mt-0.5" />
              Número de asistentes
            </label>
            <Input
              id="edit-res-attendees"
              type="number"
              min={1}
              max={space.capacity}
              value={form.attendees}
              onChange={(e) =>
                setForm({
                  ...form,
                  attendees: Number.parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-32"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Capacidad máxima del espacio: {space.capacity} personas.
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-res-notes"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              <MessageSquare className="inline-block h-4 w-4 mr-1 -mt-0.5" />
              Notas administrativas
            </label>
            <Textarea
              id="edit-res-notes"
              rows={2}
              maxLength={500}
              value={form.adminNotes}
              onChange={(e) =>
                setForm({ ...form, adminNotes: e.target.value })
              }
              placeholder="Justificación del cambio (se incluirá en el email al usuario)"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-danger-500/20 bg-danger-50 p-3 text-sm text-danger-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <Link href={`/admin/reservations/${reservationId}`}>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
