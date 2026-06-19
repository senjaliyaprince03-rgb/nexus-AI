"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
  Layers,
  LayoutPanelTop,
  Search,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import IntelligenceHub from "@/modules/IntelligenceHub"
import DeepResearch from "@/modules/DeepResearch"
import { useAuthStore } from "@/store/authStore"
import type { IntegrationProject } from "@/components/dashboard/UnifiedDashboard"

export const dynamic = "force-dynamic"

type ModuleTab = IntegrationProject["id"]

type IntegrationProjectsResponse = {
  projects: IntegrationProject[]
}

const PROJECT_ICONS: Record<string, LucideIcon> = {
  "personal-nexusai-core": Database,
  "multi-agent-hub": BrainCircuit,
  "nexus-agents": BookOpen,
  "svenhven-nexus-ai": BarChart3,
  "nexus-gcp": Bot,
  "primisai-nexus": Layers,
}

const FALLBACK_PROJECTS: IntegrationProject[] = [
  {
    id: "personal-nexusai-core",
    name: "Personal NexusAi Core",
    status: "core",
    category: "Personal full-stack workspace",
    summary: "The main FastAPI, Next.js, Celery, Redis, MongoDB, and MinIO workspace already used by this project.",
    capabilities: ["authentication and verification flow", "document ingestion", "multi-agent execution", "RAG-ready backend", "premium dashboard UI"],
    capability_count: 5,
    health: "online",
    services: [],
    native_href: "/dashboard/workspace",
    primary_action: "Open workspace",
    note: "The primary workspace running locally. Opens directly inside the dashboard.",
  },
  {
    id: "multi-agent-hub",
    name: "NexusAI Multi-Agent Intelligence Hub",
    status: "integrated",
    category: "Streamlit multi-agent app",
    summary: "Specialized agents for web, finance, academic research, math, Wikipedia, news, YouTube, and RAG workflows.",
    capabilities: ["web search agent", "finance agent", "academic research agent", "math agent", "Wikipedia agent", "news and YouTube summarization", "AstraDB-backed RAG"],
    capability_count: 7,
    health: "online",
    services: [],
    native_href: "/dashboard/modules",
    primary_action: "Open intelligence hub",
    note: "Integrated into NexusAI. This feature opens in the dashboard and does not require a separate local app.",
  },
  {
    id: "nexus-agents",
    name: "Nexus Agents Deep Research",
    status: "integrated",
    category: "Deep research and MCP platform",
    summary: "Hierarchical research agents with MCP search providers, PostgreSQL persistence, DOK taxonomy, projects, and CSV exports.",
    capabilities: ["deep research tasks", "data aggregation tasks", "DOK taxonomy", "project knowledge base", "MCP provider orchestration", "CSV exports"],
    capability_count: 6,
    health: "online",
    services: [],
    native_href: "/dashboard/modules",
    primary_action: "Open deep research",
    note: "Integrated into NexusAI. Deep research agents run directly within the dashboard surface.",
  },
  {
    id: "svenhven-nexus-ai",
    name: "Nexus AI Sentiment Platform",
    status: "integrated",
    category: "Next.js and FastAPI AI app",
    summary: "A lightweight sentiment analysis platform mapped into analytics and output review workflows.",
    capabilities: ["sentiment analysis", "FastAPI backend", "Next.js frontend", "SQLite query history foundation"],
    capability_count: 4,
    health: "online",
    services: [],
    native_href: "/dashboard/analytics",
    primary_action: "Review sentiment signals",
    note: "Integrated into NexusAI. Access sentiment analysis analytics directly from your dashboard.",
  },
  {
    id: "nexus-gcp",
    name: "NEXUS GCP Agent System",
    status: "integrated",
    category: "GCP Cloud Run multi-agent system",
    summary: "Gemini-routed task, calendar, memory, and orchestrator agents designed for Firestore and Cloud Run.",
    capabilities: ["Gemini intent routing", "calendar agent", "task agent", "memory agent", "Firestore persistence", "Cloud Run deployment pattern"],
    capability_count: 6,
    health: "online",
    services: [],
    native_href: "/dashboard/agents",
    primary_action: "Open task agents",
    note: "Integrated into NexusAI. GCP Cloud Run agents seamlessly mapped to your local dashboard.",
  },
  {
    id: "primisai-nexus",
    name: "PrimisAI Nexus Framework",
    status: "integrated",
    category: "Python agent framework package",
    summary: "Reusable Python framework for supervisors, YAML agent hierarchies, MCP tools, structured outputs, and logs.",
    capabilities: ["agent and supervisor classes", "hierarchical supervision", "YAML agent configuration", "MCP server integration", "structured agent outputs", "workflow history and logs"],
    capability_count: 6,
    health: "framework",
    services: [],
    native_href: "/dashboard/agents",
    primary_action: "Inspect framework agents",
    note: "Python agent framework package. Inspect framework agents from inside the dashboard.",
  },
]

