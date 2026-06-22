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
    <div className="premium-glow-field relative rounded-[26px] border border-border bg-bg-card shadow-sm transition-all">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "w-full resize-none bg-transparent text-sm leading-relaxed text-text-primary placeholder:text-text-secondary",
          "rounded-[26px] px-4 pb-12 pt-3.5 outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
        style={{ minHeight: 52, maxHeight: 200 }}
        aria-label="Chat message input"
      />

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-2">
          {isNearLimit && (
            <span className={cn(
              "text-[10px] tabular-nums",
              remaining < 50 ? "text-red-500" : "text-accent"
            )}>
              {remaining} left
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isStreaming ? (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-red-500 hover:text-red-500"
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
                "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                value.trim() && !disabled
                  ? "bg-accent text-white shadow-sm hover:-translate-y-0.5"
                  : "cursor-not-allowed bg-bg-secondary text-text-secondary",
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
