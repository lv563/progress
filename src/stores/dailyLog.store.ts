import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

export interface DailyLog {
  date: string           // yyyy-MM-dd
  habitsCompleted: number
  habitTotal: number
  pomodoroSessions: number
  focusMinutes: number
  tasksCompleted: number
  waterGlasses: number
  mealsEaten: number
  mealsTarget: number
  gymDone: boolean
  score: number          // 0-100
}

interface DailyLogStore {
  logs: DailyLog[]
  lastResetDate: string  // yyyy-MM-dd of last daily reset
  saveLog: (log: DailyLog) => void
  setLastResetDate: (date: string) => void
  getLog: (date: string) => DailyLog | undefined
  getWeekLogs: () => DailyLog[]
  getYesterdayLog: () => DailyLog | undefined
  _reset: () => void
}

export const useDailyLogStore = create<DailyLogStore>()(
  persist(
    (set, get) => ({
      logs: [],
      lastResetDate: '',
      _reset: () => set({ logs: [], lastResetDate: '' }),

      saveLog: (log) => set(s => ({
        logs: [log, ...s.logs.filter(l => l.date !== log.date)].slice(0, 90), // keep 90 days
      })),

      setLastResetDate: (date) => set({ lastResetDate: date }),

      getLog: (date) => get().logs.find(l => l.date === date),

      getWeekLogs: () => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 7)
        const cutoffStr = cutoff.toISOString().slice(0, 10)
        return get().logs.filter(l => l.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date))
      },

      getYesterdayLog: () => {
        const d = new Date()
        d.setDate(d.getDate() - 1)
        const yesterday = d.toISOString().slice(0, 10)
        return get().logs.find(l => l.date === yesterday)
      },
    }),
    { name: 'kingdom-daily-logs', storage: userStorage }
  )
)