const PROJECT_NOTES: Record<string, string> = {
  "personal-nexusai-core": "The primary workspace running locally. Opens directly inside the dashboard.",
  "multi-agent-hub": "Integrated into NexusAI. This feature opens in the dashboard and does not require a separate local app.",
  "nexus-agents": "Integrated into NexusAI. Deep research agents run directly within the dashboard surface.",
  "svenhven-nexus-ai": "Integrated into NexusAI. Access sentiment analysis analytics directly from your dashboard.",
  "nexus-gcp": "Integrated into NexusAI. GCP Cloud Run agents seamlessly mapped to your local dashboard.",
  "primisai-nexus": "Python agent framework package. Inspect framework agents from inside the dashboard.",
}

const MODULE_ROUTE_COPY: Record<ModuleTab, { title: string; description: string; href: string; accent: string }> = {
  "personal-nexusai-core": {
    title: "Core workspace surface",
    description: "Open the main workspace, documents, support, and RAG operations directly inside NexusAI.",
    href: "/dashboard/workspace",
    accent: "Workspace surfaces, docs, support, and production data stay inside the core app.",
  },
  "multi-agent-hub": {
    title: "Embedded intelligence hub",
    description: "Run web search, finance, academic, math, Wikipedia, news, YouTube, and RAG tasks from the NexusAI module surface.",
    href: "/dashboard/modules",
    accent: "This imported app is represented inside NexusAI instead of sending users to a separate local window.",
  },
  "nexus-agents": {
    title: "Embedded deep research",
    description: "Use the integrated MCP-driven research workflow from the NexusAI module surface.",
    href: "/dashboard/modules",
    accent: "Deep research stays accessible from this dashboard surface.",
  },
  "svenhven-nexus-ai": {
    title: "Analytics-connected sentiment review",
    description: "Review sentiment analysis capability from the analytics workspace and connected support outputs.",
    href: "/dashboard/analytics",
    accent: "This module is mapped into the main analytics route inside NexusAI.",
  },
  "nexus-gcp": {
    title: "Agent orchestration route",
    description: "Open the GCP-backed task, calendar, memory, and orchestration capabilities from the agents workspace.",
    href: "/dashboard/agents",
    accent: "The imported orchestration system is available through NexusAI agent surfaces.",
  },
  "primisai-nexus": {
    title: "Framework inspection route",
    description: "Inspect the reusable framework concepts and launch the related agent workspace without leaving NexusAI.",
    href: "/dashboard/agents",
    accent: "This is a framework surface, so it is documented and routed inside the dashboard rather than launched as a separate app.",
  },
}

