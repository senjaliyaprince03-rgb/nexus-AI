"use client";

import { LogoMark } from "@/components/brand/LogoMark";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-5 animate-fade-in">
      {/* Avatar */}
      <LogoMark alt="" className="mt-0.5 h-7 w-7 rounded-lg shadow-none" />

      {/* Bouncing dots */}
      <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block"
            style={{
              animation: "pulseDot 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
