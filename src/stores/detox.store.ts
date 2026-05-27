import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

export interface DetoxRelapse {
  id: string
  date: string
  note?: string
}

export interface DetoxHabit {
  id: string
  name: string
  icon: string
  description?: string
  color: string
  startDate: string
  targetDays?: number
  relapses: DetoxRelapse[]
  createdAt: string
}

interface DetoxStore {
  habits: DetoxHabit[]
  addHabit: (h: Omit<DetoxHabit, 'id' | 'relapses' | 'createdAt' | 'startDate'>) => void
  deleteHabit: (id: string) => void
  relapse: (id: string, note?: string) => void
  _reset: () => void
}

const genId = () => Math.random().toString(36).slice(2, 9)

export const useDetoxStore = create<DetoxStore>()(
  persist(
    (set) => ({
      habits: [],

      _reset: () => set({ habits: [] }),

      addHabit: (h) => {
        const now = new Date().toISOString()
        set(s => ({
          habits: [...s.habits, { ...h, id: genId(), startDate: now, relapses: [], createdAt: now }],
        }))
      },

      deleteHabit: (id) => set(s => ({ habits: s.habits.filter(h => h.id !== id) })),

      relapse: (id, note) => {
        const now = new Date().toISOString()
        set(s => ({
          habits: s.habits.map(h =>
            h.id === id
              ? { ...h, startDate: now, relapses: [...h.relapses, { id: genId(), date: now, note }] }
              : h
          ),
        }))
      },
    }),
    { name: 'kingdom-detox', storage: userStorage }
  )
)
