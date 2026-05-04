import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSpaceImage } from "@/lib/space-images";

export const metadata = { title: "Detalle del espacio" };

export default async function SpaceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const space = await prisma.space.findUnique({
    where: { id: params.id },
  });

  if (!space || !space.isActive) {
    notFound();
  }

  const equipment: string[] = (() => {
    try {
      const eq = space.equipment as unknown;
      if (typeof eq === "string") return JSON.parse(eq);
      if (Array.isArray(eq)) return eq;
      return [];
    } catch {
      return [];
    }
  })();

  const imgSrc = space.imageUrl || getSpaceImage(space.name, space.code);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/images/iuce-logo.png"
              alt="IUCE"
              width={120}
              height={48}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/spaces" className="text-gray-600 hover:text-gray-900">
              ← Volver al catálogo
            </Link>
          </nav>
        </div>
      </header>

      <section className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="relative aspect-[16/9] bg-gray-100">
              {imgSrc && (
                <Image
                  src={imgSrc}
                  alt={space.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                  priority
                />
              )}
            </div>
            <div className="p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {space.name}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">{space.code}</p>
                </div>
                {space.accessibility && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Espacio accesible
                  </span>
                )}
              </div>

              {space.description && (
                <p className="mt-6 text-gray-700 leading-relaxed">
                  {space.description}
                </p>
              )}

              <dl className="mt-8 grid gap-6 sm:grid-cols-3 border-t border-gray-100 pt-6">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Capacidad
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">
                    {space.capacity} personas
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Planta
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">
                    {space.floor !== null ? `Planta ${space.floor}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Edificio
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">
                    {space.building}
                  </dd>
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
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-10 border-t border-gray-100 pt-6">
                <Link
                  href={`/spaces/${space.id}/reserve`}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Reservar este espacio
                </Link>
                <p className="mt-2 text-xs text-gray-500">
                  Tu solicitud quedará en estado pendiente hasta su aprobación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
