"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CancelButtonProps {
  reservationId: string;
  title: string;
}

export function CancelButton({ reservationId, title }: Readonly<CancelButtonProps>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm(`¿Cancelar la reserva «${title}»? La franja quedará libre para otras solicitudes.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al cancelar la reserva");
        return;
      }
      toast.success("Reserva cancelada");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCancel}
      disabled={loading}
      className="text-gray-600 hover:text-danger-700 hover:border-danger-300"
    >
      <X className="h-3.5 w-3.5 mr-1" />
      Cancelar
    </Button>
  );
}
