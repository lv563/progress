'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { Flame, Zap, Target, Timer, Dumbbell, Church, CheckSquare, Droplets, Star, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { HeatmapGrid } from '@/components/ui/HeatmapGrid'
import { StatCard } from '@/components/ui/StatCard'
import { useAppStore } from '@/stores/app.store'
import { useHabitsStore } from '@/stores/habits.store'
import { usePomodoroStore } from '@/stores/pomodoro.store'
import { useTasksStore } from '@/stores/tasks.store'
import { usePhysicalStore } from '@/stores/physical.store'
import { useMinistryStore } from '@/stores/ministry.store'
import { useDailyLogStore, type DailyLog } from '@/stores/dailyLog.store'
import { formatXP, getLevelTitle, levelProgress } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'

/* ── Yesterday summary card ─────────────────────────────── */
function YesterdayCard({ log }: { log: DailyLog }) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor = log.score >= 80 ? '#10B981' : log.score >= 60 ? '#F59E0B' : '#EF4444'
  const scoreLabel = log.score >= 80 ? '¡Excelente día!' : log.score >= 60 ? 'Buen día' : 'Día para mejorar'

  const tips: string[] = []
  if (log.habitTotal > 0 && log.habitsCompleted / log.habitTotal < 0.7)
    tips.push(`Solo completaste ${log.habitsCompleted}/${log.habitTotal} hábitos — intenta llegar al 70%`)
  if (log.waterGlasses < 6)
    tips.push(`Tomaste solo ${log.waterGlasses} vasos de agua — apunta a 8`)
  if (log.pomodoroSessions < 2)
    tips.push('Menos de 2 pomodoros — agrega más bloques de foco')
  if (log.mealsTarget > 0 && log.mealsEaten < log.mealsTarget)
    tips.push(`Solo ${log.mealsEaten}/${log.mealsTarget} comidas registradas`)

  const metrics = [
    { label: 'Hábitos', val: `${log.habitsCompleted}/${log.habitTotal}`, pct: log.habitTotal > 0 ? log.habitsCompleted / log.habitTotal : 0, color: '#7C3AED' },
    { label: 'Pomodoros', val: `${log.pomodoroSessions}`, pct: Math.min(log.pomodoroSessions / 6, 1), color: '#06B6D4' },
    { label: 'Agua', val: `${log.waterGlasses}/8`, pct: Math.min(log.waterGlasses / 8, 1), color: '#0EA5E9' },
    { label: 'Comidas', val: `${log.mealsEaten}/${log.mealsTarget}`, pct: log.mealsTarget > 0 ? Math.min(log.mealsEaten / log.mealsTarget, 1) : 0, color: '#F97316' },
  ]

  return (
    <GlassCard className="p-4" animate={false}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Resumen de ayer</span>
          <span className="text-xs text-gray-400">
            {format(new Date(log.date + 'T00:00:00'), "d 'de' MMM", { locale: es })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black" style={{ color: scoreColor }}>{log.score}</span>
            <div>
              <p className="text-[9px] text-gray-400 leading-none">/100</p>
              <p className="text-[10px] font-medium leading-none" style={{ color: scoreColor }}>{scoreLabel}</p>
            </div>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600 transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Mini metric bars (always visible) */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {metrics.map(m => (
          <div key={m.label}>
            <div className="h-1 rounded-full bg-gray-100 overflow-hidden mb-1">
              <div className="h-full rounded-full transition-all" style={{ width: `${m.pct * 100}%`, background: m.color }} />
            </div>
            <p className="text-[10px] font-bold text-gray-900 text-center">{m.val}</p>
            <p className="text-[9px] text-gray-400 text-center">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tips — expandable */}
      <AnimatePresence>
        {expanded && tips.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">Para mejorar hoy</p>
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1" />
                  {tip}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}

/* ── Main dashboard ─────────────────────────────────────── */
export default function DashboardPage() {
  const { user, addXP } = useAppStore()
  const { habits, getTodayLogs, getStreakDates } = useHabitsStore()
  const { getTodaySessions, getWeekMinutes } = usePomodoroStore()
  const { getTodayTasks } = useTasksStore()
  const { waterLogs, waterConfig, getWeekSessions, getLatestMeasurement } = usePhysicalStore()
  const waterToday = waterLogs[new Date().toISOString().slice(0, 10)] ?? 0
  const { getPendingFollowUps } = useMinistryStore()
  const { getYesterdayLog } = useDailyLogStore()

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es })
  const todayLogs = getTodayLogs()
  const todayPomodoros = getTodaySessions()
  const todayTasks = getTodayTasks()
  const weekGymSessions = getWeekSessions()
  const pendingFollowUps = getPendingFollowUps()
  const latestWeight = getLatestMeasurement()
  const xpPct = user ? levelProgress(user.xp, user.level) : 0
  const yesterdayLog = getYesterdayLog()

  const completedHabits = habits.filter(h => todayLogs[h.id]?.completed).length
  const totalHabits = habits.length
  const habitPct = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0

  const heatmapData = habits.reduce((acc, h) => {
    getStreakDates(h.id).forEach(date => { acc[date] = (acc[date] ?? 0) + 1 })
    return acc
  }, {} as Record<string, number>)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm capitalize">{today}</p>
          <h1 className="text-2xl font-black text-gray-900 mt-0.5">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'Kingdom'} 👋
          </h1>
        </div>
        {user && (
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-2 rounded-xl">
              <Flame size={16} className="text-orange-500 animate-streak-fire" />
              <span className="text-orange-500 font-bold">{user.streak} días</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Yesterday summary — only if data exists */}
      {yesterdayLog && (
        <motion.div variants={fadeUp}>
          <YesterdayCard log={yesterdayLog} />
        </motion.div>
      )}

      {/* Top stats row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Racha Actual" value={`🔥 ${user?.streak ?? 0}d`} subValue={`Récord: ${user?.bestStreak ?? 0}d`} icon={<Flame size={18} />} color="#F97316" />
        <StatCard label="XP Total" value={formatXP(user?.xp ?? 0)} subValue={`Lv.${user?.level ?? 1} — ${getLevelTitle(user?.level ?? 1)}`} icon={<Zap size={18} />} color="#F59E0B" />
        <StatCard label="Hábitos Hoy" value={`${completedHabits}/${totalHabits}`} subValue={`${Math.round(habitPct)}% completado`} icon={<Target size={18} />} color="#7C3AED" />
        <StatCard label="Pomodoros Hoy" value={`🏅 ${todayPomodoros.length}`} subValue={`${Math.round(todayPomodoros.reduce((a, s) => a + s.duration, 0) / 60 * 10) / 10}h de foco`} icon={<Timer size={18} />} color="#06B6D4" />
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Habit list */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5 h-full" animate={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Target size={16} className="text-violet-600" /> Hábitos de Hoy
              </h3>
              <span className="text-xs text-gray-400">{completedHabits}/{totalHabits}</span>
            </div>
            <div className="space-y-3">
              {habits.slice(0, 5).map(habit => {
                const log = todayLogs[habit.id]
                const val = log?.value ?? 0
                const pct = Math.min((val / habit.target) * 100, 100)
                const done = log?.completed ?? false
                return (
                  <div key={habit.id} className="flex items-center gap-3">
                    <ProgressRing value={pct} size={36} strokeWidth={4} color={done ? '#10B981' : habit.color} animate={false}>
                      <span className="text-sm">{habit.icon}</span>
                    </ProgressRing>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{habit.name}</p>
                        {done && <span className="text-xs text-emerald-600">✓</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Flame size={10} className="text-orange-400" />
                        <span className="text-[10px] text-gray-400">{habit.streak}d racha</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Today tasks */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5 h-full" animate={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare size={16} className="text-cyan-600" /> Tareas de Hoy
              </h3>
              <span className="text-xs text-gray-400">{todayTasks.length} pendientes</span>
            </div>
            {todayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                <CheckSquare size={24} className="mb-2 opacity-40" />
                <p className="text-sm">¡Todo completado!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={cn('mt-0.5 w-4 h-4 rounded-md border-2 shrink-0', task.priority === 'p0' ? 'border-red-500' : task.priority === 'p1' ? 'border-orange-500' : 'border-gray-200')} />
                    <p className="text-sm text-gray-700 leading-tight">{task.title}</p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* XP + Level */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5 h-full" variant="glow" animate={false}>
            <div className="flex items-center gap-4 mb-4">
              <ProgressRing value={xpPct} size={64} strokeWidth={6} color="#F59E0B" animate={false}>
                <span className="text-lg font-black text-gray-900">{user?.level}</span>
              </ProgressRing>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Nivel actual</p>
                <p className="text-lg font-bold text-gray-900">{getLevelTitle(user?.level ?? 1)}</p>
                <p className="text-xs text-amber-600">{formatXP(user?.xp ?? 0)} XP</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Progreso al siguiente nivel</span>
                <span className="text-amber-600">{Math.round(xpPct)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <motion.div className="h-full rounded-full gradient-xp" initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: [0.0, 0.0, 0.2, 1] }} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: '🔥', label: 'Racha', val: `${user?.streak}d` },
                { icon: '🏅', label: 'Focus', val: `${todayPomodoros.length}` },
                { icon: '💪', label: 'Gym', val: `${weekGymSessions.length}w` },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                  <p className="text-base">{s.icon}</p>
                  <p className="text-xs font-bold text-gray-900">{s.val}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Water + Gym */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <GlassCard className="p-4" animate={false}>
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={16} className="text-cyan-600" />
              <span className="text-sm font-semibold text-gray-900">Agua</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: Math.max(1, Math.ceil(waterConfig.goalLiters / (waterConfig.containerMl / 1000))) }, (_, i) => (
                <div key={i} className={cn('w-6 h-6 rounded-md text-center text-sm transition-all', i < waterToday ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-300')}>
                  💧
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">{(waterToday * waterConfig.containerMl / 1000).toFixed(1)}L / {waterConfig.goalLiters}L</p>
          </GlassCard>
          <GlassCard className="p-4" animate={false}>
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell size={16} className="text-emerald-600" />
              <span className="text-sm font-semibold text-gray-900">Gym</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{weekGymSessions.length}</p>
            <p className="text-xs text-gray-400">sesiones esta semana</p>
            {latestWeight && <p className="text-xs text-emerald-600 mt-1">{latestWeight.weight} kg</p>}
          </GlassCard>
        </motion.div>

        {/* Ministry */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" variant="violet" animate={false}>
            <div className="flex items-center gap-2 mb-4">
              <Church size={16} className="text-pink-500" />
              <h3 className="text-sm font-semibold text-gray-900">Seguimientos Pendientes</h3>
              {pendingFollowUps.length > 0 && (
                <span className="ml-auto bg-pink-100 text-pink-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingFollowUps.length}</span>
              )}
            </div>
            {pendingFollowUps.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">¡Sin seguimientos pendientes! 🎉</p>
            ) : (
              <div className="space-y-2">
                {pendingFollowUps.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/60">
                    <div className="w-7 h-7 rounded-full gradient-spirit flex items-center justify-center text-xs font-bold text-white">{p.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.followUpType}</p>
                    </div>
                    <span className="text-xs text-orange-500">Hoy</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Focus semanal */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" variant="cyan" animate={false}>
            <div className="flex items-center gap-2 mb-4">
              <Timer size={16} className="text-cyan-600" />
              <h3 className="text-sm font-semibold text-gray-900">Foco Semanal</h3>
            </div>
            <div className="flex items-end gap-1 h-16">
              {Array.from({ length: 7 }, (_, i) => {
                const h = Math.random() * 4
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <motion.div className="rounded-t bg-cyan-400/60 hover:bg-cyan-500/80 transition-colors" style={{ height: `${h * 25}%` }} initial={{ height: 0 }} animate={{ height: `${h * 25}%` }} transition={{ delay: i * 0.05, duration: 0.5 }} />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1">
              {['L','M','X','J','V','S','D'].map(d => <span key={d} className="flex-1 text-center text-[9px] text-gray-400">{d}</span>)}
            </div>
            <p className="text-xs text-gray-400 mt-2">{Math.round(getWeekMinutes() / 60 * 10) / 10}h esta semana</p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Heatmap */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-500" /> Actividad — Últimos 6 meses
          </h3>
          <HeatmapGrid data={heatmapData} weeks={26} maxValue={habits.length} />
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <span>Menos</span>
            {[0,1,2,3,4].map(i => <div key={i} className={`w-3 h-3 rounded-sm heatmap-${i}`} />)}
            <span>Más</span>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
