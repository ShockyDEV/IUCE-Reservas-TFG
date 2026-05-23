import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarCheck,
  ArrowRight,
  Building2,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_BADGE = {
  PENDING: { label: "Pendiente", variant: "warning" as const },
  APPROVED: { label: "Aprobada", variant: "success" as const },
  REJECTED: { label: "Rechazada", variant: "danger" as const },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const user = session.user;
  const role = (user as { role?: string }).role ?? "USER";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const reservations = await prisma.reservation.findMany({
    where: { userId: user.id },
    include: {
      space: { select: { name: true, code: true, color: true } },
    },
    orderBy: { startTime: "desc" },
    take: 5,
  });

  const counts = {
    pending: reservations.filter((r) => r.status === "PENDING").length,
    approved: reservations.filter((r) => r.status === "APPROVED").length,
    rejected: reservations.filter((r) => r.status === "REJECTED").length,
  };

  const dateFmt = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Badge variant="info">
            <Sparkles className="h-3 w-3" />
            Bienvenido de nuevo
          </Badge>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Hola, {user.name || user.email}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Sesión iniciada como <span className="font-medium">{user.email}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/spaces">
            <Button>
              <Building2 className="h-4 w-4 mr-1.5" />
              Ver espacios
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/admin/reservations">
              <Button variant="primary">
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                Panel administrativo
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-warning-700">
              Pendientes
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {counts.pending}
            </p>
            <p className="mt-1 text-xs text-gray-500">Solicitudes esperando revisión</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-success-700">
              Aprobadas
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {counts.approved}
            </p>
            <p className="mt-1 text-xs text-gray-500">Tus reservas confirmadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-danger-700">
              Rechazadas
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {counts.rejected}
            </p>
            <p className="mt-1 text-xs text-gray-500">Solicitudes no aprobadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-iuce-blue" />
              Mis reservas recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reservations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-500">
                  Todavía no has solicitado ninguna reserva.
                </p>
                <Link href="/spaces" className="mt-3 inline-block">
                  <Button size="sm" variant="outline">
                    Explorar espacios
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {reservations.map((r) => {
                  const status = STATUS_BADGE[r.status as keyof typeof STATUS_BADGE];
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{r.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                          <Building2 className="h-3 w-3" />
                          {r.space.name}
                          <Clock className="h-3 w-3 ml-2" />
                          {dateFmt.format(r.startTime)}
                        </p>
                      </div>
                      <Badge variant={status?.variant ?? "default"}>
                        {status?.label ?? r.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atajos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/spaces"
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-iuce-blue/40 hover:bg-iuce-blue-pale/30 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">Catálogo</p>
                <p className="text-xs text-gray-500">Buscar un espacio</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center justify-between rounded-lg border border-usal-red/20 bg-danger-50/40 px-4 py-3 hover:bg-danger-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-usal-red">Administración</p>
                  <p className="text-xs text-usal-red/70">Métricas y cola de solicitudes</p>
                </div>
                <ArrowRight className="h-4 w-4 text-usal-red" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
