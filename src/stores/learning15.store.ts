'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import { format } from 'date-fns'
import type { LearningCategory, Difficulty } from '@/data/learning-topics'

export type SessionPhase = 'discover' | 'research' | 'organize' | 'explain' | 'evaluate' | 'completed'

export interface OrganizeNotes {
  mainIdea: string
  keyConcepts: string[]   // 3 concepts
  example: string
  pendingQuestion: string
}

export interface EvaluationScore {
  comprehension: number   // 0-10, weight 40%
  clarity: number         // 0-10, weight 25%
  structure: number       // 0-10, weight 20%
  accuracy: number        // 0-10, weight 15%
  total: number           // weighted total
  notes: string           // feedback / what to review
}

export interface LearningSession {
  id: string
  topicId: string
  topicTitle: string
  category: LearningCategory
  difficulty: Difficulty
  date: string            // YYYY-MM-DD
  startedAt: string       // ISO
  completedAt?: string    // ISO
  phase: SessionPhase

  // Study time tracking (seconds)
  discoverSec: number
  researchSec: number
  organizeSec: number
  explainSec: number
  evaluateSec: number

  // Content
  researchNotes: string
  organizeNotes: OrganizeNotes
  explanation: string       // the 1-minute explanation text
  evaluation: EvaluationScore | null
  sources: string[]         // sources the user noted

  // Scheduling
  nextReviewDate?: string   // YYYY-MM-DD
  reviewIntervalDays?: number
  reviewCount: number

  // Meta
  isFavorite: boolean
  status: 'in-progress' | 'completed' | 'review'
}

const genId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
const today = () => format(new Date(), 'yyyy-MM-dd')

const REVIEW_INTERVALS = [1, 3, 7, 30]

interface Learning15Store {
  sessions: LearningSession[]
  activeSessionId: string | null
  favoritTopicIds: string[]

  // Actions
  startSession: (topicId: string, topicTitle: string, category: LearningCategory, difficulty: Difficulty) => string
  updateSession: (id: string, updates: Partial<LearningSession>) => void
  advancePhase: (id: string, phase: SessionPhase, elapsedSec: number) => void
  completeSession: (id: string, evaluation: EvaluationScore) => void
  scheduleReview: (id: string, intervalDays?: number) => void
  deleteSession: (id: string) => void
  toggleFavorite: (topicId: string) => void

  // Computed
  getCompletedSessions: () => LearningSession[]
  getSessionsByTopic: (topicId: string) => LearningSession[]
  getDueReviews: () => LearningSession[]
  getStreak: () => number
  getTotalSeconds: () => number
  getCategoryDistribution: () => Record<string, number>
  getStudiedTopicIds: () => string[]
  _reset: () => void
}

export const useLearning15Store = create<Learning15Store>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      favoritTopicIds: [],

      startSession: (topicId, topicTitle, category, difficulty) => {
        const id = genId()
        const session: LearningSession = {
          id, topicId, topicTitle, category, difficulty,
          date: today(),
          startedAt: new Date().toISOString(),
          phase: 'discover',
          discoverSec: 0, researchSec: 0, organizeSec: 0, explainSec: 0, evaluateSec: 0,
          researchNotes: '',
          organizeNotes: { mainIdea: '', keyConcepts: ['', '', ''], example: '', pendingQuestion: '' },
          explanation: '',
          evaluation: null,
          sources: [],
          reviewCount: 0,
          isFavorite: false,
          status: 'in-progress',
        }
        set(s => ({ sessions: [...s.sessions, session], activeSessionId: id }))
        return id
      },

      updateSession: (id, updates) => {
        set(s => ({ sessions: s.sessions.map(se => se.id === id ? { ...se, ...updates } : se) }))
      },

      advancePhase: (id, phase, elapsedSec) => {
        set(s => ({
          sessions: s.sessions.map(se => {
            if (se.id !== id) return se
            const phaseKey = (`${se.phase}Sec` as keyof LearningSession)
            return { ...se, [phaseKey]: (se[phaseKey] as number) + elapsedSec, phase }
          }),
        }))
      },

      completeSession: (id, evaluation) => {
        const session = get().sessions.find(s => s.id === id)
        if (!session) return
        const nextReviewDate = new Date()
        nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS[0])
        set(s => ({
          sessions: s.sessions.map(se =>
            se.id === id
              ? {
                  ...se,
                  evaluation,
                  completedAt: new Date().toISOString(),
                  phase: 'completed',
                  status: 'completed',
                  nextReviewDate: format(nextReviewDate, 'yyyy-MM-dd'),
                  reviewIntervalDays: REVIEW_INTERVALS[0],
                }
              : se
          ),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        }))
      },

      scheduleReview: (id, intervalDays) => {
        const session = get().sessions.find(s => s.id === id)
        if (!session) return
        const currentInterval = session.reviewIntervalDays ?? REVIEW_INTERVALS[0]
        const reviewCount = session.reviewCount + 1
        const nextInterval = intervalDays ?? REVIEW_INTERVALS[Math.min(reviewCount, REVIEW_INTERVALS.length - 1)]
        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + nextInterval)
        set(s => ({
          sessions: s.sessions.map(se =>
            se.id === id
              ? { ...se, reviewCount, nextReviewDate: format(nextDate, 'yyyy-MM-dd'), reviewIntervalDays: nextInterval, status: 'review' }
              : se
          ),
        }))
      },

      deleteSession: (id) => {
        set(s => ({
          sessions: s.sessions.filter(se => se.id !== id),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        }))
      },

      toggleFavorite: (topicId) => {
        const favs = get().favoritTopicIds
        set({
          favoritTopicIds: favs.includes(topicId)
            ? favs.filter(f => f !== topicId)
            : [...favs, topicId],
        })
      },

      getCompletedSessions: () => get().sessions.filter(s => s.status === 'completed' || s.status === 'review'),

      getSessionsByTopic: (topicId) => get().sessions.filter(s => s.topicId === topicId),

      getDueReviews: () => {
        const t = today()
        return get().sessions.filter(s => s.nextReviewDate && s.nextReviewDate <= t && s.status !== 'in-progress')
      },

      getStreak: () => {
        const completed = get().sessions.filter(s => s.status !== 'in-progress')
        const days = new Set(completed.map(s => s.date))
        const t = today()
        const hasToday = days.has(t)
        let streak = 0
        for (let i = hasToday ? 0 : 1; i < 365; i++) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = format(d, 'yyyy-MM-dd')
          if (days.has(key)) streak++
          else break
        }
        return streak
      },

      getTotalSeconds: () =>
        get().getCompletedSessions().reduce((a, s) => a + s.discoverSec + s.researchSec + s.organizeSec + s.explainSec + s.evaluateSec, 0),

      getCategoryDistribution: () => {
        const dist: Record<string, number> = {}
        get().getCompletedSessions().forEach(s => {
          dist[s.category] = (dist[s.category] ?? 0) + 1
        })
        return dist
      },

      getStudiedTopicIds: () => {
        const ids = new Set(get().getCompletedSessions().map(s => s.topicId))
        return Array.from(ids)
      },

      _reset: () => set({ sessions: [], activeSessionId: null, favoritTopicIds: [] }),
    }),
    { name: 'kingdom-learning15', storage: userStorage }
  )
)
