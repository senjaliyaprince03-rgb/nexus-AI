"use client"

import { useEffect, useRef } from "react"
import { LogoMark } from "@/components/brand/LogoMark"
import { MessageBubble } from "./MessageBubble"
import { useChatStore } from "@/store/chatStore"
import type { ChatMode } from "@/types/api"

export function ChatWindow({ mode = "document" }: { mode?: ChatMode }) {
  const messages = useChatStore((s) => s.messages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages or token appends
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, isStreaming])

  // Also scroll during streaming as tokens arrive
  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" })
    }
  })

  if (messages.length === 0) {
    return <EmptyState mode={mode} />
  }

  return (
    <div
      className="flex-1 overflow-y-auto scroll-smooth"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
      aria-live="polite"
      aria-label="Chat messages"
    >
      <div className="space-y-1 py-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
      <div ref={bottomRef} className="h-4" />
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

const DOCUMENT_SUGGESTIONS = [
  "Summarise the top findings across the uploaded workspace files",
  "List the main risks mentioned in the contract set",
  "Compare how each document describes implementation scope",
  "Extract all deadlines, dates, and action owners from the project plan",
]

const SUPPORT_SUGGESTIONS = [
  "Help me troubleshoot document-backed answers not working",
  "Explain what to check when the NexusAI API is unreachable",
  "Help me with account verification or login problems",
  "Explain safe support chat privacy rules",
]

function EmptyState({ mode }: { mode: ChatMode }) {
  const suggestions = mode === "support" ? SUPPORT_SUGGESTIONS : DOCUMENT_SUGGESTIONS
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Logo mark */}
      <LogoMark className="mb-6 h-16 w-16 rounded-[22px]" priority />

      <h2 className="mb-2 font-display text-4xl tracking-[-0.05em] text-slate-100">
        {mode === "support" ? "AI Help Desk" : "Ask your workspace anything"}
      </h2>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-slate-500">
        {mode === "support"
          ? "Get support answers from workspace documents and NexusAI support FAQs."
          : "NexusAI searches across your workspace documents and cites every source."}
      </p>

      {/* Suggestion chips */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((s) => (
          <SuggestionChip key={s} text={s} />
        ))}
      </div>
    </div>
  )
}

function SuggestionChip({ text }: { text: string }) {
  // Clicking a suggestion fires through useChatStream via a custom event
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("nexusai:suggestion", { detail: text }))
  }

  return (
    <button
      onClick={handleClick}
      className="text-left text-sm text-slate-400 border border-[#F8F9FA]/8 hover:border-amber-500/40 hover:text-slate-200 rounded-2xl px-4 py-3 transition-all bg-[linear-gradient(180deg,rgba(15,23,42,0.52),rgba(10,15,28,0.68))] hover:bg-slate-800/60"
    >
      {text}
    </button>
  )
}
