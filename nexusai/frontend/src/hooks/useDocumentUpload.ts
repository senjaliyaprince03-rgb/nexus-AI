"use client"

/**
 * useDocumentUpload
 *
 * Manages the full upload lifecycle:
 *   file selected → POST multipart → SSE ingestion progress → completion
 *
 * Returns reactive state so any component can bind to progress.
 */
import { useState, useCallback, useRef } from "react"
import { api } from "@/lib/api"

export type UploadStatus = "idle" | "uploading" | "processing" | "ready" | "error"

export interface UploadState {
  filename: string
  documentId: string | null
  progress: number        // 0–100
  status: UploadStatus
  error: string | null
  chunkCount: number | null
}

const INITIAL: UploadState = {
  filename: "",
  documentId: null,
  progress: 0,
  status: "idle",
  error: null,
  chunkCount: null,
}

export function useDocumentUpload(onComplete?: (documentId: string) => void) {
  const [state, setState] = useState<UploadState>(INITIAL)
  const esRef = useRef<EventSource | null>(null)

  const reset = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
    setState(INITIAL)
  }, [])

  const upload = useCallback(async (file: File) => {
    reset()
    setState((s) => ({ ...s, filename: file.name, status: "uploading", progress: 5 }))

    try {
      // 1. Upload file
      const form = new FormData()
      form.append("file", file)
      const res = await api.upload<{ id: string; filename: string }>("/api/documents/upload", form)

      setState((s) => ({ ...s, documentId: res.id, status: "processing", progress: 20 }))

      // 2. Subscribe to SSE progress stream
      const sseUrl = api.sseUrl(`/api/documents/${res.id}/progress`)
      const es = new EventSource(sseUrl)
      esRef.current = es

      es.addEventListener("progress", (evt) => {
        try {
          const data = JSON.parse(evt.data) as {
            event: "progress" | "complete" | "error"
            progress: number
            step: string
            chunk_count?: number
            message?: string
          }

          if (data.event === "progress") {
            setState((s) => ({
              ...s,
              progress: Math.round(data.progress * 100),
              status: "processing",
            }))
          } else if (data.event === "complete") {
            setState((s) => ({
              ...s,
              progress: 100,
              status: "ready",
              chunkCount: data.chunk_count ?? null,
            }))
            es.close()
            onComplete?.(res.id)
          } else if (data.event === "error") {
            setState((s) => ({
              ...s,
              status: "error",
              error: data.message ?? "Ingestion failed",
            }))
            es.close()
          }
        } catch {
          // ignore parse errors
        }
      })

      es.onerror = () => {
        setState((s) => ({
          ...s,
          status: "error",
          error: "Lost connection to progress stream",
        }))
        es.close()
      }

    } catch (err: unknown) {
      setState((s) => ({
        ...s,
        status: "error",
        error: (err as any)?.detail ?? "Upload failed",
        progress: 0,
      }))
    }
  }, [reset, onComplete])

  return { upload, reset, ...state }
}
