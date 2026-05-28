import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

const MAX_VALUE_SIZE = 500_000;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Parámetro 'key' requerido" }, { status: 400 });
  }

  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key } });
    return NextResponse.json({ key, value: setting?.value || null });
  } catch (error) {
    console.error("Error leyendo setting:", error);
    return NextResponse.json({ key, value: null });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { key, value } = await req.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Clave no válida" }, { status: 400 });
    }
    if (typeof value !== "string") {
      return NextResponse.json({ error: "Valor no válido" }, { status: 400 });
    }
    if (value.length > MAX_VALUE_SIZE) {
      return NextResponse.json(
        { error: `El contenido supera el tamaño máximo (${MAX_VALUE_SIZE} caracteres)` },
        { status: 400 }
      );
    }

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await logAudit({
      action: "SETTING_UPDATED",
      userId: guard.userId,
      targetType: "setting",
      targetId: key,
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Error actualizando setting:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el ajuste" },
      { status: 500 }
    );
  }
}
