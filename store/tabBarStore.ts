import { create } from 'zustand'

interface TabBarState {
  scrolledDown: boolean
  setScrolledDown: (v: boolean) => void
}

export const useTabBarStore = create<TabBarState>((set) => ({
  scrolledDown: false,
  setScrolledDown: (scrolledDown) => set({ scrolledDown }),
}))
