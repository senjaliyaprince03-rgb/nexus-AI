"use client"

import { useState } from "react"
import { BookOpen, Loader2, Play, ChevronDown, ChevronUp } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

type ResearchTask = {
  task_id: string
  description: string
  dependencies: string[]
  status: string
}

type DeepResearchResult = {
  plan: { plan_id: string; tasks: ResearchTask[]; total_tasks: number }
  research: { content: string; metadata: Record<string, unknown> }
  document: { doc_id: string; version: number; content: string }
}

export default function DeepResearch({ workspaceId }: { workspaceId?: string }) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<DeepResearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planOpen, setPlanOpen] = useState(false)
  const dokLevel = result?.research.metadata.dok_level
  const dokDescription = result?.research.metadata.dok_description

  async function handleRun() {
    if (!query.trim() || loading) return
    if (!workspaceId) {
      setError("Select or create a workspace before running Deep Research.")
      return
    }
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const params = new URLSearchParams({
        query,
        workspace_id: workspaceId,
      })
      const data = await api.post<DeepResearchResult>(
        `/api/modules/research/deep?${params.toString()}`
      )
      setResult(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="h-5 w-5 text-[#C5A059]" />
          <p className="text-sm font-semibold text-[#18181B]">Deep Research</p>
          <span className="rounded-full border border-[#7CB69E]/30 bg-[#EDF5F1] px-2 py-0.5 text-[11px] font-semibold text-[#467963]">
            DOK Taxonomy
          </span>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={4}
          placeholder="Enter a complex research question — the system will plan, research, and consolidate findings…"
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
            {loading ? "Researching…" : "Start Research"}
          </button>
        </div>
      </div>

      {result && (
        <>
          {/* Research Plan */}
          <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setPlanOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-[#18181B] hover:bg-[#F8F9FA]"
            >
              <span>Research Plan — {result.plan.total_tasks} tasks</span>
              {planOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {planOpen && (
              <div className="border-t border-[rgba(0,0,0,0.06)] px-5 pb-5 pt-4 space-y-2">
                {result.plan.tasks.map((task, i) => (
                  <div
                    key={task.task_id}
                    className="flex items-start gap-3 rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] p-3 text-sm"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#C5A059]">
                      {i + 1}
                    </span>
                    <span className="text-[#4B5563]">{task.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Research Content */}
          <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                Research Report
              </p>
              {dokLevel != null && (
                <span className="rounded-full border border-[#7CB69E]/30 bg-[#EDF5F1] px-3 py-0.5 text-[11px] font-semibold text-[#467963]">
                  DOK Level {String(dokLevel)} - {String(dokDescription ?? "DOK taxonomy")}
                </span>
              )}
            </div>
            <pre className="whitespace-pre-wrap rounded-xl bg-[#F8F9FA] p-4 text-sm leading-relaxed text-[#18181B]">
              {result.research.content}
            </pre>
          </div>

          {/* Living Document */}
          <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                Living Document
              </p>
              <span className="rounded-full border border-[rgba(0,0,0,0.08)] bg-[#F8F9FA] px-2 py-0.5 text-[11px] text-[#666]">
                v{result.document.version} · {result.document.doc_id}
              </span>
            </div>
            <pre className="whitespace-pre-wrap rounded-xl bg-[#F8F9FA] p-4 text-sm leading-relaxed text-[#18181B]">
              {result.document.content}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}

