import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const space = await prisma.space.findUnique({
    where: { id: params.id },
  });

  if (!space || !space.isActive) {
    return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
  }

  return NextResponse.json(space);
}
