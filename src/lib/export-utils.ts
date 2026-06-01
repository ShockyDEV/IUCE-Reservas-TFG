/**
 * Utilidades para serializar entidades del sistema en formato CSV.
 *
 * Se genera CSV manualmente (sin depender de paquetes externos) respetando
 * la convención RFC 4180: separador `,`, cabecera obligatoria, comillas
 * dobles cuando el valor contiene separador, salto de línea o comillas.
 * Esto evita problemas al abrir el fichero en Excel/LibreOffice y mantiene
 * el bundle ligero.
 */

import { RESERVATION_STATUS_BADGE, ROLE_LABEL } from "@/lib/format";

export interface ExportReservation {
  id: string;
  title: string;
  status: string;
  attendees: number;
  startTime: Date | string;
  endTime: Date | string;
  adminNotes?: string | null;
  space: { name: string; code: string };
  user: { name: string; email: string };
  reviewedBy?: { name: string } | null;
}

export interface ExportUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned?: boolean;
  banReason?: string | null;
  createdAt: Date | string;
  lastLogin?: Date | string | null;
}

export interface ExportAuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string | null;
  createdAt: Date | string;
  user: { name: string; email: string };
}

/** Escapa un valor individual según RFC 4180. */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  // Number, boolean, bigint, string → toString; Date → ISO; Object → JSON.
  let str: string;
  if (typeof value === "string") {
    str = value;
  } else if (value instanceof Date) {
    str = value.toISOString();
  } else if (typeof value === "object") {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }
  const needsQuoting = /[",\r\n]/.test(str);
  if (!needsQuoting) return str;
  return `"${str.replaceAll('"', '""')}"`;
}

/** Construye un CSV a partir de cabecera + filas. Prepende BOM para Excel. */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsvField).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(","));
  }
  return "﻿" + lines.join("\r\n");
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function reservationsToCsv(reservations: ExportReservation[]): string {
  const headers = [
    "ID",
    "Título",
    "Espacio",
    "Código",
    "Usuario",
    "Email",
    "Fecha",
    "Hora inicio",
    "Hora fin",
    "Asistentes",
    "Estado",
    "Revisado por",
    "Notas administración",
  ];
  const rows = reservations.map((r) => [
    r.id,
    r.title,
    r.space.name,
    r.space.code,
    r.user.name,
    r.user.email,
    fmtDate(r.startTime),
    fmtTime(r.startTime),
    fmtTime(r.endTime),
    r.attendees,
    RESERVATION_STATUS_BADGE[r.status as keyof typeof RESERVATION_STATUS_BADGE]
      ?.label || r.status,
    r.reviewedBy?.name || "",
    r.adminNotes || "",
  ]);
  return buildCsv(headers, rows);
}

export function usersToCsv(users: ExportUser[]): string {
  const headers = [
    "ID",
    "Nombre",
    "Email",
    "Rol",
    "Suspendido",
    "Motivo suspensión",
    "Alta",
    "Último login",
  ];
  const rows = users.map((u) => [
    u.id,
    u.name,
    u.email,
    ROLE_LABEL[u.role] || u.role,
    u.isBanned ? "Sí" : "No",
    u.banReason || "",
    fmtDate(u.createdAt),
    u.lastLogin ? fmtDate(u.lastLogin) : "",
  ]);
  return buildCsv(headers, rows);
}

export function auditLogToCsv(entries: ExportAuditEntry[]): string {
  const headers = ["ID", "Fecha", "Acción", "Tipo objeto", "ID objeto", "Usuario", "Email", "Detalles"];
  const rows = entries.map((e) => [
    e.id,
    new Date(e.createdAt).toISOString(),
    e.action,
    e.targetType,
    e.targetId,
    e.user.name,
    e.user.email,
    e.details || "",
  ]);
  return buildCsv(headers, rows);
}

/** Nombre estándar de los ficheros descargados. */
export function buildCsvFilename(entity: "reservations" | "users" | "audit"): string {
  const today = new Date().toISOString().slice(0, 10);
  return `iuce-${entity}-${today}.csv`;
}
