'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

export type SeasonMode = 'guerra' | 'monje'

export interface SeasonGoals {
  pomodorosPerDay: number
  workoutsPerWeek: number
  mealsPerDay: number
  tasksPerDay: number
  spiritualDaily: boolean
}

export interface DayLog {
  date: string
  pomodoros: number
  tasksCompleted: number
  workedOut: boolean
  meals: number
  spiritual: boolean
  score: number
}

export interface Season {
  id: string
  mode: SeasonMode
  name: string
  startDate: string
  endDate: string
  goals: SeasonGoals
  dayLogs: DayLog[]
  active: boolean
}

export const MODE_DEFAULTS: Record<SeasonMode, { label: string; color: string; bg: string; accent: string; goals: SeasonGoals; desc: string; pillars: string[] }> = {
  guerra: {
    label: 'Modo Guerra',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.06)',
    accent: 'rgba(239,68,68,0.15)',
    desc: 'Sprint de máxima disciplina. Sin excusas, sin días libres de la mentalidad. Inspirado en Goggins, Hormozi y Jocko.',
    pillars: ['6+ pomodoros/día', '6 entrenos/semana', '5 comidas/día', '5 tareas completadas', 'Práctica espiritual diaria'],
    goals: { pomodorosPerDay: 6, workoutsPerWeek: 6, mealsPerDay: 5, tasksPerDay: 5, spiritualDaily: true },
  },
  monje: {
    label: 'Modo Monje',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.06)',
    accent: 'rgba(139,92,246,0.15)',
    desc: 'Profundidad sobre velocidad. Trabajo profundo, silencio y contemplación. Inspirado en Cal Newport y la tradición monástica.',
    pillars: ['8 sesiones deep work/día', '4 entrenos/semana', '3 comidas enfocadas', '3 tareas de alto impacto', 'Práctica espiritual diaria'],
    goals: { pomodorosPerDay: 8, workoutsPerWeek: 4, mealsPerDay: 3, tasksPerDay: 3, spiritualDaily: true },
  },
}

const genId = () => Math.random().toString(36).slice(2, 9)

interface SeasonStore {
  seasons: Season[]
  activeSeason: Season | null

  startSeason: (mode: SeasonMode, months: number, name?: string) => void
  endSeason: () => void
  logDay: (date: string, log: Omit<DayLog, 'date' | 'score'>) => void
  getSeasonProgress: () => { daysPassed: number; daysTotal: number; pct: number } | null
  getDayLog: (date: string) => DayLog | undefined
  getStreakCount: () => number
  _reset: () => void
}

export const useSeasonStore = create<SeasonStore>()(
  persist(
    (set, get) => ({
      seasons: [],
      activeSeason: null,

      startSeason: (mode, months, name) => {
        const start = new Date()
        const end = new Date(start)
        end.setMonth(end.getMonth() + months)
        const season: Season = {
          id: genId(),
          mode,
          name: name ?? MODE_DEFAULTS[mode].label,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          goals: { ...MODE_DEFAULTS[mode].goals },
          dayLogs: [],
          active: true,
        }
        set(s => ({
          seasons: [...s.seasons, season],
          activeSeason: season,
        }))
      },

      endSeason: () => {
        const { activeSeason } = get()
        if (!activeSeason) return
        const updated = { ...activeSeason, active: false }
        set(s => ({
          seasons: s.seasons.map(s2 => s2.id === updated.id ? updated : s2),
          activeSeason: null,
        }))
      },

      logDay: (date, log) => {
        const { activeSeason } = get()
        if (!activeSeason) return
        const goals = activeSeason.goals
        const score = Math.round(
          (Math.min(1, log.pomodoros / goals.pomodorosPerDay) * 30) +
          (log.workedOut ? 25 : 0) +
          (Math.min(1, log.meals / goals.mealsPerDay) * 20) +
          (Math.min(1, log.tasksCompleted / goals.tasksPerDay) * 15) +
          (log.spiritual ? 10 : 0)
        )
        const dayLog: DayLog = { date, ...log, score }
        const existing = activeSeason.dayLogs.findIndex(d => d.date === date)
        const newLogs = existing >= 0
          ? activeSeason.dayLogs.map((d, i) => i === existing ? dayLog : d)
          : [...activeSeason.dayLogs, dayLog]
        const updated = { ...activeSeason, dayLogs: newLogs }
        set(s => ({
          activeSeason: updated,
          seasons: s.seasons.map(s2 => s2.id === updated.id ? updated : s2),
        }))
      },

      getSeasonProgress: () => {
        const { activeSeason } = get()
        if (!activeSeason) return null
        const now = Date.now()
        const start = new Date(activeSeason.startDate).getTime()
        const end = new Date(activeSeason.endDate).getTime()
        const daysTotal = Math.ceil((end - start) / 86400000)
        const daysPassed = Math.min(daysTotal, Math.ceil((now - start) / 86400000))
        return { daysPassed, daysTotal, pct: Math.round((daysPassed / daysTotal) * 100) }
      },

      getDayLog: (date) => get().activeSeason?.dayLogs.find(d => d.date === date),

      getStreakCount: () => {
        const { activeSeason } = get()
        if (!activeSeason) return 0
        let streak = 0
        for (let i = 0; i < 365; i++) {
          const d = new Date(); d.setDate(d.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          const log = activeSeason.dayLogs.find(dl => dl.date === key)
          if (log && log.score >= 60) streak++
          else break
        }
        return streak
      },

      _reset: () => set({ seasons: [], activeSeason: null }),
    }),
    { name: 'kingdom-season', storage: userStorage }
  )
)
