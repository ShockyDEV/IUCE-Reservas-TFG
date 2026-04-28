/**
 * Maps space names/codes to hardcoded image paths in /public/images/spaces/.
 * To add a new image: place it in public/images/spaces/ and add a mapping here.
 */
const SPACE_IMAGE_MAP: Record<string, string> = {
  // By partial name match (case-insensitive)
  "aula 17": "/images/spaces/aula-17a.jpg",
  "17a": "/images/spaces/aula-17a.jpg",
  "aula 12": "/images/spaces/aula-12a.jpg",
  "12a": "/images/spaces/aula-12a.jpg",
  "laboratorio": "/images/spaces/laboratorio.jpg",
  "lab": "/images/spaces/laboratorio.jpg",
  "usos múltiples": "/images/spaces/sala-usos-multiples.jpg",
  "sum": "/images/spaces/sala-usos-multiples.jpg",
};

/**
 * Get the hardcoded image path for a space, if one exists.
 * Checks both name and code against known mappings.
 */
export function getSpaceImage(name: string, code?: string): string | null {
  const search = `${name} ${code || ""}`.toLowerCase();
  for (const [key, path] of Object.entries(SPACE_IMAGE_MAP)) {
    if (search.includes(key.toLowerCase())) {
      return path;
    }
  }
  return null;
}
