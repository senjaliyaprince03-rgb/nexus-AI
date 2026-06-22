import { create } from "zustand"
import { persist } from "zustand/middleware"

interface PreferencesState {
  telemetryEnabled: boolean
  setTelemetryEnabled: (enabled: boolean) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      telemetryEnabled: true,
      setTelemetryEnabled: (enabled) => set({ telemetryEnabled: enabled }),
    }),
    {
      name: "nexusai-preferences",
    }
  )
)
