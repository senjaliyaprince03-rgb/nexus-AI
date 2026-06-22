"use client"
import React, { useState, useRef, useEffect } from "react"
import { useI18nStore } from "@/store/i18nStore"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Language } from "@/locales/translations"

const languages: { code: Language; country: string; label: string }[] = [
  { code: "en", country: "us", label: "English" },
  { code: "es", country: "es", label: "Español" },
  { code: "fr", country: "fr", label: "Français" },
  { code: "de", country: "de", label: "Deutsch" },
]

interface CircularLanguageDropdownProps {
  className?: string
}

export function CircularLanguageDropdown({ className }: CircularLanguageDropdownProps) {
  const { language, setLanguage } = useI18nStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeLang = languages.find((l) => l.code === language) || languages[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border border-[var(--landing-border)] bg-[var(--landing-surface)] hover:border-[var(--landing-border-soft)] shadow-sm transition-all outline-none"
        title="Change Language"
      >
        <div className="relative w-6 h-6 rounded-full overflow-hidden">
          <Image
            src={`https://flagcdn.com/w40/${activeLang.country}.png`}
            alt={activeLang.label}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#18181A] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-100 z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code)
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#18181B] dark:text-zinc-300 hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2D] transition-colors"
            >
              <div className="relative w-5 h-5 rounded-full overflow-hidden border border-[rgba(0,0,0,0.1)] flex-shrink-0">
                <Image
                  src={`https://flagcdn.com/w40/${lang.country}.png`}
                  alt={lang.label}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className="font-medium">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
