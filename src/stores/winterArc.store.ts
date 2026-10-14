'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

const genId = () => Math.random().toString(36).slice(2, 9)

export interface WinterRule {
  id: string
  text: string
  active: boolean
}

export interface WinterTransformationGoal {
  area: string
  icon: string
  vision: string
  enabled: boolean
}

export interface WinterSnapshot {
  weight?: number
  sleepHoursPerDay?: number
  socialMediaMinutesPerDay?: number
  studyHoursPerDay?: number
  savedAmount?: number
  debtAmount?: number
  notes?: string
}

export interface WinterDayLog {
  date: string
  score: number
  fitness: boolean
  spiritual: boolean
  career: boolean
  finance: boolean
  digital: boolean
  mental: boolean
  xpEarned: number
  note?: string
}

export interface WinterWeeklyReview {
  weekNumber: number
  date: string
  avgScore: number
  bestArea: string
  weakestArea: string
  coldDays: number
  xpEarned: number
  whatWentWell: string
  whatWasDifficult: string
  whatToImprove: string
}

export interface WinterAchievement {
  id: string
  label: string
  description: string
  icon: string
  unlockedAt?: string
}

export interface WinterScoreWeights {
  fitness: number
  spiritual: number
  mental: number
  career: number
  digital: number
  finance: number
}

export interface WinterArcConfig {
  duration: 30 | 60 | 90
  startDate: string
  endDate: string
  mainGoal: string
  secondaryGoals: string[]
  habitsToBuilt: string[]
  habitsToEliminate: string[]
  rules: WinterRule[]
  identityStatement: string
  coldDayThreshold: number
  socialMediaBaselineMinutes: number
  socialMediaTargetMinutes: number
  scoreWeights: WinterScoreWeights
  transformationGoals: WinterTransformationGoal[]
  snapshot: WinterSnapshot
}

export const DEFAULT_TRANSFORMATION_GOALS: WinterTransformationGoal[] = [
  { area: 'Forma de vestir', icon: '👔', vision: 'Desarrollar un estilo propio que refleje la persona en la que me estoy convirtiendo.', enabled: true },
  { area: 'Físico', icon: '💪', vision: 'Transformar mi físico mediante entrenamiento, alimentación y constancia.', enabled: true },
  { area: 'Espiritualidad', icon: '✝️', vision: 'Fortalecer mi relación con Dios mediante oración y lectura bíblica diaria.', enabled: true },
  { area: 'Confianza', icon: '🦁', vision: 'Construir seguridad en mí mismo cumpliendo lo que me prometo.', enabled: true },
  { area: 'Familia', icon: '🏠', vision: 'Convertirme en una persona más presente y útil para mi familia.', enabled: true },
  { area: 'Finanzas', icon: '💰', vision: 'Alcanzar disciplina financiera y construir ahorro consistente.', enabled: true },
]

export const DEFAULT_RULES: WinterRule[] = [
  { id: genId(), text: 'No redes sociales antes de las 7 PM', active: true },
  { id: genId(), text: 'Máximo 20 minutos de redes al día', active: true },
  { id: genId(), text: 'No pornografía', active: true },
  { id: genId(), text: 'Entrenar 5 días por semana', active: true },
  { id: genId(), text: 'Dormir antes de las 11 PM', active: true },
  { id: genId(), text: '2 litros de agua diarios', active: true },
  { id: genId(), text: 'Estudiar mínimo 2 horas', active: true },
  { id: genId(), text: 'Leer la Biblia diariamente', active: true },
]

