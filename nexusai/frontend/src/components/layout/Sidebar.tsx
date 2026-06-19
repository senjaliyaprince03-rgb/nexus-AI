"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/brand/LogoMark"
import { LayoutDashboard, MessageSquare, Files, BarChart2, Zap, CreditCard, Layers, Building2, UserCircle, LifeBuoy } from "lucide-react"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/workspace", label: "Workspace", icon: Building2 },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
  { href: "/dashboard/documents", label: "Documents", icon: Files },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/agents", label: "Agents", icon: Zap },
  { href: "/dashboard/modules", label: "Modules", icon: Layers },
]

const BOTTOM_NAV = [
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname() ?? ""

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
                {item.label}
              </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>
    </aside>
  )
}
