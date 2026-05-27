'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { Target, Plus, Flame, CheckCircle2, Circle, TrendingUp, Calendar } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { HeatmapGrid } from '@/components/ui/HeatmapGrid'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useHabitsStore } from '@/stores/habits.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import type { HabitCategory } from '@/types'

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  spiritual: '#7C3AED',
  physical:  '#10B981',
  mental:    '#F59E0B',
  work:      '#06B6D4',
  social:    '#EC4899',
  health:    '#06B6D4',
}

export default function HabitsPage() {
  const { habits, getTodayLogs, logHabit, addHabit, getStreakDates } = useHabitsStore()
  const { addXP } = useAppStore()
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [newHabit, setNewHabit] = useState({ name: '', icon: '⭐', category: 'spiritual' as HabitCategory, type: 'boolean' as const, target: 1 })

  const todayLogs = getTodayLogs()
  const today = format(new Date(), 'yyyy-MM-dd')
  const completedToday = habits.filter(h => todayLogs[h.id]?.completed).length

  const handleCheck = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const log = todayLogs[habitId]
    const newVal = log ? (log.value >= habit.target ? 0 : habit.target) : habit.target
    logHabit(habitId, newVal)
    if (newVal >= habit.target) {
      addXP(10, `Hábito completado: ${habit.name}`)
    }
  }

  const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })

  const heatmapForHabit = (habitId: string) => {
    const dates = getStreakDates(habitId)
    return dates.reduce((acc, d) => ({ ...acc, [d]: 1 }), {} as Record<string, number>)
  }

  const totalHeatmap = habits.reduce((acc, h) => {
    getStreakDates(h.id).forEach(d => { acc[d] = (acc[d] ?? 0) + 1 })
    return acc
  }, {} as Record<string, number>)

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Target size={24} className="text-violet-400" /> Hábitos
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{completedToday}/{habits.length} completados hoy</p>
        </div>
        <Button onClick={() => setAddModal(true)} variant="glow" size="sm">
          <Plus size={14} /> Nuevo hábito
        </Button>
      </motion.div>

      {/* Progress overview */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          <div className="flex items-center gap-6">
            <ProgressRing
              value={(completedToday / Math.max(habits.length, 1)) * 100}
              size={80}
              strokeWidth={8}
              color="#7C3AED"
              animate={false}
            >
              <div className="text-center">
                <p className="text-lg font-black text-white leading-none">{completedToday}</p>
                <p className="text-[9px] text-slate-500">/{habits.length}</p>
              </div>
            </ProgressRing>
            <div className="flex-1">
              <p className="text-white font-semibold">Progreso de Hoy</p>
              <div className="mt-2 space-y-1">
                <div className="flex gap-1.5">
                  {last7.map(day => {
                    const key = format(day, 'yyyy-MM-dd')
                    const isToday = key === today
                    const anyDone = habits.some(h => getStreakDates(h.id).includes(key))
                    return (
                      <div key={key} className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] text-slate-600">{format(day, 'EEE')[0]}</span>
                        <div className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all',
                          isToday ? 'bg-violet-500/30 border border-violet-500/50 text-violet-300 font-bold' :
                          anyDone ? 'bg-violet-500/20 text-violet-400' :
                          'bg-white/[0.04] text-slate-700'
                        )}>
                          {format(day, 'd')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Habit cards */}
      <motion.div variants={fadeUp} className="grid gap-3">
        <AnimatePresence>
          {habits.map((habit, i) => {
            const log = todayLogs[habit.id]
            const val = log?.value ?? 0
            const pct = Math.min((val / habit.target) * 100, 100)
            const done = log?.completed ?? false
            const isSelected = selectedHabit === habit.id

            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard
                  className={cn('p-4', isSelected && 'border-violet-500/30 bg-violet-500/[0.05]')}
                  hoverable
                  animate={false}
                >
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleCheck(habit.id)}
                      className="shrink-0"
                    >
                      {done ? (
                        <CheckCircle2 size={28} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      ) : (
                        <Circle size={28} className="text-slate-600 hover:text-violet-400 transition-colors" />
                      )}
                    </motion.button>

                    <ProgressRing
                      value={pct}
                      size={44}
                      strokeWidth={4}
                      color={done ? '#10B981' : CATEGORY_COLORS[habit.category]}
                      animate={false}
                    >
                      <span className="text-base">{habit.icon}</span>
                    </ProgressRing>

                    <div className="flex-1 min-w-0" onClick={() => setSelectedHabit(isSelected ? null : habit.id)}>
                      <div className="flex items-center gap-2">
                        <p className={cn('font-semibold', done ? 'text-slate-400 line-through' : 'text-white')}>
                          {habit.name}
                        </p>
                        <Badge variant={habit.category === 'spiritual' ? 'violet' : habit.category === 'physical' ? 'green' : 'cyan'} size="sm">
                          {habit.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Flame size={10} className="text-orange-400" />
                          <span className="text-xs text-slate-500">{habit.streak}d racha</span>
                        </div>
                        <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: CATEGORY_COLORS[habit.category] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{val}/{habit.target}{habit.unit ? ` ${habit.unit}` : ''}</span>
                      </div>
                    </div>

                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-xs text-slate-500">Mejor racha</span>
                      <span className="text-sm font-bold text-amber-400">🏆 {habit.bestStreak}d</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-white/[0.06]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={10} /> Historial (13 semanas)</span>
                            <span className="text-xs text-violet-400">{Math.round(habit.completionRate * 100)}% consistencia</span>
                          </div>
                          <HeatmapGrid data={heatmapForHabit(habit.id)} weeks={13} className="overflow-x-auto" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Annual heatmap */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-400" /> Actividad Anual
          </h3>
          <HeatmapGrid data={totalHeatmap} weeks={52} maxValue={habits.length} />
        </GlassCard>
      </motion.div>

      {/* Add Habit Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Nuevo Hábito">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              label="Emoji / icono"
              value={newHabit.icon}
              onChange={e => setNewHabit(h => ({ ...h, icon: e.target.value }))}
              className="w-20"
            />
            <div className="flex-1">
              <Input
                label="Nombre del hábito"
                placeholder="Leer Biblia, Orar, Gym..."
                value={newHabit.name}
                onChange={e => setNewHabit(h => ({ ...h, name: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {(['spiritual', 'physical', 'mental', 'work', 'health', 'social'] as HabitCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewHabit(h => ({ ...h, category: cat }))}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all',
                    newHabit.category === cat
                      ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                      : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Meta diaria"
            type="number"
            min={1}
            value={newHabit.target}
            onChange={e => setNewHabit(h => ({ ...h, target: Number(e.target.value) }))}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={() => {
              if (!newHabit.name) return
              addHabit({ ...newHabit, color: '#7C3AED', frequency: 'daily', activeDays: [], order: 99 })
              setAddModal(false)
              setNewHabit({ name: '', icon: '⭐', category: 'spiritual', type: 'boolean', target: 1 })
            }}>
              Crear hábito
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
