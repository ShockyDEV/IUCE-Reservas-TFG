import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarCheck, Building2, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstitutionalFooter } from "@/components/layout/institutional-footer";
import { prisma } from "@/lib/prisma";
import { getSpaceImage } from "@/lib/space-images";

// Los espacios salen de la base de datos en cada visita: lo que se cambia en
// Admin → Espacios (capacidad, nombre, imagen, activo) se ve aquí sin recompilar.
export const dynamic = "force-dynamic";

/** Si la BD no responde, la portada se muestra igual, sin las tarjetas. */
async function getHomeSpaces() {
  try {
    return await prisma.space.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { name: true, code: true, capacity: true, imageUrl: true },
    });
  } catch (error) {
    console.error("[home] No se pudieron cargar los espacios", error);
    return [];
  }
}

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Reservas en un clic",
    text: "Solicita la franja horaria que necesites y recibe la confirmación en tu correo institucional.",
  },
  {
    icon: Building2,
    title: "Catálogo completo",
    text: "Consulta todos los espacios del IUCE con sus características, capacidad y equipamiento.",
  },
  {
    icon: Users,
    title: "Aprobación administrativa",
    text: "El equipo del IUCE revisa cada solicitud para garantizar una asignación coherente.",
  },
  {
    icon: ShieldCheck,
    title: "Acceso institucional",
    text: "Usa tu cuenta @usal.es. Sin registros adicionales, sin contraseñas que recordar.",
  },
];

export default async function HomePage() {
  const spaces = await getHomeSpaces();

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50/50 to-white">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Image
            src="/images/iuce-logo.png"
            alt="IUCE - Instituto Universitario de Ciencias de la Educación"
            width={160}
            height={64}
            className="h-12 w-auto"
            priority
          />
          <Link href="/auth/signin">
            <Button>
              Iniciar sesión
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <section className="flex-1">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-12">
          <div className="max-w-3xl">
            <Badge variant="info">IUCE · Universidad de Salamanca</Badge>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Gestión de espacios <br className="hidden sm:inline" />
              <span className="text-iuce-blue-dark">del IUCE</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
              Reserva aulas, salas de reuniones y laboratorios del Instituto
              Universitario de Ciencias de la Educación de la Universidad de
              Salamanca. Solicita en segundos, recibe la confirmación por correo
              y consulta tus reservas desde un único panel.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/auth/signin">
                <Button size="lg">
                  Acceder con cuenta USAL
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/spaces">
                <Button size="lg" variant="secondary">
                  Ver catálogo completo
                </Button>
              </Link>
            </div>
          </div>

          {spaces.length > 0 ? (
            <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {spaces.map((space) => {
                const imgSrc = space.imageUrl || getSpaceImage(space.name, space.code);
                return (
                  <Card key={space.code} className="overflow-hidden">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={space.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 pt-4">
                      <h3 className="font-semibold text-gray-900">{space.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {space.code} · {space.capacity} personas
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}

          <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title}>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-iuce-blue-pale text-iuce-blue-dark">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <InstitutionalFooter />
    </main>
  );
}
