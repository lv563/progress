'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

const genId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

const localDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const RETO_START_DATE = '2026-10-31'
export const RETO_DURATION = 40

export type PillarKey =
  | 'fe' | 'codigo' | 'gym' | 'comida' | 'redes'
  | 'hidratacion' | 'peso' | 'microaprendizaje' | 'mental' | 'consumo'

export interface PillarInfo {
  label: string
  emoji: string
  xp: number
  unlockDay: number
  description: string
}

export const PILLAR_CONFIG: Record<PillarKey, PillarInfo> = {
  fe:              { label: 'Fe',                  emoji: '✝️',  xp: 20, unlockDay: 1,  description: 'Lee Proverbios y completa tu reflexión' },
  codigo:          { label: 'Código sin IA',        emoji: '💻',  xp: 30, unlockDay: 1,  description: 'Sesión de programación sin IA' },
  gym:             { label: 'Entrené',              emoji: '🏋️', xp: 20, unlockDay: 1,  description: 'Sesión de gym o cardio completada' },
  comida:          { label: 'Comí bien',            emoji: '🥗',  xp: 15, unlockDay: 1,  description: 'Las 5 comidas del día bien hechas' },
  redes:           { label: 'Sin redes',            emoji: '📵',  xp: 15, unlockDay: 1,  description: 'Día sin redes sociales' },
  hidratacion:     { label: 'Hidratación',          emoji: '💧',  xp: 10, unlockDay: 8,  description: '2+ litros de agua' },
  peso:            { label: 'Registré mi peso',     emoji: '⚖️',  xp: 5,  unlockDay: 8,  description: 'Pesaje matutino registrado' },
  microaprendizaje:{ label: 'Microaprendizaje',     emoji: '🧠',  xp: 20, unlockDay: 15, description: 'Sesión de aprendizaje de 10-15 min' },
  mental:          { label: 'Mental Reset',         emoji: '🎯',  xp: 10, unlockDay: 15, description: 'Video de crecimiento personal' },
  consumo:         { label: 'Consumo Inteligente',  emoji: '💰',  xp: 10, unlockDay: 22, description: 'Sin compras impulsivas hoy' },
}

export const BONUS_XP_FULL_DAY = 50
export const BONUS_XP_EVAL = 10

export const STAGES = [
  { stage: 1, days: '1–7',   label: 'Arranque',           description: '5 hábitos núcleo. El sistema arranca.',     unlockDay: 1 },
  { stage: 2, days: '8–14',  label: 'Cuerpo afinado',     description: 'Añade hidratación y peso diario.',          unlockDay: 8 },
  { stage: 3, days: '15–21', label: 'Mente aguda',         description: 'Microaprendizaje y Mental Reset.',          unlockDay: 15 },
  { stage: 4, days: '22–28', label: 'Consumo Inteligente', description: 'Disciplina económica.',                      unlockDay: 22 },
  { stage: 5, days: '29–35', label: 'Evangelio de Juan',  description: 'Evangelio de Juan + ejercicios sin IA.',    unlockDay: 29 },
  { stage: 6, days: '36–40', label: 'Consolidación',       description: 'Últimos 5 días. Todo junto.',               unlockDay: 36 },
]

export const ALL_PILLAR_KEYS: PillarKey[] = [
  'fe', 'codigo', 'gym', 'comida', 'redes',
  'hidratacion', 'peso', 'microaprendizaje', 'mental', 'consumo',
]

export interface RetoDayLog {
  date: string
  day: number
  fe: boolean
  codigo: boolean
  gym: boolean
  comida: boolean
  redes: boolean
  hidratacion: boolean
  peso: boolean
  microaprendizaje: boolean
  mental: boolean
  consumo: boolean
  evalDisciplina?: number
  evalEnfoque?: number
  evalEmocional?: number
  evalNote?: string
  xpEarned: number
}

export interface FeDayLog {
  date: string
  chapter: number
  verse: string
  godSpoke: string
  application: string
  completed: boolean
}

export interface CodingSession {
  id: string
  date: string
  durationMin: number
  resource: 'CS50' | 'HolaMundo' | 'otro'
  lesson: string
  usedAI: boolean
  aiPurpose?: string
  concept: string
  completed: boolean
}

export interface MicroSession {
  id: string
  date: string
  topic: string
  durationMin: number
  insight1: string
  insight2: string
  insight3: string
  question: string
  completed: boolean
}

export interface ConsumoItem {
  id: string
  date: string
  type: 'video' | 'libro' | 'artículo' | 'podcast'
  title: string
  keyIdea: string
  actionToApply: string
}

