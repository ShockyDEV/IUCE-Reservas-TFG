"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Save,
  Plus,
  X,
  Building2,
  Accessibility,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PRESET_COLORS = [
  "#C8102E",
  "#1B3A5C",
  "#3B7DD8",
  "#12B76A",
  "#F79009",
  "#7C3AED",
  "#EC4899",
  "#0EA5E9",
];

export interface SpaceFormValues {
  id?: string;
  name: string;
  code: string;
  description: string;
  capacity: number;
  floor: number;
  building: string;
  equipment: string[];
  accessibility: boolean;
  color: string;
  imageUrl: string;
  isActive: boolean;
}

interface SpaceFormProps {
  initialValues: SpaceFormValues;
  mode: "create" | "edit";
}

export function SpaceForm({ initialValues, mode }: Readonly<SpaceFormProps>) {
  const router = useRouter();
  const [form, setForm] = useState<SpaceFormValues>(initialValues);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEquipment = () => {
    const item = equipmentInput.trim();
    if (item && !form.equipment.includes(item)) {
      setForm((f) => ({ ...f, equipment: [...f.equipment, item] }));
      setEquipmentInput("");
    }
  };

  const removeEquipment = (item: string) => {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.filter((e) => e !== item),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.name.trim().length < 3) {
      setError("El nombre debe tener al menos 3 caracteres");
      return;
    }
    if (form.code.trim().length < 2) {
      setError("El código debe tener al menos 2 caracteres");
      return;
    }
    if (form.capacity < 1) {
      setError("La capacidad debe ser al menos 1");
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      capacity: form.capacity,
      floor: form.floor,
      building: form.building.trim() || "IUCE",
      equipment: form.equipment,
      accessibility: form.accessibility,
      color: form.color,
      imageUrl: form.imageUrl.trim() || undefined,
    };
    if (mode === "edit") {
      payload.isActive = form.isActive;
    }

    try {
      const url =
        mode === "create"
          ? "/api/admin/spaces"
          : `/api/admin/spaces/${form.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.error || "Error al guardar el espacio";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(
        mode === "create" ? "Espacio creado" : "Espacio actualizado"
      );
      router.push("/admin/spaces");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!form.id) return;
    if (
      !confirm(
        `¿Desactivar el espacio «${form.name}»? Dejará de aparecer en el catálogo público.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/spaces/${form.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al desactivar");
        return;
      }
      toast.success("Espacio desactivado");
      router.push("/admin/spaces");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-iuce-blue" /> Información general
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="space-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre <span className="text-usal-red">*</span>
              </label>
              <Input
                id="space-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={3}
                maxLength={120}
                placeholder="Ej.: Aula 2.1 de informática"
              />
            </div>
            <div>
              <label htmlFor="space-code" className="block text-sm font-medium text-gray-700 mb-1.5">
                Código <span className="text-usal-red">*</span>
              </label>
              <Input
                id="space-code"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                required
                minLength={2}
                maxLength={40}
                placeholder="Ej.: A21"
                className="font-mono uppercase"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Solo letras, números y guiones. Debe ser único.
              </p>
            </div>
            <div>
              <label htmlFor="space-capacity" className="block text-sm font-medium text-gray-700 mb-1.5">
                Capacidad <span className="text-usal-red">*</span>
              </label>
              <Input
                id="space-capacity"
                type="number"
                min={1}
                max={1000}
                value={form.capacity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    capacity: Number.parseInt(e.target.value, 10) || 1,
                  })
                }
                required
              />
            </div>
            <div>
              <label htmlFor="space-floor" className="block text-sm font-medium text-gray-700 mb-1.5">
                Planta
              </label>
              <Input
                id="space-floor"
                type="number"
                value={form.floor}
                onChange={(e) =>
                  setForm({ ...form, floor: Number.parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
            <div>
              <label htmlFor="space-building" className="block text-sm font-medium text-gray-700 mb-1.5">
                Edificio
              </label>
              <Input
                id="space-building"
                value={form.building}
                onChange={(e) =>
                  setForm({ ...form, building: e.target.value })
                }
                maxLength={120}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="space-description" className="block text-sm font-medium text-gray-700 mb-1.5">
                Descripción
              </label>
              <Textarea
                id="space-description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                maxLength={500}
                placeholder="Características y uso habitual del espacio"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipamiento y accesibilidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="space-equipment" className="block text-sm font-medium text-gray-700 mb-1.5">
              Equipamiento
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                id="space-equipment"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEquipment();
                  }
                }}
                placeholder="Proyector, pizarra, videoconferencia…"
                maxLength={80}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEquipment}
                disabled={!equipmentInput.trim()}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Añadir
              </Button>
            </div>
            {form.equipment.length === 0 ? (
              <p className="text-xs text-gray-400">Sin equipamiento añadido.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {form.equipment.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-iuce-blue-pale text-iuce-blue-dark px-3 py-1 text-xs"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeEquipment(item)}
                      className="text-iuce-blue-dark/60 hover:text-iuce-blue-dark"
                      aria-label={`Eliminar ${item}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.accessibility}
              onChange={(e) =>
                setForm({ ...form, accessibility: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-iuce-blue focus:ring-iuce-blue"
            />
            <Accessibility className="h-4 w-4 text-gray-400" />
            Espacio accesible (PMR, rampas, ascensor)
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presentación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Color identificativo
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    form.color === c
                      ? "border-gray-900 scale-110"
                      : "border-white"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Usar color ${c}`}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-8 w-12 rounded border border-gray-200 cursor-pointer"
                title="Color personalizado"
                aria-label="Color personalizado"
              />
            </div>
          </div>
          <div>
            <label htmlFor="space-image-url" className="block text-sm font-medium text-gray-700 mb-1.5">
              URL de imagen (opcional)
            </label>
            <Input
              id="space-image-url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              maxLength={300}
              placeholder="/images/spaces/aula-21.jpg"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Si se deja en blanco, se usa la imagen por defecto del catálogo.
            </p>
          </div>
        </CardContent>
      </Card>

      {mode === "edit" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-iuce-blue focus:ring-iuce-blue"
              />
              Espacio activo en el catálogo
            </label>
            <p className="text-[11px] text-gray-400">
              Los espacios desactivados conservan su histórico pero no aparecen
              en `/spaces` ni se pueden reservar.
            </p>
            {form.isActive && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeactivate}
                disabled={saving}
                className="text-danger-700 border-danger-300 hover:bg-danger-50"
              >
                Desactivar espacio
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-lg border border-danger-500/20 bg-danger-50 p-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/spaces")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-1.5" />
          {saving
            ? "Guardando…"
            : mode === "create"
              ? "Crear espacio"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
