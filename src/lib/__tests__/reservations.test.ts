import { describe, it, expect } from "vitest";
import { createReservationSchema } from "@/lib/validations";

const tomorrowAt = (hours: number, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const yesterdayAt = (hours: number, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

describe("createReservationSchema", () => {
  const baseValid = {
    title: "Reunión de departamento",
    description: "Reunión mensual del IUCE",
    spaceId: "space_123",
    startTime: tomorrowAt(10),
    endTime: tomorrowAt(11),
    attendees: 8,
  };

  it("acepta una reserva válida", () => {
    const result = createReservationSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
  });

  it("rechaza si endTime es anterior a startTime", () => {
    const result = createReservationSchema.safeParse({
      ...baseValid,
      startTime: tomorrowAt(11),
      endTime: tomorrowAt(10),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.message);
      expect(issues.some((m) => m.includes("posterior"))).toBe(true);
    }
  });

  it("rechaza si la fecha es pasada", () => {
    const result = createReservationSchema.safeParse({
      ...baseValid,
      startTime: yesterdayAt(10),
      endTime: yesterdayAt(11),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.message);
      expect(issues.some((m) => m.toLowerCase().includes("pasada"))).toBe(
        true
      );
    }
  });

  it("rechaza títulos demasiado cortos", () => {
    const result = createReservationSchema.safeParse({
      ...baseValid,
      title: "x",
    });
    expect(result.success).toBe(false);
  });

  it("permite descripción vacía", () => {
    const { description, ...rest } = baseValid;
    const result = createReservationSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("rechaza spaceId vacío", () => {
    const result = createReservationSchema.safeParse({
      ...baseValid,
      spaceId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza attendees por debajo de 1", () => {
    const result = createReservationSchema.safeParse({
      ...baseValid,
      attendees: 0,
    });
    expect(result.success).toBe(false);
  });
});
