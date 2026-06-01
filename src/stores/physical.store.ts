import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { userStorage } from '@/lib/utils/userStorage'
import type { WorkoutSession, BodyMeasurement, NutritionLog, Exercise } from '@/types'

const DEMO_EXERCISES: Exercise[] = [
  { id: 'e1', name: 'Bench Press',       muscleGroups: ['chest', 'triceps', 'shoulders'], category: 'compound', equipment: 'Barbell' },
  { id: 'e2', name: 'Squat',             muscleGroups: ['quads', 'glutes', 'hamstrings'], category: 'compound', equipment: 'Barbell' },
  { id: 'e3', name: 'Deadlift',          muscleGroups: ['back', 'glutes', 'hamstrings'],  category: 'compound', equipment: 'Barbell' },
  { id: 'e4', name: 'Overhead Press',    muscleGroups: ['shoulders', 'triceps'],          category: 'compound', equipment: 'Barbell' },
  { id: 'e5', name: 'Pull-up',           muscleGroups: ['back', 'biceps'],                category: 'compound', equipment: 'Bodyweight' },
  { id: 'e6', name: 'Bicep Curl',        muscleGroups: ['biceps'],                        category: 'isolation', equipment: 'Dumbbell' },
  { id: 'e7', name: 'Tricep Pushdown',   muscleGroups: ['triceps'],                       category: 'isolation', equipment: 'Cable' },
  { id: 'e8', name: 'Leg Press',         muscleGroups: ['quads', 'glutes'],               category: 'compound', equipment: 'Machine' },
]

export interface DayPlan {
  type: string
  name: string
  icon: string
  notes?: string
}

interface PhysicalStore {
  exercises: Exercise[]
  workoutSessions: WorkoutSession[]
  measurements: BodyMeasurement[]
  nutritionLogs: NutritionLog[]
  waterToday: number
  mealsToday: number
  mealsTarget: number
  completedDates: string[]          // "yyyy-MM-dd" strings of manually-completed days
  weeklyPlan: Record<number, DayPlan>  // 0=Sun, 1=Mon, …, 6=Sat

  addWorkout: (session: Omit<WorkoutSession, 'id'>) => void
  updateWorkout: (id: string, updates: Partial<WorkoutSession>) => void
  deleteWorkout: (id: string) => void
  addMeasurement: (m: Omit<BodyMeasurement, 'id'>) => void
  logWater: (glasses: number) => void
  logMeals: (count: number) => void
  setMealsTarget: (n: number) => void
  toggleCompletedDate: (date: string) => void
  setDayPlan: (day: number, plan: DayPlan) => void
  clearDayPlan: (day: number) => void
  getTodayWorkout: () => WorkoutSession | undefined
  resetDaily: () => void
  _reset: () => void
  getWeekVolume: () => number
  getWeekSessions: () => WorkoutSession[]
  getLatestMeasurement: () => BodyMeasurement | undefined
}

export const usePhysicalStore = create<PhysicalStore>()(
  persist(
    (set, get) => ({
      exercises: DEMO_EXERCISES,
      workoutSessions: [],
      weeklyPlan: {},
      completedDates: [],
      mealsToday: 0,
      mealsTarget: 5,
      measurements: [
        { id: 'm1', date: new Date().toISOString(), weight: 75.3, bodyFat: 16.5 },
        { id: 'm2', date: new Date(Date.now() - 7 * 86400000).toISOString(), weight: 75.7, bodyFat: 17 },
        { id: 'm3', date: new Date(Date.now() - 14 * 86400000).toISOString(), weight: 76.2, bodyFat: 17.5 },
      ],
      nutritionLogs: [],
      waterToday: 3,

      _reset: () => set({
        exercises: DEMO_EXERCISES,
        workoutSessions: [],
        measurements: [
          { id: 'm1', date: new Date().toISOString(), weight: 75.3, bodyFat: 16.5 },
          { id: 'm2', date: new Date(Date.now() - 7 * 86400000).toISOString(), weight: 75.7, bodyFat: 17 },
          { id: 'm3', date: new Date(Date.now() - 14 * 86400000).toISOString(), weight: 76.2, bodyFat: 17.5 },
        ],
        nutritionLogs: [],
        waterToday: 3,
        mealsToday: 0,
        mealsTarget: 5,
        completedDates: [],
        weeklyPlan: {},
      }),

      addWorkout: (session) => set(s => ({
        workoutSessions: [...s.workoutSessions, { ...session, id: Math.random().toString(36).slice(2) }]
      })),

      updateWorkout: (id, updates) => set(s => ({
        workoutSessions: s.workoutSessions.map(w => w.id === id ? { ...w, ...updates } : w)
      })),

      deleteWorkout: (id) => set(s => ({ workoutSessions: s.workoutSessions.filter(w => w.id !== id) })),

      addMeasurement: (m) => set(s => ({
        measurements: [...s.measurements, { ...m, id: Math.random().toString(36).slice(2) }]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      })),

      resetDaily: () => set({ waterToday: 0, mealsToday: 0 }),

      logWater: (glasses) => set({ waterToday: glasses }),

      logMeals: (count) => set({ mealsToday: count }),

      setMealsTarget: (n) => set({ mealsTarget: n }),

      toggleCompletedDate: (date) => set(s => ({
        completedDates: s.completedDates.includes(date)
          ? s.completedDates.filter(d => d !== date)
          : [...s.completedDates, date],
      })),

      setDayPlan: (day, plan) => set(s => ({ weeklyPlan: { ...s.weeklyPlan, [day]: plan } })),

      clearDayPlan: (day) => set(s => {
        const next = { ...s.weeklyPlan }
        delete next[day]
        return { weeklyPlan: next }
      }),

      getTodayWorkout: () => {
        const today = new Date().toDateString()
        return get().workoutSessions.find(w => new Date(w.date).toDateString() === today)
      },

      getWeekVolume: () => {
        const weekAgo = Date.now() - 7 * 86400000
        return get().workoutSessions
          .filter(w => new Date(w.date).getTime() > weekAgo && w.completed)
          .reduce((acc, w) => acc + w.volume, 0)
      },

      getWeekSessions: () => {
        const weekAgo = Date.now() - 7 * 86400000
        return get().workoutSessions.filter(w => new Date(w.date).getTime() > weekAgo && w.completed)
      },

      getLatestMeasurement: () => get().measurements[0],
    }),
    { name: 'kingdom-physical', storage: userStorage }
  )
)
