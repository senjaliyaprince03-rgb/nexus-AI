"use client"
import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export type LanguageOption = {
  value: string
  label: string
  flag: string
}

interface LanguageSelectorProps {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  options: LanguageOption[]
}

export function LanguageSelector({ label, hint, value, onChange, options }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const selectedOption = options.find((o) => o.value === value) || options[0]

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
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-bold text-[#4B5563] dark:text-zinc-400 mb-2">{label}</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between bg-[#F8F9FA] dark:bg-[#1A1A1A] border rounded-xl px-4 py-3 text-sm transition-all",
          isOpen ? "border-[#C5A059] ring-1 ring-[#C5A059]" : "border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]"
        )}
      >
        <span className="flex items-center gap-2 text-[#18181B] dark:text-zinc-300">
          <span className="relative flex items-center justify-center w-5 h-5 rounded-full shadow-sm border border-[rgba(0,0,0,0.1)] overflow-hidden flex-shrink-0">
            {selectedOption && (
              <Image 
                src={`https://flagcdn.com/w40/${selectedOption.flag}.png`} 
                alt={selectedOption.label} 
                fill 
                className="object-cover" 
                unoptimized 
              />
            )}
          </span>
          {selectedOption?.label}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 overflow-hidden bg-white dark:bg-[#18181A] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className="flex w-full items-center justify-between px-4 py-3 text-sm text-[#18181B] dark:text-zinc-300 hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2D] transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="relative flex items-center justify-center w-5 h-5 rounded-full shadow-sm border border-[rgba(0,0,0,0.1)] overflow-hidden flex-shrink-0">
                  <Image 
                    src={`https://flagcdn.com/w40/${option.flag}.png`} 
                    alt={option.label} 
                    fill 
                    className="object-cover" 
                    unoptimized 
                  />
                </span>
                {option.label}
              </span>
              {value === option.value && <Check className="w-4 h-4 text-[#C5A059]" />}
            </button>
          ))}
        </div>
      )}
      
      {hint && <p className="text-xs text-[#9CA3AF] mt-2">{hint}</p>}
    </div>
  )
}
