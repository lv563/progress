'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format, addDays, subDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar, CheckCircle2, Circle, RefreshCw, ChevronLeft, ChevronRight,
  Plus, Trash2, Pencil, X, Check, Layers, Clock, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useRoutineStore } from '@/stores/routine.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import type { RoutineBlock } from '@/types'

const CATEGORY_COLORS: Record<RoutineBlock['category'], string> = {
  spiritual: '#7C3AED',
  work:      '#00D4B8',
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

const CATEGORY_ICONS: Record<RoutineBlock['category'], string> = {
  spiritual: '✝️',
  work:      '💼',
  physical:  '💪',
  rest:      '💤',
  personal:  '🧠',
  social:    '👥',
}

const BLOCK_ICONS = ['🙏','💪','🍳','🧠','☕','🍽','💼','🚀','👨‍👩‍👧','📚','📋','🎮','🏃','📖','💡','🎯','✝️','🌿','🎵','🏋️','🧘','💊','🛁','🌙']

const EMPTY_FORM = {
  title: '',
  category: 'work' as RoutineBlock['category'],
  startTime: '08:00',
  endTime: '09:00',
  icon: '🧠',
}

/* ── Block form ──────────────────────────────────────────── */
function BlockForm({
  value, onChange, onSave, onCancel, saveLabel,
}: {
  value: typeof EMPTY_FORM
  onChange: (v: Partial<typeof EMPTY_FORM>) => void
  onSave: () => void
  onCancel: () => void
  saveLabel: string
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Nombre del bloque"
        placeholder="Deep Work, Gimnasio, Almuerzo..."
        value={value.title}
        onChange={e => onChange({ title: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-500 font-medium block mb-1.5">Inicio</label>
          <input
            type="time"
            value={value.startTime}
            onChange={e => onChange({ startTime: e.target.value })}
            className="w-full h-10 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 font-medium block mb-1.5">Fin</label>
          <input
            type="time"
            value={value.endTime}
            onChange={e => onChange({ endTime: e.target.value })}
            className="w-full h-10 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-500 font-medium block mb-2">Categoría</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(CATEGORY_LABELS) as [RoutineBlock['category'], string][]).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => onChange({ category: cat })}
              className={cn('px-2 py-2 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5', value.category === cat ? '' : 'text-gray-500 border-gray-100 hover:text-gray-700')}
              style={value.category === cat ? { background: `${CATEGORY_COLORS[cat]}18`, borderColor: `${CATEGORY_COLORS[cat]}50`, color: CATEGORY_COLORS[cat] } : undefined}
            >
              <span>{CATEGORY_ICONS[cat]}</span> {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-500 font-medium block mb-2">Ícono</label>
        <div className="flex flex-wrap gap-1.5">
          {BLOCK_ICONS.map(icon => (
            <button
              key={icon}
              onClick={() => onChange({ icon })}
              className={cn('w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all border', value.icon === icon ? 'border-cyan-300 bg-cyan-100 scale-110' : 'bg-gray-50 border-gray-100 hover:bg-gray-100')}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-1">
        <Button variant="ghost" onClick={onCancel} size="sm">Cancelar</Button>
        <Button variant="glow" onClick={onSave} disabled={!value.title.trim()} size="sm">
          <Check size={13} /> {saveLabel}
        </Button>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────── */
export default function RoutinePage() {
  const { templates, routines, createEmptyRoutine, applyTemplate, toggleBlock, addBlock, removeBlock, updateBlock } = useRoutineStore()
  const { addXP } = useAppStore()

  const [viewDate, setViewDate] = useState(new Date())
  const [now, setNow] = useState(new Date())
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM })
  const [editBlock, setEditBlock] = useState<RoutineBlock | null>(null)
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const dateStr    = format(viewDate, 'yyyy-MM-dd')
  const isToday    = dateStr === format(new Date(), 'yyyy-MM-dd')
  const isTomorrow = dateStr === format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const currentRoutine  = routines.find(r => r.date === dateStr)
  const completedBlocks = currentRoutine?.blocks.filter(b => b.completed).length ?? 0
  const totalBlocks     = currentRoutine?.blocks.length ?? 0
  const currentMinutes  = now.getHours() * 60 + now.getMinutes()

  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

  const totalMinutes     = currentRoutine?.blocks.reduce((a, b) => a + Math.max(0, toMin(b.endTime) - toMin(b.startTime)), 0) ?? 0
  const completedMinutes = currentRoutine?.blocks.filter(b => b.completed).reduce((a, b) => a + Math.max(0, toMin(b.endTime) - toMin(b.startTime)), 0) ?? 0

  // Weekly mini calendar (Mon–Sun of current week)
  const weekDays = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i)
      const ds = format(d, 'yyyy-MM-dd')
      const r = routines.find(r => r.date === ds)
      const total = r?.blocks.length ?? 0
      const done  = r?.blocks.filter(b => b.completed).length ?? 0
      return { d, ds, total, done, pct: total > 0 ? done / total : 0 }
    })
  }, [routines, viewDate]) // eslint-disable-line

  // Category breakdown
  const categoryStats = useMemo(() => {
    if (!currentRoutine) return []
    const counts: Partial<Record<RoutineBlock['category'], { total: number; done: number; minutes: number }>> = {}
    for (const b of currentRoutine.blocks) {
      if (!counts[b.category]) counts[b.category] = { total: 0, done: 0, minutes: 0 }
      counts[b.category]!.total++
      if (b.completed) counts[b.category]!.done++
      counts[b.category]!.minutes += Math.max(0, toMin(b.endTime) - toMin(b.startTime))
    }
    return Object.entries(counts).map(([cat, data]) => ({ cat: cat as RoutineBlock['category'], ...data! }))
  }, [currentRoutine]) // eslint-disable-line

  const blockStatus = (b: RoutineBlock) => {
    if (!isToday) return b.completed ? 'completed' : 'upcoming'
    const s = toMin(b.startTime), e = toMin(b.endTime)
    if (b.completed) return 'completed'
    if (currentMinutes >= s && currentMinutes < e) return 'active'
    if (currentMinutes >= e) return 'overdue'
    return 'upcoming'
  }

  const handleAddSave = () => {
    if (!currentRoutine || !addForm.title.trim()) return
    addBlock(currentRoutine.id, { ...addForm, color: CATEGORY_COLORS[addForm.category], completed: false })
    setAddForm({ ...EMPTY_FORM })
    setAddOpen(false)
  }

  const openEdit = (b: RoutineBlock) => {
    setEditBlock(b)
    setEditForm({ title: b.title, category: b.category, startTime: b.startTime, endTime: b.endTime, icon: b.icon })
  }

  const handleEditSave = () => {
    if (!currentRoutine || !editBlock || !editForm.title.trim()) return
    updateBlock(currentRoutine.id, editBlock.id, { ...editForm, color: CATEGORY_COLORS[editForm.category] })
    setEditBlock(null)
  }

  const dayLabel = isToday
    ? `Hoy — ${format(viewDate, "EEEE, d 'de' MMMM", { locale: es })}`
    : isTomorrow
    ? `Mañana — ${format(viewDate, "EEEE, d 'de' MMMM", { locale: es })}`
    : format(viewDate, "EEEE, d 'de' MMMM", { locale: es })

  const nowLabel = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Calendar size={24} className="text-cyan-600" /> Rutina
          </h1>
          <p className="text-gray-500 text-sm capitalize mt-0.5">{dayLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200">
            <button onClick={() => setViewDate(d => subDays(d, 1))} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setViewDate(new Date())} className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-all', isToday ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              Hoy
            </button>
            <button onClick={() => setViewDate(d => addDays(d, 1))} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
          {currentRoutine && (
            <Button variant="secondary" size="sm" onClick={() => { setAddOpen(o => !o); setAddForm({ ...EMPTY_FORM }) }}>
              <Plus size={14} /> Agregar bloque
            </Button>
          )}
        </div>
      </motion.div>

      {/* Weekly mini calendar */}
      <motion.div variants={fadeUp}>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map(({ d, ds, total, done, pct }) => {
              const isSelected   = ds === dateStr
              const isCurrentDay = ds === format(new Date(), 'yyyy-MM-dd')
              const circumference = 2 * Math.PI * 9
              return (
                <button
                  key={ds}
                  onClick={() => setViewDate(d)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl transition-all',
                    isSelected   ? 'bg-cyan-50 ring-1 ring-cyan-300' :
                    isCurrentDay ? 'bg-gray-100' :
                    'hover:bg-gray-50'
                  )}
                >
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">
                    {format(d, 'EEEEE', { locale: es })}
                  </span>
                  <span className={cn('text-sm font-bold tabular-nums', isCurrentDay && !isSelected ? 'text-gray-900' : 'text-gray-500', isSelected && 'text-cyan-700')}>
                    {format(d, 'd')}
                  </span>
                  {/* Tiny SVG ring */}
                  <div className="relative w-6 h-6">
                    <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2" stroke="rgba(0,0,0,0.1)" />
                      {total > 0 && (
                        <circle
                          cx="12" cy="12" r="9"
                          fill="none" strokeWidth="2"
                          stroke={pct >= 1 ? '#10B981' : '#00D4B8'}
                          strokeDasharray={`${pct * circumference} ${circumference}`}
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                    {total > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[7px] text-gray-400">
                        {pct >= 1 ? '✓' : `${done}`}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Empty state */}
      {!currentRoutine ? (
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center shrink-0">
                <Plus size={22} className="text-cyan-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Crear rutina para este día</h3>
                <p className="text-sm text-gray-500 mb-4">Empieza en blanco o usa una plantilla para ahorrar tiempo.</p>
                <Button variant="glow" size="sm" onClick={() => { createEmptyRoutine(dateStr); setTimeout(() => setAddOpen(true), 100) }}>
                  <Plus size={14} /> Empezar en blanco
                </Button>
              </div>
            </div>
          </div>

          {templates.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">Plantillas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl.id, dateStr)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-cyan-200 hover:bg-cyan-50 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                      <Layers size={18} className="text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{tpl.name}</p>
                      <p className="text-xs text-gray-500">{tpl.blocks.length} bloques predefinidos</p>
                    </div>
                    <RefreshCw size={14} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Progreso</span>
                <span className="text-xs font-bold text-cyan-600">{completedBlocks}/{totalBlocks}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ background: 'linear-gradient(90deg, #00D4B8, #06B6D4)' }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={10} className="text-gray-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Planificado</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{(totalMinutes / 60).toFixed(1)}h</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={10} className="text-gray-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Completado</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{(completedMinutes / 60).toFixed(1)}h</p>
            </div>
          </div>

          {/* Category chips */}
          {categoryStats.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {categoryStats.map(({ cat, total, done, minutes }) => {
                const color = CATEGORY_COLORS[cat]
                return (
                  <div key={cat} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs" style={{ borderColor: `${color}30`, background: `${color}0A` }}>
                    <span>{CATEGORY_ICONS[cat]}</span>
                    <span style={{ color }}>{CATEGORY_LABELS[cat]}</span>
                    <span className="text-gray-400">{done}/{total}</span>
                    <span className="text-gray-400 mx-0.5">·</span>
                    <span className="text-gray-400">{minutes}m</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Active block banner */}
          {isToday && (() => {
            const active = currentRoutine.blocks.find(b => {
              const s = toMin(b.startTime), e = toMin(b.endTime)
              return !b.completed && currentMinutes >= s && currentMinutes < e
            })
            if (!active) return null
            const remaining = toMin(active.endTime) - currentMinutes
            const total = toMin(active.endTime) - toMin(active.startTime)
            const pct = Math.min(100, ((total - remaining) / total) * 100)
            const color = CATEGORY_COLORS[active.category]
            return (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border overflow-hidden relative"
                style={{ background: `${color}0C`, borderColor: `${color}35` }}
              >
                <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
                <div className="flex items-center gap-3 p-4">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: color, boxShadow: `0 0 10px ${color}80` }}
                  />
                  <span className="text-xl">{active.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">Ahora: {active.title}</p>
                    <p className="text-xs text-gray-500">{remaining} min restantes · {active.startTime} — {active.endTime}</p>
                  </div>
                  <button
                    onClick={() => { toggleBlock(currentRoutine.id, active.id); addXP(5, `Bloque: ${active.title}`) }}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                    style={{ background: `${color}20`, color }}
                  >
                    ✓ Completar
                  </button>
                </div>
              </motion.div>
            )
          })()}

          {/* Timeline */}
          {(() => {
            const sorted = [...currentRoutine.blocks].sort((a, b) => toMin(a.startTime) - toMin(b.startTime))
            let nowIdx = sorted.length
            if (isToday) {
              for (let i = 0; i < sorted.length; i++) {
                if (toMin(sorted[i].startTime) > currentMinutes) { nowIdx = i; break }
              }
            }
            const NowMarker = () => (
              <div className="flex items-center gap-3 pl-1 py-0.5">
                <div className="w-14 shrink-0 text-right">
                  <span className="text-[10px] font-bold text-red-400 font-mono">{nowLabel}</span>
                </div>
                <div className="w-3 flex justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                </div>
                <div className="flex-1 h-px bg-red-400/40" />
                <span className="text-[10px] text-red-400 font-bold tracking-widest pr-2 uppercase">Ahora</span>
              </div>
            )
            return (
              <div className="relative">
                <div className="absolute left-[4.25rem] top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-1">
                  {sorted.map((block, i) => {
                    const status = blockStatus(block)
                    const dur = toMin(block.endTime) - toMin(block.startTime)
                    const color = CATEGORY_COLORS[block.category]
                    return (
                      <div key={block.id}>
                        {isToday && i === nowIdx && <NowMarker />}
                        <motion.div
                          layout
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-start gap-3 pl-1"
                        >
                          {/* Time */}
                          <div className="w-14 shrink-0 text-right pt-3.5">
                            <span className="text-[11px] text-gray-400 font-mono">{block.startTime}</span>
                          </div>
                          {/* Dot */}
                          <div className="relative flex flex-col items-center">
                            <div
                              className="w-3 h-3 rounded-full border-2 mt-3.5 z-10 transition-all"
                              style={
                                status === 'completed' ? { background: '#10B981', borderColor: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' } :
                                status === 'active'    ? { background: color, borderColor: color, boxShadow: `0 0 8px ${color}80` } :
                                status === 'overdue'   ? { background: 'transparent', borderColor: 'rgba(239,68,68,0.25)' } :
                                { background: 'transparent', borderColor: 'rgba(0,0,0,0.15)' }
                              }
                            />
                          </div>
                          {/* Card */}
                          <div
                            className={cn(
                              'flex-1 rounded-xl border transition-all mb-1.5 group overflow-hidden',
                              status === 'completed' ? 'border-emerald-200 bg-emerald-50' :
                              status === 'overdue'   ? 'border-gray-100 opacity-45' :
                              'border-gray-100 bg-gray-50 hover:bg-gray-100'
                            )}
                            style={status === 'active' ? { borderColor: `${color}40`, background: `${color}08`, boxShadow: `0 0 20px ${color}0C` } : undefined}
                          >
                            <div className="flex">
                              {/* Left accent */}
                              <div
                                className="w-0.5 shrink-0"
                                style={{
                                  background: status === 'completed' ? '#10B981' : status === 'overdue' ? 'rgba(0,0,0,0.06)' : color,
                                  opacity: status === 'upcoming' ? 0.35 : 1,
                                }}
                              />
                              <div className="flex-1 p-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-base select-none">{block.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className={cn('text-sm font-semibold truncate', status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900')}>
                                        {block.title}
                                      </p>
                                      {status === 'active' && (
                                        <motion.div
                                          animate={{ scale: [1, 1.2, 1] }}
                                          transition={{ repeat: Infinity, duration: 1.5 }}
                                          className="w-1.5 h-1.5 rounded-full shrink-0"
                                          style={{ background: color }}
                                        />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-mono">
                                      {block.startTime} — {block.endTime} · {dur}min
                                    </p>
                                  </div>
                                  <span
                                    className="hidden sm:block text-[9px] px-2 py-0.5 rounded-full shrink-0"
                                    style={{ background: `${color}15`, color }}
                                  >
                                    {CATEGORY_LABELS[block.category]}
                                  </span>
                                  {/* Actions */}
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      onClick={e => { e.stopPropagation(); openEdit(block) }}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
                                    >
                                      <Pencil size={11} />
                                    </button>
                                    <button
                                      onClick={e => { e.stopPropagation(); removeBlock(currentRoutine.id, block.id) }}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                    <button
                                      onClick={() => { toggleBlock(currentRoutine.id, block.id); if (!block.completed) addXP(5, `Bloque: ${block.title}`) }}
                                      className="p-1 text-gray-400 hover:text-emerald-500 transition-colors"
                                    >
                                      {status === 'completed'
                                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                                        : <Circle size={18} />
                                      }
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )
                  })}
                  {isToday && nowIdx === sorted.length && sorted.length > 0 && <NowMarker />}
                </div>
              </div>
            )
          })()}

          {/* Inline add */}
          <AnimatePresence>
            {addOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Nuevo bloque</h3>
                    <button onClick={() => setAddOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <BlockForm
                    value={addForm}
                    onChange={v => setAddForm(f => ({ ...f, ...v }))}
                    onSave={handleAddSave}
                    onCancel={() => setAddOpen(false)}
                    saveLabel="Agregar"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setAddOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-cyan-600 hover:border-cyan-200 transition-all text-sm"
              >
                <Plus size={14} /> Agregar bloque
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Tomorrow CTA */}
      {isToday && !routines.find(r => r.date === format(addDays(new Date(), 1), 'yyyy-MM-dd')) && (
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌅</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">¿Cuál será tu rutina mañana?</p>
                <p className="text-sm text-gray-500 mb-3">Planifica con anticipación para empezar el día sin fricciones.</p>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="glow" size="sm" onClick={() => { createEmptyRoutine(format(addDays(new Date(), 1), 'yyyy-MM-dd')); setViewDate(addDays(new Date(), 1)) }}>
                    <Plus size={14} /> Desde cero
                  </Button>
                  {templates[0] && (
                    <Button variant="secondary" size="sm" onClick={() => { applyTemplate(templates[0].id, format(addDays(new Date(), 1), 'yyyy-MM-dd')); setViewDate(addDays(new Date(), 1)) }}>
                      <RefreshCw size={14} /> Usar plantilla
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit block modal */}
      <Modal open={!!editBlock} onClose={() => setEditBlock(null)} title="Editar bloque">
        {editBlock && (
          <BlockForm
            value={editForm}
            onChange={v => setEditForm(f => ({ ...f, ...v }))}
            onSave={handleEditSave}
            onCancel={() => setEditBlock(null)}
            saveLabel="Guardar cambios"
          />
        )}
      </Modal>
    </motion.div>
  )
}
