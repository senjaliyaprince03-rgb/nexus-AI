"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import {
  Users, FileStack, MessageSquare, Plus, UserPlus, ArrowRight,
  Copy, Check, Search, Settings, Clock, TrendingUp, X,
  Building2, Bot, BarChart3, ShieldCheck, BrainCircuit, CreditCard, type LucideIcon
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

interface WorkspaceMember {
  id: string
  email: string
  role: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  joined_at?: string
}

interface WorkspaceStats {
  members: number
  documents: number
  chat_sessions: number
}

const WORKSPACE_SURFACES: Array<{ label: string; desc: string; icon: LucideIcon; color: string }> = [
  { label: "Search", desc: "Hybrid retrieval active", icon: ShieldCheck, color: "#3B6FE8" },
  { label: "Agents", desc: "Multi-agent pipeline", icon: Bot, color: "#C5A059" },
  { label: "Analytics", desc: "Usage tracking on", icon: BarChart3, color: "#7CB69E" },
]

const QUICK_ACTIONS: Array<{ title: string; desc: string; icon: LucideIcon; color: string; href: string }> = [
  { title: "Upload documents", desc: "Expand your knowledge base", icon: FileStack, color: "#3B6FE8", href: "/dashboard/documents" },
  { title: "Start a chat", desc: "Query your workspace data", icon: MessageSquare, color: "#7CB69E", href: "/chat" },
  { title: "Run agent query", desc: "Multi-agent deep reasoning", icon: BrainCircuit, color: "#8B5CF6", href: "/dashboard/agents" },
  { title: "View analytics", desc: "Usage and performance insights", icon: TrendingUp, color: "#C5A059", href: "/dashboard/analytics" },
]

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const { user, workspace } = useAuthStore()
  const [stats, setStats] = useState<WorkspaceStats>({ members: 0, documents: 0, chat_sessions: 0 })
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [slugCopied, setSlugCopied] = useState(false)

  useEffect(() => {
    if (workspace?.id) {
      loadWorkspaceData()
    } else {
      setLoading(false)
    }
  }, [workspace?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadWorkspaceData() {
    setLoading(true)
    try {
      const [statsRes, membersRes] = await Promise.allSettled([
        api.get<WorkspaceStats>(`/api/workspaces/${workspace!.id}/stats`),
        api.get<WorkspaceMember[]>(`/api/workspaces/${workspace!.id}/members`),
      ])
      if (statsRes.status === "fulfilled") setStats(statsRes.value)
      if (membersRes.status === "fulfilled") setMembers(membersRes.value)
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false)
    }
  }

  function handleCopySlug() {
    if (workspace?.slug) {
      navigator.clipboard.writeText(workspace.slug)
      setSlugCopied(true)
      setTimeout(() => setSlugCopied(false), 2000)
    }
  }

  const greeting = getGreeting()

  if (loading) return <LoadingSkeleton />

  if (!workspace) {
    return (
      <div className="dashboard-shell min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-[#C0C0C0] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#18181B] dark:text-[#F8F9FA] mb-2">No workspace found</h2>
          <p className="text-sm text-[#9CA3AF] dark:text-[#A1A1AA]">Create or join a workspace to get started.</p>
        </div>
      </div>
    )
  }

  const userName = workspace.name || user?.email?.split("@")[0] || "there"
  const filteredMembers = filterMembers(members, searchQuery)
  const workspacePlan = workspace.plan ? workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1) : "Free"

  return (
    <div className="dashboard-shell min-h-screen text-[#18181B] dark:text-[#F8F9FA]">
      <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="dashboard-hero overflow-hidden p-5 sm:p-6 lg:p-7"
        >
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] xl:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-[#F8F9FA]/10 bg-white/90 dark:bg-[#F8FAFC] px-3 py-1.5 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[#7CB69E] shadow-[0_0_10px_rgba(124,182,158,0.65)]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6A6A6A] dark:text-[#51606F]">Workspace</span>
              </div>
              <h1 className="mt-5 font-display text-[2.7rem] leading-none tracking-tight text-[#18181B] dark:text-[#F8F9FA] sm:text-[3.5rem]">
                {greeting}, <span className="capitalize">{userName}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#374151] dark:text-[#D1D5DB]">
                Welcome to <span className="font-semibold text-[#18181B] dark:text-[#F8F9FA]">{workspace.name}</span>. Manage your team, monitor activity, and move between documents, chat, agents, and analytics from one clean control surface.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowInvite(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#18181B] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(10,10,10,0.14)] transition hover:-translate-y-0.5"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite member
                </motion.button>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-[#F8F9FA]/10 bg-white dark:bg-[#0B1220] px-5 py-3 text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA] transition hover:border-[#C5A059]/30 hover:bg-white dark:hover:bg-[#111827]"
                >
                  <Settings className="h-4 w-4 text-[#9CA3AF] dark:text-[#A1A1AA]" />
                  Settings
                </Link>
              </div>
            </div>

            <div className="dashboard-panel bg-white/70 dark:bg-white/4 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-[#C5A059]/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,240,235,0.85))] dark:bg-[linear-gradient(145deg,rgba(255,107,53,0.16),rgba(255,255,255,0.03))] text-[#C5A059] shadow-sm">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF] dark:text-[#AEB6C3]">Workspace snapshot</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#18181B] dark:text-[#F8F9FA]">{workspace.name}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6A6A6A] dark:text-[#D1D5DB]">
                    <button
                      onClick={handleCopySlug}
                      className="dashboard-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono hover:bg-white dark:hover:bg-[#182233] dark:text-[#E5E7EB]"
                      title="Copy workspace slug"
                    >
                      {slugCopied ? <Check className="h-3 w-3 text-[#7CB69E]" /> : <Copy className="h-3 w-3" />}
                      {workspace.slug}
                    </button>
                    <span className="dashboard-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
                      <Clock className="h-3 w-3" />
                      Created {formatDate(workspace.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="dashboard-mini-card px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF] dark:text-[#AEB6C3]">Owner</p>
                  <p className="mt-2 truncate text-sm font-medium text-[#18181B] dark:text-[#F8F9FA]">{user?.email || "—"}</p>
                </div>
                <div className="dashboard-mini-card px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF] dark:text-[#AEB6C3]">Plan</p>
                  <p className="mt-2 text-sm font-medium text-[#18181B] dark:text-[#F8F9FA]">{workspacePlan}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Team members" value={stats.members} color="#3B6FE8" />
            <StatCard icon={FileStack} label="Documents" value={stats.documents} color="#C5A059" />
            <StatCard icon={MessageSquare} label="Chat sessions" value={stats.chat_sessions} color="#7CB69E" />
            <StatCard icon={CreditCard} label="Current plan" value={workspacePlan} color="#8B5CF6" />
          </div>
        </motion.section>

        <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="space-y-7"
          >
            <section className="dashboard-panel p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">Workspace details</p>
                  <div className="mt-4 flex items-start gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-[#C5A059]/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,240,235,0.78))] text-[#C5A059] shadow-sm">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-2xl font-semibold tracking-tight text-[#18181B] dark:text-[#F8F9FA]">{workspace.name}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5A5A5A] dark:text-[#D1D5DB]">
                        This workspace keeps the retrieval, agent, and analytics surfaces aligned so your team can move from source material to answers without leaving NexusAI.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="dashboard-mini-card px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF] dark:text-[#AEB6C3]">Status</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#EDF5F1] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#276749]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7CB69E]" />
                    Active workspace
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {WORKSPACE_SURFACES.map((item) => (
                  <div key={item.label} className="dashboard-card p-4 transition hover:border-[#C5A059]/20 hover:bg-white dark:hover:bg-[#1A2434]">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                      style={{ backgroundColor: `${item.color}10`, color: item.color, borderColor: `${item.color}25` }}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF] dark:text-[#AEB6C3]">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-panel p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">Team</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#18181B] dark:text-[#F8F9FA]">Members</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6A6A6A] dark:text-[#D1D5DB]">
                    Search current members, review roles, and invite new teammates into this workspace.
                  </p>
                </div>
                <button
                  onClick={() => setShowInvite(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FFF0EB] px-3.5 py-2 text-xs font-semibold text-[#C5A059] transition hover:bg-[#FFE2D7]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add member
                </button>
              </div>

              <div className="mt-5 relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] dark:text-[#AEB6C3]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members..."
                  className="dashboard-input h-11 w-full rounded-2xl pl-10 pr-4 text-sm text-[#18181B] placeholder:text-[#B0B0B0] outline-none transition focus:border-[#C5A059]/45 focus:bg-white"
                />
              </div>

              <div className="mt-5 space-y-3">
                {filteredMembers.map((member) => (
                  <MemberRow key={member.id} member={member} isCurrentUser={member.id === user?.id} />
                ))}

                {filteredMembers.length === 0 && (
                  <div className="dashboard-mini-card border-dashed border-black/10 px-5 py-10 text-center">
                    <Users className="mx-auto h-10 w-10 text-[#D0D0D0]" />
                    <p className="mt-4 text-base font-semibold text-[#18181B] dark:text-[#F8F9FA]">
                      {members.length === 0 ? "No members yet" : "No members match this search"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#6A6A6A] dark:text-[#D1D5DB]">
                      {members.length === 0
                        ? "Invite your first teammate to share documents, run agents, and track workspace activity together."
                        : "Try another name or email address to find the teammate you need."}
                    </p>
                    {members.length === 0 && (
                      <button
                        onClick={() => setShowInvite(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#18181B] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(10,10,10,0.12)] transition hover:-translate-y-0.5"
                      >
                        <UserPlus className="h-4 w-4" />
                        Invite your first member
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.45 }}
            className="space-y-7"
          >
            <section className="dashboard-panel p-5 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">Quick actions</p>
              <div className="mt-5 space-y-3">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                  className="group dashboard-mini-card flex items-center gap-4 p-4 transition hover:border-[#C5A059]/18 hover:bg-white dark:hover:bg-[#1A2434]"
                >
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border transition group-hover:scale-105"
                      style={{ backgroundColor: `${action.color}10`, color: action.color, borderColor: `${action.color}20` }}
                    >
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <p className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{action.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#9CA3AF] dark:text-[#D1D5DB] group-hover:dark:text-[#E5E7EB]">{action.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#A1A1AA] dark:text-[#AEB6C3] transition group-hover:translate-x-0.5 group-hover:text-[#18181B] dark:group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="dashboard-panel p-5 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">Subscription</p>
              <div className="mt-5 overflow-hidden rounded-[26px] bg-[linear-gradient(145deg,#111111_0%,#1A1A1A_48%,#232323_100%)] p-6 text-white shadow-[0_18px_52px_rgba(10,10,10,0.16)]">
                <div className="relative">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#C5A059]/18 blur-2xl" />
                  <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-[#3B6FE8]/12 blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[#C5A059]" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B8B8B8]">Current plan</span>
                    </div>
                    <p className="mt-4 font-display text-3xl leading-none tracking-tight">{workspacePlan}</p>
                    <div className="mt-5 space-y-2.5 text-sm text-[#D0D0D0]">
                      <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#7CB69E]" />Unlimited documents</p>
                      <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#7CB69E]" />Multi-agent reasoning</p>
                      <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#7CB69E]" />{stats.members} of 10 team seats</p>
                    </div>
                    <button className="mt-6 w-full rounded-2xl bg-[linear-gradient(90deg,#C5A059_0%,#FF8C35_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,107,53,0.24)] transition hover:-translate-y-0.5">
                      Upgrade plan
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="dashboard-panel p-5 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">About</p>
              <div className="mt-5 space-y-3">
                <InfoRow label="Workspace ID" value={workspace.id} mono />
                <InfoRow label="Slug" value={workspace.slug} mono />
                <InfoRow label="Created" value={formatDate(workspace.created_at)} />
                <InfoRow label="Owner" value={user?.email || "—"} />
              </div>
            </section>
          </motion.div>
        </div>
      </div>

      {/* ── Invite Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showInvite && (
          <InviteModal
            workspaceId={workspace.id}
            onClose={() => setShowInvite(false)}
            onInvited={() => { setShowInvite(false); loadWorkspaceData() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-Components ──────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="dashboard-card p-5 transition hover:-translate-y-0.5 hover:border-[#C5A059]/18 hover:bg-white dark:hover:bg-white/8 group">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#71717A]">{label}</span>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: `${color}10`, color, borderColor: `${color}20` }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="font-display text-4xl leading-none tracking-tight text-[#18181B] dark:text-[#F8F9FA]">{value}</div>
    </div>
  )
}

function MemberRow({ member, isCurrentUser }: { member: WorkspaceMember; isCurrentUser: boolean }) {
  const initials = getInitials(member)
  const roleBadge = getRoleBadge(member.role)

  return (
    <div className="dashboard-mini-card flex items-center gap-3.5 px-4 py-3 transition hover:border-[#C5A059]/16 hover:bg-white dark:hover:bg-white/6">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F0F0F0] to-[#E5E5E5] dark:from-white/8 dark:to-white/4 text-xs font-semibold uppercase text-[#4B5563] dark:text-[#D1D5DB]">
        {member.avatar_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-[#18181B] dark:text-[#F8F9FA] truncate">
          {member.first_name && member.last_name
            ? `${member.first_name} ${member.last_name}`
            : member.email.split("@")[0]}
          {isCurrentUser && <span className="ml-1.5 text-[10px] text-[#9CA3AF] dark:text-[#D1D5DB] font-normal">(you)</span>}
        </p>
        <p className="text-xs text-[#9CA3AF] dark:text-[#D1D5DB] truncate">{member.email}</p>
      </div>
      <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md", roleBadge.classes)}>
        {roleBadge.icon} {member.role}
      </span>
    </div>
  )
}

function InviteModal({ workspaceId, onClose, onInvited }: { workspaceId: string; onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSending(true)
    setError("")
    try {
      await api.post(`/api/workspaces/${workspaceId}/invite`, { email, role })
      onInvited()
    } catch (err: any) {
      setError(err.detail || "Failed to invite user.")
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-[rgba(0,0,0,0.06)] dark:border-[#F8F9FA]/10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-[rgba(0,0,0,0.06)] dark:border-[#F8F9FA]/10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#C5A059] mb-1">Team</p>
            <h3 className="text-xl font-display tracking-tight text-[#18181B] dark:text-[#F8F9FA]">Invite a member</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F8F9FA] dark:bg-white/6 flex items-center justify-center hover:bg-[#F0F0F0] dark:hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-[#9CA3AF] dark:text-[#A1A1AA]" />
          </button>
        </div>
        <form onSubmit={handleInvite} className="p-8">
          <div className="space-y-5">
            <div>
              <label htmlFor="invite-email" className="block text-xs font-bold text-[#4B5563] dark:text-[#D1D5DB] mb-2">Email address</label>
              <input
                ref={inputRef}
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-[#F8F9FA] dark:bg-[#0B1220] border border-[rgba(0,0,0,0.08)] dark:border-[#F8F9FA]/10 rounded-xl px-4 py-3 text-sm text-[#18181B] dark:text-[#F8F9FA] placeholder:text-[#B0B0B0] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/30 transition-all"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="block text-xs font-bold text-[#4B5563] dark:text-[#D1D5DB] mb-2">Role</label>
              <select
                id="invite-role"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-[#F8F9FA] dark:bg-[#0B1220] border border-[rgba(0,0,0,0.08)] dark:border-[#F8F9FA]/10 rounded-xl px-4 py-3 text-sm text-[#18181B] dark:text-[#F8F9FA] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/30"
              >
                <option value="member">Member</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-500" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={sending || !email}
            className="mt-6 w-full py-3 rounded-xl bg-[#18181B] text-white text-sm font-semibold hover:bg-[#1A1A1A] hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {sending ? "Sending invite..." : "Send invitation"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="dashboard-mini-card flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm text-[#9CA3AF] dark:text-[#A1A1AA]">{label}</span>
      <span className={cn("max-w-[220px] truncate text-right text-sm font-medium text-[#18181B] dark:text-[#F8F9FA]", mono && "font-mono text-xs")}>{value}</span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="dashboard-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px] animate-pulse">
        <div className="mb-10">
          <div className="dashboard-hero p-6">
            <div className="h-3 w-24 rounded bg-[#E5E5E5] mb-4" />
            <div className="h-10 w-80 rounded bg-[#E5E5E5] mb-3" />
            <div className="h-4 w-96 rounded bg-[#E5E5E5]" />
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => <div key={i} className="dashboard-card h-32" />)}
            </div>
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <div className="dashboard-panel h-72" />
            <div className="dashboard-panel h-64" />
          </div>
          <div className="space-y-6">
            <div className="dashboard-panel h-64" />
            <div className="dashboard-panel h-52" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return dateStr
  }
}

function getInitials(member: WorkspaceMember): string {
  if (member.first_name && member.last_name) return `${member.first_name[0]}${member.last_name[0]}`
  return member.email.charAt(0).toUpperCase()
}

function getRoleBadge(role: string): { classes: string; icon: string } {
  switch (role) {
    case "owner":
      return { classes: "bg-[#FFF0EB] text-[#C5A059] dark:bg-[#FFF0EB] dark:text-[#C5A059]", icon: "👑" }
    case "admin":
      return { classes: "bg-[#EFF6FF] text-[#3B6FE8] dark:bg-[#EFF6FF] dark:text-[#3B6FE8]", icon: "🛡" }
    default:
      return { classes: "bg-[#F8F9FA] text-[#9CA3AF] dark:bg-[#182233] dark:text-[#D1D5DB]", icon: "" }
  }
}

function filterMembers(members: WorkspaceMember[], query: string): WorkspaceMember[] {
  if (!query.trim()) return members
  const q = query.toLowerCase()
  return members.filter(m =>
    m.email.toLowerCase().includes(q) ||
    (m.first_name && m.first_name.toLowerCase().includes(q)) ||
    (m.last_name && m.last_name.toLowerCase().includes(q))
  )
}
