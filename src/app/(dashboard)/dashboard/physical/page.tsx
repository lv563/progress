'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Dumbbell, Droplets, Plus, Scale, Trash2, Check, Flame, Utensils,
  ChevronDown, ChevronUp, TrendingUp,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { usePhysicalStore } from '@/stores/physical.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import type { WorkoutType } from '@/types'

const WORKOUT_TYPES = [
  { type: 'push',      name: 'Push',      desc: 'Pecho · Hombros · Tríceps', icon: '💪', color: '#7C3AED' },
  { type: 'pull',      name: 'Pull',      desc: 'Espalda · Bíceps',          icon: '🔄', color: '#06B6D4' },
  { type: 'legs',      name: 'Legs',      desc: 'Piernas',                   icon: '🦵', color: '#10B981' },
  { type: 'cardio',    name: 'Cardio',    desc: 'Cardiovascular',            icon: '🏃', color: '#F59E0B' },
  { type: 'full-body', name: 'Full Body', desc: 'Cuerpo completo',           icon: '🏋️', color: '#EC4899' },
  { type: 'upper',     name: 'Upper',     desc: 'Tren superior',             icon: '👐', color: '#F97316' },
  { type: 'lower',     name: 'Lower',     desc: 'Tren inferior',             icon: '🦿', color: '#84CC16' },
  { type: 'hiit',      name: 'HIIT',      desc: 'Alta intensidad',           icon: '⚡', color: '#EF4444' },
  { type: 'rest',      name: 'Descanso',  desc: 'Día de recuperación',       icon: '😴', color: '#475569' },
  { type: 'custom',    name: 'Otro',      desc: 'Descripción libre',         icon: '✏️', color: '#8B5CF6' },
] as const

const WATER_TARGET = 8
const DAY_LABELS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

type Tab = 'hoy' | 'semana' | 'progreso'

