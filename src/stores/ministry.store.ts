import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import type { SpiritualPerson, ChurchEvent, Devotional } from '@/types'

const DEMO_PEOPLE: SpiritualPerson[] = [
  { id: 'sp1', name: 'Carlos Méndez',  phone: '+1234567890', level: 'new-believer', discipleshipProgress: 40, lastContact: new Date(Date.now() - 2 * 86400000).toISOString(), nextFollowUp: new Date().toISOString(), followUpType: 'call',     notes: [], createdAt: new Date().toISOString() },
  { id: 'sp2', name: 'Ana Patricia',   phone: '+0987654321', level: 'growing',      discipleshipProgress: 75, lastContact: new Date(Date.now() - 5 * 86400000).toISOString(), nextFollowUp: new Date(Date.now() + 2 * 86400000).toISOString(), followUpType: 'visit', notes: [], createdAt: new Date().toISOString() },
  { id: 'sp3', name: 'Juan Reyes',     phone: '+1122334455', level: 'growing',      discipleshipProgress: 55, lastContact: new Date(Date.now() - 1 * 86400000).toISOString(), nextFollowUp: new Date(Date.now() + 4 * 86400000).toISOString(), followUpType: 'whatsapp', notes: [], createdAt: new Date().toISOString() },
  { id: 'sp4', name: 'María López',    level: 'mature',      discipleshipProgress: 90, lastContact: new Date().toISOString(), followUpType: 'pray', notes: [], createdAt: new Date().toISOString() },
]

const DEMO_EVENTS: ChurchEvent[] = [
  { id: 'ev1', title: 'Culto General',      date: new Date(Date.now() + 86400000).toISOString(),    time: '10:00', type: 'service', location: 'Templo Central' },
  { id: 'ev2', title: 'Grupo de Jóvenes',   date: new Date(Date.now() + 3 * 86400000).toISOString(), time: '19:00', type: 'group',   location: 'Sala B' },
  { id: 'ev3', title: 'Retiro de Oración',  date: new Date(Date.now() + 4 * 86400000).toISOString(), time: '08:00', type: 'retreat' },
  { id: 'ev4', title: 'Bautismos',          date: new Date(Date.now() + 6 * 86400000).toISOString(), time: '11:00', type: 'service' },
]

interface MinistryStore {
  people: SpiritualPerson[]
  events: ChurchEvent[]
  devotionals: Devotional[]

  addPerson: (person: Omit<SpiritualPerson, 'id' | 'notes' | 'createdAt'>) => void
  updatePerson: (id: string, updates: Partial<SpiritualPerson>) => void
  deletePerson: (id: string) => void
  addNote: (personId: string, content: string) => void
  addEvent: (event: Omit<ChurchEvent, 'id'>) => void
  deleteEvent: (id: string) => void
  addDevotional: (dev: Omit<Devotional, 'id'>) => void
  getPendingFollowUps: () => SpiritualPerson[]
  getTodayEvents: () => ChurchEvent[]
  _reset: () => void
}

export const useMinistryStore = create<MinistryStore>()(
  persist(
    (set, get) => ({
      people: DEMO_PEOPLE,
      events: DEMO_EVENTS,
      devotionals: [],
      _reset: () => set({ people: DEMO_PEOPLE, events: DEMO_EVENTS, devotionals: [] }),

      addPerson: (person) => set(s => ({
        people: [...s.people, { ...person, id: Math.random().toString(36).slice(2), notes: [], createdAt: new Date().toISOString() }]
      })),

      updatePerson: (id, updates) => set(s => ({
        people: s.people.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      deletePerson: (id) => set(s => ({ people: s.people.filter(p => p.id !== id) })),

      addNote: (personId, content) => set(s => ({
        people: s.people.map(p => p.id === personId
          ? { ...p, notes: [...p.notes, { id: Math.random().toString(36).slice(2), content, createdAt: new Date().toISOString() }] }
          : p
        )
      })),

      addEvent: (event) => set(s => ({
        events: [...s.events, { ...event, id: Math.random().toString(36).slice(2) }]
      })),

      deleteEvent: (id) => set(s => ({ events: s.events.filter(e => e.id !== id) })),

      addDevotional: (dev) => set(s => ({
        devotionals: [...s.devotionals, { ...dev, id: Math.random().toString(36).slice(2) }]
      })),

      getPendingFollowUps: () => {
        const now = new Date()
        return get().people.filter(p => p.nextFollowUp && new Date(p.nextFollowUp) <= now)
      },

      getTodayEvents: () => {
        const today = new Date().toDateString()
        return get().events.filter(e => new Date(e.date).toDateString() === today)
      },
    }),
    { name: 'kingdom-ministry', storage: userStorage }
  )
)
