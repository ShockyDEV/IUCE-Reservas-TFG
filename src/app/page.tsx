import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6">
          <Image
            src="/images/iuce-logo.png"
            alt="IUCE - Instituto Universitario de Ciencias de la Educación"
            width={160}
            height={64}
            className="h-14 w-auto"
            priority
          />
          <Link
            href="/auth/signin"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pt-20 pb-24">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Gestión de espacios del IUCE
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl">
            Reserva aulas, salas de reuniones y laboratorios del Instituto
            Universitario de Ciencias de la Educación de la Universidad de
            Salamanca.
          </p>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Aula 17A", code: "IUCE-17A", capacity: 40, img: "/images/spaces/aula-17a.jpg" },
              { name: "Aula 12A", code: "IUCE-12A", capacity: 25, img: "/images/spaces/aula-12a.jpg" },
              { name: "Laboratorio", code: "IUCE-LAB", capacity: 20, img: "/images/spaces/laboratorio.jpg" },
              { name: "Sala de Usos Múltiples", code: "IUCE-SUM", capacity: 60, img: "/images/spaces/sala-usos-multiples.jpg" },
            ].map((space) => (
              <div
                key={space.code}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  <Image
                    src={space.img}
                    alt={space.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm">{space.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {space.code} · {space.capacity} personas
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-4">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Acceder con cuenta USAL →
            </Link>
            <Link
              href="/spaces"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ver catálogo completo
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-5xl px-6 text-sm text-gray-500">
          IUCE · Universidad de Salamanca
        </div>
      </footer>
    </main>
  );
}
