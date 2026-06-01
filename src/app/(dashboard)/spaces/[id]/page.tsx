import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Accessibility, Users, MapPin, Building, ArrowLeft, CalendarPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSpaceImage } from "@/lib/space-images";
import { parseEquipment } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Detalle del espacio" };

export default async function SpaceDetailPage({
  params,
}: Readonly<{
  params: { id: string };
}>) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const space = await prisma.space.findUnique({ where: { id: params.id } });
  if (!space?.isActive) notFound();

  const equipment = parseEquipment(space.equipment);

  const imgSrc = space.imageUrl || getSpaceImage(space.name, space.code);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Link
        href="/spaces"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <Card className="mt-6 overflow-hidden">
        <div className="relative aspect-[16/9] bg-gray-100">
          {imgSrc && (
            <Image
              src={imgSrc}
              alt={space.name}
              fill
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover"
              priority
            />
          )}
          <div className="absolute top-4 left-4">
            <Badge
              variant="default"
              className="bg-white/95 shadow-sm"
              style={{ color: space.color }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: space.color }}
              />
              {space.code}
            </Badge>
          </div>
        </div>

        <CardContent className="p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{space.name}</h1>
              {space.description && (
                <p className="mt-3 text-gray-600 leading-relaxed max-w-2xl">
                  {space.description}
                </p>
              )}
            </div>
            {space.accessibility && (
              <Badge variant="success">
                <Accessibility className="h-3 w-3" />
                Espacio accesible
              </Badge>
            )}
          </div>

          <dl className="mt-8 grid gap-6 sm:grid-cols-3 border-t border-gray-100 pt-6">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-iuce-blue mt-0.5" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Capacidad
                </dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">
                  {space.capacity} personas
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-iuce-blue mt-0.5" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Planta
                </dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">
                  {space.floor === null ? "—" : `Planta ${space.floor}`}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-iuce-blue mt-0.5" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Edificio
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 leading-tight">
                  {space.building}
                </dd>
              </div>
            </div>
          </dl>

          {equipment.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Equipamiento
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {equipment.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: space.color }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
            <Link href={`/spaces/${space.id}/reserve`}>
              <Button size="lg">
                <CalendarPlus className="h-4 w-4 mr-1.5" />
                Reservar este espacio
              </Button>
            </Link>
            <p className="text-xs text-gray-500">
              Tu solicitud quedará en estado <strong>Pendiente</strong> hasta su
              aprobación administrativa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
