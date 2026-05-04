import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;

  const reservations = await prisma.reservation.findMany({
    where: { userId: user.id },
    include: {
      space: { select: { name: true, code: true, color: true } },
    },
    orderBy: { startTime: "desc" },
    take: 5,
  });

  const formatter = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const statusLabel: Record<string, string> = {
    PENDING: "Pendiente",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
  };

  const statusClass: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-green-50 text-green-700",
    REJECTED: "bg-red-50 text-red-700",
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/iuce-logo.png"
              alt="IUCE"
              width={120}
              height={48}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <section className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user.name || user.email}
          </h1>
          <p className="mt-4 text-gray-600">
            Has iniciado sesión como <strong>{user.email}</strong>.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/spaces"
              className="rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-md"
            >
              <h2 className="font-semibold text-gray-900">
                Catálogo de espacios
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Consulta los espacios disponibles del IUCE.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-blue-600">
                Ver espacios →
              </span>
            </Link>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900">Mis reservas</h2>
              <p className="mt-2 text-sm text-gray-500">
                Últimas solicitudes que has enviado al IUCE.
              </p>
              {reservations.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">
                  Todavía no has solicitado ninguna reserva.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {reservations.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {r.title}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {r.space.name} · {formatter.format(r.startTime)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusClass[r.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusLabel[r.status] || r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
