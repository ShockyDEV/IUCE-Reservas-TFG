import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPersonFromUSAL } from "@/lib/usal-directory";

/**
 * Tests para el cliente del directorio institucional de la USAL.
 * Mockeamos `fetch` para no depender del servicio real durante CI.
 */

describe("fetchPersonFromUSAL", () => {
  const originalFetch = globalThis.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("devuelve null cuando el endpoint responde con status != 2xx", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    const result = await fetchPersonFromUSAL("test@usal.es");
    expect(result).toBeNull();
  });

  it("devuelve null cuando lista está vacía", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ lista: {} }),
    });
    const result = await fetchPersonFromUSAL("noexiste@usal.es");
    expect(result).toBeNull();
  });

  it("devuelve null si la respuesta no tiene info=OK", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        lista: {
          "0": { nombre: "PEPE", apellidos: "PEREZ", info: "ERROR" },
        },
      }),
    });
    const result = await fetchPersonFromUSAL("pepe@usal.es");
    expect(result).toBeNull();
  });

  it("devuelve null si la respuesta no incluye nombre", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ lista: { "0": { info: "OK" } } }),
    });
    const result = await fetchPersonFromUSAL("vacio@usal.es");
    expect(result).toBeNull();
  });

  it("convierte la respuesta a Title Case y compone nombre + apellidos", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        lista: {
          "0": {
            nombre: "MARÍA",
            apellidos: "GARCÍA LÓPEZ",
            info: "OK",
            categoria: "Profesora Titular",
            centro: "IUCE",
            unidad: "Departamento de Educación",
          },
        },
      }),
    });
    const result = await fetchPersonFromUSAL("mgarcia@usal.es");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("María García López");
    expect(result?.category).toBe("Profesora Titular");
    expect(result?.centre).toBe("IUCE");
    expect(result?.department).toBe("Departamento de Educación");
  });

  it("acepta entrada con solo nombre sin apellidos", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        lista: { "0": { nombre: "JUAN", info: "OK" } },
      }),
    });
    const result = await fetchPersonFromUSAL("juan@usal.es");
    expect(result?.name).toBe("Juan");
  });

  it("envía POST con peticion=VER_DATOS y mail = prefijo del email", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ lista: {} }),
    });

    await fetchPersonFromUSAL("solmos@usal.es");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://directorio.usal.es/src/AgendaBusqueda.php");
    expect(init.method).toBe("POST");
    const body = String(init.body);
    expect(body).toContain("peticion=VER_DATOS");
    expect(body).toContain("mail=solmos");
  });

  it("captura excepciones de red y devuelve null", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    const result = await fetchPersonFromUSAL("fallo@usal.es");
    expect(result).toBeNull();
  });
});
