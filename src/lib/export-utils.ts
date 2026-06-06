/**
 * Utilidades para serializar entidades del sistema en formato CSV.
 *
 * Se genera CSV manualmente (sin depender de paquetes externos). Decisiones
 * de formato:
 *   - Separador: `;` (punto y coma). Es la convención usada por Excel en
 *     locale español (que reserva `,` para los decimales). Con `;` Excel-ES
 *     abre directamente el archivo en columnas sin necesidad de hints, y
 *     además respeta correctamente el BOM UTF-8 (la directiva `sep=`
 *     interfiere con la detección del BOM en algunas versiones de Excel y
 *     provoca que los acentos aparezcan como caracteres extraños).
 *   - BOM UTF-8 (`﻿`) al inicio para forzar la codificación.
 *   - Saltos de línea CRLF (`\r\n`) y comillas dobles para escapar valores
 *     que contengan el separador, comillas o saltos de línea.
 *
 * Otros consumidores (LibreOffice, pandas, scripts) detectan el separador
 * automáticamente o aceptan `sep=";"` como parámetro explícito.
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

/** Escapa un valor individual: comillas dobles si contiene el separador,
 *  comillas dobles o saltos de línea. */
export function escapeCsvField(value: unknown): string {
  const str = csvStringify(value);
  const needsQuoting = /[";\r\n]/.test(str);
  if (!needsQuoting) return str;
  return `"${str.replaceAll('"', '""')}"`;
}

/**
 * Convierte cualquier valor a una representación CSV-friendly. Evita la
 * estringificación por defecto `[object Object]` para objetos (regla
 * typescript:S6551) y formatea las fechas como ISO.
 */
function csvStringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return value.toString();
  }
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

/**
 * Construye un CSV a partir de cabecera + filas. La salida lleva:
 *   - BOM UTF-8 al principio (`﻿`) para que Excel detecte la codificación
 *     y los acentos no aparezcan como caracteres extraños.
 *   - Separador `;` (compatible con Excel-ES sin necesidad de hint).
 *   - Líneas separadas por CRLF (`\r\n`).
 */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsvField).join(";")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(";"));
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
