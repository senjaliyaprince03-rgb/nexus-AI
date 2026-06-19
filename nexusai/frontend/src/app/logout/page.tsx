"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { LogoMark } from "@/components/brand/LogoMark"
import { useAuthStore } from "@/store/authStore"

export default function LogoutPage() {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    let active = true

    logout().finally(() => {
      if (active) router.replace("/login")
    })

    return () => {
      active = false
    }
  }, [logout, router])

  return (
    <main className="login-auth-bg flex min-h-screen items-center justify-center bg-[#fffaf7] px-5">
      <section className="premium-glow flex w-full max-w-[360px] flex-col items-center rounded-[1.75rem] border border-[#F8F9FA]/80 bg-white/90 p-8 text-center shadow-[0_28px_86px_rgba(20,12,8,0.12)]">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C5A059] to-[#FF8F5E] text-white shadow-[0_8px_16px_rgba(255,107,53,0.25)]">
          <LogoMark className="h-6 w-6 rounded-md shadow-none" />
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#18181B]">
          Signing out
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-[#666666]">
          Clearing your secure session before returning to sign in.
        </p>
        <Loader2 className="mt-6 h-5 w-5 animate-spin text-[#C5A059]" />
      </section>
    </main>
  )
}
