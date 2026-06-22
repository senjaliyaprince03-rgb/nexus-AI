"use client"

import { useMemo, useState } from "react"
import { Building2, Clock3, MessageSquarePlus, Moon, Search, Sun, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import { LogoMark } from "@/components/brand/LogoMark"
import { useChatStore } from "@/store/chatStore"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  className?: string
}

export function ChatSidebar({ className }: ChatSidebarProps) {
  const {
    sessions,
    activeSessionId,
    setActiveSession,
    removeSession,
  } = useChatStore()
  const user = useAuthStore((state) => state.user)
  const workspace = useAuthStore((state) => state.workspace)
  const sessionChecked = useAuthStore((state) => state.sessionChecked)
  const isLoading = useAuthStore((state) => state.isLoading)
  const { resolvedTheme, setTheme } = useTheme()

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const handleNewChat = () => {
    setActiveSession(null)
    useChatStore.setState({ messages: [], activeSessionId: null })
  }

  // Group sessions by recency
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  const visibleSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return sessions
    return sessions.filter((session) => {
      const modeLabel = session.mode === "support" ? "support" : "document"
      return (
        session.title.toLowerCase().includes(normalized) ||
        modeLabel.includes(normalized)
      )
    })
  }, [query, sessions])

  const groups: { label: string; items: typeof visibleSessions }[] = []
  const todayItems = visibleSessions.filter(
    (s) => new Date(s.updated_at).toDateString() === today,
  )
  const yesterdayItems = visibleSessions.filter(
    (s) => new Date(s.updated_at).toDateString() === yesterday,
  )
  const olderItems = visibleSessions.filter(
    (s) =>
      new Date(s.updated_at).toDateString() !== today &&
      new Date(s.updated_at).toDateString() !== yesterday,
  )

  if (todayItems.length) groups.push({ label: "Today", items: todayItems })
  if (yesterdayItems.length) groups.push({ label: "Yesterday", items: yesterdayItems })
  if (olderItems.length) groups.push({ label: "Earlier", items: olderItems })

  const footerLabel =
    getAccountLabel(user?.email, user?._id, user?.id) ||
    workspace?.id ||
    (sessionChecked && !isLoading ? "No active account" : "Checking session")

  return (
    <aside
      className={cn(
        "flex h-full flex-col rounded-3xl border border-border bg-bg-card shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Workspace chat</p>
            <p className="truncate text-sm font-semibold text-text-primary">
              {workspace?.name ?? "NexusAI workspace"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <button
          onClick={handleNewChat}
          title="New conversation"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-white px-4 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New conversation
        </button>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-bg-secondary px-3 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            className="flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-secondary"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: "thin" }}>
        {groups.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-border bg-bg-secondary/50 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-text-primary">No conversations yet</p>
            <p className="mt-1 text-xs leading-5 text-text-secondary">
              Start a new chat to search documents or ask NexusAI support.
            </p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.items.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  isHovered={hoveredId === session.id}
                  onHover={setHoveredId}
                  onSelect={() => setActiveSession(session.id)}
                  onDelete={() => removeSession(session.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg-secondary px-3 py-2.5 shadow-sm">
          <LogoMark className="h-8 w-8 rounded-full shadow-sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
            {footerLabel}
          </span>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
            aria-label="Toggle theme"
            title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Session row ───────────────────────────────────────────────────────────────

interface SessionRowProps {
  session: { id: string; title: string; updated_at: string; mode?: string; messages?: Array<unknown> }
  isActive: boolean
  isHovered: boolean
  onHover: (id: string | null) => void
  onSelect: () => void
  onDelete: () => void
}

function SessionRow({ session, isActive, isHovered, onHover, onSelect, onDelete }: SessionRowProps) {
  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-[22px] border px-3.5 py-3 transition-all",
        isActive
          ? "border-accent/40 bg-accent/10 shadow-sm"
          : "border-transparent hover:border-accent/20 hover:bg-accent/5",
      )}
      onMouseEnter={() => onHover(session.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "line-clamp-2 text-[13px] font-semibold leading-5",
              isActive ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary",
            )}
          >
            {session.title || "Untitled conversation"}
          </span>
          <span className="mt-0.5 inline-flex flex-shrink-0 rounded-full border border-border bg-bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
            {session.mode === "support" ? "Support" : "Docs"}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-text-secondary">
          <Clock3 className="h-3.5 w-3.5" />
          <span>{formatRelativeTime(session.updated_at)}</span>
          <span>•</span>
          <span>{session.messages?.length ?? 0} messages</span>
        </div>
      </div>

      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute right-3 top-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-card hover:text-red-500"
          aria-label="Delete conversation"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return "Recently"
  const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000))
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.round(diffHours / 24)}d ago`
}

function getAccountLabel(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim()
    if (!normalized) continue
    if (normalized.toLowerCase() === "user@nexusai.com") continue
    return normalized
  }
  return null
}
