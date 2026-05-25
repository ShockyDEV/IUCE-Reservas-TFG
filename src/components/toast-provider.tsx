"use client";

import { Toaster } from "react-hot-toast";

/**
 * Proveedor del sistema de notificaciones toast.
 *
 * Se monta una sola vez en el layout raíz y configura el estilo
 * corporativo: bordes redondeados, sombra suave y colores específicos
 * para los estados success, error e info. Los toasts se descartan
 * automáticamente a los 4 segundos.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "10px",
          background: "#ffffff",
          color: "#111827",
          border: "1px solid rgb(229 231 235)",
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.04)",
          fontSize: "14px",
          padding: "10px 14px",
        },
        success: {
          iconTheme: { primary: "#12B76A", secondary: "#ECFDF3" },
        },
        error: {
          iconTheme: { primary: "#D92D20", secondary: "#FEF3F2" },
        },
      }}
    />
  );
}
