import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IUCE Reservas | Sistema de Gestión de Espacios",
  description:
    "Sistema de gestión de reserva de espacios del Instituto Universitario de Ciencias de la Educación (IUCE) - Universidad de Salamanca.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
