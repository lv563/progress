'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, subDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CheckCircle2, Circle, RefreshCw, ChevronLeft, ChevronRight,
  Plus, Trash2, Pencil, X, Check, Layers, Clock, Zap, GripVertical,
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
  work:      '#0891B2',
  physical:  '#10B981',
  rest:      '#64748B',
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

const getTimeSection = (time: string): 'Mañana' | 'Tarde' | 'Noche' => {
  const h = parseInt(time.split(':')[0])
  if (h < 12) return 'Mañana'
  if (h < 18) return 'Tarde'
  return 'Noche'
}

const SECTION_EMOJI: Record<string, string> = {
  Mañana: '🌅',
  Tarde: '☀️',
  Noche: '🌙',
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
          <label className="text-xs text-gray-500 font-medium block mb-1.5">Inicio</label>
          <input
            type="time"
            value={value.startTime}
            onChange={e => onChange({ startTime: e.target.value })}
            className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1.5">Fin</label>
          <input
            type="time"
            value={value.endTime}
            onChange={e => onChange({ endTime: e.target.value })}
            className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium block mb-2">Categoría</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.entries(CATEGORY_LABELS) as [RoutineBlock['category'], string][]).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => onChange({ category: cat })}
              className={cn('px-2 py-2 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5', value.category === cat ? '' : 'text-gray-500 border-gray-100 hover:text-gray-700 hover:border-gray-200')}
              style={value.category === cat ? { background: `${CATEGORY_COLORS[cat]}12`, borderColor: `${CATEGORY_COLORS[cat]}40`, color: CATEGORY_COLORS[cat] } : undefined}
            >
              <span>{CATEGORY_ICONS[cat]}</span> {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium block mb-2">Ícono</label>
        <div className="flex flex-wrap gap-1.5">
          {BLOCK_ICONS.map(icon => (
            <button
              key={icon}
              onClick={() => onChange({ icon })}
              className={cn('w-9 h-9 rounded-lg text-base flex items-center justify-center transition-all border', value.icon === icon ? 'border-indigo-300 bg-indigo-50 scale-110' : 'bg-gray-50 border-gray-100 hover:bg-gray-100')}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
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

  const [viewDate, setViewDate]   = useState(new Date())
  const [now, setNow]             = useState(new Date())
  const [addOpen, setAddOpen]     = useState(false)
  const [addForm, setAddForm]     = useState({ ...EMPTY_FORM })
  const [editBlock, setEditBlock] = useState<RoutineBlock | null>(null)
  const [editForm, setEditForm]   = useState({ ...EMPTY_FORM })

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
  const nowLabel        = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

  const totalMinutes     = currentRoutine?.blocks.reduce((a, b) => a + Math.max(0, toMin(b.endTime) - toMin(b.startTime)), 0) ?? 0
  const completedMinutes = currentRoutine?.blocks.filter(b => b.completed).reduce((a, b) => a + Math.max(0, toMin(b.endTime) - toMin(b.startTime)), 0) ?? 0

  const sorted = useMemo(() => {
    if (!currentRoutine) return []
    return [...currentRoutine.blocks].sort((a, b) => toMin(a.startTime) - toMin(b.startTime))
  }, [currentRoutine]) // eslint-disable-line

  const nowIdx = useMemo(() => {
    if (!isToday) return sorted.length
    for (let i = 0; i < sorted.length; i++) {
      if (toMin(sorted[i].startTime) > currentMinutes) return i
    }
    return sorted.length
  }, [sorted, isToday, currentMinutes]) // eslint-disable-line

  const weekDays = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => {
      const d  = addDays(monday, i)
      const ds = format(d, 'yyyy-MM-dd')
      const r  = routines.find(r => r.date === ds)
      const total = r?.blocks.length ?? 0
      const done  = r?.blocks.filter(b => b.completed).length ?? 0
      return { d, ds, total, done, pct: total > 0 ? done / total : 0 }
    })
  }, [routines, viewDate]) // eslint-disable-line

  const blockStatus = (b: RoutineBlock) => {
    if (!isToday) return b.completed ? 'completed' : 'upcoming'
    const s = toMin(b.startTime), e = toMin(b.endTime)
    if (b.completed)                                 return 'completed'
    if (currentMinutes >= s && currentMinutes < e)   return 'active'
    if (currentMinutes >= e)                         return 'overdue'
    return 'upcoming'
  }

  const activeBlock = isToday
    ? currentRoutine?.blocks.find(b => {
        const s = toMin(b.startTime), e = toMin(b.endTime)
        return !b.completed && currentMinutes >= s && currentMinutes < e
      })
    : null

  const dayLabel = isToday
    ? `Hoy — ${format(viewDate, "EEEE, d 'de' MMMM", { locale: es })}`
    : isTomorrow
    ? `Mañana — ${format(viewDate, "EEEE, d 'de' MMMM", { locale: es })}`
    : format(viewDate, "EEEE, d 'de' MMMM yyyy", { locale: es })

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

  const NowMarker = () => (
    <div className="flex items-center gap-3 py-1.5 -mx-3 px-3">
      <span className="text-[10px] font-bold text-red-400 font-mono w-12 shrink-0 text-right">{nowLabel}</span>
      <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.55)] shrink-0" />
      <div className="flex-1 h-px bg-red-400/35" />
      <span className="text-[9px] font-bold text-red-400 tracking-widest uppercase">Ahora</span>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Notion-style page header ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="text-5xl mb-4 select-none">📅</div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-3">Rutina</h1>
        <div className="flex items-center gap-2 text-gray-400">
          <button
            onClick={() => setViewDate(d => subDays(d, 1))}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm capitalize font-medium text-gray-500 select-none">{dayLabel}</span>
          <button
            onClick={() => setViewDate(d => addDays(d, 1))}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          {!isToday && (
            <button
              onClick={() => setViewDate(new Date())}
              className="ml-2 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              Hoy →
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Week strip — floating circles ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex gap-1 mb-10"
      >
        {weekDays.map(({ d, ds, total, done, pct }) => {
          const isSelected   = ds === dateStr
          const isCurrentDay = ds === format(new Date(), 'yyyy-MM-dd')
          return (
            <button
              key={ds}
              onClick={() => setViewDate(d)}
              className="flex flex-col items-center gap-1.5 flex-1 py-1 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider select-none">
                {format(d, 'EEEEE', { locale: es })}
              </span>
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                isSelected
                  ? 'bg-gray-900 text-white shadow-sm'
                  : isCurrentDay
                  ? 'ring-2 ring-gray-300 text-gray-900 font-black'
                  : 'text-gray-500 hover:bg-gray-100'
              )}>
                {format(d, 'd')}
              </div>
              <div className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                pct >= 1  ? 'bg-emerald-400' :
                pct > 0   ? 'bg-indigo-400' :
                total > 0 ? 'bg-gray-200' :
                'opacity-0'
              )} />
            </button>
          )
        })}
      </motion.div>

      {/* ── Content ── */}
      {!currentRoutine ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          <div className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Sin rutina para este día</p>
            <p className="text-xs text-gray-400 mb-6">Crea una rutina desde cero o usa una plantilla</p>
            <button
              onClick={() => { createEmptyRoutine(dateStr); setTimeout(() => setAddOpen(true), 100) }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus size={14} /> Crear rutina
            </button>
          </div>

          {templates.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Plantillas</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl.id, dateStr)}
                    className="w-full flex items-center gap-3 py-3 px-4 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Layers size={15} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{tpl.name}</p>
                      <p className="text-xs text-gray-400">{tpl.blocks.length} bloques predefinidos</p>
                    </div>
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Aplicar →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* ── Stats bar — Notion property row ── */}
          <div className="flex items-center gap-6 pb-5 mb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Bloques</span>
              <span className="text-sm font-semibold text-gray-900">{completedBlocks}/{totalBlocks}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-gray-400" />
              <span className="text-xs text-gray-400">Planificado</span>
              <span className="text-sm font-semibold text-gray-900">{(totalMinutes / 60).toFixed(1)}h</span>
            </div>
            {completedMinutes > 0 && (
              <div className="flex items-center gap-1.5">
                <Zap size={11} className="text-gray-400" />
                <span className="text-xs text-gray-400">Completado</span>
                <span className="text-sm font-semibold text-emerald-600">{(completedMinutes / 60).toFixed(1)}h</span>
              </div>
            )}
            <div className="ml-auto">
              <button
                onClick={() => { setAddOpen(o => !o); setAddForm({ ...EMPTY_FORM }) }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium"
              >
                <Plus size={13} /> Agregar
              </button>
            </div>
          </div>

          {/* ── Active block banner ── */}
          <AnimatePresence>
            {activeBlock && (() => {
              const color   = CATEGORY_COLORS[activeBlock.category]
              const remaining = toMin(activeBlock.endTime) - currentMinutes
              const total     = toMin(activeBlock.endTime) - toMin(activeBlock.startTime)
              const pct       = Math.min(100, ((total - remaining) / total) * 100)
              return (
                <motion.div
                  key="active-banner"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-4 rounded-xl border overflow-hidden"
                  style={{ background: `${color}08`, borderColor: `${color}28` }}
                >
                  <div className="h-[2px] bg-gray-100">
                    <motion.div
                      className="h-full"
                      style={{ width: `${pct}%`, background: color }}
                      transition={{ duration: 60 }}
                    />
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-base shrink-0">{activeBlock.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{activeBlock.title}</p>
                      <p className="text-xs text-gray-400">{remaining} min restantes · {activeBlock.startTime}–{activeBlock.endTime}</p>
                    </div>
                    <button
                      onClick={() => { toggleBlock(currentRoutine.id, activeBlock.id); addXP(5, `Bloque: ${activeBlock.title}`) }}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                      style={{ background: `${color}18`, color }}
                    >
                      ✓ Completar
                    </button>
                  </div>
                </motion.div>
              )
            })()}
          </AnimatePresence>

          {/* ── Timeline — Notion-style block list ── */}
          <div className="space-y-0.5 -mx-3 px-3">
            {sorted.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-400">Sin bloques · Agrega uno abajo</p>
              </div>
            ) : (
              sorted.map((block, i) => {
                const status = blockStatus(block)
                const dur    = toMin(block.endTime) - toMin(block.startTime)
                const color  = CATEGORY_COLORS[block.category]
                const section      = getTimeSection(block.startTime)
                const showSection  = i === 0 || getTimeSection(sorted[i - 1].startTime) !== section

                return (
                  <div key={block.id}>
                    {/* Now marker */}
                    {isToday && i === nowIdx && <NowMarker />}

                    {/* Section divider */}
                    {showSection && (
                      <div className="flex items-center gap-3 pt-5 pb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">
                          {SECTION_EMOJI[section]} {section}
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                    )}

                    {/* Block row */}
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: status === 'overdue' ? 0.4 : 1, x: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className={cn(
                        'group flex items-center gap-3 py-2 rounded-lg transition-colors cursor-default',
                        status !== 'overdue' && 'hover:bg-gray-50/80'
                      )}
                    >
                      {/* Drag handle */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab">
                        <GripVertical size={14} className="text-gray-300" />
                      </div>

                      {/* Checkbox */}
                      <button
                        onClick={() => { toggleBlock(currentRoutine.id, block.id); if (!block.completed) addXP(5, `Bloque: ${block.title}`) }}
                        className="shrink-0 transition-transform hover:scale-110 active:scale-95"
                      >
                        {status === 'completed'
                          ? <CheckCircle2 size={18} className="text-emerald-500" />
                          : <Circle size={18} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                        }
                      </button>

                      {/* Time */}
                      <span className="text-[11px] text-gray-400 font-mono w-12 text-right shrink-0 tabular-nums">
                        {block.startTime}
                      </span>

                      {/* Category accent */}
                      <div
                        className="w-0.5 h-4 rounded-full shrink-0 transition-opacity"
                        style={{ background: color, opacity: status === 'completed' ? 0.25 : 0.55 }}
                      />

                      {/* Icon */}
                      <span className="text-base select-none shrink-0">{block.icon}</span>

                      {/* Title */}
                      <span className={cn(
                        'flex-1 text-sm font-medium min-w-0 truncate',
                        status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                      )}>
                        {block.title}
                        {status === 'active' && (
                          <motion.span
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Infinity, duration: 1.6 }}
                            className="ml-2 inline-block w-1.5 h-1.5 rounded-full align-middle"
                            style={{ background: color }}
                          />
                        )}
                      </span>

                      {/* Duration */}
                      <span className="text-xs text-gray-400 shrink-0 hidden sm:block tabular-nums">
                        {dur}m
                      </span>

                      {/* Category pill */}
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full shrink-0 hidden md:block font-medium"
                        style={{ background: `${color}10`, color }}
                      >
                        {CATEGORY_ICONS[block.category]} {CATEGORY_LABELS[block.category]}
                      </span>

                      {/* Actions (hover) */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); openEdit(block) }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-all"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); removeBlock(currentRoutine.id, block.id) }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )
              })
            )}

            {/* Now marker at end */}
            {isToday && nowIdx === sorted.length && sorted.length > 0 && <NowMarker />}
          </div>

          {/* ── Add block ── */}
          <div className="mt-3 -mx-3 px-3">
            <AnimatePresence>
              {addOpen ? (
                <motion.div
                  key="add-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border border-gray-200 rounded-xl p-5 mt-2 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-gray-900">Nuevo bloque</p>
                      <button onClick={() => setAddOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
                        <X size={14} />
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
                  key="add-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setAddOpen(true)}
                  className="w-full flex items-center gap-2.5 text-sm text-gray-400 hover:text-gray-600 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                >
                  <Plus size={14} />
                  <span>Agregar bloque</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Tomorrow CTA ── */}
      {isToday && !routines.find(r => r.date === format(addDays(new Date(), 1), 'yyyy-MM-dd')) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-12 pt-6 border-t border-gray-100"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5 select-none">🌅</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-0.5">¿Cuál será tu rutina mañana?</p>
              <p className="text-xs text-gray-400 mb-3">Planifica con anticipación para empezar el día sin fricciones.</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { createEmptyRoutine(format(addDays(new Date(), 1), 'yyyy-MM-dd')); setViewDate(addDays(new Date(), 1)) }}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors font-medium"
                >
                  <Plus size={12} /> Desde cero
                </button>
                {templates[0] && (
                  <button
                    onClick={() => { applyTemplate(templates[0].id, format(addDays(new Date(), 1), 'yyyy-MM-dd')); setViewDate(addDays(new Date(), 1)) }}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
                  >
                    <RefreshCw size={12} /> Usar plantilla
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Edit modal ── */}
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
    </div>
  )
}
