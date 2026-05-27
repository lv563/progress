import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import type { Task, Project, TaskStatus } from '@/types'

const DEMO_PROJECTS: Project[] = [
  { id: 'p1', name: 'Kingdom OS', description: 'Sistema OS personal', color: '#7C3AED', icon: '👑', status: 'active', tasks: [], createdAt: new Date().toISOString() },
  { id: 'p2', name: 'Negocio',    description: 'Proyectos profesionales', color: '#10B981', icon: '💼', status: 'active', tasks: [], createdAt: new Date().toISOString() },
  { id: 'p3', name: 'Personal',   description: 'Tareas personales', color: '#F59E0B', icon: '🏠', status: 'active', tasks: [], createdAt: new Date().toISOString() },
]

const DEMO_TASKS: Task[] = [
  { id: 't1', title: 'Diseñar sistema de hábitos',   status: 'in-progress', priority: 'p0', projectId: 'p1', tags: ['diseño'], order: 0, createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 86400000).toISOString() },
  { id: 't2', title: 'Implementar Pomodoro timer',   status: 'todo',        priority: 'p0', projectId: 'p1', tags: ['dev'],    order: 1, createdAt: new Date().toISOString() },
  { id: 't3', title: 'Auth con JWT',                 status: 'done',        priority: 'p1', projectId: 'p1', tags: ['backend'], order: 2, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
  { id: 't4', title: 'Llamar a proveedor de hosting',status: 'todo',        priority: 'p1', projectId: 'p2', tags: [],         order: 0, createdAt: new Date().toISOString() },
  { id: 't5', title: 'Preparar sermón del domingo',  status: 'todo',        priority: 'p1', tags: [],         order: 0, createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 3 * 86400000).toISOString() },
  { id: 't6', title: 'Renovar seguro médico',        status: 'todo',        priority: 'p2', tags: [],         order: 1, createdAt: new Date().toISOString() },
]

interface TasksStore {
  tasks: Task[]
  projects: Project[]
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'order'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  addProject: (project: Omit<Project, 'id' | 'tasks' | 'createdAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  getTodayTasks: () => Task[]
  getProjectTasks: (projectId: string) => Task[]
  _reset: () => void
}

export const useTasksStore = create<TasksStore>()(
  persist(
    (set, get) => ({
      tasks: DEMO_TASKS,
      projects: DEMO_PROJECTS,
      _reset: () => set({ tasks: DEMO_TASKS, projects: DEMO_PROJECTS }),

      addTask: (task) => set(s => ({
        tasks: [...s.tasks, { ...task, id: Math.random().toString(36).slice(2), order: s.tasks.length, createdAt: new Date().toISOString() }]
      })),

      updateTask: (id, updates) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      deleteTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),

      moveTask: (id, status) => set(s => ({
        tasks: s.tasks.map(t => t.id === id
          ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : undefined }
          : t
        )
      })),

      addProject: (project) => set(s => ({
        projects: [...s.projects, { ...project, id: Math.random().toString(36).slice(2), tasks: [], createdAt: new Date().toISOString() }]
      })),

      updateProject: (id, updates) => set(s => ({
        projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      deleteProject: (id) => set(s => ({
        projects: s.projects.filter(p => p.id !== id),
        tasks: s.tasks.filter(t => t.projectId !== id),
      })),

      getTodayTasks: () => {
        const today = new Date().toDateString()
        return get().tasks.filter(t =>
          t.status !== 'done' && (
            !t.dueDate || new Date(t.dueDate).toDateString() === today
          )
        )
      },

      getProjectTasks: (projectId) => get().tasks.filter(t => t.projectId === projectId),
    }),
    { name: 'kingdom-tasks', storage: userStorage }
  )
)
