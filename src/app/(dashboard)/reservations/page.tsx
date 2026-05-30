import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, CalendarCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ReservationsClient,
  type ReservationRow,
} from "./reservations-client";

export const metadata = { title: "Mis reservas — IUCE Reservas" };

export default async function ReservationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const raw = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    include: {
      space: { select: { id: true, name: true, code: true, color: true } },
    },
    orderBy: { startTime: "desc" },
  });

  const reservations: ReservationRow[] = raw.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    startTime: r.startTime.toISOString(),
    endTime: r.endTime.toISOString(),
    status: r.status,
    attendees: r.attendees,
    createdAt: r.createdAt.toISOString(),
    space: r.space,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge variant="info">
            <CalendarCheck className="h-3 w-3" />
            Mis reservas
          </Badge>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Mis reservas
          </h1>
          <p className="mt-2 text-sm text-gray-500 max-w-2xl">
            Consulta el estado de tus solicitudes, filtra por estado o rango de
            fechas y crea una nueva reserva en cualquier espacio del IUCE.
          </p>
        </div>
        <Link href="/reservations/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva reserva
          </Button>
        </Link>
      </div>

      <ReservationsClient reservations={reservations} />
    </div>
  );
}
