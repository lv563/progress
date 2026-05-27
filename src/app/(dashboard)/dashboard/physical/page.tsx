'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { Dumbbell, Droplets, TrendingDown, Plus, Activity, Scale, CalendarDays, X, Pencil, UtensilsCrossed, Minus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { usePhysicalStore } from '@/stores/physical.store'
import { useAppStore } from '@/stores/app.store'
import { useHabitsStore } from '@/stores/habits.store'
import { usePomodoroStore } from '@/stores/pomodoro.store'
import { useRoutineStore } from '@/stores/routine.store'
import { cn } from '@/lib/utils/cn'
import type { DayPlan } from '@/stores/physical.store'

const WORKOUT_TYPES = [
  { type: 'push',      name: 'Push',        desc: 'Pecho · Hombros · Tríceps', icon: '💪', color: '#7C3AED' },
  { type: 'pull',      name: 'Pull',        desc: 'Espalda · Bíceps',           icon: '🔄', color: '#06B6D4' },
  { type: 'legs',      name: 'Legs',        desc: 'Piernas',                    icon: '🦵', color: '#10B981' },
  { type: 'cardio',    name: 'Cardio',      desc: 'Cardiovascular',             icon: '🏃', color: '#F59E0B' },
  { type: 'full-body', name: 'Full Body',   desc: 'Cuerpo completo',            icon: '🏋️', color: '#EC4899' },
  { type: 'upper',     name: 'Upper',       desc: 'Tren superior',              icon: '👐', color: '#F97316' },
  { type: 'lower',     name: 'Lower',       desc: 'Tren inferior',              icon: '🦿', color: '#84CC16' },
  { type: 'hiit',      name: 'HIIT',        desc: 'Alta intensidad',            icon: '⚡', color: '#EF4444' },
  { type: 'rest',      name: 'Descanso',    desc: 'Día libre',                  icon: '😴', color: '#475569' },
  { type: 'custom',    name: 'Personalizado', desc: 'Escribir descripción',    icon: '✏️', color: '#8B5CF6' },
]

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_FULL  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function PhysicalPage() {
  const {
    exercises, workoutSessions, measurements, waterToday,
    mealsToday, mealsTarget, completedDates,
    weeklyPlan, setDayPlan, clearDayPlan,
    logWater, logMeals, setMealsTarget, toggleCompletedDate,
    addMeasurement, addWorkout,
    getWeekSessions, getLatestMeasurement,
  } = usePhysicalStore()
  const { addXP } = useAppStore()
  const { habits, getTodayLogs }   = useHabitsStore()
  const { getTodaySessions }       = usePomodoroStore()
  const { getTodayRoutine }        = useRoutineStore()

  const [addWorkoutModal, setAddWorkoutModal] = useState(false)
  const [addMeasModal, setAddMeasModal]       = useState(false)
  const [planModal, setPlanModal]             = useState<number | null>(null)
  const [newWeight, setNewWeight]             = useState('')
  const [customName, setCustomName]           = useState('')
  const [selectedType, setSelectedType]       = useState(WORKOUT_TYPES[0])

  const weekSessions = getWeekSessions()
  const latest       = getLatestMeasurement()
  const todayDow     = new Date().getDay() // 0=Sun

  // Returns the yyyy-MM-dd date string for a given day-of-week in the current week
  const getDayDate = (dow: number) => {
    const d = new Date()
    d.setDate(d.getDate() + (dow - todayDow))
    return d.toISOString().slice(0, 10)
  }

  // A day is done if manually marked OR a workout session was logged for that date
  const isDayDone = (dow: number) => {
    const dateStr = getDayDate(dow)
    if (completedDates.includes(dateStr)) return true
    const target = new Date(dateStr + 'T12:00:00')
    return workoutSessions.some(
      s => new Date(s.date).toDateString() === target.toDateString() && s.completed
    )
  }
  const todayDone = isDayDone(todayDow)

  // ── Daily summary ────────────────────────────────────────────────
  const todayLogs      = getTodayLogs()
  const pomodoroToday  = getTodaySessions()
  const todayRoutine   = getTodayRoutine()

  const habitsTotal    = habits.length
  const habitsDone     = Object.keys(todayLogs).length

  const routineTotal   = todayRoutine?.blocks.length ?? 0
  const routineDone    = todayRoutine?.blocks.filter(b => b.completed).length ?? 0

  const POMODORO_TARGET = 4

  const metrics = [
    {
      key: 'workout',
      label: 'Entrenamiento',
      icon: '💪',
      score: todayDone ? 25 : 0,
      max: 25,
      detail: todayDone
        ? `${weeklyPlan[todayDow]?.name ?? 'Entreno'} completado`
        : weeklyPlan[todayDow]
        ? `Pendiente: ${weeklyPlan[todayDow].name}`
        : 'Sin entreno planificado',
      ok: todayDone,
    },
    {
      key: 'water',
      label: 'Hidratación',
      icon: '💧',
      score: Math.round((Math.min(waterToday, 8) / 8) * 20),
      max: 20,
      detail: waterToday >= 8
        ? '¡Meta alcanzada! 8 vasos'
        : `${waterToday}/8 vasos — ${8 - waterToday} más para completar`,
      ok: waterToday >= 8,
    },
    {
      key: 'meals',
      label: 'Comidas',
      icon: '🍽️',
      score: Math.round((Math.min(mealsToday, mealsTarget) / mealsTarget) * 20),
      max: 20,
      detail: mealsToday >= mealsTarget
        ? `${mealsToday}/${mealsTarget} comidas completadas`
        : `${mealsToday}/${mealsTarget} — te faltan ${mealsTarget - mealsToday}`,
      ok: mealsToday >= mealsTarget,
    },
    {
      key: 'habits',
      label: 'Hábitos',
      icon: '⭐',
      score: habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 20) : 0,
      max: 20,
      detail: habitsTotal === 0
        ? 'Sin hábitos configurados'
        : habitsDone >= habitsTotal
        ? `¡Todos los hábitos! ${habitsDone}/${habitsTotal}`
        : `${habitsDone}/${habitsTotal} hábitos — ${habitsTotal - habitsDone} pendientes`,
      ok: habitsTotal > 0 && habitsDone >= habitsTotal,
    },
    {
      key: 'focus',
      label: 'Foco',
      icon: '🧠',
      score: Math.round((Math.min(pomodoroToday.length, POMODORO_TARGET) / POMODORO_TARGET) * 15),
      max: 15,
      detail: pomodoroToday.length === 0
        ? 'Sin sesiones Pomodoro hoy'
        : pomodoroToday.length >= POMODORO_TARGET
        ? `${pomodoroToday.length} sesiones de foco — excelente`
        : `${pomodoroToday.length}/${POMODORO_TARGET} sesiones de foco`,
      ok: pomodoroToday.length >= POMODORO_TARGET,
    },
  ]

  const totalScore = metrics.reduce((s, m) => s + m.score, 0)
  const totalMax   = metrics.reduce((s, m) => s + m.max, 0)
  const pctScore   = Math.round((totalScore / totalMax) * 100)

  const overallMsg =
    pctScore >= 90 ? { text: '¡Día épico!',                sub: 'Eres imparable. Sigue así.',                 color: '#10B981' } :
    pctScore >= 75 ? { text: '¡Gran día!',                 sub: 'Casi perfecto — muy buen trabajo.',           color: '#7C3AED' } :
    pctScore >= 55 ? { text: 'Buen esfuerzo',              sub: 'Quedaron cosas por hacer, pero avanzaste.',   color: '#F59E0B' } :
    pctScore >= 35 ? { text: 'Día regular',                sub: 'Mañana tienes otra oportunidad.',             color: '#F97316' } :
                     { text: 'Día difícil',                sub: 'No te rindas. Cada día es una nueva chance.', color: '#EF4444' }

  const hour = new Date().getHours()
  const isEvening = hour >= 18

  const weightData = measurements.slice(-8).reverse().map((m, i) => ({
    day: i + 1,
    peso: m.weight ?? 0,
  }))

  const weightChange = measurements.length >= 2
    ? ((measurements[0].weight ?? 0) - (measurements[1].weight ?? 0)).toFixed(1)
    : null

  const openPlanModal = (day: number) => {
    const existing = weeklyPlan[day]
    const found = WORKOUT_TYPES.find(t => t.type === existing?.type)
    setSelectedType(found ?? WORKOUT_TYPES[0])
    setCustomName(existing?.name ?? '')
    setPlanModal(day)
  }

  const saveDayPlan = () => {
    if (planModal === null) return
    const plan: DayPlan = {
      type: selectedType.type,
      name: selectedType.type === 'custom' ? (customName || 'Personalizado') : selectedType.name,
      icon: selectedType.icon,
    }
    setDayPlan(planModal, plan)
    setPlanModal(null)
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Dumbbell size={24} className="text-emerald-400" /> Físico
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAddMeasModal(true)}>
            <Scale size={14} /> Peso
          </Button>
          <Button variant="glow" size="sm" onClick={() => setAddWorkoutModal(true)}>
            <Plus size={14} /> Entreno
          </Button>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '💪', label: 'Sesiones esta semana', val: `${weekSessions.length}/5`,                          color: '#10B981' },
          { icon: '⚖️', label: 'Peso actual',          val: latest?.weight ? `${latest.weight} kg` : '—',       color: '#7C3AED' },
          { icon: '💧', label: 'Agua hoy',             val: `${waterToday}/8`,                                   color: '#06B6D4' },
          { icon: '📉', label: 'Cambio de peso',       val: weightChange ? `${weightChange} kg` : '—',          color: '#F59E0B' },
        ].map(s => (
          <GlassCard key={s.label} className="p-4" animate={false}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-xl font-black text-white">{s.val}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </GlassCard>
        ))}
      </motion.div>

      {/* Weekly training plan */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-emerald-400" /> Plan Semanal
          </h3>
          <div className="overflow-x-auto -mx-1 pb-1">
          <div className="grid grid-cols-7 gap-2 min-w-[380px] px-1">
            {Array.from({ length: 7 }, (_, i) => {
              const plan    = weeklyPlan[i]
              const isToday = i === todayDow
              const done    = isDayDone(i)
              const wt      = WORKOUT_TYPES.find(t => t.type === plan?.type)
              const dateStr = getDayDate(i)

              return (
                <div key={i} className="relative flex flex-col">
                  {/* Main card — click to edit plan */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openPlanModal(i)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center group',
                      done
                        ? 'border-emerald-500/40 bg-emerald-500/[0.08]'
                        : isToday
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : plan
                        ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                        : 'border-dashed border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]'
                    )}
                  >
                    {/* Day label */}
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      done ? 'text-emerald-400' : isToday ? 'text-emerald-400' : 'text-slate-500'
                    )}>
                      {DAY_NAMES[i]}
                    </span>

                    {/* Workout icon / add icon */}
                    {plan ? (
                      <>
                        <span className="text-xl leading-none">{plan.icon}</span>
                        <span
                          className="text-[9px] font-semibold leading-tight"
                          style={{ color: done ? '#10B981' : (wt?.color ?? '#94a3b8') }}
                        >
                          {plan.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-700 text-lg leading-none group-hover:text-slate-500 transition-colors">+</span>
                        <span className="text-[9px] text-slate-700 group-hover:text-slate-500 transition-colors">Agregar</span>
                      </>
                    )}
                  </motion.button>

                  {/* Toggle-done button — separate from plan edit */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => toggleCompletedDate(dateStr)}
                    className={cn(
                      'mt-1 mx-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      done
                        ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/40'
                        : 'bg-transparent border-white/20 hover:border-emerald-400/60'
                    )}
                    title={done ? 'Marcar como no completado' : 'Marcar como completado'}
                  >
                    {done && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </motion.button>

                  {/* Today indicator dot */}
                  {isToday && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 pointer-events-none" />
                  )}
                </div>
              )
            })}
          </div>
          </div>

          {/* Today's plan callout */}
          {weeklyPlan[todayDow] && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'mt-4 flex items-center gap-3 p-3 rounded-xl border',
                todayDone
                  ? 'bg-emerald-500/[0.12] border-emerald-500/30'
                  : 'bg-emerald-500/[0.08] border-emerald-500/20'
              )}
            >
              <span className="text-2xl">{weeklyPlan[todayDow].icon}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  {todayDone ? '¡Completado! ' : 'Hoy toca: '}
                  {weeklyPlan[todayDow].name}
                </p>
                <p className="text-xs text-slate-400">
                  {todayDone ? 'Excelente trabajo hoy 🔥' : DAY_FULL[todayDow]}
                </p>
              </div>
              {todayDone ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
                  <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                    <path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Listo
                </div>
              ) : (
                <Button variant="glow" size="sm" onClick={() => setAddWorkoutModal(true)}>
                  <Plus size={13} /> Registrar
                </Button>
              )}
            </motion.div>
          )}
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weight chart */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingDown size={16} className="text-violet-400" /> Evolución de Peso
            </h3>
            {weightData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#1A1A27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px', color: '#F8FAFC' }}
                    formatter={(v) => [`${v} kg`, 'Peso']}
                  />
                  <Line type="monotone" dataKey="peso" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-600 text-sm">
                Agrega mediciones para ver el gráfico
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Water tracker */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Droplets size={16} className="text-cyan-400" /> Hidratación
            </h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: 8 }, (_, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { logWater(i + 1 <= waterToday ? i : i + 1); addXP(2, 'Vaso de agua') }}
                  className={cn(
                    'aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-base border',
                    i < waterToday
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-white/[0.04] border-white/[0.06] text-slate-700 hover:border-white/10'
                  )}
                >
                  💧
                  <span className="text-[9px] font-mono">{i + 1}</span>
                </motion.button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{waterToday} de 8 vasos</p>
              <div className="w-32 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-cyan-500"
                  animate={{ width: `${(waterToday / 8) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Meals tracker */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5 h-full" animate={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <UtensilsCrossed size={16} className="text-orange-400" /> Comidas
              </h3>
              {/* Target adjuster */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMealsTarget(Math.max(1, mealsTarget - 1))}
                  className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Minus size={10} />
                </button>
                <span className="text-xs text-slate-400 font-mono w-4 text-center">{mealsTarget}</span>
                <button
                  onClick={() => setMealsTarget(Math.min(8, mealsTarget + 1))}
                  className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Plus size={10} />
                </button>
              </div>
            </div>

            {/* Meal slots */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: mealsTarget }, (_, i) => {
                const eaten = i < mealsToday
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => logMeals(i + 1 <= mealsToday ? i : i + 1)}
                    className={cn(
                      'aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-base border',
                      eaten
                        ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                        : 'bg-white/[0.04] border-white/[0.06] text-slate-700 hover:border-white/10'
                    )}
                  >
                    {eaten ? '✅' : '🍽️'}
                    <span className="text-[9px] font-mono">{i + 1}</span>
                  </motion.button>
                )
              })}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{mealsToday} de {mealsTarget} comidas</p>
              <div className="w-24 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', mealsToday >= mealsTarget ? 'bg-emerald-500' : 'bg-orange-500')}
                  animate={{ width: `${Math.min((mealsToday / mealsTarget) * 100, 100)}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {mealsToday >= mealsTarget && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-400 mt-2 text-center font-semibold"
              >
                ¡Objetivo cumplido! 🎯
              </motion.p>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Recent workouts */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" /> Sesiones Recientes
          </h3>
          {workoutSessions.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <Dumbbell size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin sesiones registradas</p>
              <Button variant="glow" size="sm" className="mt-4" onClick={() => setAddWorkoutModal(true)}>
                <Plus size={14} /> Registrar entreno
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {workoutSessions.slice(-5).reverse().map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 glass rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Dumbbell size={14} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(s.date).toLocaleDateString('es-ES')} · {s.duration}min
                    </p>
                  </div>
                  <Badge variant="green" size="sm">
                    {s.volume > 0 ? `${s.volume}kg vol.` : s.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Daily summary */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="text-lg">📊</span>
                {isEvening ? 'Resumen del Día' : 'Progreso de Hoy'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEvening ? 'Así terminó tu día' : 'Va actualizándose durante el día'}
              </p>
            </div>

            {/* Score ring */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="23" fill="none"
                    stroke={overallMsg.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 23}`}
                    strokeDashoffset={`${2 * Math.PI * 23 * (1 - pctScore / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-white">{pctScore}%</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold mt-1" style={{ color: overallMsg.color }}>
                {overallMsg.text}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-4 -mt-2">{overallMsg.sub}</p>

          {/* Metric rows */}
          <div className="space-y-2.5">
            {metrics.map(m => {
              const pct = Math.round((m.score / m.max) * 100)
              return (
                <div key={m.key} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center shrink-0">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{m.label}</span>
                      <span className="text-xs font-mono text-slate-400">{m.score}/{m.max}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: m.ok ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      />
                    </div>
                    <p className={cn('text-[10px] mt-0.5', m.ok ? 'text-emerald-400' : 'text-slate-500')}>
                      {m.detail}
                    </p>
                  </div>
                  {/* Status icon */}
                  <div className="shrink-0">
                    {m.ok ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ) : m.score > 0 ? (
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-[9px] text-amber-400 font-bold">~</span>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-[9px] text-red-400 font-bold">✕</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* What was missed */}
          {metrics.filter(m => !m.ok).length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-xs font-semibold text-slate-400 mb-2">Para mejorar mañana:</p>
              <div className="flex flex-wrap gap-1.5">
                {metrics.filter(m => !m.ok).map(m => (
                  <span key={m.key} className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400">
                    {m.icon} {m.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Modal: Registrar peso */}
      <Modal open={addMeasModal} onClose={() => setAddMeasModal(false)} title="Registrar Peso">
        <div className="space-y-4">
          <Input
            label="Peso (kg)"
            type="number"
            step="0.1"
            placeholder="75.3"
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setAddMeasModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={() => {
              if (!newWeight) return
              addMeasurement({ date: new Date().toISOString(), weight: parseFloat(newWeight) })
              setAddMeasModal(false)
              setNewWeight('')
            }}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Nueva sesión */}
      <Modal open={addWorkoutModal} onClose={() => setAddWorkoutModal(false)} title="Nueva Sesión">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Selecciona el tipo de entreno para hoy:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'push',      name: 'Push (Pecho / Hombros / Tríceps)', icon: '💪' },
              { type: 'pull',      name: 'Pull (Espalda / Bíceps)',           icon: '🔄' },
              { type: 'legs',      name: 'Legs (Piernas)',                    icon: '🦵' },
              { type: 'cardio',    name: 'Cardio',                            icon: '🏃' },
              { type: 'full-body', name: 'Full Body',                         icon: '🏋️' },
              { type: 'custom',    name: 'Personalizado',                     icon: '⚡' },
            ].map(t => (
              <button
                key={t.type}
                onClick={() => {
                  addWorkout({
                    date: new Date().toISOString(),
                    type: t.type as never,
                    name: t.name,
                    exercises: [],
                    duration: 60,
                    volume: 0,
                    mood: 4,
                    completed: true,
                  })
                  addXP(25, `Entreno: ${t.name}`)
                  setAddWorkoutModal(false)
                }}
                className="flex items-center gap-2 p-3 rounded-xl glass border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] transition-all text-left"
              >
                <span className="text-xl">{t.icon}</span>
                <span className="text-xs text-slate-300">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal: Editar día del plan */}
      <Modal
        open={planModal !== null}
        onClose={() => setPlanModal(null)}
        title={planModal !== null ? `${DAY_FULL[planModal]} — Plan` : ''}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">¿Qué entreno te toca este día?</p>
          <div className="grid grid-cols-2 gap-2">
            {WORKOUT_TYPES.map(wt => (
              <button
                key={wt.type}
                onClick={() => setSelectedType(wt)}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left',
                  selectedType.type === wt.type
                    ? 'border-opacity-60'
                    : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]'
                )}
                style={selectedType.type === wt.type
                  ? { background: `${wt.color}15`, borderColor: `${wt.color}50` }
                  : undefined}
              >
                <span className="text-xl">{wt.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{wt.name}</p>
                  <p className="text-[10px] text-slate-500">{wt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedType.type === 'custom' && (
            <Input
              label="Nombre del entreno"
              placeholder="Ej: Hombros + Core"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
            />
          )}

          <div className="flex items-center gap-3 justify-between pt-1">
            {planModal !== null && weeklyPlan[planModal] && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
                onClick={() => { if (planModal !== null) clearDayPlan(planModal); setPlanModal(null) }}
              >
                <X size={14} /> Quitar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" onClick={() => setPlanModal(null)}>Cancelar</Button>
              <Button variant="glow" onClick={saveDayPlan}>Guardar</Button>
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
