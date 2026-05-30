import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildReservationEmailData,
  sendReservationReminderEmail,
} from "@/lib/email";

/**
 * Tarea programada que cumple dos funciones:
 *   1. Enviar un recordatorio por email a las reservas APPROVED que comienzan
 *      en las próximas 24 horas (ventana ±1h).
 *   2. Marcar como EXPIRED las reservas APPROVED cuya `endTime` ya pasó, para
 *      que no sigan apareciendo como activas en los listados.
 *
 * Configuración recomendada (cualquiera de las dos):
 *   - Vercel Cron (vercel.json):
 *       crons: [{ path: "/api/cron/reminders", schedule: "0 9 * * *" }]
 *   - Cron del servidor (crontab):
 *       0 9 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
 *         https://reservas.iuce.usal.es/api/cron/reminders
 *
 * La variable de entorno `CRON_SECRET` debe coincidir con el header
 * Authorization para autorizar la llamada.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();

  // 1) Marcar como EXPIRED las reservas APPROVED ya terminadas
  const expired = await prisma.reservation.updateMany({
    where: {
      status: "APPROVED",
      endTime: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  // 2) Recordatorios para reservas APPROVED que arrancan en ~24 horas
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const upcoming = await prisma.reservation.findMany({
    where: {
      status: "APPROVED",
      startTime: { gte: in23h, lte: in25h },
    },
    include: {
      space: { select: { name: true, code: true } },
      user: { select: { name: true, email: true } },
    },
  });

  let sent = 0;
  for (const reservation of upcoming) {
    try {
      const emailData = buildReservationEmailData(reservation);
      const result = await sendReservationReminderEmail(emailData);
      if (result.success) sent++;
    } catch (error) {
      console.error(`Error enviando recordatorio ${reservation.id}:`, error);
    }
  }

  return NextResponse.json({
    expired: expired.count,
    remindersSent: sent,
    remindersConsidered: upcoming.length,
  });
}
