"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft, CalendarOff, Plus, Trash2, Building2, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BlockedSlot {
  id: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: string;
  space: { name: string; code: string; color: string };
  createdBy: { name: string };
}

interface Space {
  id: string;
  name: string;
  code: string;
  color: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BlockedSlotsPage() {
  const [slots, setSlots] = useState<BlockedSlot[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterSpace, setFilterSpace] = useState("");
  const [form, setForm] = useState({
    spaceId: "",
    reason: "",
    startDate: "",
    startTime: "08:00",
    endDate: "",
    endTime: "21:00",
  });

  const fetchSlots = () => {
    const url = filterSpace
      ? `/api/admin/blocked-slots?spaceId=${filterSpace}`
      : "/api/admin/blocked-slots";
    fetch(url)
      .then((r) => r.json())
      .then(setSlots)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/spaces")
      .then((r) => r.json())
      .then((s) => {
        setSpaces(
          (s as Space[]).map((sp) => ({
            id: sp.id,
            name: sp.name,
            code: sp.code,
            color: sp.color,
          }))
        );
      })
      .catch(() => {});
    fetchSlots();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSlots();
  }, [filterSpace]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.spaceId || !form.reason || !form.startDate || !form.endDate) {
      toast.error("Completa todos los campos");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: form.spaceId,
          reason: form.reason,
          startTime: `${form.startDate}T${form.startTime}:00`,
          endTime: `${form.endDate}T${form.endTime}:00`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al crear");
        return;
      }
      if (data.warnings) toast(data.warnings, { icon: "⚠️", duration: 5000 });
      toast.success("Bloqueo creado");
      setShowForm(false);
      setForm({
        spaceId: "",
        reason: "",
        startDate: "",
        startTime: "08:00",
        endDate: "",
        endTime: "21:00",
      });
      fetchSlots();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/blocked-slots?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Error al eliminar");
        return;
      }
      toast.success("Bloqueo eliminado");
      setSlots((s) => s.filter((sl) => sl.id !== id));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-usal-red" />
            <span className="text-xs font-medium text-usal-red uppercase tracking-wider">
              Administración
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bloqueos de Calendario
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona bloqueos por mantenimiento, festivos u otros motivos.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <CalendarOff className="h-4 w-4" /> Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Nuevo Bloqueo
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="border-brand-200 bg-brand-50/30">
          <CardHeader>
            <CardTitle className="text-base">Crear Bloqueo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="bs-space"
                    className="text-xs font-medium text-gray-600"
                  >
                    Espacio *
                  </label>
                  <select
                    id="bs-space"
                    value={form.spaceId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, spaceId: e.target.value }))
                    }
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    required
                  >
                    <option value="">Seleccionar espacio...</option>
                    {spaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="bs-reason"
                    className="text-xs font-medium text-gray-600"
                  >
                    Motivo *
                  </label>
                  <input
                    id="bs-reason"
                    type="text"
                    value={form.reason}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reason: e.target.value }))
                    }
                    placeholder="Ej: Mantenimiento, Evento institucional..."
                    required
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="bs-sd"
                    className="text-xs font-medium text-gray-600"
                  >
                    Fecha inicio *
                  </label>
                  <input
                    id="bs-sd"
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                        endDate: f.endDate || e.target.value,
                      }))
                    }
                    required
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="bs-st"
                    className="text-xs font-medium text-gray-600"
                  >
                    Hora inicio
                  </label>
                  <input
                    id="bs-st"
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startTime: e.target.value }))
                    }
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="bs-ed"
                    className="text-xs font-medium text-gray-600"
                  >
                    Fecha fin *
                  </label>
                  <input
                    id="bs-ed"
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                    required
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="bs-et"
                    className="text-xs font-medium text-gray-600"
                  >
                    Hora fin
                  </label>
                  <input
                    id="bs-et"
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endTime: e.target.value }))
                    }
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Crear Bloqueo
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <label
          htmlFor="filter-space"
          className="text-xs font-medium text-gray-500"
        >
          Filtrar por espacio:
        </label>
        <select
          id="filter-space"
          value={filterSpace}
          onChange={(e) => setFilterSpace(e.target.value)}
          className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="">Todos los espacios</option>
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          {slots.length} bloqueo{slots.length !== 1 && "s"} activo
          {slots.length !== 1 && "s"}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : slots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CalendarOff className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No hay bloqueos activos</p>
            <p className="text-xs text-gray-400 mt-1">
              Los bloqueos pasados se eliminan automáticamente de la vista.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => (
            <Card key={slot.id} className="overflow-hidden">
              <div className="flex">
                <div className="w-1.5 flex-shrink-0 bg-danger-500" />
                <CardContent className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: slot.space.color + "15",
                            color: slot.space.color,
                          }}
                        >
                          <Building2 className="h-3 w-3" /> {slot.space.name}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {slot.reason}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {fmt(slot.startTime)} {fmtTime(slot.startTime)} –{" "}
                          {fmt(slot.endTime)} {fmtTime(slot.endTime)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Creado por {slot.createdBy.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-500 hover:text-danger-700 hover:bg-danger-50 flex-shrink-0"
                      onClick={() => handleDelete(slot.id)}
                      disabled={deleting === slot.id}
                    >
                      {deleting === slot.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-danger-300 border-t-danger-600" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
