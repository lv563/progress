'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar, CheckCircle2, Circle, RefreshCw, ChevronLeft, ChevronRight,
  Plus, Trash2, Pencil, X, Check, Layers
} from 'lucide-react'
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

const BLOCK_ICONS = ['🙏','💪','🍳','🧠','☕','🍽','💼','🚀','👨‍👩‍👧','📚','📋','🎮','🏃','📖','💡','🎯','✝️','🌿','🎵','🏋️','🧘','💊','🛁','🌙']

const EMPTY_FORM = {
  title: '',
  category: 'work' as RoutineBlock['category'],
  startTime: '08:00',
  endTime: '09:00',
  icon: '🧠',
}

/* ── Block form (shared for add + edit) ──────────────────── */
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
          <label className="text-sm text-slate-400 font-medium block mb-1.5">Inicio</label>
          <input
            type="time"
            value={value.startTime}
            onChange={e => onChange({ startTime: e.target.value })}
            className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 font-medium block mb-1.5">Fin</label>
          <input
            type="time"
            value={value.endTime}
            onChange={e => onChange({ endTime: e.target.value })}
            className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none focus:border-violet-500/50"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 font-medium block mb-2">Categoría</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(CATEGORY_LABELS) as [RoutineBlock['category'], string][]).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => onChange({ category: cat })}
              className={cn('px-2 py-2 rounded-lg text-xs font-medium transition-all border', value.category === cat ? '' : 'text-slate-400 border-white/[0.06] hover:text-slate-200')}
              style={value.category === cat ? { background: `${CATEGORY_COLORS[cat]}20`, borderColor: `${CATEGORY_COLORS[cat]}50`, color: CATEGORY_COLORS[cat] } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 font-medium block mb-2">Ícono</label>
        <div className="flex flex-wrap gap-1.5">
          {BLOCK_ICONS.map(icon => (
            <button
              key={icon}
              onClick={() => onChange({ icon })}
              className={cn('w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all border', value.icon === icon ? 'bg-violet-500/20 border-violet-500/40 scale-110' : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]')}
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
  // inline add form open
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM })
  // edit modal
  const [editBlock, setEditBlock] = useState<RoutineBlock | null>(null)
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const dateStr   = format(viewDate, 'yyyy-MM-dd')
  const isToday   = dateStr === format(new Date(), 'yyyy-MM-dd')
  const isTomorrow = dateStr === format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const currentRoutine = routines.find(r => r.date === dateStr)
  const completedBlocks = currentRoutine?.blocks.filter(b => b.completed).length ?? 0
  const totalBlocks     = currentRoutine?.blocks.length ?? 0
  const currentMinutes  = now.getHours() * 60 + now.getMinutes()

  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

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
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Calendar size={24} className="text-amber-400" /> Rutina
          </h1>
          <p className="text-slate-400 text-sm capitalize mt-0.5">{dayLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date nav */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button onClick={() => setViewDate(d => subDays(d, 1))} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setViewDate(new Date())} className={cn('px-2 py-1 rounded-md text-xs font-medium transition-all', isToday ? 'bg-violet-500/30 text-violet-300' : 'text-slate-400 hover:text-slate-200')}>
              Hoy
            </button>
            <button onClick={() => setViewDate(d => addDays(d, 1))} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          {currentRoutine && (
            <>
              <Badge variant="violet">{completedBlocks}/{totalBlocks}</Badge>
              <Button variant="secondary" size="sm" onClick={() => { setAddOpen(o => !o); setAddForm({ ...EMPTY_FORM }) }}>
                <Plus size={14} /> Agregar bloque
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Empty state */}
      {!currentRoutine ? (
        <motion.div variants={fadeUp} className="space-y-3">
          {/* Primary CTA — start blank */}
          <GlassCard className="p-6" animate={false}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
                <Plus size={22} className="text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">Crear rutina desde cero</h3>
                <p className="text-sm text-slate-500 mb-4">Empieza con una rutina vacía y agrega los bloques que quieras a tu ritmo.</p>
                <Button variant="glow" onClick={() => { createEmptyRoutine(dateStr); setTimeout(() => setAddOpen(true), 100) }}>
                  <Plus size={14} /> Empezar en blanco
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Templates as secondary options */}
          {templates.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 px-1">O usa una plantilla</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl.id, dateStr)}
                    className="flex items-center gap-3 p-4 rounded-xl glass border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Layers size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{tpl.name}</p>
                      <p className="text-xs text-slate-500">{tpl.blocks.length} bloques predefinidos</p>
                    </div>
                    <RefreshCw size={14} className="ml-auto text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-4">

          {/* Progress bar */}
          {totalBlocks > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500">Progreso del día</span>
                <span className="font-semibold text-violet-400">{completedBlocks}/{totalBlocks} completados</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
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
            return (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-500/30"
                style={{ background: `${CATEGORY_COLORS[active.category]}15` }}
              >
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                <span className="text-base">{active.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">Ahora: {active.title}</p>
                  <p className="text-xs text-slate-500">{remaining} min restantes · {active.startTime} — {active.endTime}</p>
                </div>
                <button onClick={() => { toggleBlock(currentRoutine.id, active.id); addXP(5, `Bloque: ${active.title}`) }} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors">
                  Completar
                </button>
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
              <div className="flex items-center gap-3 pl-1 py-1">
                <div className="w-14 shrink-0 text-right"><span className="text-[10px] font-bold text-red-400 font-mono">{nowLabel}</span></div>
                <div className="w-3 flex justify-center"><div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.7)]" /></div>
                <div className="flex-1 h-px bg-red-400/50" />
                <span className="text-[10px] text-red-400 font-bold tracking-wider pr-2">AHORA</span>
              </div>
            )
            return (
              <div className="relative">
                <div className="absolute left-16 top-0 bottom-0 w-px bg-white/[0.06]" />
                <div className="space-y-1">
                  {sorted.map((block, i) => {
                    const status = blockStatus(block)
                    const dur = toMin(block.endTime) - toMin(block.startTime)
                    return (
                      <div key={block.id}>
                        {isToday && i === nowIdx && <NowMarker />}
                        <motion.div layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ delay: i * 0.03 }} className="flex items-start gap-3 pl-1">
                          <div className="w-14 shrink-0 text-right pt-3">
                            <span className="text-xs text-slate-600 font-mono">{block.startTime}</span>
                          </div>
                          <div className="relative flex flex-col items-center pt-1">
                            <div className={cn('w-3 h-3 rounded-full border-2 mt-2 z-10',
                              status === 'completed' ? 'bg-emerald-400 border-emerald-400' :
                              status === 'active'    ? 'bg-violet-400 border-violet-400 shadow-[0_0_8px_rgba(124,58,237,0.8)]' :
                              status === 'overdue'   ? 'bg-red-400/40 border-red-400/40' :
                              'bg-transparent border-white/20'
                            )} />
                          </div>
                          {/* Card */}
                          <div className={cn(
                            'flex-1 rounded-xl p-3 border transition-all mb-1 group',
                            status === 'completed' ? 'bg-emerald-500/[0.04] border-emerald-500/20' :
                            status === 'active'    ? 'border-violet-500/40 shadow-[0_0_14px_rgba(124,58,237,0.12)]' :
                            status === 'overdue'   ? 'border-red-500/10 opacity-55' :
                            'glass border-transparent hover:bg-white/[0.04]'
                          )}
                          style={status === 'active' ? { background: `${CATEGORY_COLORS[block.category]}10` } : undefined}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base select-none">{block.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={cn('text-sm font-semibold truncate', status === 'completed' ? 'text-slate-500 line-through' : 'text-white')}>
                                    {block.title}
                                  </p>
                                  {status === 'active' && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                                </div>
                                <p className="text-xs text-slate-600 font-mono">{block.startTime} — {block.endTime} · {dur}min</p>
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  onClick={e => { e.stopPropagation(); openEdit(block) }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                                  title="Editar"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); removeBlock(currentRoutine.id, block.id) }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                  title="Eliminar"
                                >
                                  <Trash2 size={12} />
                                </button>
                                <button
                                  onClick={() => { toggleBlock(currentRoutine.id, block.id); if (!block.completed) addXP(5, `Bloque: ${block.title}`) }}
                                  className="p-1 text-slate-600 hover:text-emerald-400 transition-colors"
                                >
                                  {status === 'completed' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} />}
                                </button>
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

          {/* Inline add form */}
          <AnimatePresence>
            {addOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <GlassCard className="p-5" variant="elevated" animate={false}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Nuevo bloque</h3>
                    <button onClick={() => setAddOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
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
                </GlassCard>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setAddOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/[0.08] text-slate-600 hover:text-slate-400 hover:border-white/20 transition-all text-sm"
              >
                <Plus size={14} /> Agregar bloque
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Tomorrow plan card */}
      {isToday && !routines.find(r => r.date === format(addDays(new Date(), 1), 'yyyy-MM-dd')) && (
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" variant="glow" animate={false}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌅</span>
              <div className="flex-1">
                <p className="font-semibold text-white mb-1">¿Cuál será tu rutina mañana?</p>
                <p className="text-sm text-slate-400 mb-3">Planifica con anticipación para empezar el día sin fricciones.</p>
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
          </GlassCard>
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
