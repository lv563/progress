import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import { format, isToday, parseISO, differenceInCalendarDays } from 'date-fns'
import type { Goal, GoalType, GoalAchievement } from '@/types'

const genId = () => Math.random().toString(36).slice(2, 9)
const now = () => new Date().toISOString()
const today = () => format(new Date(), 'yyyy-MM-dd')

// ─── Achievement definitions ──────────────────────────────────────────────────

export const ACHIEVEMENTS_DEF: Omit<GoalAchievement, 'unlockedAt'>[] = [
  { id: 'a1', slug: 'primera_meta',   title: 'Primera Meta',       description: 'Completaste tu primera meta',             icon: '🏆', xpReward: 50  },
  { id: 'a2', slug: 'racha_7',        title: '7 Días de Fuego',    description: '7 días consecutivos completando tareas',  icon: '🔥', xpReward: 100 },
  { id: 'a3', slug: 'racha_30',       title: 'Un Mes Imparable',   description: '30 días consecutivos',                   icon: '⚡', xpReward: 300 },
  { id: 'a4', slug: 'racha_100',      title: 'Centurión',          description: '100 días consecutivos',                  icon: '💫', xpReward: 1000 },
  { id: 'a5', slug: 'meta_anual',     title: 'Año Épico',          description: 'Completaste una meta anual',             icon: '🌟', xpReward: 500 },
  { id: 'a6', slug: 'diez_metas',    title: 'Decena Perfecta',    description: '10 metas completadas',                   icon: '💎', xpReward: 200 },
  { id: 'a7', slug: 'cincuenta',      title: 'Maestro',            description: '50 metas completadas',                   icon: '👑', xpReward: 1000 },
  { id: 'a8', slug: 'cinco_hoy',      title: 'Día Épico',          description: '5 tareas diarias en un solo día',        icon: '🎯', xpReward: 75  },
  { id: 'a9', slug: 'meta_mensual',   title: 'Mes Conquistado',    description: 'Completaste una meta mensual',           icon: '📅', xpReward: 150 },
  { id:'a10', slug: 'meta_semanal',   title: 'Semana Perfecta',    description: 'Completaste una meta semanal',           icon: '✨', xpReward: 75  },
  { id:'a11', slug: 'todas_cat',      title: 'Equilibrado',        description: 'Una meta completada en cada categoría',  icon: '⚖️', xpReward: 300 },
  { id:'a12', slug: 'primer_anual',   title: 'Visionario',         description: 'Creaste tu primera meta anual',          icon: '🔭', xpReward: 25  },
]

// ─── XP per goal type ─────────────────────────────────────────────────────────

