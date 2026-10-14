import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

export interface VisionItem {
  id: string
  title: string
  date: string
  done: boolean
}

interface VisionStore {
  visionText: string
  shortTerm: VisionItem[]
  longTerm: VisionItem[]
  setText: (t: string) => void
  addItem: (type: 'short' | 'long', title: string, date: string) => void
  toggleItem: (type: 'short' | 'long', id: string) => void
  removeItem: (type: 'short' | 'long', id: string) => void
  updateItem: (type: 'short' | 'long', id: string, title: string, date: string) => void
}

const genId = () => Math.random().toString(36).slice(2)

export const useVisionStore = create<VisionStore>()(
  persist(
    (set) => ({
      visionText: '',
      shortTerm: [],
      longTerm: [],

      setText: (t) => set({ visionText: t }),

      addItem: (type, title, date) => set(s => {
        const item: VisionItem = { id: genId(), title, date, done: false }
        return type === 'short'
          ? { shortTerm: [...s.shortTerm, item] }
          : { longTerm: [...s.longTerm, item] }
      }),

      toggleItem: (type, id) => set(s => {
        const key = type === 'short' ? 'shortTerm' : 'longTerm'
        return { [key]: s[key].map(i => i.id === id ? { ...i, done: !i.done } : i) }
      }),

      removeItem: (type, id) => set(s => {
        const key = type === 'short' ? 'shortTerm' : 'longTerm'
        return { [key]: s[key].filter(i => i.id !== id) }
      }),

      updateItem: (type, id, title, date) => set(s => {
        const key = type === 'short' ? 'shortTerm' : 'longTerm'
        return { [key]: s[key].map(i => i.id === id ? { ...i, title, date } : i) }
      }),
    }),
    { name: 'kingdom-vision', storage: userStorage }
  )
)
