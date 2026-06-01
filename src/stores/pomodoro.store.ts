import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import type { PomodoroSession, PomodoroConfig, PomodoroMode } from '@/types'

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

const modeDur = (mode: PomodoroMode, cfg: PomodoroConfig) =>
  mode === 'focus' ? cfg.focusDuration
  : mode === 'deep-work' ? 90
  : mode === 'short-break' ? cfg.shortBreak
  : cfg.longBreak

interface PomodoroStore {
  config: PomodoroConfig
  sessions: PomodoroSession[]
  currentMode: PomodoroMode
  isRunning: boolean
  isPaused: boolean
  secondsLeft: number
  sessionCount: number
  currentTaskTitle: string
  timerEndAt: number | null  // ms timestamp — keeps timer accurate in background tabs

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
      timerEndAt: null,

      setConfig: (config) => set(s => ({ config: { ...s.config, ...config } })),

      startTimer: (mode = 'focus') => {
        const cfg = get().config
        const dur = modeDur(mode, cfg)
        set({
          currentMode: mode,
          isRunning: true,
          isPaused: false,
          secondsLeft: dur * 60,
          timerEndAt: Date.now() + dur * 60 * 1000,
        })
      },

      pauseTimer: () => set({ isPaused: true, isRunning: false, timerEndAt: null }),

      resumeTimer: () => {
        const { secondsLeft } = get()
        set({ isPaused: false, isRunning: true, timerEndAt: Date.now() + secondsLeft * 1000 })
      },

      stopTimer: () => {
        const cfg = get().config
        set({ isRunning: false, isPaused: false, secondsLeft: cfg.focusDuration * 60, currentMode: 'focus', timerEndAt: null })
      },

      // Timestamp-based: accurate even when browser throttles the interval in background
      tickTimer: () => {
        const { isRunning, timerEndAt } = get()
        if (!isRunning || !timerEndAt) return
        const remaining = Math.ceil((timerEndAt - Date.now()) / 1000)
        if (remaining <= 0) {
          set({ secondsLeft: 0 })
          get().completeSession()
        } else {
          set({ secondsLeft: remaining })
        }
      },

      completeSession: () => {
        const { currentMode, sessionCount, config, currentTaskTitle } = get()
        const isBreak = currentMode !== 'focus' && currentMode !== 'deep-work'
        const dur = modeDur(currentMode, config)

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
          const autoEnd = config.autoStartBreaks ? Date.now() + nextDur * 60 * 1000 : null
          set(s => ({
            sessions: [...s.sessions, session],
            sessionCount: newCount,
            isRunning: config.autoStartBreaks,
            isPaused: !config.autoStartBreaks,
            currentMode: nextMode,
            secondsLeft: nextDur * 60,
            timerEndAt: autoEnd,
          }))
        } else {
          const nextDur = config.focusDuration
          const autoEnd = config.autoStartFocus ? Date.now() + nextDur * 60 * 1000 : null
          set({
            isRunning: config.autoStartFocus,
            isPaused: !config.autoStartFocus,
            currentMode: 'focus',
            secondsLeft: nextDur * 60,
            timerEndAt: autoEnd,
          })
        }
      },

      setCurrentTask: (title) => set({ currentTaskTitle: title }),

      _reset: () => set({
        sessions: [], sessionCount: 0, isRunning: false, isPaused: false,
        currentMode: 'focus', secondsLeft: DEFAULT_CONFIG.focusDuration * 60,
        currentTaskTitle: '', timerEndAt: null,
      }),

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
