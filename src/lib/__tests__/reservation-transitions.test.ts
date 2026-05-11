import { describe, it, expect } from "vitest";
import { canTransitionTo, isAdminRole } from "@/lib/reservations";
import { reviewReservationSchema } from "@/lib/validations";

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

  it("rechaza APPROVED → REJECTED (estado terminal)", () => {
    expect(canTransitionTo("APPROVED", "REJECTED", "ADMIN")).toBe(false);
  });

  it("rechaza REJECTED → APPROVED (estado terminal)", () => {
    expect(canTransitionTo("REJECTED", "APPROVED", "ADMIN")).toBe(false);
  });

  it("rechaza PENDING → PENDING (no es transición real)", () => {
    expect(canTransitionTo("PENDING", "PENDING", "ADMIN")).toBe(false);
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
