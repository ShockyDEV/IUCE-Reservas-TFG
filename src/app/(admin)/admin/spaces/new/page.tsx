"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SpaceForm, type SpaceFormValues } from "../space-form";

const DEFAULT_VALUES: SpaceFormValues = {
  name: "",
  code: "",
  description: "",
  capacity: 10,
  floor: 0,
  building: "IUCE",
  equipment: [],
  accessibility: false,
  color: "#3B7DD8",
  imageUrl: "",
  isActive: true,
};

export default function NewSpacePage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Nuevo espacio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Da de alta un nuevo espacio reservable del IUCE.
        </p>
      </div>

      <SpaceForm initialValues={DEFAULT_VALUES} mode="create" />
    </div>
  );
}
