'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { Play, Pause, Square, SkipForward, Timer, Maximize2, Minimize2, Settings2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { usePomodoroStore } from '@/stores/pomodoro.store'
import { useAppStore } from '@/stores/app.store'
import { formatTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { PomodoroMode } from '@/types'

const MODE_LABELS: Record<PomodoroMode, string> = {
  'focus':       '🧠 Foco',
  'short-break': '☕ Descanso corto',
  'long-break':  '🌿 Descanso largo',
  'deep-work':   '⚡ Deep Work',
}

const MODE_COLORS: Record<PomodoroMode, string> = {
  'focus':       '#7C3AED',
  'short-break': '#10B981',
  'long-break':  '#06B6D4',
  'deep-work':   '#F59E0B',
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = currentMode === 'focus' ? config.focusDuration * 60
    : currentMode === 'deep-work' ? 90 * 60
    : currentMode === 'short-break' ? config.shortBreak * 60
    : config.longBreak * 60

  const pct = ((totalSeconds - secondsLeft) / totalSeconds) * 100

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => tickTimer(), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, tickTimer])

  // When tab regains focus, force a tick so the timer corrects itself instantly
  useEffect(() => {
    const onVisible = () => { if (!document.hidden && isRunning) tickTimer() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isRunning, tickTimer])

  const prevSessionCount = useRef(sessionCount)
  useEffect(() => {
    if (sessionCount > prevSessionCount.current) {
      addXP(15, 'Pomodoro completado')
      prevSessionCount.current = sessionCount
    }
  }, [sessionCount, addXP])

  const todaySessions = getTodaySessions()
  const color = MODE_COLORS[currentMode]

  const TimerContent = () => (
    <div className="flex flex-col items-center gap-6">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        {(['focus', 'short-break', 'long-break', 'deep-work'] as PomodoroMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => { stopTimer(); startTimer(mode) }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              currentMode === mode
                ? 'text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            )}
            style={currentMode === mode ? { background: `${color}30`, boxShadow: `0 0 12px ${color}40` } : undefined}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{ background: `${color}10` }}
        />
        <ProgressRing
          value={pct}
          size={fullscreen ? 280 : 200}
          strokeWidth={fullscreen ? 12 : 10}
          color={color}
          animate={false}
        >
          <div className="text-center">
            <motion.p
              key={secondsLeft}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="font-mono font-black text-white"
              style={{ fontSize: fullscreen ? '4rem' : '3rem' }}
            >
              {formatTime(secondsLeft)}
            </motion.p>
            <p className="text-slate-400 text-xs mt-1">{MODE_LABELS[currentMode]}</p>
          </div>
        </ProgressRing>
      </div>

      {/* Task label */}
      {currentTaskTitle && (
        <p className="text-sm text-slate-400 max-w-xs text-center truncate">
          📌 {currentTaskTitle}
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {(!isRunning && !isPaused) && (
          <Button onClick={() => startTimer(currentMode)} variant="glow" size="lg" className="px-8">
            <Play size={18} /> Iniciar
          </Button>
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
            <Button onClick={resumeTimer} variant="glow" size="lg" className="px-8">
              <Play size={18} /> Continuar
            </Button>
            <Button onClick={stopTimer} variant="ghost" size="icon">
              <Square size={18} />
            </Button>
          </>
        )}
      </div>

      {/* Session count */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: config.sessionsBeforeLong }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-all',
              i < (sessionCount % config.sessionsBeforeLong) ? 'scale-100' : 'scale-75 opacity-40'
            )}
            style={{ background: i < (sessionCount % config.sessionsBeforeLong) ? color : 'rgba(255,255,255,0.1)' }}
          />
        ))}
        <span className="text-xs text-slate-500 ml-2">Sesión {(sessionCount % config.sessionsBeforeLong) + 1}/{config.sessionsBeforeLong}</span>
      </div>
    </div>
  )

  return (
    <>
      {/* Fullscreen overlay */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#0A0A0F] flex items-center justify-center"
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white"
            >
              <Minimize2 size={18} />
            </button>
            <TimerContent />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-5 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Timer size={24} className="text-cyan-400" /> Pomodoro
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings2 size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setFullscreen(true)}>
              <Maximize2 size={18} />
            </Button>
          </div>
        </div>

        <GlassCard className="p-8 flex flex-col items-center" animate={false}>
          <TimerContent />

          {/* Task input */}
          <div className="mt-6 w-full max-w-xs">
            <input
              value={currentTaskTitle}
              onChange={e => setCurrentTask(e.target.value)}
              placeholder="¿En qué estás trabajando? (opcional)"
              className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-600 px-3 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4 text-center" animate={false}>
            <p className="text-2xl font-black text-white">🏅{todaySessions.length}</p>
            <p className="text-xs text-slate-500 mt-1">Pomodoros hoy</p>
          </GlassCard>
          <GlassCard className="p-4 text-center" animate={false}>
            <p className="text-2xl font-black text-white">
              {Math.round(todaySessions.reduce((a, s) => a + s.duration, 0) / 60 * 10) / 10}h
            </p>
            <p className="text-xs text-slate-500 mt-1">Foco hoy</p>
          </GlassCard>
          <GlassCard className="p-4 text-center" animate={false}>
            <p className="text-2xl font-black text-white">
              {Math.round(getWeekMinutes() / 60 * 10) / 10}h
            </p>
            <p className="text-xs text-slate-500 mt-1">Esta semana</p>
          </GlassCard>
        </div>

        {/* Recent sessions */}
        {todaySessions.length > 0 && (
          <GlassCard className="p-5" animate={false}>
            <h3 className="text-sm font-semibold text-white mb-3">Sesiones de hoy</h3>
            <div className="space-y-2">
              {todaySessions.slice(-5).reverse().map(s => (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="text-base">🏅</span>
                  <span className="text-slate-300 flex-1 truncate">{s.taskTitle ?? 'Sesión de foco'}</span>
                  <Badge variant="violet" size="sm">{s.duration}min</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Configuración Pomodoro">
        <div className="space-y-4">
          {[
            { key: 'focusDuration', label: 'Tiempo de foco (min)', min: 5, max: 120 },
            { key: 'shortBreak', label: 'Descanso corto (min)', min: 1, max: 30 },
            { key: 'longBreak', label: 'Descanso largo (min)', min: 5, max: 60 },
            { key: 'sessionsBeforeLong', label: 'Sesiones antes del descanso largo', min: 2, max: 8 },
          ].map(({ key, label, min, max }) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-slate-400">{label}</label>
                <span className="text-sm text-white font-mono">{(config as any)[key]}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={(config as any)[key]}
                onChange={e => usePomodoroStore.getState().setConfig({ [key]: Number(e.target.value) })}
                className="w-full accent-violet-500"
              />
            </div>
          ))}
          <Button variant="glow" className="w-full" onClick={() => setSettingsOpen(false)}>
            Guardar
          </Button>
        </div>
      </Modal>
    </>
  )
}
