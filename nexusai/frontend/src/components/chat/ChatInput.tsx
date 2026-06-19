"use client"

import React, {
  useRef,
  useState,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string) => void
  onCancel: () => void
  isStreaming: boolean
  disabled?: boolean
  placeholder?: string
}

const MAX_LENGTH = 2000

export function ChatInput({
  onSend,
  onCancel,
  isStreaming,
  disabled = false,
  placeholder = "Ask anything about your documents…",
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed)
    setValue("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, isStreaming, disabled, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_LENGTH)
    setValue(val)
    // Auto-resize textarea
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 200) + "px"
  }

  const remaining = MAX_LENGTH - value.length
  const isNearLimit = remaining < 200

  return (
    <div className="relative border border-slate-700/60 rounded-2xl bg-slate-800/60 backdrop-blur-sm focus-within:border-amber-500/50 focus-within:bg-slate-800/80 transition-all shadow-lg shadow-black/20">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500",
          "px-4 pt-3.5 pb-12 rounded-2xl outline-none leading-relaxed",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent",
        )}
        style={{ minHeight: 52, maxHeight: 200 }}
        aria-label="Chat message input"
      />

      {/* Bottom toolbar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-2.5">
        {/* Left — char counter */}
        <div className="flex items-center gap-2">
          {isNearLimit && (
            <span className={cn(
              "text-[10px] tabular-nums",
              remaining < 50 ? "text-red-400" : "text-amber-500/70"
            )}>
              {remaining} left
            </span>
          )}
        </div>

        {/* Right — action buttons */}
        <div className="flex items-center gap-1.5">
          {isStreaming ? (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 border border-slate-600/60 hover:border-red-500/40 rounded-lg px-2.5 py-1 transition-all"
              aria-label="Cancel streaming"
            >
              <StopIcon />
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              className={cn(
                "flex items-center gap-1.5 text-xs rounded-xl px-3 py-1.5 font-medium transition-all",
                value.trim() && !disabled
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-slate-700/60 text-slate-500 cursor-not-allowed",
              )}
              aria-label="Send message"
            >
              <SendIcon />
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}
