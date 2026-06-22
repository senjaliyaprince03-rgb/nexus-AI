"use client"

import { useEffect, useCallback, useState, type Dispatch, type SetStateAction } from "react"
import { Bot, FileSearch, LifeBuoy, ShieldCheck, Sparkles, Workflow } from "lucide-react"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { ChatInput } from "@/components/chat/ChatInput"
import { useChatStream } from "@/hooks/useChatStream"
import { useChatStore } from "@/store/chatStore"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/providers/PageTransition"
import type { ChatMode, SupportIntent } from "@/types/api"
import { SUPPORT_TOPICS } from "@/components/support/supportData"

export default function ChatPage() {
  const { sendMessage, cancel, isStreaming } = useChatStream()
  const { workspaceId, sessions, messages, setWorkspaceId } = useChatStore()
  const { workspaceId: authedWorkspaceId } = useAuth()
  const workspace = useAuthStore((state) => state.workspace)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [agents, setAgents] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>("document")
  const [supportIntent, setSupportIntent] = useState<SupportIntent>("technical")

  useEffect(() => {
    if (!workspaceId && authedWorkspaceId) {
      setWorkspaceId(authedWorkspaceId)
    }
  }, [authedWorkspaceId, setWorkspaceId, workspaceId])

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

  const isEmpty = messages.length === 0

  return (
    <PageTransition>
      <div className="relative h-[calc(100vh-79px)] w-full overflow-hidden flex flex-col">


        <div className="relative z-10 mx-auto flex h-full w-full flex-1 max-w-[1680px] gap-6 p-6">
          {/* Sidebar Panel */}
          <div
            className={cn(
              "transition-all duration-300 flex-shrink-0 z-20 flex h-full",
              sidebarOpen ? "w-[320px]" : "w-0 overflow-hidden",
            )}
          >
            <ChatSidebar className="w-full h-full flex-1 rounded-3xl border border-border bg-bg-card shadow-sm" />
          </div>

          {/* Main Chat Panel */}
          <main className="flex min-w-0 flex-1 flex-col rounded-3xl border border-border bg-bg-card shadow-sm overflow-hidden relative">
            
            {/* Floating Topbar */}
            <header className="absolute top-0 left-0 w-full z-20 flex justify-between items-center p-6 pointer-events-none">
              <div className="pointer-events-auto">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-bg-secondary/80 text-text-secondary transition-all hover:bg-bg-secondary hover:text-text-primary backdrop-blur-md shadow-sm"
                >
                  <SidebarIcon />
                </button>
              </div>

              <div className="pointer-events-auto flex items-center bg-bg-secondary/80 p-1 rounded-full border border-border shadow-sm backdrop-blur-md">
                {(["document", "support"] as ChatMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setChatMode(mode)}
                    className={cn(
                      "px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                      chatMode === mode
                        ? "bg-bg-card text-accent border border-border shadow-sm"
                        : "text-text-secondary hover:text-text-primary border border-transparent",
                    )}
                  >
                    {mode === "document" ? "Workspace" : "Support"}
                  </button>
                ))}
              </div>
              
              <div className="w-10" /> {/* Spacer for centering */}
            </header>

            {isEmpty ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 z-10 relative overflow-y-auto">
                <div className="text-center w-full max-w-4xl mt-12">
                  <h1 className="font-display text-4xl tracking-tight sm:text-5xl text-text-primary mb-6 font-bold">
                    {chatMode === "support" ? "How can we help you today?" : "Workspace Intelligence Search"}
                  </h1>
                  <p className="text-lg text-text-secondary font-light max-w-2xl mx-auto mb-12">
                    {chatMode === "support" 
                      ? "Get instant answers about your account, billing, or report technical issues to our NexusAI support team."
                      : "Search across your entire document repository, pull citations, and generate accurate insights instantly."}
                  </p>

                  <div className="mx-auto w-full max-w-3xl mb-12">
                    <div className="rounded-[32px] p-2 bg-bg-secondary/50 border border-border/50 shadow-sm relative">
                      <div className="relative bg-bg-card rounded-[24px] border border-border p-2">
                        <div className="px-4 py-2 mb-1 flex items-center justify-between text-xs text-text-secondary font-medium">
                          <span className="uppercase tracking-wider">
                            {chatMode === "support" ? "Support Ticket" : "Workspace Query"}
                          </span>
                          <span className="flex items-center gap-2 text-accent">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span> Ready
                          </span>
                        </div>
                        <ChatInput
                          onSend={handleSend}
                          onCancel={cancel}
                          isStreaming={isStreaming}
                          disabled={!workspaceId}
                          placeholder={chatMode === "support" ? "Describe your issue or question..." : "Ask anything about your documents..."}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Suggestions Grid */}
                  <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {chatMode === "support" ? (
                      <>
                        <SuggestionChip icon={<LifeBuoy />} title="Report a problem" desc="Get help with a technical issue" onClick={() => handleSend("I need to report a technical problem.")} />
                        <SuggestionChip icon={<ShieldCheck />} title="Billing & Plans" desc="Manage your subscription" onClick={() => handleSend("I need help with billing and my subscription plan.")} />
                        <SuggestionChip icon={<Bot />} title="Agent Setup" desc="Configure your AI agents" onClick={() => handleSend("How do I set up and configure my AI agents?")} />
                        <SuggestionChip icon={<Sparkles />} title="Feature Request" desc="Suggest a new feature" onClick={() => handleSend("I would like to suggest a new feature.")} />
                      </>
                    ) : (
                      <>
                        <SuggestionChip icon={<FileSearch />} title="Find documents" desc="Search by keyword or topic" onClick={() => handleSend("Find documents related to our recent project.")} />
                        <SuggestionChip icon={<Workflow />} title="Summarize" desc="Get a summary of a topic" onClick={() => handleSend("Summarize the main points of our operational guidelines.")} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col min-h-0 z-10 relative pt-24">
                <div className="flex-1 overflow-y-auto">
                  <ChatWindow mode={chatMode} />
                </div>
                <div className="p-5 border-t border-border bg-bg-card">
                  <div className="mx-auto max-w-4xl">
                    <ChatInput
                      onSend={handleSend}
                      onCancel={cancel}
                      isStreaming={isStreaming}
                      disabled={!workspaceId}
                      placeholder={
                        workspaceId
                          ? chatMode === "support"
                            ? "Ask NexusAI support about your account, billing, privacy, or technical setup..."
                            : "Ask anything about your workspace documents..."
                          : "Connect a workspace to start chatting"
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </PageTransition>
  )
}

function SuggestionChip({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-bg-card hover:bg-bg-secondary hover:border-border/80 transition-all text-left group"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
        <div className="w-5 h-5">{icon}</div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
      </div>
    </button>
  )
}

function buildChatOptions(mode: ChatMode, agents: boolean, supportIntent: SupportIntent) {
  return mode === "support"
    ? { mode, support_intent: supportIntent, source_policy: "combined" as const, use_agents: false, top_k: 7 }
    : { mode, use_agents: agents }
}

function SidebarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
    </svg>
  )
}
