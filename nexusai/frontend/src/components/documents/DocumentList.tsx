"use client";

import { useState } from "react";
import { Loader2, FileX, ChevronLeft, ChevronRight } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentCard } from "./DocumentCard";

export function DocumentList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useDocuments(page);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileX className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm text-slate-500">Failed to load documents</p>
      </div>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileX className="w-8 h-8 text-slate-600 mb-3" />
        <p className="text-sm font-medium text-slate-400">No documents yet</p>
        <p className="text-xs text-slate-600 mt-1">Upload a file above to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {total} document{total !== 1 ? "s" : ""}
          {" · "}
          {items.filter((d) => d.status === "ready").length} ready
        </span>
        {pages > 1 && (
          <span>Page {page} of {pages}</span>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {items.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost py-1.5 px-2.5 text-xs disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn-ghost py-1.5 px-2.5 text-xs disabled:opacity-30"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
