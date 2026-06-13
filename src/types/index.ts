/* ── User & Auth ─────────────────────────────── */
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  xp: number
  level: number
  streak: number
  bestStreak: number
  badges: string[]
  createdAt: string
}

/* ── Gamification ────────────────────────────── */
export interface XPTransaction {
  id: string
  amount: number
  reason: string
  category: 'habit' | 'pomodoro' | 'task' | 'gym' | 'spiritual' | 'bonus'
  createdAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
  category: 'streak' | 'spiritual' | 'physical' | 'productivity' | 'special'
}

/* ── Habits ──────────────────────────────────── */
export type HabitType = 'boolean' | 'counter' | 'duration' | 'numeric'
export type HabitCategory = 'spiritual' | 'physical' | 'mental' | 'work' | 'social' | 'health'
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom'

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  category: HabitCategory
  type: HabitType
  target: number
  unit?: string
  frequency: HabitFrequency
  activeDays?: number[]
  streak: number
  bestStreak: number
  completionRate: number
  order: number
  createdAt: string
}

export interface HabitLog {
  id: string
  habitId: string
  date: string
  value: number
  completed: boolean
  notes?: string
}

/* ── Pomodoro ────────────────────────────────── */
export type PomodoroMode = 'focus' | 'short-break' | 'long-break' | 'deep-work'
export type AmbientSound = 'none' | 'lofi' | 'rain' | 'forest' | 'cafe' | 'white-noise'

export interface PomodoroSession {
  id: string
  startedAt: string
  completedAt?: string
  duration: number
  mode: PomodoroMode
  taskId?: string
  taskTitle?: string | undefined
  completed: boolean
}

export interface PomodoroConfig {
  focusDuration: number
  shortBreak: number
  longBreak: number
  sessionsBeforeLong: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
  ambientSound: AmbientSound
  volume: number
}

/* ── Tasks ───────────────────────────────────── */
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done'
export type TaskPriority = 'p0' | 'p1' | 'p2' | 'p3'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  projectId?: string
  dueDate?: string
  completedAt?: string
  tags: string[]
  order: number
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  tasks: Task[]
  createdAt: string
}

/* ── Routine ─────────────────────────────────── */
export interface RoutineBlock {
  id: string
  title: string
  category: 'spiritual' | 'work' | 'physical' | 'rest' | 'personal' | 'social'
  startTime: string
  endTime: string
  color: string
  icon: string
  completed?: boolean
}

export interface DailyRoutine {
  id: string
  date: string
  blocks: RoutineBlock[]
  templateId?: string
}

export interface RoutineTemplate {
  id: string
  name: string
  blocks: Omit<RoutineBlock, 'id' | 'completed'>[]
}

/* ── Physical ────────────────────────────────── */
export interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  category: 'compound' | 'isolation' | 'cardio' | 'mobility'
  equipment: string
}

export interface ExerciseSet {
  reps: number
  weight: number
  rpe?: number
  isWarmup: boolean
  isPR: boolean
  completedAt?: string
}

export interface ExerciseLog {
  exerciseId: string
  exercise: Exercise
  sets: ExerciseSet[]
}

export type WorkoutType = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full-body' | 'cardio' | 'custom'

export interface WorkoutSession {
  id: string
  date: string
  type: WorkoutType
  name: string
  exercises: ExerciseLog[]
  duration: number
  volume: number
  notes?: string
  mood: 1 | 2 | 3 | 4 | 5
  completed: boolean
}

export interface BodyMeasurement {
  id: string
  date: string
  weight?: number
  bodyFat?: number
  chest?: number
  waist?: number
  hips?: number
  bicep?: number
  notes?: string
}

export interface NutritionLog {
  id: string
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
  meals: Meal[]
}

export interface Meal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  time: string
}

/* ── Ministry ────────────────────────────────── */
export type SpiritualLevel = 'visitor' | 'new-believer' | 'growing' | 'mature' | 'leader'
export type FollowUpType = 'call' | 'whatsapp' | 'visit' | 'pray' | 'email'

export interface SpiritualPerson {
  id: string
  name: string
  phone?: string
  email?: string
  avatar?: string
  level: SpiritualLevel
  discipleshipProgress: number
  lastContact?: string
  nextFollowUp?: string
  followUpType: FollowUpType
  notes: Note[]
  createdAt: string
}

export interface Note {
  id: string
  content: string
  createdAt: string
}

export interface ChurchEvent {
  id: string
  title: string
  date: string
  time: string
  location?: string
  type: 'service' | 'group' | 'prayer' | 'retreat' | 'other'
  description?: string
}

export interface Devotional {
  id: string
  date: string
  passage: string
  content: string
  prayerTopics: string[]
}

/* ── Vault ───────────────────────────────────── */
export type VaultItemType = 'document' | 'note' | 'credential' | 'link' | 'image'

export interface VaultFolder {
  id: string
  name: string
  icon: string
  color: string
  parentId?: string
  createdAt: string
}

export interface VaultItem {
  id: string
  title: string
  type: VaultItemType
  folderId?: string
  tags: string[]
  content?: string
  url?: string
  username?: string
  encrypted: boolean
  starred: boolean
  createdAt: string
  updatedAt: string
}

/* ── Goals & Progress ────────────────────────── */
export type GoalType     = 'annual' | 'monthly' | 'weekly' | 'daily'
export type GoalCategory = 'finance' | 'health' | 'career' | 'spiritual' | 'relationships' | 'education' | 'personal'
export type GoalStatus   = 'not-started' | 'in-progress' | 'completed' | 'paused'
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Goal {
  id: string
  title: string
  description?: string
  category: GoalCategory
  priority: GoalPriority
  status: GoalStatus
  progress: number
  type: GoalType
  parentId?: string
  targetDate: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  // daily-specific
  time?: string
  repeat?: boolean
  checkedDate?: string
  notes?: string
}

export interface GoalAchievement {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  xpReward: number
  unlockedAt?: string
}
