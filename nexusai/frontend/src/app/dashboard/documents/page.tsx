"use client"
import { useState } from "react"
import { CloudUpload, FileStack, UploadCloud } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useDocumentUpload } from "@/hooks/useDocumentUpload"
import { DocumentCard } from "@/components/documents/DocumentCard"
import type { DocumentItem } from "@/types/api"
import { cn } from "@/lib/utils"

export default function DocumentsPage() {
  const qc = useQueryClient()
  const [dragOver, setDragOver] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get<{ items: DocumentItem[] }>("/api/documents/"),
    refetchInterval: (q) => {
      // Auto-refresh while any document is still processing
      const items = q.state.data?.items ?? []
      return items.some(d => d.status === "processing" || d.status === "pending") ? 3000 : false
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  })

  const { upload, filename, progress, status: uploadStatus } = useDocumentUpload(() => {
    qc.invalidateQueries({ queryKey: ["documents"] })
  })

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    Array.from(files).forEach(f => upload(f))
  }

  return (
    <div className="dashboard-shell min-h-full">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#C5A059] mb-2">Documents</p>
          <h1 className="text-3xl font-display tracking-tight text-[#18181B] dark:text-[#F8F9FA]">Knowledge Library</h1>
          <p className="mt-2 text-sm text-[#4B5563] dark:text-[#A1A1AA]">
            {data?.items.length ?? 0} document{data?.items.length !== 1 ? "s" : ""} in workspace
          </p>
        </div>

        <label className={cn(
          "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm cursor-pointer",
          uploadStatus === "uploading" || uploadStatus === "processing"
            ? "bg-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed"
            : "bg-gradient-to-r from-[#C5A059] to-[#FF8C35] text-white hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(255,107,53,0.3)]"
        )}>
          <UploadCloud className="h-4 w-4" />
          Upload files
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.csv,.xlsx,.md"
            className="hidden"
            disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
            onChange={e => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {/* Upload progress */}
      {filename && uploadStatus !== "idle" && (
        <div className="dashboard-card p-4 mb-6">
          <div className="flex items-center justify-between text-xs mb-3 font-medium">
            <span className="text-[#18181B] dark:text-[#F8F9FA] truncate">{filename}</span>
            <span className={cn(
              uploadStatus === "ready" ? "text-emerald-500" :
              uploadStatus === "error" ? "text-red-500" : "text-[#C5A059]"
            )}>
              {uploadStatus === "ready" ? "Ready" :
               uploadStatus === "error" ? "Failed" :
               uploadStatus === "uploading" ? "Uploading…" : `Processing… ${progress}%`}
            </span>
          </div>
          <div className="h-1.5 bg-[#F8F9FA] dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-300 rounded-full",
                uploadStatus === "error" ? "bg-red-500" :
                uploadStatus === "ready" ? "bg-emerald-500" : "bg-[#C5A059]"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Drop zone overlay */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        className={cn(
          "dashboard-panel border-2 border-dashed transition-all min-h-[400px] p-6",
          dragOver ? "border-[#C5A059] bg-[#C5A059]/5 dark:bg-[#C5A059]/10" : "border-[rgba(0,0,0,0.08)] dark:border-[#F8F9FA]/10 hover:border-[#C5A059]/30"
        )}
      >
        {isLoading && (
          <div className="space-y-3 p-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-[#F8F9FA] dark:bg-white/6 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        <div className="space-y-3">
          {data?.items.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={() => deleteMutation.mutate(doc.id)}
            />
          ))}
        </div>

        {!isLoading && !data?.items.length && !dragOver && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#C5A059]/20 bg-[rgba(212,175,55,0.08)] text-[#C5A059]">
              <FileStack className="h-8 w-8" />
            </div>
            <p className="mb-2 text-lg font-display text-[#18181B] dark:text-[#F8F9FA]">No documents yet</p>
            <p className="text-sm text-[#9CA3AF] dark:text-[#A1A1AA] max-w-sm leading-relaxed">
              Upload a PDF, Word doc, or CSV — or drag & drop files right here to build your knowledge base.
            </p>
          </div>
        )}

        {dragOver && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059]">
              <CloudUpload className="h-8 w-8 animate-bounce" />
            </div>
            <p className="text-lg font-display text-[#C5A059]">Drop files to upload</p>
          </div>
        )}
      </div>

      <p className="text-[11px] font-medium text-[#9CA3AF] text-center mt-6 uppercase tracking-wider">
        Supported: PDF, DOCX, TXT, CSV, XLSX, Markdown · Max 50 MB per file
      </p>
      </div>
    </div>
  )
}

