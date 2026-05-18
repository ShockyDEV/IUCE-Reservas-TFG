import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/reservations";
import { updateSpaceSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

/**
 * PATCH /api/admin/spaces/[id]
 *
 * Actualiza los campos editables de un espacio. Acepta un subconjunto de
 * los campos definidos en createSpaceSchema (todos optional). Registra
 * SPACE_UPDATED en el audit log con la lista de campos modificados.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!isAdminRole(role)) {
    return NextResponse.json(
      { error: "Solo el personal administrativo puede modificar espacios" },
      { status: 403 }
    );
  }

  const existing = await prisma.space.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Espacio no encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSpaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const changedFields = Object.keys(data);

  try {
    const updated = await prisma.space.update({
      where: { id: existing.id },
      data: {
        ...data,
        equipment:
          data.equipment !== undefined
            ? JSON.stringify(data.equipment)
            : undefined,
      },
    });

    await logAudit({
      action: "SPACE_UPDATED",
      userId: session.user.id,
      targetType: "space",
      targetId: updated.id,
      details: {
        code: updated.code,
        changedFields,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un espacio con ese código" },
        { status: 409 }
      );
    }
    console.error("Error updating space:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
