'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Trophy, Plus, Flame, Star, CheckCircle2, Circle, Target,
  TrendingUp, Calendar, ChevronRight, Trash2, Edit3, X,
  Zap, Lock, Sparkles, Crown, CheckSquare, AlarmClock,
  RotateCcw, ChevronDown, ChevronUp, Eye,
} from 'lucide-react'
import { useVisionStore } from '@/stores/vision.store'
import type { VisionItem } from '@/stores/vision.store'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils/cn'
import { useGoalsStore, GOAL_XP } from '@/stores/goals.store'
import { useAppStore } from '@/stores/app.store'
import type { Goal, GoalCategory, GoalType, GoalPriority, GoalStatus, GoalAchievement } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_META: Record<GoalCategory, { label: string; icon: string; color: string }> = {
  finance:       { label: 'Finanzas',    icon: '💰', color: '#FFFFFF' },
  health:        { label: 'Salud',       icon: '💪', color: '#EF4444' },
  career:        { label: 'Carrera',     icon: '💼', color: '#CCCCCC' },
  spiritual:     { label: 'Espiritual',  icon: '✝️',  color: '#EF4444' },
  relationships: { label: 'Relaciones',  icon: '❤️',  color: '#EF4444' },
  education:     { label: 'Educación',   icon: '📚', color: '#CCCCCC' },
  personal:      { label: 'Personal',    icon: '⭐', color: '#FFFFFF' },
}

const PRIORITY_META: Record<GoalPriority, { label: string; color: string }> = {
  low:      { label: 'Baja',    color: '#555555' },
  medium:   { label: 'Media',   color: '#888888' },
  high:     { label: 'Alta',    color: '#CCCCCC' },
  critical: { label: 'Crítica', color: '#EF4444' },
}

const STATUS_META: Record<GoalStatus, { label: string; color: string }> = {
  'not-started': { label: 'No iniciada', color: '#555555' },
  'in-progress': { label: 'En progreso', color: '#EF4444' },
  'completed':   { label: 'Completada',  color: '#FFFFFF' },
  'paused':      { label: 'Pausada',     color: '#888888' },
}

const TYPE_LABELS: Record<GoalType, string> = {
  annual: 'Anuales', monthly: 'Mensuales', weekly: 'Semanales', daily: 'Diarias',
}

const LEVEL_XP_TABLE = [0, 100, 250, 500, 1000, 1800, 2800, 4200, 6000, 8500, 12000, 16000, 21000, 28000, 36000, 46000]
const LEVEL_TITLES   = ['Principiante', 'Aprendiz', 'Explorador', 'Guerrero', 'Campeón', 'Maestro', 'Experto', 'Élite', 'Leyenda', 'Inmortal']

function getLevelInfo(xp: number) {
  let level = 1
  for (let i = LEVEL_XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_TABLE[i]) { level = i + 1; break }
  }
  const idx        = Math.min(level - 1, LEVEL_XP_TABLE.length - 1)
  const thisXP     = LEVEL_XP_TABLE[idx] ?? 0
  const nextXP     = LEVEL_XP_TABLE[idx + 1] ?? Math.round(thisXP * 1.5)
  const current    = xp - thisXP
  const needed     = nextXP - thisXP
  return { level, title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)], current, needed, pct: Math.min(100, (current / needed) * 100) }
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONF_COLORS = ['#EF4444','#FFFFFF','#EF4444','#CCCCCC','#EF4444','#FFFFFF','#CCCCCC','#EF4444']

function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number; size: number; rot: number }[]>([])

  useEffect(() => {
    if (active) {
      setParticles(Array.from({ length: 70 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)],
        delay: Math.random() * 0.8,
        size: Math.random() * 9 + 4,
        rot: Math.random() * 720 - 360,
      })))
    } else {
      setParticles([])
    }
  }, [active])

  if (!active || !particles.length) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          initial={{ x: `${p.x}vw`, y: '-5vh', opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0.4, 0], rotate: p.rot }}
          transition={{ duration: 2.5 + Math.random() * 1.5, delay: p.delay, ease: 'easeIn' }}
          style={{ width: p.size, height: p.size, background: p.color }}
        />
      ))}
    </div>
  )
}

