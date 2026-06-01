import { describe, it, expect } from "vitest";
import {
  createSpaceSchema,
  updateSpaceSchema,
} from "@/lib/validations";

/**
 * Cobertura adicional de las extensiones de schema introducidas en el
 * Sprint 8: equipamiento, accesibilidad, color y flag isActive.
 */

describe("createSpaceSchema (Sprint 8)", () => {
  const valid = {
    name: "Aula 17A",
    code: "IUCE-17A",
    capacity: 40,
    equipment: ["Proyector", "Pizarra"],
    accessibility: true,
    color: "#3B7DD8",
  };

  it("acepta un payload válido", () => {
    expect(createSpaceSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza un código con caracteres no permitidos", () => {
    const result = createSpaceSchema.safeParse({ ...valid, code: "iuce/17a" });
    expect(result.success).toBe(false);
  });

  it("acepta letras en minúsculas en el código (regex case-insensitive)", () => {
    const result = createSpaceSchema.safeParse({ ...valid, code: "iuce-17a" });
    expect(result.success).toBe(true);
  });

  it("rechaza color que no sea hexadecimal", () => {
    const result = createSpaceSchema.safeParse({ ...valid, color: "blue" });
    expect(result.success).toBe(false);
  });

  it("rechaza capacidad inferior a 1", () => {
    const result = createSpaceSchema.safeParse({ ...valid, capacity: 0 });
    expect(result.success).toBe(false);
  });

  it("rechaza más de 40 elementos en equipment", () => {
    const tooMany = Array.from({ length: 41 }, (_, i) => `eq-${i}`);
    const result = createSpaceSchema.safeParse({ ...valid, equipment: tooMany });
    expect(result.success).toBe(false);
  });

  it("acepta accessibility=false por defecto cuando se omite", () => {
    const { accessibility: _accessibility, ...withoutAccess } = valid;
    const result = createSpaceSchema.safeParse(withoutAccess);
    expect(result.success).toBe(true);
  });
});

describe("updateSpaceSchema (Sprint 8)", () => {
  it("acepta payload parcial con solo isActive", () => {
    const result = updateSpaceSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("acepta payload vacío (todos los campos son opcionales)", () => {
    const result = updateSpaceSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("hereda validaciones de createSpaceSchema cuando se proporcionan campos", () => {
    const result = updateSpaceSchema.safeParse({ capacity: -5 });
    expect(result.success).toBe(false);
  });

  it("acepta cambio de isActive a true con otros campos", () => {
    const result = updateSpaceSchema.safeParse({
      isActive: true,
      name: "Nuevo nombre",
    });
    expect(result.success).toBe(true);
  });
});
