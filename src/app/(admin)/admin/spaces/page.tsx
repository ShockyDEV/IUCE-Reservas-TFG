"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Building2,
  Users as UsersIcon,
  Accessibility,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  equipment: unknown;
  accessibility: boolean;
  color: string;
  imageUrl?: string | null;
  isActive: boolean;
}

function parseEquipment(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      // ignored
    }
  }
  return [];
}

export default function AdminSpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/spaces")
      .then((r) => r.json())
      .then((data) => setSpaces(data))
      .catch(() => toast.error("Error cargando espacios"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-usal-red" />
            <span className="text-xs font-medium text-usal-red uppercase tracking-wider">
              Administración
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Espacios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona el catálogo de espacios reservables del IUCE. Crea nuevos
            espacios o edita los existentes, incluyendo equipamiento,
            accesibilidad y estado.
          </p>
        </div>
        <Link href="/admin/spaces/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" /> Nuevo espacio
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : spaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Building2 className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No hay espacios registrados</p>
            <Link href="/admin/spaces/new" className="mt-3">
              <Button size="sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Crear el primero
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((s) => {
            const eq = parseEquipment(s.equipment);
            return (
              <Link key={s.id} href={`/admin/spaces/${s.id}`} className="group">
                <Card className="overflow-hidden h-full transition-all hover:shadow-md hover:border-iuce-blue/30">
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-iuce-blue transition-colors">
                          {s.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">
                          {s.code}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {s.accessibility && (
                          <Badge variant="info">
                            <Accessibility className="h-3 w-3" />
                            Accesible
                          </Badge>
                        )}
                        {!s.isActive && (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </div>
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
                    <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1 text-xs text-iuce-blue">
                        <Pencil className="h-3 w-3" /> Editar
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
