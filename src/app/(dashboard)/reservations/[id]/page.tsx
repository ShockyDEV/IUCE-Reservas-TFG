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
  Repeat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CancelButton } from "../../dashboard/cancel-button";

const STATUS_BADGE = {
  PENDING: { label: "Pendiente", variant: "warning" as const },
  APPROVED: { label: "Aprobada", variant: "success" as const },
  REJECTED: { label: "Rechazada", variant: "danger" as const },
  CANCELLED: { label: "Cancelada", variant: "secondary" as const },
  EXPIRED: { label: "Expirada", variant: "secondary" as const },
};

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

export default async function ReservationDetailPage({
  params,
}: Readonly<{
  params: { id: string };
}>) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      space: true,
      user: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  if (!reservation) notFound();

  const isOwner = reservation.userId === session.user.id;
  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) redirect("/dashboard");

  const canCancel =
    reservation.status === "PENDING" || reservation.status === "APPROVED";
  const statusBadge =
    STATUS_BADGE[reservation.status as keyof typeof STATUS_BADGE];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/reservations"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Mis reservas
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {reservation.title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Solicitada el {dateTimeFmt.format(reservation.createdAt)}
          </p>
        </div>
        <Badge variant={statusBadge?.variant ?? "default"}>
          {statusBadge?.label ?? reservation.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">
          {reservation.description && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
              {reservation.description}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
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
                  Capacidad: {reservation.space.capacity}
                </p>
              </div>
            </div>

            {reservation.isRecurring && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-iuce-blue-pale flex-shrink-0">
                  <Repeat className="h-4 w-4 text-iuce-blue" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Reserva recurrente
                  </p>
                  <p className="text-xs text-gray-500">
                    Patrón: {reservation.recurrenceRule}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {reservation.adminNotes && (
        <Card
          className={
            reservation.status === "REJECTED"
              ? "border-danger-500/20"
              : "border-success-500/20"
          }
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              Notas del administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {reservation.adminNotes}
            </p>
            {reservation.reviewedBy && (
              <p className="text-xs text-gray-400 mt-2">
                — {reservation.reviewedBy.name}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {canCancel && isOwner && (
        <div className="flex justify-end">
          <CancelButton
            reservationId={reservation.id}
            title={reservation.title}
          />
        </div>
      )}
    </div>
  );
}
