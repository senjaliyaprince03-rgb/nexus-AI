"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { useInvalidateDocuments } from "@/hooks/useDocuments";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
};

interface QueueItem {
  file: File;
  id: string;
}

export function DocumentUploader() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const invalidate = useInvalidateDocuments();
  const inputRef = useRef<HTMLInputElement | null>(null);

  function addFiles(files: File[]) {
    const items: QueueItem[] = files.map((f) => ({ file: f, id: crypto.randomUUID() }));
    setQueue((prev) => [...prev, ...items]);
  }

  function removeFromQueue(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  function validateAndAddFiles(files: FileList | null) {
    if (!files?.length) return;
    const acceptedTypes = Object.keys(ACCEPTED);
    const acceptedExts = Object.values(ACCEPTED).flat();
    const validFiles = Array.from(files).filter((file) => {
      const hasAcceptedType = acceptedTypes.includes(file.type);
      const hasAcceptedExtension = acceptedExts.some((ext) => file.name.toLowerCase().endsWith(ext));
      return (hasAcceptedType || hasAcceptedExtension) && file.size <= 50 * 1024 * 1024;
    });
    if (validFiles.length > 0) addFiles(validFiles);
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          validateAndAddFiles(e.dataTransfer.files);
        }}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-brand-500 bg-brand-500/10"
            : "border-surface-border hover:border-brand-500/50 hover:bg-surface-hover"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={Object.values(ACCEPTED).flat().join(",")}
          onChange={(e) => validateAndAddFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            isDragActive ? "bg-brand-500/20" : "bg-surface-border"
          )}>
            <CloudUpload className={cn("w-6 h-6", isDragActive ? "text-brand-400" : "text-slate-500")} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300">
              {isDragActive ? "Drop files here" : "Drag & drop files, or click to browse"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, DOCX, TXT, CSV · Up to 50 MB each
            </p>
          </div>
        </div>
      </div>

      {/* Upload queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item) => (
            <UploadItem
              key={item.id}
              file={item.file}
              onRemove={() => removeFromQueue(item.id)}
              onComplete={() => {
                removeFromQueue(item.id);
                invalidate();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadItem({
  file,
  onRemove,
  onComplete,
}: {
  file: File;
  onRemove: () => void;
  onComplete: () => void;
}) {
  const { upload, progress, status, error } = useDocumentUpload(() => onComplete());
  const [started, setStarted] = useState(false);

  const start = useCallback(() => {
    setStarted(true);
    upload(file);
  }, [file, upload]);

  useEffect(() => {
    if (!started) start();
  }, [start, started]);

  const pct = progress ?? 0;
  const isDone = status === "ready";
  const isFailed = status === "error" || !!error;
  const uploading = status === "uploading" || status === "processing";

  return (
    <div className="glass rounded-xl p-3 flex items-start gap-3">
      {/* File icon */}
      <div className="w-8 h-8 rounded-lg bg-surface-border flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-slate-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
            {!uploading && !isDone && !isFailed && (
              <button onClick={onRemove} className="text-slate-600 hover:text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {isFailed && <AlertCircle className="w-4 h-4 text-red-400" />}
            {uploading && !progress && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
          </div>
        </div>

        {/* Progress bar */}
        {uploading && !isDone && !isFailed && (
          <div className="mt-2 space-y-1">
            <div className="h-1 w-full bg-surface-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {status === "uploading" ? "Uploading" : "Processing"} — {pct}%
            </p>
          </div>
        )}

        {isDone && (
          <p className="text-xs text-emerald-400 mt-1">Indexed and ready for search</p>
        )}
        {isFailed && (
          <p className="text-xs text-red-400 mt-1">{error ?? "Upload failed"}</p>
        )}
      </div>
    </div>
  );
}
