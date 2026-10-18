'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import {
  BookOpen, Shuffle, Clock, Flame, BarChart3, ChevronRight,
  Star, ArrowLeft, Check, Play, Pause, RotateCcw, Heart,
  Search, Filter, Trophy, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { format, addDays, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLearning15Store } from '@/stores/learning15.store'
import type { SessionPhase, OrganizeNotes, EvaluationScore, LearningSession } from '@/stores/learning15.store'
import { LEARNING_TOPICS, LEARNING_CATEGORIES } from '@/data/learning-topics'
import type { LearningTopic } from '@/data/learning-topics'

// ── Phase config ───────────────────────────────────────────────────────────────

const PHASES: { id: SessionPhase; label: string; minutes: number; emoji: string; description: string }[] = [
  { id: 'discover',  label: 'Descubrir',  minutes: 2,  emoji: '🔍', description: 'Lee la pregunta central, la definición y los 3 preguntas clave' },
  { id: 'research',  label: 'Investigar', minutes: 8,  emoji: '📖', description: 'Lee la explicación completa, conceptos clave y ejemplos' },
  { id: 'organize',  label: 'Organizar',  minutes: 2,  emoji: '🗂️', description: 'Estructura lo que aprendiste: idea principal, conceptos, ejemplo' },
  { id: 'explain',   label: 'Explicar',   minutes: 1,  emoji: '🗣️', description: 'Explica en voz alta como si lo enseñaras a alguien' },
  { id: 'evaluate',  label: 'Evaluar',    minutes: 2,  emoji: '⭐', description: 'Auto-evalúa tu comprensión en 4 criterios' },
]

const PHASE_ORDER: SessionPhase[] = ['discover', 'research', 'organize', 'explain', 'evaluate', 'completed']

// ── Phase Timer ────────────────────────────────────────────────────────────────

function PhaseTimer({ targetMinutes, onTimeUp }: { targetMinutes: number; onTimeUp?: () => void }) {
  const targetSec = targetMinutes * 60
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= targetSec && onTimeUp) onTimeUp()
        return e + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, targetSec, onTimeUp])

  const remaining = Math.max(0, targetSec - elapsed)
  const m = Math.floor(remaining / 60).toString().padStart(2, '0')
  const s = (remaining % 60).toString().padStart(2, '0')
  const pct = Math.min(1, elapsed / targetSec)
  const isOver = elapsed >= targetSec

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15.9" fill="none"
            stroke={isOver ? '#EF4444' : '#FFFFFF'} strokeWidth="2.5"
            strokeDasharray={`${pct * 100} 100`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-white font-bold">
          {isOver ? '✓' : `${m}:${s}`}
        </span>
      </div>
      <button onClick={() => setRunning(r => !r)}
        className="p-1.5 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 transition-colors">
        {running ? <Pause size={12} className="text-gray-400" /> : <Play size={12} className="text-gray-400" />}
      </button>
    </div>
  )
}

// ── Discover Phase ─────────────────────────────────────────────────────────────

