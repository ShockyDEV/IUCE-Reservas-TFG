import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Normas de uso — IUCE Reservas" };

const DEFAULT_NORMAS = `# Normas de uso de los espacios del IUCE

## 1. Límite de reservas
Cada usuario puede solicitar un máximo de 5 reservas por día. Si necesitas más, contacta con la administración del IUCE.

## 2. Puntualidad
Respeta los horarios de tu reserva. Si no vas a poder asistir, cancela la reserva con la mayor antelación posible para que otras personas puedan usar el espacio.

## 3. Cuidado del espacio
Deja el aula o sala en las mismas condiciones en las que la encontraste. Recoge cualquier material utilizado, limpia las pizarras y asegúrate de que las sillas están en su sitio.

## 4. Aforo y capacidad
No excedas la capacidad máxima indicada para cada espacio. Indica el número aproximado de asistentes al realizar tu reserva.

## 5. Nivel de ruido
Mantén un nivel de ruido adecuado al tipo de espacio reservado. Las salas de reuniones y aulas están próximas a otras dependencias del IUCE.

## 6. Uso apropiado
Los espacios del IUCE están destinados a actividades académicas, de investigación y reuniones institucionales. No se permite su uso para fines personales o comerciales.

## 7. Equipamiento
El equipamiento tecnológico (proyectores, sistemas de audio, ordenadores) debe usarse con cuidado. Comunica cualquier avería o incidencia a la administración del IUCE.

## 8. Cancelaciones
Si no puedes utilizar un espacio reservado, cancela tu reserva lo antes posible. Las cancelaciones repetidas sin motivo justificado podrán ser sancionadas con la suspensión temporal del acceso al sistema.`;

/**
 * Renderiza un markdown mínimo (h1, h2, párrafos) sin dependencias externas.
 * Suficiente para el formato editable que mantenemos en SiteSetting.
 */
function renderMarkdown(md: string): string {
  const escaped = md
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const lines = escaped.split(/\r?\n/);
  let html = "";
  let inParagraph = false;

  const closeParagraph = () => {
    if (inParagraph) {
      html += "</p>";
      inParagraph = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      closeParagraph();
      html += `<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-3">${trimmed.slice(2)}</h1>`;
    } else if (trimmed.startsWith("## ")) {
      closeParagraph();
      html += `<h2 class="text-lg font-semibold text-iuce-blue mt-5 mb-2">${trimmed.slice(3)}</h2>`;
    } else if (trimmed === "") {
      closeParagraph();
    } else {
      if (inParagraph) {
        html += " ";
      } else {
        html += '<p class="text-sm text-gray-600 leading-relaxed mb-2">';
        inParagraph = true;
      }
      html += trimmed;
    }
  }
  closeParagraph();
  return html;
}

export default async function NormasPage() {
  let content = DEFAULT_NORMAS;
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "normas_rules" },
    });
    if (setting?.value) {
      content = setting.value;
    }
  } catch {
    // Silently fall back to defaults if SiteSetting table is unavailable
  }

  const rendered = renderMarkdown(content);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-iuce-blue-pale">
          <BookOpen className="h-5 w-5 text-iuce-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Normas de uso</h1>
          <p className="text-xs text-gray-500">
            Reglas vigentes para la reserva de espacios del Instituto Universitario de Ciencias de la Educación.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <article
            className="prose-iuce"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400 text-center">
        Para cualquier duda sobre las normas, contacta con la administración del IUCE en
        <a href="mailto:iuce.tecnico@usal.es" className="ml-1 underline hover:text-iuce-blue">
          iuce.tecnico@usal.es
        </a>
        .
      </p>
    </div>
  );
}
