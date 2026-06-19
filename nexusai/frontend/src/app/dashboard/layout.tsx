"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { Topbar } from "@/components/layout/Topbar"
import { useAuthStore } from "@/store/authStore"
import { Skeleton } from "@/components/ui/Skeleton"
import { OnboardingModal } from "@/components/onboarding/OnboardingModal"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const sessionChecked = useAuthStore((s) => s.sessionChecked)
  const fetchUser = useAuthStore((s) => s.fetchUser)

  useEffect(() => {
    if (!sessionChecked && !isLoading) {
      void fetchUser()
    }
  }, [fetchUser, isLoading, sessionChecked])

  useEffect(() => {
    if (sessionChecked && !isLoading && !isAuthenticated) {
      router.replace("/login?from=/dashboard")
    }
  }, [isAuthenticated, isLoading, router, sessionChecked])

  useEffect(() => {
    if (sessionChecked && user && user.is_verified === false) {
      router.replace(`/auth/verify-email?email=${encodeURIComponent(user.email)}`)
    }
  }, [router, sessionChecked, user])

  const authReady = sessionChecked && !isLoading && isAuthenticated && !!user

  return (
    <div className="flex h-screen bg-[#F8F7F4] dark:bg-[#18181B] text-[#18181B] dark:text-[#F8F9FA] overflow-hidden">
      <Sidebar className="hidden md:flex" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        {!authReady && (
          <div className="px-8 pt-8 space-y-4">
            <Skeleton className="h-12 w-64 rounded-md" />
            <Skeleton className="h-[400px] w-full rounded-[24px]" />
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.main
            key={typeof window !== "undefined" ? window.location.pathname : ""}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
      <OnboardingModal />
      <MobileNav />
    </div>
  )
}
