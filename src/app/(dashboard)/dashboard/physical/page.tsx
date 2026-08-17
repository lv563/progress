'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format, addDays, startOfWeek, isBefore, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Dumbbell, Droplets, Plus, Scale, Check, Flame, TrendingUp, Settings2,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { usePhysicalStore } from '@/stores/physical.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import type { WorkoutType } from '@/types'

// ── Weekly routine ────────────────────────────────────────────────
interface DayRoutine {
  day: number
  name: string
  emoji: string
  color: string
  type: WorkoutType
  muscles: string[]
  cardio: string | null
  notes: string | null
  isRest: boolean
}

const ROUTINE: DayRoutine[] = [
  {
    day: 0, name: 'Descanso', emoji: '😴', color: '#94A3B8', type: 'custom',
    muscles: [], cardio: null, notes: 'Recuperación · el cuerpo crece en reposo', isRest: true,
  },
  {
    day: 1, name: 'Piernas A', emoji: '🦵', color: '#10B981', type: 'legs',
    muscles: ['Femoral (isquiotibiales)', 'Pantorrilla', 'Glúteos', 'Abdominales'],
    cardio: null, notes: null, isRest: false,
  },
  {
    day: 2, name: 'Pecho + Bíceps', emoji: '💪', color: '#7C3AED', type: 'push',
    muscles: ['Pecho inclinado', 'Pecho plano', 'Bíceps'],
    cardio: 'Cardio al finalizar', notes: 'Combinar press inclinado y plano en la misma sesión', isRest: false,
  },
  {
    day: 3, name: 'Espalda + Tríceps', emoji: '🔙', color: '#06B6D4', type: 'pull',
    muscles: ['Espalda completa (todos los músculos)', 'Tríceps'],
    cardio: 'Caminadora inclinada · velocidad 3.0', notes: null, isRest: false,
  },
  {
    day: 4, name: 'Piernas B + Cardio', emoji: '🦿', color: '#F59E0B', type: 'lower',
    muscles: ['Abductores', 'Cuádriceps', 'Pantorrillas'],
    cardio: 'Escalera 15 min + Bicicleta ó Escalera 15 min (2 máquinas)', notes: null, isRest: false,
  },
  {
    day: 5, name: 'Hombros + Trapecio', emoji: '🏋️', color: '#EC4899', type: 'upper',
    muscles: ['Hombro delantero', 'Hombro medio', 'Hombro posterior', 'Trapecio'],
    cardio: null, notes: '3 ejercicios por zona · Sets de 8–10 repeticiones', isRest: false,
  },
  {
    day: 6, name: 'Pecho + Antebrazo', emoji: '⚡', color: '#F97316', type: 'push',
    muscles: ['Pecho inclinado', 'Antebrazo', 'Hombros (4 ejercicios)'],
    cardio: 'Escalera 10 min · Bicicleta 10 min · Elíptica 10 min', notes: null, isRest: false,
  },
]

const DAY_LABELS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const PROGRAM_WEEKS = 17
type Tab = 'hoy' | 'rutina' | 'programa' | 'progreso'

