'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { Play, Pause, Square, SkipForward, Timer, Maximize2, Minimize2, Settings2, Flame, Zap, Coffee, Leaf, History } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Modal } from '@/components/ui/Modal'
import { usePomodoroStore } from '@/stores/pomodoro.store'
import { useStudyStore } from '@/stores/study.store'
import { StudySection } from './StudySection'
import { useAppStore } from '@/stores/app.store'
import { formatTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { PomodoroMode } from '@/types'

const MODE_META: Record<PomodoroMode, { label: string; icon: React.ReactNode; color: string; bg: string; tip: string }> = {
  'focus':       { label: 'Foco',           icon: <Zap size={14}/>,    color: '#00D4B8', bg: 'rgba(6,182,212,0.08)',   tip: 'Modo de máxima concentración' },
  'short-break': { label: 'Descanso corto', icon: <Coffee size={14}/>, color: '#10B981', bg: 'rgba(16,185,129,0.08)',  tip: 'Descansa los ojos, estírate' },
  'long-break':  { label: 'Descanso largo', icon: <Leaf size={14}/>,   color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   tip: 'Recarga completa · bien ganado' },
  'deep-work':   { label: 'Deep Work',      icon: <Flame size={14}/>,  color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  tip: '90 min de trabajo profundo' },
}

const MOTIVATIONAL: Record<PomodoroMode, string[]> = {
  'focus':       ['Cierra las redes. Abre tu mente.', 'Un bloque a la vez.', 'El foco es tu superpoder.', 'Sin distracciones. Solo tú y la tarea.'],
  'short-break': ['Respira profundo. Vuelves pronto.', 'Mueve el cuerpo un minuto.', '5 minutos recargando.', 'Bien hecho. Descansa.'],
  'long-break':  ['Te lo ganaste. Disfruta el descanso.', 'Recarga completa. Estás en racha.', 'Sal a caminar si puedes.'],
  'deep-work':   ['90 minutos sin interrupciones.', 'Trabajo profundo = resultados reales.', 'Esto moverá la aguja.'],
}

const STAGE_LABELS = ['', 'Brote', 'Sapling', 'Creciendo', 'Con hojas', 'Fructificando', 'Árbol', 'Florecido', '¡Maestro!']

function GrowingTree({ count }: { count: number }) {
  const stage = Math.min(8, count)
  const show = (n: number) => stage >= n

  const gp = (delay = 0) => ({
    initial: { pathLength: 0 as number, opacity: 0 as number },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 0.8, ease: 'easeOut' as const, delay },
  })
  const fi = (delay = 0) => ({
    initial: { scale: 0 as number, opacity: 0 as number },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring' as const, stiffness: 200, damping: 15, delay },
  })

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 140 155" className="w-28 h-28">
        <ellipse cx="70" cy="147" rx="38" ry="5" fill="rgba(139,90,43,0.3)" />
        {show(1) && <motion.path d="M70 147 L70 100" stroke="#8B5A2B" strokeWidth="6" strokeLinecap="round" fill="none" {...gp(0)} />}
        {show(2) && <motion.path d="M70 118 Q52 106 40 100" stroke="#8B5A2B" strokeWidth="4" strokeLinecap="round" fill="none" {...gp(0.1)} />}
        {show(2) && <motion.path d="M70 118 Q88 106 100 100" stroke="#8B5A2B" strokeWidth="4" strokeLinecap="round" fill="none" {...gp(0.2)} />}
        {show(3) && <motion.path d="M70 107 Q58 94 50 87" stroke="#8B5A2B" strokeWidth="3" strokeLinecap="round" fill="none" {...gp(0.1)} />}
        {show(3) && <motion.path d="M70 107 Q82 94 90 87" stroke="#8B5A2B" strokeWidth="3" strokeLinecap="round" fill="none" {...gp(0.2)} />}
        {show(4) && <motion.circle cx="40" cy="94" r="18" fill="rgba(34,197,94,0.55)" {...fi(0.1)} />}
        {show(4) && <motion.circle cx="100" cy="94" r="18" fill="rgba(34,197,94,0.55)" {...fi(0.2)} />}
        {show(4) && <motion.circle cx="70" cy="78" r="24" fill="rgba(34,197,94,0.65)" {...fi(0.3)} />}
        {show(5) && <motion.circle cx="55" cy="87" r="13" fill="rgba(22,163,74,0.55)" {...fi(0.1)} />}
        {show(5) && <motion.circle cx="85" cy="87" r="13" fill="rgba(22,163,74,0.55)" {...fi(0.2)} />}
        {show(5) && <motion.circle cx="40" cy="101" r="5.5" fill="#EF4444" {...fi(0.3)} />}
        {show(6) && <motion.circle cx="100" cy="98" r="5.5" fill="#EF4444" {...fi(0.1)} />}
        {show(7) && <motion.circle cx="70" cy="66" r="5.5" fill="#F59E0B" {...fi(0.2)} />}
        {show(8) && <motion.circle cx="70" cy="56" r="20" fill="rgba(234,179,8,0.2)" {...fi(0)} />}
        {show(8) && (
          <>
            <motion.path d="M35 42 L35 52 M30 47 L40 47" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" {...fi(0.1)} />
            <motion.path d="M105 46 L105 56 M100 51 L110 51" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" {...fi(0.2)} />
            <motion.path d="M70 26 L70 36 M65 31 L75 31" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" {...fi(0.3)} />
          </>
        )}
      </svg>
      <p className="text-[10px] font-medium" style={{ color: stage > 0 ? '#22c55e99' : '#334155' }}>
        {stage > 0 ? STAGE_LABELS[stage] : 'Completa una sesión para plantar'}
      </p>
    </div>
  )
}

function HistoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { sessions } = usePomodoroStore()

  const grouped = useMemo(() => {
    const done = sessions.filter(s => s.completed)
    const map = new Map<string, typeof sessions>()
    for (const s of done) {
      const key = new Date(s.startedAt).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return Array.from(map.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([dateStr, ss]) => ({
        date: new Date(dateStr),
        sessions: [...ss].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
        totalMinutes: ss.reduce((acc, s) => acc + s.duration, 0),
      }))
  }, [sessions])

  return (
    <Modal open={open} onClose={onClose} title="Historial de sesiones">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {grouped.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">Sin sesiones registradas aún</div>
        ) : grouped.map(({ date, sessions: ss, totalMinutes }) => (
          <div key={date.toDateString()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-700 capitalize">
                {format(date, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <span className="text-[10px] text-gray-400">{Math.round(totalMinutes / 60 * 10) / 10}h · {ss.length} ses.</span>
            </div>
            <div className="space-y-1">
              {ss.map(s => {
                const m = MODE_META[s.mode ?? 'focus']
                return (
                  <div key={s.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                    <span className="text-xs text-gray-500 flex-1 truncate">{s.taskTitle ?? m.label}</span>
                    <span className="text-xs font-mono" style={{ color: m.color }}>{s.duration}min</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(s.startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default function PomodoroPage() {
  const {
    config, currentMode, isRunning, isPaused, secondsLeft, sessionCount,
    currentTaskTitle, sessions,
    startTimer, pauseTimer, resumeTimer, stopTimer, tickTimer, setCurrentTask,
    getTodaySessions, getWeekMinutes,
  } = usePomodoroStore()

  const { addXP } = useAppStore()
  const [fullscreen, setFullscreen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = currentMode === 'focus' ? config.focusDuration * 60
    : currentMode === 'deep-work' ? 90 * 60
    : currentMode === 'short-break' ? config.shortBreak * 60
    : config.longBreak * 60

  const pct = ((totalSeconds - secondsLeft) / totalSeconds) * 100
  const meta = MODE_META[currentMode]

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => tickTimer(), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, tickTimer])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden && isRunning) tickTimer() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isRunning, tickTimer])

  const prevSessionCount = useRef(sessionCount)
  useEffect(() => {
    if (sessionCount > prevSessionCount.current) {
      addXP(15, 'Pomodoro completado')
      // Auto-log to study store if session was focus/deep-work and ≥ 30 min
      const last = usePomodoroStore.getState().sessions.at(-1)
      if (last && (last.mode === 'focus' || last.mode === 'deep-work') && last.duration >= 30) {
        useStudyStore.getState().setPendingPomodoro({
          durationMin: last.duration,
          taskTitle: last.taskTitle,
          completedAt: last.completedAt ?? new Date().toISOString(),
        })
      }
      prevSessionCount.current = sessionCount
      setQuoteIdx(i => (i + 1) % MOTIVATIONAL[currentMode].length)
    }
  }, [sessionCount, addXP, currentMode])

  const todaySessions = getTodaySessions()

  // Focus streak: consecutive days with ≥1 pomodoro
  const streak = useMemo(() => {
    let count = 0
    const d = new Date()
    d.setDate(d.getDate() - 1)
    for (let i = 0; i < 60; i++) {
      const ds = d.toDateString()
      const has = sessions.some(s => s.completed && new Date(s.startedAt).toDateString() === ds)
      if (!has) break
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [sessions])

  // Session bars for today (last 8 sessions)
  const sessionBars = todaySessions.slice(-8)

  const quote = MOTIVATIONAL[currentMode][quoteIdx % MOTIVATIONAL[currentMode].length]

  const TimerCore = ({ large = false }: { large?: boolean }) => {
    const ringSize = large ? 280 : 220
    const strokeW = large ? 12 : 10
    return (
      <div className="flex flex-col items-center gap-5">
        {/* Mode tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200">
          {(['focus', 'short-break', 'long-break', 'deep-work'] as PomodoroMode[]).map(mode => {
            const m = MODE_META[mode]
            return (
              <button
                key={mode}
                onClick={() => { stopTimer(); startTimer(mode) }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  currentMode === mode ? 'text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
                style={currentMode === mode ? { background: `${m.color}25`, boxShadow: `0 0 12px ${m.color}30` } : undefined}
              >
                {m.icon}
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* Ring with ambient glow */}
        <div className="relative flex items-center justify-center" style={{ width: ringSize + 80, height: ringSize + 80 }}>
          {/* Ambient breath */}
          {isRunning && (
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: ringSize + 40, height: ringSize + 40, background: `radial-gradient(circle, ${meta.color}14 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {/* Outer glow ring */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ width: ringSize + 20, height: ringSize + 20 }}
            animate={{ boxShadow: isRunning ? [`0 0 40px ${meta.color}25`, `0 0 60px ${meta.color}35`, `0 0 40px ${meta.color}25`] : `0 0 0px transparent` }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div style={{ width: ringSize, height: ringSize, position: 'relative' }}>
            <ProgressRing
              value={pct}
              size={ringSize}
              strokeWidth={strokeW}
              color={meta.color}
              animate={false}
            >
              <div className="text-center flex flex-col items-center">
                <motion.p
                  key={secondsLeft}
                  initial={{ scale: 0.96 }}
                  animate={{ scale: 1 }}
                  className="font-mono font-black text-gray-900 tabular-nums"
                  style={{ fontSize: large ? '4rem' : '3.25rem', lineHeight: 1 }}
                >
                  {formatTime(secondsLeft)}
                </motion.p>
                <div className="flex items-center gap-1.5 mt-2" style={{ color: meta.color }}>
                  {meta.icon}
                  <p className="text-xs font-medium">{meta.label}</p>
                </div>
                {currentTaskTitle && (
                  <p className="text-[10px] text-gray-500 mt-1.5 max-w-[120px] text-center truncate">📌 {currentTaskTitle}</p>
                )}
              </div>
            </ProgressRing>
          </div>
        </div>

        {/* Quote */}
        <AnimatePresence mode="wait">
          <motion.p
            key={quote}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-xs text-gray-500 text-center max-w-xs italic"
          >
            "{quote}"
          </motion.p>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {(!isRunning && !isPaused) && (
            <motion.button
              onClick={() => startTimer(currentMode)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm text-gray-900 transition-all"
              style={{ background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}BB 100%)`, boxShadow: `0 0 24px ${meta.color}40` }}
            >
              <Play size={18} /> Iniciar
            </motion.button>
          )}
          {isRunning && (
            <>
              <Button onClick={pauseTimer} variant="secondary" size="lg">
                <Pause size={18} /> Pausar
              </Button>
              <Button onClick={() => { stopTimer(); addXP(5, 'Sesión de foco') }} variant="ghost" size="icon">
                <SkipForward size={18} />
              </Button>
            </>
          )}
          {isPaused && (
            <>
              <motion.button
                onClick={resumeTimer}
                whileHover={{ scale: 1.04 }}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm text-gray-900"
                style={{ background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}BB 100%)`, boxShadow: `0 0 24px ${meta.color}40` }}
              >
                <Play size={18} /> Continuar
              </motion.button>
              <Button onClick={stopTimer} variant="ghost" size="icon">
                <Square size={18} />
              </Button>
            </>
          )}
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: config.sessionsBeforeLong }, (_, i) => {
            const filled = i < (sessionCount % config.sessionsBeforeLong)
            return (
              <motion.div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: filled ? 10 : 8,
                  height: filled ? 10 : 8,
                  background: filled ? meta.color : 'rgba(0,0,0,0.1)',
                  boxShadow: filled ? `0 0 8px ${meta.color}80` : 'none',
                }}
              />
            )
          })}
          <span className="text-xs text-gray-400 ml-2">
            {(sessionCount % config.sessionsBeforeLong) + 1}/{config.sessionsBeforeLong}
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Fullscreen */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white flex items-center justify-center"
            style={{ background: `radial-gradient(ellipse at 50% 50%, ${meta.bg} 0%, white 60%)` }}
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900"
            >
              <Minimize2 size={18} />
            </button>
            <TimerCore large />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 max-w-2xl mx-auto">

        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Timer size={24} className="text-cyan-600" /> Pomodoro
          </h1>
          <div className="flex gap-2 items-center">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                <Flame size={14} className="text-amber-600" />
                <span className="text-xs font-bold text-amber-600">{streak} días</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)}>
              <History size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings2 size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setFullscreen(true)}>
              <Maximize2 size={18} />
            </Button>
          </div>
        </motion.div>

        {/* Main timer card */}
        <motion.div variants={fadeUp}>
          <div
            className="rounded-2xl border border-gray-200 p-6 md:p-10 flex flex-col items-center transition-all duration-700"
            style={{ background: meta.bg, boxShadow: isRunning ? `0 0 60px ${meta.color}12` : 'none' }}
          >
            <TimerCore />

            {/* Task input */}
            <div className="mt-6 w-full max-w-xs">
              <input
                value={currentTaskTitle}
                onChange={e => setCurrentTask(e.target.value)}
                placeholder="¿En qué estás trabajando? (opcional)"
                className="w-full h-9 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 px-3 focus:outline-none transition-colors"
                style={{ borderColor: currentTaskTitle ? `${meta.color}30` : undefined }}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-black text-gray-900 tabular-nums">{todaySessions.length}</p>
            <p className="text-[11px] text-gray-500 mt-1">Pomodoros hoy</p>
            <div className="h-1 rounded-full bg-gray-100 mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${Math.min(100, (todaySessions.length / config.sessionsBeforeLong) * 100)}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-black text-gray-900 tabular-nums">
              {Math.round(todaySessions.reduce((a, s) => a + s.duration, 0) / 60 * 10) / 10}h
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Foco hoy</p>
            <div className="h-1 rounded-full bg-gray-100 mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(100, (todaySessions.reduce((a,s)=>a+s.duration,0) / 60 / 8) * 100)}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-black text-gray-900 tabular-nums">
              {Math.round(getWeekMinutes() / 60 * 10) / 10}h
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Desde el viernes</p>
            <div className="h-1 rounded-full bg-gray-100 mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (getWeekMinutes() / 60 / 40) * 100)}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Growing tree card */}
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider self-start">Tu árbol de hoy</p>
            <GrowingTree count={todaySessions.length} />
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: i < todaySessions.length ? 14 : 10,
                    background: i < todaySessions.length ? '#22c55e' : 'rgba(0,0,0,0.08)',
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-400">{todaySessions.length}/8 sesiones hoy</p>
          </div>
        </motion.div>

        {/* Study Mode */}
        <motion.div variants={fadeUp}>
          <StudySection />
        </motion.div>

        {/* Session history */}
        {todaySessions.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Sesiones de hoy</h3>
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="text-xs text-cyan-600 hover:text-cyan-500 transition-colors"
                >
                  Ver todo →
                </button>
              </div>

              {/* Mini bar chart */}
              <div className="flex items-end gap-1.5 h-10 mb-4">
                {todaySessions.slice(-12).map((s, i) => {
                  const h = Math.max(20, Math.min(100, (s.duration / (config.focusDuration || 25)) * 100))
                  const color = s.mode === 'focus' || s.mode === 'deep-work' ? '#00D4B8' : '#10B981'
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.04 }}
                      title={`${s.duration}min · ${s.taskTitle || 'Foco'}`}
                      className="flex-1 rounded-t-sm origin-bottom cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ height: `${h}%`, background: color, opacity: 0.7 + i * 0.03 }}
                    />
                  )
                })}
              </div>

              {/* Recent sessions list */}
              <div className="space-y-1.5">
                {todaySessions.slice(-4).reverse().map(s => {
                  const m = MODE_META[s.mode ?? 'focus']
                  return (
                    <div key={s.id} className="flex items-center gap-3 text-sm py-1">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                      <span className="text-gray-700 flex-1 truncate text-xs">{s.taskTitle ?? m.label}</span>
                      <span className="text-xs font-mono" style={{ color: m.color }}>{s.duration}min</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(s.startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* History Modal */}
      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Configuración Pomodoro">
        <div className="space-y-5">
          {[
            { key: 'focusDuration',       label: 'Tiempo de foco',              unit: 'min', min: 5,  max: 120 },
            { key: 'shortBreak',          label: 'Descanso corto',              unit: 'min', min: 1,  max: 30  },
            { key: 'longBreak',           label: 'Descanso largo',              unit: 'min', min: 5,  max: 60  },
            { key: 'sessionsBeforeLong',  label: 'Sesiones antes del descanso', unit: '',    min: 2,  max: 8   },
          ].map(({ key, label, unit, min, max }) => (
            <div key={key}>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-500">{label}</label>
                <span className="text-sm text-gray-900 font-mono font-bold">{(config as any)[key]}{unit}</span>
              </div>
              <input
                type="range" min={min} max={max}
                value={(config as any)[key]}
                onChange={e => usePomodoroStore.getState().setConfig({ [key]: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: '#00D4B8' }}
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoStartBreaks}
                onChange={e => usePomodoroStore.getState().setConfig({ autoStartBreaks: e.target.checked })}
                className="rounded"
                style={{ accentColor: '#00D4B8' }}
              />
              <span className="text-sm text-gray-500">Auto-iniciar descansos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoStartFocus}
                onChange={e => usePomodoroStore.getState().setConfig({ autoStartFocus: e.target.checked })}
                className="rounded"
                style={{ accentColor: '#00D4B8' }}
              />
              <span className="text-sm text-gray-500">Auto-iniciar foco</span>
            </label>
          </div>

          <Button variant="glow" className="w-full" onClick={() => setSettingsOpen(false)}>
            Guardar
          </Button>
        </div>
      </Modal>
    </>
  )
}