export interface WeeklyReview {
  id: string
  weekNumber: number
  date: string
  whatCompleted: string
  whatFailed: string
  whyFailed: string
  oneAdjustment: string
}

export interface RetoAchievement {
  id: string
  label: string
  description: string
  icon: string
  unlockedAt?: string
}

const DEFAULT_ACHIEVEMENTS: RetoAchievement[] = [
  { id: 'dia1',     label: 'El Inicio',        description: 'Día 1 completado al 100%',         icon: '🔥' },
  { id: 'semana1',  label: 'Primera Semana',   description: '7 días con racha activa',           icon: '⚡' },
  { id: 'no_ia_7',  label: 'Mente Propia',     description: '7 sesiones de código sin IA',       icon: '💻' },
  { id: 'gym_10',   label: '10 en el Gym',     description: '10 días de gym registrados',        icon: '🏋️' },
  { id: 'fe_14',    label: '14 Lecturas',      description: '14 días de Fe completados',         icon: '✝️' },
  { id: 'dia20',    label: 'Mitad del Reto',   description: 'Día 20 alcanzado',                  icon: '🏅' },
  { id: 'no_caer2', label: 'De Pie',           description: 'Reto activo: nunca 2 días fallados',icon: '💪' },
  { id: 'reto40',   label: 'RETO COMPLETADO',  description: '40 días. Misión cumplida.',         icon: '👑' },
]

export interface Reto40Store {
  startDate: string
  active: boolean
  dayLogs: RetoDayLog[]
  feLogs: FeDayLog[]
  codingSessions: CodingSession[]
  weeklyReviews: WeeklyReview[]
  achievements: RetoAchievement[]

  activate: (startDate?: string) => void
  deactivate: () => void

  upsertDayLog: (date: string, updates: Partial<Omit<RetoDayLog, 'date' | 'day'>>) => void
  getDayLog: (date: string) => RetoDayLog | undefined

  upsertFeLog: (data: Omit<FeDayLog, 'date'> & { date?: string }) => void
  getFeLog: (date: string) => FeDayLog | undefined

  addCodingSession: (session: Omit<CodingSession, 'id'>) => void
  getCodingSessions: (date: string) => CodingSession[]
  getTotalCodingHours: () => number

  microSessions: MicroSession[]
  addMicroSession: (s: Omit<MicroSession, 'id'>) => void
  getMicroSessions: (date: string) => MicroSession[]

  consumoItems: ConsumoItem[]
  addConsumoItem: (item: Omit<ConsumoItem, 'id'>) => void
  getConsumoItems: (date: string) => ConsumoItem[]

  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'weekNumber'>) => void
  unlockAchievement: (id: string) => void

  getDayNumber: (date?: string) => number
  getDaysLeft: () => number
  getActivePillars: (dayNumber: number) => PillarKey[]
  computeDayXP: (log: Partial<RetoDayLog>, dayNumber: number) => number
  getStreak: () => number
  getCompletionPct: (date?: string) => number
  getTotalXP: () => number
  getChapterForDate: (date?: string) => number

  _reset: () => void
}

