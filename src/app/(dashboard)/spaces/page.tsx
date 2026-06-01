import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { SpacesCatalog, type SpaceCard } from "./spaces-catalog";

export const metadata = { title: "Catálogo de espacios" };

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

export default async function SpacesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const raw = await prisma.space.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const spaces: SpaceCard[] = raw.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    description: s.description,
    capacity: s.capacity,
    floor: s.floor,
    building: s.building,
    equipment: parseEquipment(s.equipment),
    accessibility: s.accessibility,
    color: s.color,
    imageUrl: s.imageUrl,
  }));

  // El catálogo de equipamiento se infiere de los datos reales para que
  // los administradores puedan añadir nuevos elementos desde la gestión
  // de espacios sin tener que tocar código.
  const equipmentSet = new Set<string>();
  spaces.forEach((s) => s.equipment.forEach((eq) => equipmentSet.add(eq)));
  const equipmentOptions = Array.from(equipmentSet).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div>
        <Badge variant="info">Catálogo</Badge>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Espacios del IUCE
        </h1>
        <p className="mt-2 text-sm text-gray-500 max-w-2xl">
          Selecciona un espacio para ver su detalle, su equipamiento y solicitar
          una reserva. Usa los filtros para encontrar rápidamente el espacio
          adecuado a tus necesidades.
        </p>
      </div>

      <SpacesCatalog spaces={spaces} equipmentOptions={equipmentOptions} />
    </div>
  );
}