export default function PhysicalPage() {
  const {
    workoutSessions, measurements,
    waterLogs, mealCountLogs, mealGoal, waterConfig,
    setWater, setMeals, setMealGoal, updateWaterConfig,
    addWorkout, addMeasurement,
    programStartDate, setProgramStartDate,
    getTodayWorkout, getWeekSessions, getLatestMeasurement, getGymStreak,
  } = usePhysicalStore()
  const { addXP } = useAppStore()

  const [tab, setTab]               = useState<Tab>('hoy')
  const [weightModal, setWeightModal]   = useState(false)
  const [newWeight, setNewWeight]       = useState('')
  const [waterConfigModal, setWaterConfigModal] = useState(false)
  const [wcGoal, setWcGoal] = useState('')
  const [wcMl, setWcMl]     = useState('')
  const [mealGoalEdit, setMealGoalEdit] = useState(false)
  const [mealGoalVal, setMealGoalVal]   = useState('')

  const today        = format(new Date(), 'yyyy-MM-dd')
  const dayOfWeek    = new Date().getDay()
  const todayRoutine = ROUTINE[dayOfWeek]
  const todayWorkout = getTodayWorkout()
  const weekSessions = getWeekSessions()
  const latestMeas   = getLatestMeasurement()
  const gymStreak    = getGymStreak()

  const waterToday    = waterLogs[today] ?? 0
  const mealsToday    = mealCountLogs[today] ?? 0
  const numContainers = Math.max(1, Math.ceil(waterConfig.goalLiters / (waterConfig.containerMl / 1000)))
  const litersToday   = Math.round(waterToday * waterConfig.containerMl) / 1000
  const waterPct      = Math.min(100, waterConfig.goalLiters > 0 ? (litersToday / waterConfig.goalLiters) * 100 : 0)

  // Program calendar — snapped to Monday
  const programStart = useMemo(() => {
    const base = programStartDate ? parseISO(programStartDate) : new Date()
    return startOfWeek(base, { weekStartsOn: 1 })
  }, [programStartDate])

  const programWeeks = useMemo(() =>
    Array.from({ length: PROGRAM_WEEKS }, (_, wi) => ({
      weekNum: wi + 1,
      days: Array.from({ length: 7 }, (_, di) => {
        const date = addDays(programStart, wi * 7 + di)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dow = date.getDay()
        const routine = ROUTINE[dow]
        const isToday = dateStr === today
        const isPast = isBefore(date, new Date()) && !isToday
        const isLogged = workoutSessions.some(s => s.date === dateStr && s.completed)
        return { date, dateStr, isToday, isPast, isLogged, routine }
      }),
    }))
  , [programStart, today, workoutSessions])

  const completedDaysCount = useMemo(() =>
    programWeeks.flatMap(w => w.days).filter(d => !d.routine.isRest && d.isPast && d.isLogged).length
  , [programWeeks])

  const totalTrainingDays = useMemo(() =>
    programWeeks.flatMap(w => w.days).filter(d => !d.routine.isRest).length
  , [programWeeks])

  const currentWeekNum = useMemo(() =>
    (programWeeks.findIndex(w => w.days.some(d => d.isToday)) + 1) || 1
  , [programWeeks])

  const handleCompleteToday = () => {
    if (todayWorkout || todayRoutine.isRest) return
    if (!programStartDate) setProgramStartDate(today)
    addWorkout({
      date: today,
      type: todayRoutine.type,
      name: todayRoutine.name,
      exercises: [],
      duration: 0,
      volume: 0,
      notes: undefined,
      mood: 3,
      completed: true,
    })
    addXP(30, `Entrenamiento: ${todayRoutine.name}`)
  }

  const handleLogWeight = () => {
    const w = Number(newWeight)
    if (!w || w <= 0) return
    addMeasurement({ date: today, weight: w })
    setWeightModal(false)
    setNewWeight('')
  }

  const weightChartData = measurements
    .filter(m => m.weight)
    .slice(0, 30)
    .reverse()
    .map(m => ({ date: format(new Date(m.date), 'd/MM'), weight: m.weight }))

  // Mon → Sun order for routine tab
  const routineOrdered = [...ROUTINE.slice(1), ROUTINE[0]]

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Dumbbell size={24} className="text-emerald-600" /> Físico
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {weekSessions.length} entrenos esta semana
            {latestMeas?.weight ? ` · ${latestMeas.weight} kg` : ''}
            {gymStreak > 0 && (
              <span className="text-orange-500 font-semibold"> · 🔥 {gymStreak}d racha</span>
            )}
          </p>
        </div>
        {gymStreak >= 3 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs font-bold text-orange-600">{gymStreak} días</span>
          </div>
        )}
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 w-fit">
        {([['hoy', 'Hoy'], ['rutina', 'Rutina'], ['programa', 'Programa'], ['progreso', 'Progreso']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
              tab === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══════════ HOY ══════════ */}
        {tab === 'hoy' && (
          <motion.div key="hoy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Today's workout card */}
            <div
              className="rounded-2xl border p-5"
              style={{ background: `${todayRoutine.color}0D`, borderColor: `${todayRoutine.color}30` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: `${todayRoutine.color}20` }}
                >
                  {todayRoutine.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: todayRoutine.color }}>
                      {DAY_LABELS_SHORT[dayOfWeek]}
                    </span>
                    {todayWorkout && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Check size={10} /> Completado
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-gray-900">{todayRoutine.name}</h2>

                  {!todayRoutine.isRest ? (
                    <>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {todayRoutine.muscles.map(m => (
                          <span
                            key={m}
                            className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                            style={{ background: `${todayRoutine.color}18`, color: todayRoutine.color }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                      {todayRoutine.cardio && (
                        <div className="mt-2.5 flex items-start gap-1.5">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-px shrink-0">Cardio:</span>
                          <span className="text-[11px] text-gray-600">{todayRoutine.cardio}</span>
                        </div>
                      )}
                      {todayRoutine.notes && (
                        <p className="mt-1.5 text-xs text-gray-400 italic">{todayRoutine.notes}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Descansa. El cuerpo crece en reposo.</p>
                  )}
                </div>
              </div>

              {!todayRoutine.isRest && (
                <motion.button
                  onClick={handleCompleteToday}
                  whileHover={!todayWorkout ? { scale: 1.01 } : undefined}
                  whileTap={!todayWorkout ? { scale: 0.98 } : undefined}
                  disabled={!!todayWorkout}
                  className={cn(
                    'mt-4 w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                    todayWorkout
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 cursor-default'
                      : 'text-white shadow-lg'
                  )}
                  style={!todayWorkout ? {
                    background: `linear-gradient(135deg, ${todayRoutine.color} 0%, ${todayRoutine.color}CC 100%)`,
                    boxShadow: `0 4px 20px ${todayRoutine.color}40`,
                  } : undefined}
                >
                  <Check size={15} />
                  {todayWorkout ? '¡Sesión registrada! · +30 XP' : 'Marcar como completado · +30 XP'}
                </motion.button>
              )}
            </div>

            {/* Water */}
            <div className="p-4 rounded-2xl border border-cyan-200 bg-cyan-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplets size={16} className="text-cyan-600" />
                  <span className="text-sm font-semibold text-gray-900">Agua</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-700 tabular-nums">
                    {litersToday.toFixed(1)}L / {waterConfig.goalLiters}L
                  </span>
                  <button
                    onClick={() => { setWcGoal(String(waterConfig.goalLiters)); setWcMl(String(waterConfig.containerMl)); setWaterConfigModal(true) }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  >
                    <Settings2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mb-3 flex-wrap">
                {Array.from({ length: numContainers }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setWater(i < waterToday ? i : i + 1)}
                    className={cn(
                      'flex-1 min-w-[32px] h-11 rounded-xl transition-all flex items-center justify-center',
                      i < waterToday ? 'bg-cyan-300 hover:bg-cyan-200' : 'bg-white hover:bg-cyan-50 border border-gray-100'
                    )}
                  >
                    <Droplets size={14} className={i < waterToday ? 'text-cyan-700' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
              <div className="h-1.5 rounded-full bg-cyan-100 overflow-hidden">
                <motion.div className="h-full rounded-full bg-cyan-500"
                  initial={{ width: 0 }} animate={{ width: `${waterPct}%` }} transition={{ duration: 0.5 }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">{waterConfig.containerMl}ml por pote</p>
            </div>

            {/* Meals + Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">🍽️ Comidas</span>
                  {mealGoalEdit ? (
                    <input
                      autoFocus type="number" min={1} max={10} value={mealGoalVal}
                      onChange={e => setMealGoalVal(e.target.value)}
                      onBlur={() => { const n = Number(mealGoalVal); if (n >= 1) setMealGoal(n); setMealGoalEdit(false) }}
                      onKeyDown={e => { if (e.key === 'Enter') { const n = Number(mealGoalVal); if (n >= 1) setMealGoal(n); setMealGoalEdit(false) } }}
                      className="w-10 bg-transparent text-xs font-bold text-orange-600 focus:outline-none text-right"
                    />
                  ) : (
                    <button onClick={() => { setMealGoalVal(String(mealGoal)); setMealGoalEdit(true) }}
                      className="text-xs font-bold text-orange-600">{mealsToday}/{mealGoal}
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: mealGoal }, (_, i) => (
                    <button key={i} onClick={() => setMeals(i < mealsToday ? i : i + 1)}
                      className={cn(
                        'flex-1 h-8 rounded-lg transition-all',
                        i < mealsToday ? 'bg-orange-300' : 'bg-white border border-gray-100'
                      )} />
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">⚖️ Peso</span>
                  <button onClick={() => setWeightModal(true)}
                    className="text-xs text-amber-700 px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 transition-all flex items-center gap-1">
                    <Plus size={10} /> Reg.
                  </button>
                </div>
                {latestMeas?.weight ? (
                  <p className="text-2xl font-black text-amber-600 tabular-nums">
                    {latestMeas.weight}
                    <span className="text-sm font-normal text-gray-400"> kg</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-2">Sin registros aún</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════ RUTINA ══════════ */}
        {tab === 'rutina' && (
          <motion.div key="rutina" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
              Rutina semanal · Programa 4 meses
            </p>

            {routineOrdered.map(r => (
              <div
                key={r.day}
                className="rounded-2xl border p-4 transition-all"
                style={{
                  background: r.isRest ? '#F8FAFC' : `${r.color}0A`,
                  borderColor: r.day === dayOfWeek ? r.color : r.isRest ? '#E2E8F0' : `${r.color}25`,
                  borderWidth: r.day === dayOfWeek ? 2 : 1,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: r.isRest ? '#E2E8F0' : `${r.color}18` }}
                  >
                    {r.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {DAY_LABELS_SHORT[r.day]}
                      </span>
                      <span className="text-sm font-black text-gray-900">{r.name}</span>
                      {r.day === dayOfWeek && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                          style={{ background: r.color }}
                        >
                          HOY
                        </span>
                      )}
                    </div>

                    {!r.isRest ? (
                      <>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {r.muscles.map(m => (
                            <span
                              key={m}
                              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: `${r.color}15`, color: r.color }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                        {r.cardio && (
                          <p className="mt-1.5 text-[11px] text-gray-500">
                            <span className="font-semibold">Cardio:</span> {r.cardio}
                          </p>
                        )}
                        {r.notes && (
                          <p className="mt-1 text-[11px] text-gray-400 italic">{r.notes}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">{r.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ══════════ PROGRAMA ══════════ */}
        {tab === 'programa' && (
          <motion.div key="programa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Header */}
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Programa 4 Meses</p>
                  <p className="text-3xl font-black text-gray-900 mt-1 tabular-nums">
                    Semana {currentWeekNum}
                    <span className="text-lg font-medium text-gray-400"> / {PROGRAM_WEEKS}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-600 tabular-nums">{completedDaysCount}</p>
                  <p className="text-xs text-gray-500">días completados</p>
                </div>
              </div>
              <div className="h-3 rounded-full bg-emerald-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedDaysCount / Math.max(1, totalTrainingDays)) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {completedDaysCount} / {totalTrainingDays} días de entreno
                {' · '}
                {format(programStart, "d 'de' MMM yyyy", { locale: es })}
                {' → '}
                {format(addDays(programStart, PROGRAM_WEEKS * 7 - 1), "d 'de' MMM yyyy", { locale: es })}
              </p>
            </div>

            {/* Calendar grid */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              {/* Column headers */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div />
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                  <div key={d} className="text-[10px] text-gray-400 font-medium text-center">{d}</div>
                ))}
              </div>

              <div className="space-y-1">
                {programWeeks.map(week => {
                  const monthLabel = week.days[0]
                    ? format(week.days[0].date, 'MMM', { locale: es })
                    : ''
                  const isFirstOfMonth = week.weekNum === 1 || (
                    week.days[0] && week.weekNum > 1 &&
                    format(week.days[0].date, 'M') !== format(addDays(week.days[0].date, -7), 'M')
                  )

                  return (
                    <div key={week.weekNum}>
                      {isFirstOfMonth && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2 mb-1 ml-7 capitalize">
                          {monthLabel}
                        </p>
                      )}
                      <div className="grid grid-cols-8 gap-1">
                        <div className="text-[10px] text-gray-200 flex items-center font-mono justify-end pr-1">
                          {week.weekNum}
                        </div>
                        {week.days.map(d => {
                          const r = d.routine
                          let cellBg = ''
                          let cellBorder = ''
                          let icon: React.ReactNode = null

                          if (d.isToday) {
                            cellBg = r.isRest ? '#94A3B8' : r.color
                            cellBorder = 'transparent'
                            icon = <div className="w-2 h-2 rounded-full bg-white opacity-90" />
                          } else if (r.isRest) {
                            cellBg = '#F1F5F9'
                            cellBorder = '#E2E8F0'
                            icon = <div className="w-1 h-1 rounded-full bg-slate-300" />
                          } else if (d.isPast && d.isLogged) {
                            cellBg = '#10B981'
                            cellBorder = '#059669'
                            icon = <Check size={7} className="text-white" strokeWidth={3} />
                          } else if (d.isPast && !d.isLogged) {
                            cellBg = '#FEF2F2'
                            cellBorder = '#FECACA'
                            icon = <div className="w-1.5 h-1.5 rounded-full bg-red-300" />
                          } else {
                            cellBg = '#F9FAFB'
                            cellBorder = '#E5E7EB'
                            icon = <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${r.color}50` }} />
                          }

                          return (
                            <div
                              key={d.dateStr}
                              title={`${format(d.date, "EEEE d 'de' MMM", { locale: es })} — ${r.name}`}
                              className="aspect-square rounded-lg flex items-center justify-center border transition-all cursor-default"
                              style={{ background: cellBg, borderColor: cellBorder }}
                            >
                              {icon}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-4 pt-3 border-t border-gray-50 flex-wrap">
                {[
                  { style: { background: '#10B981', border: '1px solid #059669' }, label: 'Completado' },
                  { style: { background: '#FEF2F2', border: '1px solid #FECACA' }, label: 'Faltó' },
                  { style: { background: '#F9FAFB', border: '1px solid #E5E7EB' }, label: 'Próximo' },
                  { style: { background: '#F1F5F9', border: '1px solid #E2E8F0' }, label: 'Descanso' },
                ].map(({ style, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={style} />
                    <span className="text-[10px] text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════ PROGRESO ══════════ */}
        {tab === 'progreso' && (
          <motion.div key="progreso" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Streak banner */}
            <div className={cn(
              'p-4 rounded-2xl border flex items-center gap-4',
              gymStreak >= 3 ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'
            )}>
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                gymStreak >= 3 ? 'bg-orange-100' : 'bg-gray-100')}>
                <Flame size={28} className={gymStreak >= 3 ? 'text-orange-500' : 'text-gray-300'} />
              </div>
              <div>
                <p className={cn('text-3xl font-black tabular-nums', gymStreak >= 3 ? 'text-orange-600' : 'text-gray-400')}>
                  {gymStreak} {gymStreak === 1 ? 'día' : 'días'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Racha consecutiva en el gym</p>
              </div>
              {gymStreak >= 7 && <div className="ml-auto text-2xl">🏆</div>}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 text-center">
                <p className="text-2xl font-black text-emerald-600">{weekSessions.length}</p>
                <p className="text-xs text-gray-500 mt-1">Esta semana</p>
              </div>
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 text-center">
                <p className="text-2xl font-black text-violet-600">{completedDaysCount}</p>
                <p className="text-xs text-gray-500 mt-1">Días totales</p>
              </div>
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 text-center">
                <p className="text-2xl font-black text-amber-600">{latestMeas?.weight ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-1">Peso kg</p>
              </div>
            </div>

            {/* Weight chart */}
            {weightChartData.length > 1 ? (
              <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={14} className="text-amber-500" /> Evolución del peso
                  </p>
                  <button onClick={() => setWeightModal(true)}
                    className="text-xs text-amber-700 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 transition-all">
                    <Plus size={10} /> Agregar
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '12px', color: '#111827' }}
                      formatter={(v) => [`${v} kg`, 'Peso']}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50 text-center">
                <Scale size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm mb-3">Registra al menos 2 pesajes para ver la gráfica</p>
                <Button variant="glow" size="sm" onClick={() => setWeightModal(true)}>
                  <Plus size={14} /> Registrar peso
                </Button>
              </div>
            )}

            {/* Weight history */}
            {measurements.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Historial de peso</p>
                <div className="space-y-1.5">
                  {measurements.filter(m => m.weight).slice(0, 8).map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                      <Scale size={14} className="text-amber-500 shrink-0" />
                      <span className="text-sm font-bold text-gray-900 tabular-nums">{m.weight} kg</span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(m.date), "d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}

      <Modal open={weightModal} onClose={() => setWeightModal(false)} title="Registrar Peso">
        <div className="space-y-4">
          <Input label="Peso (kg)" type="number" min={30} max={300} step={0.1} placeholder="75.5"
            value={newWeight} onChange={e => setNewWeight(e.target.value)}
            icon={<Scale size={14} />} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setWeightModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newWeight} onClick={handleLogWeight}>
              <Check size={14} /> Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={waterConfigModal} onClose={() => setWaterConfigModal(false)} title="Configurar Agua">
        <div className="space-y-4">
          <Input label="Meta diaria (litros)" type="number" min={0.5} max={10} step={0.1} placeholder="2.5"
            value={wcGoal} onChange={e => setWcGoal(e.target.value)} icon={<Droplets size={14} />} />
          <Input label="Tamaño de mi pote (ml)" type="number" min={50} max={2000} step={50} placeholder="500"
            value={wcMl} onChange={e => setWcMl(e.target.value)} icon={<Droplets size={14} />} />
          {wcGoal && wcMl && (
            <p className="text-xs text-cyan-600">
              → {Math.ceil(Number(wcGoal) / (Number(wcMl) / 1000))} potes para alcanzar la meta
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setWaterConfigModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!wcGoal || !wcMl}
              onClick={() => { updateWaterConfig({ goalLiters: Number(wcGoal), containerMl: Number(wcMl) }); setWaterConfigModal(false) }}>
              <Check size={14} /> Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
