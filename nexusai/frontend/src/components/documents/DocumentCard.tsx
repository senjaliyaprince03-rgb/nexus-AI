import { FileText, Trash2 } from "lucide-react"

import { formatBytes, formatRelativeTime, cn } from "@/lib/utils"
import type { DocumentItem } from "@/types/api"

const statusStyle: Record<string, { dot: string; text: string; bg: string }> = {
  pending:    { dot: "bg-slate-500",   text: "text-slate-400",  bg: "bg-slate-700/40" },
  processing: { dot: "bg-amber-400 animate-pulse", text: "text-amber-400", bg: "bg-amber-400/10" },
  ready:      { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10" },
  failed:     { dot: "bg-red-400",     text: "text-red-400",    bg: "bg-red-400/10" },
}

export function DocumentCard({ doc, onDelete }: { doc: DocumentItem; onDelete?: () => void }) {
  const s = statusStyle[doc.status] ?? statusStyle.pending
  return (
    <div className="group dashboard-card flex items-center gap-4 px-4 py-3">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-[#FFF4EE] text-[#C5A059] dark:border-[#F8F9FA]/8 dark:bg-white/4 dark:text-amber-300">
        <FileText className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#18181B] dark:text-slate-200 truncate">{doc.filename}</p>
        <p className="text-xs text-[#9CA3AF] dark:text-slate-500 mt-0.5">
          {formatBytes(doc.file_size_bytes)} · {doc.chunk_count} chunks · {formatRelativeTime(doc.created_at)}
        </p>
        {doc.error_message && <p className="text-xs text-red-400 mt-0.5 truncate">{doc.error_message}</p>}
      </div>
      <span className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0", s.bg, s.text)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />{doc.status}
      </span>
      {onDelete && (
        <button
          onClick={onDelete}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[#9CA3AF] dark:text-slate-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
