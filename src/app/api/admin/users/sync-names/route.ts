import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { fetchPersonFromUSAL } from "@/lib/usal-directory";

const USAL_DOMAIN = "@usal.es";
const THROTTLE_MS = 300;

interface SyncDetail {
  email: string;
  from: string;
  to: string;
}

/**
 * Recorre todos los usuarios con email `@usal.es`, consulta el directorio
 * institucional para cada uno y actualiza el campo `name` cuando difiere
 * del oficial. Cada cambio se registra en el audit log para mantener una
 * trazabilidad completa de modificaciones masivas.
 */
export async function POST() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  let updated = 0;
  let notFound = 0;
  let errors = 0;
  let skipped = 0;
  const details: SyncDetail[] = [];

  for (const user of users) {
    if (!user.email.toLowerCase().endsWith(USAL_DOMAIN)) {
      skipped++;
      continue;
    }

    try {
      const person = await fetchPersonFromUSAL(user.email);
      if (!person?.name) {
        notFound++;
      } else if (person.name !== user.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: person.name },
        });
        await logAudit({
          action: "USER_NAME_CHANGED",
          userId: guard.userId,
          targetType: "user",
          targetId: user.id,
          details: { from: user.name, to: person.name, source: "usal-directory" },
        });
        details.push({ email: user.email, from: user.name, to: person.name });
        updated++;
      }
    } catch (error) {
      console.error(`Error sincronizando ${user.email}:`, error);
      errors++;
    }

    await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
  }

  return NextResponse.json({
    total: users.length,
    updated,
    notFound,
    errors,
    skipped,
    details,
  });
}
