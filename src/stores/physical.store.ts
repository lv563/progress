import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { userStorage } from '@/lib/utils/userStorage'
import type { WorkoutSession, BodyMeasurement, Exercise } from '@/types'

export type Sex           = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type PhysicalGoal  = 'muscle' | 'fat_loss' | 'maintenance'
export type MealType      = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface UserProfile {
  weight: number
  height: number
  age: number
  sex: Sex
  activityLevel: ActivityLevel
  goal: PhysicalGoal
}

export interface FoodItem {
  id: string
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
}

export interface MealLog {
  id: string
  date: string       // yyyy-MM-dd
  mealType: MealType
  items: FoodItem[]
}

export interface DailyTargets {
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  water: number
  tmb: number
  maintenance: number
}

export interface DayPlan {
  type: string
  name: string
  icon: string
  notes?: string
}

export interface FoodDBEntry {
  id: string
  name: string
  unit: string
  per: number
  cal: number
  pro: number
  car: number
  fat: number
  fib: number
}

export const FOOD_DB: FoodDBEntry[] = [
  // Proteínas
  { id: 'f1',  name: 'Pechuga de pollo',      unit: 'g',            per: 100, cal: 165, pro: 31,   car: 0,    fat: 3.6,  fib: 0 },
  { id: 'f2',  name: 'Huevo entero',           unit: 'unidad',       per: 1,   cal: 70,  pro: 6,    car: 0.6,  fat: 5,    fib: 0 },
  { id: 'f3',  name: 'Atún en lata',           unit: 'g',            per: 100, cal: 116, pro: 25.5, car: 0,    fat: 1,    fib: 0 },
  { id: 'f4',  name: 'Carne molida (magra)',   unit: 'g',            per: 100, cal: 176, pro: 20,   car: 0,    fat: 10,   fib: 0 },
  { id: 'f5',  name: 'Salmón',                 unit: 'g',            per: 100, cal: 208, pro: 20,   car: 0,    fat: 13,   fib: 0 },
  { id: 'f6',  name: 'Yogurt griego',          unit: 'g',            per: 100, cal: 59,  pro: 10,   car: 3.6,  fat: 0.4,  fib: 0 },
  { id: 'f7',  name: 'Proteína en polvo',      unit: 'scoop (30g)',  per: 1,   cal: 120, pro: 24,   car: 3,    fat: 1.5,  fib: 0 },
  { id: 'f8',  name: 'Tilapia / Pescado',      unit: 'g',            per: 100, cal: 128, pro: 26,   car: 0,    fat: 2.7,  fib: 0 },
  // Carbohidratos
  { id: 'f9',  name: 'Arroz blanco cocido',    unit: 'taza',         per: 1,   cal: 206, pro: 4.3,  car: 44.5, fat: 0.4,  fib: 0.6 },
  { id: 'f10', name: 'Avena',                  unit: 'taza seca',    per: 1,   cal: 307, pro: 10.7, car: 54.8, fat: 5.3,  fib: 8.2 },
  { id: 'f11', name: 'Papa',                   unit: 'g',            per: 100, cal: 77,  pro: 2,    car: 17,   fat: 0.1,  fib: 2.2 },
  { id: 'f12', name: 'Banana / Plátano',       unit: 'unidad',       per: 1,   cal: 89,  pro: 1.1,  car: 23,   fat: 0.3,  fib: 2.6 },
  { id: 'f13', name: 'Pan integral',           unit: 'rebanada',     per: 1,   cal: 80,  pro: 3.6,  car: 15,   fat: 1,    fib: 2 },
  { id: 'f14', name: 'Habichuelas cocidas',    unit: 'taza',         per: 1,   cal: 225, pro: 15,   car: 40,   fat: 0.9,  fib: 15.3 },
  { id: 'f15', name: 'Yuca',                   unit: 'g',            per: 100, cal: 160, pro: 1.4,  car: 38.1, fat: 0.3,  fib: 1.8 },
  { id: 'f16', name: 'Mango',                  unit: 'unidad',       per: 1,   cal: 135, pro: 1.1,  car: 35,   fat: 0.6,  fib: 3.7 },
  // Grasas
  { id: 'f17', name: 'Aguacate',               unit: 'unidad',       per: 1,   cal: 322, pro: 4,    car: 17,   fat: 29.5, fib: 13.5 },
  { id: 'f18', name: 'Aceite de oliva',        unit: 'cucharada',    per: 1,   cal: 119, pro: 0,    car: 0,    fat: 13.5, fib: 0 },
  { id: 'f19', name: 'Nueces',                 unit: 'g',            per: 30,  cal: 196, pro: 4.6,  car: 4.1,  fat: 19.6, fib: 2 },
  { id: 'f20', name: 'Mantequilla de maní',    unit: 'cucharada',    per: 1,   cal: 94,  pro: 4,    car: 3,    fat: 8,    fib: 1 },
  // Vegetales
  { id: 'f21', name: 'Brócoli',                unit: 'g',            per: 100, cal: 34,  pro: 2.8,  car: 6.6,  fat: 0.4,  fib: 2.6 },
  { id: 'f22', name: 'Zanahoria',              unit: 'g',            per: 100, cal: 41,  pro: 0.9,  car: 9.6,  fat: 0.2,  fib: 2.8 },
  { id: 'f23', name: 'Ensalada verde',         unit: 'taza',         per: 1,   cal: 8,   pro: 0.7,  car: 1.2,  fat: 0.1,  fib: 0.5 },
  // Lácteos / otros
  { id: 'f24', name: 'Leche entera',           unit: 'vaso (250ml)', per: 1,   cal: 150, pro: 8,    car: 12,   fat: 8,    fib: 0 },
  { id: 'f25', name: 'Queso blanco',           unit: 'g',            per: 30,  cal: 90,  pro: 7,    car: 0.5,  fat: 7,    fib: 0 },
]

