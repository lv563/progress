'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import { format, startOfWeek, endOfWeek } from 'date-fns'

const genId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MealType = 'desayuno' | 'media_manana' | 'almuerzo' | 'merienda' | 'cena'

export interface MealLog {
  date: string
  meals: Partial<Record<MealType, boolean>>
}

export interface DailyCheckItem {
  id: string
  label: string
  emoji: string
  type: 'morning' | 'night'
  order: number
}

export interface DailyCheck {
  date: string
  itemId: string
  done: boolean
}

export interface GymDayConfig {
  weekday: number    // 0=Dom, 1=Lun … 6=Sab
  name: string       // "Torso" | "Pierna" | "Descanso" | …
  muscles: string    // "Pecho, tríceps, hombros"
  isRest: boolean
  hasCardio: boolean
}

export interface CardioLog {
  date: string
  done: boolean
  durationMin?: number
}

export interface Commitment {
  id: string
  title: string
  date: string       // YYYY-MM-DD
  time?: string      // HH:MM
  notes?: string
  done: boolean
  createdAt: string
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_MORNING_ITEMS: DailyCheckItem[] = [
  { id: 'am1', label: 'Levantarme sin snooze',     emoji: '⏰', type: 'morning', order: 0 },
  { id: 'am2', label: 'Agua al despertar',          emoji: '💧', type: 'morning', order: 1 },
  { id: 'am3', label: 'Oración matutina',           emoji: '🙏', type: 'morning', order: 2 },
  { id: 'am4', label: 'Revisar plan del día',       emoji: '📋', type: 'morning', order: 3 },
]

const DEFAULT_NIGHT_ITEMS: DailyCheckItem[] = [
  { id: 'pm1', label: 'Preparar ropa para mañana', emoji: '👕', type: 'night', order: 0 },
  { id: 'pm2', label: 'Revisar tareas completadas', emoji: '✅', type: 'night', order: 1 },
  { id: 'pm3', label: 'Lectura (20 min)',           emoji: '📚', type: 'night', order: 2 },
  { id: 'pm4', label: 'Sin pantallas 30 min antes', emoji: '📵', type: 'night', order: 3 },
]

const DEFAULT_GYM: GymDayConfig[] = [
  { weekday: 1, name: 'Torso',    muscles: 'Pecho, Tríceps, Hombros',   isRest: false, hasCardio: false },
  { weekday: 2, name: 'Pierna',   muscles: 'Cuádriceps, Femorales, Glúteos', isRest: false, hasCardio: true },
  { weekday: 3, name: 'Espalda',  muscles: 'Espalda, Bíceps',            isRest: false, hasCardio: false },
  { weekday: 4, name: 'Descanso', muscles: '',                            isRest: true,  hasCardio: false },
  { weekday: 5, name: 'Full Body',muscles: 'Torso + Pierna',              isRest: false, hasCardio: true },
  { weekday: 6, name: 'Cardio',   muscles: 'Caminadora 3.5km/h máx inc.',isRest: false, hasCardio: true },
  { weekday: 0, name: 'Descanso', muscles: '',                            isRest: true,  hasCardio: false },
]

// ─── Store ─────────────────────────────────────────────────────────────────────

interface PlannerStore {
  // Meals
  mealLogs: MealLog[]
  toggleMeal: (date: string, meal: MealType) => void
  getMealsForDate: (date: string) => Partial<Record<MealType, boolean>>
  getMealCount: (date: string) => { done: number; total: number }

  // Daily checklists
  morningItems: DailyCheckItem[]
  nightItems: DailyCheckItem[]
  dailyChecks: DailyCheck[]
  addCheckItem: (item: Omit<DailyCheckItem, 'id'>) => void
  removeCheckItem: (id: string) => void
  updateCheckItem: (id: string, updates: Partial<DailyCheckItem>) => void
  toggleDailyCheck: (date: string, itemId: string) => void
  getDailyChecks: (date: string, type: 'morning' | 'night') => { item: DailyCheckItem; done: boolean }[]

  // Gym
  gymSchedule: GymDayConfig[]
  updateGymDay: (weekday: number, updates: Partial<GymDayConfig>) => void
  getGymForDate: (date: string) => GymDayConfig

  // Cardio
  cardioLogs: CardioLog[]
  toggleCardio: (date: string) => void
  getCardioForDate: (date: string) => boolean
  getWeeklyCardioCount: (date: string) => { done: number; target: number }

  // Commitments
  commitments: Commitment[]
  addCommitment: (c: Omit<Commitment, 'id' | 'done' | 'createdAt'>) => void
  updateCommitment: (id: string, updates: Partial<Commitment>) => void
  deleteCommitment: (id: string) => void
  toggleCommitment: (id: string) => void
  getCommitmentsForDate: (date: string) => Commitment[]
  getUpcomingCommitments: (fromDate: string, days?: number) => Commitment[]

  _reset: () => void
}

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
      mealLogs: [],
      morningItems: DEFAULT_MORNING_ITEMS,
      nightItems: DEFAULT_NIGHT_ITEMS,
      dailyChecks: [],
      gymSchedule: DEFAULT_GYM,
      cardioLogs: [],
      commitments: [],

      // ─ Meals ───────────────────────────────────────────────────────────────

