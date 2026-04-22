import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || "IUCE Reservas <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Plantilla base HTML para los emails transaccionales

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

/**
 * Envía el enlace mágico de acceso al usuario.
 * Se invoca desde el endpoint /api/auth/magic-link cuando se solicita acceso.
 */
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
    <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;">
      Si el botón no funciona, copia y pega esta URL en tu navegador:<br>
      <a href="${url}" style="color:#3B7DD8;word-break:break-all;font-size:11px;">${url}</a>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: "Tu enlace de acceso a IUCE Reservas",
    html: baseTemplate(content, "Pulsa para acceder a IUCE Reservas"),
  });
}

/**
 * Envía un email transaccional a través de Resend.
 * En desarrollo (sin RESEND_API_KEY) se limita a registrar el envío en consola.
 */
async function sendEmail({ to, subject, html }: { to: string | string[]; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") {
    console.log(`[DEV] Email no enviado (sin API key): ${subject} → ${to}`);
    return { success: true, dev: true };
  }

  try {
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
