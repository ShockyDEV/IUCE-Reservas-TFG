"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

/** Pausa breve antes de redirigir para que el usuario vea el OK. */
const SUCCESS_REDIRECT_MS = 1200;

function MagicCallbackContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setErrorMsg("Enlace inválido. Faltan parámetros.");
      return;
    }

    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const verify = async () => {
      try {
        const result = await signIn("credentials", {
          email,
          magicToken: token,
          redirect: false,
        });

        if (result?.error) {
          setStatus("error");
          setErrorMsg("El enlace ha expirado o ya fue utilizado.");
        } else if (result?.ok) {
          setStatus("success");
          redirectTimer = setTimeout(() => {
            // Forzamos full reload para que NextAuth lea la sesion nueva.
            globalThis.location.href = "/dashboard";
          }, SUCCESS_REDIRECT_MS);
        }
      } catch {
        setStatus("error");
        setErrorMsg("Error al verificar el enlace.");
      }
    };

    verify();

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [token, email]);

  return (
    <div className="max-w-sm w-full text-center">
      <Image
        src="/images/iuce-logo.png"
        alt="IUCE"
        width={120}
        height={48}
        className="h-10 w-auto mx-auto mb-8"
        priority
      />

      {status === "verifying" && (
        <>
          <h1 className="text-xl font-semibold text-gray-900">
            Verificando acceso...
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Un momento, estamos comprobando tu enlace.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-xl font-semibold text-green-700">
            ¡Acceso verificado!
          </h1>
          <p className="mt-3 text-sm text-gray-500">Redirigiendo...</p>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-xl font-semibold text-red-700">
            Enlace no válido
          </h1>
          <p className="mt-3 text-sm text-gray-500">{errorMsg}</p>
          <Link
            href="/auth/signin"
            className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Solicitar nuevo enlace
          </Link>
        </>
      )}
    </div>
  );
}

export default function MagicCallbackPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Suspense
        fallback={
          <div className="max-w-sm w-full text-center">
            <h1 className="text-xl font-semibold text-gray-900">Cargando…</h1>
          </div>
        }
      >
        <MagicCallbackContent />
      </Suspense>
    </main>
  );
}
