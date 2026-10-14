'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

const genId = () => Math.random().toString(36).slice(2, 9)

export type TodoPriority = 'high' | 'normal' | 'low'
export type TodoCategory = 'personal' | 'trabajo' | 'estudio' | 'fitness' | 'familia' | 'espiritual' | 'finanzas' | 'negocio' | 'otros'

export interface DailyTodo {
  id: string
  date: string
  text: string
  completed: boolean
  priority: TodoPriority
  category?: TodoCategory
  time?: string
  createdAt: string
}

export interface DailyNote {
  date: string
  text: string
  updatedAt: string
}

export interface InboxItem {
  id: string
  text: string
  createdAt: string
}

interface DailyCommandStore {
  todos: DailyTodo[]
  notes: DailyNote[]
  inbox: InboxItem[]

  addTodo: (date: string, text: string, priority?: TodoPriority) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  updateTodoPriority: (id: string, priority: TodoPriority) => void

  saveNote: (date: string, text: string) => void
  getNoteText: (date: string) => string

  addInboxItem: (text: string) => void
  assignInboxToDate: (id: string, date: string) => void
  deleteInboxItem: (id: string) => void

  getDayTodos: (date: string) => DailyTodo[]
  getDayCompletion: (date: string) => { done: number; total: number; pct: number }
}

export const useDailyCommandStore = create<DailyCommandStore>()(
  persist(
    (set, get) => ({
      todos: [],
      notes: [],
      inbox: [],

      addTodo: (date, text, priority = 'normal') => {
        if (!text.trim()) return
        set(s => ({
          todos: [...s.todos, {
            id: genId(), date, text: text.trim(), completed: false,
            priority, createdAt: new Date().toISOString(),
          }]
        }))
      },

      toggleTodo: (id) => set(s => ({
        todos: s.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),

      deleteTodo: (id) => set(s => ({ todos: s.todos.filter(t => t.id !== id) })),

      updateTodoPriority: (id, priority) => set(s => ({
        todos: s.todos.map(t => t.id === id ? { ...t, priority } : t)
      })),

      saveNote: (date, text) => set(s => {
        const note: DailyNote = { date, text, updatedAt: new Date().toISOString() }
        const idx = s.notes.findIndex(n => n.date === date)
        return { notes: idx >= 0 ? s.notes.map((n, i) => i === idx ? note : n) : [...s.notes, note] }
      }),

      getNoteText: (date) => get().notes.find(n => n.date === date)?.text ?? '',

      addInboxItem: (text) => {
        if (!text.trim()) return
        set(s => ({ inbox: [...s.inbox, { id: genId(), text: text.trim(), createdAt: new Date().toISOString() }] }))
      },

      assignInboxToDate: (id, date) => set(s => {
        const item = s.inbox.find(i => i.id === id)
        if (!item) return {}
        return {
          todos: [...s.todos, { id: genId(), date, text: item.text, completed: false, priority: 'normal' as TodoPriority, createdAt: new Date().toISOString() }],
          inbox: s.inbox.filter(i => i.id !== id),
        }
      }),

      deleteInboxItem: (id) => set(s => ({ inbox: s.inbox.filter(i => i.id !== id) })),

      getDayTodos: (date) => get().todos.filter(t => t.date === date),

      getDayCompletion: (date) => {
        const todos = get().todos.filter(t => t.date === date)
        const done = todos.filter(t => t.completed).length
        return { done, total: todos.length, pct: todos.length > 0 ? Math.round((done / todos.length) * 100) : 0 }
      },
    }),
    { name: 'kingdom-daily-command', storage: userStorage }
  )
)
