import { describe, it, expect } from "vitest";
import {
  createSpaceSchema,
  updateSpaceSchema,
  updateUserRoleSchema,
} from "@/lib/validations";

describe("createSpaceSchema", () => {
  const valid = {
    name: "Aula 25B",
    code: "IUCE-25B",
    description: "Aula docente del IUCE",
    capacity: 30,
    floor: 2,
    building: "IUCE - Paseo de Canalejas 169",
    equipment: ["Proyector", "Wi-Fi"],
    accessibility: true,
    color: "#3B7DD8",
  };

  it("acepta un espacio con todos los campos válidos", () => {
    expect(createSpaceSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza un nombre demasiado corto", () => {
    const r = createSpaceSchema.safeParse({ ...valid, name: "AB" });
    expect(r.success).toBe(false);
  });

  it("rechaza un código con caracteres no permitidos", () => {
    const r = createSpaceSchema.safeParse({ ...valid, code: "IUCE 25B" });
    expect(r.success).toBe(false);
  });

  it("rechaza una capacidad cero o negativa", () => {
    const r1 = createSpaceSchema.safeParse({ ...valid, capacity: 0 });
    const r2 = createSpaceSchema.safeParse({ ...valid, capacity: -1 });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it("rechaza una capacidad por encima del máximo", () => {
    const r = createSpaceSchema.safeParse({ ...valid, capacity: 1001 });
    expect(r.success).toBe(false);
  });

  it("rechaza un color que no sea hex de 6 dígitos", () => {
    const r1 = createSpaceSchema.safeParse({ ...valid, color: "blue" });
    const r2 = createSpaceSchema.safeParse({ ...valid, color: "#ABC" });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it("acepta una lista de equipamiento vacía pero no más de 40 elementos", () => {
    const okEmpty = createSpaceSchema.safeParse({
      ...valid,
      equipment: [],
    });
    const tooMany = createSpaceSchema.safeParse({
      ...valid,
      equipment: Array.from({ length: 41 }, (_, i) => `Item ${i}`),
    });
    expect(okEmpty.success).toBe(true);
    expect(tooMany.success).toBe(false);
  });
});

describe("updateSpaceSchema", () => {
  it("acepta cualquier subconjunto de campos válidos", () => {
    expect(updateSpaceSchema.safeParse({}).success).toBe(true);
    expect(
      updateSpaceSchema.safeParse({ capacity: 50 }).success
    ).toBe(true);
    expect(
      updateSpaceSchema.safeParse({ name: "Nuevo nombre", accessibility: false })
        .success
    ).toBe(true);
  });

  it("aplica las mismas validaciones a los campos que sí se envían", () => {
    expect(
      updateSpaceSchema.safeParse({ capacity: 0 }).success
    ).toBe(false);
    expect(
      updateSpaceSchema.safeParse({ color: "#ZZ0000" }).success
    ).toBe(false);
  });
});

describe("updateUserRoleSchema", () => {
  it("acepta los tres roles soportados", () => {
    for (const role of ["USER", "ADMIN", "SUPER_ADMIN"] as const) {
      expect(updateUserRoleSchema.safeParse({ role }).success).toBe(true);
    }
  });

  it("rechaza un rol desconocido", () => {
    expect(
      updateUserRoleSchema.safeParse({ role: "MODERATOR" }).success
    ).toBe(false);
  });

  it("rechaza la ausencia del campo role", () => {
    expect(updateUserRoleSchema.safeParse({}).success).toBe(false);
  });
});
