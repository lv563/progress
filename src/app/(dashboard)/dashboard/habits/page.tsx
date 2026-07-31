'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { Target, Plus, Flame, Check, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useHabitsStore } from '@/stores/habits.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import type { HabitCategory } from '@/types'

const CAT_COLOR: Record<HabitCategory, string> = {
  spiritual: '#7C3AED',
  physical:  '#10B981',
  mental:    '#F59E0B',
  work:      '#06B6D4',
  social:    '#EC4899',
  health:    '#06B6D4',
}

const CAT_LABELS: Record<HabitCategory, string> = {
  spiritual: 'Espiritual',
  physical:  'Físico',
  mental:    'Mental',
  work:      'Trabajo',
  social:    'Social',
  health:    'Salud',
}

const CATS = Object.keys(CAT_LABELS) as HabitCategory[]

export default function HabitsPage() {
  const { habits, getTodayLogs, logHabit, addHabit, deleteHabit, getStreakDates } = useHabitsStore()
  const { addXP } = useAppStore()
  const [addModal, setAddModal]   = useState(false)
  const [newHabit, setNewHabit]   = useState({ name: '', icon: '⭐', category: 'spiritual' as HabitCategory, target: 1 })

  const todayLogs      = getTodayLogs()
  const today          = format(new Date(), 'yyyy-MM-dd')
  const completedToday = habits.filter(h => todayLogs[h.id]?.completed).length
  const pct            = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0

  const handleCheck = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const log    = todayLogs[habitId]
    const newVal = log?.completed ? 0 : habit.target
    logHabit(habitId, newVal)
    if (newVal >= habit.target) addXP(10, `Hábito: ${habit.name}`)
  }

  // Last 14 days chart
  const last14    = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() })
  const chartData = last14.map(day => {
    const key  = format(day, 'yyyy-MM-dd')
    const done = habits.length > 0 ? habits.filter(h => getStreakDates(h.id).includes(key)).length : 0
    return {
      day:     format(day, 'd', { locale: es }),
      pct:     habits.length > 0 ? Math.round((done / habits.length) * 100) : 0,
      isToday: key === today,
    }
  })

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Target size={24} className="text-violet-600" /> Hábitos
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {completedToday}/{habits.length} completados hoy · {pct}%
          </p>
        </div>
        <Button onClick={() => setAddModal(true)} variant="glow" size="sm">
          <Plus size={14} /> Nuevo
        </Button>
      </motion.div>

      {/* Progress chart */}
      <motion.div variants={fadeUp} className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Últimas 2 semanas</p>
          <div className="flex items-center gap-3">
            <div className="w-full bg-gray-100 rounded-full h-1.5 w-24 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7 }}
              />
            </div>
            <span className="text-xs font-bold text-violet-600 shrink-0">{pct}% hoy</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={72}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={18}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.isToday ? '#7C3AED' : d.pct > 0 ? '#7C3AED55' : '#E5E7EB'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Habit grid */}
      {habits.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-16">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-gray-500 text-sm mb-4">Aún no tienes hábitos. ¡Crea el primero!</p>
          <Button variant="glow" size="sm" onClick={() => setAddModal(true)}>
            <Plus size={14} /> Agregar hábito
          </Button>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {habits.map((habit, i) => {
              const done  = todayLogs[habit.id]?.completed ?? false
              const color = CAT_COLOR[habit.category]
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative group"
                >
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleCheck(habit.id)}
                    className={cn(
                      'w-full flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 aspect-square',
                      done
                        ? 'border-transparent'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                    )}
                    style={done ? { background: `${color}18`, borderColor: `${color}45` } : undefined}
                  >
                    {/* Check badge */}
                    <div className={cn(
                      'absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200',
                      done ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    )} style={{ background: color }}>
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </div>

                    <span className="text-3xl select-none">{habit.icon}</span>
                    <p className={cn(
                      'text-xs font-semibold text-center leading-tight line-clamp-2 px-1',
                      done ? 'text-gray-900' : 'text-gray-700'
                    )}>
                      {habit.name}
                    </p>
                    {habit.streak > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Flame size={10} className="text-orange-500" />
                        <span className="text-[10px] text-orange-500 font-bold">{habit.streak}d</span>
                      </div>
                    )}
                  </motion.button>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-400/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Nuevo Hábito">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-20">
              <Input
                label="Emoji"
                value={newHabit.icon}
                onChange={e => setNewHabit(h => ({ ...h, icon: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Nombre del hábito"
                placeholder="Orar, Gym, Leer..."
                value={newHabit.name}
                onChange={e => setNewHabit(h => ({ ...h, name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500 font-medium block mb-2">Categoría</label>
            <div className="grid grid-cols-3 gap-2">
              {CATS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewHabit(h => ({ ...h, category: cat }))}
                  className={cn(
                    'py-2 px-3 rounded-xl text-xs font-medium transition-all border',
                    newHabit.category === cat
                      ? 'text-gray-900'
                      : 'bg-gray-50 text-gray-500 hover:text-gray-700 border-gray-100'
                  )}
                  style={newHabit.category === cat
                    ? { background: `${CAT_COLOR[cat]}25`, borderColor: `${CAT_COLOR[cat]}50`, color: CAT_COLOR[cat] }
                    : undefined}
                >
                  {CAT_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancelar</Button>
            <Button
              variant="glow"
              disabled={!newHabit.name.trim()}
              onClick={() => {
                addHabit({ ...newHabit, type: 'boolean', color: CAT_COLOR[newHabit.category], frequency: 'daily', activeDays: [], order: 99 })
                setAddModal(false)
                setNewHabit({ name: '', icon: '⭐', category: 'spiritual', target: 1 })
              }}
            >
              <Plus size={14} /> Crear hábito
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