const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'e1', name: 'Bench Press',      muscleGroups: ['chest', 'triceps', 'shoulders'], category: 'compound', equipment: 'Barbell' },
  { id: 'e2', name: 'Squat',            muscleGroups: ['quads', 'glutes', 'hamstrings'], category: 'compound', equipment: 'Barbell' },
  { id: 'e3', name: 'Deadlift',         muscleGroups: ['back', 'glutes', 'hamstrings'],  category: 'compound', equipment: 'Barbell' },
  { id: 'e4', name: 'Overhead Press',   muscleGroups: ['shoulders', 'triceps'],          category: 'compound', equipment: 'Barbell' },
  { id: 'e5', name: 'Pull-up',          muscleGroups: ['back', 'biceps'],                category: 'compound', equipment: 'Bodyweight' },
  { id: 'e6', name: 'Bicep Curl',       muscleGroups: ['biceps'],                        category: 'isolation', equipment: 'Dumbbell' },
  { id: 'e7', name: 'Tricep Pushdown',  muscleGroups: ['triceps'],                       category: 'isolation', equipment: 'Cable' },
  { id: 'e8', name: 'Leg Press',        muscleGroups: ['quads', 'glutes'],               category: 'compound', equipment: 'Machine' },
]

const DEFAULT_PROFILE: UserProfile = { weight: 0, height: 0, age: 0, sex: 'male', activityLevel: 'moderate', goal: 'muscle' }
const genId = () => Math.random().toString(36).slice(2, 9)

interface PhysicalStore {
  exercises: Exercise[]
  workoutSessions: WorkoutSession[]
  measurements: BodyMeasurement[]
  completedDates: string[]
  weeklyPlan: Record<number, DayPlan>
  userProfile: UserProfile
  mealLogs: MealLog[]
  waterToday: number   // liters

  updateUserProfile: (u: Partial<UserProfile>) => void

  addWorkout: (s: Omit<WorkoutSession, 'id'>) => void
  updateWorkout: (id: string, u: Partial<WorkoutSession>) => void
  deleteWorkout: (id: string) => void
  addMeasurement: (m: Omit<BodyMeasurement, 'id'>) => void
  addWater: (liters: number) => void
  setWater: (liters: number) => void
  toggleCompletedDate: (date: string) => void
  setDayPlan: (day: number, plan: DayPlan) => void
  clearDayPlan: (day: number) => void

  addMealItem: (mealType: MealType, item: Omit<FoodItem, 'id'>) => void
  removeMealItem: (mealLogId: string, itemId: string) => void
  getTodayMealLogs: () => MealLog[]
  getTodayMacros: () => { calories: number; protein: number; carbs: number; fats: number; fiber: number }
  getDailyTargets: () => DailyTargets
  getWaterTarget: () => number
  getDailyScore: () => { workout: number; protein: number; water: number; calories: number; fiber: number; total: number }
  getWeeklyStats: () => { sessions: number; avgProtein: number; avgWater: number; perfectDays: number; streak: number }

