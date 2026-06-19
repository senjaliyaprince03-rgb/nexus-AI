"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { PageTransition } from "./PageTransition"

export function DashboardViewport({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ""

  return <PageTransition pageKey={pathname}>{children}</PageTransition>
}
