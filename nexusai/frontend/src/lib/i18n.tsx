"use client"

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react"
import { useI18nStore } from "@/store/i18nStore"
import { translations, type Language, type TranslationKey } from "@/locales/translations"

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  mounted: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function LanguageProvider({
  children,
  initialLanguage = "en",
}: {
  children: ReactNode
  initialLanguage?: Language
}) {
  const storeLanguage = useI18nStore((state) => state.language)
  const setLanguage = useI18nStore((state) => state.setLanguage)
  const [mounted, setMounted] = useState(false)
  const syncedInitialLanguage = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (syncedInitialLanguage.current) return
    syncedInitialLanguage.current = true
    setLanguage(initialLanguage)
  }, [initialLanguage, setLanguage])

  const language = mounted ? storeLanguage : initialLanguage

  const value = useMemo<I18nContextType>(() => ({
    language,
    setLanguage,
    t: (key: string) => {
      const translationKey = key as TranslationKey
      return translations[language][translationKey] || translations.en[translationKey] || key
    },
    mounted,
  }), [language, mounted, setLanguage])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    return { language: "en" as Language, setLanguage: () => {}, t: (k: string) => k, mounted: false }
  }
  return context
}
