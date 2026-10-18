'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import { format } from 'date-fns'

export interface BibleStudyReflection {
  learned: string
  positivesToImitate: string
  errorsToAvoid: string
  aboutGod: string
  application: string
  prayer: string
}

export interface BibleStudySession {
  id: string
  characterId: string
  date: string           // YYYY-MM-DD
  startedAt: string      // ISO
  completedAt?: string   // ISO
  durationMin: number    // real minutes
  passagesRead: string[]
  reflection: BibleStudyReflection
  status: 'in-progress' | 'completed'
}

export interface DailyCharacterPick {
  date: string           // YYYY-MM-DD
  characterId: string
  spinCount: number      // how many times spun that day
}

const genId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
const today = () => format(new Date(), 'yyyy-MM-dd')

interface BiblicalStore {
  // Daily pick
  dailyPick: DailyCharacterPick | null
  // Study sessions
  sessions: BibleStudySession[]
  // Active session (in progress)
  activeSessionId: string | null
  // Favorites
  favoriteCharacters: string[]

  // Actions
  spinWheel: (characterId: string) => void
  forceNewCharacter: (characterId: string) => void

  startStudy: (characterId: string) => string
  updateSession: (id: string, updates: Partial<BibleStudySession>) => void
  completeSession: (id: string, reflection: BibleStudyReflection, passagesRead: string[], durationMin: number) => void
  deleteSession: (id: string) => void

  toggleFavorite: (characterId: string) => void

  // Computed
  getTodayPick: () => DailyCharacterPick | null
  getSessionByCharacter: (characterId: string) => BibleStudySession[]
  getCompletedSessions: () => BibleStudySession[]
  getStudiedCharacterIds: () => string[]
  getStreak: () => number
  getTotalMinutes: () => number
  getWeeklyStudyDays: () => string[]
  _reset: () => void
}

export const useBiblicalStore = create<BiblicalStore>()(
  persist(
    (set, get) => ({
      dailyPick: null,
      sessions: [],
      activeSessionId: null,
      favoriteCharacters: [],

      spinWheel: (characterId) => {
        const t = today()
        const existing = get().dailyPick
        if (existing?.date === t) {
          set({ dailyPick: { ...existing, characterId, spinCount: existing.spinCount + 1 } })
        } else {
          set({ dailyPick: { date: t, characterId, spinCount: 1 } })
        }
      },

      forceNewCharacter: (characterId) => {
        const t = today()
        set({ dailyPick: { date: t, characterId, spinCount: (get().dailyPick?.spinCount ?? 0) + 1 } })
      },

      startStudy: (characterId) => {
        const id = genId()
        const session: BibleStudySession = {
          id,
          characterId,
          date: today(),
          startedAt: new Date().toISOString(),
          durationMin: 0,
          passagesRead: [],
          reflection: { learned: '', positivesToImitate: '', errorsToAvoid: '', aboutGod: '', application: '', prayer: '' },
          status: 'in-progress',
        }
        set(s => ({ sessions: [...s.sessions, session], activeSessionId: id }))
        return id
      },

      updateSession: (id, updates) => {
        set(s => ({
          sessions: s.sessions.map(se => se.id === id ? { ...se, ...updates } : se),
        }))
      },

      completeSession: (id, reflection, passagesRead, durationMin) => {
        set(s => ({
          sessions: s.sessions.map(se =>
            se.id === id
              ? { ...se, reflection, passagesRead, durationMin, completedAt: new Date().toISOString(), status: 'completed' }
              : se
          ),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        }))
      },

      deleteSession: (id) => {
        set(s => ({
          sessions: s.sessions.filter(se => se.id !== id),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        }))
      },

      toggleFavorite: (characterId) => {
        const favs = get().favoriteCharacters
        if (favs.includes(characterId)) {
          set({ favoriteCharacters: favs.filter(f => f !== characterId) })
        } else {
          set({ favoriteCharacters: [...favs, characterId] })
        }
      },

      getTodayPick: () => {
        const pick = get().dailyPick
        return pick?.date === today() ? pick : null
      },

      getSessionByCharacter: (characterId) =>
        get().sessions.filter(s => s.characterId === characterId),

      getCompletedSessions: () =>
        get().sessions.filter(s => s.status === 'completed'),

      getStudiedCharacterIds: () => {
        const ids = new Set(get().sessions.filter(s => s.status === 'completed').map(s => s.characterId))
        return Array.from(ids)
      },

      getStreak: () => {
        const completed = get().sessions.filter(s => s.status === 'completed')
        const days = new Set(completed.map(s => s.date))
        const t = today()
        const hasToday = days.has(t)
        let streak = 0
        for (let i = hasToday ? 0 : 1; i < 365; i++) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = format(d, 'yyyy-MM-dd')
          if (days.has(key)) streak++
          else break
        }
        return streak
      },

      getTotalMinutes: () =>
        get().sessions.filter(s => s.status === 'completed').reduce((a, s) => a + s.durationMin, 0),

      getWeeklyStudyDays: () => {
        const completed = get().sessions.filter(s => s.status === 'completed')
        const days = new Set(completed.map(s => s.date))
        const result: string[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = format(d, 'yyyy-MM-dd')
          if (days.has(key)) result.push(key)
        }
        return result
      },

      _reset: () => set({ dailyPick: null, sessions: [], activeSessionId: null, favoriteCharacters: [] }),
    }),
    { name: 'kingdom-biblical', storage: userStorage }
  )
)
