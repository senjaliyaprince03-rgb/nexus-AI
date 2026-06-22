"use client"

import { useEffect, useRef } from "react"
import { ArrowUpRight, FileSearch, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react"
import { LogoMark } from "@/components/brand/LogoMark"
import { MessageBubble } from "./MessageBubble"
import { useChatStore } from "@/store/chatStore"
import { useAuthStore } from "@/store/authStore"
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
      className="flex-1 overflow-y-auto px-5 py-5 scroll-smooth"
      style={{ scrollbarWidth: "thin" }}
      aria-live="polite"
      aria-label="Chat messages"
    >
      <div className="mx-auto w-full max-w-4xl space-y-1">
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
  const workspace = useAuthStore((state) => state.workspace)
  const suggestions = mode === "support" ? SUPPORT_SUGGESTIONS : DOCUMENT_SUGGESTIONS
  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center py-8">
      <div className="dashboard-card px-6 py-8 sm:px-8">
        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-black/5 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64748B] shadow-sm dark:border-[#F8F9FA]/10 dark:bg-[#111827] dark:text-[#D1D5DB]">
          {mode === "support" ? <LifeBuoy className="h-3.5 w-3.5 text-[#C5A059]" /> : <FileSearch className="h-3.5 w-3.5 text-[#C5A059]" />}
          {mode === "support" ? "NexusAI support assistant" : "Workspace document intelligence"}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <LogoMark className="mb-5 h-16 w-16 rounded-[22px]" priority />
            <h2 className="font-display text-4xl tracking-[-0.05em] text-[#18181B] dark:text-[#F8F9FA] sm:text-[2.8rem]">
              {mode === "support" ? "Ask the help desk with project context" : "Ask your workspace anything"}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#64748B] dark:text-[#A1A1AA]">
              {mode === "support"
                ? "Support mode combines workspace knowledge with NexusAI support guidance, so answers stay relevant to your account, billing, and technical setup."
                : `Search ${workspace?.name ?? "your connected workspace"} for grounded answers, summaries, deadlines, decisions, and cited evidence.`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:max-w-[360px] lg:flex-1">
            <SignalCard icon={Sparkles} title="Grounded" description="Answer quality stays tied to the workspace context." />
            <SignalCard icon={ShieldCheck} title="Safe" description="Important answers should still be reviewed before action." />
            <SignalCard icon={ArrowUpRight} title="Fast start" description="Use a starter prompt to begin with the right intent." />
          </div>
        </div>

        <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          {suggestions.map((s) => (
            <SuggestionChip key={s} text={s} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SignalCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles
  title: string
  description: string
}) {
  return (
    <div className="rounded-[22px] border border-black/5 bg-[#F8FAFC] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-[#F8F9FA]/8 dark:bg-[#111827]">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.08)] text-[#C5A059]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[#6B7280] dark:text-[#A1A1AA]">{description}</p>
    </div>
  )
}

function SuggestionChip({ text }: { text: string }) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("nexusai:suggestion", { detail: text }))
  }

  return (
    <button
      onClick={handleClick}
      className="group rounded-[22px] border border-black/5 bg-white px-4 py-4 text-left text-sm font-medium text-[#2A2A2A] shadow-[0_12px_30px_rgba(10,10,10,0.03)] transition hover:-translate-y-0.5 hover:border-[#E7C9B4] hover:bg-[#FFF8F4] dark:border-[#F8F9FA]/10 dark:bg-[#111827] dark:text-[#F8F9FA] dark:hover:bg-[#172033]"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="leading-6">{text}</span>
        <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#9CA3AF] transition group-hover:text-[#C5A059]" />
      </span>
    </button>
  )
}
