import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import type { SpiritualPerson, ChurchEvent, Devotional, FollowUpRecord, MessageTemplate } from '@/types'

const genId = () => Math.random().toString(36).slice(2, 9)

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  { id: 'bienvenida', icon: '👋', name: 'Bienvenida', body: '¡Hola {{nombre}}!\n\nDios te bendiga.\n\nNos alegra mucho que hayas tomado la decisión de seguir a Cristo.\n\nQueremos acompañarte en este nuevo comienzo y saber cómo podemos ayudarte.\n\nQue Dios continúe obrando en tu vida.' },
  { id: 'como-estas', icon: '❤️', name: '¿Cómo estás?', body: '¡Hola {{nombre}}!\n\nDios te bendiga.\n\nSolo quería saber cómo te encuentras.\n\n¿Hay algo por lo que podamos orar o ayudarte?\n\nEstamos para servirte.' },
  { id: 'ya-respondo', icon: '🙏', name: 'Ya te respondo', body: 'Hola {{nombre}}.\n\nRecibí tu mensaje.\n\nEn unos minutos te responderé con más detalle.\n\n¡Dios te bendiga!' },
  { id: 'discipulado', icon: '📖', name: 'Invitación al discipulado', body: 'Hola {{nombre}}.\n\nQuería recordarte nuestro discipulado.\n\nNos encantaría verte.\n\nSerá un tiempo de crecimiento y comunión.\n\n¡Te esperamos!' },
  { id: 'servicio', icon: '⛪', name: 'Invitación al servicio', body: 'Hola {{nombre}}.\n\nEste domingo tendremos nuestro servicio.\n\nSerá una bendición contar contigo.\n\n¡Nos vemos!' },
]

const DEMO_PEOPLE: SpiritualPerson[] = [
  { id: 'sp1', name: 'Carlos Méndez',  phone: '+1234567890', level: 'new-believer', discipleshipProgress: 40, discipleshipStage: 2, lastContact: new Date(Date.now() - 2 * 86400000).toISOString(), nextFollowUp: new Date().toISOString(), followUpType: 'call',     notes: [], createdAt: new Date().toISOString() },
  { id: 'sp2', name: 'Ana Patricia',   phone: '+0987654321', level: 'growing',      discipleshipProgress: 75, discipleshipStage: 5, lastContact: new Date(Date.now() - 5 * 86400000).toISOString(), nextFollowUp: new Date(Date.now() + 2 * 86400000).toISOString(), followUpType: 'visit', notes: [], createdAt: new Date().toISOString() },
  { id: 'sp3', name: 'Juan Reyes',     phone: '+1122334455', level: 'growing',      discipleshipProgress: 55, discipleshipStage: 3, lastContact: new Date(Date.now() - 1 * 86400000).toISOString(), nextFollowUp: new Date(Date.now() + 4 * 86400000).toISOString(), followUpType: 'whatsapp', notes: [], createdAt: new Date().toISOString() },
  { id: 'sp4', name: 'María López',    level: 'mature',      discipleshipProgress: 90, discipleshipStage: 6, lastContact: new Date().toISOString(), followUpType: 'pray', notes: [], createdAt: new Date().toISOString() },
]

const DEMO_EVENTS: ChurchEvent[] = [
  { id: 'ev1', title: 'Culto General',      date: new Date(Date.now() + 86400000).toISOString(),     time: '10:00', type: 'service', location: 'Templo Central' },
  { id: 'ev2', title: 'Grupo de Jóvenes',   date: new Date(Date.now() + 3 * 86400000).toISOString(), time: '19:00', type: 'group',   location: 'Sala B' },
  { id: 'ev3', title: 'Retiro de Oración',  date: new Date(Date.now() + 4 * 86400000).toISOString(), time: '08:00', type: 'retreat' },
  { id: 'ev4', title: 'Bautismos',          date: new Date(Date.now() + 6 * 86400000).toISOString(), time: '11:00', type: 'service' },
]

interface MinistryStore {
  people: SpiritualPerson[]
  events: ChurchEvent[]
  devotionals: Devotional[]
  followUpRecords: FollowUpRecord[]
  templates: MessageTemplate[]

