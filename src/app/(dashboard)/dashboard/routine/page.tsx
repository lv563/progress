'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, getDaysInMonth, addMonths, subMonths, differenceInCalendarDays, parseISO
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus, Check, Trash2, X, ChevronLeft, ChevronRight, Inbox,
  AlertTriangle, Minus, ArrowDownRight, Settings, Calendar,
  Dumbbell, UtensilsCrossed, Moon, Sun, Target, Edit2, Save
} from 'lucide-react'
import { useDailyCommandStore, type TodoPriority } from '@/stores/dailyCommand.store'
import { useHabitsStore } from '@/stores/habits.store'
import { useAppStore } from '@/stores/app.store'
import { useWinterArcStore } from '@/stores/winterArc.store'
import { usePlannerStore, type MealType } from '@/stores/planner.store'
import { useFinanceStore } from '@/stores/finance.store'
import { cn } from '@/lib/utils/cn'

// Always use local date, never UTC
const localDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayStr = () => localDateStr()

const PRIORITY_META: Record<TodoPriority, { icon: React.ReactNode; color: string; label: string }> = {
  high:   { icon: <AlertTriangle size={10}/>, color: '#EF4444', label: 'Alta' },
  normal: { icon: <Minus size={10}/>,        color: '#9CA3AF', label: 'Normal' },
  low:    { icon: <ArrowDownRight size={10}/>, color: '#4B5563', label: 'Baja' },
}

const MEALS: { id: MealType; label: string; emoji: string }[] = [
  { id: 'desayuno',     label: 'Desayuno',       emoji: '🍳' },
  { id: 'media_manana', label: 'Media mañana',    emoji: '🥤' },
  { id: 'almuerzo',     label: 'Almuerzo',        emoji: '🍽️' },
  { id: 'merienda',     label: 'Merienda',        emoji: '🍎' },
  { id: 'cena',         label: 'Cena',            emoji: '🌙' },
]

// ─── Month Grid ────────────────────────────────────────────────────────────────

