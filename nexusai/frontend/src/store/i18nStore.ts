import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { useState, useEffect } from "react"
import { translations, Language, TranslationKey } from "@/locales/translations"
import { getSafeLocalStorage } from "@/lib/storage"

interface I18nState {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

function persistLanguageCookie(language: Language) {
  if (typeof document === "undefined") return
  document.cookie = `nexusai-language=${language}; path=/; max-age=31536000; SameSite=Lax`
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: "en",
      setLanguage: (lang) => {
        persistLanguageCookie(lang)
        set({ language: lang })
      },
      t: (key) => {
        const lang = get().language
        // Fallback to English if translation is missing
        return translations[lang][key] || translations["en"][key] || key
      },
    }),
    {
      name: "nexusai-i18n",
      storage: createJSONStorage(() => getSafeLocalStorage()),
      partialize: (state) => ({ language: state.language }),
    }
  )
)

export function useSafeTranslation() {
  const [mounted, setMounted] = useState(false)
  const language = useI18nStore((state) => state.language)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeLanguage = mounted ? language : "en"

  return {
    t: (key: TranslationKey) => {
      return translations[activeLanguage][key] || translations["en"][key] || key
    },
    mounted
  }
}
