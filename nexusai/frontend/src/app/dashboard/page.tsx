import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { UnifiedDashboard, type DashboardOverview } from "@/components/dashboard/UnifiedDashboard"

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000"

export const dynamic = "force-dynamic"

async function getDashboardData(): Promise<{
  overview: DashboardOverview
  apiState: { status: "live" | "offline" | "partial"; message?: string }
}> {
  const cookieStore = cookies()
  const hasAuthCookie = Boolean(cookieStore.get("nexusai_access") || cookieStore.get("nexusai_refresh"))
  if (!hasAuthCookie) redirect("/login")

  const cookieHeader = cookieStore.toString()
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/dashboard/overview?check_health=true`, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    })
  } catch {
    return {
      overview: fallbackOverview,
      apiState: {
        status: "offline",
        message: "Live data unavailable. Showing the integrated project map.",
      },
    }
  }

  if (response.status === 401 || response.status === 403) redirect("/login")

  if (!response.ok) {
    return {
      overview: fallbackOverview,
      apiState: {
        status: "partial",
        message: "Live data unavailable. Showing the integrated project map.",
      },
    }
  }

  return { overview: (await response.json()) as DashboardOverview, apiState: { status: "live" } }
}

export default async function DashboardPage() {
  const { overview, apiState } = await getDashboardData()
  return <UnifiedDashboard overview={overview} apiState={apiState} />
}

const fallbackProjects = [
  {
    id: "personal-nexusai-core",
    name: "Personal NexusAi Core",
    status: "core",
    category: "Personal full-stack workspace",
    summary: "The main FastAPI, Next.js, Mongo, Redis, MinIO, RAG, agents, auth, and premium dashboard workspace.",
    capabilities: ["authentication", "document ingestion", "RAG backend", "multi-agent execution", "premium dashboard"],
    capability_count: 5,
    health: "unknown",
    services: [],
    native_href: "/dashboard/workspace",
    primary_action: "Open workspace",
  },
  {
    id: "multi-agent-hub",
    name: "NexusAI Multi-Agent Intelligence Hub",
    status: "integrated",
    category: "Streamlit multi-agent app",
    summary: "Specialized agents for web, finance, academic research, math, Wikipedia, news, YouTube, and RAG workflows.",
    capabilities: ["web search", "finance", "academic research", "math", "Wikipedia", "YouTube", "RAG"],
    capability_count: 7,
    health: "unknown",
    services: [],
    native_href: "/dashboard/modules",
    primary_action: "Open intelligence hub",
  },
  {
    id: "nexus-agents",
    name: "Nexus Agents Deep Research",
    status: "integrated",
    category: "Deep research and MCP platform",
    summary: "Hierarchical research agents with MCP search providers, DOK taxonomy, project knowledge bases, and exports.",
    capabilities: ["deep research", "data aggregation", "DOK taxonomy", "MCP orchestration", "CSV exports"],
    capability_count: 5,
    health: "unknown",
    services: [],
    native_href: "/dashboard/modules",
    primary_action: "Open deep research",
  },
  {
    id: "svenhven-nexus-ai",
    name: "Nexus AI Sentiment Platform",
    status: "integrated",
    category: "Next.js and FastAPI AI app",
    summary: "A lightweight sentiment analysis platform mapped into analytics and output review workflows.",
    capabilities: ["sentiment analysis", "FastAPI backend", "Next.js frontend", "query history"],
    capability_count: 4,
    health: "unknown",
    services: [],
    native_href: "/dashboard/analytics",
    primary_action: "Review sentiment signals",
  },
  {
    id: "nexus-gcp",
    name: "NEXUS GCP Agent System",
    status: "integrated",
    category: "GCP Cloud Run multi-agent system",
    summary: "Gemini-routed task, calendar, memory, and orchestrator agents designed for Firestore and Cloud Run.",
    capabilities: ["Gemini routing", "calendar agent", "task agent", "memory agent", "Firestore pattern"],
    capability_count: 5,
    health: "unknown",
    services: [],
    native_href: "/dashboard/agents",
    primary_action: "Open task agents",
  },
  {
    id: "primisai-nexus",
    name: "PrimisAI Nexus Framework",
    status: "integrated",
    category: "Python agent framework package",
    summary: "Reusable Python framework for supervisors, YAML agent hierarchies, MCP tools, structured outputs, and logs.",
    capabilities: ["supervisors", "YAML configuration", "MCP integration", "structured outputs", "workflow logs"],
    capability_count: 5,
    health: "framework",
    services: [],
    native_href: "/dashboard/agents",
    primary_action: "Inspect framework agents",
  },
]

const fallbackOverview: DashboardOverview = {
  workspace: { id: "offline", name: "NexusAI Workspace", plan: "free" },
  generated_at: new Date().toISOString(),
  health: {
    project_count: 6,
    capability_count: fallbackProjects.reduce((total, project) => total + project.capability_count, 0),
    service_count: 0,
    online_services: 0,
    offline_services: 0,
    unknown_services: 0,
  },
  metrics: [
    { id: "documents", label: "Documents indexed", value: "--", detail: "Live count loads from backend", href: "/dashboard/documents", tone: "blue" },
    { id: "queries", label: "Queries today", value: "--", detail: "Live count loads from backend", href: "/chat", tone: "coral" },
    { id: "confidence", label: "Avg. confidence", value: "--", detail: "Live quality loads from backend", href: "/dashboard/analytics", tone: "sage" },
    { id: "systems", label: "Integrated systems", value: 6, detail: `${fallbackProjects.reduce((total, project) => total + project.capability_count, 0)} capabilities mapped`, href: "/dashboard/modules", tone: "violet" },
  ],
  workflow: [
    { id: "upload", label: "Upload documents", description: "Build the workspace knowledge base.", href: "/dashboard/documents", state: "ready" },
    { id: "chat", label: "Ask chat", description: "Get cited answers from your files.", href: "/chat", state: "ready" },
    { id: "agents", label: "Run agents", description: "Route complex questions to specialists.", href: "/dashboard/agents", state: "ready" },
    { id: "research", label: "Deep research", description: "Create structured research reports.", href: "/dashboard/modules", state: "ready" },
    { id: "analytics", label: "Review analytics", description: "Track usage, sources, and quality.", href: "/dashboard/analytics", state: "ready" },
  ],
  projects: fallbackProjects,
  capability_catalog: fallbackProjects.flatMap((project) =>
    project.capabilities.map((capability) => ({
      id: `${project.id}:${capability}`,
      label: capability,
      project_id: project.id,
      project_name: project.name,
      category: project.category,
      href: project.native_href,
      status: project.health,
      primary_action: project.primary_action,
    })),
  ),
  outputs: [
    { id: "citations", label: "Cited answers", value: "Ask chat to generate grounded answers with citations.", href: "/chat", status: "waiting" },
    { id: "research", label: "Research reports", value: "Run a deep research module to produce a structured report.", href: "/dashboard/modules", status: "waiting" },
    { id: "sentiment", label: "Sentiment insight", value: "Open analytics to review imported sentiment capabilities.", href: "/dashboard/analytics", status: "mapped" },
    { id: "support", label: "Support guidance", value: "Use support mode for account, billing, technical, and privacy help.", href: "/dashboard/support", status: "mapped" },
  ],
  recent_activity: [],
  next_actions: [
    { title: "Start the backend", description: "Load live metrics, auth state, and service health.", href: "/dashboard" },
    { title: "Upload documents", description: "Prepare the workspace for cited answers.", href: "/dashboard/documents" },
    { title: "Open module catalog", description: "Browse the six integrated NexusAI systems.", href: "/dashboard/modules" },
  ],
}
