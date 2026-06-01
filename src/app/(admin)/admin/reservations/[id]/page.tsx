import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Building2,
  MessageSquare,
  User as UserIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "../review-actions";
import { RESERVATION_STATUS_BADGE } from "@/lib/format";

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeFmt = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminReservationDetailPage({
  params,
}: Readonly<{
  params: { id: string };
}>) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) redirect("/dashboard");

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      space: true,
      user: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  if (!reservation) notFound();

  const statusBadge =
    RESERVATION_STATUS_BADGE[
      reservation.status as keyof typeof RESERVATION_STATUS_BADGE
    ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/admin/reservations"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a solicitudes
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-usal-red" />
            <span className="text-xs font-medium text-usal-red uppercase tracking-wider">
              Revisión de solicitud
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {reservation.title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Solicitud creada el {dateTimeFmt.format(reservation.createdAt)}
          </p>
        </div>
        <Badge variant={statusBadge?.variant ?? "default"}>
          {statusBadge?.label ?? reservation.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalles de la reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservation.description && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                {reservation.description}
              </p>
            )}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
                  style={{ backgroundColor: reservation.space.color + "15" }}
                >
                  <Building2
                    className="h-4 w-4"
                    style={{ color: reservation.space.color }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {reservation.space.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reservation.space.code} · {reservation.space.building}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {dateFmt.format(reservation.startTime)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {timeFmt.format(reservation.startTime)} —{" "}
                    {timeFmt.format(reservation.endTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {reservation.attendees}{" "}
                    {reservation.attendees === 1 ? "asistente" : "asistentes"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Capacidad del espacio: {reservation.space.capacity}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-iuce-blue" />
              Solicitante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                {reservation.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {reservation.user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {reservation.user.email}
                </p>
              </div>
            </div>
            {reservation.reviewedBy && (
              <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                Revisado por{" "}
                <span className="font-medium text-gray-700">
                  {reservation.reviewedBy.name}
                </span>
                {reservation.reviewedAt && (
                  <>
                    {" "}
                    el {dateTimeFmt.format(reservation.reviewedAt)}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {reservation.status === "PENDING" ? (
        <Card className="border-warning-500/20 bg-warning-50/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-warning-500" />
              Acción del administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewActions reservationId={reservation.id} />
          </CardContent>
        </Card>
      ) : reservation.adminNotes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas del administrador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
              {reservation.adminNotes}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
