"use client"

/**
 * useAuth — auth state hook for NexusAI components.
 *
 * Provides:
 *   - user, isAuthenticated, isLoading from the Zustand auth store
 *   - login(), logout() actions
 *   - requireAuth() — redirects to /login if not authenticated
 *   - requireRole() — throws if user doesn't have required role
 *   - refreshToken() — silently refreshes the access token
 *
 * Usage:
 *   const { user, login, logout } = useAuth()
 *   const { user } = useAuth({ requireAuth: true })  // auto-redirect
 */
import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { api, setToken } from "@/lib/api"
import { getSafeSessionStorage } from "@/lib/storage"
import type { TokenResponse } from "@/types/api"

interface UseAuthOptions {
  /** Redirect to /login if not authenticated */
  requireAuth?: boolean
  /** Redirect to /dashboard if already authenticated (for login/signup pages) */
  redirectIfAuthed?: boolean
  /** Required role — redirects to /dashboard if user doesn't have it */
  requireRole?: "user" | "admin"
}

export function useAuth(options: UseAuthOptions = {}) {
  const router = useRouter()
  const store  = useAuthStore()
  const { user, isAuthenticated, isLoading, sessionChecked, login, logout, fetchUser, clearAuth } = store

  // requireAuth redirect
  useEffect(() => {
    if (options.requireAuth && sessionChecked && !isLoading && !isAuthenticated) {
      router.replace(`/login?from=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [options.requireAuth, isAuthenticated, isLoading, router, sessionChecked])

  // redirectIfAuthed (for login/signup pages)
  useEffect(() => {
    if (options.redirectIfAuthed && sessionChecked && isAuthenticated && !isLoading) {
      router.replace("/dashboard")
    }
  }, [options.redirectIfAuthed, isAuthenticated, isLoading, router, sessionChecked])

  // requireRole redirect
  useEffect(() => {
    if (options.requireRole && user && user.role !== options.requireRole) {
      router.replace("/dashboard")
    }
  }, [options.requireRole, user, router])

  /** Silently refresh the access token using the stored refresh token */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refresh = getSafeSessionStorage().getItem("nexusai_refresh")
    if (!refresh) return false
    try {
      const data = await api.post<TokenResponse>("/api/auth/refresh", {
        refresh_token: refresh,
      })
      setToken(data.access_token)
      getSafeSessionStorage().setItem("nexusai_refresh", data.refresh_token)
      return true
    } catch {
      clearAuth()
      router.replace("/login")
      return false
    }
  }, [clearAuth, router])

  /** Programmatic login with redirect */
  const loginAndRedirect = useCallback(
    async (email: string, password: string, redirectTo = "/dashboard") => {
      await login(email, password)
      router.push(redirectTo)
    },
    [login, router],
  )

  /** Logout and redirect to login */
  const logoutAndRedirect = useCallback(async () => {
    await logout()
    router.push("/login")
  }, [logout, router])

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || !sessionChecked,
    sessionChecked,
    isAdmin: user?.role === "admin",
    workspaceId: user?.workspace_id ?? null,
    login: loginAndRedirect,
    logout: logoutAndRedirect,
    refreshToken,
    refreshUser: fetchUser,
  }
}
