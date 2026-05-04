"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Space {
  id: string;
  name: string;
  code: string;
  capacity: number;
}

export default function ReservePage({ params }: { params: { id: string } }) {
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
        setError(data.error || "Error al crear la reserva");
        return;
      }

      router.push("/dashboard?reserved=1");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href={`/spaces/${params.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver al espacio
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Solicitar reserva
        </h1>
        {space && (
          <p className="mt-1 text-sm text-gray-500">
            {space.name} · {space.code} · capacidad {space.capacity} personas
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-lg border border-gray-200 bg-white p-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Título *
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Seminario de investigación"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Describe brevemente el uso del espacio (opcional)"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha *
            </label>
            <input
              type="date"
              required
              min={today}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hora inicio *
              </label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hora fin *
              </label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) =>
                  setForm({ ...form, endTime: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Número de asistentes
            </label>
            <input
              type="number"
              min={1}
              max={space?.capacity || 500}
              value={form.attendees}
              onChange={(e) =>
                setForm({ ...form, attendees: parseInt(e.target.value) || 1 })
              }
              className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <Link
              href={`/spaces/${params.id}`}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {loading ? "Enviando..." : "Solicitar reserva"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
