"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import { LogoMark } from "@/components/brand/LogoMark";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";
  const hasSources = (message.source_chunks?.length ?? 0) > 0;

  return (
    <div className={cn("flex gap-3 mb-5 animate-fade-in", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
        isUser ? "bg-surface-border" : "bg-gradient-brand"
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-slate-400" />
          : <LogoMark alt="" className="h-7 w-7 rounded-lg shadow-none" />
        }
      </div>

      <div className={cn("max-w-[75%] space-y-2", isUser && "items-end flex flex-col")}>
        {/* Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-brand-600/25 border border-brand-500/30 text-slate-100 rounded-tr-sm"
            : "bg-surface-card border border-surface-border text-slate-200 rounded-tl-sm"
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose-dark">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-brand-400 animate-typing ml-0.5" />
              )}
            </div>
          )}
        </div>

        {/* Sources */}
        {hasSources && !isStreaming && (
          <SourcesAccordion chunks={message.source_chunks!} />
        )}
      </div>
    </div>
  );
}

function SourcesAccordion({ chunks }: { chunks: NonNullable<ChatMessage["source_chunks"]> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {chunks.length} source{chunks.length !== 1 ? "s" : ""}
      </button>

      {open && (
        <div className="mt-2 space-y-2 animate-fade-in">
          {chunks.map((chunk, i) => (
            <div key={chunk.chunk_id} className="bg-surface border border-surface-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-brand-400">
                  [{i + 1}] {chunk.filename}
                </span>
                <span className="text-xs text-slate-600">
                  {(chunk.score * 100).toFixed(0)}% match
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {chunk.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
