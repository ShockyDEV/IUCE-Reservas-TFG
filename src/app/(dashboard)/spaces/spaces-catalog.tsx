"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Accessibility,
  Users,
  MapPin,
  X,
  Filter,
  CalendarCheck,
  Clock,
  CalendarSearch,
} from "lucide-react";
import { getSpaceImage } from "@/lib/space-images";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SpaceCard {
  id: string;
  name: string;
  code: string;
  description: string | null;
  capacity: number;
  floor: number | null;
  building: string;
  equipment: string[];
  accessibility: boolean;
  color: string;
  imageUrl: string | null;
}

interface SpacesCatalogProps {
  spaces: SpaceCard[];
  equipmentOptions: string[];
}

/**
 * Comprueba que los tres campos de disponibilidad estén rellenos y formen
 * una franja válida (fin posterior a inicio). Si no lo está, devuelve
 * `null` y el filtro queda inactivo.
 */
function buildAvailabilityRange(
  date: string,
  startTime: string,
  endTime: string,
): { startISO: string; endISO: string } | null {
  if (!date || !startTime || !endTime) return null;
  if (startTime >= endTime) return null;
  const startDate = new Date(`${date}T${startTime}:00`);
  const endDate = new Date(`${date}T${endTime}:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  return {
    startISO: startDate.toISOString(),
    endISO: endDate.toISOString(),
  };
}

export function SpacesCatalog({ spaces, equipmentOptions }: Readonly<SpacesCatalogProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCapacity =
    Number.parseInt(searchParams.get("capacity") ?? "0", 10) || 0;
  const initialAccessibility = searchParams.get("accessibility") === "1";
  const initialEquipment = (searchParams.get("equipment") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const [minCapacity, setMinCapacity] = useState<number>(initialCapacity);
  const [accessibilityOnly, setAccessibilityOnly] = useState(initialAccessibility);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(initialEquipment);

  // ----- Filtro de disponibilidad por franja -----
  const [availDate, setAvailDate] = useState<string>(
    searchParams.get("avDate") ?? "",
  );
  const [availStart, setAvailStart] = useState<string>(
    searchParams.get("avFrom") ?? "",
  );
  const [availEnd, setAvailEnd] = useState<string>(
    searchParams.get("avTo") ?? "",
  );
  const [busySpaceIds, setBusySpaceIds] = useState<Set<string> | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Sincroniza el estado de filtros con la URL para que se pueda compartir.
  useEffect(() => {
    const params = new URLSearchParams();
    if (minCapacity > 0) params.set("capacity", String(minCapacity));
    if (accessibilityOnly) params.set("accessibility", "1");
    if (selectedEquipment.length > 0) params.set("equipment", selectedEquipment.join(","));
    if (availDate) params.set("avDate", availDate);
    if (availStart) params.set("avFrom", availStart);
    if (availEnd) params.set("avTo", availEnd);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/spaces", { scroll: false });
  }, [
    minCapacity,
    accessibilityOnly,
    selectedEquipment,
    availDate,
    availStart,
    availEnd,
    router,
  ]);

  // Llama al endpoint de disponibilidad cada vez que la franja sea válida.
  // Se aplica un pequeño debounce para no machacar la API mientras el
  // usuario sigue tecleando la hora.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const range = buildAvailabilityRange(availDate, availStart, availEnd);
    if (!range) {
      setBusySpaceIds(null);
      setAvailabilityError(null);
      setAvailabilityLoading(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setAvailabilityLoading(true);
      setAvailabilityError(null);
      try {
        const res = await fetch(
          `/api/spaces/availability?startTime=${encodeURIComponent(
            range.startISO,
          )}&endTime=${encodeURIComponent(range.endISO)}`,
        );
        const data = await res.json();
        if (!res.ok) {
          setBusySpaceIds(null);
          setAvailabilityError(
            data.error || "No se pudo consultar la disponibilidad",
          );
          return;
        }
        const ids: string[] = Array.isArray(data.busySpaceIds)
          ? data.busySpaceIds
          : [];
        setBusySpaceIds(new Set(ids));
      } catch {
        setBusySpaceIds(null);
        setAvailabilityError("Error de conexión con el servidor");
      } finally {
        setAvailabilityLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [availDate, availStart, availEnd]);

  const filtered = useMemo(() => {
    return spaces.filter((s) => {
      if (minCapacity > 0 && s.capacity < minCapacity) return false;
      if (accessibilityOnly && !s.accessibility) return false;
      if (selectedEquipment.length > 0) {
        const has = selectedEquipment.every((eq) => s.equipment.includes(eq));
        if (!has) return false;
      }
      if (busySpaceIds?.has(s.id)) return false;
      return true;
    });
  }, [spaces, minCapacity, accessibilityOnly, selectedEquipment, busySpaceIds]);

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const resetFilters = () => {
    setMinCapacity(0);
    setAccessibilityOnly(false);
    setSelectedEquipment([]);
    setAvailDate("");
    setAvailStart("");
    setAvailEnd("");
  };

  const hasFilters =
    minCapacity > 0 ||
    accessibilityOnly ||
    selectedEquipment.length > 0 ||
    availDate !== "" ||
    availStart !== "" ||
    availEnd !== "";

  // Estado textual del filtro de disponibilidad para el badge informativo.
  const availabilityActive = busySpaceIds !== null;
  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <Card className="mt-8">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Filter className="h-4 w-4 text-iuce-blue" />
              Filtros
              <span className="text-xs text-gray-500 font-normal">
                ({filtered.length} de {spaces.length} espacios)
              </span>
            </h2>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-3.5 w-3.5 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <label
                htmlFor="capacity"
                className="text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Capacidad mínima
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="capacity"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minCapacity}
                  onChange={(e) =>
                    setMinCapacity(Number.parseInt(e.target.value, 10) || 0)
                  }
                  className="flex-1 accent-iuce-blue"
                />
                <Input
                  type="number"
                  min={0}
                  max={500}
                  value={minCapacity}
                  onChange={(e) =>
                    setMinCapacity(Number.parseInt(e.target.value, 10) || 0)
                  }
                  className="h-9 w-20 text-xs"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {minCapacity > 0 ? `Al menos ${minCapacity} personas` : "Sin mínimo"}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equipamiento
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {equipmentOptions.length === 0 ? (
                  <span className="text-[11px] text-gray-400">
                    Sin equipamiento registrado
                  </span>
                ) : (
                  equipmentOptions.map((opt) => {
                    const checked = selectedEquipment.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleEquipment(opt)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                          checked
                            ? "border-iuce-blue bg-iuce-blue-pale text-iuce-blue-dark"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Accesibilidad
              </span>
              <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={accessibilityOnly}
                  onChange={(e) => setAccessibilityOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-iuce-blue focus:ring-iuce-blue"
                />
                <span>Solo espacios accesibles</span>
              </label>
            </div>
          </div>

          {/* Sección de disponibilidad por franja */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <CalendarSearch className="h-3.5 w-3.5 text-iuce-blue" />
                Disponibilidad por franja
              </span>
              {availabilityActive && (
                <Badge variant="success">
                  <CalendarCheck className="h-3 w-3" />
                  Filtrando por disponibilidad
                </Badge>
              )}
              {availabilityLoading && (
                <span className="text-[11px] text-gray-400">
                  Consultando…
                </span>
              )}
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="avail-date"
                  className="block text-[11px] text-gray-500 mb-1"
                >
                  Fecha
                </label>
                <Input
                  id="avail-date"
                  type="date"
                  min={today}
                  value={availDate}
                  onChange={(e) => setAvailDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label
                  htmlFor="avail-start"
                  className="block text-[11px] text-gray-500 mb-1"
                >
                  <Clock className="inline-block h-3 w-3 mr-1 -mt-0.5" />
                  Hora desde
                </label>
                <Input
                  id="avail-start"
                  type="time"
                  value={availStart}
                  onChange={(e) => setAvailStart(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label
                  htmlFor="avail-end"
                  className="block text-[11px] text-gray-500 mb-1"
                >
                  <Clock className="inline-block h-3 w-3 mr-1 -mt-0.5" />
                  Hora hasta
                </label>
                <Input
                  id="avail-end"
                  type="time"
                  value={availEnd}
                  onChange={(e) => setAvailEnd(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            {availabilityError && (
              <p className="mt-2 text-[11px] text-danger-700">
                {availabilityError}
              </p>
            )}
            <p className="mt-2 text-[11px] text-gray-400">
              Selecciona día, hora desde y hora hasta para ver solo los
              espacios libres en esa franja. Se descartan los espacios con
              reservas aprobadas o pendientes y los bloqueos administrativos.
            </p>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">
            {availabilityActive
              ? "Ningún espacio queda libre en la franja seleccionada con los filtros aplicados."
              : "Ningún espacio cumple los criterios seleccionados."}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((space) => {
            const imgSrc = space.imageUrl || getSpaceImage(space.name, space.code);
            return (
              <Link key={space.id} href={`/spaces/${space.id}`} className="group">
                <Card className="overflow-hidden h-full transition-all hover:shadow-md hover:border-iuce-blue/30">
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={space.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        Sin imagen
                      </div>
                    )}
                    <div
                      className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium shadow-sm"
                      style={{ color: space.color }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: space.color }}
                      />
                      {space.code}
                    </div>
                    {availabilityActive && (
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-success-50/95 px-2.5 py-1 text-[11px] font-medium text-success-700 shadow-sm">
                        <CalendarCheck className="h-3 w-3" />
                        Libre
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-gray-900 leading-tight">
                        {space.name}
                      </h3>
                      {space.accessibility && (
                        <Badge variant="success">
                          <Accessibility className="h-3 w-3" />
                          Accesible
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {space.capacity} personas
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5" />
                        Planta {space.floor ?? 0}
                      </div>
                    </div>
                    {space.equipment.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {space.equipment.slice(0, 3).map((eq) => (
                          <span
                            key={eq}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                          >
                            {eq}
                          </span>
                        ))}
                        {space.equipment.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                            +{space.equipment.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
