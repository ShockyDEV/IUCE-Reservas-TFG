import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { space: { findMany } } }));

import HomePage from "../page";

// page.tsx usa el JSX automático de Next; Vitest compila con el clásico.
vi.stubGlobal("React", React);

const render = async () => renderToStaticMarkup(await HomePage());

describe("portada: tarjetas de espacios", () => {
  it("muestra la capacidad guardada en la base de datos", async () => {
    findMany.mockResolvedValue([
      { name: "Aula 17A", code: "IUCE-17A", capacity: 25, imageUrl: null },
    ]);
    const html = await render();
    expect(html).toContain("IUCE-17A · 25 personas");
    expect(findMany.mock.calls[0][0].where).toEqual({ isActive: true });
  });

  it("no rompe la portada si la base de datos falla", async () => {
    findMany.mockImplementation(() => Promise.reject(new Error("sin BD")));
    const html = await render();
    expect(html).not.toContain("personas");
    expect(html).toContain("Ver catálogo completo");
  });
});
