"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewActions({ reservationId }: Readonly<{ reservationId: string }>) {
  const router = useRouter();
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  async function decide(status: "APPROVED" | "REJECTED") {
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
        toast.error(data.error || "Error al revisar la reserva");
        return;
      }
      toast.success(
        status === "APPROVED" ? "Reserva aprobada" : "Reserva rechazada",
      );
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(null);
      setRejectMode(false);
      setAdminNotes("");
    }
  }

  if (rejectMode) {
    return (
      <div className="space-y-2 text-left">
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Motivo del rechazo (opcional)"
          className="text-xs"
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setRejectMode(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={() => decide("REJECTED")}
            disabled={loading !== null}
          >
            {loading === "REJECTED" ? "Rechazando…" : "Confirmar rechazo"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        size="sm"
        variant="success"
        onClick={() => decide("APPROVED")}
        disabled={loading !== null}
      >
        <Check className="h-3.5 w-3.5 mr-1" />
        {loading === "APPROVED" ? "Aprobando…" : "Aprobar"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setRejectMode(true)}
        disabled={loading !== null}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Rechazar
      </Button>
    </div>
  );
}