  addPerson: (person: Omit<SpiritualPerson, 'id' | 'notes' | 'createdAt'>) => string
  updatePerson: (id: string, updates: Partial<SpiritualPerson>) => void
  deletePerson: (id: string) => void
  addNote: (personId: string, content: string) => void
  setDiscipleshipStage: (personId: string, stage: number) => void

  addEvent: (event: Omit<ChurchEvent, 'id'>) => void
  deleteEvent: (id: string) => void
  addDevotional: (dev: Omit<Devotional, 'id'>) => void

  addFollowUpRecord: (r: Omit<FollowUpRecord, 'id'>) => void

  updateTemplate: (id: string, updates: Partial<Pick<MessageTemplate, 'name' | 'body' | 'icon'>>) => void
  addTemplate: () => void
  deleteTemplate: (id: string) => void
  resetTemplates: () => void

  getPendingFollowUps: () => SpiritualPerson[]
  getTodayEvents: () => ChurchEvent[]
  getPersonFollowUps: (personId: string) => FollowUpRecord[]
  getTodayFollowUpsDone: () => FollowUpRecord[]
  getNoContactPeople: (days: number) => SpiritualPerson[]

  _reset: () => void
}

export const useMinistryStore = create<MinistryStore>()(
  persist(
    (set, get) => ({
      people: DEMO_PEOPLE,
      events: DEMO_EVENTS,
      devotionals: [],
      followUpRecords: [],
      templates: DEFAULT_TEMPLATES,

      _reset: () => set({ people: DEMO_PEOPLE, events: DEMO_EVENTS, devotionals: [], followUpRecords: [], templates: DEFAULT_TEMPLATES }),

      addPerson: (person) => {
        const id = genId()
        set(s => ({ people: [...s.people, { ...person, id, notes: [], createdAt: new Date().toISOString() }] }))
        return id
      },

      updatePerson: (id, updates) => set(s => ({
        people: s.people.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      deletePerson: (id) => set(s => ({ people: s.people.filter(p => p.id !== id) })),

      addNote: (personId, content) => set(s => ({
        people: s.people.map(p => p.id === personId
          ? { ...p, notes: [...p.notes, { id: genId(), content, createdAt: new Date().toISOString() }] }
          : p
        )
      })),

      setDiscipleshipStage: (personId, stage) => {
        const clampedStage = Math.max(0, Math.min(7, stage))
        set(s => ({
          people: s.people.map(p => p.id === personId
            ? { ...p, discipleshipStage: clampedStage, discipleshipProgress: Math.round((clampedStage / 7) * 100) }
            : p
          )
        }))
      },

      addEvent: (event) => set(s => ({
        events: [...s.events, { ...event, id: genId() }]
      })),

      deleteEvent: (id) => set(s => ({ events: s.events.filter(e => e.id !== id) })),

      addDevotional: (dev) => set(s => ({
        devotionals: [...s.devotionals, { ...dev, id: genId() }]
      })),

      addFollowUpRecord: (r) => set(s => ({
        followUpRecords: [{ ...r, id: genId() }, ...s.followUpRecords]
      })),

      updateTemplate: (id, updates) => set(s => ({
        templates: s.templates.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      addTemplate: () => set(s => ({
        templates: [...s.templates, { id: genId(), icon: '💬', name: 'Nueva plantilla', body: 'Hola {{nombre}}.' }]
      })),

      deleteTemplate: (id) => set(s => ({
        templates: s.templates.filter(t => t.id !== id)
      })),

      resetTemplates: () => set({ templates: DEFAULT_TEMPLATES }),

      getPendingFollowUps: () => {
        const now = new Date()
        return get().people.filter(p => p.nextFollowUp && new Date(p.nextFollowUp) <= now)
      },

      getTodayEvents: () => {
        const today = new Date().toDateString()
        return get().events.filter(e => new Date(e.date).toDateString() === today)
      },

      getPersonFollowUps: (personId) =>
        get().followUpRecords.filter(r => r.personId === personId),

      getTodayFollowUpsDone: () => {
        const today = new Date().toDateString()
        return get().followUpRecords.filter(r => new Date(r.date).toDateString() === today)
      },

      getNoContactPeople: (days) => {
        const cutoff = Date.now() - days * 86400000
        return get().people.filter(p =>
          !p.lastContact || new Date(p.lastContact).getTime() < cutoff
        )
      },
    }),
    { name: 'kingdom-ministry', storage: userStorage }
  )
)
