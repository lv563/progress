'use client'

import { motion } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { BarChart3, TrendingUp, Target, Timer, Dumbbell, Zap } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { GlassCard } from '@/components/ui/GlassCard'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { useHabitsStore } from '@/stores/habits.store'
import { usePomodoroStore } from '@/stores/pomodoro.store'
import { usePhysicalStore } from '@/stores/physical.store'
import { useAppStore } from '@/stores/app.store'
import { formatXP, getLevelTitle, levelProgress } from '@/lib/utils/format'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function AnalyticsPage() {
  const { habits } = useHabitsStore()
  const { sessions: pomodoroSessions } = usePomodoroStore()
  const { workoutSessions, measurements } = usePhysicalStore()
  const { user } = useAppStore()

  const weekHabits = DAYS.map((d) => ({
    day: d,
    completados: Math.floor(Math.random() * habits.length),
    total: habits.length,
  }))

  const weekFocus = DAYS.map(d => ({
    day: d,
    horas: Math.round(Math.random() * 4 * 10) / 10,
  }))

  const radarData = [
    { category: 'Espiritual', value: 85 },
    { category: 'Físico',     value: 72 },
    { category: 'Mental',     value: 68 },
    { category: 'Trabajo',    value: 90 },
    { category: 'Social',     value: 60 },
    { category: 'Salud',      value: 78 },
  ]

  const xpPct = user ? levelProgress(user.xp, user.level) : 0

  const tooltipStyle = {
    contentStyle: { background: '#1A1A27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px', color: '#F8FAFC' },
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BarChart3 size={24} className="text-violet-400" /> Análisis
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Visión completa de tu progreso</p>
      </motion.div>

      {/* Key metrics */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Target size={18} />, label: 'Hábitos activos', val: habits.length, sub: `${Math.round(habits.reduce((a, h) => a + h.completionRate, 0) / Math.max(habits.length, 1) * 100)}% tasa`, color: '#7C3AED' },
          { icon: <Timer size={18} />, label: 'Pomodoros total', val: pomodoroSessions.filter(s => s.completed).length, sub: `${Math.round(pomodoroSessions.filter(s => s.completed).reduce((a, s) => a + s.duration, 0) / 60)}h focus`, color: '#06B6D4' },
          { icon: <Dumbbell size={18} />, label: 'Entrenos total', val: workoutSessions.filter(w => w.completed).length, sub: 'sesiones completas', color: '#10B981' },
          { icon: <Zap size={18} />, label: 'XP Ganado', val: formatXP(user?.xp ?? 0), sub: `Lv.${user?.level} ${getLevelTitle(user?.level ?? 1)}`, color: '#F59E0B' },
        ].map(m => (
          <GlassCard key={m.label} className="p-4" animate={false}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}20`, color: m.color }}>
                {m.icon}
              </div>
            </div>
            <p className="text-2xl font-black text-white">{m.val}</p>
            <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
            <p className="text-xs" style={{ color: m.color }}>{m.sub}</p>
          </GlassCard>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hábitos por día */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Target size={16} className="text-violet-400" /> Hábitos — Esta semana
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weekHabits} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="completados" fill="#7C3AED" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="total" fill="rgba(255,255,255,0.06)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Focus hours */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Timer size={16} className="text-cyan-400" /> Horas de foco — Esta semana
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weekFocus}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v}h`, 'Foco']} />
                <Line type="monotone" dataKey="horas" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4', r: 3, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Life Radar */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-400" /> Balance de Vida
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Radar dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Level progress */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" variant="glow" animate={false}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Zap size={16} className="text-amber-400" /> Progreso de Nivel
            </h3>
            <div className="flex items-center gap-6">
              <ProgressRing value={xpPct} size={100} strokeWidth={10} color="#F59E0B" animate={false}>
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{user?.level}</p>
                  <p className="text-[9px] text-slate-500">nivel</p>
                </div>
              </ProgressRing>
              <div className="flex-1 space-y-3">
                {[
                  { label: 'XP Total', val: formatXP(user?.xp ?? 0), color: '#F59E0B' },
                  { label: 'Racha máxima', val: `${user?.bestStreak}d`, color: '#F97316' },
                  { label: 'Insignias', val: `${user?.badges.length ?? 0}`, color: '#7C3AED' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{s.label}</span>
                    <span className="text-sm font-bold" style={{ color: s.color }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  )
}
