import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSpaceImage } from "@/lib/space-images";

export const metadata = { title: "Catálogo de espacios" };

export default async function SpacesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const spaces = await prisma.space.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

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
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Mi panel
            </Link>
            <Link href="/spaces" className="font-medium text-blue-600">
              Espacios
            </Link>
          </nav>
        </div>
      </header>

      <section className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Espacios del IUCE
          </h1>
          <p className="mt-3 text-gray-600">
            Selecciona un espacio para ver su detalle y disponibilidad.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => {
              const imgSrc = space.imageUrl || getSpaceImage(space.name, space.code);
              return (
                <Link
                  key={space.id}
                  href={`/spaces/${space.id}`}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] bg-gray-100">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={space.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {space.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {space.code}
                        </p>
                      </div>
                      {space.accessibility && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          Accesible
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-gray-500">
                      Capacidad: {space.capacity} personas
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