export const GOAL_XP: Record<GoalType, number> = {
  daily:   10,
  weekly:  50,
  monthly: 150,
  annual:  500,
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_GOALS: Goal[] = [
  {
    id: 'g1', title: 'Ahorrar $50,000 este año', description: 'Meta de ahorro anual para inversión',
    category: 'finance', priority: 'high', status: 'in-progress', progress: 30,
    type: 'annual', targetDate: '2026-12-31',
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'g2', title: 'Leer 24 libros', description: '2 libros por mes durante el año',
    category: 'education', priority: 'medium', status: 'in-progress', progress: 33,
    type: 'annual', targetDate: '2026-12-31',
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'g3', title: 'Aumentar 10kg de músculo', description: 'Con consistencia en gym y nutrición',
    category: 'health', priority: 'high', status: 'in-progress', progress: 20,
    type: 'annual', targetDate: '2026-12-31',
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'g4', title: 'Ahorrar $4,000 este mes', category: 'finance',
    priority: 'high', status: 'in-progress', progress: 45,
    type: 'monthly', parentId: 'g1', targetDate: format(new Date(), 'yyyy-MM-') + '30',
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'g5', title: 'Terminar "Atomic Habits"', category: 'education',
    priority: 'medium', status: 'in-progress', progress: 60,
    type: 'weekly', parentId: 'g2',
    targetDate: format(new Date(Date.now() + 5 * 86400000), 'yyyy-MM-dd'),
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'g6', title: 'Leer 20 minutos', category: 'education',
    priority: 'medium', status: 'not-started', progress: 0,
    type: 'daily', parentId: 'g5', targetDate: today(), time: '07:00', repeat: true,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'g7', title: 'Entrenamiento 45 min', category: 'health',
    priority: 'high', status: 'not-started', progress: 0,
    type: 'daily', parentId: 'g3', targetDate: today(), time: '06:00', repeat: true,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'g8', title: 'Beber 2L de agua', category: 'health',
    priority: 'low', status: 'not-started', progress: 0,
    type: 'daily', targetDate: today(), repeat: true,
    createdAt: now(), updatedAt: now(),
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface GoalsStore {
  goals: Goal[]
  achievements: GoalAchievement[]
  streak: number
  streakLastDate: string | null

  addGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  completeGoal: (id: string) => GoalAchievement[]
  toggleDailyTask: (id: string) => { completed: boolean; newAchievements: GoalAchievement[] }
  updateProgress: (id: string, progress: number) => void

  getByType: (type: GoalType) => Goal[]
  getChildren: (parentId: string) => Goal[]
  getTodayTasks: () => Goal[]
  getCompletedGoals: () => Goal[]

  checkAchievements: () => GoalAchievement[]
  updateStreak: () => void

  _reset: () => void
}

export const useGoalsStore = create<GoalsStore>()(
  persist(
    (set, get) => ({
      goals: DEMO_GOALS,
      achievements: ACHIEVEMENTS_DEF.map(a => ({ ...a })),
      streak: 0,
      streakLastDate: null,

      addGoal: (g) => {
        const id = genId()
        const goal: Goal = { ...g, id, createdAt: now(), updatedAt: now() }
        set(s => ({ goals: [goal, ...s.goals] }))
        // unlock "primer_anual" if annual
        if (g.type === 'annual') {
          setTimeout(() => get().checkAchievements(), 50)
        }
        return id
      },

      updateGoal: (id, updates) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, ...updates, updatedAt: now() } : g),
      })),

      deleteGoal: (id) => set(s => ({
        goals: s.goals.filter(g => g.id !== id && g.parentId !== id),
      })),

      completeGoal: (id) => {
        set(s => ({
          goals: s.goals.map(g =>
            g.id === id
              ? { ...g, status: 'completed', progress: 100, completedAt: now(), updatedAt: now() }
              : g
          ),
        }))
        get().updateStreak()
        return get().checkAchievements()
      },

      toggleDailyTask: (id) => {
        const task = get().goals.find(g => g.id === id)
        if (!task) return { completed: false, newAchievements: [] }

        const alreadyDone = task.checkedDate === today()
        set(s => ({
          goals: s.goals.map(g =>
            g.id === id
              ? {
                  ...g,
                  checkedDate: alreadyDone ? undefined : today(),
                  status: alreadyDone ? 'not-started' : 'completed',
                  progress: alreadyDone ? 0 : 100,
                  completedAt: alreadyDone ? undefined : now(),
                  updatedAt: now(),
                }
              : g
          ),
        }))

        if (!alreadyDone) {
          get().updateStreak()
          const newAchievements = get().checkAchievements()
          return { completed: true, newAchievements }
        }
        return { completed: false, newAchievements: [] }
      },

      updateProgress: (id, progress) => set(s => ({
        goals: s.goals.map(g =>
          g.id === id
            ? {
                ...g, progress,
                status: progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : g.status,
                completedAt: progress >= 100 ? now() : g.completedAt,
                updatedAt: now(),
              }
            : g
        ),
      })),

      getByType: (type) => get().goals.filter(g => g.type === type),

      getChildren: (parentId) => get().goals.filter(g => g.parentId === parentId),

      getTodayTasks: () => {
        const t = today()
        return get().goals.filter(g =>
          g.type === 'daily' && (g.targetDate === t || g.repeat)
        )
      },

      getCompletedGoals: () => get().goals.filter(g => g.status === 'completed'),

      updateStreak: () => {
        const { streak, streakLastDate } = get()
        const t = today()
        if (streakLastDate === t) return
        const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
        const newStreak = streakLastDate === yesterday ? streak + 1 : 1
        set({ streak: newStreak, streakLastDate: t })
      },

      checkAchievements: () => {
        const s = get()
        const completed = s.goals.filter(g => g.status === 'completed')
        const lockedAchs = s.achievements.filter(a => !a.unlockedAt)
        const todayStr = today()
        const todayDone = completed.filter(g => g.type === 'daily' && g.checkedDate === todayStr)
        const cats = new Set(completed.map(g => g.category))

        const unlocked: GoalAchievement[] = []

        for (const ach of lockedAchs) {
          let shouldUnlock = false
          switch (ach.slug) {
            case 'primera_meta':  shouldUnlock = completed.length >= 1; break
            case 'racha_7':       shouldUnlock = s.streak >= 7; break
            case 'racha_30':      shouldUnlock = s.streak >= 30; break
            case 'racha_100':     shouldUnlock = s.streak >= 100; break
            case 'meta_anual':    shouldUnlock = completed.some(g => g.type === 'annual'); break
            case 'meta_mensual':  shouldUnlock = completed.some(g => g.type === 'monthly'); break
            case 'meta_semanal':  shouldUnlock = completed.some(g => g.type === 'weekly'); break
            case 'diez_metas':   shouldUnlock = completed.length >= 10; break
            case 'cincuenta':     shouldUnlock = completed.length >= 50; break
            case 'cinco_hoy':     shouldUnlock = todayDone.length >= 5; break
            case 'todas_cat':     shouldUnlock = cats.size >= 7; break
            case 'primer_anual':  shouldUnlock = s.goals.some(g => g.type === 'annual'); break
          }
          if (shouldUnlock) unlocked.push({ ...ach, unlockedAt: now() })
        }

        if (unlocked.length > 0) {
          set(st => ({
            achievements: st.achievements.map(a => {
              const u = unlocked.find(u => u.slug === a.slug)
              return u ? u : a
            }),
          }))
        }
        return unlocked
      },

      _reset: () => set({ goals: DEMO_GOALS, achievements: ACHIEVEMENTS_DEF.map(a => ({ ...a })), streak: 0, streakLastDate: null }),
    }),
    { name: 'kingdom-goals', storage: userStorage }
  )
)
