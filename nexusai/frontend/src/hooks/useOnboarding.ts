"use client"

import { useState, useEffect, useCallback } from "react"
import { getSafeLocalStorage } from "@/lib/storage"

const STORAGE_KEY = "nexusai-onboarding-completed"

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Only show if the user has NOT completed onboarding yet
    const completed = getSafeLocalStorage().getItem(STORAGE_KEY)
    if (!completed) {
      setShowOnboarding(true)
    }
  }, [])

  const completeOnboarding = useCallback(() => {
    getSafeLocalStorage().setItem(STORAGE_KEY, "true")
    setShowOnboarding(false)
  }, [])

  return { showOnboarding, completeOnboarding }
}
