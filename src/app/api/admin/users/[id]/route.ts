import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-guard";
import { updateUserRoleSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

/**
 * PATCH /api/admin/users/[id]
 *
 * Cambia el rol de un usuario existente. Requiere rol administrativo. Por
 * seguridad, un usuario con rol ADMIN no puede degradar a un SUPER_ADMIN:
 * solo otro SUPER_ADMIN puede realizar esa transición. El cambio se
 * registra en el audit log con el rol anterior y el nuevo.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const session = await auth();
  const callerRole = (session?.user as { role?: string }).role;

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true, isBanned: true, banReason: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Rama 1: cambio de ban/suspensión
  if (typeof body.isBanned === "boolean") {
    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No se puede suspender a un SUPER_ADMIN" },
        { status: 403 }
      );
    }

    const banReason =
      body.isBanned && typeof body.banReason === "string" && body.banReason.trim().length > 0
        ? body.banReason.trim().slice(0, 500)
        : null;

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        isBanned: body.isBanned,
        banReason: body.isBanned ? banReason : null,
      },
      select: { id: true, name: true, email: true, role: true, isBanned: true, banReason: true },
    });

    await logAudit({
      action: body.isBanned ? "USER_BANNED" : "USER_UNBANNED",
      userId: guard.userId,
      targetType: "user",
      targetId: target.id,
      details: {
        targetEmail: target.email,
        reason: banReason,
      },
    });

    return NextResponse.json(updated);
  }

  // Rama 2: cambio de rol (comportamiento histórico)
  const parsed = updateUserRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { role: newRole } = parsed.data;

  if (target.role === "SUPER_ADMIN" && callerRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      {
        error:
          "Solo un SUPER_ADMIN puede modificar el rol de otro SUPER_ADMIN",
      },
      { status: 403 }
    );
  }

  if (target.role === newRole) {
    return NextResponse.json(target);
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true },
  });

  await logAudit({
    action: "USER_ROLE_CHANGED",
    userId: guard.userId,
    targetType: "user",
    targetId: target.id,
    details: {
      targetEmail: target.email,
      from: target.role,
      to: newRole,
    },
  });

  return NextResponse.json(updated);
}
