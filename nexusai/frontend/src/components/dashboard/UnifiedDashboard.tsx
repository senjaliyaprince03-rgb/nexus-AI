"use client"

import React, { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { motion, useSpring, useTransform, animate } from "framer-motion"
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Database,
  FileStack,
  Filter,
  Layers,
  MessageSquare,
  Network,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  Zap,
  type LucideIcon,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type DashboardMetric = {
  id: string
  label: string
  value: number | string | null
  suffix?: string
  detail: string
  href: string
  tone: "blue" | "coral" | "sage" | "violet"
}

export type IntegrationService = {
  id: string
  name: string
  type: string
  port?: number | null
  health: string
  launch_url: string
  embeddable: boolean
}

export type IntegrationProject = {
  id: string
  name: string
  status: string
  category: string
  summary: string
  capabilities: string[]
  capability_count: number
  health: string
  services: IntegrationService[]
  launch_url?: string
  native_href: string
  primary_action: string
  note?: string
}

export type CapabilityItem = {
  id: string
  label: string
  project_id: string
  project_name: string
  category: string
  href: string
  status: string
  primary_action: string
}

type CapabilityGroup = {
  project_id: string
  project_name: string
  category: string
  href: string
  status: string
  primary_action: string
  capabilities: CapabilityItem[]
}

export type DashboardOverview = {
  workspace: { id: string; name: string; plan: string }
  generated_at: string
  health: {
    project_count: number
    capability_count: number
    service_count: number
    online_services: number
    offline_services: number
    unknown_services: number
  }
  metrics: DashboardMetric[]
  workflow: Array<{ id: string; label: string; description: string; href: string; state: string }>
  projects: IntegrationProject[]
  capability_catalog: CapabilityItem[]
  outputs: Array<{ id: string; label: string; value: string; href: string; status: string }>
  recent_activity: Array<{ id: string; event_type: string; created_at: string; payload: Record<string, string | number | boolean | null> }>
  next_actions: Array<{ title: string; description: string; href: string }>
}

type ApiState = {
  status: "live" | "offline" | "partial"
  message?: string
}

type UnifiedDashboardProps = {
  overview: DashboardOverview
  apiState: ApiState
}

const METRIC_ICONS: Record<string, LucideIcon> = {
  documents: FileStack,
  queries: Activity,
  confidence: ShieldCheck,
  systems: Network,
}

const PROJECT_ICONS: Record<string, LucideIcon> = {
  "personal-nexusai-core": Database,
  "multi-agent-hub": BrainCircuit,
  "nexus-agents": BookOpen,
  "svenhven-nexus-ai": BarChart3,
  "nexus-gcp": Bot,
  "primisai-nexus": Layers,
}

export function UnifiedDashboard({ overview, apiState }: UnifiedDashboardProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(overview.projects.map((project) => project.category)))],
    [overview.projects],
  )

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase()
    return overview.projects.filter((project) => {
      const matchesCategory = category === "all" || project.category === category
      const haystack = [project.name, project.category, project.summary, ...project.capabilities]
        .join(" ")
        .toLowerCase()
      return matchesCategory && (!q || haystack.includes(q))
    })
  }, [overview.projects, query, category])

  const filteredCapabilities = useMemo(() => {
    const q = query.trim().toLowerCase()
    return overview.capability_catalog
      .filter((capability) => {
        const matchesCategory = category === "all" || capability.category === category
        const haystack = `${capability.label} ${capability.project_name} ${capability.category}`.toLowerCase()
        return matchesCategory && (!q || haystack.includes(q))
      })
  }, [overview.capability_catalog, query, category])

  const groupedCapabilities = useMemo(() => {
    const groups = new Map<string, CapabilityGroup>()
    for (const capability of filteredCapabilities) {
      const existing = groups.get(capability.project_id)
      if (existing) {
        existing.capabilities.push(capability)
        continue
      }
      groups.set(capability.project_id, {
        project_id: capability.project_id,
        project_name: capability.project_name,
        category: capability.category,
        href: capability.href,
        status: capability.status,
        primary_action: capability.primary_action,
        capabilities: [capability],
      })
    }
    return Array.from(groups.values())
  }, [filteredCapabilities])

  const systemHealth = useMemo(() => {
    return overview.projects.reduce(
      (acc, project) => {
        if (project.health === "online") {
          acc.running += 1
        } else if (project.health === "framework") {
          acc.framework += 1
        } else {
          acc.notRunning += 1
        }
        return acc
      },
      { running: 0, notRunning: 0, framework: 0 },
    )
  }, [overview.projects])

  const hasIntegratedModules = overview.projects.some((project) => project.status === "integrated")

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="dashboard-shell min-h-full text-[#18181B] dark:text-[#F8F9FA]">
      <div className="border-b border-black/5 dark:border-transparent bg-[linear-gradient(180deg,#fff4ef_0%,#F8F9FA_100%)] dark:bg-none">
        <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-6">
            <motion.section variants={itemVariants} className="dashboard-hero min-w-0 p-5 sm:p-6 lg:p-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-[#F8F9FA]/10 bg-white/90 dark:bg-[#F8FAFC] px-3 py-1.5 shadow-sm backdrop-blur">
                <span className={cn("h-2 w-2 rounded-full", apiState.status === "live" ? "bg-[#7CB69E]" : "bg-[#D4AF37]")} />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#94a3b8] dark:text-[#51606F]">
                  {apiState.status === "live" ? "Live workspace" : "System check"}
                </span>
              </div>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="font-display text-[2.6rem] leading-none tracking-tight text-[#18181B] dark:text-[#F8F9FA] sm:text-[3.4rem]">
                    Unified Command Center
                  </h1>
                  <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#374151] dark:text-[#D1D5DB]">
                    One dashboard for documents, cited chat, support, analytics, specialist agents, and every integrated NexusAI module.
                  </p>
                </div>
                <div className="grid w-full max-w-lg grid-cols-3 gap-2 lg:max-w-sm">
                  <HealthBadge label="Running" value={systemHealth.running} icon={Activity} color="text-[#7CB69E]" />
                  <HealthBadge label="Not running" value={systemHealth.notRunning} icon={XCircle} color="text-[#D4AF37]" />
                  <HealthBadge label="Framework" value={systemHealth.framework} icon={Layers} color="text-[#8B5CF6]" />
                </div>
              </div>

              {apiState.status !== "live" && (
                <div
                  className={cn(
                    "mt-6 inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm",
                    apiState.status === "offline"
                      ? "border-[#D4AF37]/20 bg-white/85 text-[#6B5A2E]"
                      : "border-[#D4AF37]/20 bg-white/85 text-[#7A6530]",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      apiState.status === "offline" ? "bg-[#D4AF37]" : "bg-[#D4AF37]",
                    )}
                  />
                  <p>{apiState.message ?? "Live data unavailable. Showing the integrated project map."}</p>
                </div>
              )}

              {apiState.status === "live" && hasIntegratedModules && (
                <div className="mt-6 flex items-start gap-3 rounded-[20px] border border-[#7CB69E]/22 bg-[#F3FAF6] dark:bg-[#7CB69E]/5 px-4 py-3.5 text-sm text-[#276749] dark:text-[#7CB69E] shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>
                    All imported capabilities are available through native NexusAI modules. Use the internal actions below for stable dashboard output.
                  </p>
                </div>
              )}

              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {overview.metrics.map((metric) => (
                  <MetricCard key={metric.id} metric={metric} />
                ))}
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-7 sm:px-6 lg:px-8">
        <section className="workflow-start-section mb-7 overflow-hidden rounded-[28px] border border-[#E5E7EB] dark:border-[#F8F9FA]/[0.06] bg-white dark:bg-gradient-to-br dark:from-[#111827] dark:via-[#0B1020] dark:to-[#0A1628] p-6 sm:p-8 lg:p-10 shadow-sm dark:shadow-[0_18px_56px_rgba(0,0,0,0.32)]">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="inline-flex items-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                Start here
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#18181B] dark:text-[#F8F9FA] sm:text-3xl">
                The shortest path from files to{" "}
                <span className="font-display italic text-[#D4AF37]">finished work</span>
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-[#7A8599]">
                Upload, ask, analyze, and create — all in one intelligent workspace.
              </p>
            </div>
            <Link
              href="/dashboard/documents"
              className="workflow-upload-btn inline-flex items-center justify-center gap-2.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] px-6 py-3 text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA] shadow-[0_0_24px_rgba(212,175,55,0.12),0_0_60px_rgba(212,175,55,0.06)] backdrop-blur transition-all duration-300 hover:bg-[#D4AF37]/[0.12] hover:border-[#D4AF37]/50 hover:shadow-[0_0_36px_rgba(212,175,55,0.2),0_0_80px_rgba(212,175,55,0.1)] hover:-translate-y-0.5"
            >
              <UploadCloud className="h-4 w-4 text-[#D4AF37]" />
              Upload documents
            </Link>
          </div>

          {/* Workflow Steps */}
          <div className="relative">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-7">
              {overview.workflow.map((step, index) => (
                <WorkflowStep key={step.id} step={step} index={index} isLast={index === overview.workflow.length - 1} />
              ))}
            </div>
          </div>

          {/* Bottom Features Row */}
          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-gray-200 dark:border-[#F8F9FA]/[0.06] pt-7 sm:grid-cols-4">
            <FeatureBadge icon={Shield} title="Secure & Private" description="Enterprise-grade security" />
            <FeatureBadge icon={Sparkles} title="AI-Powered" description="Advanced reasoning models" />
            <FeatureBadge icon={Users} title="Collaborative" description="Work together in real-time" />
            <FeatureBadge icon={Clock} title="Save Time" description="Automate repetitive tasks" />
          </div>
        </section>

        <motion.div variants={itemVariants} className="mb-7 grid gap-8 items-start lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="dashboard-panel min-w-0 p-5">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Integrated systems</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#18181B] dark:text-[#F8F9FA]">Six projects, one product surface</h2>
              </div>
              <DashboardFilters
                query={query}
                onQueryChange={setQuery}
                category={category}
                categories={categories}
                onCategoryChange={setCategory}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2 auto-rows-fr">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            {filteredProjects.length === 0 && (
              <EmptyState title="No systems match this filter" description="Clear the search or choose another category." />
            )}

            <div className="border-t border-black/5 dark:border-[#F8F9FA]/5 pt-8 mt-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Live outputs</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#18181B] dark:text-[#F8F9FA]">What the workspace produces</h2>
                </div>
                <Boxes className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {overview.outputs.map((output) => (
                  <Link key={output.id} href={output.href} className="group dashboard-card flex flex-col min-h-[148px] p-5 transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-md dark:hover:bg-white/[0.02]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-[15px] font-semibold text-[#18181B] dark:text-[#F8F9FA]">{output.label}</p>
                      <StatusChip status={output.status} />
                    </div>
                    <p className="line-clamp-3 text-[14px] leading-relaxed text-[#4B5563] dark:text-[#AEB6C3]">{output.value}</p>
                    <div className="mt-auto pt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#D4AF37]">
                      Open output
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-black/5 dark:border-[#F8F9FA]/5 pt-8 mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Next actions</p>
                <div className="mt-5 space-y-3">
                  {overview.next_actions.map((action, index) => (
                    <Link key={action.title} href={action.href} className="dashboard-mini-card flex items-start gap-4 p-4 transition-all duration-300 hover:border-[#D4AF37]/30 hover:bg-white dark:hover:bg-[#1A1A1A] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_20px_rgba(255,255,255,0.04)] hover:-translate-y-0.5">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(212,175,55,0.08)] dark:bg-[#D4AF37]/15 border border-transparent dark:border-[#D4AF37]/30 text-sm font-bold text-[#D4AF37]">
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA] leading-none">{action.title}</span>
                        <span className="mt-2 block text-sm leading-relaxed text-[#94a3b8] dark:text-[#C7CDD8]">{action.description}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Recent activity</p>
                <div className="mt-5 space-y-3">
                  {overview.recent_activity.length > 0 ? (
                    overview.recent_activity.map((item) => (
                    <div key={item.id} className="dashboard-mini-card px-4 py-4 transition hover:border-[#F8F9FA]/10 dark:hover:bg-white/[0.02]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-semibold capitalize text-[#18181B] dark:text-[#F8F9FA]">{item.event_type.replaceAll("_", " ")}</p>
                        <p className="text-[11px] text-[#9CA3AF] dark:text-[#AEB6C3]">{formatRelativeTime(item.created_at)}</p>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-[#94a3b8] dark:text-[#AEB6C3]">{activitySummary(item.payload)}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No activity yet" description="Upload a document or ask a question to start the live feed." />
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-7">
            <section className="dashboard-panel p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Capability catalog</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#18181B] dark:text-[#F8F9FA]">Mapped modules</h2>
              <p className="mt-2 text-sm leading-6 text-[#94a3b8] dark:text-[#C7CDD8]">
                Open one module card to reach the matching workspace, agent hub, or analytics surface. Each card groups related capabilities so the launcher stays easy to scan.
              </p>
              <div className="mt-4 grid gap-3 grid-cols-2">
                <div className="dashboard-mini-card flex flex-col p-4 h-full min-h-[120px]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] dark:text-[#AEB6C3]">Projects</p>
                  <div className="mt-auto pt-4">
                    <p className="font-display text-3xl leading-none tracking-tight text-[#18181B] dark:text-[#F8F9FA]">{overview.health.project_count}</p>
                    <p className="mt-2 text-sm leading-5 text-[#94a3b8] dark:text-[#C7CDD8] line-clamp-2">All mapped systems are visible here without a hidden scroll list.</p>
                  </div>
                </div>
                <div className="dashboard-mini-card flex flex-col p-4 h-full min-h-[120px]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] dark:text-[#AEB6C3]">Capabilities</p>
                  <div className="mt-auto pt-4">
                    <p className="font-display text-3xl leading-none tracking-tight text-[#18181B] dark:text-[#F8F9FA]">{overview.health.capability_count}</p>
                    <p className="mt-2 text-sm leading-5 text-[#94a3b8] dark:text-[#C7CDD8] line-clamp-2">Each launcher groups related work so users can open the right surface faster.</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {groupedCapabilities.map((group) => (
                  <article key={group.project_id} className="dashboard-mini-card px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{group.project_name}</p>
                        <p className="mt-1 text-sm leading-5 text-[#94a3b8] dark:text-[#C7CDD8]">
                          {group.capabilities.length} mapped capabilities · {group.category}
                        </p>
                      </div>
                      <StatusChip status={group.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.capabilities.slice(0, 4).map((capability) => (
                        <span key={capability.id} className="dashboard-chip inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium text-[#4B5563] dark:text-[#F3F4F6] leading-none">
                          {capability.label}
                        </span>
                      ))}
                      {group.capabilities.length > 4 && (
                        <span className="dashboard-chip inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#D4AF37] leading-none">
                          +{group.capabilities.length - 4} more
                        </span>
                      )}
                    </div>

                    <div className="mt-4 border-t border-black/5 dark:border-[#F8F9FA]/8 pt-3 flex flex-col gap-3">
                      <p className="text-sm leading-relaxed text-[#94a3b8] dark:text-[#C7CDD8]">
                        {group.status === "framework"
                          ? "Framework surface available from the dashboard."
                          : group.status === "online"
                            ? "This module is running now and can be opened directly."
                            : "This module is integrated and can be opened from the dashboard."}
                      </p>
                      <Link href={group.href} className="group mt-2 inline-flex w-full items-center justify-between rounded-xl border border-black/10 dark:border-[#F8F9FA]/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA] transition hover:bg-black/5 dark:hover:bg-white/5 dark:hover:border-[#D4AF37]/50 hover:border-[#D4AF37]/50">
                        <span>Launch Workspace</span>
                        <ArrowRight className="h-4 w-4 text-[#9CA3AF] transition group-hover:translate-x-1 group-hover:text-[#D4AF37]" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </motion.div>


      </main>
    </div>
  )
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = METRIC_ICONS[metric.id] ?? Activity
  const value = metric.value === null || metric.value === "" ? "--" : `${metric.value}${metric.suffix ?? ""}`
  return (
    <Link href={metric.href} className="group outline-none h-full block">
      <motion.div 
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="dashboard-card flex flex-col p-5 h-full min-h-[148px]"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] dark:text-[#AEB6C3]">{metric.label}</p>
          <span className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border", toneClasses(metric.tone))}>
            <Icon strokeWidth={1.5} className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          </span>
        </div>
        <div className="mt-auto pt-4">
          <p className="font-display text-4xl leading-none tracking-tight text-[#18181B] dark:text-[#F8F9FA]">{value}</p>
          <p className="mt-2 text-sm leading-5 text-[#94a3b8] dark:text-[#C7CDD8] line-clamp-1">{metric.detail}</p>
        </div>
      </motion.div>
    </Link>
  )
}

function WorkflowStep({ step, index, isLast }: { step: DashboardOverview["workflow"][number]; index: number; isLast: boolean }) {
  const icons: LucideIcon[] = [UploadCloud, MessageSquare, Zap, BookOpen, BarChart3]
  const Icon = icons[index] ?? CheckCircle2
  const stepNumber = String(index + 1).padStart(2, '0')
  return (
    <motion.a initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 24 }} viewport={{ once: true }} href={step.href} className="group relative flex flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-md dark:border-white/[0.06] dark:bg-[#141414] dark:hover:border-[#D4AF37]/40 dark:hover:bg-[#1A1A1A]">
      {/* Arrow connector between cards */}
      {!isLast && (
        <div className="absolute -right-[14px] top-8 z-10 hidden lg:flex items-center justify-center">
          <ArrowRight className="h-3.5 w-3.5 text-[#C7CDD8] dark:text-[#4B5563]" />
        </div>
      )}

      {/* Icon circle */}
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#D4AF37]/40 bg-[#D4AF37]/[0.06] text-[#D4AF37] transition-all duration-300 group-hover:border-[#D4AF37]/70 group-hover:bg-[#D4AF37]/[0.12] group-hover:shadow-[0_0_16px_rgba(212,175,55,0.15)]">
        <Icon strokeWidth={1.5} className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
      </div>

      {/* Step number + arrow */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-[#D4AF37]">{stepNumber}</span>
        <ArrowRight className="h-3.5 w-3.5 text-[#C7CDD8] dark:text-[#4B5563] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#D4AF37]" />
      </div>

      {/* Title */}
      <p className="text-[14px] font-semibold text-[#18181B] dark:text-[#F8F9FA]">{step.label}</p>

      {/* Description */}
      <p className="mt-2 text-[13px] leading-relaxed text-[#94a3b8] dark:text-[#9CA3AF]">{step.description}</p>
    </motion.a>
  )
}

function DashboardFilters({
  query,
  onQueryChange,
  category,
  categories,
  onCategoryChange,
}: {
  query: string
  onQueryChange: (value: string) => void
  category: string
  categories: string[]
  onCategoryChange: (value: string) => void
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
      <label className="relative min-w-0 flex-1 lg:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] dark:text-[#AEB6C3]" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search systems or modules"
          className="dashboard-input h-11 w-full rounded-2xl pl-9 pr-3 text-sm outline-none transition focus:border-[#D4AF37]/50 focus:bg-white dark:focus:bg-[#1A1A1A] dark:focus:border-[#D4AF37]/70"
        />
      </label>
      <label className="relative">
        <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] dark:text-[#AEB6C3]" />
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="dashboard-input h-11 w-full rounded-2xl pl-9 pr-8 text-sm outline-none transition focus:border-[#D4AF37]/50 focus:bg-white dark:focus:bg-[#1A1A1A] dark:focus:border-[#D4AF37]/70 sm:w-64"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All systems" : item}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

const PROJECT_NOTES: Record<string, string> = {
  "personal-nexusai-core": "The primary workspace running locally. Opens directly inside the dashboard.",
  "multi-agent-hub": "Integrated into NexusAI. This feature opens in the dashboard and does not require a separate local app.",
  "nexus-agents": "Integrated into NexusAI. Deep research agents run directly within the dashboard surface.",
  "svenhven-nexus-ai": "Integrated into NexusAI. Access sentiment analysis analytics directly from your dashboard.",
  "nexus-gcp": "Integrated into NexusAI. GCP Cloud Run agents seamlessly mapped to your local dashboard.",
  "primisai-nexus": "Python agent framework package. Inspect framework agents from inside the dashboard.",
}

function ProjectCard({ project }: { project: IntegrationProject }) {
  const Icon = PROJECT_ICONS[project.id] ?? Boxes
  const isCore = project.id === "personal-nexusai-core"
  const displayStatus = project.health === "framework" ? "framework" : project.status === "core" ? "running" : project.health
  const noteText = project.note || PROJECT_NOTES[project.id]

  // If the card has a services section, limit tags to 3 to leave room.
  // If the card lacks a services section, expand tags up to 10 to fill the empty vertical space!
  const hasServices = project.services && project.services.length > 0
  const tagLimit = hasServices ? 3 : 10

  return (
    <motion.article initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="dashboard-card h-full flex flex-col p-6 transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-md dark:hover:bg-white/[0.02]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-white text-[#D4AF37] shadow-sm">
            <Icon strokeWidth={1.5} className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h3 className="line-clamp-1 text-lg font-semibold leading-tight text-[#18181B] dark:text-[#F8F9FA]">{project.name}</h3>
            <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#9CA3AF] dark:text-[#AEB6C3]">{project.category}</p>
          </div>
        </div>
        <StatusChip status={displayStatus} />
      </div>
      <p className="line-clamp-3 min-h-[72px] text-[15px] leading-relaxed text-[#4B5563] dark:text-[#AEB6C3]">{project.summary}</p>
      {noteText?.trim() ? (
        <div className="mt-4 rounded-xl bg-black/[0.02] dark:bg-[#1A1A1A] p-4 text-xs leading-5 text-[#6A6A6A] dark:text-[#D1D5DB]">
          {noteText}
        </div>
      ) : null}

      <div className="mt-4 mb-4 flex flex-wrap gap-2">
        {project.capabilities.slice(0, tagLimit).map((capability) => (
          <span key={capability} className="dashboard-chip inline-flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 px-3 py-1 text-[11px] font-medium text-[#4B5563] dark:text-[#F8F9FA] leading-none">
            {capability}
          </span>
        ))}
        {project.capability_count > tagLimit && (
          <span className="dashboard-chip inline-flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 px-3 py-1 text-[11px] font-bold text-[#4B5563] dark:text-[#F8F9FA] leading-none">
            +{project.capability_count - tagLimit} more
          </span>
        )}
      </div>

      {hasServices && (
        <div className="mb-4 flex flex-wrap gap-2 border-t border-black/5 dark:border-[#F8F9FA]/5 pt-4">
          {project.services.map((service) => (
            <span key={service.id} title={`${service.name}: ${serviceHealthLabel(service.health)}`} className="dashboard-chip inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-[#94a3b8] dark:text-[#E5E7EB] leading-none">
              <span className={cn("h-1.5 w-1.5 rounded-full", healthDot(service.health))} />
              {service.type.toUpperCase()} {service.port ? service.port : ""} · {serviceHealthLabel(service.health)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-2">
        <Link 
          href={project.native_href} 
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962D] px-4 py-3 text-[13px] font-semibold text-white shadow-[0_4px_20px_rgba(212,175,55,0.35)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          {project.primary_action || "Launch"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  )
}

function HealthBadge({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1], // Custom sophisticated ease-out
      onUpdate(v) {
        setDisplayValue(Math.round(v))
      }
    })
    return () => controls.stop()
  }, [value])

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="dashboard-mini-card p-3.5 relative overflow-hidden group cursor-default flex flex-col justify-between h-full min-h-[96px]"
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] dark:text-[#AEB6C3] leading-tight pr-1 break-words">{label}</p>
        <Icon strokeWidth={1.75} className={`h-4 w-4 flex-shrink-0 opacity-70 ${color} transition-transform duration-300 group-hover:scale-125`} />
      </div>
      <p className="mt-auto pt-2 font-display text-3xl leading-none tracking-tight text-[#18181B] dark:text-[#F8F9FA]">{displayValue}</p>
      <div className={`absolute -bottom-4 -right-4 h-12 w-12 rounded-full blur-[20px] opacity-20 transition-opacity duration-300 group-hover:opacity-40 ${color.replace('text-', 'bg-')}`} />
    </motion.div>
  )
}

function StatusChip({ status }: { status: string }) {
  const label = statusLabel(status)
  return (
    <span className={cn("dashboard-chip inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] leading-none", statusChipClasses(status))}>
      <span className={cn("h-1.5 w-1.5 rounded-full", healthDot(status))} />
      {label}
    </span>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="dashboard-mini-card border-dashed border-black/10 p-6 text-center">
      <p className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{title}</p>
      <p className="mt-2 text-sm text-[#94a3b8] dark:text-[#C7CDD8]">{description}</p>
    </div>
  )
}

function toneClasses(tone: DashboardMetric["tone"]) {
  switch (tone) {
    case "blue":
      return "border-[#3B6FE8]/20 bg-[#3B6FE8]/10 text-[#3B6FE8]"
    case "sage":
      return "border-[#7CB69E]/20 bg-[#7CB69E]/10 text-[#3B6FE8]"
    case "violet":
      return "border-[#8B5CF6]/20 bg-[#8B5CF6]/10 text-[#7C3AED]"
    default:
      return "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
  }
}

function statusChipClasses(status: string) {
  if (status === "online" || status === "live" || status === "mapped" || status === "ready" || status === "complete") {
    return "bg-[#EDF5F1] text-[#276749] dark:bg-transparent dark:text-[#7CB69E]"
  }
  if (status === "running") return "bg-[#EEF4FF] text-[#2356C8] dark:bg-transparent dark:text-[#3B6FE8]"
  if (status === "queued" || status === "checking") return "bg-[#FFF7E8] text-[#8A7535] dark:bg-transparent dark:text-[#D4AF37]"
  if (status === "waiting" || status === "unknown") return "bg-[#F4F4F3] text-[#94a3b8] dark:bg-transparent dark:text-[#A1A1AA]"
  if (status === "core" || status === "framework") return "bg-[#EEF2FF] text-[#3730A3] dark:bg-transparent dark:text-[#A78BFA]"
  if (status === "offline" || status === "failed") {
    return "bg-[rgba(212,175,55,0.08)] text-[#8A7035] dark:bg-transparent dark:text-[#D4AF37]"
  }
  if (status === "degraded") return "bg-[#FEF3C7] text-[#7A6530] dark:bg-transparent dark:text-[#D4AF37]"
  return "bg-[#F1F1F1] text-[#94a3b8] dark:bg-transparent dark:text-[#A1A1AA]"
}

function healthDot(status: string) {
  if (status === "online" || status === "live" || status === "mapped" || status === "ready" || status === "complete") return "bg-[#7CB69E]"
  if (status === "running") return "bg-[#3B6FE8]"
  if (status === "queued" || status === "checking") return "bg-[#D4AF37]"
  if (status === "waiting" || status === "unknown") return "bg-[#A1A1AA]"
  if (status === "offline" || status === "failed") return "bg-[#D4AF37]"
  if (status === "degraded") return "bg-[#D4AF37]"
  if (status === "core" || status === "framework") return "bg-[#7C3AED]"
  return "bg-[#9CA3AF]"
}

function statusLabel(status: string) {
  if (status === "online") return "Running"
  if (status === "live") return "Running"
  if (status === "running") return "Running"
  if (status === "queued") return "Queued"
  if (status === "ready") return "Ready"
  if (status === "mapped") return "Ready"
  if (status === "complete") return "Ready"
  if (status === "offline") return "Not running"
  if (status === "degraded") return "Degraded"
  if (status === "core") return "Core"
  if (status === "framework") return "Framework"
  if (status === "failed") return "Not running"
  if (status === "waiting") return "Waiting"
  if (status === "unknown") return "Pending"
  if (status === "checking") return "Checking"
  return "Not running"
}

function serviceHealthLabel(status: string) {
  if (status === "online") return "Running"
  if (status === "degraded") return "Degraded"
  if (status === "offline") return "Not running"
  if (status === "unknown") return "Not running"
  if (status === "framework") return "Framework"
  if (status === "core") return "Core"
  return status
}

function formatRelativeTime(value: string) {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return "recently"
  const diff = Math.max(0, Date.now() - time)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function activitySummary(payload: Record<string, string | number | boolean | null>) {
  const entries = Object.entries(payload).filter(([, value]) => value !== null && value !== "")
  if (entries.length === 0) return "Workspace event recorded."
  return entries
    .slice(0, 2)
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`)
    .join(" | ")
}

function FeatureBadge({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-black/[0.06] bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] text-[#D4AF37]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold leading-tight text-[#18181B] dark:text-[#F8F9FA]">{title}</p>
        <p className="text-[11px] leading-tight text-[#94a3b8] dark:text-[#9CA3AF]">{description}</p>
      </div>
    </div>
  )
}


