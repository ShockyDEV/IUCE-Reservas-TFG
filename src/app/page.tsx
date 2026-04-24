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
              { name: "Aula 17A", capacity: 30 },
              { name: "Aula 12A", capacity: 25 },
              { name: "Laboratorio", capacity: 20 },
              { name: "Sala de Usos Múltiples", capacity: 40 },
            ].map((space) => (
              <div
                key={space.name}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <h3 className="font-semibold text-gray-900">{space.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Capacidad: {space.capacity}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Acceder con cuenta USAL →
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