// ─── Achievement Toast ────────────────────────────────────────────────────────

function AchievementToast({ achievement, onDismiss }: { achievement: GoalAchievement; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      className="fixed top-6 right-6 z-[300] flex items-center gap-3 px-4 py-3 rounded-2xl border"
      style={{ background: '#111111', borderColor: 'rgba(239,68,68,0.4)', boxShadow: '0 0 40px rgba(239,68,68,0.2)' }}
    >
      <div className="text-3xl">{achievement.icon}</div>
      <div>
        <p className="text-[10px] text-[#EF4444] font-bold uppercase tracking-wider">¡Logro desbloqueado!</p>
        <p className="text-sm font-bold text-white">{achievement.title}</p>
        <p className="text-xs text-gray-400">+{achievement.xpReward} XP</p>
      </div>
      <button onClick={onDismiss} className="ml-1 text-gray-400 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  )
}

// ─── Stat Widget ──────────────────────────────────────────────────────────────

function StatWidget({ label, value, Icon, color }: { label: string; value: string | number; Icon: any; color: string }) {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-2xl border border-white/8 bg-[#111]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
    </div>
  )
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal, childCount, childDone, onComplete, onDelete, onEdit, onProgressChange,
}: {
  goal: Goal
  childCount: number
  childDone: number
  onComplete: () => void
  onDelete: () => void
  onEdit: () => void
  onProgressChange: (v: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cat  = CAT_META[goal.category]
  const sta  = STATUS_META[goal.status]
  const pri  = PRIORITY_META[goal.priority]
  const done = goal.status === 'completed'

  return (
    <motion.div
      layout
      whileHover={{ y: done ? 0 : -2 }}
      className={cn('rounded-2xl border overflow-hidden', done && 'opacity-60')}
      style={{ background: `linear-gradient(135deg, ${cat.color}08 0%, #ffffff 70%)`, borderColor: `${cat.color}22` }}
    >
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${cat.color}, transparent)` }} />
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: `${cat.color}18` }}>{cat.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pri.color }} />
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
                style={{ color: sta.color, borderColor: `${sta.color}40`, background: `${sta.color}12` }}>
                {sta.label}
              </span>
            </div>
            <p className={cn('font-bold text-white leading-snug text-sm', done && 'line-through')}>{goal.title}</p>
            {goal.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{goal.description}</p>}
          </div>
          <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-500 transition-colors shrink-0 mt-1">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Progreso</span>
            <span className="font-bold" style={{ color: cat.color }}>{goal.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}70)` }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><Calendar size={10} />{format(new Date(goal.targetDate), 'd MMM yy', { locale: es })}</span>
          {childCount > 0 && <span className="flex items-center gap-1"><Target size={10} />{childDone}/{childCount}</span>}
          <span className="flex items-center gap-1 ml-auto"><Star size={10} className="text-[#EF4444]" />+{GOAL_XP[goal.type]}</span>
        </div>

        {/* Expanded */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-3 mt-3 border-t border-white/8 space-y-3">
                {!done && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Ajustar progreso</label>
                    <input type="range" min={0} max={100} value={goal.progress}
                      onChange={e => onProgressChange(Number(e.target.value))}
                      className="w-full accent-red-500" />
                  </div>
                )}
                <div className="flex gap-2">
                  {!done && (
                    <button onClick={onComplete}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                      style={{ background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}80 100%)` }}>
                      <CheckCircle2 size={13} /> Completar +{GOAL_XP[goal.type]} XP
                    </button>
                  )}
                  <button onClick={onEdit} className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={onDelete} className="px-3 py-2 rounded-xl text-xs text-red-600/60 hover:text-red-600 bg-white/5 hover:bg-red-500/10 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Task Item ────────────────────────────────────────────────────────────────

function TaskItem({ task, onToggle }: { task: Goal; onToggle: () => void }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const isDone   = task.checkedDate === todayStr
  const cat      = CAT_META[task.category]

  return (
    <motion.div layout whileTap={{ scale: 0.98 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group',
        isDone ? 'opacity-40 bg-white/5 border-white/8' : 'bg-[#111] border-white/8 hover:border-white/15'
      )}
      onClick={onToggle}
    >
      <button className="shrink-0 transition-transform group-hover:scale-110">
        {isDone
          ? <CheckCircle2 size={20} style={{ color: cat.color }} />
          : <Circle size={20} className="text-gray-500 group-hover:text-gray-300" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium leading-snug', isDone ? 'text-gray-500 line-through' : 'text-white')}>
          {task.title}
        </p>
        {task.time && <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><AlarmClock size={10} />{task.time}</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {task.repeat && <RotateCcw size={11} className="text-gray-400" />}
        <span className="text-sm">{cat.icon}</span>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_META[task.priority].color }} />
      </div>
    </motion.div>
  )
}

// ─── Add Goal Modal ───────────────────────────────────────────────────────────

const EMPTY: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '', category: 'personal', priority: 'medium', status: 'not-started',
  progress: 0, type: 'annual', targetDate: format(new Date(), 'yyyy-MM-dd'),
}

function AddGoalModal({ open, onClose, onSave, initialType, parentGoals }: {
  open: boolean; onClose: () => void
  onSave: (g: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialType: GoalType; parentGoals: Goal[]
}) {
  const [form, setForm] = useState<typeof EMPTY & { parentId: string; time: string; repeat: boolean; description: string }>({
    ...EMPTY, type: initialType, parentId: '', time: '', repeat: false, description: '',
  })
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (open) setForm({ ...EMPTY, type: initialType, parentId: '', time: '', repeat: false, description: '' })
  }, [open, initialType])

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave({
      title: form.title.trim(),
      description: form.description || undefined,
      category: form.category,
      priority: form.priority,
      status: form.status,
      progress: 0,
      type: form.type,
      parentId: form.parentId || undefined,
      targetDate: form.targetDate,
      time: form.time || undefined,
      repeat: form.repeat || undefined,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva meta">
      <div className="space-y-4">
        {/* Type pills */}
        <div className="flex gap-1 p-1 rounded-xl bg-[#111] border border-white/8">
          {(['annual','monthly','weekly','daily'] as GoalType[]).map(t => (
            <button key={t} onClick={() => set('type', t)}
              className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                form.type === t ? 'bg-[#EF4444] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300')}>
              {t === 'annual' ? 'Anual' : t === 'monthly' ? 'Mensual' : t === 'weekly' ? 'Semanal' : 'Diaria'}
            </button>
          ))}
        </div>

        <Input label="Título" value={form.title} onChange={e => set('title', e.target.value)}
          placeholder={form.type === 'daily' ? 'Leer 20 minutos...' : 'Ahorrar $50,000...'} />

        {form.type !== 'daily' && (
          <div>
            <label className="text-sm font-medium text-gray-400 block mb-1.5">Descripción (opcional)</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="¿Qué quieres lograr?"
              className="w-full rounded-xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 px-3 py-2.5 focus:outline-none focus:border-[#EF4444]/50 resize-none" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-400 block mb-1.5">Categoría</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full h-10 rounded-xl bg-[#111] border border-white/8 text-sm text-white px-3 focus:outline-none">
              {Object.entries(CAT_META).map(([v, m]) => <option key={v} value={v}>{m.icon} {m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400 block mb-1.5">Prioridad</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}
              className="w-full h-10 rounded-xl bg-[#111] border border-white/8 text-sm text-white px-3 focus:outline-none">
              {Object.entries(PRIORITY_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {form.type !== 'annual' && parentGoals.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-400 block mb-1.5">Vincular a meta (opcional)</label>
            <select value={form.parentId} onChange={e => set('parentId', e.target.value)}
              className="w-full h-10 rounded-xl bg-[#111] border border-white/8 text-sm text-white px-3 focus:outline-none">
              <option value="">Sin vincular</option>
              {parentGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-400 block mb-1.5">Fecha objetivo</label>
            <input type="date" value={form.targetDate} onChange={e => set('targetDate', e.target.value)}
              className="w-full h-10 rounded-xl bg-[#111] border border-white/8 text-sm text-white px-3 focus:outline-none" />
          </div>
          {form.type === 'daily' && (
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1.5">Hora (opcional)</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                className="w-full h-10 rounded-xl bg-[#111] border border-white/8 text-sm text-white px-3 focus:outline-none" />
            </div>
          )}
        </div>

        {form.type === 'daily' && (
          <label className="flex items-center gap-3 p-3 rounded-xl bg-[#111] border border-white/8 cursor-pointer">
            <input type="checkbox" checked={form.repeat} onChange={e => set('repeat', e.target.checked)} className="accent-red-500 w-4 h-4" />
            <div>
              <p className="text-sm font-medium text-white">Recurrente diaria</p>
              <p className="text-xs text-gray-500">Aparece todos los días automáticamente</p>
            </div>
          </label>
        )}

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="glow" disabled={!form.title.trim()} onClick={handleSave}>
            <Plus size={14} /> Crear meta
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Vision Section ──────────────────────────────────────────────────────────

function VisionItemRow({ item, type, onToggle, onRemove }: {
  item: VisionItem
  type: 'short' | 'long'
  onToggle: () => void
  onRemove: () => void
}) {
  const daysLeft = Math.ceil((new Date(item.date).getTime() - Date.now()) / 86400000)
  const overdue  = !item.done && daysLeft < 0
  const soon     = !item.done && daysLeft >= 0 && daysLeft <= 30

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        'flex items-center gap-3 p-3.5 rounded-xl border transition-all group',
        item.done
          ? 'bg-white/5 border-white/8 opacity-50'
          : 'bg-[#111] border-white/8 hover:border-white/15'
      )}
    >
      <button onClick={onToggle} className="shrink-0 hover:scale-110 active:scale-90 transition-transform">
        {item.done
          ? <CheckCircle2 size={22} className="text-white" />
          : <Circle size={22} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold leading-tight', item.done ? 'line-through text-gray-500' : 'text-white')}>
          {item.title}
        </p>
        <p className={cn('text-xs mt-0.5', overdue ? 'text-[#EF4444]' : soon ? 'text-gray-400' : 'text-gray-500')}>
          {overdue
            ? `⚠ Venció hace ${Math.abs(daysLeft)}d`
            : item.done
            ? '✓ Completado'
            : daysLeft === 0
            ? '¡Hoy!'
            : `${new Date(item.date).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })} · ${daysLeft}d`
          }
        </p>
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </motion.div>
  )
}

function AddItemRow({ type, onAdd }: { type: 'short' | 'long'; onAdd: (title: string, date: string) => void }) {
  const [open, setOpen]   = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate]   = useState('')

  const today = new Date()
  const defaultDate = type === 'short'
    ? new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toISOString().slice(0, 10)
    : new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()).toISOString().slice(0, 10)

  const handleSave = () => {
    if (!title.trim() || !date) return
    onAdd(title.trim(), date)
    setTitle('')
    setDate('')
    setOpen(false)
  }

  if (!open) return (
    <button
      onClick={() => { setOpen(true); setDate(defaultDate) }}
      className={cn('w-full flex items-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-all',
        'border-white/10 text-gray-500 hover:bg-white/5 hover:border-white/20 hover:text-gray-300'
      )}
    >
      <Plus size={15} className="ml-3" /> Agregar objetivo
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 rounded-xl border border-white/12 bg-[#111] space-y-2"
    >
      <input
        autoFocus
        placeholder="¿Qué quieres lograr?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setOpen(false) }}
        className="w-full h-9 rounded-lg bg-[#1A1A1A] border border-white/8 text-sm text-white px-3 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30"
      />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="flex-1 h-9 rounded-lg bg-[#1A1A1A] border border-white/8 text-sm text-white px-3 focus:outline-none"
        />
        <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg bg-white/5 text-xs text-gray-500 border border-white/8 hover:bg-white/10 transition-all">
          Cancelar
        </button>
        <button onClick={handleSave} disabled={!title.trim() || !date}
          className="px-3 py-2 rounded-lg text-xs text-white font-bold disabled:opacity-40 transition-all bg-[#EF4444] hover:bg-red-500">
          Guardar
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'vision' | 'dashboard' | 'metas' | 'hoy' | 'logros'

export default function GoalsPage() {
  const {
    goals, achievements, streak,
    addGoal, updateGoal, deleteGoal, completeGoal,
    toggleDailyTask, updateProgress,
    getByType, getChildren, getTodayTasks, getCompletedGoals,
  } = useGoalsStore()
  const { user, addXP } = useAppStore()

  const { visionText, shortTerm, longTerm, setText, addItem, toggleItem, removeItem } = useVisionStore()

  const [tab, setTab]               = useState<Tab>('vision')
  const [goalType, setGoalType]     = useState<GoalType>('annual')
  const [addModal, setAddModal]     = useState(false)
  const [editGoal, setEditGoal]     = useState<Goal | null>(null)
  const [confetti, setConfetti]     = useState(false)
  const [toasts, setToasts]         = useState<GoalAchievement[]>([])
  const [statusFilter, setStatus]   = useState<'all' | GoalStatus>('all')

  const xp         = user?.xp ?? 0
  const lv         = getLevelInfo(xp)
  const todayTasks = getTodayTasks()
  const todayStr   = format(new Date(), 'yyyy-MM-dd')
  const todayDone  = todayTasks.filter(t => t.checkedDate === todayStr)
  const completed  = getCompletedGoals()

  const fireConfetti = useCallback(() => {
    setConfetti(true)
    setTimeout(() => setConfetti(false), 3500)
  }, [])

  const handleComplete = useCallback((id: string, type: GoalType) => {
    const achs = completeGoal(id)
    addXP(GOAL_XP[type], 'Meta completada')
    fireConfetti()
    achs.forEach(a => { addXP(a.xpReward, `Logro: ${a.title}`); setToasts(p => [...p, a]) })
  }, [completeGoal, addXP, fireConfetti])

  const handleToggleTask = useCallback((id: string) => {
    const { completed: wasDone, newAchievements } = toggleDailyTask(id)
    if (wasDone) { addXP(GOAL_XP.daily, 'Tarea diaria completada'); fireConfetti() }
    newAchievements.forEach(a => { addXP(a.xpReward, `Logro: ${a.title}`); setToasts(p => [...p, a]) })
  }, [toggleDailyTask, addXP, fireConfetti])

  const catProgress = (Object.keys(CAT_META) as GoalCategory[]).map(cat => {
    const cg = goals.filter(g => g.category === cat && g.type !== 'daily')
    if (!cg.length) return null
    return { cat, pct: Math.round(cg.reduce((s, g) => s + g.progress, 0) / cg.length), count: cg.length }
  }).filter(Boolean) as { cat: GoalCategory; pct: number; count: number }[]

  const filteredGoals = getByType(goalType).filter(g => statusFilter === 'all' || g.status === statusFilter)

  const parentGoals = goalType === 'monthly' ? getByType('annual')
    : goalType === 'weekly'  ? getByType('monthly')
    : goalType === 'daily'   ? [...getByType('annual'), ...getByType('monthly'), ...getByType('weekly')]
    : []

  const unlockedCount = achievements.filter(a => a.unlockedAt).length

  return (
    <>
      <Confetti active={confetti} />
      <AnimatePresence>
        {toasts.map((a, i) => (
          <AchievementToast key={`${a.id}-${i}`} achievement={a} onDismiss={() => setToasts(p => p.filter((_, j) => j !== i))} />
        ))}
      </AnimatePresence>

      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Trophy size={24} className="text-[#EF4444]" /> Metas y Progreso
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{completed.filter(g => g.type !== 'daily').length} metas completadas · {streak}d de racha</p>
          </div>
          <Button onClick={() => setAddModal(true)} variant="glow" size="sm">
            <Plus size={14} /> Nueva meta
          </Button>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-[#111] border border-white/8 w-fit flex-wrap">
          {([['vision','🔭 Visión'],['dashboard','Resumen'],['metas','Metas'],['hoy','Hoy'],['logros','Logros']] as [Tab,string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all relative',
                tab === id ? 'bg-[#EF4444] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300')}>
              {label}
              {id === 'logros' && unlockedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-[9px] text-white font-bold flex items-center justify-center">
                  {unlockedCount}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* ══ VISIÓN ══ */}
        {tab === 'vision' && (
          <motion.div variants={fadeUp} className="space-y-6">

            {/* Vision statement */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye size={15} className="text-[#EF4444]" />
                <p className="text-sm font-bold text-white">Mi visión personal</p>
              </div>
              <textarea
                rows={5}
                value={visionText}
                onChange={e => setText(e.target.value)}
                placeholder="¿Quién quieres ser? ¿Cuál es tu propósito? Escribe tu visión con libertad..."
                className="w-full rounded-2xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 px-4 py-3 focus:outline-none focus:border-[#EF4444]/30 resize-none leading-relaxed"
              />
            </div>

            {/* Short-term */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
                <p className="text-sm font-bold text-white">Corto plazo</p>
                <span className="text-xs text-gray-500">· menos de 1 año</span>
                <span className="ml-auto text-xs text-gray-400">
                  {shortTerm.filter(i => i.done).length}/{shortTerm.length} listos
                </span>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {shortTerm.map(item => (
                    <VisionItemRow
                      key={item.id}
                      item={item}
                      type="short"
                      onToggle={() => toggleItem('short', item.id)}
                      onRemove={() => removeItem('short', item.id)}
                    />
                  ))}
                </AnimatePresence>
                <AddItemRow type="short" onAdd={(t, d) => addItem('short', t, d)} />
              </div>
            </div>

            {/* Long-term */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
                <p className="text-sm font-bold text-white">Largo plazo</p>
                <span className="text-xs text-gray-500">· más de 1 año</span>
                <span className="ml-auto text-xs text-gray-400">
                  {longTerm.filter(i => i.done).length}/{longTerm.length} listos
                </span>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {longTerm.map(item => (
                    <VisionItemRow
                      key={item.id}
                      item={item}
                      type="long"
                      onToggle={() => toggleItem('long', item.id)}
                      onRemove={() => removeItem('long', item.id)}
                    />
                  ))}
                </AnimatePresence>
                <AddItemRow type="long" onAdd={(t, d) => addItem('long', t, d)} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ DASHBOARD ══ */}
        {tab === 'dashboard' && (
          <motion.div variants={fadeUp} className="space-y-5">
            {/* XP bar */}
            <div className="p-4 rounded-2xl border border-white/10 bg-[#111]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                  <Crown size={20} className="text-[#EF4444]" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <p className="font-bold text-white">Nivel {lv.level} — {lv.title}</p>
                    <p className="text-xs text-[#EF4444] font-semibold tabular-nums">{lv.current.toLocaleString()} / {lv.needed.toLocaleString()} XP</p>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #EF4444, #DC2626)' }}
                      initial={{ width: 0 }} animate={{ width: `${lv.pct}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut' }} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Zap size={11} className="text-[#EF4444]" />{xp.toLocaleString()} XP total
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatWidget label="Completadas" value={completed.filter(g => g.type !== 'daily').length} Icon={CheckCircle2} color="#FFFFFF" />
              <StatWidget label="En progreso" value={goals.filter(g => g.status === 'in-progress' && g.type !== 'daily').length} Icon={TrendingUp} color="#EF4444" />
              <StatWidget label="Racha" value={`${streak}d`} Icon={Flame} color="#EF4444" />
              <StatWidget label="XP Total" value={xp.toLocaleString()} Icon={Star} color="#CCCCCC" />
            </div>

            {/* Today tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <CheckSquare size={15} className="text-[#EF4444]" /> Tareas de hoy
                </h3>
                <span className="text-xs text-gray-500">{todayDone.length}/{todayTasks.length}</span>
              </div>
              {todayTasks.length === 0 ? (
                <button onClick={() => { setGoalType('daily'); setTab('hoy'); setAddModal(true) }}
                  className="w-full py-4 text-sm text-gray-500 border border-dashed border-white/10 rounded-xl hover:text-gray-300 hover:border-white/20 transition-all">
                  + Agregar tareas para hoy
                </button>
              ) : (
                <div className="space-y-2">
                  {todayTasks.slice(0, 5).map(t => <TaskItem key={t.id} task={t} onToggle={() => handleToggleTask(t.id)} />)}
                  {todayTasks.length > 5 && (
                    <button onClick={() => setTab('hoy')} className="w-full text-xs text-gray-500 hover:text-[#EF4444] py-1.5 transition-colors">
                      +{todayTasks.length - 5} tareas más →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Category progress */}
            {catProgress.length > 0 && (
              <div>
                <h3 className="font-semibold text-white mb-3">Progreso por categoría</h3>
                <div className="space-y-2.5">
                  {catProgress.map(({ cat, pct }) => {
                    const m = CAT_META[cat]
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500 flex items-center gap-1.5">{m.icon} {m.label}</span>
                          <span className="font-bold" style={{ color: m.color }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            style={{ background: m.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Annual goals mini list */}
            {getByType('annual').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">Metas anuales</h3>
                  <button onClick={() => setTab('metas')} className="text-xs text-[#EF4444] hover:text-red-400 flex items-center gap-1 transition-colors">
                    Ver todas <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-2">
                  {getByType('annual').slice(0, 4).map(g => {
                    const c = CAT_META[g.category]
                    return (
                      <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#111] border border-white/8">
                        <span className="text-base shrink-0">{c.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{g.title}</p>
                          <div className="mt-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${g.progress}%`, background: c.color }} />
                          </div>
                        </div>
                        <span className="text-xs font-bold shrink-0" style={{ color: c.color }}>{g.progress}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ METAS ══ */}
        {tab === 'metas' && (
          <motion.div variants={fadeUp} className="space-y-4">
            {/* Type filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['annual','monthly','weekly'] as GoalType[]).map(t => (
                <button key={t} onClick={() => setGoalType(t)}
                  className={cn('px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                    goalType === t ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/25' : 'text-gray-500 border-white/8 hover:text-gray-300')}>
                  {TYPE_LABELS[t]}
                  <span className="ml-1.5 text-xs opacity-60">({getByType(t).length})</span>
                </button>
              ))}
              <button onClick={() => setAddModal(true)}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-dashed border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all">
                <Plus size={13} /> Agregar
              </button>
            </div>

            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {[['all','Todas'],['not-started','Sin iniciar'],['in-progress','En progreso'],['completed','Completadas'],['paused','Pausadas']].map(([v,l]) => (
                <button key={v} onClick={() => setStatus(v as any)}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                    statusFilter === v ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300')}>
                  {l}
                </button>
              ))}
            </div>

            {filteredGoals.length === 0 ? (
              <div className="text-center py-14 space-y-3">
                <div className="text-5xl">🎯</div>
                <p className="text-gray-500 text-sm">No tienes metas {TYPE_LABELS[goalType].toLowerCase()} aún.</p>
                <Button variant="glow" size="sm" onClick={() => setAddModal(true)}><Plus size={14} /> Crear primera meta</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredGoals.map(g => {
                    const ch = getChildren(g.id)
                    return (
                      <GoalCard key={g.id} goal={g}
                        childCount={ch.length}
                        childDone={ch.filter(c => c.status === 'completed').length}
                        onComplete={() => handleComplete(g.id, g.type)}
                        onDelete={() => deleteGoal(g.id)}
                        onEdit={() => setEditGoal(g)}
                        onProgressChange={v => updateProgress(g.id, v)}
                      />
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ HOY ══ */}
        {tab === 'hoy' && (
          <motion.div variants={fadeUp} className="space-y-4">
            {/* Date header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{todayDone.length} de {todayTasks.length} tareas completadas</p>
              </div>
              {/* Circular progress */}
              <div className="w-14 h-14 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <motion.circle cx="18" cy="18" r="15" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"
                    style={{ strokeDasharray: 94 }}
                    initial={{ strokeDashoffset: 94 }}
                    animate={{ strokeDashoffset: todayTasks.length > 0 ? 94 * (1 - todayDone.length / todayTasks.length) : 94 }}
                    transition={{ duration: 0.6 }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {todayTasks.length > 0 ? Math.round((todayDone.length / todayTasks.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Add quick */}
            <button onClick={() => { setGoalType('daily'); setAddModal(true) }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all text-sm">
              <Plus size={16} /> Agregar tarea para hoy...
            </button>

            {/* Pending */}
            {todayTasks.filter(t => t.checkedDate !== todayStr).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Pendientes</p>
                <div className="space-y-2">
                  {todayTasks
                    .filter(t => t.checkedDate !== todayStr)
                    .sort((a, b) => ({ critical:0, high:1, medium:2, low:3 }[a.priority]) - ({ critical:0, high:1, medium:2, low:3 }[b.priority]))
                    .map(t => <TaskItem key={t.id} task={t} onToggle={() => handleToggleTask(t.id)} />)
                  }
                </div>
              </div>
            )}

            {/* Done */}
            {todayDone.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Completadas</p>
                <div className="space-y-2">
                  {todayDone.map(t => <TaskItem key={t.id} task={t} onToggle={() => handleToggleTask(t.id)} />)}
                </div>
              </div>
            )}

            {todayTasks.length === 0 && (
              <div className="text-center py-14 space-y-2">
                <div className="text-5xl">✅</div>
                <p className="text-gray-500 text-sm">No tienes tareas para hoy. ¡Agrega una!</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ LOGROS ══ */}
        {tab === 'logros' && (
          <motion.div variants={fadeUp} className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-sm font-medium">{unlockedCount} / {achievements.length} desbloqueados</p>
              <div className="h-1.5 w-36 rounded-full bg-white/8 overflow-hidden">
                <motion.div className="h-full rounded-full bg-[#EF4444]"
                  animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }} />
              </div>
            </div>

            {unlockedCount > 0 && (
              <div>
                <p className="text-xs text-[#EF4444] uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
                  <Sparkles size={11} /> Desbloqueados
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {achievements.filter(a => a.unlockedAt).map(a => (
                    <motion.div key={a.id} whileHover={{ scale: 1.03 }}
                      className="p-4 rounded-2xl border text-center space-y-1.5"
                      style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.28)' }}>
                      <div className="text-4xl">{a.icon}</div>
                      <p className="font-bold text-white text-sm">{a.title}</p>
                      <p className="text-xs text-gray-500 leading-snug">{a.description}</p>
                      <div className="flex items-center justify-center gap-1 pt-0.5">
                        <Star size={11} className="text-[#EF4444]" />
                        <span className="text-xs text-[#EF4444] font-semibold">+{a.xpReward} XP</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
                <Lock size={11} /> Por desbloquear
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {achievements.filter(a => !a.unlockedAt).map(a => (
                  <div key={a.id} className="p-4 rounded-2xl border border-white/6 bg-white/3 text-center space-y-1.5 opacity-35">
                    <div className="text-4xl grayscale">{a.icon}</div>
                    <p className="font-bold text-gray-400 text-sm">{a.title}</p>
                    <p className="text-xs text-gray-500 leading-snug">{a.description}</p>
                    <div className="flex items-center justify-center gap-1 pt-0.5">
                      <Lock size={10} className="text-gray-500" />
                      <span className="text-xs text-gray-500">+{a.xpReward} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Add Goal Modal ── */}
        <AddGoalModal
          open={addModal}
          onClose={() => setAddModal(false)}
          initialType={tab === 'hoy' ? 'daily' : goalType}
          parentGoals={parentGoals}
          onSave={g => { addGoal(g); if (g.type !== 'daily') addXP(5, 'Meta creada') }}
        />

        {/* ── Edit Goal Modal ── */}
        <Modal open={!!editGoal} onClose={() => setEditGoal(null)} title="Editar meta">
          {editGoal && (
            <div className="space-y-4">
              <Input label="Título" value={editGoal.title}
                onChange={e => setEditGoal(p => p ? { ...p, title: e.target.value } : p)} />
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1.5">Estado</label>
                <select value={editGoal.status}
                  onChange={e => setEditGoal(p => p ? { ...p, status: e.target.value as GoalStatus } : p)}
                  className="w-full h-10 rounded-xl bg-[#111] border border-white/8 text-sm text-white px-3 focus:outline-none">
                  {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1.5">Progreso: {editGoal.progress}%</label>
                <input type="range" min={0} max={100} value={editGoal.progress}
                  onChange={e => setEditGoal(p => p ? { ...p, progress: Number(e.target.value) } : p)}
                  className="w-full accent-red-500" />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setEditGoal(null)}>Cancelar</Button>
                <Button variant="glow" onClick={() => { updateGoal(editGoal.id, editGoal); setEditGoal(null) }}>Guardar</Button>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    </>
  )
}
