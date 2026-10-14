'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWinterArcStore, DEFAULT_TRANSFORMATION_GOALS, DEFAULT_RULES, type WinterRule, type WinterTransformationGoal } from '@/stores/winterArc.store'
import { useHabitsStore } from '@/stores/habits.store'
import { usePomodoroStore } from '@/stores/pomodoro.store'
import { usePhysicalStore } from '@/stores/physical.store'
import { Plus, X, Check, ChevronRight, ChevronLeft, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const todayStr = () => new Date().toISOString().slice(0, 10)
const addDays = (date: string, n: number) => {
  const d = new Date(date); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
const fmtMins = (mins: number) => {
  const h = Math.floor(mins / 60); const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── Shared dark card wrapper ─────────────────────────────────────────────────
function DarkCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[#111] border border-white/8 rounded-2xl', className)}>
      {children}
    </div>
  )
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────
type SetupStep = 1 | 2 | 3 | 4

function SetupWizard({ onActivate }: { onActivate: () => void }) {
  const { activate } = useWinterArcStore()
  const [step, setStep] = useState<SetupStep>(1)
  const [duration, setDuration] = useState<30 | 60 | 90>(90)
  const [mainGoal, setMainGoal] = useState('')
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>([])
  const [goalInput, setGoalInput] = useState('')
  const [rules, setRules] = useState<WinterRule[]>(DEFAULT_RULES)
  const [ruleInput, setRuleInput] = useState('')
  const [identityStatement, setIdentityStatement] = useState('No estoy intentando cambiar mi vida en un solo día. Estoy usando estos días para construir evidencia de que puedo convertirme en la persona que quiero ser.')
  const [transformationGoals, setTransformationGoals] = useState<WinterTransformationGoal[]>(DEFAULT_TRANSFORMATION_GOALS)
  const [socialBaseline, setSocialBaseline] = useState('180')
  const [socialTarget, setSocialTarget] = useState('20')

  const startDate = new Date().toISOString().slice(0, 10)
  const endDate = addDays(startDate, duration)

  const addGoal = () => {
    if (goalInput.trim()) { setSecondaryGoals(g => [...g, goalInput.trim()]); setGoalInput('') }
  }
  const addRule = () => {
    if (ruleInput.trim()) {
      setRules(r => [...r, { id: Math.random().toString(36).slice(2), text: ruleInput.trim(), active: true }])
      setRuleInput('')
    }
  }
  const toggleTransGoal = (area: string) =>
    setTransformationGoals(g => g.map(t => t.area === area ? { ...t, enabled: !t.enabled } : t))

  const handleActivate = () => {
    activate({
      duration,
      startDate,
      endDate,
      mainGoal,
      secondaryGoals,
      habitsToBuilt: [],
      habitsToEliminate: [],
      rules,
      identityStatement,
      coldDayThreshold: 80,
      socialMediaBaselineMinutes: Number(socialBaseline) || 180,
      socialMediaTargetMinutes: Number(socialTarget) || 20,
      scoreWeights: { fitness: 25, spiritual: 20, mental: 15, career: 20, digital: 10, finance: 10 },
      transformationGoals,
      snapshot: {},
    })
    onActivate()
  }

  const steps = [
    { num: 1, label: 'DURACIÓN' },
    { num: 2, label: 'OBJETIVOS' },
    { num: 3, label: 'REGLAS' },
    { num: 4, label: 'IDENTIDAD' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <DarkCard className="p-6">
        <p className="text-[10px] tracking-[0.4em] text-[#EF4444] font-bold uppercase mb-2">❄ Winter Arc</p>
        <h1 className="text-2xl font-black text-white tracking-tight">ACTIVAR TEMPORADA</h1>
        <p className="text-gray-500 text-sm mt-1">TIME IS PASSING. WHAT WILL YOU DO?</p>

        {/* Step indicators */}
        <div className="flex items-center gap-1 mt-5">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-1 flex-1">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all flex-1 justify-center',
                step === s.num ? 'bg-[#EF4444] text-white' :
                step > s.num ? 'bg-white/10 text-white' :
                'bg-white/5 text-gray-600'
              )}>
                <span>{step > s.num ? '✓' : s.num}</span>
                <span className="hidden sm:inline tracking-wider">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={cn('h-px w-3 shrink-0', step > s.num ? 'bg-white/30' : 'bg-white/10')} />}
            </div>
          ))}
        </div>
      </DarkCard>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <DarkCard className="p-6">
              <h2 className="text-lg font-black text-white mb-1">¿CUÁNTOS DÍAS?</h2>
              <p className="text-gray-500 text-sm mb-5">Elige la duración de tu Winter Arc</p>
              <div className="grid grid-cols-3 gap-3">
                {([30, 60, 90] as const).map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={cn(
                      'py-6 rounded-xl border-2 flex flex-col items-center gap-1 transition-all',
                      duration === d ? 'border-[#EF4444] bg-[#EF4444]/10' : 'border-white/8 bg-white/[0.03] hover:border-white/15'
                    )}>
                    <span className="text-3xl font-black text-white">{d}</span>
                    <span className="text-[10px] tracking-widest text-gray-500">DAYS</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 bg-white/[0.03] rounded-xl p-3 border border-white/5">
                <p className="text-[10px] tracking-[0.3em] text-[#EF4444] font-bold mb-1">PERÍODO</p>
                <p className="text-sm text-gray-300">{startDate} → {endDate}</p>
                <p className="text-xs text-gray-600 mt-0.5">{duration} blank pages to design the life you want.</p>
              </div>
            </DarkCard>
            <DarkCard className="p-6">
              <label className="text-[10px] tracking-[0.3em] text-gray-400 font-bold block mb-3">OBJETIVO PRINCIPAL</label>
              <textarea value={mainGoal} onChange={e => setMainGoal(e.target.value)}
                placeholder="Ej: Convertirme en una persona más disciplinada, fuerte y espiritualmente fundada."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF4444]/40 resize-none h-24" />
            </DarkCard>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <DarkCard className="p-6">
              <h2 className="text-lg font-black text-white mb-1">ÁREAS DE TRANSFORMACIÓN</h2>
              <p className="text-gray-500 text-sm mb-4">Selecciona en qué áreas quieres crecer</p>
              <div className="space-y-2">
                {transformationGoals.map(g => (
                  <button key={g.area} onClick={() => toggleTransGoal(g.area)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                      g.enabled ? 'border-[#EF4444]/30 bg-[#EF4444]/5' : 'border-white/5 bg-white/[0.02]'
                    )}>
                    <span className="text-lg w-7 text-center">{g.icon}</span>
                    <p className={cn('flex-1 text-sm font-bold', g.enabled ? 'text-white' : 'text-gray-500')}>{g.area}</p>
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0', g.enabled ? 'border-[#EF4444] bg-[#EF4444]' : 'border-white/20')}>
                      {g.enabled && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                  </button>
                ))}
              </div>
            </DarkCard>
            <DarkCard className="p-6">
              <label className="text-[10px] tracking-[0.3em] text-gray-400 font-bold block mb-3">METAS ADICIONALES</label>
              <div className="flex gap-2 mb-3">
                <input value={goalInput} onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGoal()}
                  placeholder="Agregar meta..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF4444]/40" />
                <button onClick={addGoal} className="w-10 h-10 rounded-xl bg-[#EF4444]/20 flex items-center justify-center text-[#EF4444] hover:bg-[#EF4444]/30"><Plus size={16} /></button>
              </div>
              {secondaryGoals.map((g, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-white/5">
                  <div className="w-1 h-1 rounded-full bg-[#EF4444]" />
                  <span className="flex-1 text-sm text-gray-300">{g}</span>
                  <button onClick={() => setSecondaryGoals(gs => gs.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400"><X size={14} /></button>
                </div>
              ))}
            </DarkCard>
            <DarkCard className="p-6">
              <p className="text-[10px] tracking-[0.3em] text-[#EF4444] font-bold mb-3">REDES SOCIALES</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Uso actual (min/día)</label>
                  <input type="number" value={socialBaseline} onChange={e => setSocialBaseline(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#EF4444]/40" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Meta (min/día)</label>
                  <input type="number" value={socialTarget} onChange={e => setSocialTarget(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#EF4444]/40" />
                </div>
              </div>
            </DarkCard>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <DarkCard className="p-6">
              <h2 className="text-lg font-black text-white mb-1">MY WINTER RULES</h2>
              <p className="text-gray-500 text-sm mb-4">Define las reglas que regirán tu Winter Arc</p>
              <div className="space-y-0 mb-4">
                {rules.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-white/5">
                    <span className="text-[10px] font-black text-[#EF4444] w-5 text-right shrink-0">{i + 1}</span>
                    <p className="flex-1 text-sm text-gray-300">{r.text}</p>
                    <button onClick={() => setRules(rs => rs.filter(x => x.id !== r.id))} className="text-gray-700 hover:text-red-400 shrink-0"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={ruleInput} onChange={e => setRuleInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addRule()}
                  placeholder="Nueva regla..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF4444]/40" />
                <button onClick={addRule} className="w-10 h-10 rounded-xl bg-[#EF4444]/20 flex items-center justify-center text-[#EF4444] hover:bg-[#EF4444]/30"><Plus size={16} /></button>
              </div>
            </DarkCard>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <DarkCard className="p-6">
              <h2 className="text-lg font-black text-white mb-1">WHO ARE YOU BECOMING?</h2>
              <p className="text-gray-500 text-sm mb-4">Escribe tu declaración de identidad</p>
              <textarea value={identityStatement} onChange={e => setIdentityStatement(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#EF4444]/40 resize-none h-32 leading-relaxed" />
            </DarkCard>
            <DarkCard className="p-6 border-[#EF4444]/20">
              <p className="text-[10px] tracking-[0.4em] text-[#EF4444] font-bold mb-4">RESUMEN</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Duración', val: `${duration} días` },
                  { label: 'Inicio', val: startDate },
                  { label: 'Fin', val: endDate },
                  { label: 'Reglas', val: `${rules.length}` },
                  { label: 'Áreas activas', val: `${transformationGoals.filter(g => g.enabled).length}` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center text-sm border-b border-white/5 pb-2.5">
                    <span className="text-gray-500">{r.label}</span>
                    <span className="text-white font-bold">{r.val}</span>
                  </div>
                ))}
              </div>
            </DarkCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex gap-3 pb-6">
        {step > 1 && (
          <button onClick={() => setStep(s => (s - 1) as SetupStep)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:border-white/20 hover:text-white transition-all bg-white/[0.03]">
            <ChevronLeft size={16} /> Atrás
          </button>
        )}
        {step < 4 ? (
          <button onClick={() => setStep(s => (s + 1) as SetupStep)}
            className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-black tracking-wider text-sm hover:bg-red-500 transition-colors flex items-center justify-center gap-2">
            CONTINUAR <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={handleActivate}
            className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-black tracking-wider text-sm hover:bg-red-500 transition-colors flex items-center justify-center gap-2">
            ❄ ACTIVAR WINTER ARC
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Circle Grid Calendar ─────────────────────────────────────────────────────
function CircleGrid({ config, dayLogs }: {
  config: NonNullable<ReturnType<typeof useWinterArcStore.getState>['config']>
  dayLogs: ReturnType<typeof useWinterArcStore.getState>['dayLogs']
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const t = todayStr()

  const days = useMemo(() => Array.from({ length: config.duration }, (_, i) => {
    const date = addDays(config.startDate, i)
    const log = dayLogs.find(d => d.date === date)
    const isToday = date === t
    const isPast = date < t
    return { date, dayNum: i + 1, log, isToday, isPast, isFuture: date > t }
  }), [config.startDate, config.duration, dayLogs, t])

  const threshold = config.coldDayThreshold

  const getCircleClass = (d: typeof days[0]) => {
    if (d.isToday) return 'bg-[#EF4444] border-[#EF4444]'
    if (d.isFuture) return 'border-white/12 bg-transparent'
    if (!d.log) return 'border-[#EF4444]/25 bg-[#EF4444]/5'
    if (d.log.score >= threshold) return 'bg-white border-white'
    if (d.log.score >= 50) return 'bg-amber-500/70 border-amber-500'
    return 'bg-[#EF4444]/30 border-[#EF4444]/30'
  }

  const selectedLog = selected ? dayLogs.find(d => d.date === selected) : null
  const selectedDay = selected ? days.find(d => d.date === selected) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {days.map(d => (
          <div key={d.date} className="relative">
            {d.isToday && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] text-[#EF4444] font-black">↓</div>
            )}
            <button
              onClick={() => setSelected(selected === d.date ? null : d.date)}
              title={`Día ${d.dayNum}`}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                getCircleClass(d),
                selected === d.date && 'scale-125 ring-2 ring-white/20'
              )}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-gray-600">
        {[
          { cl: 'bg-white', label: 'Cold day' },
          { cl: 'bg-[#EF4444]', label: 'Hoy' },
          { cl: 'bg-amber-500/70', label: 'Parcial' },
          { cl: 'border-2 border-[#EF4444]/25', label: 'Sin registrar' },
          { cl: 'border-2 border-white/12', label: 'Próximo' },
        ].map(({ cl, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={cn('w-3 h-3 rounded-full inline-block', cl)} /> {label}
          </span>
        ))}
      </div>

      <AnimatePresence>
        {selected && selectedDay && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-gray-500 font-bold">DAY {selectedDay.dayNum}</p>
                <p className="text-sm text-white font-bold">{selected}</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedLog && (
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{selectedLog.score}<span className="text-sm font-normal text-gray-500">%</span></p>
                    <p className="text-[9px] text-gray-500">SCORE</p>
                  </div>
                )}
                <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white"><X size={14} /></button>
              </div>
            </div>
            {selectedLog ? (
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'fitness', label: 'Fitness', icon: '💪' },
                  { key: 'spiritual', label: 'Espiritual', icon: '✝️' },
                  { key: 'career', label: 'Carrera', icon: '📚' },
                  { key: 'mental', label: 'Mental', icon: '🧠' },
                  { key: 'digital', label: 'Digital', icon: '📵' },
                  { key: 'finance', label: 'Finanzas', icon: '💰' },
                ].map(({ key, label, icon }) => {
                  const val = selectedLog[key as keyof typeof selectedLog] as boolean
                  return (
                    <div key={key} className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[11px]', val ? 'bg-white/10 text-white' : 'bg-white/[0.02] text-gray-600')}>
                      <span>{icon}</span> {label} {val ? '✓' : '—'}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-600">Sin registrar</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Daily Mission ─────────────────────────────────────────────────────────────
function DailyMission() {
  const store = useWinterArcStore()
  const { getTodaySessions } = usePomodoroStore()
  const { workoutSessions } = usePhysicalStore()

  const t = todayStr()
  const todayPomodoros = getTodaySessions().length
  const todayWorkout = workoutSessions.some(w => w.date === t && w.completed)
  const todayLog = store.getDayLog(t)

  const [local, setLocal] = useState({
    fitness: todayWorkout,
    spiritual: false,
    career: todayPomodoros >= 2,
    mental: todayPomodoros >= 1,
    digital: false,
    finance: false,
  })

  const score = store.computeDayScore(local)
  const xp = store.computeDayXP(local, score)
  const isCold = score >= (store.config?.coldDayThreshold ?? 80)

  const toggle = (key: keyof typeof local) => setLocal(s => ({ ...s, [key]: !s[key] }))

  const missions = [
    { key: 'fitness' as const, icon: '💪', label: 'Entrenamiento', desc: 'Sesión de gym completada', auto: todayWorkout },
    { key: 'spiritual' as const, icon: '✝️', label: 'Espiritual', desc: 'Oración / Biblia / devocional' },
    { key: 'career' as const, icon: '📚', label: 'Carrera', desc: `${todayPomodoros} pomodoros hoy` },
    { key: 'mental' as const, icon: '🧠', label: 'Mental', desc: 'Lectura / aprendizaje' },
    { key: 'digital' as const, icon: '📵', label: 'Disciplina digital', desc: 'Redes bajo control hoy' },
    { key: 'finance' as const, icon: '💰', label: 'Finanzas', desc: 'Sin gastos innecesarios' },
  ]

  return (
    <div className="space-y-3">
      {/* Score ring + status */}
      <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-xl border border-white/5">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="32" cy="32" r="26" fill="none"
              stroke={isCold ? '#fff' : score >= 50 ? '#F59E0B' : '#EF4444'}
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-black text-white leading-none">{score}</span>
            <span className="text-[7px] text-gray-500">SCORE</span>
          </div>
        </div>
        <div>
          <p className={cn('text-base font-black', isCold ? 'text-white' : 'text-gray-400')}>
            {isCold ? '❄ COLD DAY' : score >= 50 ? '⚡ PROGRESO' : '🎯 SIGUE'}
          </p>
          <p className="text-xs text-gray-500">+{xp} XP · {Object.values(local).filter(Boolean).length}/6</p>
          {todayLog && <p className="text-[10px] text-emerald-400 mt-0.5">✓ Registrado</p>}
        </div>
      </div>

      {/* Missions */}
      <div className="space-y-1.5">
        {missions.map(m => (
          <button key={m.key} onClick={() => toggle(m.key)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
              local[m.key] ? 'border-white/12 bg-white/5' : 'border-white/5 bg-white/[0.02] hover:border-white/8'
            )}>
            <span className="text-base">{m.icon}</span>
            <div className="flex-1">
              <p className={cn('text-sm font-bold', local[m.key] ? 'text-white' : 'text-gray-400')}>{m.label}</p>
              <p className="text-[11px] text-gray-600">{m.desc}</p>
            </div>
            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0', local[m.key] ? 'border-white bg-white' : 'border-white/20')}>
              {local[m.key] && <Check size={10} className="text-black" strokeWidth={3} />}
            </div>
          </button>
        ))}
      </div>

      <button onClick={() => store.logDay({ ...local, score, xpEarned: xp })}
        className="w-full py-3 rounded-xl bg-[#EF4444] text-white font-black text-sm tracking-wider hover:bg-red-500 transition-colors">
        GUARDAR DÍA {todayLog ? '(ACTUALIZAR)' : ''}
      </button>
    </div>
  )
}

// ─── Benefits Timeline ─────────────────────────────────────────────────────────
const MILESTONES = [
  { day: 1, title: 'DIGITAL RESET', content: 'Puede aparecer el impulso automático de revisar el teléfono. Estás empezando a romper un patrón de uso automático.' },
  { day: 3, title: 'AWARENESS', content: 'Puedes empezar a notar más momentos de concentración sin interrupciones constantes.' },
  { day: 7, title: 'PRIMERA SEMANA', content: 'Con consistencia, es posible que notes más energía matutina y menos resistencia para comenzar tareas.' },
  { day: 14, title: 'TWO WEEKS', content: 'Dos semanas tomando decisiones alineadas con tu objetivo. Tu entrenamiento empieza a sentirse más natural.' },
  { day: 21, title: 'HABIT FORMATION', content: 'Con 21 días, los hábitos que practicas diariamente comienzan a requerir menos fuerza de voluntad consciente.' },
  { day: 30, title: 'UN MES', content: 'Has acumulado 30 días de evidencia de que puedes mantener disciplina. Tu cuerpo y mente se están adaptando.' },
  { day: 60, title: 'DOS MESES', content: 'Es posible que notes cambios visibles en tu físico, mayor claridad mental y mejor control emocional.' },
  { day: 90, title: 'WINTER ARC COMPLETE', content: '90 días. Has construido evidencia real de quién puedes ser. No eres la misma persona que empezó.' },
]

function BenefitsTimeline({ currentDay }: { currentDay: number }) {
  return (
    <div className="space-y-0">
      {MILESTONES.map((m, i) => {
        const reached = currentDay >= m.day
        return (
          <div key={m.day} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-black shrink-0', reached ? 'border-white bg-white text-black' : 'border-white/10 bg-transparent text-gray-600')}>
                {reached ? '✓' : m.day}
              </div>
              {i < MILESTONES.length - 1 && <div className={cn('w-px flex-1 min-h-[28px]', reached ? 'bg-white/15' : 'bg-white/5')} />}
            </div>
            <div className="pb-5 pt-0.5 min-w-0">
              <p className={cn('text-[9px] tracking-[0.3em] font-bold mb-0.5', reached ? 'text-[#EF4444]' : 'text-gray-700')}>DAY {m.day}</p>
              <p className={cn('text-sm font-black mb-0.5', reached ? 'text-white' : 'text-gray-600')}>{m.title}</p>
              <p className={cn('text-xs leading-relaxed', reached ? 'text-gray-400' : 'text-gray-700')}>{m.content}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
function StatsOverview() {
  const store = useWinterArcStore()
  const timeRecovered = store.getTimeRecoveredMinutes()
  const stats = [
    { label: 'COLD DAYS', value: store.getTotalColdDays(), icon: '❄️' },
    { label: 'BEST STREAK', value: `${store.getBestStreak()}d`, icon: '🔥' },
    { label: 'AVG SCORE', value: `${store.getAverageScore()}%`, icon: '📊' },
    { label: 'WEEK AVG', value: `${store.getWeekAverage()}%`, icon: '📈' },
    { label: 'FITNESS DAYS', value: store.getTotalFitnessDays(), icon: '💪' },
    { label: 'SPIRITUAL', value: store.getTotalSpiritualDays(), icon: '✝️' },
    { label: 'DIGITAL WINS', value: store.getTotalDigitalDays(), icon: '📵' },
    { label: 'TIME RECOVERED', value: fmtMins(timeRecovered), icon: '⏰' },
  ]
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map(s => (
          <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
            <p className="text-base mb-0.5">{s.icon}</p>
            <p className="text-lg font-black text-white">{s.value}</p>
            <p className="text-[8px] tracking-[0.2em] text-gray-600 font-bold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {timeRecovered > 0 && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] tracking-[0.3em] text-[#EF4444] font-bold mb-1">TIME RECOVERED</p>
          <p className="text-2xl font-black text-white">{fmtMins(timeRecovered)}</p>
          <p className="text-xs text-gray-500 mt-1">recuperados de redes sociales durante este Winter Arc.</p>
        </div>
      )}
    </div>
  )
}

// ─── Achievements ─────────────────────────────────────────────────────────────
function AchievementsSection() {
  const { achievements } = useWinterArcStore()
  return (
    <div className="grid grid-cols-2 gap-2">
      {achievements.map(a => (
        <div key={a.id} className={cn('p-3 rounded-xl border', a.unlockedAt ? 'border-white/15 bg-white/5' : 'border-white/5 bg-white/[0.02]')}>
          <span className="text-xl">{a.icon}</span>
          {a.unlockedAt && <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] inline-block ml-1 mb-0.5" />}
          <p className={cn('text-xs font-black leading-tight mt-1', a.unlockedAt ? 'text-white' : 'text-gray-600')}>{a.label}</p>
          <p className={cn('text-[10px] mt-0.5', a.unlockedAt ? 'text-gray-500' : 'text-gray-700')}>{a.description}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Identity Section ──────────────────────────────────────────────────────────
function IdentitySection({ currentDay }: { currentDay: number }) {
  const { config } = useWinterArcStore()
  if (!config) return null
  return (
    <div className="space-y-4">
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
        <p className="text-[10px] tracking-[0.4em] text-[#EF4444] font-bold mb-3">WHO ARE YOU BECOMING?</p>
        <p className="text-sm text-gray-300 leading-relaxed italic">"{config.identityStatement}"</p>
      </div>
      {[30, 60, 90].filter(m => currentDay >= m).map(m => (
        <div key={m} className="border-l-2 border-[#EF4444]/30 pl-4">
          <p className="text-[10px] tracking-[0.3em] text-gray-600 font-bold mb-1">DAY {m}</p>
          <p className="text-xs text-gray-400">{m} days ago you said you wanted to become this person.</p>
          <p className="text-xs text-white font-bold mt-0.5">You are building evidence that you can.</p>
        </div>
      ))}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.4em] text-gray-600 font-bold">TRANSFORMATION GOALS</p>
        {config.transformationGoals.filter(g => g.enabled).map(g => (
          <div key={g.area} className="flex items-start gap-3">
            <span className="text-base">{g.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{g.area}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{g.vision}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Rules Section ─────────────────────────────────────────────────────────────
function RulesSection() {
  const { config } = useWinterArcStore()
  if (!config) return null
  return (
    <div>
      <p className="text-[10px] tracking-[0.4em] text-[#EF4444] font-bold mb-4">MY WINTER RULES</p>
      {config.rules.map((r, i) => (
        <div key={r.id} className="flex items-start gap-3 py-3 border-b border-white/5">
          <span className="text-[11px] font-black text-[#EF4444] w-5 text-right shrink-0">{i + 1}.</span>
          <p className="text-sm text-gray-300 leading-relaxed">{r.text}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Active Dashboard ──────────────────────────────────────────────────────────
type ActiveTab = 'hoy' | 'calendario' | 'timeline' | 'stats' | 'identity' | 'reglas' | 'logros'

function ActiveDashboard() {
  const store = useWinterArcStore()
  const [tab, setTab] = useState<ActiveTab>('hoy')
  const { config, dayLogs, deactivate } = store

  if (!config) return null

  const currentDay = store.getCurrentDay()
  const daysLeft = store.getDaysLeft()
  const coldStreak = store.getColdStreak()
  const totalXP = store.getTotalXP()
  const avgScore = store.getAverageScore()

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'hoy', label: 'HOY' },
    { id: 'calendario', label: 'GRID' },
    { id: 'timeline', label: 'TIMELINE' },
    { id: 'stats', label: 'STATS' },
    { id: 'identity', label: 'IDENTITY' },
    { id: 'logros', label: 'LOGROS' },
    { id: 'reglas', label: 'REGLAS' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Hero card */}
      <DarkCard className="p-6">
        <p className="text-[9px] tracking-[0.5em] text-[#EF4444] font-bold uppercase mb-4">❄ Winter Arc · Active</p>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[56px] font-black text-white leading-none">
                {String(currentDay).padStart(2, '0')}
              </span>
              <span className="text-gray-600 text-xl font-bold">/ {config.duration}</span>
            </div>
            <p className="text-xs text-gray-600 tracking-widest mt-1">YOU ARE HERE →</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] tracking-[0.3em] text-gray-600 font-bold">DAYS LEFT</p>
            <p className="text-3xl font-black text-white">{daysLeft}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/8 rounded-full overflow-hidden mb-5">
          <motion.div className="h-full bg-[#EF4444] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (currentDay / config.duration) * 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'COLD STREAK', value: `${coldStreak}❄` },
            { label: 'TOTAL XP', value: totalXP },
            { label: 'AVG SCORE', value: `${avgScore}%` },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.04] rounded-xl p-3 border border-white/5 text-center">
              <p className="text-base font-black text-white">{s.value}</p>
              <p className="text-[8px] tracking-[0.2em] text-gray-600 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-gray-700 text-center mt-4 tracking-wider">
          {daysLeft} DAYS LEFT TO BUILD THE LIFE YOU WANT.
        </p>
      </DarkCard>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all whitespace-nowrap',
              tab === t.id ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-gray-500 hover:bg-white/8 hover:text-gray-300'
            )}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
          <DarkCard className="p-5">
            {tab === 'hoy' && <DailyMission />}
            {tab === 'calendario' && (
              <>
                <p className="text-[9px] tracking-[0.4em] text-gray-600 font-bold mb-4">{config.duration} DAYS · {dayLogs.length} LOGGED</p>
                <CircleGrid config={config} dayLogs={dayLogs} />
              </>
            )}
            {tab === 'timeline' && (
              <>
                <p className="text-[9px] tracking-[0.4em] text-gray-600 font-bold mb-4">WHAT YOU MAY EXPERIENCE</p>
                <BenefitsTimeline currentDay={currentDay} />
              </>
            )}
            {tab === 'stats' && <StatsOverview />}
            {tab === 'identity' && <IdentitySection currentDay={currentDay} />}
            {tab === 'logros' && (
              <>
                <p className="text-[9px] tracking-[0.4em] text-gray-600 font-bold mb-4">BENEFITS UNLOCKED</p>
                <AchievementsSection />
              </>
            )}
            {tab === 'reglas' && <RulesSection />}
          </DarkCard>
        </motion.div>
      </AnimatePresence>

      {/* End button */}
      <button onClick={() => { if (confirm('¿Terminar el Winter Arc?')) deactivate() }}
        className="w-full py-2.5 rounded-xl border border-white/8 text-xs text-gray-600 font-bold tracking-wider hover:border-white/15 hover:text-gray-400 transition-all bg-white/[0.02]">
        TERMINAR WINTER ARC
      </button>
    </div>
  )
}

// ─── Page root ──────────────────────────────────────────────────────────────────
export default function WinterArcPage() {
  const { isActive } = useWinterArcStore()
  const [justActivated, setJustActivated] = useState(false)

  if (isActive || justActivated) return <ActiveDashboard />
  return <SetupWizard onActivate={() => setJustActivated(true)} />
}
