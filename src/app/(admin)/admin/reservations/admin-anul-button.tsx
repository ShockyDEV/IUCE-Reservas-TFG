"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AdminAnulButtonProps {
  reservationId: string;
  title: string;
}

/**
 * Botón de anulación administrativa para reservas APROBADAS. Llama a
 * `PATCH /api/admin/reservations/:id` con `status: "REJECTED"`. El backend
 * detecta que la reserva estaba en APPROVED, mueve el estado a REJECTED y
 * envía un email específico al solicitante.
 *
 * Para el solicitante, el resultado se ve como una reserva «Rechazada»;
 * para el equipo de administración, queda registrada en el audit log como
 * `RESERVATION_REJECTED_AFTER_APPROVAL` para distinguirla del rechazo en
 * revisión inicial.
 */
export function AdminAnulButton({
  reservationId,
  title,
}: Readonly<AdminAnulButtonProps>) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "confirm">("idle");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function confirmAnul() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          adminNotes: reason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al anular la reserva");
        return;
      }
      toast.success("Reserva anulada");
      router.refresh();
      setMode("idle");
      setReason("");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "confirm") {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded-lg border border-danger-500/20 bg-danger-50 p-3 text-xs text-danger-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Vas a anular la reserva «<strong>{title}</strong>». El solicitante
            recibirá un email comunicándole que su reserva ha sido rechazada
            por administración.
          </span>
        </div>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Motivo de la anulación (opcional, se incluirá en el email)"
          className="text-xs"
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setMode("idle");
              setReason("");
            }}
            disabled={loading}
          >
            Volver
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={confirmAnul}
            disabled={loading}
          >
            {loading ? "Anulando…" : "Confirmar anulación"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => setMode("confirm")}
      className="text-gray-600 hover:text-danger-700 hover:border-danger-300"
    >
      <X className="h-3.5 w-3.5 mr-1" />
      Anular reserva
    </Button>
  );
}
