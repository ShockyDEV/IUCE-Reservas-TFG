import { describe, it, expect } from "vitest";
import {
  parseEquipment,
  getAuditActionLabel,
  RESERVATION_STATUS_BADGE,
} from "@/lib/format";

describe("parseEquipment", () => {
  it("acepta un array directo", () => {
    expect(parseEquipment(["a", "b"])).toEqual(["a", "b"]);
  });

  it("acepta un JSON serializado", () => {
    expect(parseEquipment('["proyector","pizarra"]')).toEqual([
      "proyector",
      "pizarra",
    ]);
  });

  it("filtra elementos no string del array", () => {
    expect(parseEquipment(["ok", 1, null, "bien"])).toEqual(["ok", "bien"]);
  });

  it("devuelve array vacío para entradas no parseables", () => {
    expect(parseEquipment(null)).toEqual([]);
    expect(parseEquipment(undefined)).toEqual([]);
    expect(parseEquipment("invalid")).toEqual([]);
    expect(parseEquipment(42)).toEqual([]);
  });

  it("devuelve array vacío si el JSON no es un array", () => {
    expect(parseEquipment('{"key":"val"}')).toEqual([]);
  });
});

describe("getAuditActionLabel", () => {
  it("traduce las acciones conocidas", () => {
    expect(getAuditActionLabel("RESERVATION_APPROVED")).toBe("Reserva aprobada");
    expect(getAuditActionLabel("USER_BANNED")).toBe("Usuario suspendido");
    expect(getAuditActionLabel("EXPORT_CSV")).toBe("Exportación CSV");
  });

  it("hace fallback al código para acciones desconocidas", () => {
    expect(getAuditActionLabel("RANDOM_ACTION")).toBe("RANDOM_ACTION");
  });
});

describe("RESERVATION_STATUS_BADGE", () => {
  it("cubre los cinco estados de ReservationStatus", () => {
    const keys = Object.keys(RESERVATION_STATUS_BADGE);
    expect(keys).toEqual([
      "PENDING",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
      "EXPIRED",
    ]);
  });

  it("asigna la variante semántica correcta", () => {
    expect(RESERVATION_STATUS_BADGE.PENDING.variant).toBe("warning");
    expect(RESERVATION_STATUS_BADGE.APPROVED.variant).toBe("success");
    expect(RESERVATION_STATUS_BADGE.REJECTED.variant).toBe("danger");
  });
});
