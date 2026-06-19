"use client"

import React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowUpRight, Bot, CheckCircle2, MessageSquare, Send, ShieldCheck, ThumbsDown, ThumbsUp, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useChatStore } from "@/store/chatStore"
import type { ChatMessage, SourceChunk, SupportIntent } from "@/types/api"
import { SUPPORT_STARTERS, SUPPORT_TOPICS, topicById } from "./supportData"

interface SupportChatPanelProps {
  activeIntent: SupportIntent
  onIntentChange: (intent: SupportIntent) => void
  onSend: (message: string, intent?: SupportIntent) => void
  onCancel: () => void
  isStreaming: boolean
  disabled?: boolean
  compact?: boolean
}

export function SupportChatPanel({
  activeIntent,
  onIntentChange,
  onSend,
  onCancel,
  isStreaming,
  disabled = false,
  compact = false,
}: SupportChatPanelProps) {
  const messages = useChatStore((s) => s.messages)
  const supportMessages = messages.filter((message) => message.mode === "support")
  const bottomRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState("")

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" })
  }, [supportMessages.length, isStreaming])

  const submit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isStreaming) return
    onSend(trimmed, activeIntent)
    setValue("")
  }, [activeIntent, disabled, isStreaming, onSend, value])

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-black/5 dark:border-[#F8F9FA]/8 bg-white/82 dark:bg-[#0F172A]/84 shadow-[0_22px_70px_rgba(10,10,10,0.10)] backdrop-blur-xl">
      <div className="border-b border-black/5 dark:border-[#F8F9FA]/8 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9CA3AF] dark:text-[#AEB6C3]">AI Help Desk</p>
            <h2 className="mt-1 font-display text-3xl leading-none tracking-[-0.04em] text-[#18181B] dark:text-[#F8F9FA]">
              How can I help today?
            </h2>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#7CB69E]/30 bg-[#EDF5F1] dark:bg-[#7CB69E]/10 px-3 py-1.5 text-xs font-semibold text-[#2F6F58] dark:text-[#A7E2C9] sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            AI assistant
          </div>
        </div>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6A6A6A] dark:text-[#D1D5DB]">
          Answers use your workspace docs and NexusAI support FAQs. No human handoff enabled.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
          {SUPPORT_TOPICS.map((topic) => {
            const Icon = topic.icon
            const active = topic.id === activeIntent
            return (
              <button
                key={topic.id}
                onClick={() => onIntentChange(topic.id)}
                className={cn(
                  "flex min-h-[66px] items-start gap-2 rounded-2xl border px-3 py-3 text-left transition-all",
                  active
                    ? "border-[#C5A059]/35 bg-[rgba(212,175,55,0.08)] dark:bg-[#1A2434] text-[#18181B] dark:text-[#F8F9FA] shadow-[0_12px_34px_rgba(255,107,53,0.14)]"
                    : "border-black/5 dark:border-[#F8F9FA]/8 bg-white/72 dark:bg-white/5 text-[#4B5563] dark:text-[#D1D5DB] hover:border-[#7CB69E]/35 hover:bg-[#F7FBF9] dark:hover:bg-[#101926]",
                )}
              >
                <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", active ? "text-[#C5A059]" : "text-[#7CB69E]")} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{topic.label}</span>
                  <span className={cn("mt-1 block text-[11px] leading-snug", active ? "text-[#9CA3AF] dark:text-[#D1D5DB]" : "text-[#9CA3AF] dark:text-[#AEB6C3]")}>{topic.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4" aria-live="polite" aria-label="Support messages">
        {supportMessages.length === 0 ? (
          <SupportEmptyState onSend={onSend} activeIntent={activeIntent} />
        ) : (
          <div className="space-y-4">
            {supportMessages.map((message) => (
              <SupportMessage key={message.id} message={message} compact={compact} />
            ))}
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      <div className="border-t border-black/5 dark:border-[#F8F9FA]/8 p-4">
        <div className="rounded-[22px] border border-black/8 bg-[#111714] p-2 shadow-[0_22px_54px_rgba(17,23,20,0.24)]">
          <div className="flex items-end gap-2">
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value.slice(0, 2000))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  submit()
                }
              }}
              rows={1}
              placeholder={disabled ? "Select a workspace to start support" : `Ask about ${topicById.get(activeIntent)?.label.toLowerCase() ?? "support"}...`}
              disabled={disabled}
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-white/38 disabled:cursor-not-allowed"
              aria-label="Support message input"
            />
            {isStreaming ? (
              <button
                onClick={onCancel}
                className="mb-1 rounded-2xl border border-[#F8F9FA]/10 px-4 py-2 text-sm font-semibold text-white/72 transition hover:border-red-300/40 hover:text-red-200"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!value.trim() || disabled}
                className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C5A059] text-white shadow-[0_10px_28px_rgba(255,107,53,0.34)] transition hover:bg-[#E55A25] disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/28"
                aria-label="Send support message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function SupportEmptyState({ onSend, activeIntent }: { onSend: (message: string, intent?: SupportIntent) => void; activeIntent: SupportIntent }) {
  return (
    <div className="flex min-h-[280px] flex-col justify-center">
      <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-black/5 dark:border-[#F8F9FA]/10 bg-white dark:bg-[#182233] px-3 py-1.5 text-xs font-semibold text-[#4B5563] dark:text-[#F8F9FA] shadow-sm">
        <MessageSquare className="h-3.5 w-3.5 text-[#C5A059]" />
        Start with a quick topic
      </div>
      <div className="grid gap-2">
        {SUPPORT_STARTERS.map((starter) => (
          <button
            key={starter}
            onClick={() => onSend(starter, activeIntent)}
            className="group flex items-center justify-between rounded-2xl border border-black/5 dark:border-[#F8F9FA]/10 bg-white/78 dark:bg-[#182233] px-4 py-3 text-left text-sm font-medium text-[#2A2A2A] dark:text-[#F8F9FA] transition hover:border-[#C5A059]/30 hover:bg-[#FFF8F4] dark:hover:bg-[#101926]"
          >
            <span>{starter}</span>
            <ArrowUpRight className="h-4 w-4 text-[#9CA3AF] dark:text-[#D1D5DB] transition group-hover:text-[#C5A059]" />
          </button>
        ))}
      </div>
    </div>
  )
}

function SupportMessage({ message, compact }: { message: ChatMessage; compact: boolean }) {
  const isUser = message.role === "user"
  const sources = message.sources ?? []

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-[#111714] text-[#E8D5A8] shadow-[0_12px_30px_rgba(17,23,20,0.22)]">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={cn("max-w-[84%]", compact && "max-w-[92%]", isUser && "flex flex-row-reverse gap-3")}>
        <div
          className={cn(
            "rounded-[24px] px-4 py-3 text-sm leading-relaxed shadow-[0_14px_40px_rgba(10,10,10,0.08)]",
            isUser
              ? "rounded-tr-md bg-[#111714] text-white"
              : "rounded-tl-md border border-black/5 dark:border-[#F8F9FA]/8 bg-white dark:bg-[#111827] text-[#1A1A1A] dark:text-[#E5E7EB]",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-li:my-0 prose-strong:text-[#18181B] dark:prose-strong:text-white"
            >
              {message.content}
            </ReactMarkdown>
          )}
          {message.isStreaming && <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[#C5A059] align-middle" />}
        </div>
        {!isUser && sources.length > 0 && <SourceRow sources={sources} />}
        {!isUser && !message.isStreaming && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {message.confidence_score != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7CB69E]/28 bg-[#EDF5F1] px-2.5 py-1 text-[11px] font-semibold text-[#2F6F58]">
                <CheckCircle2 className="h-3 w-3" />
                {Math.round(message.confidence_score * 100)}% confidence
              </span>
            )}
            <FeedbackButtons message={message} />
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.08)] text-[#C5A059]">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

function SourceRow({ sources }: { sources: SourceChunk[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.slice(0, 5).map((source, index) => (
        <span
          key={`${source.chunk_id}-${index}`}
          className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-black/5 dark:border-[#F8F9FA]/8 bg-white/80 dark:bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[#5A5A5A] dark:text-[#D1D5DB] shadow-sm"
          title={source.content}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", source.source_type === "faq" ? "bg-[#C5A059]" : "bg-[#7CB69E]")} />
          <span className="truncate">{source.source_type === "faq" ? "FAQ" : source.document_filename}</span>
          <span className="text-[#9A9A9A] dark:text-[#71717A]">{Math.round(source.score * 100)}%</span>
        </span>
      ))}
    </div>
  )
}

function FeedbackButtons({ message }: { message: ChatMessage }) {
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const [sent, setSent] = useState<"up" | "down" | null>(null)

  const submitFeedback = async (rating: "up" | "down") => {
    setSent(rating)
    try {
      await api.post("/api/support/feedback", {
        session_id: activeSessionId,
        message_id: message.id,
        rating,
        support_intent: (message.metadata?.support_intent as SupportIntent | undefined) ?? "other",
      })
      toast.success("Support feedback recorded")
    } catch {
      setSent(null)
      toast.error("Could not record feedback")
    }
  }

  return (
    <div className="inline-flex items-center rounded-full border border-black/5 dark:border-[#F8F9FA]/8 bg-white dark:bg-white/5 p-0.5 shadow-sm">
      <button
        onClick={() => submitFeedback("up")}
        disabled={sent != null}
        className={cn("rounded-full p-1.5 text-[#9CA3AF] transition hover:text-[#2F6F58]", sent === "up" && "bg-[#EDF5F1] text-[#2F6F58]")}
        aria-label="Rate support answer helpful"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => submitFeedback("down")}
        disabled={sent != null}
        className={cn("rounded-full p-1.5 text-[#9CA3AF] transition hover:text-[#D14E2C]", sent === "down" && "bg-[rgba(212,175,55,0.08)] text-[#D14E2C]")}
        aria-label="Rate support answer not helpful"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

