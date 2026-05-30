"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, BookOpen, Eye, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonClassName } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

function previewMarkdown(md: string): string {
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

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
      html += `<h1 class="text-xl font-bold text-gray-900 mt-4 mb-2">${trimmed.slice(2)}</h1>`;
    } else if (trimmed.startsWith("## ")) {
      closeParagraph();
      html += `<h2 class="text-base font-semibold text-iuce-blue mt-4 mb-1">${trimmed.slice(3)}</h2>`;
    } else if (trimmed === "") {
      closeParagraph();
    } else {
      if (!inParagraph) {
        html += '<p class="text-xs text-gray-600 leading-relaxed mb-2">';
        inParagraph = true;
      } else {
        html += " ";
      }
      html += trimmed;
    }
  }
  closeParagraph();
  return html;
}

export default function AdminNormasPage() {
  const [content, setContent] = useState(DEFAULT_NORMAS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings?key=normas_rules")
      .then((r) => r.json())
      .then((data) => {
        if (data.value) {
          setContent(data.value);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "normas_rules", value: content }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudo guardar");
        return;
      }
      toast.success("Normas actualizadas");
      setDirty(false);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-usal-red" />
            <span className="text-xs font-medium text-usal-red uppercase tracking-wider">
              Administración
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Editor de normas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edita el contenido publicado en la página pública{" "}
            <Link href="/normas" className="text-iuce-blue underline">
              /normas
            </Link>
            . Soporta encabezados markdown <code className="px-1 bg-gray-100 rounded">#</code> y{" "}
            <code className="px-1 bg-gray-100 rounded">##</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/normas"
            target="_blank"
            className={buttonClassName({ variant: "outline", size: "sm" })}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Ver página
          </Link>
          <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contenido markdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setDirty(true);
                }}
                rows={24}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-gray-400 mt-2">
                {content.length} caracteres
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-iuce-blue" /> Vista previa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <article
                dangerouslySetInnerHTML={{ __html: previewMarkdown(content) }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
