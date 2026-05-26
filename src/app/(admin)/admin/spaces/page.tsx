"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users as UsersIcon,
  Accessibility,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Space {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  capacity: number;
  floor?: number | null;
  building: string;
  equipment: string;
  accessibility: boolean;
  color: string;
  imageUrl?: string | null;
  isActive: boolean;
}

interface FormState {
  name: string;
  code: string;
  description: string;
  capacity: number;
  floor: number | "";
  building: string;
  equipment: string;
  accessibility: boolean;
  color: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  code: "",
  description: "",
  capacity: 20,
  floor: "",
  building: "IUCE",
  equipment: "",
  accessibility: false,
  color: "#3B7DD8",
};

function parseEquipment(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function AdminSpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSpaces = () => {
    setLoading(true);
    fetch("/api/spaces")
      .then((r) => r.json())
      .then((data) => setSpaces(data))
      .catch(() => toast.error("Error cargando espacios"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowCreate(true);
  };

  const openEdit = (s: Space) => {
    setShowCreate(false);
    setEditing(s.id);
    setForm({
      name: s.name,
      code: s.code,
      description: s.description ?? "",
      capacity: s.capacity,
      floor: s.floor ?? "",
      building: s.building,
      equipment: parseEquipment(s.equipment).join(", "),
      accessibility: s.accessibility,
      color: s.color,
    });
  };

  const cancel = () => {
    setEditing(null);
    setShowCreate(false);
    setForm(EMPTY_FORM);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      capacity: Number(form.capacity),
      floor: form.floor === "" ? undefined : Number(form.floor),
      building: form.building.trim() || "IUCE",
      equipment: form.equipment
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      accessibility: form.accessibility,
      color: form.color,
    };

    try {
      const url = editing
        ? `/api/admin/spaces/${editing}`
        : "/api/admin/spaces";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al guardar el espacio");
        return;
      }
      toast.success(editing ? "Espacio actualizado" : "Espacio creado");
      cancel();
      fetchSpaces();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/spaces/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al desactivar");
        return;
      }
      toast.success("Espacio desactivado");
      fetchSpaces();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeleting(null);
    }
  };

  const formOpen = showCreate || editing !== null;

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
          <h1 className="text-2xl font-bold text-gray-900">Espacios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona el catálogo de espacios reservables del IUCE.
          </p>
        </div>
        {!formOpen && (
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo Espacio
          </Button>
        )}
      </div>

      {formOpen && (
        <Card className="border-brand-200 bg-brand-50/30">
          <CardHeader>
            <CardTitle className="text-base">
              {editing ? "Editar espacio" : "Nuevo espacio"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="sp-name" className="text-xs font-medium text-gray-600">
                    Nombre *
                  </label>
                  <input
                    id="sp-name"
                    type="text"
                    required
                    minLength={3}
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sp-code" className="text-xs font-medium text-gray-600">
                    Código *
                  </label>
                  <input
                    id="sp-code"
                    type="text"
                    required
                    minLength={2}
                    maxLength={40}
                    pattern="[A-Za-z0-9-]+"
                    placeholder="IUCE-12A"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sp-desc" className="text-xs font-medium text-gray-600">
                  Descripción
                </label>
                <textarea
                  id="sp-desc"
                  rows={2}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="sp-cap" className="text-xs font-medium text-gray-600">
                    Aforo *
                  </label>
                  <input
                    id="sp-cap"
                    type="number"
                    required
                    min={1}
                    max={1000}
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sp-floor" className="text-xs font-medium text-gray-600">
                    Planta
                  </label>
                  <input
                    id="sp-floor"
                    type="number"
                    value={form.floor}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        floor: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sp-bld" className="text-xs font-medium text-gray-600">
                    Edificio
                  </label>
                  <input
                    id="sp-bld"
                    type="text"
                    maxLength={120}
                    value={form.building}
                    onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sp-color" className="text-xs font-medium text-gray-600">
                    Color
                  </label>
                  <input
                    id="sp-color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white px-1"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sp-eq" className="text-xs font-medium text-gray-600">
                  Equipamiento (separado por comas)
                </label>
                <input
                  id="sp-eq"
                  type="text"
                  placeholder="Proyector, pizarra, videoconferencia"
                  value={form.equipment}
                  onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.accessibility}
                  onChange={(e) => setForm((f) => ({ ...f, accessibility: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-400"
                />
                Accesible para personas con movilidad reducida
              </label>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={cancel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : editing ? (
                    "Guardar cambios"
                  ) : (
                    "Crear espacio"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : spaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Building2 className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No hay espacios registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((s) => {
            const eq = parseEquipment(s.equipment);
            return (
              <Card key={s.id} className="overflow-hidden">
                <div className="h-1.5 w-full" style={{ backgroundColor: s.color }} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{s.name}</h3>
                      <p className="text-xs text-gray-400 font-mono">{s.code}</p>
                    </div>
                    {s.accessibility && (
                      <Badge variant="info">
                        <Accessibility className="h-3 w-3" />
                        Accesible
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" /> {s.capacity}
                    </span>
                    <span>·</span>
                    <span>{s.building}</span>
                    {s.floor != null && (
                      <>
                        <span>·</span>
                        <span>P{s.floor}</span>
                      </>
                    )}
                  </div>
                  {eq.length > 0 && (
                    <p className="text-[11px] text-gray-400 truncate mb-3">
                      {eq.join(" · ")}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-danger-500 hover:text-danger-700 hover:bg-danger-50"
                      onClick={() => deactivate(s.id)}
                      disabled={deleting === s.id}
                    >
                      {deleting === s.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-danger-300 border-t-danger-600" />
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 mr-1" /> Desactivar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