export default function ModulesPage() {
  const workspace = useAuthStore((s) => s.workspace)
  const [projects, setProjects] = useState<IntegrationProject[]>(FALLBACK_PROJECTS)
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<ModuleTab>("multi-agent-hub")

  useEffect(() => {
    let alive = true
    api.get<IntegrationProjectsResponse>("/api/integrations/projects")
      .then((data) => {
        if (!alive) return
        setProjects(data.projects)
        if (data.projects.some((project) => project.id === activeTab)) return
        const firstIntegrated = data.projects.find((project) => project.status !== "core")
        if (firstIntegrated) setActiveTab(firstIntegrated.id)
      })
      .catch(() => {
        if (alive) setProjects(FALLBACK_PROJECTS)
      })
    return () => {
      alive = false
    }
  }, [activeTab])

  const filteredProjects = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return projects
    return projects.filter((project) =>
      [project.name, project.category, project.summary, ...project.capabilities].join(" ").toLowerCase().includes(value),
    )
  }, [projects, query])

  const activeProject = projects.find((project) => project.id === activeTab) ?? projects[0] ?? FALLBACK_PROJECTS[0]

  return (
    <div className="dashboard-shell min-h-full text-[#18181B] dark:text-[#F8F9FA]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-black/5 dark:border-[#F8F9FA]/8 bg-[linear-gradient(180deg,#fff8f3_0%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-5 shadow-[0_22px_80px_rgba(10,10,10,0.06)] sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">Integrated modules</p>
                <h1 className="mt-1 font-display text-3xl tracking-tight text-[#18181B] dark:text-[#F8F9FA] sm:text-4xl">
                  Every imported module inside NexusAI
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5A5A5A] dark:text-[#D1D5DB]">
                  The dashboard now keeps imported projects inside NexusAI surfaces. Use this hub to browse every mapped module, open the correct internal route, and run the embedded tools that already live here.
                </p>
              </div>
              <label className="relative min-w-0 lg:w-[340px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] dark:text-[#AEB6C3]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search imported modules"
                  className="h-11 w-full rounded-2xl border border-black/10 dark:border-[#F8F9FA]/10 bg-white dark:bg-[#0B1220] pl-10 pr-3 text-sm text-[#18181B] dark:text-[#F8F9FA] outline-none transition placeholder:text-[#9CA3AF] dark:placeholder:text-[#B8C1CF] focus:border-[#C5A059]/40"
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 auto-rows-fr">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setActiveTab(project.id)}
                    className={cn(
                      "dashboard-card p-5 text-left transition flex flex-col h-full",
                      activeTab === project.id
                        ? "ring-1 ring-[#C5A059] dark:bg-[#1A1A1A] shadow-[0_18px_42px_rgba(255,107,53,0.10)]"
                        : "hover:border-[#C5A059]/25 hover:bg-white dark:hover:bg-[#1A1A1A]",
                    )}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-[#C5A059]/20 bg-[#C5A059]/10 text-[#C5A059]">
                          {(() => {
                            const Icon = PROJECT_ICONS[project.id] ?? LayoutPanelTop
                            return <Icon className="h-5 w-5" />
                          })()}
                        </span>
                        <div>
                          <p className="text-base font-semibold leading-6 text-[#18181B] dark:text-[#F8F9FA]">{project.name}</p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF] dark:text-[#C0C7D4]">{project.category}</p>
                        </div>
                      </div>
                      <StatusChip status={project.health} />
                    </div>

                    <p className="min-h-[72px] text-sm leading-6 text-[#4B5563] dark:text-[#D1D5DB]">{project.summary}</p>

                    {(project.note || PROJECT_NOTES[project.id])?.trim() ? (
                      <div className="mt-4 rounded-xl bg-black/[0.02] dark:bg-[#1A1A1A] p-4 text-xs leading-5 text-[#6A6A6A] dark:text-[#D1D5DB]">
                        {project.note || PROJECT_NOTES[project.id]}
                      </div>
                    ) : null}

                    <div className="mt-4 mb-4 flex flex-wrap gap-2">
                      {project.capabilities.slice(0, 10).map((capability) => (
                        <span key={capability} className="dashboard-chip inline-flex items-center rounded-full border border-black/10 dark:border-white/10 px-2.5 py-1 text-[11px] font-medium text-[#4B5563] dark:text-[#F8F9FA]">
                          {capability}
                        </span>
                      ))}
                      {project.capability_count > 10 && (
                        <span className="dashboard-chip inline-flex items-center rounded-full border border-black/10 dark:border-white/10 px-2.5 py-1 text-[11px] font-bold text-[#4B5563] dark:text-[#F8F9FA]">
                          +{project.capability_count - 10} more
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-2">
                      <Link 
                        href={project.native_href} 
                        onClick={(event) => event.stopPropagation()} 
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962D] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(212,175,55,0.35)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      >
                        {project.primary_action || "Launch"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </button>
                ))}
              </section>

              <section className="rounded-[30px] border border-black/5 dark:border-[#F8F9FA]/8 bg-white dark:bg-[#111827] p-5 shadow-[0_18px_54px_rgba(10,10,10,0.05)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C5A059]">Open in NexusAI</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#18181B] dark:text-[#F8F9FA]">{activeProject.name}</h2>
                  </div>
                  <StatusChip status={activeProject.health} />
                </div>
                <p className="mt-3 text-sm leading-7 text-[#5A5A5A] dark:text-[#D1D5DB]">{MODULE_ROUTE_COPY[activeProject.id]?.description ?? activeProject.summary}</p>
                <div className="mt-4 rounded-[22px] border border-[#7CB69E]/18 bg-[#F3FAF6] dark:bg-[#0F2C24] px-4 py-3 text-sm leading-6 text-[#2B6B4B] dark:text-[#A7E2C9]">
                  {MODULE_ROUTE_COPY[activeProject.id]?.accent ?? "This module is available through the NexusAI dashboard surface."}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {activeProject.capabilities.map((capability) => (
                    <span key={capability} className="dashboard-chip inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-medium text-[#4B5563] dark:text-[#D1D5DB]">
                      {capability}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex">
                  <Link
                    href={activeProject.native_href}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#FF4500] px-4 py-3.5 text-sm font-bold text-[#18181B] shadow-[0_0_24px_rgba(255,107,53,0.3)] transition hover:shadow-[0_0_32px_rgba(255,107,53,0.5)] hover:-translate-y-0.5"
                  >
                    {activeProject.primary_action}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>

                <EmbeddedSurface activeProject={activeProject} workspaceId={workspace?.id} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmbeddedSurface({
  activeProject,
  workspaceId,
}: {
  activeProject: IntegrationProject
  workspaceId?: string
}) {
  if (activeProject.id === "multi-agent-hub") {
    return (
      <div className="mt-6 rounded-[26px] border border-black/5 dark:border-[#F8F9FA]/8 bg-[#FCFCFB] dark:bg-[#0B1220] p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">
          <BrainCircuit className="h-4 w-4 text-[#C5A059]" />
          Embedded intelligence hub
        </div>
        <IntelligenceHub workspaceId={workspaceId} />
      </div>
    )
  }

  if (activeProject.id === "nexus-agents") {
    return (
      <div className="mt-6 rounded-[26px] border border-black/5 dark:border-[#F8F9FA]/8 bg-[#FCFCFB] dark:bg-[#0B1220] p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">
          <BookOpen className="h-4 w-4 text-[#C5A059]" />
          Embedded deep research
        </div>
        <DeepResearch workspaceId={workspaceId} />
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-[26px] border border-dashed border-black/10 dark:border-[#F8F9FA]/10 bg-[#FCFCFB] dark:bg-[#0B1220] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.08)] dark:bg-[#C5A059]/10 text-[#C5A059]">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{MODULE_ROUTE_COPY[activeProject.id]?.title ?? "Dashboard-connected module"}</p>
          <p className="mt-2 text-sm leading-6 text-[#5A5A5A] dark:text-[#D1D5DB]">
            This project is represented through an existing NexusAI dashboard route instead of a separate embedded app view on this page.
          </p>
          <Link href={MODULE_ROUTE_COPY[activeProject.id]?.href ?? activeProject.native_href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#C5A059]">
            Open module surface
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]", statusChipClasses(status))}>
      <span className={cn("h-1.5 w-1.5 rounded-full", healthDot(status))} />
      {statusLabel(status)}
    </span>
  )
}

function statusChipClasses(status: string) {
  if (status === "online" || status === "live" || status === "mapped" || status === "ready" || status === "complete") {
    return "bg-[#EDF5F1] text-[#276749]"
  }
  if (status === "core" || status === "framework") return "bg-[#EEF2FF] text-[#3730A3]"
  if (status === "offline" || status === "failed" || status === "unknown" || status === "checking" || status === "waiting") {
    return "bg-[rgba(212,175,55,0.08)] text-[#8A7035]"
  }
  if (status === "degraded") return "bg-[#FEF3C7] text-[#7A6530]"
  return "bg-[#F1F1F1] text-[#6A6A6A]"
}

function healthDot(status: string) {
  if (status === "online" || status === "live" || status === "mapped" || status === "ready" || status === "complete") return "bg-[#7CB69E]"
  if (status === "offline" || status === "failed" || status === "unknown" || status === "checking" || status === "waiting") return "bg-[#C5A059]"
  if (status === "degraded") return "bg-[#D4AF37]"
  if (status === "core" || status === "framework") return "bg-[#7C3AED]"
  return "bg-[#9CA3AF]"
}

function statusLabel(status: string) {
  if (status === "online") return "Running"
  if (status === "live") return "Running"
  if (status === "ready") return "Ready"
  if (status === "mapped") return "Ready"
  if (status === "complete") return "Ready"
  if (status === "offline") return "Not running"
  if (status === "degraded") return "Degraded"
  if (status === "core") return "Core"
  if (status === "framework") return "Framework"
  if (status === "failed") return "Not running"
  if (status === "waiting") return "Not running"
  if (status === "unknown") return "Not running"
  if (status === "checking") return "Not running"
  return "Not running"
}