      toggleMeal: (date, meal) => set(s => {
        const existing = s.mealLogs.find(l => l.date === date)
        if (existing) {
          return {
            mealLogs: s.mealLogs.map(l =>
              l.date === date
                ? { ...l, meals: { ...l.meals, [meal]: !l.meals[meal] } }
                : l
            )
          }
        }
        return { mealLogs: [...s.mealLogs, { date, meals: { [meal]: true } }] }
      }),

      getMealsForDate: (date) =>
        get().mealLogs.find(l => l.date === date)?.meals ?? {},

      getMealCount: (date) => {
        const meals = get().getMealsForDate(date)
        const done = Object.values(meals).filter(Boolean).length
        return { done, total: 5 }
      },

      // ─ Daily Checks ─────────────────────────────────────────────────────────

      addCheckItem: (item) => set(s => {
        const newItem: DailyCheckItem = { ...item, id: genId() }
        if (item.type === 'morning') return { morningItems: [...s.morningItems, newItem] }
        return { nightItems: [...s.nightItems, newItem] }
      }),

      removeCheckItem: (id) => set(s => ({
        morningItems: s.morningItems.filter(i => i.id !== id),
        nightItems: s.nightItems.filter(i => i.id !== id),
        dailyChecks: s.dailyChecks.filter(c => c.itemId !== id),
      })),

      updateCheckItem: (id, updates) => set(s => ({
        morningItems: s.morningItems.map(i => i.id === id ? { ...i, ...updates } : i),
        nightItems: s.nightItems.map(i => i.id === id ? { ...i, ...updates } : i),
      })),

      toggleDailyCheck: (date, itemId) => set(s => {
        const existing = s.dailyChecks.find(c => c.date === date && c.itemId === itemId)
        if (existing) {
          return { dailyChecks: s.dailyChecks.map(c =>
            c.date === date && c.itemId === itemId ? { ...c, done: !c.done } : c
          )}
        }
        return { dailyChecks: [...s.dailyChecks, { date, itemId, done: true }] }
      }),

      getDailyChecks: (date, type) => {
        const items = type === 'morning' ? get().morningItems : get().nightItems
        return items.map(item => ({
          item,
          done: get().dailyChecks.find(c => c.date === date && c.itemId === item.id)?.done ?? false
        }))
      },

      // ─ Gym ──────────────────────────────────────────────────────────────────

      updateGymDay: (weekday, updates) => set(s => ({
        gymSchedule: s.gymSchedule.map(d => d.weekday === weekday ? { ...d, ...updates } : d)
      })),

      getGymForDate: (date) => {
        const d = new Date(date + 'T12:00:00')
        const weekday = d.getDay()
        return get().gymSchedule.find(g => g.weekday === weekday) ?? {
          weekday, name: 'Descanso', muscles: '', isRest: true, hasCardio: false
        }
      },

      // ─ Cardio ───────────────────────────────────────────────────────────────

      toggleCardio: (date) => set(s => {
        const existing = s.cardioLogs.find(l => l.date === date)
        if (existing) {
          return { cardioLogs: s.cardioLogs.map(l => l.date === date ? { ...l, done: !l.done } : l) }
        }
        return { cardioLogs: [...s.cardioLogs, { date, done: true }] }
      }),

      getCardioForDate: (date) =>
        get().cardioLogs.find(l => l.date === date)?.done ?? false,

      getWeeklyCardioCount: (date) => {
        const d = new Date(date + 'T12:00:00')
        // Week Mon→Sun
        const monday = new Date(d)
        monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        const monStr = format(monday, 'yyyy-MM-dd')
        const sunStr = format(sunday, 'yyyy-MM-dd')
        const done = get().cardioLogs.filter(l => l.done && l.date >= monStr && l.date <= sunStr).length
        return { done, target: 3 }
      },

      // ─ Commitments ──────────────────────────────────────────────────────────

      addCommitment: (c) => set(s => ({
        commitments: [...s.commitments, { ...c, id: genId(), done: false, createdAt: new Date().toISOString() }]
      })),

      updateCommitment: (id, updates) => set(s => ({
        commitments: s.commitments.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      deleteCommitment: (id) => set(s => ({
        commitments: s.commitments.filter(c => c.id !== id)
      })),

      toggleCommitment: (id) => set(s => ({
        commitments: s.commitments.map(c => c.id === id ? { ...c, done: !c.done } : c)
      })),

      getCommitmentsForDate: (date) =>
        get().commitments
          .filter(c => c.date === date)
          .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99')),

      getUpcomingCommitments: (fromDate, days = 30) => {
        const endDate = new Date(fromDate + 'T12:00:00')
        endDate.setDate(endDate.getDate() + days)
        const endStr = format(endDate, 'yyyy-MM-dd')
        return get().commitments
          .filter(c => !c.done && c.date >= fromDate && c.date <= endStr)
          .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
      },

      _reset: () => set({
        mealLogs: [], dailyChecks: [], cardioLogs: [], commitments: [],
        morningItems: DEFAULT_MORNING_ITEMS, nightItems: DEFAULT_NIGHT_ITEMS,
        gymSchedule: DEFAULT_GYM,
      }),
    }),
    { name: 'kingdom-planner', storage: userStorage }
  )
)