const DEFAULT_ACHIEVEMENTS: WinterAchievement[] = [
  { id: 'first_day', label: 'First Day', description: 'Día 1 completado', icon: '❄️' },
  { id: 'streak_7', label: '7 Day Streak', description: '7 días consecutivos', icon: '🔥' },
  { id: 'streak_14', label: '14 Cold Days', description: '14 días consecutivos de disciplina', icon: '⚡' },
  { id: 'workouts_20', label: '20 Workouts', description: '20 sesiones de entrenamiento', icon: '💪' },
  { id: 'study_50h', label: '50 Hours Studied', description: 'Acumuladas 50 horas de estudio', icon: '📚' },
  { id: 'devotionals_30', label: '30 Devotionals', description: '30 días de práctica espiritual', icon: '✝️' },
  { id: 'digital_14', label: 'Digital Discipline', description: '14 días de disciplina digital', icon: '📵' },
  { id: 'consistent_30', label: '30 Days Consistent', description: '30 días registrados', icon: '🗓️' },
  { id: 'cold_month', label: 'Cold Month', description: '30 días consecutivos Cold', icon: '🏆' },
  { id: 'winter_survivor', label: 'Winter Survivor', description: 'Winter Arc completado', icon: '🏅' },
]

interface WinterArcStore {
  isActive: boolean
  config: WinterArcConfig | null
  dayLogs: WinterDayLog[]
  weeklyReviews: WinterWeeklyReview[]
  achievements: WinterAchievement[]

  activate: (config: WinterArcConfig) => void
  deactivate: () => void
  logDay: (log: Omit<WinterDayLog, 'date'>) => void
  logDayForDate: (date: string, log: Omit<WinterDayLog, 'date'>) => void
  addWeeklyReview: (review: Omit<WinterWeeklyReview, 'weekNumber'>) => void
  unlockAchievement: (id: string) => void
  updateConfig: (partial: Partial<WinterArcConfig>) => void

  getCurrentDay: () => number
  getDaysLeft: () => number
  getColdStreak: () => number
  getBestStreak: () => number
  getTotalXP: () => number
  getTotalColdDays: () => number
  getTotalFitnessDays: () => number
  getTotalSpiritualDays: () => number
  getTotalDigitalDays: () => number
  getAverageScore: () => number
  getWeekAverage: () => number
  getDayLog: (date: string) => WinterDayLog | undefined
  getTimeRecoveredMinutes: () => number

  computeDayScore: (log: Omit<WinterDayLog, 'date' | 'score' | 'xpEarned'>) => number
  computeDayXP: (log: Omit<WinterDayLog, 'date' | 'score' | 'xpEarned'>, score: number) => number

  _reset: () => void
}

