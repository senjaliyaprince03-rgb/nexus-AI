import { create } from "zustand"
import { persist } from "zustand/middleware"
import { translations, Language, TranslationKey } from "@/locales/translations"

interface I18nState {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: "en",
      setLanguage: (lang) => set({ language: lang }),
      t: (key) => {
        const lang = get().language
        // Fallback to English if translation is missing
        return translations[lang][key] || translations["en"][key] || key
      },
    }),
    {
      name: "nexusai-i18n",
    }
  )
)
