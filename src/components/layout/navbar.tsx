"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  Building2,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  CalendarCheck,
  BookOpen,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";

type Role = "USER" | "ADMIN" | "SUPER_ADMIN" | string;

interface NavbarProps {
  user: { name: string; email: string; role: Role };
}

const PUBLIC_ITEMS = [
  { href: "/dashboard", label: "Panel", icon: CalendarDays },
  { href: "/spaces", label: "Espacios", icon: Building2 },
  { href: "/reservations", label: "Mis reservas", icon: CalendarCheck },
  { href: "/normas", label: "Normas", icon: BookOpen },
];

const USER_MENU_ITEMS = [
  { href: "/perfil", label: "Mi perfil", icon: UserIcon },
];

function isAdmin(role: Role): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/images/iuce-logo.png"
              alt="IUCE Reservas"
              width={120}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            {PUBLIC_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 hover:text-iuce-blue-dark transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin(user.role) && (
              <Link
                href="/admin"
                className="flex items-center gap-2 text-usal-red hover:text-usal-red-dark transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Administración
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <NotificationDropdown />
          <Link
            href="/perfil"
            className="text-right leading-tight group"
            title="Editar mi perfil"
          >
            <p className="text-sm font-medium text-gray-900 group-hover:text-iuce-blue transition-colors">
              {user.name}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden border-t border-gray-200 bg-white transition-all",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {PUBLIC_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {isAdmin(user.role) && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-usal-red hover:bg-danger-50"
            >
              <ShieldCheck className="h-4 w-4" />
              Administración
            </Link>
          )}
          <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
            {USER_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <p className="px-3 pt-2 text-sm font-medium text-gray-900">{user.name}</p>
            <p className="px-3 text-xs text-gray-500">{user.email}</p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
