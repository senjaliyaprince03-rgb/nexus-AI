import { create } from "zustand"

interface UIState {
  isAntigravetiyOpen: boolean
  openAntigravetiy: () => void
  closeAntigravetiy: () => void
  toggleAntigravetiy: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isAntigravetiyOpen: false,
  openAntigravetiy: () => set({ isAntigravetiyOpen: true }),
  closeAntigravetiy: () => set({ isAntigravetiyOpen: false }),
  toggleAntigravetiy: () => set((state) => ({ isAntigravetiyOpen: !state.isAntigravetiyOpen })),
}))
