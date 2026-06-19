"use client";

import { FileText, CheckCircle2, Layers, HardDrive } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { formatBytes } from "@/lib/utils";

export function DocumentStats() {
  const { data } = useDocuments(1, 100);
  const items = data?.items ?? [];

  const totalSize = items.reduce((sum, d) => sum + d.file_size_bytes, 0);
  const totalChunks = items.reduce((sum, d) => sum + d.chunk_count, 0);
  const readyCount = items.filter((d) => d.status === "ready").length;

  const stats = [
    { icon: FileText,     label: "Total docs",     value: String(data?.total ?? 0) },
    { icon: CheckCircle2, label: "Ready",           value: String(readyCount) },
    { icon: Layers,       label: "Indexed chunks",  value: totalChunks.toLocaleString() },
    { icon: HardDrive,    label: "Storage used",    value: formatBytes(totalSize) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="card flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-100 leading-tight">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
