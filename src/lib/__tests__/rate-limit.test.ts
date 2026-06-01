import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  const SCOPE = "test-scope";
  const options = { scope: SCOPE, windowMs: 60_000, max: 3 };

  beforeEach(() => {
    resetRateLimitStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite las primeras peticiones hasta el máximo", () => {
    const u1 = checkRateLimit("user-1", options);
    const u2 = checkRateLimit("user-1", options);
    const u3 = checkRateLimit("user-1", options);
    expect(u1.allowed).toBe(true);
    expect(u2.allowed).toBe(true);
    expect(u3.allowed).toBe(true);
    expect(u3.remaining).toBe(0);
  });

  it("bloquea la petición que supera el máximo dentro de la ventana", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("user-1", options);
    const blocked = checkRateLimit("user-1", options);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("aísla los contadores por clave distinta", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("user-A", options);
    const otherUser = checkRateLimit("user-B", options);
    expect(otherUser.allowed).toBe(true);
    expect(otherUser.remaining).toBe(2);
  });

  it("aísla los contadores por scope distinto", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("user-1", options);
    const otherScope = checkRateLimit("user-1", {
      ...options,
      scope: "other-scope",
    });
    expect(otherScope.allowed).toBe(true);
  });

  it("resetea la ventana cuando expira el tiempo", () => {
    checkRateLimit("user-1", options);
    checkRateLimit("user-1", options);
    checkRateLimit("user-1", options);
    vi.advanceTimersByTime(60_001);
    const newWindow = checkRateLimit("user-1", options);
    expect(newWindow.allowed).toBe(true);
    expect(newWindow.remaining).toBe(2);
  });
});
