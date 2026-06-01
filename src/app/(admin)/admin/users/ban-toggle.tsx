"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Ban, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface BanToggleProps {
  userId: string;
  userName: string;
  isBanned: boolean;
  banReason: string | null;
  onChange: (next: { isBanned: boolean; banReason: string | null }) => void;
}

export function BanToggle({ userId, userName, isBanned, banReason, onChange }: Readonly<BanToggleProps>) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState(banReason || "");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!isBanned && reason.trim().length < 5) {
      toast.error("Indica un motivo de al menos 5 caracteres");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isBanned: !isBanned,
          banReason: !isBanned ? reason.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al actualizar el estado");
        return;
      }
      onChange({ isBanned: data.isBanned, banReason: data.banReason });
      toast.success(
        data.isBanned ? `${userName} suspendido` : `${userName} reactivado`
      );
      setModalOpen(false);
      if (!data.isBanned) setReason("");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setModalOpen(true)}
        className={
          isBanned
            ? "text-emerald-700 hover:text-emerald-800"
            : "text-gray-500 hover:text-danger-700"
        }
        title={isBanned ? "Reactivar usuario" : "Suspender usuario"}
      >
        {isBanned ? (
          <ShieldOff className="h-3.5 w-3.5" />
        ) : (
          <Ban className="h-3.5 w-3.5" />
        )}
      </Button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                {isBanned ? "Reactivar usuario" : "Suspender usuario"}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {isBanned
                  ? `${userName} podrá volver a crear reservas inmediatamente.`
                  : `${userName} no podrá crear nuevas reservas hasta que se revoque la suspensión.`}
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {!isBanned && (
                <div>
                  <label
                    htmlFor="ban-reason"
                    className="text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Motivo (mínimo 5 caracteres)
                  </label>
                  <Textarea
                    id="ban-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Ej.: incumplimiento reiterado de las normas de cancelación"
                    maxLength={500}
                    className="mt-1"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {reason.length}/500 caracteres
                  </p>
                </div>
              )}
              {isBanned && banReason && (
                <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <span className="font-medium text-gray-700">Motivo actual:</span>{" "}
                  {banReason}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={saving}
                className={isBanned ? "" : "bg-usal-red hover:bg-usal-red-dark"}
              >
                {saving
                  ? "Guardando..."
                  : isBanned
                    ? "Reactivar"
                    : "Suspender"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
