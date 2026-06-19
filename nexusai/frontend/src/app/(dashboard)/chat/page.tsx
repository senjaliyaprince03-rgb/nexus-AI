"use client"

import { useEffect, useCallback, useState, type Dispatch, type SetStateAction } from "react"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { ChatInput } from "@/components/chat/ChatInput"
import { useChatStream } from "@/hooks/useChatStream"
import { useChatStore } from "@/store/chatStore"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/providers/PageTransition"
import type { ChatMode, SupportIntent } from "@/types/api"
import { SUPPORT_TOPICS } from "@/components/support/supportData"

export default function ChatPage() {
  const { sendMessage, cancel, isStreaming } = useChatStream()
  const { workspaceId, setWorkspaceId } = useChatStore()
  const { workspaceId: authedWorkspaceId } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [agents, setAgents] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>("document")
  const [supportIntent, setSupportIntent] = useState<SupportIntent>("technical")

  // Bootstrap: pull workspace from authenticated user
  useEffect(() => {
    if (!workspaceId && authedWorkspaceId) {
      setWorkspaceId(authedWorkspaceId)
    }
  }, [authedWorkspaceId, setWorkspaceId, workspaceId])

  // Listen for suggestion chip clicks from ChatWindow empty state
  const handleSuggestion = useCallback(
    (e: Event) => {
      const text = (e as CustomEvent<string>).detail
      sendMessage(text, buildChatOptions(chatMode, agents, supportIntent))
    },
    [sendMessage, chatMode, agents, supportIntent],
  )

  const handleSend = useCallback(
    (question: string) => sendMessage(question, buildChatOptions(chatMode, agents, supportIntent)),
    [sendMessage, chatMode, agents, supportIntent],
  )

  useEffect(() => {
    window.addEventListener("nexusai:suggestion", handleSuggestion)
    return () => window.removeEventListener("nexusai:suggestion", handleSuggestion)
  }, [handleSuggestion])

  return (
    <PageTransition>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "transition-all duration-300 flex-shrink-0",
            sidebarOpen ? "w-60" : "w-0 overflow-hidden",
          )}
        >
          <ChatSidebar className="w-60 h-full" />
        </div>

        {/* Main area */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Topbar */}
          <Topbar
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
            isStreaming={isStreaming}
            agents={agents}
            setAgents={setAgents}
            chatMode={chatMode}
            setChatMode={setChatMode}
            supportIntent={supportIntent}
            setSupportIntent={setSupportIntent}
          />

          {/* Message area */}
          <ChatWindow mode={chatMode} />

          {/* Input bar */}
          <div className="px-4 pb-5 pt-2">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                onSend={handleSend}
                onCancel={cancel}
                isStreaming={isStreaming}
                disabled={!workspaceId}
                placeholder={
                  workspaceId
                    ? chatMode === "support"
                      ? "Ask NexusAI support..."
                      : "Ask anything about your documents…"
                    : "Select a workspace to start chatting"
                }
              />
              <p className="text-center text-[10px] text-slate-700 mt-2">
                NexusAI may make mistakes. Always verify important information.
              </p>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}

// ── Topbar ────────────────────────────────────────────────────────────────────

interface TopbarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  isStreaming: boolean
  agents: boolean
  setAgents: Dispatch<SetStateAction<boolean>>
  chatMode: ChatMode
  setChatMode: Dispatch<SetStateAction<ChatMode>>
  supportIntent: SupportIntent
  setSupportIntent: Dispatch<SetStateAction<SupportIntent>>
}

function Topbar({
  sidebarOpen,
  onToggleSidebar,
  isStreaming,
  agents,
  setAgents,
  chatMode,
  setChatMode,
  supportIntent,
  setSupportIntent,
}: TopbarProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 flex-shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <SidebarIcon />
      </button>

      <div className="flex items-center gap-2 flex-1">
        <h1 className="text-sm font-medium text-slate-300">{chatMode === "support" ? "Support Chat" : "RAG Chat"}</h1>
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-amber-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            Generating…
          </div>
        )}
      </div>

      {/* Workspace badge */}
      <WorkspaceBadge />

      <ModeToggle chatMode={chatMode} setChatMode={setChatMode} />

      {chatMode === "support" && (
        <SupportIntentSelect supportIntent={supportIntent} setSupportIntent={setSupportIntent} />
      )}

      {/* Agent mode toggle */}
      {chatMode === "document" && <AgentToggle agents={agents} setAgents={setAgents} />}
    </header>
  )
}

function buildChatOptions(mode: ChatMode, agents: boolean, supportIntent: SupportIntent) {
  return mode === "support"
    ? { mode, support_intent: supportIntent, source_policy: "combined" as const, use_agents: false, top_k: 7 }
    : { mode, use_agents: agents }
}

function ModeToggle({
  chatMode,
  setChatMode,
}: {
  chatMode: ChatMode
  setChatMode: Dispatch<SetStateAction<ChatMode>>
}) {
  return (
    <div className="hidden items-center rounded-xl border border-slate-700/60 bg-slate-900/70 p-1 sm:flex">
      {(["document", "support"] as ChatMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setChatMode(mode)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
            chatMode === mode
              ? "bg-amber-500 text-slate-950"
              : "text-slate-500 hover:text-slate-300",
          )}
        >
          {mode === "document" ? "Documents" : "Support"}
        </button>
      ))}
    </div>
  )
}

function SupportIntentSelect({
  supportIntent,
  setSupportIntent,
}: {
  supportIntent: SupportIntent
  setSupportIntent: Dispatch<SetStateAction<SupportIntent>>
}) {
  return (
    <select
      value={supportIntent}
      onChange={(event) => setSupportIntent(event.target.value as SupportIntent)}
      className="hidden rounded-lg border border-slate-700/60 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 outline-none focus:border-amber-500/60 md:block"
      aria-label="Support topic"
    >
      {SUPPORT_TOPICS.map((topic) => (
        <option key={topic.id} value={topic.id}>
          {topic.label}
        </option>
      ))}
    </select>
  )
}

// ── Workspace badge ───────────────────────────────────────────────────────────

function WorkspaceBadge() {
  const workspaceId = useChatStore((s) => s.workspaceId)
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 border border-slate-700/50 rounded-lg px-2.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      <span className="truncate max-w-[100px]">{workspaceId ?? "No workspace"}</span>
    </div>
  )
}

// ── Agent mode toggle ─────────────────────────────────────────────────────────

function AgentToggle({
  agents,
  setAgents,
}: {
  agents: boolean
  setAgents: Dispatch<SetStateAction<boolean>>
}) {
  return (
    <button
      onClick={() => setAgents((a) => !a)}
      title={agents ? "Multi-agent mode ON" : "Multi-agent mode OFF"}
      className={cn(
        "flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1 border transition-all",
        agents
          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
          : "border-slate-700/50 text-slate-500 hover:text-slate-300",
      )}
    >
      <span>⚡</span>
      <span className="hidden sm:inline">Agents</span>
    </button>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SidebarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
    </svg>
  )
}
