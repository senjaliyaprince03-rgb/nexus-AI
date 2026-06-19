"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { SmoothScroll } from "@/components/providers/SmoothScroll"
import { Toaster } from "sonner"
// import { CanvasLayout } from "@/components/canvas/CanvasLayout"

function AuthBootstrap() {
  // Validate any persisted auth state or refresh cookie before privileged UI appears.
  const { sessionChecked, isLoading, fetchUser } = useAuthStore()
  useEffect(() => {
    if (!sessionChecked && !isLoading) {
      void fetchUser()
    }
  }, [fetchUser, isLoading, sessionChecked])
  return null
}

import { ThemeProvider } from "next-themes"
import { CommandPalette } from "@/components/ui/CommandPalette"
import { SupportFloatingWidget } from "@/components/support/SupportFloatingWidget"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60 * 1000, retry: 1 },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
    </QueryClientProvider>
  )
}
