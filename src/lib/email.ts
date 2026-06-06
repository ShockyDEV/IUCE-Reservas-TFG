import { Resend } from "resend";

const FROM_EMAIL = process.env.EMAIL_FROM || "IUCE Reservas <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

/**
 * Inicialización perezosa del cliente Resend.
 *
 * `new Resend(undefined)` lanza inmediatamente "Missing API key", lo que
 * rompía el `next build` en entornos sin `RESEND_API_KEY` (CI / build de
 * producción sin secretos). Diferimos la construcción al momento de
 * enviar el email, donde ya se comprueba la presencia de la clave.
 */
let resendSingleton: Resend | null = null;
function getResendClient(apiKey: string): Resend {
  if (!resendSingleton) {
    resendSingleton = new Resend(apiKey);
  }
  return resendSingleton;
}

// ============================================
// Types
// ============================================
export interface ReservationEmailData {
  userName: string;
  userEmail: string;
  reservationId: string;
  title: string;
  spaceName: string;
  spaceCode: string;
  date: string;
  timeRange: string;
  attendees: number;
  adminNotes?: string;
  reviewerName?: string;
}

// ============================================
// Plantillas HTML compartidas
// ============================================

function baseTemplate(content: string, preheader: string = ""): string {
  const logoUrl = `${APP_URL}/images/iuce-logo-color.png`;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#1B3A5C,#3B7DD8);padding:28px 32px;text-align:center;">
          <img src="${logoUrl}" alt="IUCE" width="140" height="42" style="display:block;margin:0 auto 12px;height:42px;width:auto;max-width:140px;" />
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">Reservas</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Instituto Universitario de Ciencias de la Educación</p>
        </td></tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr><td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">
            Universidad de Salamanca · IUCE<br>
            Este es un email automático, por favor no respondas directamente.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buttonBlock(text: string, url: string, color: string = "#1B3A5C"): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td align="center">
        <a href="${url}" style="display:inline-block;background-color:${color};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          ${text}
        </a>
      </td></tr>
    </table>`;
}

function reservationDetailsBlock(data: ReservationEmailData): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;padding:20px;margin:16px 0;">
      <tr><td style="padding:6px 0;"><strong style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Reserva</strong></td></tr>
      <tr><td style="padding:4px 0;font-size:15px;color:#111827;font-weight:600;">${data.title}</td></tr>
      <tr><td style="padding:12px 0 6px;"><strong style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Espacio</strong></td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#374151;">${data.spaceName} (${data.spaceCode})</td></tr>
      <tr><td style="padding:12px 0 6px;"><strong style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Fecha y hora</strong></td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#374151;">${data.date} · ${data.timeRange}</td></tr>
      <tr><td style="padding:12px 0 6px;"><strong style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Asistentes</strong></td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#374151;">${data.attendees} persona${data.attendees === 1 ? "" : "s"}</td></tr>
    </table>`;
}

// ============================================
// Magic link (Sprint 1)
// ============================================
export async function sendMagicLinkEmail(email: string, url: string) {
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Accede a IUCE Reservas</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">
      Hemos recibido una solicitud de acceso para <strong>${email}</strong>.
      Pulsa el siguiente botón para iniciar sesión:
    </p>
    ${buttonBlock("Iniciar sesión", url, "#1B3A5C")}
    <div style="background-color:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">
        Este enlace es válido durante <strong>10 minutos</strong> y solo se puede usar una vez.<br>
        Si no has solicitado este acceso, puedes ignorar este email.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Tu enlace de acceso a IUCE Reservas",
    html: baseTemplate(content, "Pulsa para acceder a IUCE Reservas"),
  });
}

// ============================================
// Notificaciones de reservas (Sprint 4)
// ============================================

