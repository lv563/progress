'use client'

import { motion } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { BarChart3, TrendingUp, Target, Timer, Dumbbell, Zap, Calendar, Star } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, AreaChart, Area } from 'recharts'
import { GlassCard } from '@/components/ui/GlassCard'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { useHabitsStore } from '@/stores/habits.store'
import { usePomodoroStore } from '@/stores/pomodoro.store'
import { usePhysicalStore } from '@/stores/physical.store'
import { useAppStore } from '@/stores/app.store'
import { useTasksStore } from '@/stores/tasks.store'
import { useDailyLogStore } from '@/stores/dailyLog.store'
import { formatXP, getLevelTitle, levelProgress } from '@/lib/utils/format'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'

const tooltipStyle = {
  contentStyle: { background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '12px', color: '#111827' },
}

const SCORE_COLOR = (s: number) => s >= 80 ? '#10B981' : s >= 60 ? '#F59E0B' : '#EF4444'

export default function AnalyticsPage() {
  const { habits } = useHabitsStore()
  const { sessions: pomodoroSessions } = usePomodoroStore()
  const { workoutSessions } = usePhysicalStore()
  const { tasks } = useTasksStore()
  const { user } = useAppStore()
  const { getWeekLogs, logs } = useDailyLogStore()

  const weekLogs = getWeekLogs()
  const xpPct = user ? levelProgress(user.xp, user.level) : 0

  // Real week data from daily logs
  const weekHabits = weekLogs.map(l => ({
    day: format(new Date(l.date + 'T12:00:00'), 'EEE', { locale: es }),
    completados: l.habitsCompleted,
    total: l.habitTotal,
    pct: l.habitTotal > 0 ? Math.round((l.habitsCompleted / l.habitTotal) * 100) : 0,
  }))

  const weekFocus = weekLogs.map(l => ({
    day: format(new Date(l.date + 'T12:00:00'), 'EEE', { locale: es }),
    horas: Math.round(l.focusMinutes / 60 * 10) / 10,
    sesiones: l.pomodoroSessions,
  }))

  const weekScores = weekLogs.map(l => ({
    day: format(new Date(l.date + 'T12:00:00'), 'EEE', { locale: es }),
    score: l.score,
    fecha: format(new Date(l.date + 'T12:00:00'), "d MMM", { locale: es }),
  }))

  // Last 14 days for daily history
  const recentLogs = [...logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14)

  // Radar: real habit categories
  const categoryScores = ['spiritual', 'physical', 'mental', 'work', 'social', 'health'].map(cat => {
    const catHabits = habits.filter(h => h.category === cat)
    const avgCompletion = catHabits.length > 0
      ? Math.round(catHabits.reduce((a, h) => a + h.completionRate, 0) / catHabits.length * 100)
      : 0
    return {
      category: cat === 'spiritual' ? 'Espiritual' : cat === 'physical' ? 'Físico' : cat === 'mental' ? 'Mental' : cat === 'work' ? 'Trabajo' : cat === 'social' ? 'Social' : 'Salud',
      value: avgCompletion,
    }
  })

  const avgScore = weekLogs.length > 0
    ? Math.round(weekLogs.reduce((a, l) => a + l.score, 0) / weekLogs.length)
    : 0

  const totalFocusHours = Math.round(pomodoroSessions.filter(s => s.completed).reduce((a, s) => a + s.duration, 0) / 60 * 10) / 10

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <BarChart3 size={24} className="text-violet-600" /> Análisis
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Visión completa de tu progreso</p>
      </motion.div>

      {/* Key metrics */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Target size={18} />, label: 'Hábitos activos', val: habits.length, sub: `Prom. semanal: ${avgScore}pts`, color: '#7C3AED' },
          { icon: <Timer size={18} />, label: 'Horas de foco total', val: `${totalFocusHours}h`, sub: `${pomodoroSessions.filter(s => s.completed).length} sesiones`, color: '#06B6D4' },
          { icon: <Dumbbell size={18} />, label: 'Entrenos total', val: workoutSessions.filter(w => w.completed).length, sub: 'sesiones completadas', color: '#10B981' },
          { icon: <Zap size={18} />, label: 'XP Ganado', val: formatXP(user?.xp ?? 0), sub: `Lv.${user?.level} ${getLevelTitle(user?.level ?? 1)}`, color: '#F59E0B' },
        ].map(m => (
          <GlassCard key={m.label} className="p-4" animate={false}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${m.color}20`, color: m.color }}>
              {m.icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{m.val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
            <p className="text-xs" style={{ color: m.color }}>{m.sub}</p>
          </GlassCard>
        ))}
      </motion.div>

      {/* Weekly score trend */}
      {weekScores.length > 0 && (
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star size={16} className="text-amber-600" /> Puntaje diario — Esta semana
            </h3>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={weekScores}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v} pts`, 'Score']} />
                <Area type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2} fill="url(#scoreGrad)" dot={{ fill: '#7C3AED', r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Habits per day */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={16} className="text-violet-600" /> Hábitos completados — Esta semana
            </h3>
            {weekHabits.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekHabits} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [v, n === 'completados' ? 'Completados' : 'Total']} />
                  <Bar dataKey="total" fill="#F3F4F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completados" fill="#7C3AED" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Sin datos esta semana</div>
            )}
          </GlassCard>
        </motion.div>

        {/* Focus hours */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Timer size={16} className="text-cyan-600" /> Horas de foco — Esta semana
            </h3>
            {weekFocus.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weekFocus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}h`, 'Foco']} />
                  <Line type="monotone" dataKey="horas" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4', r: 3, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Sin datos esta semana</div>
            )}
          </GlassCard>
        </motion.div>

        {/* Life Radar */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-600" /> Balance de Vida
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={categoryScores}>
                <PolarGrid stroke="#F3F4F6" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Radar dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Level progress */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" variant="glow" animate={false}>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap size={16} className="text-amber-600" /> Progreso de Nivel
            </h3>
            <div className="flex items-center gap-6">
              <ProgressRing value={xpPct} size={100} strokeWidth={10} color="#F59E0B" animate={false}>
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{user?.level}</p>
                  <p className="text-[9px] text-gray-500">nivel</p>
                </div>
              </ProgressRing>
              <div className="flex-1 space-y-3">
                {[
                  { label: 'XP Total', val: formatXP(user?.xp ?? 0), color: '#F59E0B' },
                  { label: 'Racha máxima', val: `${user?.bestStreak}d`, color: '#F97316' },
                  { label: 'Días registrados', val: `${logs.length}`, color: '#7C3AED' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <span className="text-sm font-bold" style={{ color: s.color }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Daily history */}
      {recentLogs.length > 0 && (
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" /> Historial Diario
            </h3>
            <div className="space-y-2">
              {recentLogs.map(log => {
                const sc = SCORE_COLOR(log.score)
                return (
                  <div key={log.date} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    {/* Date */}
                    <div className="w-20 shrink-0">
                      <p className="text-xs font-semibold text-gray-900 capitalize">
                        {format(new Date(log.date + 'T12:00:00'), "EEE d MMM", { locale: es })}
                      </p>
                    </div>

                    {/* Score badge */}
                    <div className="w-10 shrink-0 text-center">
                      <span className="text-sm font-black" style={{ color: sc }}>{log.score}</span>
                      <p className="text-[9px] text-gray-400">pts</p>
                    </div>

                    {/* Mini bars */}
                    <div className="flex-1 grid grid-cols-4 gap-2 hidden sm:grid">
                      {[
                        { pct: log.habitTotal > 0 ? log.habitsCompleted / log.habitTotal : 0, color: '#7C3AED', label: `${log.habitsCompleted}/${log.habitTotal} háb` },
                        { pct: Math.min(log.pomodoroSessions / 6, 1), color: '#06B6D4', label: `${log.pomodoroSessions} pom` },
                        { pct: Math.min(log.waterGlasses / 8, 1), color: '#0EA5E9', label: `${log.waterGlasses}/8 agua` },
                        { pct: log.mealsTarget > 0 ? Math.min(log.mealsEaten / log.mealsTarget, 1) : 0, color: '#F97316', label: `${log.mealsEaten}/${log.mealsTarget} com` },
                      ].map((m, i) => (
                        <div key={i}>
                          <div className="h-1 rounded-full bg-gray-100 overflow-hidden mb-1">
                            <div className="h-full rounded-full" style={{ width: `${m.pct * 100}%`, background: m.color }} />
                          </div>
                          <p className="text-[9px] text-gray-400 text-center">{m.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Score bar */}
                    <div className="w-24 shrink-0">
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${log.score}%`, background: sc }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {recentLogs.length === 0 && (
        <motion.div variants={fadeUp}>
          <GlassCard className="p-10 text-center" animate={false}>
            <Calendar size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm">El historial diario aparecerá aquí al día siguiente de usar la app.</p>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  )
}
