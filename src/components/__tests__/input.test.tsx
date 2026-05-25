import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("usa por defecto type=text", () => {
    render(<Input data-testid="i" />);
    const input = screen.getByTestId("i") as HTMLInputElement;
    expect(input.type).toBe("text");
  });

  it("acepta type=email y lo propaga al DOM", () => {
    render(<Input type="email" data-testid="i" />);
    const input = screen.getByTestId("i") as HTMLInputElement;
    expect(input.type).toBe("email");
  });

  it("dispara onChange con el valor introducido", () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} data-testid="i" />);
    fireEvent.change(screen.getByTestId("i"), { target: { value: "abc" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("respeta el atributo disabled", () => {
    render(<Input disabled data-testid="i" />);
    expect(screen.getByTestId("i")).toBeDisabled();
  });

  it("renderiza placeholder visible al usuario", () => {
    render(<Input placeholder="nombre@usal.es" />);
    expect(screen.getByPlaceholderText("nombre@usal.es")).toBeInTheDocument();
  });
});
