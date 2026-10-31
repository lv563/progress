'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Lock, Trophy, Plus, Minus } from 'lucide-react'
import {
  useReto40Store, PILLAR_CONFIG, STAGES, RETO_DURATION, BONUS_XP_FULL_DAY,
  ALL_PILLAR_KEYS,
  type PillarKey, type RetoDayLog, type CodingSession, type Reto40Store,
} from '@/stores/reto40.store'
import { useAppStore } from '@/stores/app.store'

// ── Helpers ──────────────────────────────────────────────────────────────────

const localDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const staggerParent = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
}

// ── Tiny reusables ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] tracking-[0.4em] font-black uppercase text-white/40 mb-1">{children}</p>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-white/8 bg-[#111] rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  )
}

// ── Activation screen ─────────────────────────────────────────────────────────

function ActivationScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔥</div>
          <p className="text-[9px] tracking-[0.4em] font-black uppercase text-[#EF4444] mb-2">Kingdom OS</p>
          <h1 className="text-4xl font-black">RETO</h1>
          <h1 className="text-4xl font-black text-[#EF4444]">40 DÍAS</h1>
          <p className="text-white/40 text-sm mt-4 leading-relaxed">
            5 hábitos núcleo · 6 etapas · 10 pilares<br />
            Puedes fallar 1 día.{' '}
            <span className="text-white font-bold">Nunca 2 seguidos.</span>
          </p>
        </div>

        <div className="space-y-2 mb-8">
          {(['fe', 'codigo', 'gym', 'comida', 'redes'] as PillarKey[]).map(k => (
            <div key={k} className="flex items-center gap-3 bg-white/4 rounded-xl p-3">
              <span className="text-xl">{PILLAR_CONFIG[k].emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{PILLAR_CONFIG[k].label}</p>
                <p className="text-[10px] text-white/30">{PILLAR_CONFIG[k].description}</p>
              </div>
              <span className="text-[10px] font-bold text-[#EF4444]">+{PILLAR_CONFIG[k].xp}XP</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-white/25 mb-6">
          31 oct 2026 → 9 dic 2026
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full bg-[#EF4444] text-white font-black text-sm tracking-[0.2em] uppercase py-4 rounded-2xl"
        >
          Comenzar el Reto
        </motion.button>
      </motion.div>
    </div>
  )
}

// ── Pillar row ────────────────────────────────────────────────────────────────

function PillarRow({
  pillarKey, done, locked, onToggle,
}: {
  pillarKey: PillarKey; done: boolean; locked: boolean; onToggle: () => void
}) {
  const cfg = PILLAR_CONFIG[pillarKey]
  return (
    <motion.button
      variants={fadeUp}
      onClick={onToggle}
      disabled={locked}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
        locked
          ? 'opacity-25 cursor-not-allowed'
          : done
          ? 'bg-[#EF4444]/10 border border-[#EF4444]/30'
          : 'bg-white/4 border border-white/8 hover:bg-white/8'
      }`}
    >
      <span className="text-lg shrink-0">{locked ? '🔒' : cfg.emoji}</span>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-sm font-semibold truncate ${done ? 'text-white' : 'text-white/70'}`}>{cfg.label}</p>
        <p className="text-[10px] text-white/30 truncate">{cfg.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold ${done ? 'text-[#EF4444]' : 'text-white/20'}`}>
          +{cfg.xp}XP
        </span>
        {done ? (
          <CheckCircle2 size={18} className="text-[#EF4444]" />
        ) : locked ? (
          <Lock size={16} className="text-white/20" />
        ) : (
          <Circle size={18} className="text-white/20" />
        )}
      </div>
    </motion.button>
  )
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

function Heatmap40({
  startDate, today, getCompletionPct,
}: {
  startDate: string
  today: string
  getCompletionPct: (date: string) => number
}) {
  return (
    <div className="grid grid-cols-8 gap-1.5 mt-2">
      {Array.from({ length: RETO_DURATION }).map((_, i) => {
        const d = new Date(startDate + 'T12:00:00')
        d.setDate(d.getDate() + i)
        const dateStr = localDateStr(d)
        const isFuture = dateStr > today
        const isToday = dateStr === today
        const pct = isFuture ? -1 : getCompletionPct(dateStr)

        let bg = 'bg-[#1a1a1a]'
        if (isFuture) bg = 'bg-[#111]'
        else if (pct === 100) bg = 'bg-[#EF4444]'
        else if (pct >= 50) bg = 'bg-[#EF4444]/50'
        else if (pct > 0) bg = 'bg-[#EF4444]/20'
        else bg = 'bg-[#1a1a1a]'

        return (
          <div
            key={i}
            title={`Día ${i + 1}${isToday ? ' (hoy)' : ''}: ${isFuture ? 'próximo' : pct < 0 ? 'sin registro' : `${pct}%`}`}
            className={`aspect-square rounded-sm ${bg} ${isToday ? 'ring-1 ring-white' : ''} relative`}
          >
            {isToday && (
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white/70">
                {i + 1}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── HOY tab ───────────────────────────────────────────────────────────────────

function HoyTab({
  store, dayNum, dayLog, togglePillar, pct, totalXP, streak,
}: {
  store: Reto40Store
  dayNum: number
  dayLog: RetoDayLog | undefined
  togglePillar: (k: PillarKey) => void
  pct: number
  totalXP: number
  streak: number
}) {
  const today = localDateStr()
  const activePillars = store.getActivePillars(dayNum)
  const xpToday = dayLog?.xpEarned ?? 0
  const maxXP = activePillars.reduce((acc, k) => acc + PILLAR_CONFIG[k].xp, 0) + BONUS_XP_FULL_DAY
  const currentStage = [...STAGES].reverse().find(s => dayNum >= s.unlockDay) ?? STAGES[0]
  const nextStage = STAGES.find(s => s.unlockDay > dayNum)

  return (
    <motion.div variants={staggerParent} initial="initial" animate="animate" className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <motion.div variants={fadeUp}>
          <Card>
            <Label>XP hoy</Label>
            <p className="text-2xl font-black text-[#EF4444]">
              {xpToday}<span className="text-xs text-white/30">/{maxXP}</span>
            </p>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card>
            <Label>XP total</Label>
            <p className="text-2xl font-black text-white">{totalXP}</p>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <Label>Etapa actual</Label>
              <p className="font-bold text-white text-sm">{currentStage.stage}. {currentStage.label}</p>
              <p className="text-[10px] text-white/30 mt-0.5">Días {currentStage.days}</p>
            </div>
            {nextStage && (
              <div className="text-right">
                <p className="text-[9px] text-white/25 uppercase tracking-wider">Próxima</p>
                <p className="text-xs text-white/40">Día {nextStage.unlockDay}</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <Label>Hábitos de hoy</Label>
          <span className="text-[10px] text-white/40">{pct}% completado</span>
        </div>
        <motion.div variants={staggerParent} initial="initial" animate="animate" className="space-y-2">
          {ALL_PILLAR_KEYS.map(k => (
            <PillarRow
              key={k}
              pillarKey={k}
              done={dayLog?.[k] === true}
              locked={!activePillars.includes(k)}
              onToggle={() => togglePillar(k)}
            />
          ))}
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Label>Progreso 40 días</Label>
        <Heatmap40
          startDate={store.startDate}
          today={today}
          getCompletionPct={store.getCompletionPct}
        />
      </motion.div>
    </motion.div>
  )
}

// ── FE tab ────────────────────────────────────────────────────────────────────

function FeTab({ store, today }: { store: Reto40Store; today: string }) {
  const chapter = store.getChapterForDate(today)
  const existing = store.getFeLog(today)
  const [verse, setVerse] = useState(existing?.verse ?? '')
  const [godSpoke, setGodSpoke] = useState(existing?.godSpoke ?? '')
  const [application, setApplication] = useState(existing?.application ?? '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    const completed = Boolean(verse.trim() && godSpoke.trim() && application.trim())
    store.upsertFeLog({ chapter, verse: verse.trim(), godSpoke: godSpoke.trim(), application: application.trim(), completed })
    store.upsertDayLog(today, { fe: completed })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const recentLogs = [...store.feLogs].reverse().slice(0, 3)

  return (
    <motion.div variants={staggerParent} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={fadeUp}>
        <Card className="text-center">
          <p className="text-5xl font-black text-[#EF4444]">{chapter}</p>
          <p className="text-white/40 text-sm mt-1">Proverbios {chapter}</p>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <Label>Versículo que me habló</Label>
          <textarea
            value={verse}
            onChange={e => setVerse(e.target.value)}
            placeholder="Escribe el versículo..."
            className="w-full bg-white/4 rounded-xl p-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-[#EF4444]/50 mt-1"
            rows={3}
          />
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <Label>¿Qué me dijo Dios hoy?</Label>
          <textarea
            value={godSpoke}
            onChange={e => setGodSpoke(e.target.value)}
            placeholder="Una línea que captura lo que Dios te habló..."
            className="w-full bg-white/4 rounded-xl p-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-[#EF4444]/50 mt-1"
            rows={2}
          />
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <Label>¿Cómo lo aplico hoy?</Label>
          <textarea
            value={application}
            onChange={e => setApplication(e.target.value)}
            placeholder="Acción concreta para hoy..."
            className="w-full bg-white/4 rounded-xl p-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-[#EF4444]/50 mt-1"
            rows={2}
          />
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
            saved ? 'bg-white text-black' : 'bg-[#EF4444] text-white hover:bg-[#d73333]'
          }`}
        >
          {saved ? '✓ Guardado' : 'Guardar reflexión — +20XP'}
        </motion.button>
      </motion.div>

      {recentLogs.length > 0 && (
        <motion.div variants={fadeUp}>
          <Label>Reflexiones recientes</Label>
          <div className="space-y-2 mt-2">
            {recentLogs.map(log => (
              <Card key={log.date}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-white/40">Proverbios {log.chapter}</p>
                  <p className="text-[10px] text-white/25">{log.date}</p>
                </div>
                {log.godSpoke && (
                  <p className="text-xs text-white/60 italic">"{log.godSpoke}"</p>
                )}
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ── CÓDIGO tab ─────────────────────────────────────────────────────────────────

function CodigoTab({ store, today }: { store: Reto40Store; today: string }) {
  const [duration, setDuration] = useState(60)
  const [resource, setResource] = useState<CodingSession['resource']>('CS50')
  const [lesson, setLesson] = useState('')
  const [usedAI, setUsedAI] = useState(false)
  const [aiPurpose, setAiPurpose] = useState('')
  const [concept, setConcept] = useState('')
  const [saved, setSaved] = useState(false)
  const sessions = store.getCodingSessions(today)
  const totalHours = store.getTotalCodingHours()

  const handleAdd = () => {
    if (!lesson.trim() || !concept.trim()) return
    store.addCodingSession({
      date: today, durationMin: duration, resource,
      lesson: lesson.trim(), usedAI,
      aiPurpose: usedAI ? aiPurpose.trim() : undefined,
      concept: concept.trim(), completed: true,
    })
    store.upsertDayLog(today, { codigo: !usedAI })
    setLesson(''); setAiPurpose(''); setConcept(''); setUsedAI(false); setDuration(60)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <motion.div variants={staggerParent} initial="initial" animate="animate" className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <motion.div variants={fadeUp}>
          <Card>
            <Label>Horas totales</Label>
            <p className="text-2xl font-black text-white">{totalHours}h</p>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card>
            <Label>Sesiones hoy</Label>
            <p className="text-2xl font-black text-white">{sessions.length}</p>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={fadeUp}>
        <Card className="border-[#EF4444]/15 bg-[#EF4444]/5">
          <p className="text-[10px] text-[#EF4444]/80">
            ⚠️ El pilar "Código sin IA" solo se marca si <strong>no</strong> usaste IA para codear. Registro honesto.
          </p>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <Label>Nueva sesión</Label>
          <div className="flex gap-2 mt-2 mb-3">
            {(['CS50', 'HolaMundo', 'otro'] as const).map(r => (
              <button
                key={r}
                onClick={() => setResource(r)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                  resource === r ? 'bg-[#EF4444] text-white' : 'bg-white/8 text-white/50 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs text-white/50 flex-1">Duración</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDuration(d => Math.max(15, d - 15))}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/60 hover:text-white"
              >
                <Minus size={13} />
              </button>
              <span className="text-sm font-bold w-14 text-center">{duration} min</span>
              <button
                onClick={() => setDuration(d => d + 15)}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/60 hover:text-white"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          <input
            value={lesson}
            onChange={e => setLesson(e.target.value)}
            placeholder="¿Qué lección / tema?"
            className="w-full bg-white/4 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#EF4444]/50 mb-3"
          />

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-white/60">¿Usé IA para codear?</p>
            <button
              onClick={() => setUsedAI(v => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative ${usedAI ? 'bg-[#EF4444]' : 'bg-white/20'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${usedAI ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {usedAI && (
            <input
              value={aiPurpose}
              onChange={e => setAiPurpose(e.target.value)}
              placeholder="¿Para qué? (ej. explicar un concepto)"
              className="w-full bg-white/4 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#EF4444]/50 mb-3"
            />
          )}

          <textarea
            value={concept}
            onChange={e => setConcept(e.target.value)}
            placeholder="Explica el concepto principal con tus propias palabras..."
            className="w-full bg-white/4 rounded-xl p-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-[#EF4444]/50 mb-3"
            rows={3}
          />

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            disabled={!lesson.trim() || !concept.trim()}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
              saved
                ? 'bg-white text-black'
                : 'bg-[#EF4444] text-white hover:bg-[#d73333] disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            {saved ? '✓ Sesión guardada' : 'Registrar sesión'}
          </motion.button>
        </Card>
      </motion.div>

      {sessions.length > 0 && (
        <motion.div variants={fadeUp}>
          <Label>Sesiones de hoy</Label>
          <div className="space-y-2 mt-2">
            {sessions.map(s => (
              <Card key={s.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold truncate flex-1 mr-2">{s.lesson}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    s.usedAI ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-white/10 text-white/50'
                  }`}>
                    {s.usedAI ? 'con IA' : 'sin IA'}
                  </span>
                </div>
                <p className="text-[10px] text-white/30">{s.resource} · {s.durationMin} min</p>
                {s.concept && (
                  <p className="text-xs text-white/40 mt-1 italic">"{s.concept}"</p>
                )}
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ── ETAPAS tab ─────────────────────────────────────────────────────────────────

function EtapasTab({ store, dayNum }: { store: Reto40Store; dayNum: number }) {
  const currentStageNum = ([...STAGES].reverse().find(s => dayNum >= s.unlockDay) ?? STAGES[0]).stage

  return (
    <motion.div variants={staggerParent} initial="initial" animate="animate" className="space-y-4">
      <div className="space-y-3">
        {STAGES.map(stage => {
          const isUnlocked = dayNum >= stage.unlockDay
          const isCurrent = currentStageNum === stage.stage
          return (
            <motion.div key={stage.stage} variants={fadeUp}>
              <Card className={isCurrent ? 'border-[#EF4444]/40' : ''}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-black ${
                    isCurrent ? 'bg-[#EF4444] text-white' : isUnlocked ? 'bg-white/20 text-white' : 'bg-white/5 text-white/20'
                  }`}>
                    {stage.stage}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-white/30'}`}>
                        {stage.label}
                      </p>
                      {isCurrent && (
                        <span className="text-[9px] bg-[#EF4444]/20 text-[#EF4444] font-bold px-2 py-0.5 rounded-full tracking-wider">
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5">Días {stage.days} · {stage.description}</p>
                    {!isUnlocked && (
                      <p className="text-[9px] text-white/20 mt-1">🔒 Desbloquea en día {stage.unlockDay}</p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <motion.div variants={fadeUp}>
        <Label>Estadísticas por pilar</Label>
        <div className="space-y-2 mt-2">
          {ALL_PILLAR_KEYS.map(k => {
            const cfg = PILLAR_CONFIG[k]
            const isLocked = cfg.unlockDay > dayNum
            const eligibleLogs = store.dayLogs.filter(l => l.day >= cfg.unlockDay)
            const doneLogs = eligibleLogs.filter(l => l[k])
            const pct = eligibleLogs.length > 0
              ? Math.round((doneLogs.length / eligibleLogs.length) * 100)
              : 0
            return (
              <div
                key={k}
                className={`flex items-center gap-3 p-3 rounded-xl bg-white/4 ${isLocked ? 'opacity-25' : ''}`}
              >
                <span className="text-base">{isLocked ? '🔒' : cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-white/80 truncate">{cfg.label}</p>
                    <p className="text-[10px] text-white/40 shrink-0 ml-2">{doneLogs.length}/{eligibleLogs.length}</p>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EF4444] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs font-black text-white/40 w-9 text-right shrink-0">{pct}%</p>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── LOGROS tab ─────────────────────────────────────────────────────────────────

function LogrosTab({ store }: { store: Reto40Store }) {
  const unlockedCount = store.achievements.filter(a => a.unlockedAt).length

  return (
    <motion.div variants={staggerParent} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <Label>Logros desbloqueados</Label>
              <p className="text-2xl font-black text-white">
                {unlockedCount}
                <span className="text-white/30 text-sm">/{store.achievements.length}</span>
              </p>
            </div>
            <Trophy size={28} className="text-[#EF4444]/50" />
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {store.achievements.map(a => (
          <motion.div key={a.id} variants={fadeUp}>
            <Card className={`text-center h-full ${a.unlockedAt ? 'border-[#EF4444]/30 bg-[#EF4444]/5' : 'opacity-35'}`}>
              <p className="text-3xl mb-2">{a.icon}</p>
              <p className="text-xs font-bold text-white leading-tight">{a.label}</p>
              <p className="text-[9px] text-white/40 mt-1 leading-snug">{a.description}</p>
              {a.unlockedAt && (
                <p className="text-[8px] text-[#EF4444] mt-2 font-bold">
                  {new Date(a.unlockedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const TABS = ['hoy', 'fe', 'código', 'etapas', 'logros'] as const
type Tab = (typeof TABS)[number]

export default function Reto40Page() {
  const store = useReto40Store()
  const { addXP } = useAppStore()
  const [tab, setTab] = useState<Tab>('hoy')
  const today = localDateStr()

  if (!store.active) {
    return <ActivationScreen onStart={() => store.activate()} />
  }

  const dayNum = store.getDayNumber(today)
  const activePillars = store.getActivePillars(dayNum)
  const dayLog = store.getDayLog(today)
  const streak = store.getStreak()
  const totalXP = store.getTotalXP()
  const pct = store.getCompletionPct(today)

  const togglePillar = (key: PillarKey) => {
    const current = dayLog?.[key] === true
    store.upsertDayLog(today, { [key]: !current } as Partial<RetoDayLog>)
    if (!current) addXP(PILLAR_CONFIG[key].xp, `Reto 40 — ${PILLAR_CONFIG[key].label}`)
  }

  // Achievement checks
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const log = store.getDayLog(today)
    if (!log) return
    const active = store.getActivePillars(dayNum)
    const allDone = active.every(k => log[k])
    if (allDone && dayNum === 1) store.unlockAchievement('dia1')
    if (dayNum >= 20) store.unlockAchievement('dia20')
    if (store.getStreak() >= 7) store.unlockAchievement('semana1')
    if (store.dayLogs.filter(l => l.gym).length >= 10) store.unlockAchievement('gym_10')
    if (store.dayLogs.filter(l => l.fe).length >= 14) store.unlockAchievement('fe_14')
    const noAISessions = store.codingSessions.filter(s => !s.usedAI).length
    if (noAISessions >= 7) store.unlockAchievement('no_ia_7')
    if (dayNum >= RETO_DURATION && allDone) store.unlockAchievement('reto40')
  }, [dayLog?.xpEarned, dayNum]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] tracking-[0.4em] font-black uppercase text-[#EF4444]">Reto 40 Días</p>
            <h1 className="text-2xl font-black mt-1">
              DÍA {dayNum}{' '}
              <span className="text-white/25">/ {RETO_DURATION}</span>
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[9px] tracking-[0.4em] font-black uppercase text-white/30">Racha</p>
            <p className="text-2xl font-black">
              {streak}<span className="text-sm text-white/30">d</span>
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#EF4444] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(dayNum / RETO_DURATION) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="mt-1 text-[10px] text-white/25">
          {RETO_DURATION - dayNum} días restantes · {pct}% hoy
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/8 px-4 gap-0.5 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-3 text-[10px] tracking-[0.25em] font-black uppercase shrink-0 transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'text-white border-[#EF4444]'
                : 'text-white/30 border-transparent hover:text-white/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {tab === 'hoy' && (
          <HoyTab
            store={store}
            dayNum={dayNum}
            dayLog={dayLog}
            togglePillar={togglePillar}
            pct={pct}
            totalXP={totalXP}
            streak={streak}
          />
        )}
        {tab === 'fe' && <FeTab store={store} today={today} />}
        {tab === 'código' && <CodigoTab store={store} today={today} />}
        {tab === 'etapas' && <EtapasTab store={store} dayNum={dayNum} />}
        {tab === 'logros' && <LogrosTab store={store} />}
      </div>
    </div>
  )
}