function DiscoverPhase({ topic }: { topic: LearningTopic }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-5 space-y-2">
        <p className="text-[10px] font-black tracking-[0.3em] text-[#EF4444] uppercase">Pregunta central</p>
        <p className="text-base font-bold text-white">{topic.centralQuestion}</p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-2">
        <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Qué aprenderás</p>
        <p className="text-sm text-gray-300 leading-relaxed">{topic.whatYouWillLearn}</p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
        <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">3 preguntas guía</p>
        {topic.threeQuestions.map((q, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-[#EF4444] font-black text-sm shrink-0">{i + 1}.</span>
            <p className="text-sm text-gray-300">{q}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Research Phase ─────────────────────────────────────────────────────────────

function ResearchPhase({ topic }: { topic: LearningTopic }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-2">
        <p className="text-[10px] font-black tracking-[0.3em] text-[#EF4444] uppercase">Definición</p>
        <p className="text-sm font-medium text-white leading-relaxed">{topic.definition}</p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-2">
        <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Explicación</p>
        <p className="text-sm text-gray-300 leading-relaxed">{topic.explanation}</p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
        <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Conceptos clave</p>
        {topic.keyConcepts.map(c => (
          <div key={c.term} className="space-y-0.5">
            <p className="text-sm font-bold text-white">{c.term}</p>
            <p className="text-xs text-gray-500">{c.definition}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-2">
        <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Ejemplos</p>
        {topic.examples.map((ex, i) => (
          <p key={i} className="text-sm text-gray-400 flex gap-2"><span className="text-[#EF4444] shrink-0">•</span>{ex}</p>
        ))}
      </div>
    </div>
  )
}

// ── Organize Phase ─────────────────────────────────────────────────────────────

function OrganizePhase({ notes, onChange }: { notes: OrganizeNotes; onChange: (n: OrganizeNotes) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Organiza lo que aprendiste sin releer el material:</p>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-400">Idea principal del tema</label>
        <textarea rows={2} value={notes.mainIdea}
          onChange={e => onChange({ ...notes, mainIdea: e.target.value })}
          placeholder="La idea central es…"
          className="w-full rounded-xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 px-3 py-2.5 focus:outline-none focus:border-[#EF4444]/40 resize-none" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">3 conceptos clave (uno por línea)</label>
        {notes.keyConcepts.map((kc, i) => (
          <input key={i} value={kc}
            onChange={e => {
              const updated = [...notes.keyConcepts]
              updated[i] = e.target.value
              onChange({ ...notes, keyConcepts: updated })
            }}
            placeholder={`Concepto ${i + 1}…`}
            className="w-full rounded-xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 px-3 py-2.5 focus:outline-none focus:border-[#EF4444]/40" />
        ))}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-400">Mejor ejemplo que recuerdo</label>
        <textarea rows={2} value={notes.example}
          onChange={e => onChange({ ...notes, example: e.target.value })}
          placeholder="Por ejemplo…"
          className="w-full rounded-xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 px-3 py-2.5 focus:outline-none focus:border-[#EF4444]/40 resize-none" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-400">Pregunta que me quedó pendiente</label>
        <input value={notes.pendingQuestion}
          onChange={e => onChange({ ...notes, pendingQuestion: e.target.value })}
          placeholder="Todavía no entiendo…"
          className="w-full rounded-xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 px-3 py-2.5 focus:outline-none focus:border-[#EF4444]/40" />
      </div>
    </div>
  )
}

// ── Explain Phase ──────────────────────────────────────────────────────────────

function ExplainPhase({ explanation, onChange }: { explanation: string; onChange: (v: string) => void }) {
  const [timeUp, setTimeUp] = useState(false)
  const [started, setStarted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const totalSec = 60

  useEffect(() => {
    if (!started) return
    const id = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= totalSec) setTimeUp(true)
        return Math.min(e + 1, totalSec)
      })
    }, 1000)
    return () => clearInterval(id)
  }, [started])

  const remaining = totalSec - elapsed
  const pct = elapsed / totalSec

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/8 bg-[#111] p-4 text-center space-y-3">
        <p className="text-sm text-gray-400">Tienes 60 segundos para explicar el tema como si lo enseñaras</p>
        {!started ? (
          <Button onClick={() => setStarted(true)} size="lg">
            <Play size={15} /> Iniciar 60 segundos
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={timeUp ? '#EF4444' : '#FFFFFF'} strokeWidth="2.5"
                  strokeDasharray={`${pct * 100} 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-white font-bold">
                {timeUp ? '✓' : remaining}
              </span>
            </div>
            {timeUp && <p className="text-sm text-[#EF4444] font-bold">¡Tiempo completado!</p>}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-400">Escribe un resumen de tu explicación:</label>
        <textarea rows={5} value={explanation}
          onChange={e => onChange(e.target.value)}
          placeholder="Expliqué el tema así…"
          className="w-full rounded-xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 px-3 py-2.5 focus:outline-none focus:border-[#EF4444]/40 resize-none leading-relaxed" />
      </div>
    </div>
  )
}

// ── Evaluate Phase ─────────────────────────────────────────────────────────────

const EVAL_CRITERIA: { key: keyof Omit<EvaluationScore, 'total' | 'notes'>; label: string; weight: number; description: string }[] = [
  { key: 'comprehension', label: 'Comprensión',  weight: 40, description: '¿Entendí realmente el concepto central?' },
  { key: 'clarity',       label: 'Claridad',     weight: 25, description: '¿Pude explicarlo con mis propias palabras?' },
  { key: 'structure',     label: 'Estructura',   weight: 20, description: '¿Organicé bien las ideas en mi mente?' },
  { key: 'accuracy',      label: 'Precisión',    weight: 15, description: '¿Usé los términos correctamente?' },
]

function EvaluatePhase({ scores, onChange }: {
  scores: Omit<EvaluationScore, 'total'>;
  onChange: (s: Omit<EvaluationScore, 'total'>) => void
}) {
  const total = EVAL_CRITERIA.reduce((acc, c) => acc + (scores[c.key] ?? 0) * (c.weight / 100), 0)

  return (
    <div className="space-y-4">
      {EVAL_CRITERIA.map(c => (
        <div key={c.key} className="rounded-2xl border border-white/8 bg-[#111] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{c.label}</p>
              <p className="text-xs text-gray-500">{c.description}</p>
            </div>
            <span className="text-[10px] text-gray-600 font-bold">{c.weight}%</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button key={n} onClick={() => onChange({ ...scores, [c.key]: n })}
                className={cn('w-8 h-8 rounded-lg text-xs font-bold transition-all border',
                  scores[c.key] === n
                    ? 'bg-[#EF4444] text-white border-[#EF4444]'
                    : (scores[c.key] ?? 0) >= n
                      ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/20'
                      : 'bg-white/5 text-gray-500 border-white/8 hover:border-white/20')}>
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Score total */}
      <div className="rounded-2xl border border-white/10 bg-[#111] p-4 flex items-center justify-between">
        <p className="text-sm font-bold text-white">Puntuación total</p>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: total >= 7 ? '#FFFFFF' : total >= 5 ? '#CCCCCC' : '#EF4444' }}>
            {total.toFixed(1)}
          </p>
          <p className="text-[10px] text-gray-500">de 10</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-400">¿Qué debo repasar? (opcional)</label>
        <textarea rows={2} value={scores.notes}
          onChange={e => onChange({ ...scores, notes: e.target.value })}
          placeholder="Lo que me falta reforzar…"
          className="w-full rounded-xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 px-3 py-2.5 focus:outline-none focus:border-[#EF4444]/40 resize-none" />
      </div>
    </div>
  )
}

// ── Session Flow ───────────────────────────────────────────────────────────────

function SessionFlow({ topic, onBack }: { topic: LearningTopic; onBack: () => void }) {
  const store = useLearning15Store()
  const [sessionId] = useState(() =>
    store.startSession(topic.id, topic.title, topic.category, topic.difficulty)
  )
  const [phaseIndex, setPhaseIndex] = useState(0)
  const currentPhase = PHASES[phaseIndex]
  const [organizeNotes, setOrganizeNotes] = useState<OrganizeNotes>({
    mainIdea: '', keyConcepts: ['', '', ''], example: '', pendingQuestion: '',
  })
  const [explanation, setExplanation] = useState('')
  const [evalScores, setEvalScores] = useState<Omit<EvaluationScore, 'total'>>({
    comprehension: 0, clarity: 0, structure: 0, accuracy: 0, notes: '',
  })
  const [completed, setCompleted] = useState(false)

  const canAdvance = useCallback(() => {
    if (currentPhase.id === 'organize') {
      return organizeNotes.mainIdea.trim().length > 0
    }
    if (currentPhase.id === 'explain') {
      return explanation.trim().length > 0
    }
    if (currentPhase.id === 'evaluate') {
      return EVAL_CRITERIA.every(c => (evalScores[c.key] ?? 0) > 0)
    }
    return true
  }, [currentPhase, organizeNotes, explanation, evalScores])

  const advance = () => {
    if (phaseIndex < PHASES.length - 1) {
      setPhaseIndex(i => i + 1)
    } else {
      // Complete
      const total = EVAL_CRITERIA.reduce((acc, c) => acc + (evalScores[c.key] ?? 0) * (c.weight / 100), 0)
      store.updateSession(sessionId, { organizeNotes, explanation })
      store.completeSession(sessionId, { ...evalScores, total })
      setCompleted(true)
    }
  }

  if (completed) {
    const total = EVAL_CRITERIA.reduce((acc, c) => acc + (evalScores[c.key] ?? 0) * (c.weight / 100), 0)
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="rounded-2xl border border-[#EF4444]/25 bg-[#EF4444]/5 p-6 text-center space-y-3">
          <div className="text-5xl">🎉</div>
          <p className="text-xl font-black text-white">¡Sesión completada!</p>
          <p className="text-3xl font-black text-white">{total.toFixed(1)}<span className="text-lg text-gray-500">/10</span></p>
          <p className="text-sm text-gray-400">{topic.title}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-2">
          <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Próxima revisión</p>
          <p className="text-sm text-white">Mañana (repetición espaciada 1-3-7-30 días)</p>
          <p className="text-xs text-gray-500">Las revisiones refuerzan las conexiones neuronales</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
          <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Aplicaciones reales</p>
          {topic.realApplications.map((a, i) => (
            <p key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-[#EF4444] shrink-0">•</span>{a}</p>
          ))}
        </div>
        <Button size="lg" className="w-full" variant="secondary" onClick={onBack}>
          Volver al dashboard
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors">
          <ArrowLeft size={16} className="text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black text-white truncate">{topic.title}</h1>
          <p className="text-xs text-gray-500">{currentPhase.emoji} Fase {phaseIndex + 1} de {PHASES.length}: {currentPhase.label}</p>
        </div>
        <PhaseTimer targetMinutes={currentPhase.minutes} />
      </motion.div>

      {/* Phase progress */}
      <motion.div variants={fadeUp} className="flex gap-1">
        {PHASES.map((p, i) => (
          <div key={p.id} className={cn('flex-1 h-1.5 rounded-full transition-all',
            i < phaseIndex ? 'bg-[#EF4444]' : i === phaseIndex ? 'bg-white' : 'bg-white/10')} />
        ))}
      </motion.div>

      {/* Phase description */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-[#111] p-4">
        <p className="text-xs text-gray-400">{currentPhase.description}</p>
      </motion.div>

      {/* Phase content */}
      <motion.div variants={fadeUp}>
        <AnimatePresence mode="wait">
          <motion.div key={currentPhase.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            {currentPhase.id === 'discover'  && <DiscoverPhase topic={topic} />}
            {currentPhase.id === 'research'  && <ResearchPhase topic={topic} />}
            {currentPhase.id === 'organize'  && <OrganizePhase notes={organizeNotes} onChange={setOrganizeNotes} />}
            {currentPhase.id === 'explain'   && <ExplainPhase explanation={explanation} onChange={setExplanation} />}
            {currentPhase.id === 'evaluate'  && <EvaluatePhase scores={evalScores} onChange={setEvalScores} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Advance */}
      <motion.div variants={fadeUp}>
        <Button size="lg" className="w-full" onClick={advance} disabled={!canAdvance()}>
          {phaseIndex < PHASES.length - 1 ? (
            <><ChevronRight size={16} /> Siguiente: {PHASES[phaseIndex + 1].label}</>
          ) : (
            <><CheckCircle2 size={16} /> Completar sesión</>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ── Topic Card ─────────────────────────────────────────────────────────────────

const DIFF_COLOR = { basico: '#FFFFFF', intermedio: '#CCCCCC', avanzado: '#EF4444' }
const DIFF_LABEL = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' }

function TopicCard({ topic, onStart, studied, isFav, onToggleFav, dueReview }: {
  topic: LearningTopic; onStart: () => void;
  studied: boolean; isFav: boolean; onToggleFav: () => void; dueReview: boolean
}) {
  const catMeta = LEARNING_CATEGORIES.find(c => c.id === topic.category)
  return (
    <motion.div layout className="rounded-2xl border border-white/8 bg-[#111] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{catMeta?.emoji ?? '📖'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white">{topic.title}</p>
            {studied && <CheckCircle2 size={13} className="text-[#EF4444] shrink-0" />}
            {dueReview && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 font-bold">Revisar</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{topic.centralQuestion}</p>
        </div>
        <button onClick={onToggleFav} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0">
          <Heart size={13} className={cn(isFav ? 'text-[#EF4444] fill-[#EF4444]' : 'text-gray-600')} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-gray-400">
          {catMeta?.label}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8"
          style={{ color: DIFF_COLOR[topic.difficulty] }}>
          {DIFF_LABEL[topic.difficulty]}
        </span>
        <div className="flex-1" />
        <button onClick={onStart}
          className="px-3 py-1.5 rounded-xl bg-[#EF4444]/10 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/20 transition-colors">
          {studied ? 'Repasar' : 'Estudiar'}
        </button>
      </div>
    </motion.div>
  )
}

// ── Library ────────────────────────────────────────────────────────────────────

function LibraryPage({ sessions }: { sessions: LearningSession[] }) {
  const completed = sessions.filter(s => s.status !== 'in-progress')
    .sort((a, b) => b.date.localeCompare(a.date))

  if (completed.length === 0) {
    return (
      <div className="text-center py-14 space-y-2">
        <div className="text-5xl">📚</div>
        <p className="text-gray-500 text-sm">Tu biblioteca de conocimiento está vacía.</p>
        <p className="text-gray-600 text-xs">Completa una sesión para verla aquí.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {completed.map(session => {
        const catMeta = LEARNING_CATEGORIES.find(c => c.id === session.category)
        const isDue = session.nextReviewDate && session.nextReviewDate <= format(new Date(), 'yyyy-MM-dd')
        return (
          <div key={session.id} className="rounded-2xl border border-white/8 bg-[#111] p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">{catMeta?.emoji ?? '📖'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">{session.topicTitle}</p>
                  {isDue && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 font-bold">Revisar</span>}
                </div>
                <p className="text-xs text-gray-500">
                  {format(new Date(session.date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              {session.evaluation && (
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-white">{session.evaluation.total.toFixed(1)}</p>
                  <p className="text-[10px] text-gray-500">/10</p>
                </div>
              )}
            </div>
            {session.organizeNotes.mainIdea && (
              <p className="text-xs text-gray-500 border-t border-white/5 pt-2 line-clamp-2">
                {session.organizeNotes.mainIdea}
              </p>
            )}
            {session.nextReviewDate && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <RefreshCw size={11} />
                <span>Próx. revisión: {session.nextReviewDate}</span>
                {session.reviewCount > 0 && <span className="text-gray-700">· {session.reviewCount} rep.</span>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

type MainTab = 'dashboard' | 'temas' | 'biblioteca'

export default function LearningPage() {
  const store = useLearning15Store()
  const [tab, setTab] = useState<MainTab>('dashboard')
  const [activeTopic, setActiveTopic] = useState<LearningTopic | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [diffFilter, setDiffFilter] = useState<string>('all')

  const streak = store.getStreak()
  const studiedIds = store.getStudiedTopicIds()
  const totalSec = store.getTotalSeconds()
  const totalMin = Math.floor(totalSec / 60)
  const catDist = store.getCategoryDistribution()
  const dueReviews = store.getDueReviews()
  const favTopicIds = store.favoritTopicIds

  const filteredTopics = LEARNING_TOPICS.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.centralQuestion.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'all' || t.category === catFilter
    const matchDiff = diffFilter === 'all' || t.difficulty === diffFilter
    return matchSearch && matchCat && matchDiff
  })

  const randomTopic = () => {
    const unstudied = LEARNING_TOPICS.filter(t => !studiedIds.includes(t.id))
    const pool = unstudied.length > 0 ? unstudied : LEARNING_TOPICS
    setActiveTopic(pool[Math.floor(Math.random() * pool.length)])
  }

  if (activeTopic) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <SessionFlow topic={activeTopic} onBack={() => setActiveTopic(null)} />
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            📚 Aprendizaje 15+1
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Método de 5 fases · 15 minutos al día</p>
        </div>
        <Button size="sm" variant="secondary" onClick={randomTopic}>
          <Shuffle size={13} /> Aleatorio
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-[#111] border border-white/8">
        {([['dashboard', '🎯 Dashboard'], ['temas', '🗂️ Temas'], ['biblioteca', '📖 Biblioteca']] as [MainTab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all',
              tab === id ? 'bg-[#EF4444] text-white' : 'text-gray-500 hover:text-gray-300')}>
            {label}
          </button>
        ))}
      </motion.div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <motion.div variants={fadeUp} className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Estudiados', value: studiedIds.length, icon: '📖' },
              { label: 'Racha',      value: `${streak}d`,     icon: '🔥' },
              { label: 'Tiempo',     value: totalMin >= 60 ? `${Math.floor(totalMin/60)}h` : `${totalMin}m`, icon: '⏱️' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-[#111] p-4 text-center">
                <p className="text-2xl">{s.icon}</p>
                <p className="text-xl font-black text-white mt-1">{s.value}</p>
                <p className="text-[11px] text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Due reviews */}
          {dueReviews.length > 0 && (
            <div className="rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-[#EF4444]" />
                <p className="text-sm font-bold text-white">
                  {dueReviews.length} tema{dueReviews.length > 1 ? 's' : ''} para revisar
                </p>
              </div>
              {dueReviews.slice(0, 3).map(s => {
                const topic = LEARNING_TOPICS.find(t => t.id === s.topicId)
                if (!topic) return null
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <p className="flex-1 text-sm text-gray-300 truncate">{s.topicTitle}</p>
                    <button onClick={() => setActiveTopic(topic)}
                      className="px-3 py-1 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/20 transition-colors">
                      Revisar
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Category distribution */}
          {Object.keys(catDist).length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
              <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Distribución por categoría</p>
              {Object.entries(catDist).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                const meta = LEARNING_CATEGORIES.find(c => c.id === cat)
                const maxCount = Math.max(...Object.values(catDist))
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{meta?.emoji} {meta?.label ?? cat}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-[#EF4444]" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Quick start */}
          <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
            <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Inicio rápido</p>
            <div className="grid grid-cols-2 gap-2">
              {LEARNING_TOPICS.filter(t => !studiedIds.includes(t.id)).slice(0, 4).map(t => {
                const cat = LEARNING_CATEGORIES.find(c => c.id === t.category)
                return (
                  <button key={t.id} onClick={() => setActiveTopic(t)}
                    className="rounded-xl border border-white/8 bg-white/5 p-3 text-left hover:border-[#EF4444]/30 hover:bg-[#EF4444]/5 transition-all">
                    <p className="text-base">{cat?.emoji}</p>
                    <p className="text-xs font-bold text-white mt-1 line-clamp-2">{t.title}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Topics */}
      {tab === 'temas' && (
        <motion.div variants={fadeUp} className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tema o pregunta…"
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#EF4444]/40" />
          </div>

          {/* Difficulty filter */}
          <div className="flex gap-1.5">
            {[['all', 'Todos'], ['basico', 'Básico'], ['intermedio', 'Intermedio'], ['avanzado', 'Avanzado']].map(([id, label]) => (
              <button key={id} onClick={() => setDiffFilter(id)}
                className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  diffFilter === id ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8')}>
                {label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setCatFilter('all')}
              className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all',
                catFilter === 'all' ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8')}>
              Todas
            </button>
            {LEARNING_CATEGORIES.filter(c => LEARNING_TOPICS.some(t => t.category === c.id)).map(cat => (
              <button key={cat.id} onClick={() => setCatFilter(cat.id)}
                className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all',
                  catFilter === cat.id ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8')}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Topic list */}
          <div className="space-y-2">
            {filteredTopics.map(t => {
              const sessionForTopic = store.sessions.find(s => s.topicId === t.id && s.status !== 'in-progress')
              const isDue = sessionForTopic?.nextReviewDate
                ? sessionForTopic.nextReviewDate <= format(new Date(), 'yyyy-MM-dd')
                : false
              return (
                <TopicCard key={t.id}
                  topic={t}
                  onStart={() => setActiveTopic(t)}
                  studied={studiedIds.includes(t.id)}
                  isFav={favTopicIds.includes(t.id)}
                  onToggleFav={() => store.toggleFavorite(t.id)}
                  dueReview={isDue}
                />
              )
            })}
            {filteredTopics.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm">No hay temas que coincidan</div>
            )}
          </div>
        </motion.div>
      )}

      {/* Library */}
      {tab === 'biblioteca' && (
        <motion.div variants={fadeUp}>
          <LibraryPage sessions={store.sessions} />
        </motion.div>
      )}
    </motion.div>
  )
}
