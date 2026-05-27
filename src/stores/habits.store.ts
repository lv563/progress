import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { userStorage } from '@/lib/utils/userStorage'
import type { Habit, HabitLog } from '@/types'

const DEMO_HABITS: Habit[] = [
  { id: '1', name: 'Leer Biblia',     icon: '📖', color: '#7C3AED', category: 'spiritual', type: 'boolean', target: 1, frequency: 'daily', activeDays: [], streak: 47, bestStreak: 63, completionRate: 0.92, order: 0, createdAt: new Date().toISOString() },
  { id: '2', name: 'Oración',         icon: '🙏', color: '#EC4899', category: 'spiritual', type: 'duration', target: 15, unit: 'min', frequency: 'daily', activeDays: [], streak: 23, bestStreak: 45, completionRate: 0.87, order: 1, createdAt: new Date().toISOString() },
  { id: '3', name: 'Gimnasio',        icon: '💪', color: '#10B981', category: 'physical',  type: 'boolean', target: 1, frequency: 'custom', activeDays: [1,2,4,6], streak: 12, bestStreak: 28, completionRate: 0.78, order: 2, createdAt: new Date().toISOString() },
  { id: '4', name: 'Agua 2L',         icon: '💧', color: '#06B6D4', category: 'health',   type: 'numeric',  target: 8, unit: 'vasos', frequency: 'daily', activeDays: [], streak: 0, bestStreak: 14, completionRate: 0.55, order: 3, createdAt: new Date().toISOString() },
  { id: '5', name: 'Meditación',      icon: '🧘', color: '#F59E0B', category: 'mental',   type: 'duration', target: 10, unit: 'min', frequency: 'daily', activeDays: [], streak: 8, bestStreak: 21, completionRate: 0.70, order: 4, createdAt: new Date().toISOString() },
  { id: '6', name: 'Lectura',         icon: '📚', color: '#F97316', category: 'mental',   type: 'duration', target: 20, unit: 'min', frequency: 'daily', activeDays: [], streak: 31, bestStreak: 31, completionRate: 0.82, order: 5, createdAt: new Date().toISOString() },
]

interface HabitsStore {
  habits: Habit[]
  logs: HabitLog[]
  _reset: () => void
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'completionRate' | 'createdAt'>) => void
  updateHabit: (id: string, updates: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  logHabit: (habitId: string, value: number, date?: string) => void
  getLogForDate: (habitId: string, date: string) => HabitLog | undefined
  getTodayLogs: () => Record<string, HabitLog>
  getStreakDates: (habitId: string) => string[]
}

export const useHabitsStore = create<HabitsStore>()(
  persist(
    (set, get) => ({
      habits: DEMO_HABITS,
      logs: [],
      _reset: () => set({ habits: DEMO_HABITS, logs: [] }),

      addHabit: (habit) => set(s => ({
        habits: [...s.habits, {
          ...habit, id: Math.random().toString(36).slice(2),
          streak: 0, bestStreak: 0, completionRate: 0,
          createdAt: new Date().toISOString(),
        }]
      })),

      updateHabit: (id, updates) => set(s => ({
        habits: s.habits.map(h => h.id === id ? { ...h, ...updates } : h)
      })),

      deleteHabit: (id) => set(s => ({
        habits: s.habits.filter(h => h.id !== id),
        logs: s.logs.filter(l => l.habitId !== id),
      })),

      logHabit: (habitId, value, date) => {
        const today = date ?? format(new Date(), 'yyyy-MM-dd')
        const existing = get().logs.find(l => l.habitId === habitId && l.date === today)
        const habit = get().habits.find(h => h.id === habitId)
        const completed = habit ? value >= habit.target : value > 0

        if (existing) {
          set(s => ({
            logs: s.logs.map(l =>
              l.habitId === habitId && l.date === today
                ? { ...l, value, completed }
                : l
            )
          }))
        } else {
          set(s => ({
            logs: [...s.logs, {
              id: Math.random().toString(36).slice(2),
              habitId, date: today, value, completed,
            }]
          }))
        }
      },

      getLogForDate: (habitId, date) =>
        get().logs.find(l => l.habitId === habitId && l.date === date),

      getTodayLogs: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return get().logs
          .filter(l => l.date === today)
          .reduce((acc, l) => ({ ...acc, [l.habitId]: l }), {} as Record<string, HabitLog>)
      },

      getStreakDates: (habitId) =>
        get().logs.filter(l => l.habitId === habitId && l.completed).map(l => l.date),
    }),
    { name: 'kingdom-habits', storage: userStorage }
  )
)