/** Email de confirmación enviado al usuario al crear una reserva. */
export async function sendReservationCreatedEmail(data: ReservationEmailData) {
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Solicitud recibida</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      Hola ${data.userName}, hemos recibido tu solicitud de reserva. Un administrador la revisará en breve.
    </p>
    <div style="display:inline-block;background-color:#FFFAEB;color:#B54708;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:8px;">
      Estado: PENDIENTE
    </div>
    ${reservationDetailsBlock(data)}
    ${buttonBlock("Ver mi reserva", `${APP_URL}/dashboard`)}
    <p style="margin:0;color:#9ca3af;font-size:12px;">Recibirás otro email cuando el administrador revise tu solicitud.</p>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Solicitud recibida: ${data.title}`,
    html: baseTemplate(content, `Tu solicitud de reserva para ${data.spaceName} ha sido recibida.`),
  });
}

/** Email enviado a los administradores cuando llega una nueva solicitud. */
export async function sendNewRequestToAdminEmail(data: ReservationEmailData, adminEmails: string[]) {
  if (adminEmails.length === 0) {
    console.warn("No hay administradores configurados para notificar la nueva solicitud.");
    return { success: true, skipped: true };
  }
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Nueva solicitud de reserva</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      <strong>${data.userName}</strong> (${data.userEmail}) ha solicitado una reserva que requiere tu aprobación.
    </p>
    ${reservationDetailsBlock(data)}
    ${buttonBlock("Revisar solicitud", `${APP_URL}/admin/reservations`, "#C8102E")}
  `;

  return sendEmail({
    to: adminEmails,
    subject: `Nueva solicitud pendiente: ${data.title}`,
    html: baseTemplate(content, `Nueva solicitud de ${data.userName} pendiente de revisión.`),
  });
}

/**
 * Configuración visual y de copia para los dos posibles desenlaces de una
 * solicitud de reserva. Extraído como tabla constante para evitar ternarios
 * anidados en el template del email (regla typescript:S3358 / S4624) y para
 * bajar la cognitive complexity del handler.
 */
const DECISION_THEME = {
  APPROVED: {
    heading: "¡Reserva aprobada!",
    badgeBg: "#ECFDF3",
    badgeColor: "#027A48",
    badgeLabel: "Estado: APROBADA",
    buttonColor: "#12B76A",
    subjectPrefix: "Reserva aprobada",
    notesBlockBg: "#EFF8FF",
    notesBorder: "#3B7DD8",
    notesTitleColor: "#1B3A5C",
    notesTitle: "Notas del administrador:",
    statusVerb: "aprobada",
  },
  REJECTED: {
    heading: "Reserva no aprobada",
    badgeBg: "#FEF3F2",
    badgeColor: "#B42318",
    badgeLabel: "Estado: RECHAZADA",
    buttonColor: "#1B3A5C",
    subjectPrefix: "Reserva no aprobada",
    notesBlockBg: "#FEF3F2",
    notesBorder: "#D92D20",
    notesTitleColor: "#B42318",
    notesTitle: "Motivo:",
    statusVerb: "rechazada",
  },
} as const;

function buildDecisionIntro(
  decision: "APPROVED" | "REJECTED",
  userName: string,
  reviewerName?: string,
): string {
  if (decision === "REJECTED") {
    return `Hola ${userName}, lamentamos informarte de que tu solicitud de reserva no ha sido aprobada.`;
  }
  const reviewerSuffix = reviewerName ? ` por ${reviewerName}` : "";
  return `Hola ${userName}, tu reserva ha sido aprobada${reviewerSuffix}.`;
}

function buildNotesBlock(
  adminNotes: string | undefined,
  theme: (typeof DECISION_THEME)[keyof typeof DECISION_THEME],
): string {
  if (!adminNotes) return "";
  return `
      <div style="background-color:${theme.notesBlockBg};border-left:3px solid ${theme.notesBorder};padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
        <p style="margin:0 0 4px;color:${theme.notesTitleColor};font-size:12px;font-weight:600;">
          ${theme.notesTitle}
        </p>
        <p style="margin:0;color:#374151;font-size:13px;">${adminNotes}</p>
      </div>
    `;
}

