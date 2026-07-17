'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import {
  Crown, Sword, BookOpen, Flame, Zap, Target, Check, X,
  Calendar, TrendingUp, ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useSeasonStore, MODE_DEFAULTS, type SeasonMode } from '@/stores/season.store'
import { usePomodoroStore } from '@/stores/pomodoro.store'
import { usePhysicalStore } from '@/stores/physical.store'
import { useTasksStore } from '@/stores/tasks.store'
import { format, eachDayOfInterval, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'

const MODE_ICONS: Record<SeasonMode, React.ReactNode> = {
  guerra: <Sword size={20} />,
  monje: <BookOpen size={20} />,
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 20
  const circ = 2 * Math.PI * r
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">{score}</text>
    </svg>
  )
}

export default function SeasonPage() {
  const { activeSeason, startSeason, endSeason, logDay, getSeasonProgress, getDayLog, getStreakCount } = useSeasonStore()
  const { getTodaySessions } = usePomodoroStore()
  const { getTodayWorkout, mealsToday } = usePhysicalStore()
  const { tasks } = useTasksStore()

  const [selectedMode, setSelectedMode] = useState<SeasonMode>('guerra')
  const [months, setMonths] = useState(3)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [logSpiritual, setLogSpiritual] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const progress = getSeasonProgress()
  const streak = getStreakCount()
  const todayLog = getDayLog(today)

  // Live data from other stores
  const todayPomodoros = getTodaySessions().length
  const todayWorkout = !!getTodayWorkout()
  const todayMeals = mealsToday
  const todayTasks = useMemo(
    () => tasks.filter(t => t.status === 'done' && t.completedAt?.slice(0, 10) === today).length,
    [tasks, today]
  )

  const handleLogDay = () => {
    logDay(today, {
      pomodoros: todayPomodoros,
      tasksCompleted: todayTasks,
      workedOut: todayWorkout,
      meals: todayMeals,
      spiritual: logSpiritual,
    })
    setLogOpen(false)
  }

  // Last 14 days for calendar strip
  const last14 = useMemo(
    () => eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() }),
    []
  )

  if (!activeSeason) {
    return (
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6 max-w-2xl mx-auto">
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Crown size={24} className="text-amber-400" /> Temporada
          </h1>
          <p className="text-slate-500 text-sm mt-1">Elige un modo y lanza tu temporada de transformación</p>
        </motion.div>

        {/* Mode cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['guerra', 'monje'] as SeasonMode[]).map(mode => {
            const meta = MODE_DEFAULTS[mode]
            const selected = selectedMode === mode
            return (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={cn(
                  'text-left p-5 rounded-2xl border transition-all',
                  selected ? 'border-transparent' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]'
                )}
                style={selected ? { background: meta.bg, borderColor: `${meta.color}40`, boxShadow: `0 0 30px ${meta.color}15` } : undefined}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: meta.accent, color: meta.color }}>
                    {MODE_ICONS[mode]}
                  </div>
                  <div>
                    <p className="font-black text-white text-base">{meta.label}</p>
                    {selected && <p className="text-[10px] font-medium mt-0.5" style={{ color: meta.color }}>Seleccionado</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{meta.desc}</p>
                <div className="space-y-1">
                  {meta.pillars.map(p => (
                    <div key={p} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: meta.color }} />
                      {p}
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </motion.div>

        {/* Duration + launch */}
        <motion.div variants={fadeUp} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
          <div>
            <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" /> Duración
            </p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 6, 9, 12].map(m => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                    months === m ? 'text-white' : 'border-white/[0.06] text-slate-500 hover:text-slate-300'
                  )}
                  style={months === m ? {
                    background: `${MODE_DEFAULTS[selectedMode].color}20`,
                    borderColor: `${MODE_DEFAULTS[selectedMode].color}50`,
                    color: MODE_DEFAULTS[selectedMode].color,
                  } : undefined}
                >
                  {m === 1 ? '1 mes' : `${m} meses`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div>
              <p className="text-xs text-slate-500">Inicio</p>
              <p className="text-sm font-bold text-white">{format(new Date(), "d 'de' MMMM yyyy", { locale: es })}</p>
            </div>
            <div className="text-slate-700">→</div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Fin</p>
              <p className="text-sm font-bold text-white">
                {(() => { const d = new Date(); d.setMonth(d.getMonth() + months); return format(d, "d 'de' MMMM yyyy", { locale: es }) })()}
              </p>
            </div>
          </div>

          <Button
            variant="glow"
            className="w-full"
            onClick={() => startSeason(selectedMode, months)}
            style={{ background: `linear-gradient(135deg, ${MODE_DEFAULTS[selectedMode].color} 0%, ${MODE_DEFAULTS[selectedMode].color}BB 100%)` }}
          >
            {MODE_ICONS[selectedMode]}
            <span>Lanzar {MODE_DEFAULTS[selectedMode].label}</span>
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  const meta = MODE_DEFAULTS[activeSeason.mode]
  const goals = activeSeason.goals

  const checkItems = [
    {
      key: 'pomodoros',
      label: 'Pomodoros',
      current: todayPomodoros,
      target: goals.pomodorosPerDay,
      done: todayPomodoros >= goals.pomodorosPerDay,
      icon: <Zap size={14} />,
    },
    {
      key: 'workout',
      label: 'Entrenamiento',
      current: todayWorkout ? 1 : 0,
      target: 1,
      done: todayWorkout,
      icon: <Flame size={14} />,
    },
    {
      key: 'meals',
      label: 'Comidas',
      current: todayMeals,
      target: goals.mealsPerDay,
      done: todayMeals >= goals.mealsPerDay,
      icon: <span className="text-xs">🍽</span>,
    },
    {
      key: 'tasks',
      label: 'Tareas',
      current: todayTasks,
      target: goals.tasksPerDay,
      done: todayTasks >= goals.tasksPerDay,
      icon: <Target size={14} />,
    },
    {
      key: 'spiritual',
      label: 'Espiritual',
      current: (todayLog?.spiritual || logSpiritual) ? 1 : 0,
      target: 1,
      done: todayLog?.spiritual || logSpiritual,
      icon: <span className="text-xs">🙏</span>,
    },
  ]

  const liveScore = Math.round(
    (Math.min(1, todayPomodoros / goals.pomodorosPerDay) * 30) +
    (todayWorkout ? 25 : 0) +
    (Math.min(1, todayMeals / goals.mealsPerDay) * 20) +
    (Math.min(1, todayTasks / goals.tasksPerDay) * 15) +
    ((todayLog?.spiritual || logSpiritual) ? 10 : 0)
  )

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: meta.accent, color: meta.color }}>
            {MODE_ICONS[activeSeason.mode]}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{activeSeason.name}</h1>
            <p className="text-xs text-slate-500">
              {progress ? `Día ${progress.daysPassed} de ${progress.daysTotal}` : ''}
              {streak > 0 && <span className="text-amber-400 font-semibold ml-2">🔥 {streak} días seguidos</span>}
            </p>
          </div>
        </div>
        <button onClick={() => setConfirmEnd(true)} className="text-xs text-slate-700 hover:text-slate-400 transition-colors flex items-center gap-1">
          <ChevronLeft size={12} /> Terminar
        </button>
      </motion.div>

      {/* Progress bar */}
      {progress && (
        <motion.div variants={fadeUp}>
          <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Progreso de la temporada</span>
              <span className="text-xs font-bold" style={{ color: meta.color }}>{progress.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: meta.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress.pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-700">{format(new Date(activeSeason.startDate), "d MMM", { locale: es })}</span>
              <span className="text-[10px] text-slate-700">{format(new Date(activeSeason.endDate), "d MMM yyyy", { locale: es })}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Today checklist */}
      <motion.div variants={fadeUp}>
        <div className="p-5 rounded-2xl border bg-white/[0.02]" style={{ borderColor: `${meta.color}30` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Hoy — {format(new Date(), "EEEE d", { locale: es })}</h3>
            <div className="flex items-center gap-3">
              <ScoreRing score={liveScore} color={meta.color} />
              <Button size="sm" variant="glow" onClick={() => setLogOpen(true)}
                style={{ background: meta.color }}>
                Guardar día
              </Button>
            </div>
          </div>
          <div className="space-y-2.5">
            {checkItems.map(item => (
              <div key={item.key} className="flex items-center gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all',
                  item.done ? 'bg-emerald-500/20' : 'bg-white/[0.04]'
                )}>
                  {item.done
                    ? <Check size={13} className="text-emerald-400" />
                    : <span className="opacity-40" style={{ color: meta.color }}>{item.icon}</span>
                  }
                </div>
                <span className={cn('text-sm flex-1', item.done ? 'text-white' : 'text-slate-500')}>
                  {item.label}
                </span>
                <span className="text-xs font-mono" style={{ color: item.done ? '#10B981' : '#475569' }}>
                  {item.current}/{item.target}
                </span>
                {/* Mini progress */}
                <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (item.current / item.target) * 100)}%`,
                      background: item.done ? '#10B981' : meta.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 14-day calendar strip */}
      <motion.div variants={fadeUp}>
        <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-3">Últimos 14 días</p>
          <div className="grid grid-cols-7 gap-1.5">
            {last14.map(day => {
              const key = day.toISOString().slice(0, 10)
              const log = activeSeason.dayLogs.find(d => d.date === key)
              const isToday = key === today
              const isFuture = day > new Date()
              return (
                <div
                  key={key}
                  className={cn(
                    'flex flex-col items-center gap-0.5 p-1.5 rounded-xl border transition-all',
                    isToday ? 'border-white/20' : 'border-white/[0.04]',
                  )}
                  style={isToday ? { borderColor: `${meta.color}50` } : undefined}
                >
                  <span className="text-[9px] text-slate-700">{format(day, 'EEE', { locale: es }).slice(0, 2)}</span>
                  <span className="text-[10px] font-bold text-slate-500">{format(day, 'd')}</span>
                  {!isFuture && log ? (
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: log.score >= 80 ? `${meta.color}30` : log.score >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.15)',
                        color: log.score >= 80 ? meta.color : log.score >= 50 ? '#F59E0B' : '#EF4444',
                      }}
                    >
                      {log.score}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-white/[0.03] flex items-center justify-center">
                      <span className="text-slate-800 text-[9px]">{isFuture ? '' : '—'}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 mt-3 text-[10px] text-slate-700">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: `${meta.color}40` }} />≥80 excelente</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-amber-500/30" />≥50 bien</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-red-500/25" />&lt;50 mejorar</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Días registrados', value: activeSeason.dayLogs.length, color: meta.color },
          { label: 'Promedio score', value: activeSeason.dayLogs.length > 0 ? Math.round(activeSeason.dayLogs.reduce((a, d) => a + d.score, 0) / activeSeason.dayLogs.length) : '—', color: '#10B981' },
          { label: 'Días perfectos', value: activeSeason.dayLogs.filter(d => d.score >= 80).length, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
            <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-slate-600 mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Log spiritual modal */}
      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Guardar día">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
            {checkItems.map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span style={{ color: item.done ? '#10B981' : '#475569' }}>{item.icon}</span>
                  {item.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">{item.current}/{item.target}</span>
                  {item.done
                    ? <Check size={14} className="text-emerald-400" />
                    : <X size={14} className="text-slate-700" />
                  }
                </div>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div
              onClick={() => setLogSpiritual(v => !v)}
              className={cn(
                'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                logSpiritual ? 'bg-violet-500/30 border-violet-500' : 'border-white/20'
              )}
            >
              {logSpiritual && <Check size={11} className="text-violet-300" />}
            </div>
            <span className="text-sm text-slate-300">🙏 Práctica espiritual completada</span>
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setLogOpen(false)}>Cancelar</Button>
            <Button variant="glow" onClick={handleLogDay}
              style={{ background: meta.color }}>
              <Check size={14} /> Guardar día
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm end modal */}
      <Modal open={confirmEnd} onClose={() => setConfirmEnd(false)} title="¿Terminar temporada?">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Esta acción marcará la temporada como finalizada. El historial se conserva.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmEnd(false)}>Cancelar</Button>
            <Button variant="glow" onClick={() => { endSeason(); setConfirmEnd(false) }}
              style={{ background: '#EF4444' }}>
              Terminar temporada
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
