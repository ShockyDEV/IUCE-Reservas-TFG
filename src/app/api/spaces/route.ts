import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const spaces = await prisma.space.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      capacity: true,
      floor: true,
      building: true,
      equipment: true,
      accessibility: true,
      color: true,
      description: true,
      imageUrl: true,
    },
  });

  return NextResponse.json(spaces);
}
