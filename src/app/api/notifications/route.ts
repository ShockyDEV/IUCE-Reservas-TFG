import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([]);

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (isAdmin) {
    const pending = await prisma.reservation.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { name: true } },
        space: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json(
      pending.map((r) => ({
        id: r.id,
        type: "pending_review" as const,
        title: r.title,
        message: `${r.user.name} ha solicitado ${r.space.name}`,
        href: `/admin/reservations/${r.id}`,
        createdAt: r.createdAt,
      }))
    );
  } else {
    const reviewed = await prisma.reservation.findMany({
      where: {
        userId: session.user.id,
        reviewedAt: { gte: sevenDaysAgo },
        status: { in: ["APPROVED", "REJECTED"] },
      },
      include: { space: { select: { name: true } } },
      orderBy: { reviewedAt: "desc" },
      take: 10,
    });
    return NextResponse.json(
      reviewed.map((r) => ({
        id: r.id,
        type: r.status === "APPROVED" ? "approved" : "rejected",
        title: r.title,
        message: r.status === "APPROVED"
          ? `Tu reserva en ${r.space.name} ha sido aprobada`
          : `Tu reserva en ${r.space.name} ha sido rechazada`,
        href: `/reservations/${r.id}`,
        createdAt: r.reviewedAt || r.updatedAt,
      }))
    );
  }
}
