"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/brand/LogoMark"
import { LayoutDashboard, MessageSquare, Files, BarChart2, Zap, CreditCard, Layers, Building2, UserCircle, LifeBuoy } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { Language } from "@/locales/translations"

const NAV = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/workspace", labelKey: "workspace", icon: Building2 },
  { href: "/chat", labelKey: "chatSupport", icon: MessageSquare },
  { href: "/dashboard/documents", labelKey: "documents", icon: Files },
  { href: "/dashboard/analytics", labelKey: "analytics", icon: BarChart2 },
  { href: "/dashboard/agents", labelKey: "agents", icon: Zap },
  { href: "/dashboard/modules", labelKey: "modules", icon: Layers },
]

const BOTTOM_NAV = [
  { href: "/dashboard/profile", labelKey: "profile", icon: UserCircle },
  { href: "/dashboard/billing", labelKey: "billing", icon: CreditCard },
]

const SIDEBAR_LABELS: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    workspace: "Workspace",
    chatSupport: "Chat & Support",
    documents: "Documents",
    analytics: "Analytics",
    agents: "Agents",
    modules: "Modules",
    profile: "Profile",
    billing: "Billing",
  },
  es: {
    dashboard: "Panel",
    workspace: "Espacio",
    chatSupport: "Chat y Soporte",
    documents: "Documentos",
    analytics: "Analiticas",
    agents: "Agentes",
    modules: "Modulos",
    profile: "Perfil",
    billing: "Facturacion",
  },
  fr: {
    dashboard: "Tableau",
    workspace: "Espace",
    chatSupport: "Chat & Support",
    documents: "Documents",
    analytics: "Analytique",
    agents: "Agents",
    modules: "Modules",
    profile: "Profil",
    billing: "Facturation",
  },
  de: {
    dashboard: "Dashboard",
    workspace: "Arbeitsbereich",
    chatSupport: "Chat & Support",
    documents: "Dokumente",
    analytics: "Analysen",
    agents: "Agenten",
    modules: "Module",
    profile: "Profil",
    billing: "Abrechnung",
  },
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname() ?? ""
  const { language } = useI18n()
  const labels = SIDEBAR_LABELS[language] || SIDEBAR_LABELS.en

  return (
    <aside
      className={cn(
        "flex flex-col w-64 h-full border-r border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] bg-[#F8F9FA]/50 dark:bg-transparent backdrop-blur-xl",
        className
      )}
    >
      {/* Brand logo */}
      <div className="px-6 py-8 flex items-center gap-3">
        <LogoMark className="h-8 w-8 rounded-xl" priority />
        <span className="font-display font-semibold text-[#18181B] dark:text-[#F8F9FA] tracking-tight text-xl">
          NexusAI
        </span>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
        }}
        className="flex-1 px-4 space-y-1.5"
      >
        {NAV.map((item) => {
          // Check if active: exact match for /dashboard, startsWith for others
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          
          return (
            <motion.div key={item.href} variants={{
              hidden: { opacity: 0, x: -10 },
              show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } }
            }}>
              <Link href={item.href} className="relative block group">
              {active && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.08)] shadow-sm"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <div
                className={cn(
                  "relative flex items-center gap-3.5 px-4 py-3 rounded-xl",
                  "text-[15px] font-medium transition-colors duration-200 select-none",
                  active
                    ? "text-[#C5A059]"
                    : "text-[#6A6A6A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F8F9FA] hover:bg-white/60 dark:hover:bg-white/5"
                )}
              >
                <item.icon strokeWidth={1.75} className={cn("w-5 h-5 transition-all duration-300", active ? "scale-110" : "group-hover:scale-110 group-hover:-rotate-[4deg]")} />
                {labels[item.labelKey] || item.labelKey}
              </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>
    </aside>
  )
}
