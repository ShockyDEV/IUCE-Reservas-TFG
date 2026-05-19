import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock del cliente Prisma para verificar el shape de la llamada
const auditLogCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: (...args: unknown[]) => auditLogCreate(...args),
    },
  },
}));

import { logAudit } from "@/lib/audit";

describe("logAudit", () => {
  beforeEach(() => {
    auditLogCreate.mockReset();
  });

  it("persiste una entrada con todos los campos serializados correctamente", async () => {
    auditLogCreate.mockResolvedValueOnce({ id: "audit-1" });

    await logAudit({
      action: "RESERVATION_APPROVED",
      userId: "user-1",
      targetType: "reservation",
      targetId: "res-1",
      details: { foo: "bar", count: 3 },
    });

    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const arg = auditLogCreate.mock.calls[0][0];
    expect(arg.data).toMatchObject({
      action: "RESERVATION_APPROVED",
      userId: "user-1",
      targetType: "reservation",
      targetId: "res-1",
    });
    expect(JSON.parse(arg.data.details)).toEqual({ foo: "bar", count: 3 });
  });

  it("acepta entradas sin detalles y guarda details como null", async () => {
    auditLogCreate.mockResolvedValueOnce({ id: "audit-2" });

    await logAudit({
      action: "BLOCKED_SLOT_DELETED",
      userId: "user-1",
      targetType: "blocked_slot",
      targetId: "block-1",
    });

    const arg = auditLogCreate.mock.calls[0][0];
    expect(arg.data.details).toBeNull();
  });

  it("absorbe los errores de escritura y no propaga la excepción", async () => {
    auditLogCreate.mockRejectedValueOnce(new Error("connection lost"));

    await expect(
      logAudit({
        action: "USER_ROLE_CHANGED",
        userId: "user-1",
        targetType: "user",
        targetId: "user-2",
        details: { from: "USER", to: "ADMIN" },
      })
    ).resolves.toBeUndefined();
  });
});