export const useWinterArcStore = create<WinterArcStore>()(
  persist(
    (set, get) => ({
      isActive: false,
      config: null,
      dayLogs: [],
      weeklyReviews: [],
      achievements: DEFAULT_ACHIEVEMENTS,

      activate: (config) => set({
        isActive: true,
        config,
        dayLogs: [],
        weeklyReviews: [],
        achievements: DEFAULT_ACHIEVEMENTS,
      }),

      deactivate: () => set({ isActive: false }),

      computeDayScore: (log) => {
        const weights = get().config?.scoreWeights ?? { fitness: 25, spiritual: 20, mental: 15, career: 20, digital: 10, finance: 10 }
        return Math.round(
          (log.fitness ? weights.fitness : 0) +
          (log.spiritual ? weights.spiritual : 0) +
          (log.mental ? weights.mental : 0) +
          (log.career ? weights.career : 0) +
          (log.digital ? weights.digital : 0) +
          (log.finance ? weights.finance : 0)
        )
      },

      computeDayXP: (log, score) => {
        let xp = 0
        if (log.fitness) xp += 100
        if (log.spiritual) xp += 20
        if (log.mental) xp += 50
        if (log.career) xp += 50
        if (log.digital) xp += 50
        if (log.finance) xp += 30
        if (score >= 100) xp += 100 // bonus
        return xp
      },

      logDay: (log) => {
        const today = new Date().toISOString().slice(0, 10)
        get().logDayForDate(today, log)
      },

      logDayForDate: (date, log) => {
        const dayLog: WinterDayLog = { date, ...log }
        set(s => {
          const existing = s.dayLogs.findIndex(d => d.date === date)
          return {
            dayLogs: existing >= 0
              ? s.dayLogs.map((d, i) => i === existing ? dayLog : d)
              : [...s.dayLogs, dayLog],
          }
        })
      },

      addWeeklyReview: (review) => {
        const weekNumber = get().weeklyReviews.length + 1
        set(s => ({ weeklyReviews: [...s.weeklyReviews, { ...review, weekNumber }] }))
      },

      unlockAchievement: (id) => set(s => ({
        achievements: s.achievements.map(a =>
          a.id === id && !a.unlockedAt ? { ...a, unlockedAt: new Date().toISOString() } : a
        ),
      })),

      updateConfig: (partial) => set(s =>
        s.config ? { config: { ...s.config, ...partial } } : {}
      ),

      getCurrentDay: () => {
        const { config } = get()
        if (!config) return 0
        const diff = Date.now() - new Date(config.startDate).getTime()
        return Math.max(1, Math.min(config.duration, Math.ceil(diff / 86400000)))
      },

      getDaysLeft: () => {
        const { config } = get()
        if (!config) return 0
        return Math.max(0, Math.ceil((new Date(config.endDate).getTime() - Date.now()) / 86400000))
      },

      getColdStreak: () => {
        const { dayLogs, config } = get()
        if (!config) return 0
        const threshold = config.coldDayThreshold
        let streak = 0
        for (let i = 0; i < 365; i++) {
          const d = new Date(); d.setDate(d.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          const log = dayLogs.find(dl => dl.date === key)
          if (log && log.score >= threshold) streak++
          else break
        }
        return streak
      },

      getBestStreak: () => {
        const { dayLogs, config } = get()
        if (!config) return 0
        const threshold = config.coldDayThreshold
        const sorted = [...dayLogs].sort((a, b) => a.date.localeCompare(b.date))
        let best = 0, cur = 0
        for (const log of sorted) {
          if (log.score >= threshold) { cur++; best = Math.max(best, cur) }
          else cur = 0
        }
        return best
      },

      getTotalXP: () => get().dayLogs.reduce((acc, d) => acc + d.xpEarned, 0),

      getTotalColdDays: () => {
        const { dayLogs, config } = get()
        if (!config) return 0
        return dayLogs.filter(d => d.score >= config.coldDayThreshold).length
      },

      getTotalFitnessDays: () => get().dayLogs.filter(d => d.fitness).length,
      getTotalSpiritualDays: () => get().dayLogs.filter(d => d.spiritual).length,
      getTotalDigitalDays: () => get().dayLogs.filter(d => d.digital).length,

      getAverageScore: () => {
        const { dayLogs } = get()
        if (!dayLogs.length) return 0
        return Math.round(dayLogs.reduce((acc, d) => acc + d.score, 0) / dayLogs.length)
      },

      getWeekAverage: () => {
        const { dayLogs } = get()
        const weekLogs = dayLogs.filter(d => {
          const diff = (Date.now() - new Date(d.date).getTime()) / 86400000
          return diff <= 7
        })
        if (!weekLogs.length) return 0
        return Math.round(weekLogs.reduce((acc, d) => acc + d.score, 0) / weekLogs.length)
      },

      getDayLog: (date) => get().dayLogs.find(d => d.date === date),

      getTimeRecoveredMinutes: () => {
        const { config, dayLogs } = get()
        if (!config) return 0
        const baseline = config.socialMediaBaselineMinutes
        const target = config.socialMediaTargetMinutes
        const savedPerDay = Math.max(0, baseline - target)
        return dayLogs.filter(d => d.digital).length * savedPerDay
      },

      _reset: () => set({
        isActive: false, config: null, dayLogs: [],
        weeklyReviews: [], achievements: DEFAULT_ACHIEVEMENTS,
      }),
    }),
    { name: 'kingdom-winter-arc', storage: userStorage }
  )
)
