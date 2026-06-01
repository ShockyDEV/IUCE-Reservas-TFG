"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, XCircle, Clock, Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface Notification {
  id: string;
  type: "pending_review" | "approved" | "rejected";
  title: string;
  message: string;
  href: string;
  createdAt: string;
}

/** Cada cuanto vuelve a pedir el contador (60 s). */
const REFRESH_INTERVAL_MS = 60_000;
const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loadingList, setLoadingList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCount = () => {
      fetch("/api/notifications/count")
        .then((r) => r.json())
        .then((d) => {
          const serverCount = d.count || 0;
          setCount(Math.max(0, serverCount - readIds.size));
        })
        .catch((err) => {
          // Polling no critico: si el endpoint falla, mantenemos el contador previo.
          console.warn("notifications/count failed", err);
        });
    };
    fetchCount();
    const interval = setInterval(fetchCount, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [readIds]);

  useEffect(() => {
    if (open) {
      setLoadingList(true);
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => {
          setNotifications(data);
          const allIds: string[] = data.map((n: Notification) => n.id);
          setReadIds((prev) => {
            const next = new Set<string>(prev);
            allIds.forEach((id) => next.add(id));
            return next;
          });
          setCount(0);
        })
        .catch((err) => {
          // Si la carga falla mostramos la lista vacia y un toast no es necesario.
          console.warn("notifications fetch failed", err);
        })
        .finally(() => setLoadingList(false));
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleClick = (notif: Notification) => {
    setReadIds((prev) => {
      const next = new Set<string>(prev);
      next.add(notif.id);
      return next;
    });
    setOpen(false);
    router.push(notif.href);
  };

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds((prev) => new Set([...Array.from(prev), ...Array.from(allIds)]));
    setCount(0);
  };

  const typeConfig = {
    pending_review: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    approved: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
    rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / MS_PER_MINUTE);
    if (diffMin < 1) return "ahora";
    if (diffMin < MINUTES_PER_HOUR) return `hace ${diffMin}min`;
    const diffH = Math.floor(diffMin / MINUTES_PER_HOUR);
    if (diffH < HOURS_PER_DAY) return `hace ${diffH}h`;
    const diffD = Math.floor(diffH / HOURS_PER_DAY);
    return `hace ${diffD}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Notificaciones"
        className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-usal-red text-[10px] font-bold text-white flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-iuce-blue hover:text-iuce-blue-dark font-medium flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {(() => {
              if (loadingList) {
                return (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                  </div>
                );
              }
              if (notifications.length === 0) {
                return (
                  <div className="py-8 text-center">
                    <Bell className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Sin notificaciones</p>
                  </div>
                );
              }
              return notifications.map((notif) => {
                const cfg = typeConfig[notif.type];
                const Icon = cfg.icon;
                const isRead = readIds.has(notif.id);
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleClick(notif)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0",
                      isRead && "opacity-60",
                    )}
                  >
                    <div className={cn("flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-0.5", cfg.bg)}>
                      <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{notif.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatTime(notif.createdAt)}</p>
                    </div>
                    {!isRead && (
                      <div className="flex-shrink-0 h-2 w-2 rounded-full bg-iuce-blue mt-2" />
                    )}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
