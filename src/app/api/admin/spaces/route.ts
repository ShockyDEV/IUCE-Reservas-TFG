import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { createSpaceSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/admin/spaces
 *
 * Da de alta un nuevo espacio reservable. Requiere rol administrativo y
 * registra la acción SPACE_CREATED en el audit log. Si el código del
 * espacio ya existe, se responde con 409 Conflict en lugar de propagar
 * el error de unicidad de Prisma.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createSpaceSchema.safeParse(body);
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

  try {
    const space = await prisma.space.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        capacity: data.capacity,
        floor: data.floor,
        building: data.building ?? "IUCE",
        equipment: JSON.stringify(data.equipment ?? []),
        accessibility: data.accessibility ?? false,
        color: data.color ?? "#3B7DD8",
        imageUrl: data.imageUrl,
      },
    });

    await logAudit({
      action: "SPACE_CREATED",
      userId: guard.userId,
      targetType: "space",
      targetId: space.id,
      details: {
        name: space.name,
        code: space.code,
        capacity: space.capacity,
      },
    });

    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: `Ya existe un espacio con el código ${data.code}` },
        { status: 409 }
      );
    }
    console.error("Error creating space:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
