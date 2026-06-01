"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { parseEquipment } from "@/lib/format";
import { SpaceForm, type SpaceFormValues } from "../space-form";

export default function EditSpacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [values, setValues] = useState<SpaceFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/spaces/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          throw new Error((await r.json()).error || "Error al cargar");
        }
        return r.json();
      })
      .then((data) => {
        setValues({
          id: data.id,
          name: data.name,
          code: data.code,
          description: data.description ?? "",
          capacity: data.capacity,
          floor: data.floor ?? 0,
          building: data.building ?? "IUCE",
          equipment: parseEquipment(data.equipment),
          accessibility: !!data.accessibility,
          color: data.color ?? "#3B7DD8",
          imageUrl: data.imageUrl ?? "",
          isActive: data.isActive,
        });
      })
      .catch((err) => toast.error(err.message || "Error al cargar el espacio"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/admin/spaces"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a espacios
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-usal-red" />
          <span className="text-xs font-medium text-usal-red uppercase tracking-wider">
            Administración
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {values ? `Editar: ${values.name}` : "Editar espacio"}
        </h1>
      </div>

      {(() => {
        if (loading) {
          return (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            </div>
          );
        }
        if (values) {
          return <SpaceForm initialValues={values} mode="edit" />;
        }
        return <p className="text-sm text-gray-500">No se pudo cargar el espacio.</p>;
      })()}
    </div>
  );
}
