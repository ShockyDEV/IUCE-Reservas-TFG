"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Ban, Download, RefreshCw, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { BanToggle } from "./ban-toggle";

type Role = "USER" | "ADMIN" | "SUPER_ADMIN";

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
  lastLogin: string | null;
}

interface Session {
  user: { id: string; email: string; role: Role };
}

const ROLE_LABEL: Record<Role, string> = {
  USER: "Usuario",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const ROLE_VARIANT: Record<Role, "info" | "danger" | "secondary"> = {
  USER: "secondary",
  ADMIN: "info",
  SUPER_ADMIN: "danger",
};

function dateFmt(d: string | null) {
  if (!d) return "Nunca";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface SyncResult {
  total: number;
  updated: number;
  notFound: number;
  errors: number;
  skipped: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ])
      .then(([s, u]) => {
        setSession(s);
        setUsers(u);
      })
      .catch(() => toast.error("Error cargando usuarios"))
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (userId: string, newRole: Role) => {
    setSaving(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al cambiar el rol");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`Rol actualizado a ${ROLE_LABEL[newRole]}`);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(null);
    }
  };

  const callerRole = session?.user.role;
  const isSuperAdmin = callerRole === "SUPER_ADMIN";

  const handleSyncNames = async () => {
    if (!confirm("¿Sincronizar todos los nombres @usal.es contra el directorio institucional? Puede tardar varios segundos.")) {
      return;
    }
    setSyncing(true);
    setLastSync(null);
    try {
      const res = await fetch("/api/admin/users/sync-names", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error en la sincronización");
        return;
      }
      setLastSync(data);
      toast.success(`Sincronización terminada: ${data.updated} actualizados`);
      // Refrescar la lista para mostrar los nombres nuevos
      const refreshed = await fetch("/api/admin/users").then((r) => r.json());
      setUsers(refreshed);
    } catch {
      toast.error("Error de conexión con el directorio");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-usal-red" />
          <span className="text-xs font-medium text-usal-red uppercase tracking-wider">
            Administración
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-sm text-gray-500 mt-1">
              {users.length} {users.length === 1 ? "usuario registrado" : "usuarios registrados"}
              {isSuperAdmin
                ? " · Puedes cambiar el rol de cualquier usuario"
                : " · Solo un SUPER_ADMIN puede modificar el rol de otro SUPER_ADMIN"}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/admin/exports/users"
              className={buttonClassName({ variant: "outline", size: "sm" })}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exportar CSV
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNames}
              disabled={syncing || loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar nombres"}
            </Button>
          </div>
        </div>
        {lastSync && (
          <div className="mt-3 rounded-md border border-iuce-blue/20 bg-iuce-blue-pale/20 px-3 py-2 text-xs text-gray-700">
            Última sincronización: <strong>{lastSync.updated}</strong> actualizados,{" "}
            <strong>{lastSync.notFound}</strong> no encontrados,{" "}
            <strong>{lastSync.errors}</strong> con error sobre{" "}
            <strong>{lastSync.total - lastSync.skipped}</strong> usuarios @usal.es.
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <UsersIcon className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No hay usuarios registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isSelf = session?.user.id === u.id;
            const isTargetSuper = u.role === "SUPER_ADMIN";
            const canChange = !isSelf && (isSuperAdmin || !isTargetSuper);
            return (
              <Card key={u.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {u.name}
                        {isSelf && (
                          <span className="ml-1 text-xs text-gray-400">(tú)</span>
                        )}
                      </p>
                      <Badge variant={ROLE_VARIANT[u.role]}>
                        <ShieldCheck className="h-3 w-3" />
                        {ROLE_LABEL[u.role]}
                      </Badge>
                      {u.isBanned && (
                        <Badge variant="danger">
                          <Ban className="h-3 w-3" />
                          Suspendido
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    {u.isBanned && u.banReason && (
                      <p className="mt-1 text-[11px] text-danger-700 truncate">
                        Motivo: {u.banReason}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-gray-400 hidden sm:block">
                    <p>Último login: {dateFmt(u.lastLogin)}</p>
                    <p>Alta: {dateFmt(u.createdAt)}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {!isSelf && u.role !== "SUPER_ADMIN" && (
                      <BanToggle
                        userId={u.id}
                        userName={u.name}
                        isBanned={u.isBanned}
                        banReason={u.banReason}
                        onChange={({ isBanned, banReason }) =>
                          setUsers((prev) =>
                            prev.map((x) =>
                              x.id === u.id ? { ...x, isBanned, banReason } : x
                            )
                          )
                        }
                      />
                    )}
                    {canChange ? (
                      <select
                        value={u.role}
                        disabled={saving === u.id}
                        onChange={(e) => changeRole(u.id, e.target.value as Role)}
                        aria-label={`Cambiar rol de ${u.name}`}
                        className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
                      >
                        <option value="USER">Usuario</option>
                        <option value="ADMIN">Admin</option>
                        {isSuperAdmin && (
                          <option value="SUPER_ADMIN">Super Admin</option>
                        )}
                      </select>
                    ) : (
                      <Button variant="ghost" size="sm" disabled>
                        Sin permisos
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