export default function PhysicalPage() {
  const {
    workoutSessions, measurements,
    waterToday, setWater,
    mealsToday, setMeals,
    addWorkout, deleteWorkout,
    addMeasurement,
    weeklyPlan, setDayPlan, clearDayPlan,
    getWeekSessions, getTodayWorkout, getLatestMeasurement, getGymStreak,
  } = usePhysicalStore()
  const { addXP } = useAppStore()

  const [tab, setTab]               = useState<Tab>('hoy')
  const [workoutModal, setWorkoutModal] = useState(false)
  const [weightModal, setWeightModal]   = useState(false)
  const [selectedType, setSelectedType] = useState<string>('push')
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [newWeight, setNewWeight]       = useState('')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [routineDay, setRoutineDay] = useState<number | null>(null)
  const [routineType, setRoutineType] = useState<string>('push')

  const today        = format(new Date(), 'yyyy-MM-dd')
  const todayWorkout = getTodayWorkout()
  const weekSessions = getWeekSessions()
  const latestMeas   = getLatestMeasurement()
  const waterPct     = Math.min(100, (waterToday / WATER_TARGET) * 100)
  const gymStreak    = getGymStreak()
  const MEALS_TARGET = 5

  const handleLogWorkout = () => {
    const wt = WORKOUT_TYPES.find(w => w.type === selectedType) ?? WORKOUT_TYPES[0]
    addWorkout({
      date: today,
      type: selectedType as WorkoutType,
      name: wt.name,
      exercises: [],
      duration: 0,
      volume: 0,
      notes: workoutNotes || undefined,
      mood: 3,
      completed: true,
    })
    addXP(30, `Entrenamiento: ${wt.name}`)
    setWorkoutModal(false)
    setWorkoutNotes('')
    setSelectedType('push')
  }

  const handleLogWeight = () => {
    const w = Number(newWeight)
    if (!w || w <= 0) return
    addMeasurement({ date: today, weight: w })
    setWeightModal(false)
    setNewWeight('')
  }

  // Last 30 days for weight chart
  const weightChartData = measurements
    .filter(m => m.weight)
    .slice(0, 30)
    .reverse()
    .map(m => ({ date: format(new Date(m.date), 'd/MM'), weight: m.weight }))

  // Last 7 days for week view
  const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })

  const tooltipStyle = {
    contentStyle: { background: '#1A1A27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px', color: '#F8FAFC' },
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Dumbbell size={24} className="text-emerald-400" /> Físico
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-2">
            {weekSessions.length} entrenos esta semana
            {latestMeas?.weight ? ` · ${latestMeas.weight} kg` : ''}
            {gymStreak > 0 && (
              <span className="flex items-center gap-0.5 text-orange-400 font-semibold">
                · <Flame size={12} className="inline" /> {gymStreak}d racha
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setWorkoutModal(true)} variant="glow" size="sm">
          <Plus size={14} /> Entrenar
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {([['hoy', 'Hoy'], ['semana', 'Semana'], ['progreso', 'Progreso']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
            )}>
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ HOY ══ */}
        {tab === 'hoy' && (
          <motion.div key="hoy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Today's workout */}
            {todayWorkout ? (
              <div className="p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">
                    {WORKOUT_TYPES.find(w => w.type === todayWorkout.type)?.icon ?? '💪'}
                  </div>
                  <div>
                    <p className="font-bold text-white">{todayWorkout.name}</p>
                    <p className="text-xs text-emerald-400">✓ Completado hoy</p>
                    {todayWorkout.notes && <p className="text-xs text-slate-500 mt-0.5">{todayWorkout.notes}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setWorkoutModal(true)}
                className="w-full p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-full border-2 border-white/[0.15] group-hover:border-emerald-500/50 transition-all shrink-0 flex items-center justify-center">
                  <Check size={12} className="text-white/0 group-hover:text-emerald-500/40 transition-all" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">¿Entrenaste hoy?</p>
                  <p className="text-xs text-slate-700 group-hover:text-slate-500 transition-colors mt-0.5">Toca para registrar tu sesión</p>
                </div>
                <span className="ml-auto text-xl opacity-40 group-hover:opacity-70 transition-opacity">💪</span>
              </button>
            )}

            {/* Water tracker */}
            <div className="p-4 rounded-2xl border border-cyan-500/15 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplets size={16} className="text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Agua</span>
                </div>
                <span className="text-xs font-bold text-cyan-400">{waterToday}/{WATER_TARGET} vasos</span>
              </div>
              <div className="flex gap-1.5 mb-3">
                {Array.from({ length: WATER_TARGET }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setWater(i < waterToday ? i : i + 1)}
                    className={cn(
                      'flex-1 h-8 rounded-lg transition-all',
                      i < waterToday ? 'bg-cyan-500/50 hover:bg-cyan-500/40' : 'bg-white/[0.04] hover:bg-white/[0.08]'
                    )}
                  >
                    <Droplets size={12} className={cn('mx-auto', i < waterToday ? 'text-cyan-300' : 'text-slate-700')} />
                  </button>
                ))}
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div className="h-full rounded-full bg-cyan-500"
                  initial={{ width: 0 }} animate={{ width: `${waterPct}%` }} transition={{ duration: 0.5 }} />
              </div>
            </div>

            {/* Meal counter */}
            <div className="p-4 rounded-2xl border border-orange-500/15 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Utensils size={16} className="text-orange-400" />
                  <span className="text-sm font-semibold text-white">Comidas</span>
                </div>
                <span className="text-xs font-bold text-orange-400">{mealsToday}/{MEALS_TARGET} hoy</span>
              </div>
              <div className="flex gap-1.5 mb-3">
                {Array.from({ length: MEALS_TARGET }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setMeals(i < mealsToday ? i : i + 1)}
                    className={cn(
                      'flex-1 h-8 rounded-lg transition-all flex items-center justify-center',
                      i < mealsToday ? 'bg-orange-500/45 hover:bg-orange-500/35' : 'bg-white/[0.04] hover:bg-white/[0.08]'
                    )}
                  >
                    <Utensils size={12} className={i < mealsToday ? 'text-orange-300' : 'text-slate-700'} />
                  </button>
                ))}
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(mealsToday / MEALS_TARGET) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Weight quick add */}
            <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale size={16} className="text-amber-400" />
                  <span className="text-sm font-semibold text-white">Peso corporal</span>
                </div>
                <button onClick={() => setWeightModal(true)}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-all">
                  <Plus size={11} /> Registrar
                </button>
              </div>
              {latestMeas?.weight ? (
                <div className="mt-3 flex items-end gap-2">
                  <p className="text-3xl font-black text-amber-400 tabular-nums">{latestMeas.weight}</p>
                  <p className="text-sm text-slate-500 mb-1">kg</p>
                  <p className="text-xs text-slate-600 mb-1 ml-1">
                    {format(new Date(latestMeas.date), "d 'de' MMM", { locale: es })}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-600 mt-2">Sin registros aún</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ SEMANA ══ */}
        {tab === 'semana' && (
          <motion.div key="semana" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Weekly routine builder */}
            <div className="p-4 rounded-2xl border border-violet-500/15 bg-white/[0.02]">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">Mi Rutina Semanal</p>
              <div className="grid grid-cols-7 gap-1">
                {DAY_LABELS.map((label, dayIdx) => {
                  const plan = weeklyPlan[dayIdx]
                  const wt = plan ? WORKOUT_TYPES.find(w => w.type === plan.type) : null
                  return (
                    <button
                      key={dayIdx}
                      onClick={() => { setRoutineDay(dayIdx); setRoutineType(plan?.type ?? 'push') }}
                      className={cn(
                        'flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all group',
                        plan ? 'border-transparent' : 'border-dashed border-white/[0.08] hover:border-white/[0.18]'
                      )}
                      style={plan && wt ? { background: `${wt.color}18`, borderColor: `${wt.color}40` } : undefined}
                    >
                      <span className="text-[9px] text-slate-600">{label}</span>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: wt ? `${wt.color}22` : 'rgba(255,255,255,0.03)' }}>
                        {wt ? wt.icon : <span className="text-slate-700 text-base leading-none">+</span>}
                      </div>
                      {wt && <p className="text-[8px] text-slate-500 text-center leading-tight truncate w-full">{wt.name}</p>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 7-day view */}
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-2">Esta semana</p>
              <div className="grid grid-cols-7 gap-1.5">
                {last7.map(day => {
                const key     = format(day, 'yyyy-MM-dd')
                const isToday = key === today
                const session = workoutSessions.find(s => s.date === key)
                const wt      = session ? WORKOUT_TYPES.find(w => w.type === session.type) : null
                const planned = weeklyPlan[day.getDay()]
                const planWt  = planned ? WORKOUT_TYPES.find(w => w.type === planned.type) : null
                const matched = session && planned && session.type === planned.type

                return (
                  <div key={key} className={cn(
                    'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all relative',
                    isToday ? 'border-emerald-500/30 bg-emerald-500/[0.07]' : 'border-white/[0.05] bg-white/[0.02]'
                  )}>
                    {matched && (
                      <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check size={7} className="text-white" />
                      </div>
                    )}
                    <span className="text-[10px] text-slate-600">{DAY_LABELS[day.getDay()]}</span>
                    <span className={cn('text-xs font-bold', isToday ? 'text-emerald-400' : 'text-slate-500')}>
                      {format(day, 'd')}
                    </span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                      style={{ background: wt ? `${wt.color}22` : planWt ? `${planWt.color}0F` : 'rgba(255,255,255,0.03)' }}>
                      {wt ? wt.icon : planWt ? <span className="text-slate-700 opacity-40">{planWt.icon}</span> : <span className="text-slate-700 text-xs">—</span>}
                    </div>
                    {wt && <p className="text-[9px] text-slate-500 text-center leading-tight">{wt.name}</p>}
                    {!wt && planWt && <p className="text-[8px] text-slate-700 text-center leading-tight">{planWt.name}</p>}
                  </div>
                )
              })}
              </div>
            </div>

            {/* Recent sessions list */}
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-3">Historial reciente</p>
              {workoutSessions.length === 0 ? (
                <div className="text-center py-10">
                  <Dumbbell size={28} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-slate-500 text-sm">Sin sesiones registradas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workoutSessions.slice(0, 20).map(session => {
                    const wt       = WORKOUT_TYPES.find(w => w.type === session.type)
                    const expanded = expandedSession === session.id
                    return (
                      <div key={session.id}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                        <div className="flex items-center gap-3 p-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                            style={{ background: wt ? `${wt.color}22` : undefined }}>
                            {wt?.icon ?? '💪'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{session.name}</p>
                            <p className="text-xs text-slate-600">
                              {format(new Date(session.date), "d 'de' MMM", { locale: es })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {session.notes && (
                              <button onClick={() => setExpandedSession(expanded ? null : session.id)}
                                className="text-slate-600 hover:text-slate-300 transition-colors">
                                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                            <button onClick={() => deleteWorkout(session.id)}
                              className="text-slate-700 hover:text-red-400 transition-colors ml-1">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <AnimatePresence>
                          {expanded && session.notes && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                              className="overflow-hidden">
                              <p className="px-4 pb-3 text-xs text-slate-400">{session.notes}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ PROGRESO ══ */}
        {tab === 'progreso' && (
          <motion.div key="progreso" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Gym streak banner */}
            <div className={cn(
              'p-4 rounded-2xl border flex items-center gap-4',
              gymStreak >= 3 ? 'border-orange-500/30 bg-orange-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02]'
            )}>
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                gymStreak >= 3 ? 'bg-orange-500/20' : 'bg-white/[0.05]'
              )}>
                <Flame size={28} className={gymStreak >= 3 ? 'text-orange-400' : 'text-slate-600'} />
              </div>
              <div>
                <p className={cn('text-3xl font-black tabular-nums', gymStreak >= 3 ? 'text-orange-400' : 'text-slate-400')}>
                  {gymStreak} {gymStreak === 1 ? 'día' : 'días'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Racha consecutiva en el gym</p>
              </div>
              {gymStreak >= 7 && (
                <div className="ml-auto text-2xl">🏆</div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
                <p className="text-2xl font-black text-emerald-400">{weekSessions.length}</p>
                <p className="text-xs text-slate-500 mt-1">Esta semana</p>
              </div>
              <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
                <p className="text-2xl font-black text-violet-400">{workoutSessions.length}</p>
                <p className="text-xs text-slate-500 mt-1">Total entrenos</p>
              </div>
              <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
                <p className="text-2xl font-black text-amber-400">{latestMeas?.weight ?? '—'}</p>
                <p className="text-xs text-slate-500 mt-1">Peso kg</p>
              </div>
            </div>

            {/* Weight chart */}
            {weightChartData.length > 1 ? (
              <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp size={14} className="text-amber-400" /> Evolución del peso
                  </p>
                  <button onClick={() => setWeightModal(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-all">
                    <Plus size={10} /> Agregar
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip {...tooltipStyle} formatter={(v) => [`${v} kg`, 'Peso']} />
                    <Line type="monotone" dataKey="weight" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
                <Scale size={28} className="mx-auto text-slate-700 mb-2" />
                <p className="text-slate-500 text-sm mb-3">Registra al menos 2 pesajes para ver la gráfica</p>
                <Button variant="glow" size="sm" onClick={() => setWeightModal(true)}>
                  <Plus size={14} /> Registrar peso
                </Button>
              </div>
            )}

            {/* Weight history */}
            {measurements.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-3">Historial de peso</p>
                <div className="space-y-1.5">
                  {measurements.filter(m => m.weight).slice(0, 10).map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <Scale size={14} className="text-amber-400 shrink-0" />
                      <span className="text-sm font-bold text-white tabular-nums">{m.weight} kg</span>
                      <span className="text-xs text-slate-600">
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

      {/* ════ MODALS ════ */}

      {/* Registrar entrenamiento */}
      <Modal open={workoutModal} onClose={() => setWorkoutModal(false)} title="Registrar Entrenamiento">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {WORKOUT_TYPES.map(wt => (
              <button key={wt.type} onClick={() => setSelectedType(wt.type)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                  selectedType === wt.type ? 'border-transparent' : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]'
                )}
                style={selectedType === wt.type ? { background: `${wt.color}20`, borderColor: `${wt.color}50` } : undefined}>
                <span className="text-xl shrink-0">{wt.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">{wt.name}</p>
                  <p className="text-[10px] text-slate-500 leading-tight truncate">{wt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Notas (opcional)</label>
            <textarea value={workoutNotes} onChange={e => setWorkoutNotes(e.target.value)}
              rows={2} placeholder="PR en press banca, 3x12 sentadilla..."
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-slate-200 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-emerald-500/50 resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setWorkoutModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={handleLogWorkout}>
              <Check size={14} /> Guardar +30 XP
            </Button>
          </div>
        </div>
      </Modal>

      {/* Routine day editor */}
      <Modal
        open={routineDay !== null}
        onClose={() => setRoutineDay(null)}
        title={routineDay !== null ? `Rutina — ${DAY_LABELS[routineDay]}` : 'Rutina'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {WORKOUT_TYPES.map(wt => (
              <button key={wt.type} onClick={() => setRoutineType(wt.type)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                  routineType === wt.type ? 'border-transparent' : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]'
                )}
                style={routineType === wt.type ? { background: `${wt.color}20`, borderColor: `${wt.color}50` } : undefined}>
                <span className="text-xl shrink-0">{wt.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">{wt.name}</p>
                  <p className="text-[10px] text-slate-500 leading-tight truncate">{wt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-between">
            {routineDay !== null && weeklyPlan[routineDay] && (
              <Button variant="ghost" onClick={() => { clearDayPlan(routineDay!); setRoutineDay(null) }}>
                <Trash2 size={14} /> Quitar
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button variant="ghost" onClick={() => setRoutineDay(null)}>Cancelar</Button>
              <Button variant="glow" onClick={() => {
                if (routineDay === null) return
                const wt = WORKOUT_TYPES.find(w => w.type === routineType) ?? WORKOUT_TYPES[0]
                setDayPlan(routineDay, { type: routineType, name: wt.name, icon: wt.icon })
                setRoutineDay(null)
              }}>
                <Check size={14} /> Guardar
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Registrar peso */}
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
    </motion.div>
  )
}
