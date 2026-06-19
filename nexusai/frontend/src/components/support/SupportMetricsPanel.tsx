"use client"

import { Activity, Gauge, LineChart, ShieldCheck } from "lucide-react"
import type { SupportMetrics } from "@/types/api"
import { formatLatency, formatPercent, SUPPORT_FALLBACK_METRICS } from "./supportData"

interface SupportMetricsPanelProps {
  metrics?: SupportMetrics | null
}

export function SupportMetricsPanel({ metrics }: SupportMetricsPanelProps) {
  const data = metrics ?? SUPPORT_FALLBACK_METRICS
  const coverage = data.source_coverage

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 rounded-[28px] border border-black/5 dark:border-[#F8F9FA]/8 bg-white/78 dark:bg-[#0F172A]/82 p-4 shadow-[0_22px_70px_rgba(10,10,10,0.09)] backdrop-blur-xl">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9CA3AF] dark:text-[#71717A]">Recent support signals</p>
        <h2 className="mt-1 font-display text-2xl leading-none tracking-[-0.04em] text-[#18181B] dark:text-[#F8F9FA]">Quality layer</h2>
      </div>

      <div className="grid gap-3">
        <MetricCard icon={Gauge} label="Fallbacks" value={formatPercent(data.fallback_rate)} tone="orange" />
        <MetricCard icon={ShieldCheck} label="CSAT" value={formatPercent(data.csat)} tone="green" />
        <MetricCard icon={Activity} label="Avg response" value={formatLatency(data.avg_response_ms)} tone="dark" />
      </div>

      <div className="rounded-3xl border border-black/5 bg-[#111714] p-4 text-white shadow-[0_18px_48px_rgba(17,23,20,0.18)]">
        <div className="mb-4 flex items-center gap-2">
          <LineChart className="h-4 w-4 text-[#7CB69E]" />
          <p className="text-sm font-semibold">Source coverage</p>
        </div>
        <div className="space-y-3">
          <CoverageRow label="Workspace docs" value={coverage.workspace_docs} percent={coverage.workspace_doc_ratio} color="#7CB69E" />
          <CoverageRow label="Support FAQ" value={coverage.faq} percent={coverage.faq + coverage.workspace_docs ? coverage.faq / (coverage.faq + coverage.workspace_docs) : 0} color="#C5A059" />
        </div>
      </div>

      <div className="mt-auto rounded-3xl border border-[#C5A059]/14 dark:border-[#C5A059]/18 bg-[#FFF7F2] dark:bg-[#1F1411] p-4">
        <p className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">No human handoff enabled</p>
        <p className="mt-1 text-xs leading-relaxed text-[#6A6A6A] dark:text-[#A1A1AA]">
          The assistant stays inside NexusAI docs, support FAQs, and safe clarification when sources are missing.
        </p>
      </div>
    </aside>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Gauge
  label: string
  value: string
  tone: "orange" | "green" | "dark"
}) {
  const color = tone === "orange" ? "#C5A059" : tone === "green" ? "#7CB69E" : "#111714"
  return (
    <div className="flex items-center justify-between rounded-3xl border border-black/5 dark:border-[#F8F9FA]/8 bg-white dark:bg-white/5 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}14`, color }}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-[#4B5563] dark:text-[#D1D5DB]">{label}</span>
      </div>
      <span className="font-mono text-lg font-semibold text-[#18181B] dark:text-[#F8F9FA]">{value}</span>
    </div>
  )
}

function CoverageRow({ label, value, percent, color }: { label: string; value: number; percent: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="font-mono text-white">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${Math.max(6, Math.round(percent * 100))}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
