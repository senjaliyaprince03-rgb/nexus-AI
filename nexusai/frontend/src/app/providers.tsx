"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { getToken } from "@/lib/api"
import { getSafeSessionStorage } from "@/lib/storage"
import { SmoothScroll } from "@/components/providers/SmoothScroll"
import { Toaster } from "sonner"
// import { CanvasLayout } from "@/components/canvas/CanvasLayout"

export function AuthBootstrap() {
  // Validate any persisted auth state or refresh cookie before privileged UI appears.
  const { sessionChecked, isLoading, fetchUser, markSessionChecked } = useAuthStore()
  useEffect(() => {
    if (sessionChecked || isLoading) return

    const hasAccessToken = Boolean(getToken())
    const hasRefreshToken = Boolean(getSafeSessionStorage().getItem("nexusai_refresh"))

    if (hasAccessToken || hasRefreshToken) {
      void fetchUser()
      return
    }

    // Avoid a guaranteed 401 probe on public routes when no session exists yet.
    markSessionChecked()
  }, [fetchUser, isLoading, markSessionChecked, sessionChecked])
  return null
}

import { ThemeProvider } from "next-themes"
import { CommandPalette } from "@/components/ui/CommandPalette"
import { SupportFloatingWidget } from "@/components/support/SupportFloatingWidget"
import { LanguageProvider } from "@/lib/i18n"
import { THEMES } from "@/lib/themeData"
import type { Language } from "@/locales/translations"

export function Providers({
  children,
  initialLanguage,
}: {
  children: React.ReactNode
  initialLanguage: Language
}) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60 * 1000, retry: 1 },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider initialLanguage={initialLanguage}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem
          themes={THEMES.map((theme) => theme.id)}
        >
          <AuthBootstrap />
          <CommandPalette />
          <SupportFloatingWidget />
          <Toaster 
            position="top-center" 
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
                color: 'var(--text-primary)',
                borderRadius: '16px',
                fontFamily: 'var(--font-sans)',
              }
            }}
          />
          {children}
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
