import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-guard";
import { updateUserRoleSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

type TargetUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  banReason: string | null;
};

const BAN_REASON_MAX_LENGTH = 500;

/**
 * Aplica un cambio de estado de suspensión sobre el usuario. Se aísla en una
 * función propia para que el handler `PATCH` no supere el umbral de
 * cognitive complexity que vigila SonarCloud (S3776).
 */
async function applyBanChange(
  target: TargetUser,
  body: { isBanned: boolean; banReason?: unknown },
  callerId: string,
): Promise<NextResponse> {
  if (target.role === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "No se puede suspender a un SUPER_ADMIN" },
      { status: 403 },
    );
  }

  const trimmed =
    typeof body.banReason === "string" ? body.banReason.trim() : "";
  const banReason =
    body.isBanned && trimmed.length > 0
      ? trimmed.slice(0, BAN_REASON_MAX_LENGTH)
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
    userId: callerId,
    targetType: "user",
    targetId: target.id,
    details: { targetEmail: target.email, reason: banReason },
  });

  return NextResponse.json(updated);
}

/**
 * Aplica un cambio de rol respetando que solo un SUPER_ADMIN pueda modificar
 * a otro SUPER_ADMIN. Igual que `applyBanChange`, se extrae para mantener la
 * complejidad cognitiva del handler dentro del umbral de SonarCloud.
 */
async function applyRoleChange(
  target: TargetUser,
  body: unknown,
  callerId: string,
  callerRole: string | undefined,
): Promise<NextResponse> {
  const parsed = updateUserRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { role: newRole } = parsed.data;

  if (target.role === "SUPER_ADMIN" && callerRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Solo un SUPER_ADMIN puede modificar el rol de otro SUPER_ADMIN" },
      { status: 403 },
    );
  }

  if (target.role === newRole) return NextResponse.json(target);

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true },
  });

  await logAudit({
    action: "USER_ROLE_CHANGED",
    userId: callerId,
    targetType: "user",
    targetId: target.id,
    details: { targetEmail: target.email, from: target.role, to: newRole },
  });

  return NextResponse.json(updated);
}

/**
 * PATCH /api/admin/users/[id]
 *
 * Acepta dos tipos de modificación: cambio de rol o cambio de estado de
 * suspensión. Despacha a `applyBanChange` o `applyRoleChange` según el
 * payload recibido. Requiere rol administrativo.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
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
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (typeof (body as { isBanned?: unknown }).isBanned === "boolean") {
    return applyBanChange(target, body as { isBanned: boolean; banReason?: unknown }, guard.userId);
  }

  return applyRoleChange(target, body, guard.userId, callerRole);
}
