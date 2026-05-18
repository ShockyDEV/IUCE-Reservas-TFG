import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/reservations";
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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const callerRole = (session.user as { role?: string }).role;
  if (!isAdminRole(callerRole)) {
    return NextResponse.json(
      { error: "Solo el personal administrativo puede modificar usuarios" },
      { status: 403 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);
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

  // Solo un SUPER_ADMIN puede modificar a otro SUPER_ADMIN.
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
    userId: session.user.id,
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
