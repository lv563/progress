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

const MODE_META: Record<PomodoroMode, { label: string; icon: React.ReactNode; color: string; tip: string }> = {
  'focus':       { label: 'Foco',           icon: <Zap size={14}/>,    color: '#EF4444', tip: 'Modo de máxima concentración' },
  'short-break': { label: 'Descanso corto', icon: <Coffee size={14}/>, color: '#888888', tip: 'Descansa los ojos, estírate' },
  'long-break':  { label: 'Descanso largo', icon: <Leaf size={14}/>,   color: '#888888', tip: 'Recarga completa · bien ganado' },
  'deep-work':   { label: 'Deep Work',      icon: <Flame size={14}/>,  color: '#EF4444', tip: '90 min de trabajo profundo' },
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
  const gp = (delay = 0) => ({ initial: { pathLength: 0 as number, opacity: 0 as number }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 0.8, ease: 'easeOut' as const, delay } })
  const fi = (delay = 0) => ({ initial: { scale: 0 as number, opacity: 0 as number }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 200, damping: 15, delay } })

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 140 155" className="w-28 h-28">
        <ellipse cx="70" cy="147" rx="38" ry="5" fill="rgba(139,90,43,0.2)" />
        {show(1) && <motion.path d="M70 147 L70 100" stroke="#6B4226" strokeWidth="6" strokeLinecap="round" fill="none" {...gp(0)} />}
        {show(2) && <motion.path d="M70 118 Q52 106 40 100" stroke="#6B4226" strokeWidth="4" strokeLinecap="round" fill="none" {...gp(0.1)} />}
        {show(2) && <motion.path d="M70 118 Q88 106 100 100" stroke="#6B4226" strokeWidth="4" strokeLinecap="round" fill="none" {...gp(0.2)} />}
        {show(3) && <motion.path d="M70 107 Q58 94 50 87" stroke="#6B4226" strokeWidth="3" strokeLinecap="round" fill="none" {...gp(0.1)} />}
        {show(3) && <motion.path d="M70 107 Q82 94 90 87" stroke="#6B4226" strokeWidth="3" strokeLinecap="round" fill="none" {...gp(0.2)} />}
        {show(4) && <motion.circle cx="40" cy="94" r="18" fill="rgba(34,197,94,0.4)" {...fi(0.1)} />}
        {show(4) && <motion.circle cx="100" cy="94" r="18" fill="rgba(34,197,94,0.4)" {...fi(0.2)} />}
        {show(4) && <motion.circle cx="70" cy="78" r="24" fill="rgba(34,197,94,0.5)" {...fi(0.3)} />}
        {show(5) && <motion.circle cx="55" cy="87" r="13" fill="rgba(22,163,74,0.45)" {...fi(0.1)} />}
        {show(5) && <motion.circle cx="85" cy="87" r="13" fill="rgba(22,163,74,0.45)" {...fi(0.2)} />}
        {show(5) && <motion.circle cx="40" cy="101" r="5.5" fill="#EF4444" {...fi(0.3)} />}
        {show(6) && <motion.circle cx="100" cy="98" r="5.5" fill="#EF4444" {...fi(0.1)} />}
        {show(7) && <motion.circle cx="70" cy="66" r="5.5" fill="#EF4444" {...fi(0.2)} />}
        {show(8) && <motion.circle cx="70" cy="56" r="20" fill="rgba(234,179,8,0.15)" {...fi(0)} />}
        {show(8) && (
          <>
            <motion.path d="M35 42 L35 52 M30 47 L40 47" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" {...fi(0.1)} />
            <motion.path d="M105 46 L105 56 M100 51 L110 51" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" {...fi(0.2)} />
            <motion.path d="M70 26 L70 36 M65 31 L75 31" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" {...fi(0.3)} />
          </>
        )}
      </svg>
      <p className="text-[10px] font-medium" style={{ color: stage > 0 ? '#22c55e80' : '#374151' }}>
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
          <div className="text-center py-10 text-gray-600 text-sm">Sin sesiones registradas aún</div>
        ) : grouped.map(({ date, sessions: ss, totalMinutes }) => (
          <div key={date.toDateString()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-gray-400 capitalize tracking-wide">
                {format(date, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <span className="text-[10px] text-gray-600">{Math.round(totalMinutes / 60 * 10) / 10}h · {ss.length} ses.</span>
            </div>
            <div className="space-y-1">
              {ss.map(s => {
                const m = MODE_META[s.mode ?? 'focus']
                return (
                  <div key={s.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/6">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                    <span className="text-xs text-gray-400 flex-1 truncate">{s.taskTitle ?? m.label}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: m.color }}>{s.duration}min</span>
                    <span className="text-[10px] text-gray-600">
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
    startTimer, pauseTimer, resumeTimer, stopTimer, tickTimer, completeSession, setCurrentTask,
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

  const quote = MOTIVATIONAL[currentMode][quoteIdx % MOTIVATIONAL[currentMode].length]

  const TimerCore = ({ large = false }: { large?: boolean }) => {
    const ringSize = large ? 280 : 220
    const strokeW = large ? 12 : 10
    return (
      <div className="flex flex-col items-center gap-5">
        {/* Mode tabs */}
        <div className="flex gap-0.5 p-1 rounded-xl bg-white/[0.04] border border-white/6">
          {(['focus', 'short-break', 'long-break', 'deep-work'] as PomodoroMode[]).map(mode => {
            const m = MODE_META[mode]
            const active = currentMode === mode
            return (
              <button
                key={mode}
                onClick={() => { stopTimer(); startTimer(mode) }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  active ? 'text-white' : 'text-gray-600 hover:text-gray-400'
                )}
                style={active ? { background: `${m.color}20`, color: m.color } : undefined}
              >
                {m.icon}
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* Ring */}
        <div className="relative flex items-center justify-center" style={{ width: ringSize + 80, height: ringSize + 80 }}>
          {isRunning && (
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: ringSize + 40, height: ringSize + 40, background: `radial-gradient(circle, ${meta.color}10 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <div style={{ width: ringSize, height: ringSize }}>
            <ProgressRing value={pct} size={ringSize} strokeWidth={strokeW} color={meta.color} animate={false}>
              <div className="text-center flex flex-col items-center">
                <motion.p
                  key={secondsLeft}
                  initial={{ scale: 0.96 }}
                  animate={{ scale: 1 }}
                  className="font-mono font-black text-white tabular-nums"
                  style={{ fontSize: large ? '4rem' : '3.25rem', lineHeight: 1 }}
                >
                  {formatTime(secondsLeft)}
                </motion.p>
                <div className="flex items-center gap-1.5 mt-2" style={{ color: meta.color }}>
                  {meta.icon}
                  <p className="text-xs font-bold">{meta.label}</p>
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
            className="text-xs text-gray-600 text-center max-w-xs italic"
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
              className="flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm text-white transition-all"
              style={{ background: meta.color, boxShadow: `0 0 24px ${meta.color}40` }}
            >
              <Play size={18} /> Iniciar
            </motion.button>
          )}
          {isRunning && (
            <>
              <motion.button
                onClick={pauseTimer}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white border border-white/10 bg-white/8 hover:bg-white/12 transition-all"
              >
                <Pause size={18} /> Pausar
              </motion.button>
              <button
                onClick={() => { if (currentMode === 'focus' || currentMode === 'deep-work') completeSession(); else stopTimer() }}
                className="w-11 h-11 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <SkipForward size={18} />
              </button>
            </>
          )}
          {isPaused && (
            <>
              <motion.button
                onClick={resumeTimer}
                whileHover={{ scale: 1.04 }}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm text-white"
                style={{ background: meta.color, boxShadow: `0 0 24px ${meta.color}40` }}
              >
                <Play size={18} /> Continuar
              </motion.button>
              <button
                onClick={stopTimer}
                className="w-11 h-11 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-500 hover:text-white transition-all"
              >
                <Square size={18} />
              </button>
            </>
          )}
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: config.sessionsBeforeLong }, (_, i) => {
            const filled = i < (sessionCount % config.sessionsBeforeLong)
            return (
              <motion.div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: filled ? 10 : 8, height: filled ? 10 : 8,
                  background: filled ? meta.color : 'rgba(255,255,255,0.08)',
                  boxShadow: filled ? `0 0 8px ${meta.color}60` : 'none',
                }}
              />
            )
          })}
          <span className="text-xs text-gray-600 ml-1 font-bold">
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
            className="fixed inset-0 z-40 bg-[#0A0A0A] flex items-center justify-center"
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
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
          <div>
            <p className="text-[9px] tracking-[0.4em] text-[#EF4444] font-black uppercase mb-0.5">FOCUS</p>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Timer size={22} className="text-[#EF4444]" /> Pomodoro
            </h1>
          </div>
          <div className="flex gap-1 items-center">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                <Flame size={14} className="text-[#EF4444]" />
                <span className="text-xs font-bold text-[#EF4444]">{streak} días</span>
              </div>
            )}
            <button onClick={() => setHistoryOpen(true)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
              <History size={16} />
            </button>
            <button onClick={() => setSettingsOpen(true)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
              <Settings2 size={16} />
            </button>
            <button onClick={() => setFullscreen(true)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
              <Maximize2 size={16} />
            </button>
          </div>
        </motion.div>

        {/* Main timer card */}
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl border border-white/8 bg-[#111] p-6 md:p-10 flex flex-col items-center transition-all duration-700">
            <TimerCore />
            {/* Task input */}
            <div className="mt-6 w-full max-w-xs">
              <input
                value={currentTaskTitle}
                onChange={e => setCurrentTask(e.target.value)}
                placeholder="¿En qué estás trabajando? (opcional)"
                className="w-full h-9 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-600 px-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          {[
            { value: `${todaySessions.length}`, label: 'Pomodoros hoy', pct: Math.min(100, (todaySessions.length / config.sessionsBeforeLong) * 100), color: '#EF4444' },
            { value: `${Math.round(todaySessions.reduce((a, s) => a + s.duration, 0) / 60 * 10) / 10}h`, label: 'Foco hoy', pct: Math.min(100, (todaySessions.reduce((a,s)=>a+s.duration,0) / 60 / 8) * 100), color: '#EF4444' },
            { value: `${Math.round(getWeekMinutes() / 60 * 10) / 10}h`, label: 'Esta semana', pct: Math.min(100, (getWeekMinutes() / 60 / 40) * 100), color: '#CCCCCC' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/8 bg-[#111] p-4 text-center relative group">
              <p className="text-2xl font-black text-white tabular-nums">{s.value}</p>
              <p className="text-[11px] text-gray-600 mt-1">{s.label}</p>
              <div className="h-0.5 rounded-full bg-white/6 mt-3 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Growing tree */}
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl border border-white/8 bg-[#111] p-5 flex flex-col items-center gap-2">
            <p className="text-[9px] tracking-[0.4em] text-gray-600 font-black uppercase self-start">TU ÁRBOL DE HOY</p>
            <GrowingTree count={todaySessions.length} />
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-1 rounded-full transition-all"
                  style={{ width: i < todaySessions.length ? 14 : 10, background: i < todaySessions.length ? '#22c55e' : 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
            <p className="text-[10px] text-gray-600">{todaySessions.length}/8 sesiones hoy</p>
          </div>
        </motion.div>

        {/* Study Mode */}
        <motion.div variants={fadeUp}>
          <StudySection />
        </motion.div>

        {/* Today sessions */}
        {todaySessions.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="rounded-2xl border border-white/8 bg-[#111] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] tracking-[0.4em] text-gray-600 font-black">SESIONES DE HOY</p>
                <button onClick={() => setHistoryOpen(true)} className="text-xs text-[#EF4444] hover:text-red-400 transition-colors font-bold">
                  Ver todo →
                </button>
              </div>
              <div className="flex items-end gap-1.5 h-10 mb-4">
                {todaySessions.slice(-12).map((s, i) => {
                  const h = Math.max(20, Math.min(100, (s.duration / (config.focusDuration || 25)) * 100))
                  const color = MODE_META[s.mode ?? 'focus'].color
                  return (
                    <motion.div key={s.id} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.04 }}
                      title={`${s.duration}min · ${s.taskTitle || 'Foco'}`}
                      className="flex-1 rounded-t-sm origin-bottom cursor-pointer hover:opacity-100 transition-opacity"
                      style={{ height: `${h}%`, background: color, opacity: 0.5 + i * 0.05 }} />
                  )
                })}
              </div>
              <div className="space-y-1.5">
                {todaySessions.slice(-4).reverse().map(s => {
                  const m = MODE_META[s.mode ?? 'focus']
                  return (
                    <div key={s.id} className="flex items-center gap-3 text-sm py-1">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                      <span className="text-gray-500 flex-1 truncate text-xs">{s.taskTitle ?? m.label}</span>
                      <span className="text-xs font-mono font-bold" style={{ color: m.color }}>{s.duration}min</span>
                      <span className="text-[10px] text-gray-600">
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

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />

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
                <span className="text-sm text-white font-mono font-black">{(config as any)[key]}{unit}</span>
              </div>
              <input type="range" min={min} max={max} value={(config as any)[key]}
                onChange={e => usePomodoroStore.getState().setConfig({ [key]: Number(e.target.value) })}
                className="w-full" style={{ accentColor: '#EF4444' }} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              { key: 'autoStartBreaks', label: 'Auto-iniciar descansos' },
              { key: 'autoStartFocus', label: 'Auto-iniciar foco' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(config as any)[key]}
                  onChange={e => usePomodoroStore.getState().setConfig({ [key]: e.target.checked })}
                  className="rounded" style={{ accentColor: '#EF4444' }} />
                <span className="text-sm text-gray-500">{label}</span>
              </label>
            ))}
          </div>
          <Button variant="primary" className="w-full" onClick={() => setSettingsOpen(false)}>
            Guardar
          </Button>
        </div>
      </Modal>
    </>
  )
}
