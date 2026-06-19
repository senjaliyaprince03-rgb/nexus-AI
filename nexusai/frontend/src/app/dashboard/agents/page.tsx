"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Calculator,
  Database,
  FileText,
  Globe2,
  GraduationCap,
  LineChart,
  Loader2,
  Newspaper,
  Play,
  Search,
  ShieldCheck,
  Youtube,
} from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

type AgentCapability = {
  id: string
  name: string
  category: "standard" | "rag" | "orchestration" | string
  description: string
  upstream_tool: string
  resource_hint?: string | null
}

type AgentResult = {
  answer: string
  citations?: Array<Record<string, unknown>>
  confidence_score?: number | null
  steps?: unknown[]
  agent_type?: string
  agent_name?: string | null
}

type AgentRunSummary = {
  id: string
  status: string
  agent_type: string
  confidence?: number | null
  created_at?: string | null
}

const fallbackAgents: AgentCapability[] = [
  {
    id: "auto",
    name: "Auto Router",
    category: "orchestration",
    description: "Routes the prompt to the best available specialist.",
    upstream_tool: "Agno Team route mode",
  },
  {
    id: "rag",
    name: "Document RAG Agent",
    category: "rag",
    description: "Answers from indexed workspace documents.",
    upstream_tool: "LangChain RAG knowledge base",
  },
]

const iconByAgent: Record<string, ComponentType<{ className?: string }>> = {
  auto: BrainCircuit,
  general: Bot,
  web: Globe2,
  finance: LineChart,
  research: GraduationCap,
  math: Calculator,
  wiki: Search,
  news: Newspaper,
  youtube: Youtube,
  rag: Database,
  rag_memory: FileText,
}

