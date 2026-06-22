"use client"
import React, { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { THEMES } from "@/lib/themeData"
import { Check } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function ThemeGallery() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeTheme = mounted ? theme || resolvedTheme || "system" : "system"
  const labelForTheme = (id: string, fallback: string) => {
    if (id === "system") return t("settings.theme.auto")
    if (id === "light") return t("settings.theme.light")
    if (id === "dark") return t("settings.theme.dark")
    return fallback
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-[#18181B] dark:text-zinc-200">
        {t("settings.theme.premiumThemes")}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto p-2 -mx-2">
        {THEMES.filter(t => t.id !== "system" && t.id !== "light" && t.id !== "dark").map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "group relative flex flex-col items-start gap-2 rounded-2xl border-2 transition-all overflow-hidden bg-white dark:bg-black text-left",
              activeTheme === t.id
                ? "border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                : "border-transparent hover:border-[rgba(0,0,0,0.1)] dark:hover:border-[rgba(255,255,255,0.1)] shadow-sm hover:shadow-md"
            )}
          >
            <div className="relative w-full aspect-video bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
              {t.bgUrl && (
                <Image
                  src={t.bgUrl}
                  alt={t.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  unoptimized
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
              {activeTheme === t.id && (
                <div className="absolute top-2 right-2 bg-[#D4AF37] text-white p-1 rounded-full shadow-lg">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="w-full px-3 pb-3 pt-1">
              <span className="text-xs font-semibold text-[#18181B] dark:text-zinc-200 line-clamp-1">
                {t.name}
              </span>
            </div>
          </button>
        ))}
      </div>
      
      {/* Standard Themes */}
      <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
        <label className="block text-xs font-bold text-[#4B5563] dark:text-zinc-400 mb-3">
          {t("settings.theme.standardThemes")}
        </label>
        <div className="flex flex-wrap gap-2">
          {["system", "light", "dark"].map((id) => {
            const t = THEMES.find(t => t.id === id)
            if (!t) return null
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-semibold border transition-all",
                  activeTheme === id
                    ? "bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] border-transparent"
                    : "bg-white dark:bg-[#1A1A1A] border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[#4B5563] dark:text-zinc-300 hover:border-[#D4AF37]"
                )}
              >
                {labelForTheme(id, t.name)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
