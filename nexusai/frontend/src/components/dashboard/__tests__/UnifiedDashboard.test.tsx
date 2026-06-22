import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { UnifiedDashboard, type DashboardOverview } from "@/components/dashboard/UnifiedDashboard"

const overview: DashboardOverview = {
  workspace: { id: "w1", name: "Test Workspace", plan: "free" },
  generated_at: new Date().toISOString(),
  health: {
    project_count: 6,
    capability_count: 32,
    service_count: 8,
    online_services: 1,
    offline_services: 2,
    unknown_services: 5,
  },
  metrics: [
    { id: "documents", label: "Documents indexed", value: 3, detail: "3 total uploaded", href: "/dashboard/documents", tone: "blue" },
    { id: "queries", label: "Queries today", value: 2, detail: "0 support questions today", href: "/chat", tone: "coral" },
    { id: "confidence", label: "Avg. confidence", value: 91, suffix: "%", detail: "From assistant and agent runs", href: "/dashboard/analytics", tone: "sage" },
    { id: "systems", label: "Integrated systems", value: 6, detail: "32 capabilities mapped", href: "/dashboard/modules", tone: "violet" },
  ],
  workflow: [
    { id: "upload", label: "Upload documents", description: "Build the workspace knowledge base.", href: "/dashboard/documents", state: "ready" },
    { id: "chat", label: "Ask chat", description: "Get cited answers from your files.", href: "/chat", state: "ready" },
  ],
  projects: [
    {
      id: "personal-nexusai-core",
      name: "Personal NexusAi Core",
      status: "core",
      category: "Personal full-stack workspace",
      summary: "The main workspace.",
      capabilities: ["document ingestion", "RAG backend"],
      capability_count: 2,
      health: "online",
      services: [],
      native_href: "/dashboard/workspace",
      primary_action: "Open workspace",
    },
    {
      id: "nexus-agents",
      name: "Nexus Agents Deep Research",
      status: "integrated",
      category: "Deep research and MCP platform",
      summary: "Research agents.",
      capabilities: ["deep research"],
      capability_count: 1,
      health: "offline",
      services: [
        { id: "api", name: "API", type: "api", port: 12000, health: "offline", launch_url: "http://localhost:12000", embeddable: false },
        { id: "ui", name: "UI", type: "ui", port: 12001, health: "offline", launch_url: "http://localhost:12001", embeddable: false },
      ],
      native_href: "/dashboard/modules",
      primary_action: "Open deep research",
    },
  ],
  capability_catalog: [
    {
      id: "c1",
      label: "document ingestion",
      project_id: "personal-nexusai-core",
      project_name: "Personal NexusAi Core",
      category: "Personal full-stack workspace",
      href: "/dashboard/workspace",
      status: "online",
      primary_action: "Open workspace",
    },
    {
      id: "c2",
      label: "deep research",
      project_id: "nexus-agents",
      project_name: "Nexus Agents Deep Research",
      category: "Deep research and MCP platform",
      href: "/dashboard/modules",
      status: "offline",
      primary_action: "Open deep research",
    },
  ],
  outputs: [
    { id: "citations", label: "Cited answers", value: "A grounded answer.", href: "/chat", status: "live" },
    { id: "research", label: "Research reports", value: "Run one deep research query and the report summary will appear here.", href: "/dashboard/modules", status: "waiting" },
  ],
  recent_activity: [],
  next_actions: [
    { title: "Upload fresh documents", description: "Improve coverage.", href: "/dashboard/documents" },
  ],
}

describe("UnifiedDashboard", () => {
  it("renders the command center and integrated project cards", () => {
    render(<UnifiedDashboard overview={overview} apiState={{ status: "live" }} />)

    expect(screen.getByText("Unified Command Center")).toBeTruthy()
    expect(screen.getAllByText("Personal NexusAi Core").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Nexus Agents Deep Research").length).toBeGreaterThan(0)
    expect(screen.getByText("Mapped modules")).toBeTruthy()
  })

  it("filters systems and capability catalog by search text", () => {
    render(<UnifiedDashboard overview={overview} apiState={{ status: "live" }} />)

    fireEvent.change(screen.getByPlaceholderText("Search systems or modules"), {
      target: { value: "deep research" },
    })

    expect(screen.queryAllByText("Personal NexusAi Core")).toHaveLength(0)
    expect(screen.getAllByText("Nexus Agents Deep Research").length).toBeGreaterThan(0)
    expect(screen.getAllByText("deep research").length).toBeGreaterThan(0)
  })

  it("shows inline API state instead of a toast-only failure", () => {
    render(<UnifiedDashboard overview={overview} apiState={{ status: "offline", message: "Backend is offline." }} />)

    expect(screen.getByText("Backend is offline.")).toBeTruthy()
    expect(screen.getAllByText("Not running").length).toBeGreaterThan(0)
  })

  it("keeps offline imported apps usable through native dashboard modules", () => {
    render(<UnifiedDashboard overview={overview} apiState={{ status: "live" }} />)

    expect(screen.getByText(/All imported capabilities are available/i)).toBeTruthy()
    expect(screen.getAllByText("Launch Workspace").length).toBeGreaterThan(0)
    expect(screen.queryByText(/unknown/i)).toBeNull()
    expect(screen.queryByText(/Not checked/i)).toBeNull()
    expect(screen.queryByText("Open local app")).toBeNull()
  })

  it("normalizes project state labels into friendly copy", () => {
    render(<UnifiedDashboard overview={overview} apiState={{ status: "live" }} />)

    expect(screen.queryByText("UNKNOWN")).toBeNull()
    expect(screen.getAllByText("Running").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Not running").length).toBeGreaterThan(0)
    expect(screen.getByText("Waiting")).toBeTruthy()
  })

  it("shows capability catalog launch actions for every mapped module", () => {
    render(<UnifiedDashboard overview={overview} apiState={{ status: "live" }} />)

    expect(screen.getAllByText("Open workspace").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Open deep research").length).toBeGreaterThan(0)
  })

  it("uses the custom select treatment for the system filter", () => {
    render(<UnifiedDashboard overview={overview} apiState={{ status: "live" }} />)

    const categoryFilter = screen.getByDisplayValue("All systems")
    expect(categoryFilter.className).toContain("dashboard-select")
    expect(categoryFilter.className).toContain("pr-12")
    expect(categoryFilter.className).toContain("pl-10")
  })
})
