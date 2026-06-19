"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { ChatMessage, ChatSession, SourceChunk } from "@/types/api"
import { getSafeSessionStorage } from "@/lib/storage"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatState {
  // Sessions sidebar
  sessions: ChatSession[]
  activeSessionId: string | null

  // Active workspace (selected by the user)
  workspaceId: string | null

  // Messages for the active session (denormalized for fast reads)
  messages: ChatMessage[]

  // UI state
  isStreaming: boolean
  streamingMessageId: string | null

  // Actions — session management
  setSessions: (sessions: ChatSession[]) => void
  addSession: (session: ChatSession) => void
  setActiveSession: (sessionId: string | null) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  removeSession: (sessionId: string) => void

  // Actions — workspace
  setWorkspaceId: (id: string) => void

  // Actions — messages
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (msg: ChatMessage) => void

  // Streaming helpers — called by useChatStream
  startStreaming: (assistantMessageId: string, metadata?: Pick<ChatMessage, "mode" | "metadata">) => void
  appendToken: (token: string) => void
  addSource: (source: SourceChunk) => void
  finalizeStream: (sessionId: string, confidence: number) => void
  failStream: (errorText: string) => void

  reset: () => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      workspaceId: null,
      messages: [],
      isStreaming: false,
      streamingMessageId: null,

      // ── Session management ─────────────────────────────────────────────────

      setSessions: (sessions) => set({ sessions }),

      addSession: (session) =>
        set((s) => ({ sessions: [session, ...s.sessions] })),

      setActiveSession: (sessionId) =>
        set({ activeSessionId: sessionId, messages: [] }),

      updateSessionTitle: (sessionId, title) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, title } : sess,
          ),
        })),

      removeSession: (sessionId) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== sessionId),
          activeSessionId:
            s.activeSessionId === sessionId ? null : s.activeSessionId,
          messages: s.activeSessionId === sessionId ? [] : s.messages,
        })),

      // ── Workspace ──────────────────────────────────────────────────────────

      setWorkspaceId: (id) => set({ workspaceId: id }),

      // ── Messages ───────────────────────────────────────────────────────────

      setMessages: (messages) => set({ messages }),

      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      // ── Streaming ──────────────────────────────────────────────────────────

      startStreaming: (assistantMessageId, metadata) => {
        const placeholder: ChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          isStreaming: true,
          sources: [],
          created_at: new Date().toISOString(),
          mode: metadata?.mode,
          metadata: metadata?.metadata,
        }
        set((s) => ({
          isStreaming: true,
          streamingMessageId: assistantMessageId,
          messages: [...s.messages, placeholder],
        }))
      },

      appendToken: (token) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === s.streamingMessageId
              ? { ...m, content: m.content + token }
              : m,
          ),
        })),

      addSource: (source) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === s.streamingMessageId
              ? { ...m, sources: [...(m.sources ?? []), source] }
              : m,
          ),
        })),

      finalizeStream: (sessionId, confidence) =>
        set((s) => ({
          isStreaming: false,
          streamingMessageId: null,
          activeSessionId: sessionId,
          messages: s.messages.map((m) =>
            m.id === s.streamingMessageId
              ? { ...m, isStreaming: false, confidence_score: confidence }
              : m,
          ),
        })),

      failStream: (errorText) =>
        set((s) => ({
          isStreaming: false,
          streamingMessageId: null,
          messages: s.messages.map((m) =>
            m.id === s.streamingMessageId
              ? { ...m, isStreaming: false, content: `⚠️ ${errorText}` }
              : m,
          ),
        })),

      reset: () =>
        set({
          sessions: [],
          activeSessionId: null,
          messages: [],
          isStreaming: false,
          streamingMessageId: null,
        }),
    }),
    {
      name: "nexusai-chat",
      storage: createJSONStorage(() => getSafeSessionStorage()),
      partialize: (s) => ({
        sessions: s.sessions,
        activeSessionId: s.activeSessionId,
        workspaceId: s.workspaceId,
      }),
    },
  ),
)
