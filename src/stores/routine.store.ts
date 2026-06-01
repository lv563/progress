import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { userStorage } from '@/lib/utils/userStorage'
import type { DailyRoutine, RoutineBlock, RoutineTemplate } from '@/types'

const DEMO_TEMPLATE: RoutineTemplate = {
  id: 'tpl1',
  name: 'Rutina Estándar',
  blocks: [
    { title: 'Mañana Espiritual',   category: 'spiritual', startTime: '05:30', endTime: '06:30', color: '#7C3AED', icon: '🙏' },
    { title: 'Gimnasio',            category: 'physical',  startTime: '06:30', endTime: '08:00', color: '#10B981', icon: '💪' },
    { title: 'Ducha + Desayuno',    category: 'personal',  startTime: '08:00', endTime: '08:30', color: '#F59E0B', icon: '🍳' },
    { title: 'Deep Work — Bloque 1',category: 'work',      startTime: '08:30', endTime: '10:30', color: '#06B6D4', icon: '🧠' },
    { title: 'Break',               category: 'rest',      startTime: '10:30', endTime: '10:45', color: '#475569', icon: '☕' },
    { title: 'Deep Work — Bloque 2',category: 'work',      startTime: '10:45', endTime: '12:45', color: '#06B6D4', icon: '🧠' },
    { title: 'Almuerzo',            category: 'personal',  startTime: '12:45', endTime: '13:30', color: '#F97316', icon: '🍽' },
    { title: 'Trabajo',             category: 'work',      startTime: '13:30', endTime: '15:30', color: '#06B6D4', icon: '💼' },
    { title: 'Seguimientos',        category: 'social',    startTime: '15:30', endTime: '16:00', color: '#EC4899', icon: '✝️' },
    { title: 'Proyectos Personales',category: 'work',      startTime: '16:00', endTime: '18:00', color: '#7C3AED', icon: '🚀' },
    { title: 'Familia',             category: 'social',    startTime: '18:00', endTime: '19:00', color: '#F59E0B', icon: '👨‍👩‍👧' },
    { title: 'Cena',                category: 'personal',  startTime: '19:00', endTime: '19:45', color: '#F97316', icon: '🍽' },
    { title: 'Lectura / Estudio',   category: 'personal',  startTime: '19:45', endTime: '20:45', color: '#F59E0B', icon: '📚' },
    { title: 'Review + Preparar mañana', category: 'work', startTime: '20:45', endTime: '21:15', color: '#475569', icon: '📋' },
    { title: 'Tiempo libre',        category: 'rest',      startTime: '21:15', endTime: '22:00', color: '#475569', icon: '🎮' },
  ]
}

interface RoutineStore {
  templates: RoutineTemplate[]
  routines: DailyRoutine[]
  addTemplate: (tpl: Omit<RoutineTemplate, 'id'>) => void
  getTodayRoutine: () => DailyRoutine | undefined
  createEmptyRoutine: (date?: string) => void
  applyTemplate: (templateId: string, date?: string) => void
  toggleBlock: (routineId: string, blockId: string) => void
  addBlock: (routineId: string, block: Omit<RoutineBlock, 'id'>) => void
  removeBlock: (routineId: string, blockId: string) => void
  updateBlock: (routineId: string, blockId: string, updates: Partial<RoutineBlock>) => void
  _reset: () => void
}

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set, get) => ({
      templates: [DEMO_TEMPLATE],
      routines: [],
      _reset: () => set({ templates: [DEMO_TEMPLATE], routines: [] }),

      addTemplate: (tpl) => set(s => ({
        templates: [...s.templates, { ...tpl, id: Math.random().toString(36).slice(2) }]
      })),

      getTodayRoutine: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return get().routines.find(r => r.date === today)
      },

      createEmptyRoutine: (date) => {
        const d = date ?? format(new Date(), 'yyyy-MM-dd')
        const routine: DailyRoutine = {
          id: Math.random().toString(36).slice(2),
          date: d,
          blocks: [],
        }
        set(s => ({ routines: [...s.routines.filter(r => r.date !== d), routine] }))
      },

      applyTemplate: (templateId, date) => {
        const d = date ?? format(new Date(), 'yyyy-MM-dd')
        const template = get().templates.find(t => t.id === templateId)
        if (!template) return
        const routine: DailyRoutine = {
          id: Math.random().toString(36).slice(2),
          date: d,
          templateId,
          blocks: template.blocks.map(b => ({ ...b, id: Math.random().toString(36).slice(2), completed: false })),
        }
        set(s => ({
          routines: [...s.routines.filter(r => r.date !== d), routine]
        }))
      },

      toggleBlock: (routineId, blockId) => set(s => ({
        routines: s.routines.map(r =>
          r.id === routineId
            ? { ...r, blocks: r.blocks.map(b => b.id === blockId ? { ...b, completed: !b.completed } : b) }
            : r
        )
      })),

      addBlock: (routineId, block) => set(s => ({
        routines: s.routines.map(r =>
          r.id === routineId
            ? { ...r, blocks: [...r.blocks, { ...block, id: Math.random().toString(36).slice(2) }] }
            : r
        )
      })),

      removeBlock: (routineId, blockId) => set(s => ({
        routines: s.routines.map(r =>
          r.id === routineId ? { ...r, blocks: r.blocks.filter(b => b.id !== blockId) } : r
        )
      })),

      updateBlock: (routineId, blockId, updates) => set(s => ({
        routines: s.routines.map(r =>
          r.id === routineId
            ? { ...r, blocks: r.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b) }
            : r
        )
      })),
    }),
    { name: 'kingdom-routine', storage: userStorage }
  )
)
