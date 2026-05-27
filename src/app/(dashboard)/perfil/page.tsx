"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, User as UserIcon, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  name: string;
  email: string;
  profileCompleted: boolean;
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/users/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
      })
      .catch(() => toast.error("Error cargando el perfil"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al actualizar");
        return;
      }
      setProfile(data);
      setSavedAt(new Date());
      toast.success("Perfil actualizado");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <p className="text-sm text-gray-500">No se pudo cargar el perfil.</p>
      </div>
    );
  }

  const dirty = name.trim() !== profile.name;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Actualiza el nombre con el que apareces en el sistema. Se usará en
          las comunicaciones automatizadas y en el panel administrativo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-iuce-blue" />
            Datos personales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" />
                {profile.email}
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  No editable
                </Badge>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={100}
                required
                className="mt-1"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Entre 2 y 100 caracteres.
              </p>
            </div>

            <div className="flex items-center justify-between">
              {savedAt ? (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Guardado a las {savedAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </p>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={!dirty || saving || name.trim().length < 2}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
