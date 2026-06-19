"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Building2, CreditCard, Files, LayoutDashboard, Layers, LifeBuoy, Menu, MessageSquare, UserCircle, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Home" },
  { href: "/chat",                icon: MessageSquare, label: "Chat" },
  { href: "/dashboard/documents", icon: Files,           label: "Docs" },
  { href: "/dashboard/support",   icon: LifeBuoy,        label: "Help" },
];

const MORE_NAV = [
  { href: "/dashboard/workspace", icon: Building2, label: "Workspace" },
  { href: "/dashboard/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/dashboard/agents",    icon: Zap,       label: "Agents" },
  { href: "/dashboard/modules",   icon: Layers,    label: "Modules" },
  { href: "/dashboard/profile",   icon: UserCircle, label: "Profile" },
  { href: "/dashboard/billing",   icon: CreditCard, label: "Billing" },
];

export function MobileNav() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-x-3 bottom-20 rounded-card border border-black/10 bg-white p-3 shadow-hover"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-2 py-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">More tools</p>
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
              {MORE_NAV.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-sm border border-black/5 bg-[#F8F9FA] px-3 py-3 text-sm font-semibold text-[#18181B]"
                >
                  <Icon className="h-4 w-4 text-[#C5A059]" />
                  {label}
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
              {label}
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
          More
        </button>
      </nav>
    </>
  );
}
