'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Check, Trash2, X, ChevronLeft, ChevronRight, Inbox, AlertTriangle, ArrowDownRight, Minus } from 'lucide-react'
import { useDailyCommandStore, type TodoPriority } from '@/stores/dailyCommand.store'
import { useHabitsStore } from '@/stores/habits.store'
import { useAppStore } from '@/stores/app.store'
import { useWinterArcStore } from '@/stores/winterArc.store'
import { cn } from '@/lib/utils/cn'

const todayStr = () => new Date().toISOString().slice(0, 10)
const dateStr = (d: Date) => d.toISOString().slice(0, 10)

const PRIORITY_META: Record<TodoPriority, { icon: React.ReactNode; color: string; label: string }> = {
  high:   { icon: <AlertTriangle size={10}/>, color: '#EF4444', label: 'Alta' },
  normal: { icon: <Minus size={10}/>,        color: '#9CA3AF', label: 'Normal' },
  low:    { icon: <ArrowDownRight size={10}/>, color: '#4B5563', label: 'Baja' },
}

// ─── Month Circle Grid ─────────────────────────────────────────────────────────
function MonthGrid({
  month,
  selectedDate,
  onSelect,
  onPrevMonth,
  onNextMonth,
}: {
  month: Date
  selectedDate: string
  onSelect: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}) {
  const { getDayCompletion, getDayTodos } = useDailyCommandStore()
  const { habits, getTodayLogs, getStreakDates } = useHabitsStore()
  const winterArc = useWinterArcStore()
  const today = todayStr()

  const daysInMonth = getDaysInMonth(month)
  const monthStart = format(month, 'yyyy-MM')
  const isCurrentMonth = month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear()

  const getDayState = (dayNum: number) => {
    const ds = `${monthStart}-${String(dayNum).padStart(2, '0')}`
    const isToday = ds === today
    const isFuture = ds > today
    const isPast = ds < today
    const isSelected = ds === selectedDate

    // Winter Arc gives a score if active
    const winterLog = winterArc.isActive ? winterArc.dayLogs.find(l => l.date === ds) : null
    const winterScore = winterLog?.score ?? 0

    const { done, total, pct } = getDayCompletion(ds)

    let state: 'today' | 'completed' | 'partial' | 'pending' | 'future' | 'failed'
    if (isToday) state = 'today'
    else if (isFuture) state = 'future'
    else if (winterArc.isActive && winterLog) {
      state = winterScore >= (winterArc.config?.coldDayThreshold ?? 80) ? 'completed' : winterScore >= 40 ? 'partial' : 'pending'
    } else if (total > 0) {
      state = pct === 100 ? 'completed' : pct >= 50 ? 'partial' : 'pending'
    } else {
      state = isPast ? 'pending' : 'future'
    }

    return { ds, isToday, isFuture, isPast, isSelected, state }
  }

  const stateClass = (state: string, isSelected: boolean) => {
    const base = 'w-7 h-7 rounded-full border-2 text-[11px] font-black flex items-center justify-center transition-all cursor-pointer shrink-0'
    const sel = isSelected ? 'ring-2 ring-white/30 ring-offset-1 ring-offset-[#0A0A0A] scale-110' : ''
    if (state === 'today') return cn(base, sel, 'bg-[#EF4444] border-[#EF4444] text-white')
    if (state === 'completed') return cn(base, sel, 'bg-white border-white text-black')
    if (state === 'partial') return cn(base, sel, 'bg-amber-500/60 border-amber-500 text-white')
    if (state === 'failed') return cn(base, sel, 'border-red-500/40 bg-red-500/10 text-red-400')
    if (state === 'future') return cn(base, 'border-white/10 text-gray-700 cursor-default')
    return cn(base, sel, 'border-white/15 text-gray-500 hover:border-white/25')
  }

  return (
    <div className="space-y-3">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] tracking-[0.4em] text-[#EF4444] font-black uppercase mb-0.5">ROUTINES</p>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">
            {format(month, 'MMMM yyyy', { locale: es }).toUpperCase()}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-gray-600 tracking-widest hidden sm:block">YOU ARE HERE →</p>
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

      {/* Circle grid */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1
          const { ds, state, isFuture, isSelected } = getDayState(dayNum)
          return (
            <button
              key={dayNum}
              onClick={() => !isFuture && onSelect(ds)}
              className={stateClass(state, isSelected)}
              title={ds}
            >
              {dayNum}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-gray-600">
        {[
          { cl: 'bg-white border-white', label: 'completado' },
          { cl: 'bg-[#EF4444] border-[#EF4444]', label: 'hoy' },
          { cl: 'bg-amber-500/60 border-amber-500', label: 'parcial' },
          { cl: 'border-white/15', label: 'pendiente' },
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

// ─── Todo Item ─────────────────────────────────────────────────────────────────
function TodoItem({ todo }: { todo: ReturnType<typeof useDailyCommandStore.getState>['todos'][0] }) {
  const { toggleTodo, deleteTodo, updateTodoPriority } = useDailyCommandStore()
  const [showPriority, setShowPriority] = useState(false)
  const p = PRIORITY_META[todo.priority]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      className="flex items-center gap-3 py-2 group"
    >
      <button
        onClick={() => toggleTodo(todo.id)}
        className={cn(
          'shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
          todo.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-white/40 bg-transparent'
        )}
      >
        {todo.completed && <Check size={11} className="text-white" strokeWidth={3} />}
      </button>

      <p className={cn('flex-1 text-[15px] leading-snug min-w-0 truncate', todo.completed ? 'text-gray-600 line-through' : 'text-gray-200')}>
        {todo.text}
      </p>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => setShowPriority(v => !v)}
          className="p-1 rounded hover:bg-white/8 transition-colors"
          style={{ color: p.color }}>
          {p.icon}
        </button>

        <button onClick={() => deleteTodo(todo.id)} className="p-1 rounded text-gray-700 hover:text-red-400 hover:bg-red-400/8 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>

      <AnimatePresence>
        {showPriority && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 mt-8 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
            {(['high', 'normal', 'low'] as TodoPriority[]).map(p => (
              <button key={p} onClick={() => { updateTodoPriority(todo.id, p); setShowPriority(false) }}
                className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 w-full text-left"
                style={{ color: PRIORITY_META[p].color }}>
                {PRIORITY_META[p].icon} {PRIORITY_META[p].label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Day View ──────────────────────────────────────────────────────────────────
function DayView({ date }: { date: string }) {
  const { getDayTodos, getDayCompletion, addTodo, getNoteText, saveNote } = useDailyCommandStore()
  const { habits, getTodayLogs, getStreakDates, logHabit } = useHabitsStore()
  const { addXP } = useAppStore()
  const winterArc = useWinterArcStore()

  const today = todayStr()
  const isToday = date === today
  const isPast = date < today
  const dayDate = new Date(date + 'T12:00:00')

  const [addText, setAddText] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [noteText, setNoteText] = useState(() => getNoteText(date))
  const noteTimer = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const todos = getDayTodos(date)
  const { done: todoDone, total: todoTotal, pct: todoPct } = getDayCompletion(date)

  const todayLogs = getTodayLogs()
  const dayHabits = habits.map(h => ({
    ...h,
    done: isToday ? (todayLogs[h.id]?.completed ?? false) : getStreakDates(h.id).includes(date),
  }))
  const habitsDone = dayHabits.filter(h => h.done).length
  const habitsTotal = dayHabits.length

  const totalDone = todoDone + habitsDone
  const totalItems = todoTotal + habitsTotal
  const overallPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0
  const dayComplete = totalItems > 0 && totalDone === totalItems

  const winterLog = winterArc.isActive ? winterArc.dayLogs.find(l => l.date === date) : null

  useEffect(() => {
    setNoteText(getNoteText(date))
  }, [date])

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

  const dateLabel = isToday
    ? `HOY · ${format(dayDate, "d 'de' MMM", { locale: es }).toUpperCase()}`
    : isPast
    ? format(dayDate, "EEEE · d 'de' MMM", { locale: es }).toUpperCase()
    : format(dayDate, "EEEE · d 'de' MMM", { locale: es }).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Day header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] tracking-[0.4em] text-[#EF4444] font-black">{dateLabel}</p>
          <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">
            {isToday ? 'TU DÍA' : isPast ? 'ESTE DÍA' : 'PRÓXIMO DÍA'}
          </h2>
        </div>

        {/* Progress badge */}
        {totalItems > 0 && (
          <motion.div
            animate={dayComplete ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.4 }}
            className={cn(
              'text-right px-4 py-2 rounded-xl border',
              dayComplete ? 'border-emerald-400/30 bg-emerald-400/8' : 'border-white/8 bg-white/[0.03]'
            )}
          >
            <p className={cn('text-xl font-black', dayComplete ? 'text-emerald-400' : 'text-white')}>
              {totalDone}<span className="text-sm font-normal text-gray-600">/{totalItems}</span>
            </p>
            <p className={cn('text-[9px] font-black tracking-widest', dayComplete ? 'text-emerald-400' : 'text-gray-500')}>
              {dayComplete ? 'DAY COMPLETE ✓' : `${overallPct}% DONE`}
            </p>
          </motion.div>
        )}
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="h-0.5 bg-white/6 rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', dayComplete ? 'bg-emerald-400' : 'bg-[#EF4444]')}
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      )}

      {/* Winter Arc score if active */}
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
        <p className="text-[9px] tracking-[0.4em] text-gray-600 font-black mb-3">TO-DO</p>

        <div className="space-y-0 relative">
          <AnimatePresence initial={false}>
            {todos.map(todo => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </AnimatePresence>

          {todos.length === 0 && !addOpen && (
            <p className="text-sm text-gray-700 py-2">Sin tareas para este día</p>
          )}
        </div>

        {/* Quick add */}
        <AnimatePresence>
          {addOpen && (
            <motion.div key="add" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-3 py-2 border-t border-white/5 mt-1">
              <div className="w-5 h-5 rounded border-2 border-white/20 shrink-0" />
              <input
                ref={inputRef}
                autoFocus
                value={addText}
                onChange={e => setAddText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTodo()
                  if (e.key === 'Escape') { setAddOpen(false); setAddText('') }
                }}
                placeholder="Escribe y presiona Enter..."
                className="flex-1 bg-transparent text-[15px] text-gray-200 placeholder:text-gray-600 focus:outline-none"
              />
              <button onClick={() => { setAddOpen(false); setAddText('') }} className="text-gray-600 hover:text-gray-400">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => { setAddOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="flex items-center gap-2 pt-2 text-sm text-gray-600 hover:text-gray-400 transition-colors group"
        >
          <Plus size={14} className="group-hover:text-[#EF4444] transition-colors" />
          NUEVA TAREA
        </button>
      </div>

      {/* HABITS */}
      {habitsTotal > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] tracking-[0.4em] text-gray-600 font-black">HABITS</p>
            <span className="text-[10px] text-gray-600">{habitsDone}/{habitsTotal}</span>
          </div>
          <div className="space-y-0">
            {dayHabits.map(h => (
              <div key={h.id} className="flex items-center gap-3 py-2 group">
                <button
                  onClick={() => {
                    if (!isToday) return
                    const logs = getTodayLogs()
                    const newVal = logs[h.id]?.completed ? 0 : h.target
                    logHabit(h.id, newVal)
                    if (newVal >= h.target) addXP(10, `Hábito: ${h.name}`)
                  }}
                  disabled={!isToday}
                  className={cn(
                    'shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                    h.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20',
                    !isToday && 'cursor-default'
                  )}
                >
                  {h.done && <Check size={11} className="text-white" strokeWidth={3} />}
                </button>
                <span className="text-base shrink-0">{h.icon}</span>
                <p className={cn('flex-1 text-[15px]', h.done ? 'text-gray-600 line-through' : 'text-gray-200')}>
                  {h.name}
                </p>
                {h.streak > 0 && (
                  <span className="text-[10px] text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">🔥 {h.streak}d</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTES */}
      <div>
        <p className="text-[9px] tracking-[0.4em] text-gray-600 font-black mb-3">NOTAS DEL DÍA</p>
        <p className="text-[11px] text-gray-700 mb-2">Ideas, pendientes, recordatorios o cualquier cosa que quieras sacar de tu cabeza.</p>
        <textarea
          value={noteText}
          onChange={e => handleNoteChange(e.target.value)}
          placeholder="Escribe aquí..."
          className="w-full bg-transparent text-sm text-gray-300 placeholder:text-gray-700 focus:outline-none resize-none leading-relaxed min-h-[80px] border-b border-white/8 pb-2"
        />
        {noteText && (
          <p className="text-[9px] text-gray-700 mt-1">Guardado automáticamente</p>
        )}
      </div>
    </div>
  )
}

// ─── Inbox Section ─────────────────────────────────────────────────────────────
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
                → HOY
              </button>
              <button onClick={() => deleteInboxItem(item.id)} className="text-gray-700 hover:text-red-400 p-1">
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add to inbox */}
      <div className="flex items-center gap-2 border-t border-white/5 pt-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Captura rápida..."
          className="flex-1 bg-transparent text-sm text-gray-400 placeholder:text-gray-700 focus:outline-none"
        />
        {text && (
          <button onClick={handleAdd} className="text-[#EF4444] text-xs font-black">
            GUARDAR
          </button>
        )}
      </div>
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
      {/* Month grid */}
      <div className="border-b border-white/6 pb-6">
        <MonthGrid
          month={currentMonth}
          selectedDate={selectedDate}
          onSelect={handleSelectDate}
          onPrevMonth={() => setCurrentMonth(m => subMonths(m, 1))}
          onNextMonth={() => setCurrentMonth(m => addMonths(m, 1))}
        />
      </div>

      {/* Day view */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <DayView date={selectedDate} />
        </motion.div>
      </AnimatePresence>

      {/* Inbox */}
      <div className="border-t border-white/6 pt-6">
        <InboxSection selectedDate={selectedDate} />
      </div>
    </div>
  )
}
