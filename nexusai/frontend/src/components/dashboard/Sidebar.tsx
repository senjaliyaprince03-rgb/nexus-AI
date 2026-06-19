"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Box, 
  Activity, 
  Settings, 
  TerminalSquare, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Modules", href: "/dashboard/modules", icon: Box },
    { name: "Analytics", href: "/dashboard/analytics", icon: Activity },
    { name: "Terminal", href: "/dashboard/terminal", icon: TerminalSquare },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  return (
    <aside 
      className={cn(
        "flex flex-col border-r border-border dark:border-border bg-bg-light dark:bg-bg-primary transition-all duration-default ease-premium hidden md:flex",
        expanded ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn bg-accent dark:bg-accent text-white font-bold">
            N
          </div>
          {expanded && (
            <span className="font-display font-semibold text-text-dark dark:text-text-primary whitespace-nowrap">
              NexusAI
            </span>
          )}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-3 py-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-btn px-3 py-2.5 transition-all duration-fast ease-premium",
                isActive 
                  ? "bg-bg-secondary dark:bg-bg-card text-text-dark dark:text-text-primary font-medium" 
                  : "text-text-secondary hover:bg-bg-secondary dark:hover:bg-bg-card hover:text-text-dark dark:hover:text-text-primary"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {expanded && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border dark:border-border p-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-text-secondary hover:bg-bg-secondary dark:hover:bg-bg-card hover:text-text-dark dark:hover:text-text-primary transition-all duration-fast"
        >
          {expanded ? <ChevronLeft className="h-5 w-5 shrink-0" /> : <ChevronRight className="h-5 w-5 shrink-0" />}
          {expanded && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}