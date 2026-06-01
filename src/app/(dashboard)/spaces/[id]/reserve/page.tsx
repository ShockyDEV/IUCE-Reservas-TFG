"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  color?: string;
}

export default function ReservePage({ params }: Readonly<{ params: { id: string } }>) {
  const router = useRouter();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    attendees: 1,
  });

  useEffect(() => {
    fetch(`/api/spaces/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Espacio no encontrado");
        return r.json();
      })
      .then((data) => setSpace(data))
      .catch(() => setError("No se pudo cargar el espacio"));
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title || !form.date || !form.startTime || !form.endTime) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    if (form.startTime >= form.endTime) {
      setError("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    if (space && form.attendees > space.capacity) {
      setError(`Máximo ${space.capacity} asistentes para este espacio`);
      return;
    }

    setLoading(true);
    try {
      const startTime = new Date(`${form.date}T${form.startTime}:00`).toISOString();
      const endTime = new Date(`${form.date}T${form.endTime}:00`).toISOString();

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          spaceId: params.id,
          startTime,
          endTime,
          attendees: form.attendees,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const message = data.error || "Error al crear la reserva";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success("Solicitud de reserva enviada");
      router.push("/dashboard?reserved=1");
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
        href={`/spaces/${params.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al espacio
      </Link>

      <div className="mt-6">
        <Badge variant="info">Nueva solicitud</Badge>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Solicitar reserva</h1>
        {space && (
          <p className="mt-1.5 text-sm text-gray-500 flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {space.name} · {space.code} · capacidad {space.capacity} personas
          </p>
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Datos de la reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reserve-title" className="block text-sm font-medium text-gray-700 mb-1.5">
                Título <span className="text-usal-red">*</span>
              </label>
              <Input
                id="reserve-title"
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: Seminario de investigación"
              />
            </div>

            <div>
              <label htmlFor="reserve-desc" className="block text-sm font-medium text-gray-700 mb-1.5">
                Descripción
              </label>
              <Textarea
                id="reserve-desc"
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
              <label htmlFor="reserve-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                <CalendarDays className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                Fecha <span className="text-usal-red">*</span>
              </label>
              <Input
                id="reserve-date"
                type="date"
                required
                min={today}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reserve-start" className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Clock className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                  Hora inicio <span className="text-usal-red">*</span>
                </label>
                <Input
                  id="reserve-start"
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="reserve-end" className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Clock className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                  Hora fin <span className="text-usal-red">*</span>
                </label>
                <Input
                  id="reserve-end"
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reserve-attendees" className="block text-sm font-medium text-gray-700 mb-1.5">
                <Users className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                Número de asistentes
              </label>
              <Input
                id="reserve-attendees"
                type="number"
                min={1}
                max={space?.capacity || 500}
                value={form.attendees}
                onChange={(e) =>
                  setForm({ ...form, attendees: Number.parseInt(e.target.value, 10) || 1 })
                }
                className="w-32"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-danger-500/20 bg-danger-50 p-3 text-sm text-danger-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <Link href={`/spaces/${params.id}`}>
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
