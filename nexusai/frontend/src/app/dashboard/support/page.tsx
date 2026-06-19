"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, FileText, ShieldCheck, Wrench } from "lucide-react"
import { api } from "@/lib/api"
import { useChatStream } from "@/hooks/useChatStream"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/store/authStore"
import { useChatStore } from "@/store/chatStore"
import type { SupportIntent, SupportMetrics } from "@/types/api"
import { SupportChatPanel } from "@/components/support/SupportChatPanel"
import { SupportMetricsPanel } from "@/components/support/SupportMetricsPanel"
import { SupportSceneFallback } from "@/components/support/SupportScene"
import { SUPPORT_FALLBACK_METRICS, SUPPORT_TOPICS } from "@/components/support/supportData"

const SupportScene = dynamic(
  () => import("@/components/support/SupportScene").then((mod) => mod.SupportScene),
  {
    ssr: false,
    loading: () => <SupportSceneFallback />,
  },
)

export default function SupportPage() {
  useAuth()
  const { sendMessage, cancel, isStreaming } = useChatStream()
  const [activeIntent, setActiveIntent] = useState<SupportIntent>("technical")
  const [metrics, setMetrics] = useState<SupportMetrics>(SUPPORT_FALLBACK_METRICS)
  const workspaceId = useChatStore((s) => s.workspaceId)
  const setWorkspaceId = useChatStore((s) => s.setWorkspaceId)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!workspaceId && user?.workspace_id) {
      setWorkspaceId(user.workspace_id)
    }
  }, [setWorkspaceId, user?.workspace_id, workspaceId])

  useEffect(() => {
    let alive = true
    api.get<SupportMetrics>("/api/support/metrics")
      .then((data) => {
        if (alive) setMetrics(data)
      })
      .catch(() => {
        if (alive) setMetrics(SUPPORT_FALLBACK_METRICS)
      })
    return () => {
      alive = false
    }
  }, [])

  const handleSend = useCallback(
    (message: string, intent = activeIntent) => {
      sendMessage(message, {
        mode: "support",
        support_intent: intent,
        source_policy: "combined",
        use_agents: false,
        top_k: 7,
      })
    },
    [activeIntent, sendMessage],
  )

  const activeTopic = SUPPORT_TOPICS.find((topic) => topic.id === activeIntent) ?? SUPPORT_TOPICS[1]

  return (
    <div className="dashboard-shell min-h-full px-5 py-5 text-[#18181B] dark:text-[#F8F9FA]">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-5">
        <header className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="relative min-h-[430px] overflow-hidden rounded-[36px] border border-[#E9E1D9] dark:border-[#F8F9FA]/8 bg-[#F4F1EC] dark:bg-[#111827] p-4 shadow-[0_32px_110px_rgba(10,10,10,0.08)] md:min-h-[470px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_56%_48%,rgba(255,255,255,0.96),transparent_34%)] dark:bg-[radial-gradient(circle_at_56%_48%,rgba(255,255,255,0.07),transparent_34%)]" />
            <SupportScene />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0">
              <div className="absolute left-6 top-[106px] z-10 max-w-[460px] md:left-8 md:top-[116px]">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E7C9B4] dark:border-[#F8F9FA]/10 bg-white/92 dark:bg-[#0F172A]/90 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B] dark:text-[#A1A1AA] shadow-[0_10px_28px_rgba(10,10,10,0.05)] backdrop-blur-xl">
                  <span className="text-[#B8944E]">✦</span>
                  Support
                </div>
                <h1 className="max-w-[360px] font-display text-[3.3rem] leading-[0.88] tracking-[-0.07em] text-[#1C1C20] dark:text-[#F8F9FA] md:max-w-[410px] md:text-[4.9rem]">
                  AI Help Desk
                </h1>
                <p className="mt-4 max-w-[360px] text-[14px] leading-7 text-[#64748B] dark:text-[#A1A1AA] md:max-w-[430px] md:text-[15px]">
                  Workspace documents, support FAQs, citations, and safety guidance mapped into one 3D support workspace.
                </p>
              </div>
              <div className="absolute bottom-6 right-6 z-10 hidden rounded-[24px] border border-[#F8F9FA]/70 bg-[#161513]/94 p-3 text-white shadow-[0_20px_54px_rgba(12,12,12,0.15)] backdrop-blur-xl md:block">
                <div className="flex items-center gap-3 pr-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#F8F9FA]/10 bg-[#1C1C1E] text-[#E0D0A0] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Technical</p>
                    <p className="text-xs text-white/58">API, indexing, document topics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <PremiumSignal
              icon={ShieldCheck}
              title="AI assistant"
              description="Answers disclose AI behavior and avoid passwords, full card numbers, private keys, API secrets, or one-time codes."
            />
            <PremiumSignal
              icon={FileText}
              title="Docs plus FAQ"
              description="Support mode combines workspace sources with curated NexusAI support FAQ guidance."
            />
            <PremiumSignal
              icon={CheckCircle2}
              title="No human handoff enabled"
              description="When sources are missing, the assistant asks one focused clarifying question instead of promising tickets."
            />
          </div>
        </header>

        <main className="grid min-h-[720px] gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SupportChatPanel
            activeIntent={activeIntent}
            onIntentChange={setActiveIntent}
            onSend={handleSend}
            onCancel={cancel}
            isStreaming={isStreaming}
            disabled={!workspaceId}
          />
          <SupportMetricsPanel metrics={metrics} />
        </main>
      </div>
    </div>
  )
}

function PremiumSignal({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck
  title: string
  description: string
}) {
  return (
    <div className="rounded-[28px] border border-black/5 dark:border-[#F8F9FA]/8 bg-white/82 dark:bg-[#0F172A]/84 p-4 shadow-[0_18px_58px_rgba(10,10,10,0.08)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FFF0EB] dark:bg-[#C5A059]/10 text-[#C5A059]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#6A6A6A] dark:text-[#A1A1AA]">{description}</p>
        </div>
      </div>
    </div>
  )
}
