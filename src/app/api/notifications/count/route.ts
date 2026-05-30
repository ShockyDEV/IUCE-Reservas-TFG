import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ count: 0 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  let count = 0;

  if (isAdmin) {
    count = await prisma.reservation.count({
      where: { status: "PENDING" },
    });
  } else {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    count = await prisma.reservation.count({
      where: {
        userId: session.user.id,
        reviewedAt: { gte: sevenDaysAgo },
        status: { in: ["APPROVED", "REJECTED"] },
      },
    });
  }

  return NextResponse.json({ count });
}
