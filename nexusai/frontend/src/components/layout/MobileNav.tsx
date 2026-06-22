"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Building2, CreditCard, Files, LayoutDashboard, Layers, LifeBuoy, Menu, MessageSquare, UserCircle, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n"
import type { Language } from "@/locales/translations"

const NAV = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Home" },
  { href: "/chat",                icon: MessageSquare, label: "Chat" },
  { href: "/dashboard/documents", icon: Files,           label: "Docs" },
  { href: "/dashboard/support",   icon: LifeBuoy,        label: "Help" },
];

const MORE_NAV = [
  { href: "/dashboard/workspace", icon: Building2, labelKey: "workspace" },
  { href: "/dashboard/analytics", icon: BarChart2, labelKey: "analytics" },
  { href: "/dashboard/agents",    icon: Zap,       labelKey: "agents" },
  { href: "/dashboard/modules",   icon: Layers,    labelKey: "modules" },
  { href: "/dashboard/profile",   icon: UserCircle, labelKey: "profile" },
  { href: "/dashboard/billing",   icon: CreditCard, labelKey: "billing" },
];

const MOBILE_LABELS: Record<Language, Record<string, string>> = {
  en: {
    home: "Home",
    chat: "Chat",
    docs: "Docs",
    help: "Help",
    more: "More",
    moreTools: "More tools",
  },
  es: {
    home: "Inicio",
    chat: "Chat",
    docs: "Documentos",
    help: "Ayuda",
    more: "Mas",
    moreTools: "Mas herramientas",
  },
  fr: {
    home: "Accueil",
    chat: "Chat",
    docs: "Docs",
    help: "Aide",
    more: "Plus",
    moreTools: "Plus d'outils",
  },
  de: {
    home: "Startseite",
    chat: "Chat",
    docs: "Dokumente",
    help: "Hilfe",
    more: "Mehr",
    moreTools: "Weitere Tools",
  },
}

export function MobileNav() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const { language } = useI18n()
  const labels = MOBILE_LABELS[language] || MOBILE_LABELS.en

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-x-3 bottom-20 rounded-card border border-black/10 bg-white p-3 shadow-hover"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-2 py-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">{labels.moreTools}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F9FA] text-[#6A6A6A]"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE_NAV.map(({ href, icon: Icon, labelKey }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-sm border border-black/5 bg-[#F8F9FA] px-3 py-3 text-sm font-semibold text-[#18181B]"
                >
                  <Icon className="h-4 w-4 text-[#C5A059]" />
                  {labels[labelKey]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-black/10 bg-white/95 shadow-[0_-8px_28px_rgba(10,10,10,0.08)] backdrop-blur-xl sm:hidden">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-colors",
                active ? "text-[#C5A059]" : "text-[#6A6A6A] hover:text-[#18181B]"
              )}
            >
              <Icon className="h-5 w-5" />
              {labels[label.toLowerCase()]}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-colors",
            open ? "text-[#C5A059]" : "text-[#6A6A6A] hover:text-[#18181B]",
          )}
          aria-expanded={open}
          aria-label="Open more navigation"
        >
          <Menu className="h-5 w-5" />
          {labels.more}
        </button>
      </nav>
    </>
  );
}
