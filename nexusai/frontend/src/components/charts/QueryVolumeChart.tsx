"use client"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface Props { data: Array<{ date: string; count: number }> }

export function QueryVolumeChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="qvGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false}
          tickFormatter={d => d.slice(5)} />
        <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#fbbf24" }} />
        <Area type="monotone" dataKey="count" stroke="#D4AF37" fill="url(#qvGrad)" strokeWidth={2}
          dot={false} activeDot={{ r: 4, fill: "#D4AF37" }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
