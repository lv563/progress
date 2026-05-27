import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import type { PomodoroSession, PomodoroConfig, PomodoroMode, AmbientSound } from '@/types'

const DEFAULT_CONFIG: PomodoroConfig = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLong: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  ambientSound: 'none',
  volume: 70,
}

interface PomodoroStore {
  config: PomodoroConfig
  sessions: PomodoroSession[]
  currentMode: PomodoroMode
  isRunning: boolean
  isPaused: boolean
  secondsLeft: number
  sessionCount: number
  currentTaskTitle: string

  setConfig: (config: Partial<PomodoroConfig>) => void
  startTimer: (mode?: PomodoroMode) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  tickTimer: () => void
  completeSession: () => void
  setCurrentTask: (title: string) => void
  getTodaySessions: () => PomodoroSession[]
  getWeekMinutes: () => number
  _reset: () => void
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      sessions: [],
      currentMode: 'focus',
      isRunning: false,
      isPaused: false,
      secondsLeft: DEFAULT_CONFIG.focusDuration * 60,
      sessionCount: 0,
      currentTaskTitle: '',

      setConfig: (config) => set(s => ({ config: { ...s.config, ...config } })),

      startTimer: (mode = 'focus') => {
        const cfg = get().config
        const dur = mode === 'focus' ? cfg.focusDuration
          : mode === 'deep-work' ? 90
          : mode === 'short-break' ? cfg.shortBreak
          : cfg.longBreak
        set({ currentMode: mode, isRunning: true, isPaused: false, secondsLeft: dur * 60 })
      },

      pauseTimer: () => set({ isPaused: true, isRunning: false }),
      resumeTimer: () => set({ isPaused: false, isRunning: true }),

      stopTimer: () => {
        const cfg = get().config
        set({ isRunning: false, isPaused: false, secondsLeft: cfg.focusDuration * 60, currentMode: 'focus' })
      },

      tickTimer: () => {
        const { secondsLeft, isRunning } = get()
        if (!isRunning || secondsLeft <= 0) return
        if (secondsLeft === 1) {
          get().completeSession()
        } else {
          set({ secondsLeft: secondsLeft - 1 })
        }
      },

      completeSession: () => {
        const { currentMode, sessionCount, config, currentTaskTitle } = get()
        const isBreak = currentMode !== 'focus' && currentMode !== 'deep-work'
        const dur = currentMode === 'focus' ? config.focusDuration
          : currentMode === 'deep-work' ? 90
          : currentMode === 'short-break' ? config.shortBreak
          : config.longBreak

        if (!isBreak) {
          const newCount = sessionCount + 1
          const session: PomodoroSession = {
            id: Math.random().toString(36).slice(2),
            startedAt: new Date(Date.now() - dur * 60 * 1000).toISOString(),
            completedAt: new Date().toISOString(),
            duration: dur,
            mode: currentMode,
            taskTitle: currentTaskTitle || undefined,
            completed: true,
          }
          const nextMode = newCount % config.sessionsBeforeLong === 0 ? 'long-break' : 'short-break'
          const nextDur = nextMode === 'long-break' ? config.longBreak : config.shortBreak
          set(s => ({
            sessions: [...s.sessions, session],
            sessionCount: newCount,
            isRunning: config.autoStartBreaks,
            isPaused: !config.autoStartBreaks,
            currentMode: nextMode,
            secondsLeft: nextDur * 60,
          }))
        } else {
          set({
            isRunning: config.autoStartFocus,
            isPaused: !config.autoStartFocus,
            currentMode: 'focus',
            secondsLeft: config.focusDuration * 60,
          })
        }
      },

      setCurrentTask: (title) => set({ currentTaskTitle: title }),

      _reset: () => set({ sessions: [], sessionCount: 0, isRunning: false, isPaused: false, currentMode: 'focus', secondsLeft: DEFAULT_CONFIG.focusDuration * 60, currentTaskTitle: '' }),

      getTodaySessions: () => {
        const today = new Date().toDateString()
        return get().sessions.filter(s => new Date(s.startedAt).toDateString() === today && s.completed)
      },

      getWeekMinutes: () => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        return get().sessions
          .filter(s => s.completed && new Date(s.startedAt).getTime() > weekAgo)
          .reduce((acc, s) => acc + s.duration, 0)
      },
    }),
    { name: 'kingdom-pomodoro', storage: userStorage, partialize: s => ({ config: s.config, sessions: s.sessions }) }
  )
)
