"use client";

import { Plus } from "lucide-react";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";

export function SessionList() {
  const { sessions, activeSessionId, setActiveSession, reset } = useChatStore();

  function handleNew() {
    setActiveSession(null);
    reset();
  }

  return (
    <aside className="glass hidden h-full w-56 shrink-0 flex-col border-r border-[#F8F9FA]/10 lg:flex">
      <div className="border-b border-[#F8F9FA]/8 p-3">
        <button onClick={handleNew} className="btn-primary w-full justify-center text-xs py-2">
          <Plus className="w-3.5 h-3.5" />
          New chat
        </button>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center mt-6 px-3">
            No conversations yet. Ask anything!
          </p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s.id)}
              className={cn(
                "w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                activeSessionId === s.id
                  ? "bg-amber-400/10 text-brand-300 ring-1 ring-amber-400/14"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <p className="font-medium truncate text-xs leading-tight">
                {truncate(s.title ?? "New conversation", 38)}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {formatRelativeTime(s.created_at)}
              </p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
