'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { Flame, Zap, Target, Timer, Dumbbell, Church, CheckSquare, Droplets, Star, TrendingUp, ChevronDown, ChevronUp, Snowflake, ArrowRight } from 'lucide-react'
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
import { useWinterArcStore } from '@/stores/winterArc.store'
import { formatXP, getLevelTitle, levelProgress } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { useState, useMemo } from 'react'
import Link from 'next/link'

function YesterdayCard({ log }: { log: DailyLog }) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor = log.score >= 80 ? '#FFFFFF' : log.score >= 60 ? '#CCCCCC' : '#EF4444'
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
    { label: 'Hábitos', val: `${log.habitsCompleted}/${log.habitTotal}`, pct: log.habitTotal > 0 ? log.habitsCompleted / log.habitTotal : 0, color: '#EF4444' },
    { label: 'Pomodoros', val: `${log.pomodoroSessions}`, pct: Math.min(log.pomodoroSessions / 6, 1), color: '#EF4444' },
    { label: 'Agua', val: `${log.waterGlasses}/8`, pct: Math.min(log.waterGlasses / 8, 1), color: '#888888' },
    { label: 'Comidas', val: `${log.mealsEaten}/${log.mealsTarget}`, pct: log.mealsTarget > 0 ? Math.min(log.mealsEaten / log.mealsTarget, 1) : 0, color: '#EF4444' },
  ]

  return (
    <GlassCard className="p-4" animate={false}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-gray-600" />
          <span className="text-sm font-bold text-white">Resumen de ayer</span>
          <span className="text-xs text-gray-600">
            {format(new Date(log.date + 'T00:00:00'), "d 'de' MMM", { locale: es })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black" style={{ color: scoreColor }}>{log.score}</span>
            <div>
              <p className="text-[9px] text-gray-600 leading-none">/100</p>
              <p className="text-[10px] font-bold leading-none" style={{ color: scoreColor }}>{scoreLabel}</p>
            </div>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-600 hover:text-gray-400 transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {metrics.map(m => (
          <div key={m.label}>
            <div className="h-1 rounded-full bg-white/8 overflow-hidden mb-1">
              <div className="h-full rounded-full transition-all" style={{ width: `${m.pct * 100}%`, background: m.color }} />
            </div>
            <p className="text-[10px] font-black text-white text-center">{m.val}</p>
            <p className="text-[9px] text-gray-600 text-center">{m.label}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {expanded && tips.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/6 space-y-1.5">
              <p className="text-[10px] text-gray-600 uppercase tracking-wide font-bold mb-2">Para mejorar hoy</p>
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0 mt-1" />
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

export default function DashboardPage() {
  const { user } = useAppStore()
  const { habits, getTodayLogs, getStreakDates } = useHabitsStore()
  const { getTodaySessions, getWeekMinutes, sessions: pomodoroSessions } = usePomodoroStore()
  const { getTodayTasks } = useTasksStore()
  const { waterLogs, waterConfig, getWeekSessions, getLatestMeasurement } = usePhysicalStore()
  const waterToday = waterLogs[new Date().toISOString().slice(0, 10)] ?? 0
  const { getPendingFollowUps } = useMinistryStore()
  const { getYesterdayLog } = useDailyLogStore()
  const winterArc = useWinterArcStore()
  const winterActive = winterArc.isActive

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es })
  const todayLogs = getTodayLogs()
  const todayPomodoros = getTodaySessions()
  const todayTasks = getTodayTasks()
  const weekGymSessions = getWeekSessions()
  const pendingFollowUps = getPendingFollowUps()
  const latestWeight = getLatestMeasurement()
  const xpPct = user ? levelProgress(user.xp, user.level) : 0
  const yesterdayLog = getYesterdayLog()

  const weekFocusHours = useMemo(() => {
    const now = new Date()
    const dow = now.getDay() // 0=Sun
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - ((dow === 0 ? 6 : dow - 1) - i))
      const ds = d.toISOString().slice(0, 10)
      return pomodoroSessions
        .filter(s => s.completed && s.startedAt?.startsWith(ds))
        .reduce((acc, s) => acc + s.duration, 0) / 60
    })
  }, [pomodoroSessions])

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
          <p className="text-gray-600 text-sm capitalize">{today}</p>
          <h1 className="text-2xl font-black text-white mt-0.5">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'Kingdom'} 👋
          </h1>
        </div>
        {user && (
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#EF4444]/10 border border-[#EF4444]/20 px-3 py-2 rounded-xl">
              <Flame size={16} className="text-[#EF4444] animate-streak-fire" />
              <span className="text-[#EF4444] font-bold">{user.streak} días</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Winter Arc banner */}
      {winterActive && winterArc.config && (
        <motion.div variants={fadeUp}>
          <Link href="/dashboard/winter-arc"
            className="block bg-[#0D0D0D] rounded-2xl p-4 border border-white/8 hover:border-[#EF4444]/30 transition-all group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#EF4444]/8 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="shrink-0">
                <p className="text-[9px] tracking-[0.4em] text-[#EF4444] font-bold">❄ WINTER ARC</p>
                <p className="text-2xl font-black text-white leading-none">
                  DAY <span className="text-[#EF4444]">{winterArc.getCurrentDay()}</span>
                  <span className="text-sm font-normal text-gray-600"> / {winterArc.config.duration}</span>
                </p>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-sm font-black text-white">{winterArc.getColdStreak()}<span className="text-[#EF4444]">❄</span></p>
                  <p className="text-[9px] text-gray-600">COLD STREAK</p>
                </div>
                <div>
                  <p className="text-sm font-black text-white">{winterArc.getTotalXP()}</p>
                  <p className="text-[9px] text-gray-600">XP</p>
                </div>
                <div>
                  <p className="text-sm font-black text-white">{winterArc.getAverageScore()}%</p>
                  <p className="text-[9px] text-gray-600">AVG SCORE</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#EF4444] shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Yesterday summary */}
      {yesterdayLog && (
        <motion.div variants={fadeUp}>
          <YesterdayCard log={yesterdayLog} />
        </motion.div>
      )}

      {/* Top stats row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Racha Actual" value={`🔥 ${user?.streak ?? 0}d`} subValue={`Récord: ${user?.bestStreak ?? 0}d`} icon={<Flame size={18} />} color="#EF4444" />
        <StatCard label="XP Total" value={formatXP(user?.xp ?? 0)} subValue={`Lv.${user?.level ?? 1} — ${getLevelTitle(user?.level ?? 1)}`} icon={<Zap size={18} />} color="#EF4444" />
        <StatCard label="Hábitos Hoy" value={`${completedHabits}/${totalHabits}`} subValue={`${Math.round(habitPct)}% completado`} icon={<Target size={18} />} color="#EF4444" />
        <StatCard label="Pomodoros Hoy" value={`🏅 ${todayPomodoros.length}`} subValue={`${Math.round(todayPomodoros.reduce((a, s) => a + s.duration, 0) / 60 * 10) / 10}h de foco`} icon={<Timer size={18} />} color="#EF4444" />
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Habit list */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5 h-full" animate={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Target size={16} className="text-[#EF4444]" /> Hábitos de Hoy
              </h3>
              <span className="text-xs text-gray-600">{completedHabits}/{totalHabits}</span>
            </div>
            <div className="space-y-3">
              {habits.slice(0, 5).map(habit => {
                const log = todayLogs[habit.id]
                const val = log?.value ?? 0
                const pct = Math.min((val / habit.target) * 100, 100)
                const done = log?.completed ?? false
                return (
                  <div key={habit.id} className="flex items-center gap-3">
                    <ProgressRing value={pct} size={36} strokeWidth={4} color={done ? '#FFFFFF' : '#EF4444'} animate={false}>
                      <span className="text-sm">{habit.icon}</span>
                    </ProgressRing>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">{habit.name}</p>
                        {done && <span className="text-xs text-white">✓</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Flame size={10} className="text-[#EF4444]" />
                        <span className="text-[10px] text-gray-600">{habit.streak}d racha</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {habits.length === 0 && <p className="text-sm text-gray-600 text-center py-4">Sin hábitos configurados</p>}
            </div>
          </GlassCard>
        </motion.div>

        {/* Today tasks */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5 h-full" animate={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <CheckSquare size={16} className="text-[#EF4444]" /> Tareas de Hoy
              </h3>
              <span className="text-xs text-gray-600">{todayTasks.length} pendientes</span>
            </div>
            {todayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-gray-600">
                <CheckSquare size={24} className="mb-2 opacity-40" />
                <p className="text-sm">¡Todo completado!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <div className={cn('mt-0.5 w-4 h-4 rounded-md border-2 shrink-0', task.priority === 'p0' ? 'border-red-500' : task.priority === 'p1' ? 'border-white/40' : 'border-white/20')} />
                    <p className="text-sm text-gray-300 leading-tight">{task.title}</p>
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
              <ProgressRing value={xpPct} size={64} strokeWidth={6} color="#EF4444" animate={false}>
                <span className="text-lg font-black text-white">{user?.level}</span>
              </ProgressRing>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Nivel actual</p>
                <p className="text-lg font-black text-white">{getLevelTitle(user?.level ?? 1)}</p>
                <p className="text-xs text-[#EF4444] font-bold">{formatXP(user?.xp ?? 0)} XP</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Progreso al siguiente nivel</span>
                <span className="text-[#EF4444] font-bold">{Math.round(xpPct)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div className="h-full rounded-full bg-[#EF4444]" initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: [0.0, 0.0, 0.2, 1] }} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: '🔥', label: 'Racha', val: `${user?.streak}d` },
                { icon: '🏅', label: 'Focus', val: `${todayPomodoros.length}` },
                { icon: '💪', label: 'Gym', val: `${weekGymSessions.length}w` },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-white/[0.04] border border-white/6">
                  <p className="text-base">{s.icon}</p>
                  <p className="text-xs font-black text-white">{s.val}</p>
                  <p className="text-[10px] text-gray-600">{s.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Water + Gym */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <GlassCard className="p-4" animate={false}>
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={16} className="text-gray-400" />
              <span className="text-sm font-bold text-white">Agua</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: Math.max(1, Math.ceil(waterConfig.goalLiters / (waterConfig.containerMl / 1000))) }, (_, i) => (
                <div key={i} className={cn('w-6 h-6 rounded-md text-center text-sm transition-all', i < waterToday ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-700')}>
                  💧
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">{(waterToday * waterConfig.containerMl / 1000).toFixed(1)}L / {waterConfig.goalLiters}L</p>
          </GlassCard>
          <GlassCard className="p-4" animate={false}>
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell size={16} className="text-gray-400" />
              <span className="text-sm font-bold text-white">Gym</span>
            </div>
            <p className="text-2xl font-black text-white">{weekGymSessions.length}</p>
            <p className="text-xs text-gray-600">sesiones esta semana</p>
            {latestWeight && <p className="text-xs text-gray-300 mt-1">{latestWeight.weight} kg</p>}
          </GlassCard>
        </motion.div>

        {/* Ministry */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <div className="flex items-center gap-2 mb-4">
              <Church size={16} className="text-[#EF4444]" />
              <h3 className="text-sm font-bold text-white">Seguimientos Pendientes</h3>
              {pendingFollowUps.length > 0 && (
                <span className="ml-auto bg-[#EF4444]/15 text-[#EF4444] text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingFollowUps.length}</span>
              )}
            </div>
            {pendingFollowUps.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">¡Sin seguimientos pendientes! 🎉</p>
            ) : (
              <div className="space-y-2">
                {pendingFollowUps.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.04]">
                    <div className="w-7 h-7 rounded-full bg-[#EF4444]/20 flex items-center justify-center text-xs font-black text-[#EF4444]">{p.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-600">{p.followUpType}</p>
                    </div>
                    <span className="text-xs text-[#EF4444]">Hoy</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Focus semanal */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <div className="flex items-center gap-2 mb-4">
              <Timer size={16} className="text-[#EF4444]" />
              <h3 className="text-sm font-bold text-white">Foco Semanal</h3>
            </div>
            <div className="flex items-end gap-1 h-16">
              {weekFocusHours.map((h, i) => {
                const maxH = Math.max(...weekFocusHours, 1)
                const pct = Math.max((h / maxH) * 100, h > 0 ? 8 : 0)
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <motion.div className="rounded-t bg-[#EF4444]/25 hover:bg-[#EF4444]/40 transition-colors" style={{ height: `${pct}%` }} initial={{ height: 0 }} animate={{ height: `${pct}%` }} transition={{ delay: i * 0.05, duration: 0.5 }} />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1">
              {['L','M','X','J','V','S','D'].map(d => <span key={d} className="flex-1 text-center text-[9px] text-gray-600">{d}</span>)}
            </div>
            <p className="text-xs text-gray-600 mt-2">{Math.round(getWeekMinutes() / 60 * 10) / 10}h esta semana</p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Heatmap */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Star size={16} className="text-[#EF4444]" /> Actividad — Últimos 6 meses
          </h3>
          <HeatmapGrid data={heatmapData} weeks={26} maxValue={habits.length} />
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
            <span>Menos</span>
            {[0,1,2,3,4].map(i => <div key={i} className={`w-3 h-3 rounded-sm heatmap-${i}`} />)}
            <span>Más</span>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
