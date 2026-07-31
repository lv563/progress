import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, XPTransaction } from '@/types'

interface XPEvent {
  id: string
  amount: number
  reason: string
  visible: boolean
}

interface AppStore {
  // UI
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  activeModal: string | null
  theme: 'light' | 'dark'
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setActiveModal: (modal: string | null) => void
  setTheme: (t: 'light' | 'dark') => void

  // User
  user: User | null
  setUser: (user: User) => void
  logout: () => void

  // Gamification
  xpEvents: XPEvent[]
  levelUpVisible: boolean
  levelUpData: { oldLevel: number; newLevel: number; title: string } | null
  addXP: (amount: number, reason: string) => void
  dismissXPEvent: (id: string) => void
  dismissLevelUp: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // UI
      sidebarOpen: true,
      commandPaletteOpen: false,
      activeModal: null,
      theme: 'light',
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setActiveModal: (modal) => set({ activeModal: modal }),
      setTheme: (t) => set({ theme: t }),

      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),

      // Gamification
      xpEvents: [],
      levelUpVisible: false,
      levelUpData: null,
      addXP: (amount, reason) => {
        const id = Math.random().toString(36).slice(2)
        set(s => ({
          xpEvents: [...s.xpEvents, { id, amount, reason, visible: true }],
          user: s.user ? { ...s.user, xp: s.user.xp + amount } : s.user,
        }))
        // auto-dismiss after 2s
        setTimeout(() => {
          set(s => ({ xpEvents: s.xpEvents.filter(e => e.id !== id) }))
        }, 2000)
      },
      dismissXPEvent: (id) => set(s => ({ xpEvents: s.xpEvents.filter(e => e.id !== id) })),
      dismissLevelUp: () => set({ levelUpVisible: false, levelUpData: null }),
    }),
    { name: 'kingdom-app', partialize: (s) => ({ sidebarOpen: s.sidebarOpen, user: s.user, theme: s.theme }) }
  )
)
