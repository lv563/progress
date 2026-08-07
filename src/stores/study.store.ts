import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

export interface StudyGoal {
  id: string
  name: string
  totalHours: number
  dailyHours: number
  startDate: string
  status: 'active' | 'paused' | 'completed'
  pausedAt?: string
  pausedDays: number
}

export interface StudyPhase {
  id: string
  goalId: string
  name: string
  order: number
  targetHours: number
  status: 'pending' | 'in-progress' | 'completed'
  completedAt?: string
  notes?: string
  resources?: string
}

export interface StudySession {
  id: string
  goalId: string
  phaseId: string
  date: string        // YYYY-MM-DD
  hours: number
  note?: string
  source: 'manual' | 'pomodoro'
  createdAt: string
}

export interface PendingPomodoro {
  durationMin: number
  taskTitle?: string
  completedAt: string
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36).slice(-4)

interface StudyStore {
  goals: StudyGoal[]
  phases: StudyPhase[]
  sessions: StudySession[]
  pendingPomodoro: PendingPomodoro | null

  addGoal: (g: Pick<StudyGoal, 'name' | 'totalHours' | 'dailyHours'>) => string
  updateGoal: (id: string, u: Partial<StudyGoal>) => void
  removeGoal: (id: string) => void
  pauseGoal: (id: string) => void
  resumeGoal: (id: string) => void

  addPhase: (p: Pick<StudyPhase, 'goalId' | 'name' | 'order' | 'targetHours'> & { resources?: string }) => string
  updatePhase: (id: string, u: Partial<StudyPhase>) => void
  removePhase: (id: string) => void
  completePhase: (id: string, notes?: string) => void

  addSession: (s: Omit<StudySession, 'id' | 'createdAt'>) => void
  removeSession: (id: string) => void
  setPendingPomodoro: (p: PendingPomodoro | null) => void

  getGoalPhases: (goalId: string) => StudyPhase[]
  getGoalHours: (goalId: string) => number
  getPhaseHours: (phaseId: string) => number
  getActivePhase: (goalId: string) => StudyPhase | undefined
  getStreak: () => number
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      goals: [], phases: [], sessions: [], pendingPomodoro: null,

      addGoal: (g) => {
        const id = uid()
        set(s => ({ goals: [...s.goals, { ...g, id, status: 'active', startDate: new Date().toISOString(), pausedDays: 0 }] }))
        return id
      },
      updateGoal: (id, u) => set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...u } : g) })),
      removeGoal: (id) => set(s => ({
        goals: s.goals.filter(g => g.id !== id),
        phases: s.phases.filter(p => p.goalId !== id),
        sessions: s.sessions.filter(se => se.goalId !== id),
      })),
      pauseGoal: (id) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, status: 'paused', pausedAt: new Date().toISOString() } : g)
      })),
      resumeGoal: (id) => {
        const goal = get().goals.find(g => g.id === id)
        if (!goal?.pausedAt) return
        const days = Math.floor((Date.now() - new Date(goal.pausedAt).getTime()) / 86400000)
        set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, status: 'active', pausedAt: undefined, pausedDays: g.pausedDays + days } : g) }))
      },

      addPhase: (p) => {
        const id = uid()
        const existing = get().phases.filter(ph => ph.goalId === p.goalId)
        const allCompleted = existing.length > 0 && existing.every(ph => ph.status === 'completed')
        const status: StudyPhase['status'] = (existing.length === 0 || allCompleted) ? 'in-progress' : 'pending'
        set(s => ({ phases: [...s.phases, { resources: '', ...p, id, status }] }))
        return id
      },
      updatePhase: (id, u) => set(s => ({ phases: s.phases.map(p => p.id === id ? { ...p, ...u } : p) })),
      removePhase: (id) => set(s => ({
        phases: s.phases.filter(p => p.id !== id),
        sessions: s.sessions.filter(se => se.phaseId !== id),
      })),
      completePhase: (id, notes) => {
        const phase = get().phases.find(p => p.id === id)
        if (!phase) return
        set(s => ({
          phases: s.phases.map(p => p.id === id ? { ...p, status: 'completed', completedAt: new Date().toISOString(), notes: notes ?? p.notes } : p)
        }))
        // Unlock next phase
        const sorted = get().phases.filter(p => p.goalId === phase.goalId).sort((a, b) => a.order - b.order)
        const idx = sorted.findIndex(p => p.id === id)
        const next = sorted[idx + 1]
        if (next?.status === 'pending') {
          set(s => ({ phases: s.phases.map(p => p.id === next.id ? { ...p, status: 'in-progress' } : p) }))
        }
        // Auto-complete goal
        if (get().phases.filter(p => p.goalId === phase.goalId).every(p => p.status === 'completed')) {
          set(s => ({ goals: s.goals.map(g => g.id === phase.goalId ? { ...g, status: 'completed' } : g) }))
        }
      },

      addSession: (s) => {
        const id = uid()
        set(st => ({ sessions: [...st.sessions, { ...s, id, createdAt: new Date().toISOString() }] }))
        const phase = get().phases.find(p => p.id === s.phaseId)
        if (phase?.status === 'in-progress' && get().getPhaseHours(s.phaseId) >= phase.targetHours) {
          get().completePhase(s.phaseId)
        }
      },
      removeSession: (id) => set(s => ({ sessions: s.sessions.filter(se => se.id !== id) })),
      setPendingPomodoro: (p) => set({ pendingPomodoro: p }),

      getGoalPhases: (goalId) => get().phases.filter(p => p.goalId === goalId).sort((a, b) => a.order - b.order),
      getGoalHours: (goalId) => get().sessions.filter(s => s.goalId === goalId).reduce((a, s) => a + s.hours, 0),
      getPhaseHours: (phaseId) => get().sessions.filter(s => s.phaseId === phaseId).reduce((a, s) => a + s.hours, 0),
      getActivePhase: (goalId) => {
        const phases = get().getGoalPhases(goalId)
        return phases.find(p => p.status === 'in-progress') ?? phases.find(p => p.status === 'pending')
      },
      getStreak: () => {
        const sessions = get().sessions
        const now = new Date()
        const todayStr = now.toISOString().slice(0, 10)
        const hasTodayMin = sessions.filter(s => s.date === todayStr).reduce((a, s) => a + s.hours, 0) >= 0.5
        let streak = 0
        for (let i = hasTodayMin ? 0 : 1; i < 365; i++) {
          const d = new Date(now); d.setDate(d.getDate() - i)
          const dayStr = d.toISOString().slice(0, 10)
          if (sessions.filter(s => s.date === dayStr).reduce((a, s) => a + s.hours, 0) >= 0.5) streak++
          else break
        }
        return streak
      },
    }),
    { name: 'kingdom-study', storage: userStorage, partialize: s => ({ goals: s.goals, phases: s.phases, sessions: s.sessions }) }
  )
)
