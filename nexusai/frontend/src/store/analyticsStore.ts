import { create } from "zustand";

interface AnalyticsState {
  liveEvents: number;
  lastEvent: string | null;
  incrementLiveEvent: (event?: string) => void;
  reset: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  liveEvents: 0,
  lastEvent: null,
  incrementLiveEvent: (event) =>
    set((s) => ({ liveEvents: s.liveEvents + 1, lastEvent: event ?? null })),
  reset: () => set({ liveEvents: 0, lastEvent: null }),
}));
