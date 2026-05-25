import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renderiza children como texto del span", () => {
    render(<Badge>Pendiente</Badge>);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("aplica la variante info por defecto cuando se especifica", () => {
    const { container } = render(<Badge variant="info">Información</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-iuce-blue-pale");
    expect(span.className).toContain("text-iuce-blue-dark");
  });

  it("aplica la variante success con sus colores", () => {
    const { container } = render(<Badge variant="success">Aprobada</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-success-50");
    expect(span.className).toContain("text-success-700");
  });

  it("aplica la variante danger con sus colores", () => {
    const { container } = render(<Badge variant="danger">Rechazada</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-danger-50");
    expect(span.className).toContain("text-danger-700");
  });

  it("permite añadir clases personalizadas vía className", () => {
    const { container } = render(<Badge className="custom-token">Extra</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("custom-token");
  });
});
