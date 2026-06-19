"use client"

import { useState } from "react"
import {
  Calculator,
  GraduationCap,
  LineChart,
  Globe2,
  Youtube,
  Database,
  Loader2,
  Play,
} from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

type HubAgent = {
  id: "finance" | "research" | "math" | "web" | "youtube" | "rag"
  label: string
  icon: React.ComponentType<{ className?: string }>
  placeholder: string
}

const HUB_AGENTS: HubAgent[] = [
  { id: "finance",  label: "Financial",  icon: LineChart,     placeholder: "Analyse AAPL stock or ask about market trends…" },
  { id: "research", label: "Academic",   icon: GraduationCap, placeholder: "Search arXiv papers or review literature…" },
  { id: "math",     label: "Math",       icon: Calculator,    placeholder: "Calculate 144 / 12 + 8 or solve a numeric expression…" },
  { id: "web",      label: "Web Search", icon: Globe2,        placeholder: "Search-style research question or recent topic…" },
  { id: "youtube",  label: "YouTube",    icon: Youtube,       placeholder: "Paste a YouTube URL and ask for a transcript summary…" },
  { id: "rag",      label: "RAG",        icon: Database,      placeholder: "Query your document workspace…" },
]

export default function IntelligenceHub({ workspaceId }: { workspaceId?: string }) {
  const [active, setActive] = useState<HubAgent>(HUB_AGENTS[0])
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [status, setStatus] = useState("idle")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    if (!query.trim() || loading) return
    setLoading(true)
    setResult(null)
    setError(null)
    setStatus("queued")
    try {
      const run = await api.post<{ run_id: string; status: string; agent_type: string }>("/api/agents/run", {
        question: query,
        top_k: 5,
        agent_type: active.id,
      })
      setStatus(run.status || "queued")

      let attempts = 0
      const poll = window.setInterval(async () => {
        attempts += 1
        try {
          const next = await api.get<{ status: string }>(`/api/agents/runs/${run.run_id}/status`)
          setStatus(next.status)
          if (next.status === "complete" || next.status === "failed" || attempts >= 25) {
            window.clearInterval(poll)
            if (next.status === "complete") {
              const data = await api.get<{ answer: string }>(`/api/agents/runs/${run.run_id}/result`)
              setResult(data.answer || "Agent completed, but no answer was returned.")
            } else if (attempts >= 25) {
              setError("Agent is taking too long. Check that the backend worker or development inline runner is active.")
            } else {
              setError("Agent run failed. Check backend configuration and try again.")
            }
            setLoading(false)
          }
        } catch (err) {
          window.clearInterval(poll)
          setError(err instanceof ApiError ? err.detail : "Could not read agent status.")
          setLoading(false)
        }
      }, 1000)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Request failed")
      setStatus("failed")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Agent selector */}
      <div className="flex flex-wrap gap-2">
        {HUB_AGENTS.map((agent) => {
          const Icon = agent.icon
          const isActive = agent.id === active.id
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => { setActive(agent); setResult(null); setError(null) }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "border-[#C5A059]/30 bg-[rgba(212,175,55,0.08)] text-[#C5A059]"
                  : "border-[rgba(0,0,0,0.08)] bg-white text-[#4B5563] hover:border-[#DADADA]",
              )}
            >
              <Icon className="h-4 w-4" />
              {agent.label}
            </button>
          )
        })}
      </div>

      {/* Input */}
      <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-sm space-y-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={4}
          placeholder={active.placeholder}
          className="w-full resize-none rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F8F9FA] p-4 text-sm text-[#18181B] outline-none placeholder:text-[#9CA3AF] focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
        />
        {error && (
          <p className="rounded-xl border border-[#FFD7C7] bg-[rgba(212,175,55,0.08)] px-4 py-2 text-sm text-[#A07D3A]">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleRun}
            disabled={loading || !query.trim()}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all",
              loading || !query.trim()
                ? "cursor-not-allowed bg-[#E5E5E5] text-[#9CA3AF]"
                : "bg-gradient-to-r from-[#C5A059] to-[#FF8C35] text-white hover:shadow-[0_4px_14px_rgba(255,107,53,0.3)]",
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            {loading ? `Running (${status})…` : "Run"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Result</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-[#F8F9FA] p-4 text-sm leading-relaxed text-[#18181B]">
            {result}
          </pre>
        </div>
      )}
    </div>
  )
}