/** Email enviado al usuario cuando un admin aprueba o rechaza su reserva. */
export async function sendReservationDecisionEmail(
  data: ReservationEmailData,
  decision: "APPROVED" | "REJECTED"
) {
  const theme = DECISION_THEME[decision];
  const intro = buildDecisionIntro(decision, data.userName, data.reviewerName);
  const notesBlock = buildNotesBlock(data.adminNotes, theme);

  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">${theme.heading}</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">${intro}</p>
    <div style="display:inline-block;background-color:${theme.badgeBg};color:${theme.badgeColor};padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:8px;">
      ${theme.badgeLabel}
    </div>
    ${reservationDetailsBlock(data)}
    ${notesBlock}
    ${buttonBlock("Ver mis reservas", `${APP_URL}/dashboard`, theme.buttonColor)}
  `;

  const preheader = `Tu reserva para ${data.spaceName} ha sido ${theme.statusVerb}.`;

  return sendEmail({
    to: data.userEmail,
    subject: `${theme.subjectPrefix}: ${data.title}`,
    html: baseTemplate(content, preheader),
  });
}

/** Email recordatorio enviado el día anterior a una reserva aprobada. */
export async function sendReservationReminderEmail(data: ReservationEmailData) {
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Recordatorio de reserva</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      Hola ${data.userName}, te recordamos que mañana tienes una reserva confirmada en el IUCE.
    </p>
    <div style="display:inline-block;background-color:#EFF8FF;color:#1B3A5C;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:8px;">
      Faltan menos de 24 horas
    </div>
    ${reservationDetailsBlock(data)}
    ${buttonBlock("Ver mis reservas", `${APP_URL}/dashboard`)}
    <p style="margin:0;color:#9ca3af;font-size:12px;">
      Si ya no necesitas la franja, puedes cancelar la reserva desde el panel para que otras personas puedan reservarla.
    </p>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Recordatorio: ${data.title} mañana`,
    html: baseTemplate(content, `Recordatorio de tu reserva para ${data.spaceName} mañana.`),
  });
}

/** Email enviado al usuario cuando él mismo cancela una reserva. */
export async function sendReservationCancelledEmail(data: ReservationEmailData) {
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Reserva cancelada</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      Hola ${data.userName}, hemos registrado la cancelación de tu reserva. La franja queda libre para que otras personas del IUCE puedan reservarla.
    </p>
    <div style="display:inline-block;background-color:#F3F4F6;color:#374151;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:8px;">
      Estado: CANCELADA
    </div>
    ${reservationDetailsBlock(data)}
    ${buttonBlock("Ver mis reservas", `${APP_URL}/dashboard`, "#6B7280")}
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Reserva cancelada: ${data.title}`,
    html: baseTemplate(content, `Tu reserva para ${data.spaceName} ha sido cancelada.`),
  });
}

/**
 * Email enviado al usuario cuando un administrador anula (rechaza con
 * posterioridad) una reserva que ya estaba APROBADA. El estado final en
 * BD es REJECTED para que en la vista del usuario aparezca como
 * «Rechazada», pero el copy es específico porque la reserva sí llegó a
 * estar viva y queremos comunicar claramente que se ha retirado.
 */
export async function sendReservationAnulledByAdminEmail(
  data: ReservationEmailData,
) {
  const reasonBlock = data.adminNotes
    ? `
      <div style="background-color:#FEF3F2;border-left:3px solid #D92D20;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
        <p style="margin:0 0 4px;color:#B42318;font-size:12px;font-weight:600;">
          Motivo indicado por administración:
        </p>
        <p style="margin:0;color:#374151;font-size:13px;">${data.adminNotes}</p>
      </div>
    `
    : "";

  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Tu reserva ha sido anulada</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      Hola ${data.userName}, te informamos de que la administración del IUCE ha anulado una de tus reservas previamente aprobadas. Si crees que se trata de un error, ponte en contacto con el equipo del IUCE.
    </p>
    <div style="display:inline-block;background-color:#FEF3F2;color:#B42318;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:8px;">
      Estado: RECHAZADA
    </div>
    ${reservationDetailsBlock(data)}
    ${reasonBlock}
    ${buttonBlock("Ver mis reservas", `${APP_URL}/dashboard`, "#1B3A5C")}
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Reserva anulada por administración: ${data.title}`,
    html: baseTemplate(
      content,
      `Administración ha anulado tu reserva para ${data.spaceName}.`,
    ),
  });
}

