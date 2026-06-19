"use client"

/**
 * useAnalyticsSocket
 *
 * Connects to the analytics WebSocket endpoint and dispatches events
 * to the Zustand analytics store. Auto-reconnects on disconnect with
 * exponential backoff.
 */
import { useEffect, useRef, useCallback } from "react"
import { getToken } from "@/lib/api"

/**
 * Validate and derive the WebSocket base URL at module load time.
 *
 * Prevents CWE-918: if NEXT_PUBLIC_API_URL is set to an attacker-controlled
 * origin, the WebSocket connection — which sends the JWT as a query param —
 * would be directed to that origin.
 *
 * Only wss:// (production) and ws://localhost (development) are permitted.
 * Any other value throws at import time so the misconfiguration is caught
 * before any connection is attempted.
 */
function _validateWsUrl(apiUrl: string): string {
  try {
    const { protocol, hostname } = new URL(apiUrl)
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"
    const wsProtocol = protocol === "https:" ? "wss:" : "ws:"
    if (protocol === "https:" || (protocol === "http:" && isLocalhost)) {
      return apiUrl
        .replace(/^https:/, "wss:")
        .replace(/^http:/, "ws:")
        .replace(/\/$/, "")
    }
  } catch {
    // new URL() threw — not a valid URL at all
  }
  throw new Error(`NEXT_PUBLIC_API_URL is not a trusted origin: ${apiUrl}`)
}

const _SAFE_BASE_WS = _validateWsUrl(
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
)
const _WS_ENDPOINT = "/api/analytics/ws"

interface AnalyticsEvent {
  event: string
  data: unknown
  timestamp: string
}

interface UseAnalyticsSocketOptions {
  workspaceId: string | null
  onEvent?: (event: AnalyticsEvent) => void
  enabled?: boolean
}

export function useAnalyticsSocket({
  workspaceId,
  onEvent,
  enabled = true,
}: UseAnalyticsSocketOptions) {
  const wsRef     = useRef<WebSocket | null>(null)
  const retryRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptsRef = useRef(0)
  const MAX_ATTEMPTS = 5

  const connect = useCallback(() => {
    if (!workspaceId || !enabled) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const token = getToken()
    // Use URLSearchParams to safely encode the token — prevents query string
    // injection if the token value contains URL metacharacters (& # ?).
    const qs = token ? `?${new URLSearchParams({ token }).toString()}` : ""
    const url = `${_SAFE_BASE_WS}${_WS_ENDPOINT}${qs}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      attemptsRef.current = 0 // reset backoff on success
    }

    ws.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data) as AnalyticsEvent
        onEvent?.(parsed)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = (evt) => {
      wsRef.current = null
      // Reconnect unless closed intentionally (code 1000) or max retries hit
      if (evt.code !== 1000 && attemptsRef.current < MAX_ATTEMPTS && enabled) {
        const delay = Math.min(1000 * 2 ** attemptsRef.current, 30_000)
        attemptsRef.current++
        retryRef.current = setTimeout(connect, delay)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [workspaceId, onEvent, enabled])

  useEffect(() => {
    connect()
    return () => {
      retryRef.current && clearTimeout(retryRef.current)
      wsRef.current?.close(1000, "component unmounted")
      wsRef.current = null
    }
  }, [connect])

  /** Manually disconnect (e.g. when navigating away) */
  const disconnect = useCallback(() => {
    retryRef.current && clearTimeout(retryRef.current)
    wsRef.current?.close(1000)
    wsRef.current = null
  }, [])

  return { disconnect }
}
