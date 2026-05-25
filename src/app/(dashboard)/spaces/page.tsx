import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Accessibility, Users, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSpaceImage } from "@/lib/space-images";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Catálogo de espacios" };

export default async function SpacesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const spaces = await prisma.space.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div>
        <Badge variant="info">Catálogo</Badge>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Espacios del IUCE
        </h1>
        <p className="mt-2 text-sm text-gray-500 max-w-2xl">
          Selecciona un espacio para ver su detalle, su equipamiento y solicitar
          una reserva.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => {
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
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