export const useReto40Store = create<Reto40Store>()(
  persist(
    (set, get) => ({
      startDate: RETO_START_DATE,
      active: false,
      dayLogs: [],
      feLogs: [],
      codingSessions: [],
      microSessions: [],
      consumoItems: [],
      weeklyReviews: [],
      achievements: DEFAULT_ACHIEVEMENTS,

      activate: (startDate = RETO_START_DATE) => set({ active: true, startDate }),
      deactivate: () => set({ active: false }),

      getDayNumber: (date) => {
        const d = date ?? localDateStr()
        const start = new Date(get().startDate + 'T12:00:00')
        const target = new Date(d + 'T12:00:00')
        const diff = Math.floor((target.getTime() - start.getTime()) / 86400000)
        return Math.max(1, Math.min(RETO_DURATION, diff + 1))
      },

      getDaysLeft: () => {
        const dayNum = get().getDayNumber(localDateStr())
        return Math.max(0, RETO_DURATION - dayNum)
      },

      getActivePillars: (dayNumber) =>
        ALL_PILLAR_KEYS.filter(k => PILLAR_CONFIG[k].unlockDay <= dayNumber),

      computeDayXP: (log, dayNumber) => {
        const pillars = get().getActivePillars(dayNumber)
        let xp = pillars.reduce((acc, k) => acc + (log[k] ? PILLAR_CONFIG[k].xp : 0), 0)
        if (pillars.every(k => log[k])) xp += BONUS_XP_FULL_DAY
        if (log.evalDisciplina !== undefined) xp += BONUS_XP_EVAL
        return xp
      },

      upsertDayLog: (date, updates) => {
        const dayNumber = get().getDayNumber(date)
        const existing = get().dayLogs.find(l => l.date === date)
        const base: RetoDayLog = {
          date, day: dayNumber,
          fe: false, codigo: false, gym: false, comida: false, redes: false,
          hidratacion: false, peso: false, microaprendizaje: false, mental: false, consumo: false,
          xpEarned: 0,
        }
        const merged: RetoDayLog = { ...base, ...(existing ?? {}), ...updates }
        merged.xpEarned = get().computeDayXP(merged, dayNumber)
        set(s => ({
          dayLogs: existing
            ? s.dayLogs.map(l => l.date === date ? merged : l)
            : [...s.dayLogs, merged],
        }))
      },

      getDayLog: (date) => get().dayLogs.find(l => l.date === date),

      upsertFeLog: (data) => {
        const date = data.date ?? localDateStr()
        const log: FeDayLog = { ...data, date } as FeDayLog
        set(s => {
          const idx = s.feLogs.findIndex(l => l.date === date)
          return {
            feLogs: idx >= 0
              ? s.feLogs.map((l, i) => i === idx ? log : l)
              : [...s.feLogs, log],
          }
        })
      },

      getFeLog: (date) => get().feLogs.find(l => l.date === date),

      addCodingSession: (session) => set(s => ({
        codingSessions: [...s.codingSessions, { ...session, id: genId() }],
      })),

      getCodingSessions: (date) => get().codingSessions.filter(s => s.date === date),

      getTotalCodingHours: () => {
        const mins = get().codingSessions.reduce((a, s) => a + s.durationMin, 0)
        return Math.round((mins / 60) * 10) / 10
      },

      addMicroSession: (session) => {
        const date = session.date
        set(s => ({ microSessions: [...s.microSessions, { ...session, id: genId() }] }))
        get().upsertDayLog(date, { microaprendizaje: true })
      },

      getMicroSessions: (date) => get().microSessions.filter(s => s.date === date),

      addConsumoItem: (item) => {
        const date = item.date
        set(s => ({ consumoItems: [...s.consumoItems, { ...item, id: genId() }] }))
        get().upsertDayLog(date, { consumo: true })
      },

      getConsumoItems: (date) => get().consumoItems.filter(c => c.date === date),

      addWeeklyReview: (review) => set(s => ({
        weeklyReviews: [...s.weeklyReviews, {
          ...review, id: genId(), weekNumber: s.weeklyReviews.length + 1,
        }],
      })),

      unlockAchievement: (id) => set(s => ({
        achievements: s.achievements.map(a =>
          a.id === id && !a.unlockedAt ? { ...a, unlockedAt: new Date().toISOString() } : a
        ),
      })),

      getStreak: () => {
        const { dayLogs, startDate } = get()
        const today = localDateStr()
        let streak = 0
        let consecutiveMisses = 0
        for (let i = 0; i < RETO_DURATION; i++) {
          const d = new Date(today + 'T12:00:00')
          d.setDate(d.getDate() - i)
          const dateStr = localDateStr(d)
          if (dateStr < startDate) break
          const log = dayLogs.find(l => l.date === dateStr)
          const dayNum = get().getDayNumber(dateStr)
          const active = get().getActivePillars(dayNum)
          const isDone = log ? active.every(k => log[k]) : false
          if (isDone) {
            streak++
            consecutiveMisses = 0
          } else {
            if (dateStr === today) continue
            consecutiveMisses++
            if (consecutiveMisses >= 2) break
          }
        }
        return streak
      },

      getCompletionPct: (date) => {
        const d = date ?? localDateStr()
        const dayNum = get().getDayNumber(d)
        const active = get().getActivePillars(dayNum)
        const log = get().getDayLog(d)
        if (!active.length || !log) return 0
        const done = active.filter(k => log[k]).length
        return Math.round((done / active.length) * 100)
      },

      getTotalXP: () => get().dayLogs.reduce((acc, l) => acc + l.xpEarned, 0),

      getChapterForDate: (date) => {
        const dayNum = get().getDayNumber(date ?? localDateStr())
        return ((dayNum - 1) % 31) + 1
      },

      _reset: () => set({
        active: false, startDate: RETO_START_DATE,
        dayLogs: [], feLogs: [], codingSessions: [],
        microSessions: [], consumoItems: [],
        weeklyReviews: [], achievements: DEFAULT_ACHIEVEMENTS,
      }),
    }),
    { name: 'kingdom-reto40', storage: userStorage }
  )
)
