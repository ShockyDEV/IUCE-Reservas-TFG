import Image from "next/image";
import { Phone, Mail, Globe } from "lucide-react";

export function InstitutionalFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 bg-gray-950 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-10 sm:grid-cols-3 lg:px-8">
        <div className="flex justify-center sm:justify-start">
          <Image
            src="/images/iuce-logo-white.webp"
            alt="IUCE — Instituto Universitario de Ciencias de la Educación"
            width={200}
            height={60}
            className="h-12 w-auto"
          />
        </div>

        <div className="flex flex-col items-center gap-2 text-sm">
          <a
            href="tel:+34923294634"
            className="inline-flex items-center gap-2 text-white/90 transition-colors hover:text-white"
          >
            <Phone className="h-4 w-4 text-usal-red" />
            +34 923 294 634
          </a>
          <a
            href="mailto:iuce@usal.es"
            className="inline-flex items-center gap-2 text-white/90 transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4 text-usal-red" />
            iuce@usal.es
          </a>
        </div>

        <div className="flex items-center justify-center sm:justify-end">
          <a
            href="https://www.usal.es"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
            aria-label="Universidad de Salamanca"
          >
            <Image
              src="/images/usal-logo-white.webp"
              alt="Universidad de Salamanca"
              width={260}
              height={78}
              className="h-12 w-auto"
            />
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 bg-gray-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-3 text-[11px] text-white/55 sm:flex-row">
          <p>
            © {year} IUCE – Universidad de Salamanca – Todos los derechos
            reservados
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://iuce.usal.es"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Web del IUCE"
              className="transition-colors hover:text-white"
            >
              <Globe className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com/IUCE_USAL"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X / Twitter del IUCE"
              className="transition-colors hover:text-white"
            >
              <XIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function XIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

