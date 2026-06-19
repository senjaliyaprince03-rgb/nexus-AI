"use client"

/**
 * useChatStream
 *
 * Opens a POST request with fetch() + ReadableStream to the streaming
 * chat endpoint. Parses SSE frames and dispatches to the Zustand store.
 *
 * Why fetch() instead of EventSource?
 *   - EventSource only supports GET. Our endpoint needs a POST body.
 *   - fetch() + ReadableStream gives full control over the connection.
 */

import { useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

import { getToken, ApiError } from "@/lib/api"
import { useChatStore } from "@/store/chatStore"
import type { QueryRequest, StreamEvent } from "@/types/api"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

export interface SourceChunk {
  chunk_id: string
  document_id?: string
  filename: string
  content: string
  score: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at?: string
  sources?: SourceChunk[]
  isStreaming?: boolean
}

/**
 * Validate BASE_URL at module load time.
 *
 * Prevents CWE-918: if NEXT_PUBLIC_API_URL is set to an attacker-controlled
 * origin (misconfigured env, supply-chain compromise), every fetch in this
 * hook — including the one that sends the JWT in Authorization — would be
 * directed to that origin.
 *
 * Only http://localhost and https:// origins are permitted. Any other value
 * throws at import time so the misconfiguration is caught immediately.
 */
function _validateBaseUrl(url: string): string {
  try {
    const { protocol, hostname } = new URL(url)
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"
    if (protocol === "https:" || (protocol === "http:" && isLocalhost)) {
      return url.replace(/\/$/, "") // strip trailing slash
    }
  } catch {
    // new URL() threw — not a valid URL at all
  }
  throw new Error(`NEXT_PUBLIC_API_URL is not a trusted origin: ${url}`)
}

const _SAFE_BASE_URL = _validateBaseUrl(BASE_URL)
const _CHAT_ENDPOINT = "/api/chat/query"

interface UseChatStreamReturn {
  sendMessage: (question: string, opts?: Partial<QueryRequest>) => Promise<void>
  cancel: () => void
  isStreaming: boolean
}

export function useChatStream(): UseChatStreamReturn {
  const router = useRouter()
  const abortRef = useRef<AbortController | null>(null)

  const store = useChatStore()
  const {
    activeSessionId,
    workspaceId,
    isStreaming,
    addMessage,
    startStreaming,
    appendToken,
    addSource,
    finalizeStream,
    failStream,
    addSession,
    updateSessionTitle,
  } = store

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const sendMessage = useCallback(
    async (question: string, opts: Partial<QueryRequest> = {}) => {
      if (isStreaming || !workspaceId) return

      // 1. Add user message to store immediately
      addMessage({
        id: uuidv4(),
        role: "user",
        content: question,
        created_at: new Date().toISOString(),
        mode: opts.mode ?? "document",
        metadata: {
          support_intent: opts.support_intent ?? null,
          source_policy: opts.source_policy ?? "combined",
        },
      })

      const streamMetadata = {
        mode: opts.mode ?? "document",
        metadata: {
          support_intent: opts.support_intent ?? null,
          source_policy: opts.source_policy ?? "combined",
        },
      }

      // 2. Create a placeholder streaming message
      const streamingId = uuidv4()
      startStreaming(streamingId, streamMetadata)

      // 3. Build request
      const body: QueryRequest = {
        question,
        workspace_id: workspaceId,
        session_id: activeSessionId,
        top_k: 5,
        use_agents: false,
        mode: "document",
        source_policy: "combined",
        support_intent: null,
        ...opts,
      }

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const token = getToken()
        const res = await fetch(`${_SAFE_BASE_URL}${_CHAT_ENDPOINT}`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Stream failed" }))
          const detail = typeof err.detail === "string"
            ? err.detail.replace(/[<>"'&]/g, "")
            : "Request failed"
          failStream(detail)
          return
        }

        // 4. Read the stream line-by-line
        const reader = res.body?.getReader()
        if (!reader) {
          failStream("No response stream")
          return
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE frames are separated by "\n\n"
          const frames = buffer.split("\n\n")
          // Last element may be incomplete — keep it in buffer
          buffer = frames.pop() ?? ""

          for (const frame of frames) {
            if (!frame.trim()) continue
            const parsed = parseSSEFrame(frame)
            if (!parsed) continue

            switch (parsed.event) {
              case "token":
                appendToken(parsed.data as string)
                break

              case "source":
                addSource(parsed.data as any)
                break

              case "done": {
                const d = parsed.data as { session_id: string; confidence_score: number }
                finalizeStream(d.session_id, d.confidence_score)

                // If this is a new session, register it in sidebar
                if (!activeSessionId) {
                  addSession({
                    id: d.session_id,
                    title: question.slice(0, 60),
                    workspace_id: workspaceId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    messages: [],
                    mode: body.mode,
                    metadata: {
                      support_intent: body.support_intent,
                      source_policy: body.source_policy,
                    },
                  })
                }
                break
              }

              case "error":
                failStream(parsed.data as string)
                break
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          failStream("Response cancelled.")
        } else {
          failStream((err as Error)?.message ?? "Network error")
        }
      } finally {
        abortRef.current = null
      }
    },
    [
      isStreaming,
      workspaceId,
      activeSessionId,
      addMessage,
      startStreaming,
      appendToken,
      addSource,
      finalizeStream,
      failStream,
      addSession,
    ],
  )

  return { sendMessage, cancel, isStreaming }
}

// ── SSE frame parser ──────────────────────────────────────────────────────────

/**
 * Parses a raw SSE frame string into a typed StreamEvent.
 * Frame format:
 *   event: token\n
 *   data: {"some":"json"}\n
 */
function parseSSEFrame(frame: string): StreamEvent | null {
  const lines = frame.split("\n")
  let event = ""
  let dataStr = ""

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim()
    } else if (line.startsWith("data:")) {
      dataStr = line.slice(5).trim()
    }
  }

  if (!event || !dataStr) return null

  try {
    const data = JSON.parse(dataStr)
    return { event, data } as StreamEvent
  } catch {
    // Plain string data (e.g. token events)
    return { event, data: dataStr } as StreamEvent
  }
}
