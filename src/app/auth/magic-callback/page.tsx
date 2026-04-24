"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function MagicCallbackPage() {
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
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1200);
        }
      } catch {
        setStatus("error");
        setErrorMsg("Error al verificar el enlace.");
      }
    };

    verify();
  }, [token, email]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
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
    </main>
  );
}
