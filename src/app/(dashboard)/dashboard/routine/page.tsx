'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, CheckCircle2, Circle, RefreshCw, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useRoutineStore } from '@/stores/routine.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import type { RoutineBlock } from '@/types'

const CATEGORY_COLORS: Record<RoutineBlock['category'], string> = {
  spiritual: '#7C3AED',
  work:      '#06B6D4',
  physical:  '#10B981',
  rest:      '#475569',
  personal:  '#F59E0B',
  social:    '#EC4899',
}

const CATEGORY_LABELS: Record<RoutineBlock['category'], string> = {
  spiritual: 'Espiritual',
  work:      'Trabajo',
  physical:  'Físico',
  rest:      'Descanso',
  personal:  'Personal',
  social:    'Social',
}

const BLOCK_ICONS = ['🙏','💪','🍳','🧠','☕','🍽','💼','🚀','👨‍👩‍👧','📚','📋','🎮','🏃','📖','💡','🎯','✝️','🌿']

export default function RoutinePage() {
  const { templates, routines, getTodayRoutine, applyTemplate, toggleBlock, addBlock, removeBlock } = useRoutineStore()
  const { addXP } = useAppStore()

  const [viewDate, setViewDate] = useState(new Date())
  const [addBlockModal, setAddBlockModal] = useState(false)
  const [newBlock, setNewBlock] = useState({
    title: '', category: 'work' as RoutineBlock['category'],
    startTime: '08:00', endTime: '09:00', icon: '🧠',
  })

  const dateStr = format(viewDate, 'yyyy-MM-dd')
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
  const isTomorrow = dateStr === format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const currentRoutine = routines.find(r => r.date === dateStr)
  const defaultTemplate = templates[0]

  const completedBlocks = currentRoutine?.blocks.filter(b => b.completed).length ?? 0
  const totalBlocks = currentRoutine?.blocks.length ?? 0

  const getTimeMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const getBlockStatus = (block: RoutineBlock) => {
    if (!isToday) return block.completed ? 'completed' : 'upcoming'
    const start = getTimeMinutes(block.startTime)
    const end = getTimeMinutes(block.endTime)
    if (block.completed) return 'completed'
    if (currentMinutes >= start && currentMinutes < end) return 'active'
    if (currentMinutes >= end) return 'overdue'
    return 'upcoming'
  }

  const handleAddBlock = () => {
    if (!currentRoutine || !newBlock.title) return
    addBlock(currentRoutine.id, {
      ...newBlock,
      color: CATEGORY_COLORS[newBlock.category],
      completed: false,
    })
    setAddBlockModal(false)
    setNewBlock({ title: '', category: 'work', startTime: '08:00', endTime: '09:00', icon: '🧠' })
  }

  const handleApplyTemplate = () => {
    if (defaultTemplate) applyTemplate(defaultTemplate.id, dateStr)
  }

  const dayLabel = isToday
    ? `Hoy — ${format(viewDate, "EEEE, d 'de' MMMM", { locale: es })}`
    : isTomorrow
    ? `Mañana — ${format(viewDate, "EEEE, d 'de' MMMM", { locale: es })}`
    : format(viewDate, "EEEE, d 'de' MMMM", { locale: es })

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      {/* Header with date nav */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Calendar size={24} className="text-amber-400" /> Rutina
          </h1>
          <p className="text-slate-400 text-sm capitalize mt-0.5">{dayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date navigation */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setViewDate(d => subDays(d, 1))}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setViewDate(new Date())}
              className={cn(
                'px-2 py-1 rounded-md text-xs font-medium transition-all',
                isToday ? 'bg-violet-500/30 text-violet-300' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Hoy
            </button>
            <button
              onClick={() => setViewDate(d => addDays(d, 1))}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {currentRoutine && (
            <>
              <Badge variant="violet">{completedBlocks}/{totalBlocks} completados</Badge>
              <Button variant="secondary" size="sm" onClick={() => setAddBlockModal(true)}>
                <Plus size={14} /> Bloque
              </Button>
            </>
          )}
          {!currentRoutine && defaultTemplate && (
            <Button onClick={handleApplyTemplate} variant="glow" size="sm">
              <RefreshCw size={14} /> Aplicar rutina
            </Button>
          )}
        </div>
      </motion.div>

      {!currentRoutine ? (
        <motion.div variants={fadeUp}>
          <GlassCard className="p-12 text-center" animate={false}>
            <Calendar size={40} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg font-semibold mb-2">
              Sin rutina para {isToday ? 'hoy' : isTomorrow ? 'mañana' : 'este día'}
            </p>
            <p className="text-slate-600 text-sm mb-6">Aplica una plantilla para comenzar rápido</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {templates.map(tpl => (
                <Button key={tpl.id} onClick={() => applyTemplate(tpl.id, dateStr)} variant="glow">
                  <RefreshCw size={14} /> {tpl.name}
                </Button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="relative">
          <div className="relative">
            {/* Time axis */}
            <div className="absolute left-16 top-0 bottom-0 w-px bg-white/[0.06]" />

            <div className="space-y-2">
              <AnimatePresence>
                {currentRoutine.blocks
                  .slice()
                  .sort((a, b) => getTimeMinutes(a.startTime) - getTimeMinutes(b.startTime))
                  .map((block, i) => {
                    const status = getBlockStatus(block)
                    const dur = getTimeMinutes(block.endTime) - getTimeMinutes(block.startTime)

                    return (
                      <motion.div
                        key={block.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-start gap-3 pl-1"
                      >
                        {/* Time */}
                        <div className="w-14 shrink-0 text-right pt-2">
                          <span className="text-xs text-slate-600 font-mono">{block.startTime}</span>
                        </div>

                        {/* Dot on axis */}
                        <div className="relative flex flex-col items-center">
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full border-2 mt-2.5 z-10',
                              status === 'completed' ? 'bg-emerald-400 border-emerald-400' :
                              status === 'active'    ? 'bg-violet-400 border-violet-400 shadow-[0_0_8px_rgba(124,58,237,0.8)]' :
                              status === 'overdue'   ? 'bg-red-400/50 border-red-400/50' :
                              'bg-transparent border-white/20'
                            )}
                          />
                        </div>

                        {/* Block card */}
                        <div
                          className={cn(
                            'flex-1 rounded-xl p-3 border transition-all cursor-pointer mb-1 group',
                            status === 'completed' ? 'bg-emerald-500/[0.05] border-emerald-500/20' :
                            status === 'active'    ? 'border-violet-500/40 shadow-[0_0_16px_rgba(124,58,237,0.15)]' :
                            status === 'overdue'   ? 'bg-red-500/[0.03] border-red-500/10 opacity-60' :
                            'glass border-transparent hover:bg-white/[0.04]'
                          )}
                          style={status === 'active' ? { background: `${CATEGORY_COLORS[block.category]}10` } : undefined}
                          onClick={() => {
                            toggleBlock(currentRoutine.id, block.id)
                            if (!block.completed) addXP(5, `Bloque: ${block.title}`)
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{block.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={cn('text-sm font-semibold', status === 'completed' ? 'text-slate-400 line-through' : 'text-white')}>
                                  {block.title}
                                </p>
                                {status === 'active' && (
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="w-1.5 h-1.5 rounded-full bg-violet-400"
                                  />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-mono">{block.startTime} — {block.endTime} · {dur}min</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Delete button */}
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  removeBlock(currentRoutine.id, block.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                              {status === 'completed' ? (
                                <CheckCircle2 size={18} className="text-emerald-400" />
                              ) : (
                                <Circle size={18} className="text-slate-700" />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
              </AnimatePresence>
            </div>
          </div>

          {/* Add block inline button */}
          <div className="flex justify-center mt-4">
            <Button variant="ghost" size="sm" onClick={() => setAddBlockModal(true)}>
              <Plus size={14} /> Agregar bloque
            </Button>
          </div>
        </motion.div>
      )}

      {/* Tomorrow quick plan */}
      {isToday && !routines.find(r => r.date === format(addDays(new Date(), 1), 'yyyy-MM-dd')) && (
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" variant="glow" animate={false}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤔</span>
              <div className="flex-1">
                <p className="font-semibold text-white mb-1">¿Cuál será tu rutina mañana?</p>
                <p className="text-sm text-slate-400 mb-3">Planifica tu día con anticipación para maximizar tu productividad</p>
                <Button variant="glow" size="sm" onClick={() => {
                  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
                  if (defaultTemplate) {
                    applyTemplate(defaultTemplate.id, tomorrow)
                    setViewDate(addDays(new Date(), 1))
                  }
                }}>
                  Planificar mañana →
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Add Block Modal */}
      <Modal open={addBlockModal} onClose={() => setAddBlockModal(false)} title="Nuevo Bloque">
        <div className="space-y-4">
          <Input
            label="Nombre del bloque"
            placeholder="Deep Work, Gimnasio, Almuerzo..."
            value={newBlock.title}
            onChange={e => setNewBlock(b => ({ ...b, title: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400 font-medium block mb-1.5">Inicio</label>
              <input
                type="time"
                value={newBlock.startTime}
                onChange={e => setNewBlock(b => ({ ...b, startTime: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 font-medium block mb-1.5">Fin</label>
              <input
                type="time"
                value={newBlock.endTime}
                onChange={e => setNewBlock(b => ({ ...b, endTime: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Categoría</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(CATEGORY_LABELS) as [RoutineBlock['category'], string][]).map(([cat, label]) => (
                <button
                  key={cat}
                  onClick={() => setNewBlock(b => ({ ...b, category: cat }))}
                  className={cn(
                    'px-2 py-2 rounded-lg text-xs font-medium transition-all border',
                    newBlock.category === cat
                      ? 'text-white border-opacity-60'
                      : 'text-slate-400 border-white/[0.06] hover:text-slate-200'
                  )}
                  style={newBlock.category === cat ? { background: `${CATEGORY_COLORS[cat]}20`, borderColor: `${CATEGORY_COLORS[cat]}50`, color: CATEGORY_COLORS[cat] } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Ícono</label>
            <div className="flex flex-wrap gap-2">
              {BLOCK_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewBlock(b => ({ ...b, icon }))}
                  className={cn(
                    'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all border',
                    newBlock.icon === icon ? 'bg-violet-500/20 border-violet-500/40' : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setAddBlockModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={handleAddBlock} disabled={!newBlock.title}>
              Agregar bloque
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
