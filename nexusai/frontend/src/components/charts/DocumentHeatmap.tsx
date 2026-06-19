"use client"
import { useState } from "react"

interface HeatmapItem { document_id: string; filename: string; query_hits: number }

export function DocumentHeatmap({ data }: { data: HeatmapItem[] }) {
  const [hovered, setHovered] = useState<HeatmapItem | null>(null)
  if (!data.length) return <p className="text-sm text-slate-600 py-4">No usage data yet.</p>

  const max = Math.max(...data.map(d => d.query_hits), 1)

  function opacity(hits: number) {
    return 0.1 + (hits / max) * 0.9
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {data.map(item => (
          <div key={item.document_id} onMouseEnter={() => setHovered(item)} onMouseLeave={() => setHovered(null)}
            className="relative w-10 h-10 rounded-lg cursor-pointer transition-transform hover:scale-110"
            style={{ background: `rgba(245, 158, 11, ${opacity(item.query_hits)})` }}
            title={`${item.filename}: ${item.query_hits} hits`} />
        ))}
      </div>
      {hovered && (
        <div className="mt-3 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700/50 text-xs">
          <p className="text-slate-200 font-medium truncate">{hovered.filename}</p>
          <p className="text-amber-400 mt-0.5">{hovered.query_hits} query hits</p>
        </div>
      )}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-slate-600">Less</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
          <div key={o} className="w-4 h-4 rounded-sm" style={{ background: `rgba(245, 158, 11, ${o})` }} />
        ))}
        <span className="text-[10px] text-slate-600">More</span>
      </div>
    </div>
  )
}
