import Link from "next/link";
import Image from "next/image";

export function InstitutionalFooter() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Image
              src="/images/iuce-logo.png"
              alt="IUCE"
              width={140}
              height={48}
              className="h-10 w-auto"
            />
            <p className="mt-3 text-xs text-gray-500 leading-relaxed">
              Instituto Universitario de Ciencias de la Educación
              <br />
              Universidad de Salamanca
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Plataforma
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/spaces"
                  className="text-gray-600 hover:text-iuce-blue-dark"
                >
                  Catálogo de espacios
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-iuce-blue-dark"
                >
                  Panel del usuario
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Institucional
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="https://iuce.usal.es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-iuce-blue-dark"
                >
                  Web del IUCE
                </a>
              </li>
              <li>
                <a
                  href="https://www.usal.es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-iuce-blue-dark"
                >
                  Universidad de Salamanca
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-gray-100 pt-6 text-xs text-gray-400 sm:flex-row">
          <p>© {new Date().getFullYear()} IUCE — Universidad de Salamanca</p>
          <p>Plataforma institucional de reservas de espacios</p>
        </div>
      </div>
    </footer>
  );
}
