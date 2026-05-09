"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewActions({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function decide(status: "APPROVED" | "REJECTED") {
    setError(null);
    setLoading(status);
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: status === "REJECTED" ? adminNotes || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al revisar la reserva");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(null);
      setRejectMode(false);
      setAdminNotes("");
    }
  }

  if (rejectMode) {
    return (
      <div className="space-y-2 text-left">
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Motivo del rechazo (opcional)"
          className="block w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setRejectMode(false);
              setError(null);
            }}
            className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={() => decide("REJECTED")}
            disabled={loading !== null}
            className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:bg-red-300"
            type="button"
          >
            {loading === "REJECTED" ? "Rechazando…" : "Confirmar rechazo"}
          </button>
        </div>
        {error && <p className="text-right text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => decide("APPROVED")}
        disabled={loading !== null}
        className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:bg-green-300"
        type="button"
      >
        {loading === "APPROVED" ? "Aprobando…" : "Aprobar"}
      </button>
      <button
        onClick={() => setRejectMode(true)}
        disabled={loading !== null}
        className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        type="button"
      >
        Rechazar
      </button>
      {error && (
        <span className="self-center text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
