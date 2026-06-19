"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowUpRight, Bot, LifeBuoy, Send, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import { useChatStore } from "@/store/chatStore"
import { useChatStream } from "@/hooks/useChatStream"
import type { SupportIntent } from "@/types/api"
import { SUPPORT_TOPICS } from "./supportData"

export function SupportFloatingWidget() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const workspaceId = useChatStore((s) => s.workspaceId)
  const setWorkspaceId = useChatStore((s) => s.setWorkspaceId)
  const { sendMessage, isStreaming } = useChatStream()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [intent, setIntent] = useState<SupportIntent>("technical")

  useEffect(() => {
    if (!workspaceId && user?.workspace_id) {
      setWorkspaceId(user.workspace_id)
    }
  }, [setWorkspaceId, user?.workspace_id, workspaceId])

  if (!isAuthenticated || !user || !pathname?.startsWith("/dashboard") || pathname.startsWith("/dashboard/support")) {
    return null
  }

  const sendSupportMessage = async (message: string, nextIntent = intent) => {
    const trimmed = message.trim()
    if (!trimmed || !workspaceId || isStreaming) return
    await sendMessage(trimmed, {
      mode: "support",
      support_intent: nextIntent,
      source_policy: "combined",
      use_agents: false,
    })
    setValue("")
    router.push("/dashboard/support")
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-[min(calc(100vw-2rem),380px)] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_28px_90px_rgba(10,10,10,0.20)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-secondary)] text-[var(--accent-coral)]">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">AI Help Desk</p>
                  <p className="text-xs text-[var(--text-secondary)]">Docs plus support FAQs</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]" aria-label="Close support widget">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {SUPPORT_TOPICS.slice(0, 4).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setIntent(topic.id)
                      sendSupportMessage(topic.prompt, topic.id)
                    }}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[rgba(255,107,53,0.3)] hover:text-[var(--accent-coral)]"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-secondary)] p-2">
                <div className="flex items-center gap-2">
                  <input
                    value={value}
                    onChange={(event) => setValue(event.target.value.slice(0, 500))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        sendSupportMessage(value)
                      }
                    }}
                    placeholder={workspaceId ? "Ask support..." : "Workspace loading..."}
                    disabled={!workspaceId || isStreaming}
                    className="min-h-10 flex-1 bg-transparent px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                    aria-label="Floating support input"
                  />
                  <button
                    onClick={() => sendSupportMessage(value)}
                    disabled={!value.trim() || !workspaceId || isStreaming}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--accent-coral)] text-white transition hover:bg-[#E55A25] disabled:bg-[var(--landing-border-soft)] disabled:text-[var(--text-muted)]"
                    aria-label="Send floating support message"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => router.push("/dashboard/support")}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-semibold text-[var(--accent-green)] transition hover:bg-[var(--bg-card)]"
              >
                <ArrowUpRight className="h-4 w-4" />
                Open full support workspace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((value) => !value)}
        className="group flex h-16 w-16 items-center justify-center rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[0_22px_70px_rgba(17,23,20,0.18)] transition hover:-translate-y-1 hover:bg-[var(--bg-secondary)]"
        aria-label="Open AI support widget"
      >
        <LifeBuoy className="h-6 w-6 text-[var(--accent-coral)] transition group-hover:scale-110" />
      </button>
    </div>
  )
}
