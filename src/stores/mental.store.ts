'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

export type ItemStatus = 'active' | 'upcoming' | 'completed'

export interface Book {
  id: string
  title: string
  author?: string
  emoji: string
  status: ItemStatus
  startDate?: string
  endDate?: string
  notes?: string
  totalPages?: number
  currentPage?: number
}

export interface StudyTopic {
  id: string
  name: string
  description?: string
  emoji: string
  status: ItemStatus
  startDate?: string
  endDate?: string
  notes?: string
}

const genId = () => Math.random().toString(36).slice(2, 9)

interface MentalStore {
  books: Book[]
  topics: StudyTopic[]

  addBook: (b: Omit<Book, 'id'>) => void
  updateBook: (id: string, updates: Partial<Book>) => void
  deleteBook: (id: string) => void
  startBook: (id: string) => void
  finishBook: (id: string) => void

  addTopic: (t: Omit<StudyTopic, 'id'>) => void
  updateTopic: (id: string, updates: Partial<StudyTopic>) => void
  deleteTopic: (id: string) => void
  startTopic: (id: string) => void
  finishTopic: (id: string) => void

  _reset: () => void
}

export const useMentalStore = create<MentalStore>()(
  persist(
    (set, get) => ({
      books: [],
      topics: [],

      addBook: (b) => set(s => ({ books: [...s.books, { ...b, id: genId() }] })),
      updateBook: (id, updates) => set(s => ({ books: s.books.map(b => b.id === id ? { ...b, ...updates } : b) })),
      deleteBook: (id) => set(s => ({ books: s.books.filter(b => b.id !== id) })),
      startBook: (id) => {
        set(s => ({ books: s.books.map(b => b.id === id ? { ...b, status: 'active', startDate: new Date().toISOString().slice(0, 10) } : b) }))
      },
      finishBook: (id) => {
        set(s => ({ books: s.books.map(b => b.id === id ? { ...b, status: 'completed', endDate: new Date().toISOString().slice(0, 10) } : b) }))
      },

      addTopic: (t) => set(s => ({ topics: [...s.topics, { ...t, id: genId() }] })),
      updateTopic: (id, updates) => set(s => ({ topics: s.topics.map(t => t.id === id ? { ...t, ...updates } : t) })),
      deleteTopic: (id) => set(s => ({ topics: s.topics.filter(t => t.id !== id) })),
      startTopic: (id) => {
        set(s => ({ topics: s.topics.map(t => t.id === id ? { ...t, status: 'active', startDate: new Date().toISOString().slice(0, 10) } : t) }))
      },
      finishTopic: (id) => {
        set(s => ({ topics: s.topics.map(t => t.id === id ? { ...t, status: 'completed', endDate: new Date().toISOString().slice(0, 10) } : t) }))
      },

      _reset: () => set({ books: [], topics: [] }),
    }),
    { name: 'kingdom-mental', storage: userStorage }
  )
)
