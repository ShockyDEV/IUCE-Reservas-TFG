import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Asegura que cada test arranca con un DOM limpio cuando se ejecutan
// varios renders en el mismo fichero.
afterEach(() => {
  cleanup();
});