  getTodayWorkout: () => WorkoutSession | undefined
  getWeekSessions: () => WorkoutSession[]
  getLatestMeasurement: () => BodyMeasurement | undefined
  resetDaily: () => void
  _reset: () => void
}

export const usePhysicalStore = create<PhysicalStore>()(
  persist(
    (set, get) => ({
      exercises: DEFAULT_EXERCISES,
      workoutSessions: [],
      measurements: [],
      completedDates: [],
      weeklyPlan: {},
      userProfile: DEFAULT_PROFILE,
      mealLogs: [],
      waterToday: 0,

      _reset: () => set({ exercises: DEFAULT_EXERCISES, workoutSessions: [], measurements: [], completedDates: [], weeklyPlan: {}, userProfile: DEFAULT_PROFILE, mealLogs: [], waterToday: 0 }),

      updateUserProfile: (u) => set(s => ({ userProfile: { ...s.userProfile, ...u } })),

      addWorkout: (s) => set(st => ({ workoutSessions: [...st.workoutSessions, { ...s, id: genId() }] })),
      updateWorkout: (id, u) => set(s => ({ workoutSessions: s.workoutSessions.map(w => w.id === id ? { ...w, ...u } : w) })),
      deleteWorkout: (id) => set(s => ({ workoutSessions: s.workoutSessions.filter(w => w.id !== id) })),

      addMeasurement: (m) => set(s => ({
        measurements: [...s.measurements, { ...m, id: genId() }].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      })),

      addWater: (liters) => set(s => ({ waterToday: Math.round((s.waterToday + liters) * 100) / 100 })),
      setWater: (liters) => set({ waterToday: liters }),

      toggleCompletedDate: (date) => set(s => ({
        completedDates: s.completedDates.includes(date) ? s.completedDates.filter(d => d !== date) : [...s.completedDates, date],
      })),

      setDayPlan: (day, plan) => set(s => ({ weeklyPlan: { ...s.weeklyPlan, [day]: plan } })),
      clearDayPlan: (day) => set(s => { const n = { ...s.weeklyPlan }; delete n[day]; return { weeklyPlan: n } }),

      addMealItem: (mealType, item) => {
        const today = format(new Date(), 'yyyy-MM-dd')
        const existing = get().mealLogs.find(m => m.date === today && m.mealType === mealType)
        const newItem = { ...item, id: genId() }
        if (existing) {
          set(s => ({ mealLogs: s.mealLogs.map(m => m.id === existing.id ? { ...m, items: [...m.items, newItem] } : m) }))
        } else {
          set(s => ({ mealLogs: [...s.mealLogs, { id: genId(), date: today, mealType, items: [newItem] }] }))
        }
      },

      removeMealItem: (mealLogId, itemId) => set(s => ({
        mealLogs: s.mealLogs.map(m => m.id === mealLogId ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m)
          .filter(m => m.items.length > 0)
      })),

      getTodayMealLogs: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return get().mealLogs.filter(m => m.date === today)
      },

      getTodayMacros: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return get().mealLogs.filter(m => m.date === today).flatMap(m => m.items).reduce(
          (acc, item) => ({ calories: acc.calories + item.calories, protein: acc.protein + item.protein, carbs: acc.carbs + item.carbs, fats: acc.fats + item.fats, fiber: acc.fiber + item.fiber }),
          { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
        )
      },

      getDailyTargets: () => {
        const p = get().userProfile
        if (!p.weight || !p.height || !p.age) return { calories: 2500, protein: 165, carbs: 280, fats: 70, fiber: 35, water: 2.5, tmb: 0, maintenance: 2500 }
        const tmb = p.sex === 'male' ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5 : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161
        const mult = ({ sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 } as const)[p.activityLevel] ?? 1.55
        const maintenance = Math.round(tmb * mult)
        const calories = p.goal === 'muscle' ? maintenance + 400 : p.goal === 'fat_loss' ? maintenance - 450 : maintenance
        const protein = Math.round(p.weight * (p.goal === 'muscle' ? 2.2 : p.goal === 'fat_loss' ? 2.0 : 1.8))
        const fats = Math.round(calories * 0.28 / 9)
        const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4))
        const water = Math.round(p.weight * 0.038 * 10) / 10
        return { calories, protein, carbs, fats, fiber: 35, water, tmb: Math.round(tmb), maintenance }
      },

      getWaterTarget: () => {
        const w = get().userProfile.weight
        return w > 0 ? Math.round(w * 0.038 * 10) / 10 : 2.5
      },

      getDailyScore: () => {
        const targets = get().getDailyTargets()
        const macros = get().getTodayMacros()
        const water = get().waterToday
        const waterTarget = get().getWaterTarget()
        const today = format(new Date(), 'yyyy-MM-dd')
        const workoutDone = get().completedDates.includes(today) ||
          get().workoutSessions.some(s => new Date(s.date).toISOString().slice(0, 10) === today && s.completed)
        const workout = workoutDone ? 30 : 0
        const protein = targets.protein > 0 ? Math.round(Math.min(1, macros.protein / targets.protein) * 30) : 0
        const waterScore = waterTarget > 0 ? Math.round(Math.min(1, water / waterTarget) * 20) : 0
        const calPct = targets.calories > 0 ? macros.calories / targets.calories : 0
        const calories = macros.calories === 0 ? 0 : (calPct >= 0.7 && calPct <= 1.15 ? 10 : Math.max(0, Math.round((1 - Math.abs(1 - calPct) * 2) * 10)))
        const fiber = targets.fiber > 0 ? Math.round(Math.min(1, macros.fiber / targets.fiber) * 10) : 0
        return { workout, protein, water: waterScore, calories, fiber, total: workout + protein + waterScore + calories + fiber }
      },

      getWeeklyStats: () => {
        const now = Date.now()
        const weekAgo = now - 7 * 86400000
        const sessions = get().workoutSessions.filter(s => new Date(s.date).getTime() > weekAgo && s.completed)
        const last7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - i)
          return format(d, 'yyyy-MM-dd')
        })
        const weekLogs = get().mealLogs.filter(m => last7.includes(m.date))
        const dayProtein = last7.map(d => {
          const items = weekLogs.filter(m => m.date === d).flatMap(m => m.items)
          return items.reduce((a, i) => a + i.protein, 0)
        })
        const avgProtein = dayProtein.length > 0 ? Math.round(dayProtein.reduce((a, b) => a + b, 0) / dayProtein.filter(v => v > 0).length || 0) : 0
        const measurements = get().measurements
        const weekMeasurements = measurements.filter(m => new Date(m.date).getTime() > weekAgo)
        const avgWeight = weekMeasurements.length > 0 ? Math.round(weekMeasurements.reduce((a, m) => a + (m.weight ?? 0), 0) / weekMeasurements.length * 10) / 10 : 0
        const perfectDays = last7.filter(d => {
          const dayLogs = get().mealLogs.filter(m => m.date === d)
          const macros = dayLogs.flatMap(m => m.items).reduce((acc, i) => ({ protein: acc.protein + i.protein, calories: acc.calories + i.calories }), { protein: 0, calories: 0 })
          const targets = get().getDailyTargets()
          const wDone = get().completedDates.includes(d) || get().workoutSessions.some(s => new Date(s.date).toISOString().slice(0, 10) === d && s.completed)
          return wDone && macros.protein >= targets.protein * 0.9
        }).length
        let streak = 0
        for (const d of last7) {
          const done = get().completedDates.includes(d) || get().workoutSessions.some(s => new Date(s.date).toISOString().slice(0, 10) === d && s.completed)
          if (done) streak++; else break
        }
        return { sessions: sessions.length, avgProtein, avgWater: 0, perfectDays, streak }
      },

      getTodayWorkout: () => {
        const today = new Date().toDateString()
        return get().workoutSessions.find(w => new Date(w.date).toDateString() === today)
      },

      getWeekSessions: () => {
        const weekAgo = Date.now() - 7 * 86400000
        return get().workoutSessions.filter(w => new Date(w.date).getTime() > weekAgo && w.completed)
      },

      getLatestMeasurement: () => get().measurements[0],

      resetDaily: () => set({ waterToday: 0 }),
    }),
    { name: 'kingdom-physical', storage: userStorage }
  )
)
