"use client"
import { useState, useCallback } from "react"
import { Activity, BarChart3, RadioTower, Waves } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { api } from "@/lib/api"
import { useAnalyticsSocket } from "@/hooks/useAnalyticsSocket"
import { useChatStore } from "@/store/chatStore"

export default function AnalyticsPage() {
  const workspaceId = useChatStore(s => s.workspaceId)
  const [liveEvents, setLiveEvents] = useState<Array<{ type: string; ts: string }>>([])

  // Live WebSocket events from useAnalyticsSocket hook
  useAnalyticsSocket({
    workspaceId,
    enabled: !!workspaceId,
    onEvent: useCallback((evt: { event: string }) => {
      setLiveEvents(prev => [{ type: evt.event, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20))
    }, []),
  })

  const { data: volume, isLoading: volLoading } = useQuery({
    queryKey: ["analytics", "volume"],
    queryFn: () => api.get<Array<{ date: string; count: number }>>("/api/analytics/queries?days=30"),
    enabled: !!workspaceId,
    refetchInterval: 60_000,
  })

  const { data: usage, isLoading: useLoading } = useQuery({
    queryKey: ["analytics", "usage"],
    queryFn: () => api.get<Array<{ document_id: string; filename: string; query_hits: number }>>("/api/analytics/documents/usage"),
    enabled: !!workspaceId,
    refetchInterval: 60_000,
  })

  const maxHits = Math.max(...(usage ?? []).map(d => d.query_hits), 1)

  return (
    <div className="dashboard-shell min-h-full">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#C5A059] mb-2">Analytics</p>
          <h1 className="text-3xl font-display tracking-tight text-[#18181B] dark:text-[#F8F9FA]">Usage Intelligence</h1>
          <p className="mt-2 text-sm text-[#4B5563] dark:text-[#A1A1AA]">
            See demand patterns, source saturation, and live activity across your workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-[#F0FDF4] dark:bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          Live · {liveEvents.length} events received
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="dashboard-card p-6 transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C5A059]/5 to-transparent pointer-events-none rounded-bl-full" />
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#71717A]">Signal</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059]/10 text-[#C5A059] group-hover:scale-110 transition-transform">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-medium text-[#18181B] dark:text-[#F8F9FA]">{(volume ?? []).reduce((sum, item) => sum + item.count, 0)}</p>
          <p className="mt-2 text-xs text-[#9CA3AF] dark:text-[#A1A1AA]">Queries over the last 30 days</p>
        </div>
        <div className="dashboard-card p-6 transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#3B6FE8]/5 to-transparent pointer-events-none rounded-bl-full" />
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#71717A]">Coverage</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B6FE8]/10 text-[#3B6FE8] group-hover:scale-110 transition-transform">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-medium text-[#18181B] dark:text-[#F8F9FA]">{usage?.length ?? 0}</p>
          <p className="mt-2 text-xs text-[#9CA3AF] dark:text-[#A1A1AA]">Documents contributing to answer flows</p>
        </div>
        <div className="dashboard-card p-6 transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#7CB69E]/5 to-transparent pointer-events-none rounded-bl-full" />
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#71717A]">Realtime</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7CB69E]/10 text-[#7CB69E] group-hover:scale-110 transition-transform">
              <RadioTower className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-medium text-[#18181B] dark:text-[#F8F9FA]">{liveEvents.length}</p>
          <p className="mt-2 text-xs text-[#9CA3AF] dark:text-[#A1A1AA]">Recent events held in live memory</p>
        </div>
      </div>

      <div className="dashboard-panel p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8F9FA] dark:bg-white/6 text-[#18181B] dark:text-[#F8F9FA] border border-[rgba(0,0,0,0.04)] dark:border-[#F8F9FA]/8">
            <Waves className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#18181B] dark:text-[#F8F9FA]">Query volume — last 30 days</h2>
            <p className="text-sm text-[#9CA3AF] dark:text-[#A1A1AA]">Traffic trend for user questions and system demand</p>
          </div>
        </div>
        {volLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={volume ?? []} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="qvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C5A059" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C5A059" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }} tickLine={false} axisLine={false} tickFormatter={d => d.slice(5)} tickMargin={10} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }} tickLine={false} axisLine={false} allowDecimals={false} tickMargin={10} />
              <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }} labelStyle={{ color: "#9CA3AF", fontWeight: 600, marginBottom: 4 }} itemStyle={{ color: "#C5A059", fontWeight: 600 }} />
              <Area type="monotone" dataKey="count" stroke="#C5A059" fill="url(#qvGrad)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "#C5A059", stroke: "#FFFFFF", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="dashboard-panel p-6">
        <h2 className="text-[11px] font-bold text-[#9CA3AF] dark:text-[#71717A] uppercase tracking-widest mb-6">Document usage by query hits</h2>
        {useLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-6 bg-[#F8F9FA] dark:bg-white/6 rounded-md" />)}
          </div>
        ) : !usage?.length ? (
          <p className="text-sm text-[#4B5563] dark:text-[#A1A1AA] py-6 text-center bg-[#F8F9FA] dark:bg-white/6 rounded-xl border border-dashed border-[rgba(0,0,0,0.08)] dark:border-[#F8F9FA]/10">No usage data yet — start asking questions about your documents.</p>
        ) : (
          <div className="space-y-4">
            {usage.map(doc => (
              <div key={doc.document_id} className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#18181B] dark:text-[#F8F9FA] truncate flex-1 max-w-[250px]" title={doc.filename}>
                  {doc.filename}
                </span>
                <div className="flex-1 h-2 bg-[#F8F9FA] dark:bg-white/8 rounded-full overflow-hidden border border-[rgba(0,0,0,0.04)] dark:border-[#F8F9FA]/8">
                  <div
                    className="h-full bg-gradient-to-r from-[#C5A059] to-[#FF8C35] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (doc.query_hits / maxHits) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#4B5563] dark:text-[#D1D5DB] w-10 text-right tabular-nums bg-[#F8F9FA] dark:bg-white/6 px-2 py-1 rounded-md">{doc.query_hits}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live event feed */}
      {liveEvents.length > 0 && (
        <div className="dashboard-panel p-6">
          <h2 className="text-[11px] font-bold text-[#9CA3AF] dark:text-[#71717A] uppercase tracking-widest mb-4">Live event stream</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {liveEvents.map((evt, i) => (
              <div key={i} className="flex items-center gap-3 text-sm border-b border-[#F8F9FA] dark:border-[#F8F9FA]/6 last:border-0 pb-2 last:pb-0">
                <span className="text-[#9CA3AF] dark:text-[#71717A] tabular-nums font-mono text-xs">{evt.ts}</span>
                <span className="text-[#18181B] dark:text-[#F8F9FA] font-medium">{evt.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
