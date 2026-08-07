'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus, Pencil, Trash2, X, Check, Lock, ChevronDown, ChevronRight,
  BookOpen, Flame, AlertTriangle, CheckCircle2, Circle, Clock,
  Pause, Play, Flag, Minus,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import {
  useStudyStore,
  type StudyGoal, type StudyPhase,
} from '@/stores/study.store'

// ── Helpers ───────────────────────────────────────────────────

function calcProjection(totalH: number, loggedH: number, dailyH: number) {
  if (dailyH <= 0 || totalH <= loggedH) return null
  const days = (totalH - loggedH) / dailyH
  const date = new Date()
  date.setDate(date.getDate() + Math.ceil(days))
  return {
    days,
    y: Math.floor(days / 365),
    m: Math.floor((days % 365) / 30.44),
    d: Math.ceil(days % 30.44),
    date,
  }
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProjLabel({ p }: { p: ReturnType<typeof calcProjection> }) {
  if (!p) return null
  const parts: string[] = []
  if (p.y > 0) parts.push(`${p.y} año${p.y > 1 ? 's' : ''}`)
  if (p.m > 0) parts.push(`${p.m} mes${p.m > 1 ? 'es' : ''}`)
  if (p.d > 0 && p.y === 0) parts.push(`${p.d} día${p.d !== 1 ? 's' : ''}`)
  return <>{parts.join(' · ')}</>
}

// ── Weekly chart ──────────────────────────────────────────────

function WeeklyChart({ goalId, dailyHours }: { goalId: string; dailyHours: number }) {
  const { sessions } = useStudyStore()

  const weeks = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 8 }, (_, i) => {
      const offset = 7 - i
      const monday = new Date(now)
      const dow = (now.getDay() + 6) % 7
      monday.setDate(now.getDate() - dow - offset * 7)
      monday.setHours(0, 0, 0, 0)
      const sunday = new Date(monday.getTime() + 7 * 86400000)
      const mondayStr = monday.toISOString().slice(0, 10)
      const sundayStr = sunday.toISOString().slice(0, 10)
      const actual = sessions
        .filter(s => s.goalId === goalId && s.date >= mondayStr && s.date < sundayStr)
        .reduce((a, s) => a + s.hours, 0)
      return { label: format(monday, 'd MMM', { locale: es }), planned: dailyHours * 7, actual, isCurrent: offset === 0 }
    })
  }, [sessions, goalId, dailyHours])

  const maxH = Math.max(...weeks.map(w => Math.max(w.planned, w.actual)), 0.5)

  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Planeado vs real · 8 semanas</p>
      <div className="flex items-end gap-1.5" style={{ height: 72 }}>
        {weeks.map((w, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full">
            <div className="w-full flex gap-0.5 items-end flex-1">
              <div
                className="flex-1 rounded-t-sm"
                style={{ height: `${(w.planned / maxH) * 100}%`, background: '#E5E7EB', opacity: w.isCurrent ? 0.9 : 0.55 }}
                title={`Planeado: ${w.planned.toFixed(1)}h`}
              />
              <div
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(3, (w.actual / maxH) * 100)}%`,
                  background: w.actual === 0 ? '#F3F4F6' : w.actual >= w.planned ? '#10B981' : '#6366F1',
                  opacity: w.isCurrent ? 1 : 0.7,
                }}
                title={`Real: ${w.actual.toFixed(1)}h`}
              />
            </div>
            <span className={cn('text-[9px] text-center leading-tight tabular-nums', w.isCurrent ? 'text-gray-600 font-bold' : 'text-gray-400')}>
              {w.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2.5">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-gray-200" /><span className="text-[10px] text-gray-400">Planeado</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-indigo-500" /><span className="text-[10px] text-gray-400">Real</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500" /><span className="text-[10px] text-gray-400">Superado</span></div>
      </div>
    </div>
  )
}

// ── Goal modal ────────────────────────────────────────────────

function GoalModal({ open, initial, onSave, onClose }: {
  open: boolean
  initial?: Partial<StudyGoal>
  onSave: (g: Pick<StudyGoal, 'name' | 'totalHours' | 'dailyHours'>) => void
  onClose: () => void
}) {
  const [name, setName]           = useState('')
  const [totalHours, setTotal]    = useState(10000)
  const [dailyHours, setDaily]    = useState(2)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setTotal(initial?.totalHours ?? 10000)
      setDaily(initial?.dailyHours ?? 2)
    }
  }, [open]) // eslint-disable-line

  const p = calcProjection(totalHours, 0, dailyHours)
  const isEdit = !!initial?.id

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar meta' : 'Nueva meta de estudio'}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Nombre de la meta</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Dev Fullstack, Piano, Inglés B2…"
            className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400 transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Horas objetivo</label>
            <input type="number" min={1} value={totalHours}
              onChange={e => setTotal(Math.max(1, Number(e.target.value)))}
              className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Horas diarias</label>
            <input type="number" min={0.5} max={24} step={0.5} value={dailyHours}
              onChange={e => setDaily(Math.min(24, Math.max(0.5, Number(e.target.value))))}
              className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400 transition-colors" />
          </div>
        </div>
        {p && !isEdit && (
          <motion.div key={`${totalHours}-${dailyHours}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
            <p className="text-xs text-indigo-500 mb-0.5">Con {dailyHours}h/día terminarías el</p>
            <p className="text-sm font-black text-indigo-700">{fmtDate(p.date)}</p>
            <p className="text-[11px] text-indigo-400 mt-0.5"><ProjLabel p={p} /></p>
          </motion.div>
        )}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={onClose} size="sm">Cancelar</Button>
          <Button variant="glow" size="sm"
            disabled={!name.trim() || totalHours < 1 || dailyHours < 0.5}
            onClick={() => { onSave({ name, totalHours, dailyHours }); onClose() }}>
            <Check size={13} /> {isEdit ? 'Guardar' : 'Crear meta'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Phase modal ───────────────────────────────────────────────

function PhaseModal({ open, initial, nextOrder, onSave, onClose }: {
  open: boolean
  initial?: StudyPhase
  nextOrder: number
  onSave: (p: { name: string; targetHours: number; resources: string; order: number }) => void
  onClose: () => void
}) {
  const [name, setName]       = useState('')
  const [hours, setHours]     = useState(50)
  const [resources, setRes]   = useState('')

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? `Fase ${nextOrder}`)
      setHours(initial?.targetHours ?? 50)
      setRes(initial?.resources ?? '')
    }
  }, [open]) // eslint-disable-line

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar fase' : 'Nueva fase'}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Nombre</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            placeholder={`Fase ${nextOrder} — Fundamentos`}
            className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400 transition-colors" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Horas objetivo</label>
          <input type="number" min={1} value={hours} onChange={e => setHours(Math.max(1, Number(e.target.value)))}
            className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400 transition-colors" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Recursos (opcional)</label>
          <textarea value={resources} onChange={e => setRes(e.target.value)}
            placeholder="Links, libros, cursos…" rows={2}
            className="w-full rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 py-2 focus:outline-none focus:border-indigo-400 resize-none transition-colors" />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={onClose} size="sm">Cancelar</Button>
          <Button variant="glow" size="sm"
            disabled={!name.trim() || hours < 1}
            onClick={() => { onSave({ name, targetHours: hours, resources, order: initial?.order ?? nextOrder }); onClose() }}>
            <Check size={13} /> {initial ? 'Guardar' : 'Añadir fase'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Log session modal ─────────────────────────────────────────

function LogSessionModal({ open, goals, phases, initialGoalId, initialPhaseId, initialHours, source, onSave, onClose }: {
  open: boolean
  goals: StudyGoal[]
  phases: StudyPhase[]
  initialGoalId?: string
  initialPhaseId?: string
  initialHours?: number
  source?: 'manual' | 'pomodoro'
  onSave: (s: { goalId: string; phaseId: string; date: string; hours: number; note?: string; source: 'manual' | 'pomodoro' }) => void
  onClose: () => void
}) {
  const [goalId, setGoalId] = useState(initialGoalId ?? goals[0]?.id ?? '')
  const [phaseId, setPhId]  = useState(initialPhaseId ?? '')
  const [date, setDate]     = useState(new Date().toISOString().slice(0, 10))
  const [hours, setHours]   = useState(initialHours ?? 1)
  const [note, setNote]     = useState('')

  useEffect(() => {
    if (open) {
      setGoalId(initialGoalId ?? goals[0]?.id ?? '')
      setPhId(initialPhaseId ?? '')
      setDate(new Date().toISOString().slice(0, 10))
      setHours(initialHours ?? 1)
      setNote('')
    }
  }, [open]) // eslint-disable-line

  const goalPhases = phases
    .filter(p => p.goalId === goalId && p.status !== 'completed')
    .sort((a, b) => a.order - b.order)
  const defaultPhase = goalPhases.find(p => p.status === 'in-progress') ?? goalPhases[0]
  const resolvedPhase = phaseId || defaultPhase?.id || ''

  return (
    <Modal open={open} onClose={onClose} title="Registrar sesión de estudio">
      <div className="space-y-4">
        {goals.length > 1 && (
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Meta</label>
            <select value={goalId} onChange={e => { setGoalId(e.target.value); setPhId('') }}
              className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400 transition-colors">
              {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Fase</label>
          <select value={resolvedPhase} onChange={e => setPhId(e.target.value)}
            className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400 transition-colors">
            {goalPhases.map(p => (
              <option key={p.id} value={p.id}>{p.name}{p.status === 'in-progress' ? ' · Activa' : ''}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Horas</label>
            <input type="number" min={0.25} max={24} step={0.25} value={hours}
              onChange={e => setHours(Math.max(0.25, Number(e.target.value)))}
              className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400 transition-colors" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Nota (opcional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="¿Qué estudiaste?"
            className="w-full h-9 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 focus:outline-none focus:border-indigo-400 transition-colors" />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={onClose} size="sm">Cancelar</Button>
          <Button variant="glow" size="sm"
            disabled={!goalId || !resolvedPhase || hours < 0.25}
            onClick={() => { onSave({ goalId, phaseId: resolvedPhase, date, hours, note: note || undefined, source: source ?? 'manual' }); onClose() }}>
            <Check size={13} /> Registrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Complete phase modal ──────────────────────────────────────

function CompletePhaseModal({ open, phase, onConfirm, onClose }: {
  open: boolean
  phase: StudyPhase | null
  onConfirm: (notes: string) => void
  onClose: () => void
}) {
  const [notes, setNotes] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Completar fase">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          ¿Marcar <span className="font-semibold text-gray-900">{phase?.name}</span> como completada?
          La siguiente fase se desbloqueará.
        </p>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Notas de cierre (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="¿Qué aprendiste? Puntos clave, recursos usados…"
            className="w-full rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 px-3 py-2 focus:outline-none focus:border-indigo-400 resize-none transition-colors" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} size="sm">Cancelar</Button>
          <Button variant="glow" size="sm" onClick={() => { onConfirm(notes); onClose(); setNotes('') }}>
            <CheckCircle2 size={13} /> Completar fase
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Phase row ─────────────────────────────────────────────────

function PhaseRow({ phase, loggedH, isLocked, onEdit, onComplete, onLog, onDelete }: {
  phase: StudyPhase
  loggedH: number
  isLocked: boolean
  onEdit: () => void
  onComplete: () => void
  onLog: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const pct   = Math.min(100, (loggedH / phase.targetHours) * 100)
  const isDone   = phase.status === 'completed'
  const isActive = phase.status === 'in-progress'
  const barColor = isDone ? '#10B981' : isActive ? 'linear-gradient(90deg,#6366F1,#06B6D4)' : '#D1D5DB'
  const pctColor = isDone ? '#10B981' : isActive ? '#6366F1' : '#9CA3AF'
  const hasExtra = !!(phase.notes || phase.resources)

  return (
    <div className={cn('rounded-xl border transition-all', isDone ? 'border-gray-100 bg-gray-50/50 opacity-60' : isLocked ? 'border-gray-100 opacity-35' : 'border-gray-200 bg-white')}>
      <div className="flex items-center gap-2.5 p-3">
        {/* Status icon */}
        <div className="shrink-0">
          {isDone   ? <CheckCircle2 size={15} className="text-emerald-500" />
          : isLocked ? <Lock size={13} className="text-gray-300" />
          : isActive ? <Circle size={15} className="text-indigo-500" />
          :             <Circle size={15} className="text-gray-200" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1.5">
            <p className={cn('text-sm font-semibold truncate', isDone ? 'text-gray-400 line-through' : 'text-gray-900')}>
              {phase.name}
            </p>
            <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
              {loggedH.toFixed(1)} / {phase.targetHours}h
            </span>
            {isDone && phase.completedAt && (
              <span className="text-[10px] text-emerald-500 font-medium shrink-0">
                ✓ {format(new Date(phase.completedAt), 'd MMM', { locale: es })}
              </span>
            )}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: isDone ? '#10B981' : isActive ? 'linear-gradient(90deg,#6366F1,#06B6D4)' : '#D1D5DB' }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
        </div>

        {/* Pct */}
        <span className="text-xs font-bold tabular-nums shrink-0 w-9 text-right" style={{ color: pctColor }}>
          {pct.toFixed(0)}%
        </span>

        {/* Actions */}
        {!isLocked && (
          <div className="flex items-center gap-0.5 shrink-0">
            {isActive && (
              <button onClick={onLog}
                className="px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                + Log
              </button>
            )}
            {isActive && (
              <button onClick={onComplete} title="Completar fase"
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                <Flag size={12} />
              </button>
            )}
            <button onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              <Pencil size={12} />
            </button>
            <button onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
              <Trash2 size={11} />
            </button>
            {hasExtra && (
              <button onClick={() => setExpanded(e => !e)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded notes/resources */}
      <AnimatePresence>
        {expanded && hasExtra && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2">
              {phase.notes && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Notas de cierre</p>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{phase.notes}</p>
                </div>
              )}
              {phase.resources && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Recursos</p>
                  <p className="text-xs text-gray-500 whitespace-pre-wrap">{phase.resources}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Auto-log banner ───────────────────────────────────────────

function AutoLogBanner() {
  const { pendingPomodoro, setPendingPomodoro, goals, phases, addSession } = useStudyStore()
  const [goalId, setGoalId] = useState('')
  const [phaseId, setPhId]  = useState('')

  const activeGoals = goals.filter(g => g.status === 'active')
  const selGoal  = activeGoals.find(g => g.id === goalId) ?? activeGoals[0]
  const selPhases = selGoal
    ? phases.filter(p => p.goalId === selGoal.id && p.status === 'in-progress').sort((a, b) => a.order - b.order)
    : []
  const selPhase = selPhases.find(p => p.id === phaseId) ?? selPhases[0]

  if (!pendingPomodoro || activeGoals.length === 0) return null

  const hours = +(pendingPomodoro.durationMin / 60).toFixed(2)

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 flex items-center gap-2.5 flex-wrap">
      <span className="text-base shrink-0">🍅</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-cyan-800">Sesión completada · {pendingPomodoro.durationMin}min</p>
        {pendingPomodoro.taskTitle && <p className="text-[11px] text-cyan-600 truncate">{pendingPomodoro.taskTitle}</p>}
      </div>
      {activeGoals.length > 1 && (
        <select value={goalId || selGoal?.id || ''} onChange={e => { setGoalId(e.target.value); setPhId('') }}
          className="h-7 rounded-lg bg-white border border-cyan-200 text-xs text-gray-700 px-2 focus:outline-none">
          {activeGoals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      )}
      {selPhases.length > 1 && (
        <select value={phaseId || selPhase?.id || ''} onChange={e => setPhId(e.target.value)}
          className="h-7 rounded-lg bg-white border border-cyan-200 text-xs text-gray-700 px-2 focus:outline-none">
          {selPhases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      <div className="flex gap-1.5 shrink-0">
        <button
          disabled={!selGoal || !selPhase}
          onClick={() => {
            if (!selGoal || !selPhase) return
            addSession({ goalId: selGoal.id, phaseId: selPhase.id, date: new Date().toISOString().slice(0, 10), hours, note: pendingPomodoro.taskTitle, source: 'pomodoro' })
            setPendingPomodoro(null)
          }}
          className="px-2.5 py-1 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-40 transition-colors">
          Asignar
        </button>
        <button onClick={() => setPendingPomodoro(null)} className="p-1 text-cyan-500 hover:text-cyan-800 rounded-lg transition-colors">
          <X size={14} />
        </button>
      </div>
    </motion.div>
  )
}

// ── Goal card ─────────────────────────────────────────────────

function GoalCard({ goal }: { goal: StudyGoal }) {
  const {
    sessions, phases, updateGoal, removeGoal, pauseGoal, resumeGoal,
    addPhase, updatePhase, removePhase, completePhase, addSession,
    getGoalPhases, getGoalHours, getPhaseHours, getActivePhase,
  } = useStudyStore()

  const [phaseModal, setPhaseModal]       = useState(false)
  const [editPhase, setEditPhase]         = useState<StudyPhase | null>(null)
  const [completeTarget, setComplTarget]  = useState<StudyPhase | null>(null)
  const [logPhaseId, setLogPhaseId]       = useState<string | null>(null)
  const [goalEditOpen, setGoalEdit]       = useState(false)
  const [confirmDel, setConfirmDel]       = useState(false)
  const [previewDaily, setPreviewDaily]   = useState<number | null>(null)
  const [showSessions, setShowSessions]   = useState(false)

  const goalPhases  = getGoalPhases(goal.id)
  const loggedH     = getGoalHours(goal.id)
  const pct         = Math.min(100, (loggedH / goal.totalHours) * 100)
  const daily       = previewDaily ?? goal.dailyHours
  const activePhase = getActivePhase(goal.id)
  const overall     = calcProjection(goal.totalHours, loggedH, daily)
  const phaseProj   = activePhase ? calcProjection(activePhase.targetHours, getPhaseHours(activePhase.id), daily) : null
  const isPaused    = goal.status === 'paused'
  const isDone      = goal.status === 'completed'

  // Pace alert: compare real 14-day pace vs configured
  const cutoffStr = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString().slice(0, 10) }, [])
  const realPace  = sessions.filter(s => s.goalId === goal.id && s.date >= cutoffStr).reduce((a, s) => a + s.hours, 0) / 14
  const showAlert = realPace > 0 && Math.abs(realPace - goal.dailyHours) / goal.dailyHours > 0.2

  const recentSessions = sessions.filter(s => s.goalId === goal.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const nextOrder = goalPhases.length + 1

  return (
    <>
      <div className={cn('rounded-2xl border bg-white transition-all', isPaused || isDone ? 'border-gray-100 opacity-70' : 'border-gray-200')}>

        {/* ── Header ── */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="text-sm font-bold text-gray-900 truncate">{goal.name}</h3>
                {isPaused && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-semibold shrink-0">Pausada</span>}
                {isDone   && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold shrink-0">✓ Completada</span>}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-gray-900 tabular-nums">{loggedH.toFixed(1)}</span>
                <span className="text-sm text-gray-400">/ {goal.totalHours.toLocaleString()}h</span>
                <span className="text-sm font-bold ml-0.5" style={{ color: pct >= 100 ? '#10B981' : '#6366F1' }}>{pct.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {!isPaused && !isDone && (
                <button onClick={() => pauseGoal(goal.id)} title="Pausar"
                  className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Pause size={13} /></button>
              )}
              {isPaused && (
                <button onClick={() => resumeGoal(goal.id)} title="Reanudar"
                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Play size={13} /></button>
              )}
              <button onClick={() => setGoalEdit(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={13} /></button>
              <button onClick={() => setConfirmDel(true)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>

          {/* Overall bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg,#4F46E5,#06B6D4)' }}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }} />
          </div>
          {pct >= 100 && <p className="text-xs font-bold text-emerald-600 mt-1.5 text-center">🎉 ¡Meta completada!</p>}
        </div>

        {/* ── Phases ── */}
        {goalPhases.length > 0 && (
          <div className="px-4 space-y-2 pb-3">
            {goalPhases.map((phase, idx) => (
              <PhaseRow
                key={phase.id}
                phase={phase}
                loggedH={getPhaseHours(phase.id)}
                isLocked={idx > 0 && goalPhases[idx - 1].status !== 'completed'}
                onLog={() => setLogPhaseId(phase.id)}
                onComplete={() => setComplTarget(phase)}
                onEdit={() => setEditPhase(phase)}
                onDelete={() => removePhase(phase.id)}
              />
            ))}
          </div>
        )}

        {/* Add phase */}
        <div className="px-4 pb-3">
          <button onClick={() => setPhaseModal(true)}
            className="w-full flex items-center gap-2 py-2 text-xs text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Plus size={13} /> Añadir fase
          </button>
        </div>

        {/* ── Projection panel ── */}
        <div className="mx-4 mb-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2.5">
          {/* Daily stepper */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-500">Dedicando</span>
            <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button onClick={() => setPreviewDaily(v => Math.max(0.5, Math.round(((v ?? goal.dailyHours) - 0.5) * 10) / 10))}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                <Minus size={12} />
              </button>
              <input type="number" min={0.5} max={24} step={0.5} value={daily}
                onChange={e => setPreviewDaily(Math.min(24, Math.max(0.5, Number(e.target.value))))}
                className="w-12 text-center text-sm font-black text-gray-900 bg-transparent border-none focus:outline-none tabular-nums" />
              <button onClick={() => setPreviewDaily(v => Math.min(24, Math.round(((v ?? goal.dailyHours) + 0.5) * 10) / 10))}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                <Plus size={12} />
              </button>
            </div>
            <span className="text-[11px] text-gray-500">h/día</span>
            {previewDaily !== null && previewDaily !== goal.dailyHours && (
              <button onClick={() => { updateGoal(goal.id, { dailyHours: previewDaily }); setPreviewDaily(null) }}
                className="ml-auto text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Guardar →
              </button>
            )}
          </div>

          {/* Projection dates */}
          {overall && (
            <AnimatePresence mode="wait">
              <motion.div key={daily} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[11px] text-gray-500">Total:</span>
                  <span className="text-sm font-black text-gray-900">{fmtDate(overall.date)}</span>
                  <span className="text-[11px] text-gray-400"><ProjLabel p={overall} /></span>
                </div>
                {activePhase && phaseProj && (
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[11px] text-gray-500">{activePhase.name}:</span>
                    <span className="text-[11px] font-semibold text-indigo-600">{fmtDate(phaseProj.date)}</span>
                    <span className="text-[11px] text-gray-400"><ProjLabel p={phaseProj} /></span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pace alert */}
          {showAlert && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">
                Ritmo real: <strong>{realPace.toFixed(1)}h/día</strong> (últimas 2 semanas) ·{' '}
                {realPace < goal.dailyHours ? 'Vas por debajo del plan. ¿Ajustar?' : '¡Vas más rápido de lo planeado!'}
              </p>
            </div>
          )}
        </div>

        {/* ── Weekly chart ── */}
        <div className="mx-4 mb-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
          <WeeklyChart goalId={goal.id} dailyHours={daily} />
        </div>

        {/* ── Session log ── */}
        <div className="px-4 pb-4 space-y-2">
          <button onClick={() => setShowSessions(s => !s)}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
            <Clock size={11} />
            {recentSessions.length > 0 ? 'Últimas sesiones' : 'Sin sesiones aún'}
            {recentSessions.length > 0 && (showSessions ? <ChevronDown size={11} /> : <ChevronRight size={11} />)}
          </button>

          <AnimatePresence>
            {showSessions && recentSessions.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-1">
                {recentSessions.map(s => {
                  const ph = goalPhases.find(p => p.id === s.phaseId)
                  return (
                    <div key={s.id} className="flex items-center gap-2 text-xs py-1 group">
                      <span className="text-gray-400 tabular-nums shrink-0 text-[11px]">{s.date}</span>
                      <span className="font-semibold text-gray-700 tabular-nums shrink-0">{s.hours.toFixed(1)}h</span>
                      <span className="text-gray-400 truncate">{ph?.name ?? '—'}</span>
                      {s.note && <span className="text-gray-400 truncate italic text-[11px]">· {s.note}</span>}
                      {s.source === 'pomodoro' && <span className="text-[10px] text-cyan-500 shrink-0">🍅</span>}
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={goalPhases.filter(p => p.status !== 'completed').length === 0}
            onClick={() => setLogPhaseId(activePhase?.id ?? goalPhases.find(p => p.status !== 'completed')?.id ?? '')}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Plus size={13} /> Registrar sesión
          </button>
        </div>
      </div>

      {/* Modals */}
      <GoalModal open={goalEditOpen} initial={goal} onSave={u => updateGoal(goal.id, u)} onClose={() => setGoalEdit(false)} />

      <PhaseModal open={phaseModal} nextOrder={nextOrder}
        onSave={p => addPhase({ ...p, goalId: goal.id })} onClose={() => setPhaseModal(false)} />

      {editPhase && (
        <PhaseModal open={!!editPhase} initial={editPhase} nextOrder={editPhase.order}
          onSave={p => updatePhase(editPhase.id, p)} onClose={() => setEditPhase(null)} />
      )}

      <CompletePhaseModal open={!!completeTarget} phase={completeTarget}
        onConfirm={notes => completeTarget && completePhase(completeTarget.id, notes)}
        onClose={() => setComplTarget(null)} />

      {logPhaseId !== null && (
        <LogSessionModal open={true}
          goals={[goal]} phases={goalPhases}
          initialGoalId={goal.id} initialPhaseId={logPhaseId}
          onSave={s => addSession(s)} onClose={() => setLogPhaseId(null)} />
      )}

      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="Eliminar meta">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Eliminar <span className="font-semibold text-gray-900">{goal.name}</span> y todo su historial?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setConfirmDel(false)} size="sm">Cancelar</Button>
            <button onClick={() => removeGoal(goal.id)}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors">
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ── Main export ───────────────────────────────────────────────

export function StudySection() {
  const { goals, phases, addGoal, addSession, getStreak } = useStudyStore()
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [logOpen, setLogOpen]         = useState(false)

  const streak      = getStreak()
  const activeGoals = goals.filter(g => g.status === 'active')
  const pausedGoals = goals.filter(g => g.status === 'paused')
  const doneGoals   = goals.filter(g => g.status === 'completed')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen size={18} className="text-indigo-500 shrink-0" />
        <h2 className="text-base font-black text-gray-900 flex-1">Metas de Estudio</h2>
        {streak > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
            <Flame size={12} className="text-amber-500" />
            <span className="text-[11px] font-bold text-amber-600">{streak} día{streak > 1 ? 's' : ''}</span>
          </div>
        )}
        <button onClick={() => setLogOpen(true)} disabled={activeGoals.length === 0}
          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100 transition-colors disabled:opacity-40">
          + Log sesión
        </button>
        <button onClick={() => setAddGoalOpen(true)} title="Nueva meta"
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
          <Plus size={16} />
        </button>
      </div>

      {/* Auto-log banner */}
      <AnimatePresence>
        <AutoLogBanner />
      </AnimatePresence>

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="text-4xl mb-3 select-none">📚</div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Sin metas de estudio</p>
          <p className="text-xs text-gray-400 mb-5">Crea una meta y divide el camino en fases</p>
          <button onClick={() => setAddGoalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
            <Plus size={14} /> Nueva meta
          </button>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.map(g => <GoalCard key={g.id} goal={g} />)}

      {/* Paused */}
      {pausedGoals.length > 0 && (
        <>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pt-1">Pausadas</p>
          {pausedGoals.map(g => <GoalCard key={g.id} goal={g} />)}
        </>
      )}

      {/* Completed */}
      {doneGoals.length > 0 && (
        <>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pt-1">Completadas</p>
          {doneGoals.map(g => <GoalCard key={g.id} goal={g} />)}
        </>
      )}

      {/* Modals */}
      <GoalModal open={addGoalOpen} onSave={g => addGoal(g)} onClose={() => setAddGoalOpen(false)} />

      {logOpen && (
        <LogSessionModal open={true}
          goals={activeGoals} phases={phases.filter(p => activeGoals.some(g => g.id === p.goalId))}
          onSave={s => addSession(s)} onClose={() => setLogOpen(false)} />
      )}
    </div>
  )
}
