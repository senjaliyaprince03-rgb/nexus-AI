"use client"

import { useState } from "react"
import { useChatStore } from "@/store/chatStore"
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
    reset,
  } = useChatStore()

  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleNewChat = () => {
    setActiveSession(null)
    // Clear messages for a fresh conversation
    useChatStore.setState({ messages: [], activeSessionId: null })
  }

  // Group sessions by recency
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  const groups: { label: string; items: typeof sessions }[] = []
  const todayItems = sessions.filter(
    (s) => new Date(s.updated_at).toDateString() === today,
  )
  const yesterdayItems = sessions.filter(
    (s) => new Date(s.updated_at).toDateString() === yesterday,
  )
  const olderItems = sessions.filter(
    (s) =>
      new Date(s.updated_at).toDateString() !== today &&
      new Date(s.updated_at).toDateString() !== yesterday,
  )

  if (todayItems.length) groups.push({ label: "Today", items: todayItems })
  if (yesterdayItems.length) groups.push({ label: "Yesterday", items: yesterdayItems })
  if (olderItems.length) groups.push({ label: "Earlier", items: olderItems })

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-slate-900/50 border-r border-slate-800/60",
        className,
      )}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-3 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-amber-400 text-base">⬡</span>
          <span className="text-sm font-semibold text-slate-200 tracking-tight">NexusAI</span>
        </div>
        <button
          onClick={handleNewChat}
          title="New conversation"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-all"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Search (cosmetic for now) */}
      <div className="px-3 mb-3">
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search chats…"
            className="flex-1 bg-transparent text-[12px] text-slate-300 placeholder:text-slate-600 outline-none"
          />
        </div>
      </div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-3 pb-4" style={{ scrollbarWidth: "thin" }}>
        {groups.length === 0 && (
          <p className="text-[11px] text-slate-600 text-center mt-8 px-3">
            No conversations yet.
            <br />Start a new chat above.
          </p>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest px-2 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
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

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-800/60">
        <button className="w-full flex items-center gap-2.5 text-[12px] text-slate-500 hover:text-slate-300 rounded-xl px-2 py-2 hover:bg-slate-800/40 transition-all">
          <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
            U
          </span>
          <span className="flex-1 text-left truncate">user@nexusai.com</span>
          <SettingsIcon />
        </button>
      </div>
    </aside>
  )
}

// ── Session row ───────────────────────────────────────────────────────────────

interface SessionRowProps {
  session: { id: string; title: string; updated_at: string }
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
        "group relative flex items-center gap-2 rounded-xl px-2.5 py-2 cursor-pointer transition-all",
        isActive
          ? "bg-amber-500/10 border border-amber-500/20"
          : "hover:bg-slate-800/50 border border-transparent",
      )}
      onMouseEnter={() => onHover(session.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
    >
      <span className="text-slate-600 text-[11px] flex-shrink-0">
        {isActive ? "▸" : "·"}
      </span>
      <span
        className={cn(
          "flex-1 text-[12px] truncate leading-snug",
          isActive ? "text-amber-300" : "text-slate-400",
        )}
      >
        {session.title || "Untitled conversation"}
      </span>

      {/* Delete button — visible on hover */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-slate-600 hover:text-red-400 rounded transition-colors"
          aria-label="Delete conversation"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const iconProps = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" as const, strokeLinejoin: "round" as const }

const PlusIcon = () => <svg {...iconProps}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const SearchIcon = () => <svg {...{ ...iconProps, width: 12, height: 12, stroke: "#64748b" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const SettingsIcon = () => <svg {...{ ...iconProps, width: 13, height: 13 }}><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.66 5.34l1.41-1.41"/></svg>
const TrashIcon = () => <svg {...{ ...iconProps, width: 12, height: 12 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/></svg>
