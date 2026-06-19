"use client"
import { useCallback, useRef, useState } from "react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Props { onUploaded?: () => void }
const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
}

export function UploadDropzone({ onUploaded }: Props) {
  const [files, setFiles] = useState<Array<{ name: string; progress: number; status: string }>>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const onDrop = useCallback(async (accepted: File[]) => {
    for (const file of accepted) {
      setFiles(f => [...f, { name: file.name, progress: 0, status: "uploading" }])
      try {
        const form = new FormData()
        form.append("file", file)
        const res = await api.upload<{ id: string }>("/api/documents/upload", form)

        const es = new EventSource(api.sseUrl(`/api/documents/${res.id}/progress`))
        es.addEventListener("progress", (ev) => {
          const d = JSON.parse(ev.data) as {
            event: "progress" | "complete" | "error"
            progress?: number
          }
          setFiles(f => f.map(x => x.name === file.name
            ? { ...x, progress: Math.round((d.progress ?? 0) * 100), status: d.event === "complete" ? "ready" : d.event === "error" ? "error" : "processing" }
            : x))
          if (d.event === "complete" || d.event === "error") { es.close(); onUploaded?.() }
        })
        es.onerror = () => {
          setFiles(f => f.map(x => x.name === file.name ? { ...x, status: "error" } : x))
          es.close()
        }
      } catch {
        setFiles(f => f.map(x => x.name === file.name ? { ...x, status: "error" } : x))
      }
    }
  }, [onUploaded])

  function validateAndHandle(filesList: FileList | null) {
    if (!filesList?.length) return
    const acceptedTypes = Object.keys(ACCEPTED)
    const acceptedExts = Object.values(ACCEPTED).flat()
    const validFiles = Array.from(filesList).filter((file) => {
      const hasAcceptedType = acceptedTypes.includes(file.type)
      const hasAcceptedExtension = acceptedExts.some((ext) => file.name.toLowerCase().endsWith(ext))
      return (hasAcceptedType || hasAcceptedExtension) && file.size <= 50 * 1024 * 1024
    })
    if (validFiles.length > 0) void onDrop(validFiles)
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragActive(true)
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragActive(false)
          validateAndHandle(e.dataTransfer.files)
        }}
        className={cn("border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
        isDragActive ? "border-amber-500/60 bg-amber-500/5" : "border-slate-700/50 hover:border-slate-600/60")}>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={Object.values(ACCEPTED).flat().join(",")}
          onChange={(e) => validateAndHandle(e.target.files)}
        />
        <p className="text-3xl mb-3">📂</p>
        <p className="text-sm text-slate-400">{isDragActive ? "Drop files here" : "Drag & drop files, or click to select"}</p>
        <p className="text-xs text-slate-600 mt-1">PDF, DOCX, TXT, CSV · Max 50 MB</p>
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="bg-slate-800/40 rounded-xl px-4 py-2.5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 truncate">{f.name}</span>
                <span className={cn(f.status === "ready" ? "text-emerald-400" : f.status === "error" ? "text-red-400" : "text-amber-400")}>{f.status}</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className={cn("h-full transition-all duration-300 rounded-full",
                  f.status === "error" ? "bg-red-500" : "bg-amber-500")}
                  style={{ width: `${f.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