/**
 * Email enviado al usuario cuando un administrador modifica una reserva
 * existente. Se muestran tanto los datos anteriores como los nuevos para
 * que el solicitante pueda comparar de un vistazo qué cambió.
 */
export async function sendReservationModifiedEmail(
  data: ReservationEmailData,
  previous: { date: string; timeRange: string; title: string },
) {
  const changesBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;padding:14px 18px;margin:16px 0;">
      <tr><td style="padding:2px 0;"><strong style="color:#92400E;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Cambios aplicados</strong></td></tr>
      <tr><td style="padding:6px 0 2px;font-size:12px;color:#6b7280;">Título anterior</td></tr>
      <tr><td style="padding:0 0 6px;font-size:13px;color:#374151;text-decoration:line-through;">${previous.title}</td></tr>
      <tr><td style="padding:6px 0 2px;font-size:12px;color:#6b7280;">Fecha y hora anteriores</td></tr>
      <tr><td style="padding:0 0 6px;font-size:13px;color:#374151;text-decoration:line-through;">${previous.date} · ${previous.timeRange}</td></tr>
    </table>
  `;
  const notesBlock = data.adminNotes
    ? `
      <div style="background-color:#EFF8FF;border-left:3px solid #3B7DD8;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
        <p style="margin:0 0 4px;color:#1B3A5C;font-size:12px;font-weight:600;">
          Notas del administrador:
        </p>
        <p style="margin:0;color:#374151;font-size:13px;">${data.adminNotes}</p>
      </div>
    `
    : "";

  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Tu reserva ha sido modificada</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      Hola ${data.userName}, la administración del IUCE ha actualizado los detalles de una de tus reservas. A continuación tienes los nuevos datos y un resumen de lo que ha cambiado.
    </p>
    <div style="display:inline-block;background-color:#FFFBEB;color:#92400E;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:8px;">
      Reserva actualizada
    </div>
    ${reservationDetailsBlock(data)}
    ${changesBlock}
    ${notesBlock}
    ${buttonBlock("Ver mis reservas", `${APP_URL}/dashboard`, "#1B3A5C")}
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Reserva actualizada: ${data.title}`,
    html: baseTemplate(
      content,
      `Tu reserva para ${data.spaceName} ha sido actualizada por administración.`,
    ),
  });
}

// ============================================
// Helper para construir los datos del email a partir de una reserva
// ============================================
export function buildReservationEmailData(reservation: {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendees: number;
  adminNotes?: string | null;
  space: { name: string; code: string };
  user: { name: string; email: string };
  reviewedBy?: { name: string } | null;
}): ReservationEmailData {
  const startDate = new Date(reservation.startTime);
  const endDate = new Date(reservation.endTime);
  const date = startDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeRange = `${startDate.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;

  return {
    userName: reservation.user.name,
    userEmail: reservation.user.email,
    reservationId: reservation.id,
    title: reservation.title,
    spaceName: reservation.space.name,
    spaceCode: reservation.space.code,
    date,
    timeRange,
    attendees: reservation.attendees,
    adminNotes: reservation.adminNotes || undefined,
    reviewerName: reservation.reviewedBy?.name,
  };
}

// ============================================
// Envío real vía Resend
// ============================================
async function sendEmail({ to, subject, html }: { to: string | string[]; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_placeholder") {
    console.log(`[DEV] Email no enviado (sin API key): ${subject} → ${to}`);
    return { success: true, dev: true };
  }

  try {
    const resend = getResendClient(apiKey);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject: `[IUCE] ${subject}`,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(`Email error (${subject}):`, error);
    return { success: false, error };
  }
}
