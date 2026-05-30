/**
 * Cliente del directorio institucional de la USAL.
 *
 * El servicio expone una llamada POST a `directorio.usal.es` que devuelve
 * los datos de la persona asociada a una cuenta `@usal.es`. Usamos esta
 * función para mantener actualizados los nombres mostrados en el sistema
 * sin tener que pedir a cada usuario que edite manualmente su perfil.
 *
 * Nota: el endpoint responde con texto en mayúsculas; los nombres se
 * pasan a Title Case antes de devolverlos.
 */

const DIRECTORY_URL = "https://directorio.usal.es/src/AgendaBusqueda.php";

export interface USALPerson {
  name: string;
  category?: string;
  centre?: string;
  department?: string;
}

interface DirectoryEntry {
  nombre?: string;
  apellidos?: string;
  mail?: string;
  categoria?: string;
  centro?: string;
  unidad?: string;
  info?: string;
}

interface DirectoryResponse {
  lista?: Record<string, DirectoryEntry>;
  info?: string;
}

/** Busca una persona en el directorio de la USAL a partir de su email. */
export async function fetchPersonFromUSAL(email: string): Promise<USALPerson | null> {
  try {
    const mailPrefix = email.replace(/@usal\.es$/i, "");

    const body = new URLSearchParams({
      peticion: "VER_DATOS",
      nombre: "",
      apellidos: "",
      mail: mailPrefix,
      extension: "",
      unidad: "",
    });

    const response = await fetch(DIRECTORY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      console.error(`Directorio USAL respondió ${response.status}`);
      return null;
    }

    const data: DirectoryResponse = await response.json();
    return parseDirectoryResponse(data);
  } catch (error) {
    console.error("Error consultando el directorio USAL:", error);
    return null;
  }
}

function parseDirectoryResponse(data: DirectoryResponse): USALPerson | null {
  if (!data?.lista) return null;
  const firstKey = Object.keys(data.lista)[0];
  if (!firstKey) return null;

  const entry = data.lista[firstKey];
  if (!entry?.nombre || entry.info !== "OK") return null;

  const fullName = toTitleCase(
    entry.apellidos ? `${entry.nombre} ${entry.apellidos}` : entry.nombre
  );

  return {
    name: fullName.trim(),
    category: entry.categoria || undefined,
    centre: entry.centro || undefined,
    department: entry.unidad || undefined,
  };
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}