function MonthGrid({
  month, selectedDate, onSelect, onPrevMonth, onNextMonth,
}: {
  month: Date; selectedDate: string
  onSelect: (date: string) => void
  onPrevMonth: () => void; onNextMonth: () => void
}) {
  const { getDayCompletion } = useDailyCommandStore()
  const { habits, getLogForDate } = useHabitsStore()
  const { getCommitmentsForDate } = usePlannerStore()
  const winterArc = useWinterArcStore()
  const today = todayStr()
  const daysInMonth = getDaysInMonth(month)
  const monthStart = format(month, 'yyyy-MM')

  const getDayState = (dayNum: number) => {
    const ds = `${monthStart}-${String(dayNum).padStart(2, '0')}`
    const isToday = ds === today
    const isFuture = ds > today
    const isSelected = ds === selectedDate

    // Count habit completions for this date
    const habitsDone = habits.filter(h => getLogForDate(h.id, ds)?.completed).length

    const { done: todoDone, total: todoTotal } = getDayCompletion(ds)
    const totalDone = todoDone + habitsDone
    const totalItems = todoTotal + habits.length

    // Winter Arc override
    const winterLog = winterArc.isActive ? winterArc.dayLogs.find(l => l.date === ds) : null
    const winterScore = winterLog?.score ?? 0

    // Check if future date has anything planned
    const hasCommitments = getCommitmentsForDate(ds).length > 0
    const hasTodos = todoTotal > 0
    const hasPlanned = isFuture && (hasCommitments || hasTodos)

    let state: 'today' | 'completed' | 'partial' | 'pending' | 'future' | 'planned'
    if (isToday) state = 'today'
    else if (isFuture) state = hasPlanned ? 'planned' : 'future'
    else if (winterArc.isActive && winterLog) {
      state = winterScore >= (winterArc.config?.coldDayThreshold ?? 80)
        ? 'completed' : winterScore >= 40 ? 'partial' : 'pending'
    } else if (totalItems > 0) {
      const pct = Math.round((totalDone / totalItems) * 100)
      state = pct === 100 ? 'completed' : pct >= 50 ? 'partial' : 'pending'
    } else {
      state = 'pending'
    }
    return { ds, isToday, isFuture, isSelected, state, hasPlanned }
  }

  const stateClass = (state: string, isSelected: boolean) => {
    const base = 'w-7 h-7 rounded-full border-2 text-[11px] font-black flex items-center justify-center transition-all cursor-pointer shrink-0 relative'
    const sel = isSelected ? 'ring-2 ring-white/30 ring-offset-1 ring-offset-[#0A0A0A] scale-110' : ''
    if (state === 'today')     return cn(base, sel, 'bg-[#EF4444] border-[#EF4444] text-white')
    if (state === 'completed') return cn(base, sel, 'bg-white border-white text-black')
    if (state === 'partial')   return cn(base, sel, 'bg-amber-500/60 border-amber-500 text-white')
    if (state === 'planned')   return cn(base, sel, 'border-[#EF4444]/40 text-gray-400 hover:border-[#EF4444]/70')
    if (state === 'future')    return cn(base, sel, 'border-white/8 text-gray-700 hover:border-white/20 hover:text-gray-500')
    return cn(base, sel, 'border-white/15 text-gray-500 hover:border-white/25')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] tracking-[0.4em] text-[#EF4444] font-black uppercase mb-0.5">ROUTINES</p>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">
            {format(month, 'MMMM yyyy', { locale: es }).toUpperCase()}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onSelect(todayStr())}
            className="text-[9px] font-black text-gray-600 hover:text-white transition-colors tracking-widest px-2 py-1 rounded hover:bg-white/5">
            HOY
          </button>
          <div className="flex items-center gap-1">
            <button onClick={onPrevMonth} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white transition-all">
              <ChevronLeft size={14} />
            </button>
            <button onClick={onNextMonth} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1
          const { ds, state, isSelected, hasPlanned } = getDayState(dayNum)
          return (
            <button key={dayNum} onClick={() => onSelect(ds)}
              className={stateClass(state, isSelected)} title={ds}>
              {dayNum}
              {hasPlanned && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 text-[10px] text-gray-600">
        {[
          { cl: 'bg-white border-white',          label: 'completado' },
          { cl: 'bg-[#EF4444] border-[#EF4444]',  label: 'hoy' },
          { cl: 'bg-amber-500/60 border-amber-500',label: 'parcial' },
          { cl: 'border-white/15',                 label: 'pendiente' },
          { cl: 'border-[#EF4444]/40',             label: 'planificado' },
        ].map(({ cl, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={cn('w-3 h-3 rounded-full border-2 inline-block', cl)} />
            {label}
          </span>
        ))}
        <span className="ml-auto">{daysInMonth} días</span>
      </div>
    </div>
  )
}

// ─── Quick Checkbox ────────────────────────────────────────────────────────────

function Checkbox({ done, onToggle, disabled }: { done: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button onClick={onToggle} disabled={disabled}
      className={cn(
        'shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
        done ? 'bg-[#EF4444] border-[#EF4444]' : 'border-white/20 hover:border-white/40 bg-transparent',
        disabled && 'opacity-40 cursor-default'
      )}>
      {done && <Check size={11} className="text-white" strokeWidth={3} />}
    </button>
  )
}

// ─── Todo Item ─────────────────────────────────────────────────────────────────

function TodoItem({ todo }: { todo: ReturnType<typeof useDailyCommandStore.getState>['todos'][0] }) {
  const { toggleTodo, deleteTodo, updateTodoPriority } = useDailyCommandStore()
  const [showPriority, setShowPriority] = useState(false)
  const p = PRIORITY_META[todo.priority]
  return (
    <motion.div layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
      className="flex items-center gap-3 py-2 group relative">
      <Checkbox done={todo.completed} onToggle={() => toggleTodo(todo.id)} />
      <p className={cn('flex-1 text-[15px] leading-snug min-w-0 truncate',
        todo.completed ? 'text-gray-600 line-through' : 'text-gray-200')}>
        {todo.text}
      </p>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => setShowPriority(v => !v)} className="p-1 rounded hover:bg-white/8 transition-colors" style={{ color: p.color }}>
          {p.icon}
        </button>
        <button onClick={() => deleteTodo(todo.id)} className="p-1 rounded text-gray-700 hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
      <AnimatePresence>
        {showPriority && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-8 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
            {(['high', 'normal', 'low'] as TodoPriority[]).map(pr => (
              <button key={pr} onClick={() => { updateTodoPriority(todo.id, pr); setShowPriority(false) }}
                className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 w-full text-left"
                style={{ color: PRIORITY_META[pr].color }}>
                {PRIORITY_META[pr].icon} {PRIORITY_META[pr].label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Section Label ─────────────────────────────────────────────────────────────

function SectionLabel({ children, count }: { children: React.ReactNode; count?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[9px] tracking-[0.4em] text-gray-600 font-black">{children}</p>
      {count !== undefined && <span className="text-[10px] text-gray-600">{count}</span>}
    </div>
  )
}

// ─── Checklist Section ─────────────────────────────────────────────────────────

function ChecklistSection({ date, type }: { date: string; type: 'morning' | 'night' }) {
  const { getDailyChecks, toggleDailyCheck } = usePlannerStore()
  const checks = getDailyChecks(date, type)
  const done = checks.filter(c => c.done).length
  const label = type === 'morning' ? 'RUTINA MAÑANERA' : 'RUTINA NOCTURNA'
  const icon = type === 'morning' ? '☀️' : '🌙'

  return (
    <div>
      <SectionLabel count={`${done}/${checks.length}`}>
        {icon} {label}
      </SectionLabel>
      <div className="space-y-0">
        {checks.map(({ item, done: itemDone }) => (
          <div key={item.id} className="flex items-center gap-3 py-2">
            <Checkbox done={itemDone} onToggle={() => toggleDailyCheck(date, item.id)} />
            <span className="text-base shrink-0">{item.emoji}</span>
            <p className={cn('flex-1 text-[15px]', itemDone ? 'text-gray-600 line-through' : 'text-gray-200')}>
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Meals Section ─────────────────────────────────────────────────────────────

function MealsSection({ date }: { date: string }) {
  const { getMealsForDate, toggleMeal, getMealCount } = usePlannerStore()
  const meals = getMealsForDate(date)
  const { done, total } = getMealCount(date)

  return (
    <div>
      <SectionLabel count={`${done}/${total}`}>🍽️ COMIDAS — BULK</SectionLabel>
      <div className="space-y-0">
        {MEALS.map(m => {
          const isDone = meals[m.id] ?? false
          return (
            <div key={m.id} className="flex items-center gap-3 py-2">
              <Checkbox done={isDone} onToggle={() => toggleMeal(date, m.id)} />
              <span className="text-base shrink-0">{m.emoji}</span>
              <p className={cn('flex-1 text-[15px]', isDone ? 'text-gray-600 line-through' : 'text-gray-200')}>
                {m.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Gym Section ──────────────────────────────────────────────────────────────

function GymSection({ date }: { date: string }) {
  const { getGymForDate, toggleCardio, getCardioForDate, getWeeklyCardioCount } = usePlannerStore()
  const gym = getGymForDate(date)
  const cardioDone = getCardioForDate(date)
  const { done: weekCardio, target: weekTarget } = getWeeklyCardioCount(date)

  if (gym.isRest) {
    return (
      <div>
        <SectionLabel>💪 ENTRENO</SectionLabel>
        <p className="text-sm text-gray-600 py-2">Día de descanso · Recuperación activa</p>
      </div>
    )
  }

  return (
    <div>
      <SectionLabel>💪 ENTRENO</SectionLabel>
      <div className="space-y-2">
        <div className="flex items-start gap-3 py-1">
          <div className="w-1 h-1 rounded-full bg-[#EF4444] mt-2 shrink-0" />
          <div>
            <p className="text-[15px] text-white font-bold">{gym.name}</p>
            {gym.muscles && <p className="text-xs text-gray-500 mt-0.5">{gym.muscles}</p>}
          </div>
        </div>

        {gym.hasCardio && (
          <div className="flex items-center gap-3 py-2">
            <Checkbox done={cardioDone} onToggle={() => toggleCardio(date)} />
            <span className="text-base shrink-0">🏃</span>
            <div className="flex-1">
              <p className={cn('text-[15px]', cardioDone ? 'text-gray-600 line-through' : 'text-gray-200')}>
                Cardio — Caminadora
              </p>
              <p className="text-xs text-gray-600">Inclinación máx · Velocidad 3.5</p>
            </div>
            <span className="text-[10px] text-gray-600 shrink-0">
              {weekCardio}/{weekTarget} sem
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Commitments Section ───────────────────────────────────────────────────────

function CommitmentsSection({ date }: { date: string }) {
  const { getCommitmentsForDate, addCommitment, deleteCommitment, toggleCommitment } = usePlannerStore()
  const items = getCommitmentsForDate(date)
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')

  const handleAdd = () => {
    if (!title.trim()) return
    addCommitment({ title: title.trim(), date, time: time || undefined })
    setTitle('')
    setTime('')
    setAddOpen(false)
  }

  return (
    <div>
      <SectionLabel count={`${items.length}`}>📅 COMPROMISOS</SectionLabel>
      <div className="space-y-0">
        {items.map(c => (
          <div key={c.id} className="flex items-center gap-3 py-2 group">
            <Checkbox done={c.done} onToggle={() => toggleCommitment(c.id)} />
            <div className="flex-1 min-w-0">
              <p className={cn('text-[15px] truncate', c.done ? 'text-gray-600 line-through' : 'text-gray-200')}>
                {c.title}
              </p>
              {c.time && <p className="text-xs text-gray-500">{c.time}</p>}
            </div>
            <button onClick={() => deleteCommitment(c.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 p-1 transition-all">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {items.length === 0 && !addOpen && (
          <p className="text-sm text-gray-700 py-2">Sin compromisos para este día</p>
        )}
      </div>

      <AnimatePresence>
        {addOpen && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 py-2 border-t border-white/5 mt-1">
            <input value={time} onChange={e => setTime(e.target.value)} type="time"
              className="w-20 bg-transparent text-sm text-gray-400 border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-[#EF4444]/40" />
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAddOpen(false) }}
              placeholder="Título del compromiso..."
              className="flex-1 bg-transparent text-[15px] text-gray-200 placeholder:text-gray-600 focus:outline-none" />
            <button onClick={() => setAddOpen(false)} className="text-gray-600 hover:text-gray-400">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setAddOpen(true)}
        className="flex items-center gap-2 pt-2 text-sm text-gray-600 hover:text-gray-400 transition-colors group">
        <Plus size={14} className="group-hover:text-[#EF4444] transition-colors" />
        AGREGAR COMPROMISO
      </button>
    </div>
  )
}

// ─── Quick Expense ─────────────────────────────────────────────────────────────

function QuickExpense({ date }: { date: string }) {
  const { addTransaction } = useFinanceStore()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Comida')

  const handleAdd = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0 || !description.trim()) return
    addTransaction({
      type: 'expense',
      category,
      amount: amt,
      description: description.trim(),
      date,
      icon: '💸',
    })
    setAmount('')
    setDescription('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-gray-700 hover:text-gray-400 transition-colors font-black py-2">
        <Plus size={12} /> GASTO RÁPIDO
      </button>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-2 border border-white/8 rounded-xl p-3 bg-white/[0.02]">
      <p className="text-[9px] tracking-[0.4em] text-gray-600 font-black">GASTO RÁPIDO → FINANZAS</p>
      <div className="flex gap-2">
        <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00"
          className="w-24 bg-transparent text-sm text-white border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#EF4444]/40" />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-[#111] text-sm text-gray-300 border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none">
          {['Comida', 'Transporte', 'Salud', 'Ocio', 'Ropa', 'Educación', 'Servicios', 'Otros'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <input value={description} onChange={e => setDescription(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false) }}
        placeholder="Descripción..."
        className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none border-b border-white/8 pb-1" />
      <div className="flex gap-2 pt-1">
        <button onClick={handleAdd} disabled={!amount || !description}
          className="px-3 py-1.5 bg-[#EF4444] text-white text-xs font-bold rounded-lg disabled:opacity-40 transition-opacity">
          Guardar
        </button>
        <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-gray-600 text-xs hover:text-gray-400 transition-colors">
          Cancelar
        </button>
      </div>
    </motion.div>
  )
}

// ─── Gym Config ────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function GymConfigPanel({ onClose }: { onClose: () => void }) {
  const { gymSchedule, updateGymDay } = usePlannerStore()

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="border border-white/8 rounded-2xl bg-[#111] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[9px] tracking-[0.4em] text-gray-500 font-black">CONFIGURAR RUTINA DE GYM</p>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors">
          <X size={14} />
        </button>
      </div>
      {gymSchedule.sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7)).map(day => (
        <div key={day.weekday} className="grid grid-cols-[40px_1fr_auto] items-center gap-2">
          <span className="text-[10px] font-black text-gray-500 uppercase">{WEEKDAY_LABELS[day.weekday]}</span>
          <input
            value={day.name}
            onChange={e => updateGymDay(day.weekday, { name: e.target.value })}
            disabled={day.isRest}
            placeholder="Nombre del día..."
            className="bg-transparent text-sm text-white border-b border-white/10 focus:outline-none focus:border-[#EF4444]/40 disabled:text-gray-600 py-1"
          />
          <div className="flex items-center gap-2">
            <button onClick={() => updateGymDay(day.weekday, { isRest: !day.isRest })}
              className={cn('text-[10px] px-2 py-0.5 rounded-full border font-bold transition-all',
                day.isRest ? 'border-gray-600 text-gray-600' : 'border-[#EF4444]/40 text-[#EF4444]')}>
              {day.isRest ? 'DESC' : 'GYM'}
            </button>
            {!day.isRest && (
              <button onClick={() => updateGymDay(day.weekday, { hasCardio: !day.hasCardio })}
                className={cn('text-[10px] px-2 py-0.5 rounded-full border font-bold transition-all',
                  day.hasCardio ? 'border-white/40 text-white' : 'border-white/10 text-gray-600')}>
                🏃
              </button>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// ─── Day View ──────────────────────────────────────────────────────────────────

function DayView({ date }: { date: string }) {
  const { getDayTodos, getDayCompletion, addTodo, getNoteText, saveNote } = useDailyCommandStore()
  const { habits, getLogForDate, logHabit } = useHabitsStore()
  const { addXP } = useAppStore()
  const winterArc = useWinterArcStore()
  const { getMealCount, getDailyChecks } = usePlannerStore()
  const { getGymForDate, getCardioForDate } = usePlannerStore()

  const today = todayStr()
  const isToday = date === today
  const isFuture = date > today
  const isPast = date < today
  const dayDate = new Date(date + 'T12:00:00')

  const [addText, setAddText] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [noteText, setNoteText] = useState(() => getNoteText(date))
  const [showGymConfig, setShowGymConfig] = useState(false)
  const noteTimer = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setNoteText(getNoteText(date)) }, [date])

  const handleNoteChange = (text: string) => {
    setNoteText(text)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => saveNote(date, text), 600)
  }

  const handleAddTodo = () => {
    if (!addText.trim()) return
    addTodo(date, addText)
    setAddText('')
    inputRef.current?.focus()
  }

  // Compute totals
  const todos = getDayTodos(date)
  const { done: todoDone, total: todoTotal } = getDayCompletion(date)

  const dayHabits = habits.map(h => ({
    ...h,
    done: getLogForDate(h.id, date)?.completed ?? false,
  }))
  const habitsDone = dayHabits.filter(h => h.done).length

  const { done: mealsDone, total: mealsTotal } = getMealCount(date)
  const morningChecks = getDailyChecks(date, 'morning')
  const nightChecks = getDailyChecks(date, 'night')
  const morningDone = morningChecks.filter(c => c.done).length
  const nightDone = nightChecks.filter(c => c.done).length

  const gym = getGymForDate(date)
  const cardioDone = getCardioForDate(date)
  const gymItems = gym.isRest ? 0 : (gym.hasCardio ? 2 : 1)
  const gymDone = gym.isRest ? 0 : (gym.hasCardio ? (cardioDone ? 1 : 0) : 0)

  const totalDone = todoDone + habitsDone + mealsDone + morningDone + nightDone + gymDone
  const totalItems = todoTotal + dayHabits.length + mealsTotal + morningChecks.length + nightChecks.length + gymItems
  const overallPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0
  const dayComplete = totalItems > 0 && totalDone === totalItems

  const winterLog = winterArc.isActive ? winterArc.dayLogs.find(l => l.date === date) : null

  const dateLabel = isToday
    ? `HOY · ${format(dayDate, "d 'DE' MMM", { locale: es }).toUpperCase()}`
    : format(dayDate, "EEEE · d 'DE' MMM", { locale: es }).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Day header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] tracking-[0.4em] text-[#EF4444] font-black">{dateLabel}</p>
          <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">
            {isToday ? 'TU DÍA' : isFuture ? 'PRÓXIMO DÍA' : 'ESTE DÍA'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {totalItems > 0 && (
            <motion.div animate={dayComplete ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.4 }}
              className={cn('text-right px-4 py-2 rounded-xl border',
                dayComplete ? 'border-white/20 bg-white/5' : 'border-white/8 bg-white/[0.03]')}>
              <p className="text-xl font-black text-white">
                {totalDone}<span className="text-sm font-normal text-gray-600">/{totalItems}</span>
              </p>
              <p className="text-[9px] font-black tracking-widest text-gray-500">
                {dayComplete ? 'DAY COMPLETE ✓' : `${overallPct}% DONE`}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="h-0.5 bg-white/6 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-[#EF4444]"
            initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.6 }} />
        </div>
      )}

      {/* Winter Arc */}
      {winterLog && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] rounded-xl border border-white/6">
          <span className="text-[9px] tracking-[0.4em] text-[#EF4444] font-black">❄ WINTER ARC</span>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-sm font-black text-white">{winterLog.score}%</span>
          <span className="text-xs text-gray-600">score del día</span>
          {winterLog.score >= (winterArc.config?.coldDayThreshold ?? 80) && (
            <span className="ml-auto text-xs text-white font-bold">COLD DAY ❄</span>
          )}
        </div>
      )}

      {/* TO-DO */}
      <div>
        <SectionLabel count={`${todoDone}/${todoTotal}`}>TO-DO</SectionLabel>
        <div className="space-y-0 relative">
          <AnimatePresence initial={false}>
            {todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
          </AnimatePresence>
          {todos.length === 0 && !addOpen && (
            <p className="text-sm text-gray-700 py-2">Sin tareas para este día</p>
          )}
        </div>
        <AnimatePresence>
          {addOpen && (
            <motion.div key="add" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-3 py-2 border-t border-white/5 mt-1">
              <div className="w-5 h-5 rounded border-2 border-white/20 shrink-0" />
              <input ref={inputRef} autoFocus value={addText} onChange={e => setAddText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTodo()
                  if (e.key === 'Escape') { setAddOpen(false); setAddText('') }
                }}
                placeholder="Escribe y presiona Enter..."
                className="flex-1 bg-transparent text-[15px] text-gray-200 placeholder:text-gray-600 focus:outline-none" />
              <button onClick={() => { setAddOpen(false); setAddText('') }} className="text-gray-600 hover:text-gray-400">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => { setAddOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="flex items-center gap-2 pt-2 text-sm text-gray-600 hover:text-gray-400 transition-colors group">
          <Plus size={14} className="group-hover:text-[#EF4444] transition-colors" /> NUEVA TAREA
        </button>
      </div>

      {/* HABITS */}
      {dayHabits.length > 0 && (
        <div>
          <SectionLabel count={`${habitsDone}/${dayHabits.length}`}>HABITS</SectionLabel>
          <div className="space-y-0">
            {dayHabits.map(h => (
              <div key={h.id} className="flex items-center gap-3 py-2 group">
                <Checkbox
                  done={h.done}
                  onToggle={() => {
                    const log = getLogForDate(h.id, date)
                    const newVal = log?.completed ? 0 : h.target
                    logHabit(h.id, newVal, date)
                    if (newVal >= h.target) addXP(10, `Hábito: ${h.name}`)
                  }}
                />
                <span className="text-base shrink-0">{h.icon}</span>
                <p className={cn('flex-1 text-[15px]', h.done ? 'text-gray-600 line-through' : 'text-gray-200')}>
                  {h.name}
                </p>
                {h.streak > 0 && (
                  <span className="text-[10px] text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    🔥 {h.streak}d
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Morning routine */}
      <ChecklistSection date={date} type="morning" />

      {/* Meals */}
      <MealsSection date={date} />

      {/* Gym */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] tracking-[0.4em] text-gray-600 font-black">ENTRENO</p>
          <button onClick={() => setShowGymConfig(v => !v)}
            className="text-gray-600 hover:text-gray-400 transition-colors">
            <Settings size={13} />
          </button>
        </div>
        <AnimatePresence>
          {showGymConfig && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
              <GymConfigPanel onClose={() => setShowGymConfig(false)} />
            </motion.div>
          )}
        </AnimatePresence>
        <GymSection date={date} />
      </div>

      {/* Night routine */}
      <ChecklistSection date={date} type="night" />

      {/* Commitments */}
      <CommitmentsSection date={date} />

      {/* Quick expense */}
      <div className="border-t border-white/5 pt-4">
        <QuickExpense date={date} />
      </div>

      {/* Notes */}
      <div>
        <SectionLabel>NOTAS DEL DÍA</SectionLabel>
        <p className="text-[11px] text-gray-700 mb-2">Ideas, pendientes, recordatorios o cualquier cosa que quieras sacar de tu cabeza.</p>
        <textarea value={noteText} onChange={e => handleNoteChange(e.target.value)}
          placeholder="Escribe aquí..."
          className="w-full bg-transparent text-sm text-gray-300 placeholder:text-gray-700 focus:outline-none resize-none leading-relaxed min-h-[80px] border-b border-white/8 pb-2" />
        {noteText && <p className="text-[9px] text-gray-700 mt-1">Guardado automáticamente</p>}
      </div>
    </div>
  )
}

// ─── Inbox ─────────────────────────────────────────────────────────────────────

function InboxSection({ selectedDate }: { selectedDate: string }) {
  const { inbox, addInboxItem, assignInboxToDate, deleteInboxItem } = useDailyCommandStore()
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)

  const handleAdd = () => {
    addInboxItem(text)
    setText('')
  }

  if (inbox.length === 0 && !open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-gray-700 hover:text-gray-500 transition-colors font-black py-2">
        <Inbox size={12} /> INBOX
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[9px] tracking-[0.4em] text-gray-600 font-black">INBOX</p>
        <span className="text-[10px] text-gray-600">{inbox.length} pendientes</span>
      </div>
      <p className="text-[11px] text-gray-700">Captura rápida sin decidir el día. Asígnalos cuando quieras.</p>
      <div className="space-y-0">
        {inbox.map(item => (
          <div key={item.id} className="flex items-center gap-3 py-2 group">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
            <p className="flex-1 text-sm text-gray-400">{item.text}</p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => assignInboxToDate(item.id, selectedDate)}
                className="text-[10px] text-[#EF4444] hover:text-red-400 font-bold px-2 py-0.5 rounded hover:bg-[#EF4444]/8 transition-all">
                → {selectedDate === todayStr() ? 'HOY' : 'ESTE DÍA'}
              </button>
              <button onClick={() => deleteInboxItem(item.id)} className="text-gray-700 hover:text-red-400 p-1">
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-white/5 pt-2">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Captura rápida..."
          className="flex-1 bg-transparent text-sm text-gray-400 placeholder:text-gray-700 focus:outline-none" />
        {text && (
          <button onClick={handleAdd} className="text-[#EF4444] text-xs font-black">GUARDAR</button>
        )}
      </div>
    </div>
  )
}

// ─── Upcoming Commitments Banner ───────────────────────────────────────────────

function UpcomingBanner({ currentDate }: { currentDate: string }) {
  const { getUpcomingCommitments } = usePlannerStore()
  const upcoming = getUpcomingCommitments(currentDate, 14).slice(0, 3)

  if (upcoming.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-[9px] tracking-[0.4em] text-gray-600 font-black">PRÓXIMOS COMPROMISOS</p>
      {upcoming.map(c => {
        const daysUntil = differenceInCalendarDays(new Date(c.date + 'T12:00:00'), new Date(currentDate + 'T12:00:00'))
        return (
          <div key={c.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
            <div className="text-right shrink-0 w-12">
              <p className="text-[10px] font-black text-gray-400">{daysUntil === 0 ? 'HOY' : daysUntil === 1 ? 'MAÑANA' : `${daysUntil}d`}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 truncate">{c.title}</p>
              <p className="text-[10px] text-gray-600">
                {format(new Date(c.date + 'T12:00:00'), "d 'de' MMM", { locale: es })}
                {c.time && ` · ${c.time}`}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RoutinePage() {
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    const d = new Date(date + 'T12:00:00')
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="border-b border-white/6 pb-6">
        <MonthGrid
          month={currentMonth}
          selectedDate={selectedDate}
          onSelect={handleSelectDate}
          onPrevMonth={() => setCurrentMonth(m => subMonths(m, 1))}
          onNextMonth={() => setCurrentMonth(m => addMonths(m, 1))}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selectedDate}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}>
          <DayView date={selectedDate} />
        </motion.div>
      </AnimatePresence>

      <div className="border-t border-white/6 pt-6 space-y-6">
        <UpcomingBanner currentDate={selectedDate} />
        <InboxSection selectedDate={selectedDate} />
      </div>
    </div>
  )
}
