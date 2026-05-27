'use client'

import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { Flame, Zap, Target, Timer, Dumbbell, Church, CheckSquare, Droplets, Star } from 'lucide-react'
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
import { formatXP, getLevelTitle, levelProgress } from '@/lib/utils/format'

export default function DashboardPage() {
  const { user, addXP } = useAppStore()
  const { habits, getTodayLogs, getStreakDates } = useHabitsStore()
  const { getTodaySessions, getWeekMinutes } = usePomodoroStore()
  const { getTodayTasks } = useTasksStore()
  const { waterToday, getWeekSessions, getLatestMeasurement } = usePhysicalStore()
  const { getPendingFollowUps } = useMinistryStore()

  const today = format(new Date(), "EEEE, d 'de' MMMM")
  const todayLogs = getTodayLogs()
  const todayPomodoros = getTodaySessions()
  const todayTasks = getTodayTasks()
  const weekGymSessions = getWeekSessions()
  const pendingFollowUps = getPendingFollowUps()
  const latestWeight = getLatestMeasurement()
  const xpPct = user ? levelProgress(user.xp, user.level) : 0

  const completedHabits = habits.filter(h => todayLogs[h.id]?.completed).length
  const totalHabits = habits.length
  const habitPct = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0

  const heatmapData = habits.reduce((acc, h) => {
    getStreakDates(h.id).forEach(date => {
      acc[date] = (acc[date] ?? 0) + 1
    })
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
          <p className="text-slate-400 text-sm capitalize">{today}</p>
          <h1 className="text-2xl font-black text-white mt-0.5">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'Kingdom'} 👋
          </h1>
        </div>
        {user && (
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
              <Flame size={16} className="text-orange-400 animate-streak-fire" />
              <span className="text-orange-400 font-bold">{user.streak} días</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Top stats row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Racha Actual"
          value={`🔥 ${user?.streak ?? 0}d`}
          subValue={`Récord: ${user?.bestStreak ?? 0}d`}
          icon={<Flame size={18} />}
          color="#F97316"
        />
        <StatCard
          label="XP Total"
          value={formatXP(user?.xp ?? 0)}
          subValue={`Lv.${user?.level ?? 1} — ${getLevelTitle(user?.level ?? 1)}`}
          icon={<Zap size={18} />}
          color="#F59E0B"
        />
        <StatCard
          label="Hábitos Hoy"
          value={`${completedHabits}/${totalHabits}`}
          subValue={`${Math.round(habitPct)}% completado`}
          icon={<Target size={18} />}
          color="#7C3AED"
        />
        <StatCard
          label="Pomodoros Hoy"
          value={`🏅 ${todayPomodoros.length}`}
          subValue={`${Math.round(todayPomodoros.reduce((a, s) => a + s.duration, 0) / 60 * 10) / 10}h de foco`}
          icon={<Timer size={18} />}
          color="#06B6D4"
        />
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Habit Rings */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5 h-full" animate={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Target size={16} className="text-violet-400" /> Hábitos de Hoy
              </h3>
              <span className="text-xs text-slate-500">{completedHabits}/{totalHabits}</span>
            </div>
            <div className="space-y-3">
              {habits.slice(0, 5).map(habit => {
                const log = todayLogs[habit.id]
                const val = log?.value ?? 0
                const pct = Math.min((val / habit.target) * 100, 100)
                const done = log?.completed ?? false
                return (
                  <div key={habit.id} className="flex items-center gap-3">
                    <ProgressRing
                      value={pct}
                      size={36}
                      strokeWidth={4}
                      color={done ? '#10B981' : habit.color}
                      animate={false}
                    >
                      <span className="text-sm">{habit.icon}</span>
                    </ProgressRing>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">{habit.name}</p>
                        {done && <span className="text-xs text-emerald-400">✓</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Flame size={10} className="text-orange-400" />
                        <span className="text-[10px] text-slate-500">{habit.streak}d racha</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { addXP(10, `Hábito: ${habit.name}`) }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.05] text-slate-500 hover:bg-violet-500/20 hover:text-violet-400'}`}
                    >
                      {done ? '✓' : '○'}
                    </button>
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
              <h3 className="font-semibold text-white flex items-center gap-2">
                <CheckSquare size={16} className="text-cyan-400" /> Tareas de Hoy
              </h3>
              <span className="text-xs text-slate-500">{todayTasks.length} pendientes</span>
            </div>
            {todayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-slate-600">
                <CheckSquare size={24} className="mb-2 opacity-40" />
                <p className="text-sm">¡Todo completado!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <div className={`mt-0.5 w-4 h-4 rounded-md border-2 shrink-0 ${
                      task.priority === 'p0' ? 'border-red-500' :
                      task.priority === 'p1' ? 'border-orange-500' :
                      'border-white/20'
                    }`} />
                    <p className="text-sm text-slate-300 leading-tight">{task.title}</p>
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
                <span className="text-lg font-black text-white">{user?.level}</span>
              </ProgressRing>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Nivel actual</p>
                <p className="text-lg font-bold text-white">{getLevelTitle(user?.level ?? 1)}</p>
                <p className="text-xs text-amber-400">{formatXP(user?.xp ?? 0)} XP</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Progreso al siguiente nivel</span>
                <span className="text-amber-400">{Math.round(xpPct)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-xp"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1.2, ease: [0.0, 0.0, 0.2, 1] }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: '🔥', label: 'Racha', val: `${user?.streak}d` },
                { icon: '🏅', label: 'Focus', val: `${todayPomodoros.length}` },
                { icon: '💪', label: 'Gym', val: `${weekGymSessions.length}w` },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-white/[0.04]">
                  <p className="text-base">{s.icon}</p>
                  <p className="text-xs font-bold text-white">{s.val}</p>
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Water + Gym quick stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <GlassCard className="p-4" animate={false}>
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={16} className="text-cyan-400" />
              <span className="text-sm font-semibold text-white">Agua</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-md text-center text-sm transition-all ${
                    i < waterToday ? 'bg-cyan-500/30 text-cyan-400' : 'bg-white/[0.04] text-slate-700'
                  }`}
                >
                  💧
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">{waterToday}/8 vasos</p>
          </GlassCard>

          <GlassCard className="p-4" animate={false}>
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell size={16} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white">Gym</span>
            </div>
            <p className="text-2xl font-black text-white">{weekGymSessions.length}</p>
            <p className="text-xs text-slate-500">sesiones esta semana</p>
            {latestWeight && (
              <p className="text-xs text-emerald-400 mt-1">{latestWeight.weight} kg</p>
            )}
          </GlassCard>
        </motion.div>

        {/* Ministry Follow-ups */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" variant="violet" animate={false}>
            <div className="flex items-center gap-2 mb-4">
              <Church size={16} className="text-pink-400" />
              <h3 className="text-sm font-semibold text-white">Seguimientos Pendientes</h3>
              {pendingFollowUps.length > 0 && (
                <span className="ml-auto bg-pink-500/30 text-pink-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {pendingFollowUps.length}
                </span>
              )}
            </div>
            {pendingFollowUps.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">¡Sin seguimientos pendientes! 🎉</p>
            ) : (
              <div className="space-y-2">
                {pendingFollowUps.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.04]">
                    <div className="w-7 h-7 rounded-full gradient-spirit flex items-center justify-center text-xs font-bold text-white">
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.followUpType}</p>
                    </div>
                    <span className="text-xs text-orange-400">Hoy</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Pomodoro widget */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" variant="cyan" animate={false}>
            <div className="flex items-center gap-2 mb-4">
              <Timer size={16} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Foco Semanal</h3>
            </div>
            <div className="flex items-end gap-1 h-16">
              {Array.from({ length: 7 }, (_, i) => {
                const h = Math.random() * 4
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <motion.div
                      className="rounded-t bg-cyan-500/40 hover:bg-cyan-500/70 transition-colors cursor-default"
                      style={{ height: `${h * 25}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${h * 25}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1">
              {['L','M','X','J','V','S','D'].map(d => (
                <span key={d} className="flex-1 text-center text-[9px] text-slate-600">{d}</span>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">{Math.round(getWeekMinutes() / 60 * 10) / 10}h esta semana</p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Heatmap */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-400" /> Actividad — Últimos 6 meses
          </h3>
          <HeatmapGrid data={heatmapData} weeks={26} maxValue={habits.length} />
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
            <span>Menos</span>
            {[0,1,2,3,4].map(i => <div key={i} className={`w-3 h-3 rounded-sm heatmap-${i}`} />)}
            <span>Más</span>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
