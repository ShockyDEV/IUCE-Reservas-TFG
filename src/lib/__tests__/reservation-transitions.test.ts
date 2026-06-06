import { describe, it, expect } from "vitest";
import { canTransitionTo, isAdminRole } from "@/lib/reservations";
import {
  reviewReservationSchema,
  adminUpdateReservationSchema,
} from "@/lib/validations";

describe("canTransitionTo", () => {
  it("permite PENDING → APPROVED por un ADMIN", () => {
    expect(canTransitionTo("PENDING", "APPROVED", "ADMIN")).toBe(true);
  });

  it("permite PENDING → REJECTED por un ADMIN", () => {
    expect(canTransitionTo("PENDING", "REJECTED", "ADMIN")).toBe(true);
  });

  it("permite PENDING → APPROVED por un SUPER_ADMIN", () => {
    expect(canTransitionTo("PENDING", "APPROVED", "SUPER_ADMIN")).toBe(true);
  });

  it("rechaza PENDING → APPROVED por un USER sin permisos", () => {
    expect(canTransitionTo("PENDING", "APPROVED", "USER")).toBe(false);
  });

  it("permite APPROVED → REJECTED por un ADMIN (anulación posterior)", () => {
    expect(canTransitionTo("APPROVED", "REJECTED", "ADMIN")).toBe(true);
  });

  it("permite APPROVED → REJECTED por un SUPER_ADMIN", () => {
    expect(canTransitionTo("APPROVED", "REJECTED", "SUPER_ADMIN")).toBe(true);
  });

  it("rechaza APPROVED → REJECTED por un USER (sin permisos)", () => {
    expect(canTransitionTo("APPROVED", "REJECTED", "USER")).toBe(false);
  });

  it("rechaza REJECTED → APPROVED (estado terminal)", () => {
    expect(canTransitionTo("REJECTED", "APPROVED", "ADMIN")).toBe(false);
  });

  it("rechaza PENDING → PENDING (no es transición real)", () => {
    expect(canTransitionTo("PENDING", "PENDING", "ADMIN")).toBe(false);
  });

  it("permite PENDING → CANCELLED por un USER (propietario)", () => {
    expect(canTransitionTo("PENDING", "CANCELLED", "USER")).toBe(true);
  });

  it("permite PENDING → CANCELLED por un ADMIN", () => {
    expect(canTransitionTo("PENDING", "CANCELLED", "ADMIN")).toBe(true);
  });

  it("permite APPROVED → CANCELLED por un USER (propietario)", () => {
    expect(canTransitionTo("APPROVED", "CANCELLED", "USER")).toBe(true);
  });

  it("permite APPROVED → CANCELLED por un ADMIN", () => {
    expect(canTransitionTo("APPROVED", "CANCELLED", "ADMIN")).toBe(true);
  });

  it("rechaza CANCELLED → APPROVED (estado terminal)", () => {
    expect(canTransitionTo("CANCELLED", "APPROVED", "ADMIN")).toBe(false);
  });

  it("rechaza EXPIRED → CANCELLED (estado terminal)", () => {
    expect(canTransitionTo("EXPIRED", "CANCELLED", "ADMIN")).toBe(false);
  });
});

describe("isAdminRole", () => {
  it("reconoce ADMIN como rol administrativo", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
  });

  it("reconoce SUPER_ADMIN como rol administrativo", () => {
    expect(isAdminRole("SUPER_ADMIN")).toBe(true);
  });

  it("rechaza USER como rol administrativo", () => {
    expect(isAdminRole("USER")).toBe(false);
  });

  it("rechaza un rol indefinido", () => {
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe("reviewReservationSchema", () => {
  it("acepta una decisión APPROVED sin notas", () => {
    const result = reviewReservationSchema.safeParse({ status: "APPROVED" });
    expect(result.success).toBe(true);
  });

  it("acepta una decisión REJECTED con notas", () => {
    const result = reviewReservationSchema.safeParse({
      status: "REJECTED",
      adminNotes: "El espacio está reservado para otra actividad institucional",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un estado distinto de APPROVED o REJECTED", () => {
    const result = reviewReservationSchema.safeParse({ status: "PENDING" });
    expect(result.success).toBe(false);
  });

  it("rechaza adminNotes que excedan los 500 caracteres", () => {
    const result = reviewReservationSchema.safeParse({
      status: "REJECTED",
      adminNotes: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("adminUpdateReservationSchema", () => {
  const baseValidPayload = {
    title: "Reunión del claustro",
    startTime: "2026-09-10T10:00:00Z",
    endTime: "2026-09-10T11:30:00Z",
    attendees: 12,
  };

  it("acepta una modificación válida", () => {
    const result = adminUpdateReservationSchema.safeParse(baseValidPayload);
    expect(result.success).toBe(true);
  });

  it("rechaza una modificación con hora de fin anterior a la de inicio", () => {
    const result = adminUpdateReservationSchema.safeParse({
      ...baseValidPayload,
      startTime: "2026-09-10T12:00:00Z",
      endTime: "2026-09-10T10:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un título demasiado corto", () => {
    const result = adminUpdateReservationSchema.safeParse({
      ...baseValidPayload,
      title: "x",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza fechas no parseables", () => {
    const result = adminUpdateReservationSchema.safeParse({
      ...baseValidPayload,
      startTime: "no-es-una-fecha",
    });
    expect(result.success).toBe(false);
  });
});
