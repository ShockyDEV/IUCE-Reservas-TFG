"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Mail, ArrowRight, AlertCircle, Send, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const IS_DEV = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

const MOCK_USERS = [
  { email: "admin@usal.es", name: "María García López", role: "Admin", color: "bg-usal-red" },
  { email: "investigador1@usal.es", name: "Ana Fernández Ruiz", role: "Usuario", color: "bg-iuce-blue" },
  { email: "superadmin@usal.es", name: "Carlos Rodríguez Martín", role: "Super Admin", color: "bg-iuce-blue-dark" },
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
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 to-white px-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-50">
              <CheckCircle2 className="h-7 w-7 text-success-700" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Revisa tu correo</h1>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Te hemos enviado un enlace de acceso a <strong>{email}</strong>. El
              enlace es válido durante 10 minutos.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block text-sm text-iuce-blue hover:underline"
            >
              ← Volver al inicio
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex bg-gradient-to-b from-brand-50/40 to-white">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-iuce-blue-dark text-white">
        <Image
          src="/images/iuce-logo.png"
          alt="IUCE"
          width={180}
          height={60}
          className="h-12 w-auto brightness-0 invert"
          priority
        />
        <div>
          <Badge variant="info" className="bg-white/10 text-white">
            <Sparkles className="h-3 w-3" />
            Acceso passwordless
          </Badge>
          <h2 className="mt-4 text-3xl font-bold leading-tight">
            Reserva los espacios del IUCE con tu cuenta institucional
          </h2>
          <p className="mt-4 text-base text-white/80 leading-relaxed">
            Sin contraseñas que recordar. Solo introduce tu correo @usal.es y
            recibirás un enlace de acceso seguro.
          </p>
        </div>
        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} IUCE — Universidad de Salamanca
        </p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Image
              src="/images/iuce-logo.png"
              alt="IUCE"
              width={140}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>

          <div className="h-1 w-12 bg-usal-red rounded-full mb-5 hidden lg:block" />

          <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-gray-500">
            Introduce tu correo institucional y te enviaremos un enlace de acceso.
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger-50 border border-danger-500/20 p-3 text-sm text-danger-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {IS_DEV && (
            <div className="mt-6">
              <div className="rounded-lg bg-warning-50 border border-warning-500/20 p-3 text-xs text-warning-700">
                <p className="font-medium">Modo desarrollo activo</p>
                <p className="mt-0.5 text-warning-700/80">Acceso rápido sin enviar emails reales.</p>
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
                    className="w-full flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-iuce-blue/40 hover:shadow-sm disabled:opacity-50"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${u.color} text-white text-xs font-bold`}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
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
                  <span className="bg-gradient-to-b from-white to-brand-50/40 lg:bg-white px-3 text-gray-400">
                    o envía un magic link
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={IS_DEV ? "" : "mt-6"}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Correo institucional
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoFocus={!IS_DEV}
                    placeholder="nombre@usal.es"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Enviar enlace de acceso
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
