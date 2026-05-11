"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";

const IS_DEV = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

const MOCK_USERS = [
  { email: "admin@usal.es", name: "María García López", role: "Admin" },
  { email: "investigador1@usal.es", name: "Ana Fernández Ruiz", role: "Usuario" },
  { email: "superadmin@usal.es", name: "Carlos Rodríguez Martín", role: "Super Admin" },
];

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleMockLogin(mockEmail: string) {
    setLoading(true);
    setError("");
    try {
      await signIn("credentials", { email: mockEmail, callbackUrl: "/dashboard" });
    } catch {
      setError("No se pudo iniciar sesión en modo desarrollo");
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@usal.es")) {
      setError("Debes usar un correo @usal.es");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al enviar el enlace");
        return;
      }

      setSuccess(true);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900">Revisa tu correo</h1>
          <p className="mt-4 text-gray-600">
            Te hemos enviado un enlace de acceso a <strong>{email}</strong>. El
            enlace es válido durante 10 minutos.
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Image
            src="/images/iuce-logo.png"
            alt="IUCE"
            width={120}
            height={48}
            className="h-12 w-auto mx-auto"
            priority
          />
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Recibirás un enlace de acceso en tu correo @usal.es
          </p>
        </div>

        {IS_DEV && (
          <div className="mb-6">
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Modo desarrollo activo — acceso rápido sin enviar emails reales
            </div>
            <p className="mt-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Acceso rápido (dev)
            </p>
            <div className="mt-2 space-y-2">
              {MOCK_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleMockLogin(u.email)}
                  disabled={loading}
                  className="w-full flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">
                  o envía un magic link
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus={!IS_DEV}
              placeholder="nombre@usal.es"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando..." : "Enviar enlace de acceso"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
