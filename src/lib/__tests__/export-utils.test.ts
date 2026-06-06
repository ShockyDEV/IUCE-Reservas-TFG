import { describe, it, expect } from "vitest";
import {
  escapeCsvField,
  buildCsv,
  reservationsToCsv,
  usersToCsv,
  auditLogToCsv,
  buildCsvFilename,
  type ExportReservation,
  type ExportUser,
  type ExportAuditEntry,
} from "@/lib/export-utils";

describe("escapeCsvField", () => {
  it("devuelve cadena vacía para null y undefined", () => {
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("deja los valores simples sin entrecomillar", () => {
    expect(escapeCsvField("hola")).toBe("hola");
    expect(escapeCsvField(42)).toBe("42");
    expect(escapeCsvField(true)).toBe("true");
  });

  it("entrecomilla valores con punto y coma, comillas o saltos de línea", () => {
    expect(escapeCsvField("uno; dos")).toBe('"uno; dos"');
    expect(escapeCsvField('di "hola"')).toBe('"di ""hola"""');
    expect(escapeCsvField("primera\nsegunda")).toBe('"primera\nsegunda"');
    expect(escapeCsvField("con\r\nCRLF")).toBe('"con\r\nCRLF"');
  });

  it("no entrecomilla cuando solo hay coma (la coma no es separador)", () => {
    expect(escapeCsvField("uno, dos")).toBe("uno, dos");
  });

  it("convierte objetos no nulos a su representación de string", () => {
    expect(escapeCsvField(0)).toBe("0");
    expect(escapeCsvField(false)).toBe("false");
  });
});

describe("buildCsv", () => {
  it("genera CSV con BOM UTF-8, separador ; y CRLF", () => {
    const csv = buildCsv(["a", "b"], [
      [1, 2],
      [3, 4],
    ]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿a;b\r\n1;2\r\n3;4");
  });

  it("acepta filas vacías", () => {
    const csv = buildCsv(["x"], []);
    expect(csv).toBe("﻿x");
  });

  it("escapa los valores especiales en cabecera y filas", () => {
    const csv = buildCsv(["col;uno", "col2"], [
      ['valor con "comillas"', "ok"],
    ]);
    expect(csv).toBe(
      '﻿"col;uno";col2\r\n"valor con ""comillas""";ok',
    );
  });

  it("no rompe los acentos: el BOM es el primer byte y no hay directiva sep=", () => {
    const csv = buildCsv(["Acción"], [["Reunión"]]);
    // El segundo carácter debe ser ya el contenido, no `sep=`.
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1, 7)).toBe("Acción");
  });
});

describe("reservationsToCsv", () => {
  const sample: ExportReservation = {
    id: "res_1",
    title: "Seminario",
    status: "APPROVED",
    attendees: 5,
    startTime: new Date("2026-06-01T09:00:00Z"),
    endTime: new Date("2026-06-01T11:00:00Z"),
    adminNotes: "ok",
    space: { name: "Aula 17A", code: "IUCE-17A" },
    user: { name: "Sol Olmos", email: "solmos@usal.es" },
    reviewedBy: { name: "IUCE Tecnico" },
  };

  it("incluye la cabecera estándar de reservas", () => {
    const csv = reservationsToCsv([sample]);
    expect(csv).toContain("ID");
    expect(csv).toContain("Título");
    expect(csv).toContain("Espacio");
    expect(csv).toContain("Asistentes");
    expect(csv).toContain("Estado");
  });

  it("traduce el estado APPROVED a Aprobada", () => {
    const csv = reservationsToCsv([sample]);
    expect(csv).toContain("Aprobada");
  });

  it("rellena con cadena vacía cuando no hay revisor", () => {
    const csv = reservationsToCsv([{ ...sample, reviewedBy: null }]);
    // Garantiza que no aparece "undefined" literal
    expect(csv.toLowerCase()).not.toContain("undefined");
  });
});

describe("usersToCsv", () => {
  const sample: ExportUser = {
    id: "u_1",
    name: "Sol Olmos",
    email: "solmos@usal.es",
    role: "USER",
    isBanned: false,
    banReason: null,
    createdAt: new Date("2026-04-15T10:00:00Z"),
    lastLogin: new Date("2026-05-30T15:00:00Z"),
  };

  it("genera cabecera con todas las columnas esperadas", () => {
    const csv = usersToCsv([sample]);
    expect(csv).toContain("Nombre");
    expect(csv).toContain("Email");
    expect(csv).toContain("Rol");
    expect(csv).toContain("Suspendido");
    expect(csv).toContain("Motivo suspensión");
  });

  it("traduce isBanned a Sí / No", () => {
    expect(usersToCsv([{ ...sample, isBanned: true }])).toContain("Sí");
    expect(usersToCsv([{ ...sample, isBanned: false }])).toContain("No");
  });

  it("traduce el rol", () => {
    expect(usersToCsv([{ ...sample, role: "ADMIN" }])).toContain("Administrador");
    expect(usersToCsv([{ ...sample, role: "SUPER_ADMIN" }])).toContain("Super Administrador");
  });
});

describe("auditLogToCsv", () => {
  const sample: ExportAuditEntry = {
    id: "log_1",
    action: "RESERVATION_APPROVED",
    targetType: "reservation",
    targetId: "res_42",
    details: '{"adminNotes":"ok"}',
    createdAt: new Date("2026-05-30T18:30:00Z"),
    user: { name: "IUCE Admin", email: "admin@usal.es" },
  };

  it("serializa la acción y el usuario", () => {
    const csv = auditLogToCsv([sample]);
    expect(csv).toContain("RESERVATION_APPROVED");
    expect(csv).toContain("IUCE Admin");
    expect(csv).toContain("admin@usal.es");
  });

  it("usa formato ISO para createdAt", () => {
    const csv = auditLogToCsv([sample]);
    expect(csv).toMatch(/2026-05-30T18:30:00/);
  });

  it("trata details=null como cadena vacía", () => {
    const csv = auditLogToCsv([{ ...sample, details: null }]);
    expect(csv).not.toContain("null");
  });
});

describe("buildCsvFilename", () => {
  it("usa el patrón iuce-{entidad}-YYYY-MM-DD.csv", () => {
    const filename = buildCsvFilename("reservations");
    expect(filename).toMatch(/^iuce-reservations-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("reconoce las tres entidades aceptadas", () => {
    expect(buildCsvFilename("users")).toContain("iuce-users-");
    expect(buildCsvFilename("audit")).toContain("iuce-audit-");
  });
});
