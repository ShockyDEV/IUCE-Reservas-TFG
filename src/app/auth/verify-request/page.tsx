import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Revisa tu correo — IUCE Reservas" };

export default function VerifyRequestPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <Image
          src="/images/iuce-logo.png"
          alt="IUCE"
          width={120}
          height={48}
          className="h-12 w-auto mx-auto mb-8"
          priority
        />
        <h1 className="text-2xl font-bold text-gray-900">Revisa tu correo</h1>
        <p className="mt-4 text-gray-600">
          Si el correo es válido, te hemos enviado un enlace de acceso. Revisa
          tu bandeja de entrada y la carpeta de spam.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          El enlace caduca en 10 minutos.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
