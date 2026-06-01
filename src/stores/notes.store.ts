import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  pinned: boolean
  color: string
  createdAt: string
  updatedAt: string
}

interface NotesStore {
  notes: Note[]
  addNote: (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  togglePin: (id: string) => void
  searchNotes: (q: string) => Note[]
  _reset: () => void
}

const genId = () => Math.random().toString(36).slice(2, 9)

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      _reset: () => set({ notes: [] }),

      addNote: (n) => {
        const id = genId()
        const now = new Date().toISOString()
        set(s => ({ notes: [{ ...n, id, createdAt: now, updatedAt: now }, ...s.notes] }))
        return id
      },

      updateNote: (id, updates) => set(s => ({
        notes: s.notes.map(n =>
          n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
        ),
      })),

      deleteNote: (id) => set(s => ({ notes: s.notes.filter(n => n.id !== id) })),

      togglePin: (id) => set(s => ({
        notes: s.notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)
      })),

      searchNotes: (q) => {
        const lower = q.toLowerCase()
        return get().notes.filter(n =>
          n.title.toLowerCase().includes(lower) ||
          n.content.toLowerCase().includes(lower) ||
          n.tags.some(t => t.toLowerCase().includes(lower))
        )
      },
    }),
    { name: 'kingdom-notes', storage: userStorage }
  )
)
