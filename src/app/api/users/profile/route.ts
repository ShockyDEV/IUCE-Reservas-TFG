import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileCompleted: true,
      receiveAdminEmails: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, receiveAdminEmails } = body as {
      name?: unknown;
      receiveAdminEmails?: unknown;
    };

    const updateData: {
      name?: string;
      profileCompleted?: boolean;
      receiveAdminEmails?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json(
          { error: "El nombre debe tener al menos 2 caracteres" },
          { status: 400 },
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: "El nombre no puede superar los 100 caracteres" },
          { status: 400 },
        );
      }
      updateData.name = name.trim();
      updateData.profileCompleted = true;
    }

    if (receiveAdminEmails !== undefined) {
      if (typeof receiveAdminEmails !== "boolean") {
        return NextResponse.json(
          { error: "receiveAdminEmails debe ser un booleano" },
          { status: 400 },
        );
      }
      // Solo los administradores pueden modificar esta preferencia
      // (al resto no le afecta porque no recibe esos emails de todos modos).
      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          {
            error:
              "Solo los administradores pueden configurar la recepción de avisos",
          },
          { status: 403 },
        );
      }
      updateData.receiveAdminEmails = receiveAdminEmails;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No se han enviado cambios" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileCompleted: true,
        receiveAdminEmails: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el perfil" },
      { status: 500 },
    );
  }
}
