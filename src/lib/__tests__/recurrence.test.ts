import { describe, it, expect } from "vitest";
import {
  generateRecurrenceDates,
  MAX_RECURRENCE_OCCURRENCES,
} from "@/lib/recurrence";
import { createBlockedSlotSchema } from "@/lib/validations";

describe("generateRecurrenceDates", () => {
  const base = new Date("2026-05-11T10:00:00.000Z");

  it("incluye siempre la fecha base como primera ocurrencia", () => {
    const end = new Date(base);
    end.setDate(end.getDate() + 30);
    const dates = generateRecurrenceDates(base, "WEEKLY", end);

    expect(dates.length).toBeGreaterThanOrEqual(1);
    expect(dates[0].getTime()).toBe(base.getTime());
  });

  it("avanza 7 días entre ocurrencias para el patrón WEEKLY", () => {
    const end = new Date(base);
    end.setDate(end.getDate() + 21);

    const dates = generateRecurrenceDates(base, "WEEKLY", end);

    expect(dates).toHaveLength(4);
    for (let i = 1; i < dates.length; i++) {
      const diffMs = dates[i].getTime() - dates[i - 1].getTime();
      expect(diffMs).toBe(7 * 24 * 60 * 60 * 1000);
    }
  });

  it("avanza 14 días entre ocurrencias para el patrón BIWEEKLY", () => {
    const end = new Date(base);
    end.setDate(end.getDate() + 42);

    const dates = generateRecurrenceDates(base, "BIWEEKLY", end);

    expect(dates).toHaveLength(4);
    for (let i = 1; i < dates.length; i++) {
      const diffMs = dates[i].getTime() - dates[i - 1].getTime();
      expect(diffMs).toBe(14 * 24 * 60 * 60 * 1000);
    }
  });

  it("avanza un mes natural entre ocurrencias para el patrón MONTHLY", () => {
    const end = new Date(base);
    end.setMonth(end.getMonth() + 3);

    const dates = generateRecurrenceDates(base, "MONTHLY", end);

    expect(dates).toHaveLength(4);
    expect(dates[1].getUTCMonth()).toBe(base.getUTCMonth() + 1);
    expect(dates[2].getUTCMonth()).toBe(base.getUTCMonth() + 2);
    expect(dates[3].getUTCMonth()).toBe(base.getUTCMonth() + 3);
  });

  it("no excede el límite de seguridad de ocurrencias", () => {
    const farFutureEnd = new Date(base);
    farFutureEnd.setFullYear(farFutureEnd.getFullYear() + 5);

    const dates = generateRecurrenceDates(base, "WEEKLY", farFutureEnd);

    expect(dates.length).toBeLessThanOrEqual(MAX_RECURRENCE_OCCURRENCES + 1);
  });

  it("devuelve solo la fecha base si endDate es anterior", () => {
    const end = new Date(base);
    end.setDate(end.getDate() - 7);

    const dates = generateRecurrenceDates(base, "WEEKLY", end);

    expect(dates).toHaveLength(1);
    expect(dates[0].getTime()).toBe(base.getTime());
  });

  it("devuelve solo la fecha base si el patrón no es soportado", () => {
    const end = new Date(base);
    end.setDate(end.getDate() + 30);

    const dates = generateRecurrenceDates(base, "ANUAL", end);

    expect(dates).toHaveLength(1);
    expect(dates[0].getTime()).toBe(base.getTime());
  });
});

describe("createBlockedSlotSchema", () => {
  const validInput = {
    spaceId: "clxxxxxxxxxxxxxxxx",
    startTime: "2026-06-01T08:00:00.000Z",
    endTime: "2026-06-01T20:00:00.000Z",
    reason: "Mantenimiento preventivo del aula",
  };

  it("acepta un bloqueo con todos los campos válidos", () => {
    const result = createBlockedSlotSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rechaza un bloqueo cuya hora de fin es anterior a la de inicio", () => {
    const result = createBlockedSlotSchema.safeParse({
      ...validInput,
      startTime: "2026-06-01T20:00:00.000Z",
      endTime: "2026-06-01T08:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un bloqueo con motivo demasiado corto", () => {
    const result = createBlockedSlotSchema.safeParse({
      ...validInput,
      reason: "ok",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un bloqueo con motivo demasiado largo", () => {
    const result = createBlockedSlotSchema.safeParse({
      ...validInput,
      reason: "a".repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un bloqueo sin spaceId", () => {
    const result = createBlockedSlotSchema.safeParse({
      ...validInput,
      spaceId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza fechas con formato inválido", () => {
    const result = createBlockedSlotSchema.safeParse({
      ...validInput,
      startTime: "no-es-una-fecha",
    });
    expect(result.success).toBe(false);
  });
});
