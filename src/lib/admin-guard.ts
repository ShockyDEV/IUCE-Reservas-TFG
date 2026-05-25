import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/reservations";

export interface AdminGuardSuccess {
  ok: true;
  userId: string;
}

export interface AdminGuardFailure {
  ok: false;
  response: NextResponse;
}

export type AdminGuardResult = AdminGuardSuccess | AdminGuardFailure;

/**
 * Comprueba que la petición proviene de un usuario autenticado con rol
 * administrativo (`ADMIN` o `SUPER_ADMIN`).
 *
 * Devuelve un resultado discriminado: si la sesión es válida, `ok: true`
 * con el `userId` listo para audit logging y registros de autoría. En
 * caso contrario, `ok: false` con un `NextResponse` ya construido (401 si
 * no hay sesión, 403 si el rol no es suficiente) que el endpoint puede
 * devolver tal cual.
 *
 * El patrón es ligeramente menos directo que un throw, pero permite que
 * los endpoints sigan siendo funciones puras y deja el control de flujo
 * explícito.
 *
 * @example
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return guard.response;
 *   // ...usar guard.userId aquí...
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  const role = (session.user as { role?: string }).role;
  if (!isAdminRole(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Solo el personal administrativo puede ejecutar esta acción" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, userId: session.user.id };
}
