"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { ChatMessage, SourceChunk } from "@/types/api"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isStreaming = message.isStreaming
  const sources = message.sources ?? []
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("group flex gap-3 px-4 py-3", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <Avatar role={message.role} />

      <div className={cn("flex flex-col gap-2 max-w-[72%]", isUser && "items-end")}>
        {/* Bubble */}
        <div
          className={cn(
            "relative rounded-[22px] px-4 py-3 text-sm leading-relaxed shadow-[0_18px_45px_rgba(2,6,23,0.18)]",
            isUser
              ? "bg-[linear-gradient(135deg,#D4AF37,#fbbf24)] text-slate-950 rounded-tr-sm font-medium"
              : "border border-[#F8F9FA]/8 bg-[linear-gradient(180deg,rgba(19,27,46,0.95),rgba(11,18,31,0.9))] text-slate-100 rounded-tl-sm",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}

          {/* Streaming cursor */}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-amber-400 ml-0.5 animate-pulse align-middle" />
          )}
        </div>

        {/* Citations */}
        {!isUser && sources.length > 0 && (
          <CitationRow sources={sources} />
        )}

        {/* Confidence score */}
        {!isUser && !isStreaming && message.confidence_score != null && (
          <ConfidencePill score={message.confidence_score} />
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-600 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.created_at)}
        </span>
      </div>
    </motion.div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ role }: { role: string }) {
  return (
    <div
      className={cn(
        "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl text-[11px] font-bold shadow-[0_12px_30px_rgba(2,6,23,0.25)]",
        role === "user"
          ? "bg-[linear-gradient(135deg,#D4AF37,#fde68a)] text-slate-950"
          : "border border-[#F8F9FA]/8 bg-[linear-gradient(180deg,rgba(26,35,58,0.96),rgba(11,18,31,0.94))] text-amber-300",
      )}
    >
      {role === "user" ? "U" : "N"}
    </div>
  )
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:text-slate-200 prose-a:text-amber-400 prose-code:text-amber-300 prose-pre:bg-transparent prose-pre:p-0"
      components={{
        // Inline code
        code({ className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className ?? "")
          const isBlock = !!match

          if (!isBlock) {
            return (
              <code
                className="bg-slate-700/60 text-amber-300 rounded px-1 py-0.5 text-[12px] font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }

          return (
            <div className="my-3 rounded-xl overflow-hidden border border-slate-700/60">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-700/60">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
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
        // Citation markers [1], [2] become styled chips
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
          "flex items-center gap-1.5 text-[11px] rounded-lg px-2 py-1 border transition-all",
          "bg-slate-950/60 border-[#F8F9FA]/8 text-slate-400 hover:border-amber-500/40 hover:text-amber-400",
          open && "border-amber-500/40 text-amber-400 bg-slate-950",
        )}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold" style={{ fontSize: 9 }}>
          {index}
        </span>
        <span className="truncate max-w-[140px]">{source.document_filename}</span>
        {source.page_number != null && (
          <span className="text-slate-600">p.{source.page_number}</span>
        )}
        <span className="text-slate-600 text-[10px]">{(source.score * 100).toFixed(0)}%</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 w-72 rounded-2xl border border-[#F8F9FA]/8 bg-[linear-gradient(180deg,rgba(9,14,26,0.98),rgba(6,10,18,0.98))] p-3 shadow-2xl shadow-black/60">
          <p className="text-[11px] text-amber-400 font-medium mb-1.5 truncate">
            {source.document_filename}
            {source.page_number != null && ` — Page ${source.page_number}`}
          </p>
          <p className="text-[12px] text-slate-300 leading-relaxed line-clamp-6">
            {source.content}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-[10px] text-slate-600">Chunk #{source.chunk_index}</span>
            <span className="text-[10px] text-amber-500">{(source.score * 100).toFixed(1)}% match</span>
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
    pct >= 80 ? "text-emerald-300 border-emerald-500/24 bg-emerald-500/8"
    : pct >= 60 ? "text-amber-300 border-amber-500/24 bg-amber-500/8"
    : "text-red-300 border-red-500/24 bg-red-500/8"

  return (
    <div className={cn("flex items-center gap-1 text-[10px] rounded-full px-2.5 py-1 border", color)}>
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
      className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso),
    )
  } catch {
    return ""
  }
}