function formatStep(step: unknown): string {
  if (typeof step === "string") return step
  if (step && typeof step === "object") {
    const value = step as Record<string, unknown>
    const node = typeof value.node === "string" ? value.node : "agent"
    const keys = Array.isArray(value.output_keys) ? value.output_keys.join(", ") : "completed"
    return `${node}: ${keys}`
  }
  return "agent: completed"
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentCapability[]>(fallbackAgents)
  const [selectedAgent, setSelectedAgent] = useState("auto")
  const [question, setQuestion] = useState("")
  const [resourceUrl, setResourceUrl] = useState("")
  const [runId, setRunId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("idle")
  const [result, setResult] = useState<AgentResult | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [recentRuns, setRecentRuns] = useState<AgentRunSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshRuns = useCallback(async () => {
    try {
      const payload = await api.get<{ runs: AgentRunSummary[] }>("/api/agents/runs")
      setRecentRuns(payload.runs)
    } catch {
      setRecentRuns([])
    }
  }, [])

  useEffect(() => {
    let active = true
    api.get<{ agents: AgentCapability[] }>("/api/agents/catalog")
      .then((payload) => {
        if (active && payload.agents.length) setAgents(payload.agents)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    void refreshRuns()
  }, [refreshRuns])

  const selected = useMemo(
    () => agents.find((agent) => agent.id === selectedAgent) ?? agents[0],
    [agents, selectedAgent],
  )

  const groupedAgents = useMemo(() => {
    const priority = ["orchestration", "standard", "rag"]
    return [...agents].sort((a, b) => {
      const groupDelta = priority.indexOf(a.category) - priority.indexOf(b.category)
      return groupDelta || a.name.localeCompare(b.name)
    })
  }, [agents])

  async function handleRun() {
    if (!question.trim() || loading) return
    setLoading(true)
    setSteps([])
    setResult(null)
    setRunId(null)
    setStatus("queued")
    setError(null)

    try {
      const run = await api.post<{ run_id: string; agent_type: string; status: string }>("/api/agents/run", {
        question,
        top_k: 5,
        agent_type: selectedAgent,
        resource_url: resourceUrl.trim() || undefined,
      })
      setRunId(run.run_id)
      setSelectedAgent(run.agent_type || selectedAgent)

      const poll = window.setInterval(async () => {
        try {
          const next = await api.get<{ status: string }>(`/api/agents/runs/${run.run_id}/status`)
          setStatus(next.status)
          if (next.status === "complete" || next.status === "failed") {
            window.clearInterval(poll)
            if (next.status === "complete") {
              const payload = await api.get<AgentResult>(`/api/agents/runs/${run.run_id}/result`)
              setResult(payload)
              setSteps((payload.steps ?? []).map(formatStep))
              void refreshRuns()
            } else {
              setError("Agent run failed. Check backend logs for details.")
              void refreshRuns()
            }
            setLoading(false)
          }
        } catch (err) {
          window.clearInterval(poll)
          setStatus("failed")
          setError(err instanceof ApiError ? err.detail : "Could not read agent status.")
          setLoading(false)
        }
      }, 1200)
    } catch (err) {
      setStatus("failed")
      setError(err instanceof ApiError ? err.detail : "Could not start the agent run.")
      setLoading(false)
    }
  }

  const SelectedIcon = iconByAgent[selected?.id ?? "auto"] ?? Bot

  return (
    <div className="dashboard-shell min-h-full text-[#18181B] dark:text-[#F8F9FA]">
      <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#C5A059]">
            Integrated Agent Hub
          </p>
          <h1 className="font-display text-3xl tracking-tight text-[#18181B] dark:text-[#F8F9FA]">
            Multi-Agent Intelligence Runner
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4B5563] dark:text-[#D1D5DB]">
            The Streamlit/Agno project is now mapped into this dashboard with standard agents,
            document RAG, and memory-aware RAG options.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#7CB69E]/30 bg-[#EDF5F1] dark:bg-[#7CB69E]/10 px-4 py-2 text-xs font-semibold text-[#467963] dark:text-[#A7E2C9]">
          <BrainCircuit className="h-3.5 w-3.5" />
          {agents.length} capabilities loaded
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {groupedAgents.map((agent) => {
            const Icon = iconByAgent[agent.id] ?? Bot
            const active = agent.id === selectedAgent
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgent(agent.id)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-all",
                  active
                    ? "border-[#C5A059]/30 bg-[#FFF0EB] dark:bg-[#C5A059]/12 shadow-[0_18px_42px_rgba(255,107,53,0.12)]"
                    : "border-[rgba(0,0,0,0.06)] dark:border-[#F8F9FA]/8 bg-white dark:bg-[#111827] shadow-sm hover:-translate-y-0.5 hover:border-[#DADADA] dark:hover:border-[#F8F9FA]/16",
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      active
                        ? "border-[#C5A059]/25 bg-white dark:bg-[#1B2431] text-[#C5A059]"
                        : "border-[rgba(0,0,0,0.06)] dark:border-[#F8F9FA]/8 bg-[#F8F9FA] dark:bg-white/6 text-[#4B5563] dark:text-[#D1D5DB]",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className={cn("text-sm font-semibold", active ? "text-[#2A2518] dark:text-[#2A2518]" : "text-[#18181B] dark:text-[#F8F9FA]")}>{agent.name}</p>
                    <p className={cn("text-[11px] font-bold uppercase tracking-wider", active ? "text-[#6B5A3E] dark:text-[#6B5A3E]" : "text-[#9CA3AF] dark:text-[#AEB6C3]")}>
                      {agent.category}
                    </p>
                  </div>
                </div>
                <p className={cn("text-xs leading-5", active ? "text-[#6B5A3E] dark:text-[#6B5A3E]" : "text-[#666666] dark:text-[#D1D5DB]")}>{agent.description}</p>
              </button>
            )
          })}
        </aside>

        <main className="space-y-6">
          <section className="dashboard-panel relative p-6">
            <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-bl-full bg-gradient-to-bl from-[#C5A059]/7 to-transparent" />
            <div className="relative z-10 mb-5 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C5A059]/20 bg-[#FFF0EB] dark:bg-[#C5A059]/10 text-[#C5A059]">
                <SelectedIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#18181B] dark:text-[#F8F9FA]">{selected?.name}</p>
                <p className="mt-1 text-sm text-[#666666] dark:text-[#D1D5DB]">
                  Source mapping: {selected?.upstream_tool}
                </p>
              </div>
            </div>

            <div className="relative z-10 grid gap-4">
              {selected?.resource_hint && (
                <input
                  value={resourceUrl}
                  onChange={(event) => setResourceUrl(event.target.value)}
                  placeholder={selected.resource_hint}
                  className="w-full rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-[#F8F9FA]/10 bg-[#F8F9FA] dark:bg-[#0F172A] px-4 py-3 text-sm text-[#18181B] dark:text-[#F8F9FA] outline-none transition-all placeholder:text-[#9CA3AF] dark:placeholder:text-[#B8C1CF] focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                />
              )}
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={6}
                placeholder="Ask the selected agent to analyze, calculate, research, summarize, or reason..."
                className="min-h-[180px] w-full resize-none rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-[#F8F9FA]/10 bg-[#F8F9FA] dark:bg-[#0F172A] p-4 text-sm text-[#18181B] dark:text-[#F8F9FA] outline-none transition-all placeholder:text-[#9CA3AF] dark:placeholder:text-[#B8C1CF] focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
              />
            </div>

            {error && (
              <div className="relative z-10 mt-4 rounded-2xl border border-[#FFD7C7] dark:border-[#7A2D16] bg-[#FFF0EB] dark:bg-[#3B1812] px-4 py-3 text-sm font-medium text-[#A07D3A] dark:text-[#FFB4A0]">
                {error}
              </div>
            )}

            <div className="relative z-10 mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-medium text-[#9CA3AF] dark:text-[#D1D5DB]">
                {runId ? `Run ${runId.slice(0, 8)} - ${status}` : "Ready"}
              </div>
              <button
                onClick={handleRun}
                disabled={loading || !question.trim()}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all shadow-sm",
                  loading || !question.trim()
                    ? "cursor-not-allowed bg-[#E5E5E5] text-[#9CA3AF]"
                    : "bg-gradient-to-r from-[#C5A059] to-[#FF8C35] text-white hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(255,107,53,0.3)]",
                )}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                {loading ? `Running (${status})` : "Run Agent"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </section>

          {steps.length > 0 && (
            <section className="dashboard-panel p-6">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#AEB6C3]">
                Agent Trace
              </p>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={`${step}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-[#E8E8E8] dark:border-[#F8F9FA]/8 bg-[#F8F9FA] dark:bg-white/6 p-3 text-sm text-[#4B5563] dark:text-[#D1D5DB]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-[#0B1220] text-xs font-bold text-[#C5A059]">
                      {index + 1}
                    </span>
                    <span className="font-mono text-xs font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {result && (
            <section className="dashboard-panel relative p-6">
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-bl from-[#7CB69E]/10 to-transparent" />
              <div className="relative z-10 mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#AEB6C3]">
                    Answer
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">
                    {result.agent_name ?? selected?.name}
                  </p>
                </div>
                {result.confidence_score != null && (
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#7CB69E]/30 bg-[#EDF5F1] dark:bg-[#7CB69E]/10 px-4 py-1.5 text-xs font-semibold text-[#467963] dark:text-[#A7E2C9]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Confidence {Math.round(result.confidence_score * 100)}%
                  </div>
                )}
              </div>

              <div className="relative z-10 whitespace-pre-wrap rounded-2xl border border-[rgba(0,0,0,0.04)] dark:border-[#F8F9FA]/8 bg-[#F8F9FA] dark:bg-[#0F172A] p-5 text-[15px] leading-relaxed text-[#18181B] dark:text-[#F8F9FA]">
                {result.answer}
              </div>
            </section>
          )}

          {recentRuns.length > 0 && (
            <section className="dashboard-panel p-6">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#AEB6C3]">
                Recent Runs
              </p>
              <div className="space-y-2">
                {recentRuns.slice(0, 8).map((run) => (
                  <div
                    key={run.id}
                    className="flex flex-col gap-1 rounded-xl border border-[#E8E8E8] dark:border-[#F8F9FA]/8 bg-[#F8F9FA] dark:bg-white/6 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold capitalize text-[#18181B] dark:text-[#F8F9FA]">{run.agent_type}</p>
                      <p className="font-mono text-[11px] text-[#9CA3AF] dark:text-[#AEB6C3]">{run.id}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-white dark:bg-[#0B1220] px-3 py-1 capitalize text-[#4B5563] dark:text-[#D1D5DB]">
                        {run.status}
                      </span>
                      {run.confidence != null && (
                        <span className="rounded-full bg-[#EDF5F1] dark:bg-[#7CB69E]/10 px-3 py-1 text-[#467963] dark:text-[#A7E2C9]">
                          {Math.round(run.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
      </div>
    </div>
  )
}
