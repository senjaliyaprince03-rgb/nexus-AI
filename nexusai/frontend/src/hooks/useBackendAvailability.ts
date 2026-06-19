"use client"

import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

export type BackendAvailability = "checking" | "online" | "offline"

export function useBackendAvailability() {
  const [status, setStatus] = useState<BackendAvailability>("checking")

  const probe = useCallback(async () => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 2500)
    setStatus("checking")

    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        cache: "no-store",
        signal: controller.signal,
      })
      setStatus(response.ok ? "online" : "offline")
    } catch {
      setStatus("offline")
    } finally {
      window.clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    void probe()
  }, [probe])

  return {
    status,
    isOnline: status === "online",
    isChecking: status === "checking",
    isOffline: status === "offline",
    retry: probe,
  }
}
