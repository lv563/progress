'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import { format } from 'date-fns'

export interface DevotionalLog { date: string; completed: boolean; notes?: string }
export interface PrayerLog     { date: string; count: number }
export type FastType = 'daniel' | 'una-comida' | 'redes'

export interface Fast {
  id: string
  weekDate: string        // ISO start date
  dayOfWeek: number       // 0-6 (kept for backward compat)
  days: number            // duration in days (default 1)
  type: FastType          // kind of fast
  purpose: string
  completed: boolean
}

const genId = () => Math.random().toString(36).slice(2, 9)

interface SpiritualStore {
  devotionals: DevotionalLog[]
  prayerLogs: PrayerLog[]
  fasts: Fast[]

  markDevotional: (date: string, notes?: string) => void
  unmarkDevotional: (date: string) => void
  setPrayerCount: (date: string, count: number) => void
  addPrayer: (date: string) => void
  addFast: (weekDate: string, dayOfWeek: number, purpose: string, type?: FastType, days?: number) => void
  completeFast: (id: string) => void
  deleteFast: (id: string) => void
  updateFastPurpose: (id: string, purpose: string) => void

  getTodayDevotion: () => DevotionalLog | undefined
  getTodayPrayers: () => number
  getDevotionalStreak: () => number
  getPrayerStreak: () => number
  getThisWeekFast: () => Fast | undefined
  _reset: () => void
}

export const useSpiritualStore = create<SpiritualStore>()(
  persist(
    (set, get) => ({
      devotionals: [],
      prayerLogs: [],
      fasts: [],

      markDevotional: (date, notes) => {
        const existing = get().devotionals.find(d => d.date === date)
        if (existing) {
          set(s => ({ devotionals: s.devotionals.map(d => d.date === date ? { ...d, completed: true, notes: notes ?? d.notes } : d) }))
        } else {
          set(s => ({ devotionals: [...s.devotionals, { date, completed: true, notes }] }))
        }
      },

      unmarkDevotional: (date) => {
        set(s => ({ devotionals: s.devotionals.map(d => d.date === date ? { ...d, completed: false } : d) }))
      },

      setPrayerCount: (date, count) => {
        const existing = get().prayerLogs.find(p => p.date === date)
        if (existing) {
          set(s => ({ prayerLogs: s.prayerLogs.map(p => p.date === date ? { ...p, count } : p) }))
        } else {
          set(s => ({ prayerLogs: [...s.prayerLogs, { date, count }] }))
        }
      },

      addPrayer: (date) => {
        const existing = get().prayerLogs.find(p => p.date === date)
        if (existing) {
          set(s => ({ prayerLogs: s.prayerLogs.map(p => p.date === date ? { ...p, count: p.count + 1 } : p) }))
        } else {
          set(s => ({ prayerLogs: [...s.prayerLogs, { date, count: 1 }] }))
        }
      },

      addFast: (weekDate, dayOfWeek, purpose, type = 'una-comida', days = 1) => {
        set(s => ({ fasts: [...s.fasts, { id: genId(), weekDate, dayOfWeek, purpose, type, days, completed: false }] }))
      },

      completeFast: (id) => {
        set(s => ({ fasts: s.fasts.map(f => f.id === id ? { ...f, completed: true } : f) }))
      },

      deleteFast: (id) => {
        set(s => ({ fasts: s.fasts.filter(f => f.id !== id) }))
      },

      updateFastPurpose: (id, purpose) => {
        set(s => ({ fasts: s.fasts.map(f => f.id === id ? { ...f, purpose } : f) }))
      },

      getTodayDevotion: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return get().devotionals.find(d => d.date === today)
      },

      getTodayPrayers: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return get().prayerLogs.find(p => p.date === today)?.count ?? 0
      },

      getDevotionalStreak: () => {
        let streak = 0
        for (let i = 0; i < 365; i++) {
          const d = new Date(); d.setDate(d.getDate() - i)
          const key = format(d, 'yyyy-MM-dd')
          const log = get().devotionals.find(dv => dv.date === key)
          if (log?.completed) streak++
          else break
        }
        return streak
      },

      getPrayerStreak: () => {
        let streak = 0
        for (let i = 0; i < 365; i++) {
          const d = new Date(); d.setDate(d.getDate() - i)
          const key = format(d, 'yyyy-MM-dd')
          const log = get().prayerLogs.find(p => p.date === key)
          if (log && log.count > 0) streak++
          else break
        }
        return streak
      },

      getThisWeekFast: () => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        // Return the first fast that is currently active (today within its date range)
        // or started this week
        const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay())
        const endOfWeek   = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6)
        return get().fasts.find(f => {
          const start = new Date(f.weekDate); start.setHours(0, 0, 0, 0)
          const end   = new Date(start); end.setDate(start.getDate() + (f.days ?? 1) - 1)
          // active today, or started this week
          return (start <= today && today <= end) || (start >= startOfWeek && start <= endOfWeek)
        })
      },

      _reset: () => set({ devotionals: [], prayerLogs: [], fasts: [] }),
    }),
    { name: 'kingdom-spiritual', storage: userStorage }
  )
)
