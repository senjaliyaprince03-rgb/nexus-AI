"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { LogoMark } from "@/components/brand/LogoMark"
import { useAuthStore } from "@/store/authStore"
import type { ChatMessage, SourceChunk } from "@/types/api"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isStreaming = message.isStreaming
  const sources = message.sources ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("group flex gap-3 py-3", isUser && "flex-row-reverse")}
    >
      <Avatar role={message.role} />

      <div className={cn("flex max-w-[78%] flex-col gap-2", isUser && "items-end")}>
        <div
          className={cn(
            "relative rounded-[24px] px-4 py-3 text-sm leading-7 shadow-[0_18px_45px_rgba(10,10,10,0.05)]",
            isUser
              ? "rounded-tr-md bg-[linear-gradient(135deg,#D69B3C,#FF8C35)] text-white"
              : "rounded-tl-md border border-black/5 bg-white text-[#374151] dark:border-[#F8F9FA]/8 dark:bg-[#111827] dark:text-[#E5E7EB]",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}

          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#C5A059] align-middle" />
          )}
        </div>

        {!isUser && sources.length > 0 && (
          <CitationRow sources={sources} />
        )}

        {!isUser && !isStreaming && message.confidence_score != null && (
          <ConfidencePill score={message.confidence_score} />
        )}

        <span className="px-1 text-[10px] text-[#9CA3AF] opacity-0 transition-opacity group-hover:opacity-100 dark:text-[#71717A]">
          {formatTime(message.created_at)}
        </span>
      </div>
    </motion.div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ role }: { role: string }) {
  const user = useAuthStore((state) => state.user)
  const label = getInitial(getUserBadgeValue(user?.email, user?._id, user?.id, user?.first_name) ?? "U")

  if (role !== "user") {
    return (
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center">
        <LogoMark className="h-8 w-8 rounded-2xl shadow-[0_12px_30px_rgba(255,107,53,0.16)]" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl text-[11px] font-bold shadow-[0_12px_30px_rgba(10,10,10,0.10)]",
        "bg-[rgba(212,175,55,0.14)] text-[#C5A059]",
      )}
    >
      {label}
    </div>
  )
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-sm max-w-none text-[#475569] dark:prose-invert prose-p:my-1.5 prose-headings:text-[#18181B] dark:prose-headings:text-white prose-a:text-[#C5A059] prose-code:text-[#B8944E] prose-pre:bg-transparent prose-pre:p-0"
      components={{
        code({ className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className ?? "")
          const isBlock = !!match

          if (!isBlock) {
            return (
              <code
                className="rounded bg-[#F3F4F6] px-1 py-0.5 font-mono text-[12px] text-[#B8944E] dark:bg-[#1F2937]"
                {...props}
              >
                {children}
              </code>
            )
          }

          return (
            <div className="my-3 overflow-hidden rounded-xl border border-black/6 dark:border-[#F8F9FA]/8">
              <div className="flex items-center justify-between border-b border-black/6 bg-[#111827] px-3 py-1.5 dark:border-[#F8F9FA]/8">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  {match[1]}
                </span>
                <CopyButton text={String(children)} />
              </div>
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                customStyle={{ margin: 0, background: "transparent", padding: "12px 16px", fontSize: "12px" }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            </div>
          )
        },
        p({ children, ...props }: any) {
          return <p className="my-1.5 leading-relaxed" {...props}>{children}</p>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ── Citation row ──────────────────────────────────────────────────────────────

function CitationRow({ sources }: { sources: SourceChunk[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 max-w-full">
      {sources.map((src, i) => (
        <CitationChip key={src.chunk_id} source={src} index={i + 1} />
      ))}
    </div>
  )
}

function CitationChip({ source, index }: { source: SourceChunk; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all",
          "border-black/5 bg-white text-[#6B7280] hover:border-[#E7C9B4] hover:text-[#B8944E] dark:border-[#F8F9FA]/8 dark:bg-[#0F172A] dark:text-[#D1D5DB]",
          open && "border-[#E7C9B4] text-[#B8944E]",
        )}
      >
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[rgba(212,175,55,0.10)] font-bold text-[#B8944E]" style={{ fontSize: 9 }}>
          {index}
        </span>
        <span className="truncate max-w-[140px]">{source.document_filename}</span>
        {source.page_number != null && (
          <span className="text-[#9CA3AF]">p.{source.page_number}</span>
        )}
        <span className="text-[10px] text-[#9CA3AF]">{(source.score * 100).toFixed(0)}%</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 w-72 rounded-[22px] border border-black/6 bg-white p-3 shadow-[0_24px_54px_rgba(10,10,10,0.12)] dark:border-[#F8F9FA]/8 dark:bg-[#111827]">
          <p className="mb-1.5 truncate text-[11px] font-medium text-[#B8944E]">
            {source.document_filename}
            {source.page_number != null && ` — Page ${source.page_number}`}
          </p>
          <p className="line-clamp-6 text-[12px] leading-relaxed text-[#4B5563] dark:text-[#D1D5DB]">
            {source.content}
          </p>
          <div className="mt-2 flex items-center justify-between border-t border-black/6 pt-2 dark:border-[#F8F9FA]/8">
            <span className="text-[10px] text-[#9CA3AF]">Chunk #{source.chunk_index}</span>
            <span className="text-[10px] text-[#B8944E]">{(source.score * 100).toFixed(1)}% match</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Confidence pill ───────────────────────────────────────────────────────────

function ConfidencePill({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    pct >= 80 ? "border-[#7CB69E]/28 bg-[#EDF5F1] text-[#2F6F58]"
    : pct >= 60 ? "border-[#E7C9B4] bg-[rgba(212,175,55,0.08)] text-[#B8944E]"
    : "border-[#F3C3B5] bg-[#FFF5F2] text-[#D14E2C]"

  return (
    <div className={cn("flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px]", color)}>
      <span className="w-1 h-1 rounded-full bg-current" />
      <span>{pct}% confidence</span>
    </div>
  )
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="text-[10px] text-slate-400 transition-colors hover:text-white"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso),
    )
  } catch {
    return ""
  }
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase()
}

function getUserBadgeValue(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim()
    if (!normalized) continue
    if (normalized.toLowerCase() === "user@nexusai.com") continue
    return normalized
  }
  return null
}
