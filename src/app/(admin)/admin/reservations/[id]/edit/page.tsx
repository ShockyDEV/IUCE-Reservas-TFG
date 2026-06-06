import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditReservationForm } from "./edit-form";

export const metadata = { title: "Modificar reserva — Administración" };

export default async function AdminReservationEditPage({
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
      space: {
        select: { id: true, name: true, code: true, capacity: true },
      },
      user: { select: { name: true, email: true } },
    },
  });

  if (!reservation) notFound();

  // Solo se permite editar mientras esté en uno de los estados activos.
  if (
    reservation.status !== "PENDING" &&
    reservation.status !== "APPROVED"
  ) {
    redirect(`/admin/reservations/${reservation.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      <Link
        href={`/admin/reservations/${reservation.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al detalle de la reserva
      </Link>

      <div>
        <Badge variant="warning">
          <Pencil className="h-3 w-3" />
          Modificar reserva
        </Badge>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Modificar «{reservation.title}»
        </h1>
        <p className="mt-2 text-sm text-gray-500 max-w-2xl">
          Edita los datos de la reserva del usuario{" "}
          <span className="font-medium text-gray-700">
            {reservation.user.name}
          </span>
          . El solicitante recibirá un email con el detalle de los cambios
          aplicados.
        </p>
      </div>

      <EditReservationForm
        reservationId={reservation.id}
        space={{
          id: reservation.space.id,
          name: reservation.space.name,
          code: reservation.space.code,
          capacity: reservation.space.capacity,
        }}
        initial={{
          title: reservation.title,
          description: reservation.description ?? "",
          startTime: reservation.startTime.toISOString(),
          endTime: reservation.endTime.toISOString(),
          attendees: reservation.attendees,
          adminNotes: reservation.adminNotes ?? "",
        }}
      />
    </div>
  );
}
