import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;

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

          <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <p className="text-sm text-gray-600">
              Próximamente en este panel podrás ver tus reservas, consultar el
              catálogo de espacios y solicitar nuevas reservas.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
