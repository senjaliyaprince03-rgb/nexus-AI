"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { AuthSessionResponse, CurrentUserResponse, User, Workspace } from "@/types/api"
import { api, clearToken, getToken, setToken } from "@/lib/api"
import { getSafeLocalStorage, getSafeSessionStorage } from "@/lib/storage"
import {
  firebaseGoogleLogin as firebaseGoogleLoginRequest,
  login as loginRequest,
  register as registerRequest,
  firebaseGithubLogin as firebaseGithubLoginRequest,
} from "@/lib/auth"

let fetchUserPromise: Promise<void> | null = null

function clearLocalAuthState() {
  clearToken()
  getSafeSessionStorage().removeItem("nexusai_refresh")
}

async function clearAuthCookies() {
  try {
    await fetch("/api/set-cookie", { method: "DELETE", credentials: "include" })
  } catch {
    // Local state cleanup still has to continue if the Next route is unavailable.
  }
}

interface AuthState {
  user: User | null
  workspace: Workspace | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionChecked: boolean

  // Actions
  login: (email: string, password: string) => Promise<AuthSessionResponse>
  register: (email: string, password: string, workspaceName?: string) => Promise<AuthSessionResponse>
  loginWithFirebaseGoogle: (idToken: string) => Promise<AuthSessionResponse>
  loginWithFirebaseGithub: (idToken: string) => Promise<AuthSessionResponse>
  loginWithGithub: (code: string) => Promise<AuthSessionResponse>
  loginWithGoogle: (code: string) => Promise<AuthSessionResponse>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  setUser: (user: User) => void
  markSessionChecked: () => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      workspace: null,
      isAuthenticated: false,
      isLoading: false,
      sessionChecked: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const data = await loginRequest(email, password)
          await fetch("/api/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            }),
          })
          set({ user: data.user, workspace: data.workspace, isAuthenticated: true, sessionChecked: true })
          return data
        } catch (err) {
          set({ user: null, workspace: null, isAuthenticated: false, sessionChecked: true })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email: string, password: string, workspaceName?: string) => {
        set({ isLoading: true })
        try {
          const data = await registerRequest(email, password, workspaceName)
          await fetch("/api/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            }),
          })
          set({ user: data.user, workspace: data.workspace, isAuthenticated: true, sessionChecked: true })
          return data
        } catch (err) {
          set({ user: null, workspace: null, isAuthenticated: false, sessionChecked: true })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      loginWithFirebaseGoogle: async (idToken: string) => {
        set({ isLoading: true })
        try {
          const data = await firebaseGoogleLoginRequest(idToken)
          await fetch("/api/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            }),
          })
          set({ user: data.user, workspace: data.workspace, isAuthenticated: true, sessionChecked: true })
          return data
        } catch (err) {
          set({ user: null, workspace: null, isAuthenticated: false, sessionChecked: true })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      loginWithFirebaseGithub: async (idToken: string) => {
        set({ isLoading: true })
        try {
          const data = await firebaseGithubLoginRequest(idToken)
          await fetch("/api/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            }),
          })
          set({ user: data.user, workspace: data.workspace, isAuthenticated: true, sessionChecked: true })
          return data
        } catch (err) {
          set({ user: null, workspace: null, isAuthenticated: false, sessionChecked: true })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      loginWithGithub: async (code: string) => {
        throw new Error("Github login not implemented");
      },

      loginWithGoogle: async (code: string) => {
        throw new Error("Google login not implemented");
      },

      logout: async () => {
        try {
          // Blacklist the token server-side
          const token = getToken()
          if (token) {
            await api.post("/api/auth/logout")
          }
        } catch {
          // Continue logout even if API call fails
        } finally {
          clearLocalAuthState()
          await clearAuthCookies()
          set({ user: null, workspace: null, isAuthenticated: false, sessionChecked: true })
        }
      },

      fetchUser: async () => {
        if (fetchUserPromise) return fetchUserPromise

        fetchUserPromise = (async () => {
          set({ isLoading: true })
          try {
            const hasRefreshToken = Boolean(getSafeSessionStorage().getItem("nexusai_refresh"))
            if (hasRefreshToken) {
              const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
              if (refreshRes.ok) {
                const tokens = await refreshRes.json() as {
                  ok?: boolean
                  access_token?: string
                  refresh_token?: string
                }
                if (tokens.ok !== false) {
                  if (tokens.access_token) setToken(tokens.access_token)
                  if (tokens.refresh_token) getSafeSessionStorage().setItem("nexusai_refresh", tokens.refresh_token)
                }
              }
            }

            const session = await api.get<CurrentUserResponse>("/api/auth/me")
            set({ user: session.user, workspace: session.workspace, isAuthenticated: true, sessionChecked: true })
          } catch (initialError) {
            try {
              const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
              if (!refreshRes.ok) throw initialError
              const tokens = await refreshRes.json() as {
                ok?: boolean
                access_token?: string
                refresh_token?: string
              }
              if (tokens.ok === false) throw initialError
              if (tokens.access_token) setToken(tokens.access_token)
              if (tokens.refresh_token) getSafeSessionStorage().setItem("nexusai_refresh", tokens.refresh_token)
              const session = await api.get<CurrentUserResponse>("/api/auth/me")
              set({ user: session.user, workspace: session.workspace, isAuthenticated: true, sessionChecked: true })
            } catch {
              clearLocalAuthState()
              void clearAuthCookies()
              set({ user: null, workspace: null, isAuthenticated: false, sessionChecked: true })
            }
          } finally {
            set({ isLoading: false })
          }
        })()

        try {
          await fetchUserPromise
        } finally {
          fetchUserPromise = null
        }
      },

      setUser: (user: User) => set({ user, isAuthenticated: true, sessionChecked: true }),

      markSessionChecked: () => set({ sessionChecked: true }),

      clearAuth: () => {
        clearLocalAuthState()
        void clearAuthCookies()
        set({ user: null, workspace: null, isAuthenticated: false, sessionChecked: true })
      },
    }),
    {
      name: "nexusai-auth",
      storage: createJSONStorage(() => getSafeLocalStorage()),
      // Only persist the user object — token stays in localStorage via api.ts
      partialize: (s) => ({ user: s.user, workspace: s.workspace, isAuthenticated: s.isAuthenticated }),
    },
  ),
)
