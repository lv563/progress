'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import {
  BookOpen, RotateCcw, CheckCircle2, Clock, Flame, Star,
  ChevronRight, X, Heart, Filter, Search, Trophy, BookMarked,
  ArrowLeft, Check, Edit3, Save, Play, Pause
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useBiblicalStore } from '@/stores/biblical.store'
import type { BibleStudyReflection } from '@/stores/biblical.store'
import { BIBLE_CHARACTERS, BIBLE_CATEGORIES } from '@/data/biblical-characters'
import type { BibleCharacter } from '@/data/biblical-characters'

// ── Wheel ──────────────────────────────────────────────────────────────────────

function SpinWheel({ onResult }: { onResult: (char: BibleCharacter) => void }) {
  const { getStudiedCharacterIds, spinWheel } = useBiblicalStore()
  const [spinning, setSpinning] = useState(false)
  const [angle, setAngle] = useState(0)
  const [selected, setSelected] = useState<BibleCharacter | null>(null)
  const studied = getStudiedCharacterIds()

  // Prefer unstudied characters; fallback to all
  const eligible = BIBLE_CHARACTERS.filter(c => !studied.includes(c.id))
  const pool = eligible.length > 0 ? eligible : BIBLE_CHARACTERS

  const spin = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    setSelected(null)
    const winner = pool[Math.floor(Math.random() * pool.length)]
    const extraSpins = 5 + Math.random() * 3
    const finalAngle = angle + extraSpins * 360 + Math.random() * 360
    setAngle(finalAngle)
    setTimeout(() => {
      setSpinning(false)
      setSelected(winner)
      spinWheel(winner.id)
    }, 2800)
  }, [spinning, angle, pool, spinWheel])

  const sliceCount = Math.min(pool.length, 12)
  const displayPool = pool.slice(0, sliceCount)
  const sliceAngle = 360 / sliceCount

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel */}
      <div className="relative w-64 h-64 select-none">
        {/* Pointer */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-0 h-0
          border-l-[10px] border-r-[10px] border-b-[20px]
          border-l-transparent border-r-transparent border-b-[#EF4444]" />
        <motion.div
          className="w-full h-full rounded-full border-4 border-white/10 overflow-hidden relative"
          animate={{ rotate: angle }}
          transition={{ duration: 2.8, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          {displayPool.map((char, i) => {
            const rotation = i * sliceAngle
            const isEven = i % 2 === 0
            return (
              <div
                key={char.id}
                className="absolute inset-0 origin-center"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 origin-bottom flex items-start justify-center pt-3"
                  style={{
                    clipPath: `polygon(50% 100%, ${50 - Math.tan((sliceAngle / 2) * Math.PI / 180) * 100}% 0%, ${50 + Math.tan((sliceAngle / 2) * Math.PI / 180) * 100}% 0%)`,
                    background: isEven ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-lg" style={{ transform: `rotate(${sliceAngle / 2}deg)` }}>
                    {char.emoji}
                  </span>
                </div>
              </div>
            )
          })}
          <div className="absolute inset-8 rounded-full bg-[#0A0A0A] flex items-center justify-center">
            <span className="text-3xl">{selected ? selected.emoji : '📖'}</span>
          </div>
        </motion.div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {selected && !spinning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-xl font-black text-white">{selected.name}</p>
            <p className="text-xs text-gray-500 mt-1">{selected.era}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <Button onClick={spin} disabled={spinning} size="lg">
          <RotateCcw size={16} className={cn(spinning && 'animate-spin')} />
          {spinning ? 'Girando…' : 'Girar la ruleta'}
        </Button>
        {selected && !spinning && (
          <Button variant="secondary" size="lg" onClick={() => onResult(selected)}>
            <BookOpen size={16} /> Estudiar
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Study Session ──────────────────────────────────────────────────────────────

type StudyTab = 'conoce' | 'estudia' | 'reflexion' | 'finalizar'

function StudyTimer({ running }: { running: boolean }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return <span className="font-mono text-sm text-gray-400">{m}:{s}</span>
}

function StudyPage({ character, onBack }: { character: BibleCharacter; onBack: () => void }) {
  const store = useBiblicalStore()
  const [tab, setTab] = useState<StudyTab>('conoce')
  const [timerRunning, setTimerRunning] = useState(true)
  const startRef = useRef(Date.now())
  const [sessionId] = useState(() => store.startStudy(character.id))
  const [reflection, setReflection] = useState<BibleStudyReflection>({
    learned: '', positivesToImitate: '', errorsToAvoid: '', aboutGod: '', application: '', prayer: '',
  })
  const [passagesRead, setPassagesRead] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  const handleComplete = () => {
    const durationMin = Math.round((Date.now() - startRef.current) / 60000)
    store.completeSession(sessionId, reflection, passagesRead, durationMin)
    setSaved(true)
  }

  const tabs: { id: StudyTab; label: string }[] = [
    { id: 'conoce', label: 'Conoce' },
    { id: 'estudia', label: 'Estudia' },
    { id: 'reflexion', label: 'Reflexión' },
    { id: 'finalizar', label: 'Finalizar' },
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors">
          <ArrowLeft size={16} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">{character.emoji} {character.name}</h1>
          <p className="text-xs text-gray-500">{character.era}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTimerRunning(r => !r)} className="p-1.5 rounded-lg bg-white/5 border border-white/8">
            {timerRunning ? <Pause size={13} className="text-gray-400" /> : <Play size={13} className="text-gray-400" />}
          </button>
          <StudyTimer running={timerRunning} />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-[#111] border border-white/8">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all',
              tab === t.id ? 'bg-[#EF4444] text-white' : 'text-gray-500 hover:text-gray-300')}>
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'conoce' && (
          <motion.div key="conoce" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
              <p className="text-[10px] font-black tracking-[0.3em] text-[#EF4444] uppercase">¿Quién fue?</p>
              <p className="text-sm text-gray-300 leading-relaxed">{character.summary}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
              <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Contexto histórico</p>
              <p className="text-sm text-gray-300 leading-relaxed">{character.context}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
              <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Referencias bíblicas</p>
              <div className="flex flex-wrap gap-2">
                {character.references.map(ref => (
                  <span key={ref} className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300">{ref}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'estudia' && (
          <motion.div key="estudia" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-sm text-gray-400">Marca los pasajes que leas:</p>
            {character.passages.map(p => (
              <div key={p.ref}
                onClick={() => setPassagesRead(prev =>
                  prev.includes(p.ref) ? prev.filter(r => r !== p.ref) : [...prev, p.ref]
                )}
                className={cn('rounded-2xl border p-4 cursor-pointer transition-all space-y-1',
                  passagesRead.includes(p.ref)
                    ? 'border-[#EF4444]/25 bg-[#EF4444]/5'
                    : 'border-white/8 bg-[#111] hover:border-white/15')}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                    passagesRead.includes(p.ref) ? 'border-[#EF4444] bg-[#EF4444]' : 'border-gray-600')}>
                    {passagesRead.includes(p.ref) && <Check size={10} className="text-white" />}
                  </div>
                  <p className="text-sm font-bold text-white">{p.ref}</p>
                </div>
                <p className="text-xs text-gray-500 pl-6">{p.summary}</p>
              </div>
            ))}

            <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-4">
              <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Preguntas de estudio</p>
              <div>
                <p className="text-xs font-bold text-[#EF4444] mb-2">Observación</p>
                {character.studyQuestions.observation.map((q, i) => (
                  <p key={i} className="text-sm text-gray-400 mb-1">• {q}</p>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-300 mb-2">Interpretación</p>
                {character.studyQuestions.interpretation.map((q, i) => (
                  <p key={i} className="text-sm text-gray-400 mb-1">• {q}</p>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-300 mb-2">Aplicación</p>
                {character.studyQuestions.application.map((q, i) => (
                  <p key={i} className="text-sm text-gray-400 mb-1">• {q}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'reflexion' && (
          <motion.div key="reflexion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {([
              { key: 'learned',              label: '¿Qué aprendí de este personaje?' },
              { key: 'positivesToImitate',   label: '¿Qué características positivas puedo imitar?' },
              { key: 'errorsToAvoid',        label: '¿Qué errores debo evitar?' },
              { key: 'aboutGod',             label: '¿Qué me enseña sobre Dios?' },
              { key: 'application',          label: '¿Cómo aplicaré lo aprendido hoy?' },
              { key: 'prayer',               label: 'Mi oración personal' },
            ] as { key: keyof BibleStudyReflection; label: string }[]).map(field => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">{field.label}</label>
                <textarea
                  rows={3}
                  value={reflection[field.key]}
                  onChange={e => setReflection(r => ({ ...r, [field.key]: e.target.value }))}
                  placeholder="Escribe aquí…"
                  className="w-full rounded-xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 px-3 py-2.5 focus:outline-none focus:border-[#EF4444]/40 resize-none leading-relaxed"
                />
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'finalizar' && (
          <motion.div key="finalizar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {saved ? (
              <div className="rounded-2xl border border-[#EF4444]/25 bg-[#EF4444]/5 p-6 text-center space-y-3">
                <CheckCircle2 size={40} className="text-[#EF4444] mx-auto" />
                <p className="text-lg font-black text-white">¡Estudio completado!</p>
                <p className="text-sm text-gray-400">Tu reflexión ha sido guardada.</p>
                <Button onClick={onBack} variant="secondary">Volver al dashboard</Button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
                  <p className="text-sm font-bold text-white">Resumen del estudio</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 p-3 text-center">
                      <p className="text-lg font-black text-white">{passagesRead.length}</p>
                      <p className="text-[11px] text-gray-500">Pasajes leídos</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3 text-center">
                      <p className="text-lg font-black text-white">
                        {Object.values(reflection).filter(v => v.trim().length > 0).length}/6
                      </p>
                      <p className="text-[11px] text-gray-500">Reflexiones</p>
                    </div>
                  </div>
                </div>
                {/* Lessons */}
                <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-2">
                  <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Lecciones del personaje</p>
                  {character.lessons.map((l, i) => (
                    <p key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-[#EF4444] shrink-0">•</span>{l}</p>
                  ))}
                </div>
                <Button size="lg" className="w-full" onClick={handleComplete}
                  disabled={passagesRead.length === 0}>
                  <Save size={16} /> Guardar y completar estudio
                </Button>
                {passagesRead.length === 0 && (
                  <p className="text-xs text-gray-500 text-center">Marca al menos un pasaje para completar el estudio</p>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Library ────────────────────────────────────────────────────────────────────

function LibraryPage({ onSelect }: { onSelect: (char: BibleCharacter) => void }) {
  const { getStudiedCharacterIds, favoriteCharacters, toggleFavorite } = useBiblicalStore()
  const studied = getStudiedCharacterIds()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')

  const filtered = BIBLE_CHARACTERS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filter === 'all' || c.categories.includes(filter as any)
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar personaje…"
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#111] border border-white/8 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#EF4444]/40"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all',
            filter === 'all' ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8')}>
          Todos
        </button>
        {BIBLE_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setFilter(cat.id)}
            className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all',
              filter === cat.id ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8')}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(char => {
          const isStudied = studied.includes(char.id)
          const isFav = favoriteCharacters.includes(char.id)
          return (
            <motion.div key={char.id} layout
              className="rounded-2xl border border-white/8 bg-[#111] p-4 flex items-center gap-3 group">
              <span className="text-2xl shrink-0">{char.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white truncate">{char.name}</p>
                  {isStudied && <CheckCircle2 size={13} className="text-[#EF4444] shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 truncate">{char.era}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {char.categories.slice(0, 2).map(cat => {
                    const meta = BIBLE_CATEGORIES.find(c => c.id === cat)
                    return meta ? (
                      <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-gray-400">
                        {meta.label}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggleFavorite(char.id)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Heart size={14} className={cn(isFav ? 'text-[#EF4444] fill-[#EF4444]' : 'text-gray-600')} />
                </button>
                <button onClick={() => onSelect(char)}
                  className="px-3 py-1.5 rounded-xl bg-[#EF4444]/10 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/20 transition-colors">
                  {isStudied ? 'Repasar' : 'Estudiar'}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── History ────────────────────────────────────────────────────────────────────

function HistoryPage() {
  const { sessions } = useBiblicalStore()
  const completed = sessions.filter(s => s.status === 'completed').sort((a, b) => b.date.localeCompare(a.date))

  if (completed.length === 0) {
    return (
      <div className="text-center py-14 space-y-2">
        <div className="text-5xl">📖</div>
        <p className="text-gray-500 text-sm">Aún no tienes estudios completados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {completed.map(session => {
        const char = BIBLE_CHARACTERS.find(c => c.id === session.characterId)
        if (!char) return null
        const reflectionCount = Object.values(session.reflection).filter(v => v.trim().length > 0).length
        return (
          <div key={session.id} className="rounded-2xl border border-white/8 bg-[#111] p-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">{char.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{char.name}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(session.date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>{session.durationMin} min</p>
                <p>{session.passagesRead.length} pasajes</p>
              </div>
            </div>
            {reflectionCount > 0 && (
              <p className="text-xs text-gray-500 pl-8 line-clamp-2">
                {session.reflection.learned || session.reflection.application}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

type MainTab = 'dashboard' | 'biblioteca' | 'historial'

export default function BiblicalPage() {
  const store = useBiblicalStore()
  const [tab, setTab] = useState<MainTab>('dashboard')
  const [studyChar, setStudyChar] = useState<BibleCharacter | null>(null)

  const todayPick = store.getTodayPick()
  const studied = store.getStudiedCharacterIds()
  const streak = store.getStreak()
  const totalMin = store.getTotalMinutes()
  const completed = store.getCompletedSessions()

  const todayChar = todayPick ? BIBLE_CHARACTERS.find(c => c.id === todayPick.characterId) : null

  if (studyChar) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <StudyPage character={studyChar} onBack={() => setStudyChar(null)} />
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            📜 Personajes Bíblicos
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Conoce a los hombres y mujeres de la Biblia</p>
        </div>
        {todayChar && (
          <Button size="sm" variant="secondary" onClick={() => setStudyChar(todayChar)}>
            <BookOpen size={13} /> Estudiar hoy
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-[#111] border border-white/8">
        {([['dashboard', '🎯 Dashboard'], ['biblioteca', '📚 Biblioteca'], ['historial', '📋 Historial']] as [MainTab, string][]).map(([id, label]) => (
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
              { label: 'Estudiados', value: studied.length, icon: '📖' },
              { label: 'Racha',      value: `${streak}d`,   icon: '🔥' },
              { label: 'Tiempo',     value: totalMin >= 60 ? `${Math.floor(totalMin/60)}h` : `${totalMin}m`, icon: '⏱️' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-[#111] p-4 text-center">
                <p className="text-2xl">{s.icon}</p>
                <p className="text-xl font-black text-white mt-1">{s.value}</p>
                <p className="text-[11px] text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Today's character */}
          <div className="rounded-2xl border border-white/10 bg-[#111] p-5 space-y-4">
            <p className="text-[10px] font-black tracking-[0.3em] text-[#EF4444] uppercase">Personaje del día</p>
            {todayChar ? (
              <div className="flex items-center gap-4">
                <span className="text-4xl">{todayChar.emoji}</span>
                <div className="flex-1">
                  <p className="text-lg font-black text-white">{todayChar.name}</p>
                  <p className="text-xs text-gray-500">{todayChar.era}</p>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{todayChar.summary}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Gira la ruleta para descubrir el personaje de hoy</p>
            )}
          </div>

          {/* Wheel */}
          <div className="rounded-2xl border border-white/8 bg-[#111] p-6">
            <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase text-center mb-6">Ruleta</p>
            <SpinWheel onResult={setStudyChar} />
          </div>

          {/* Recent */}
          {completed.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Últimos estudios</p>
              {completed.slice(-3).reverse().map(session => {
                const char = BIBLE_CHARACTERS.find(c => c.id === session.characterId)
                if (!char) return null
                return (
                  <div key={session.id} className="rounded-xl border border-white/8 bg-[#111] p-3 flex items-center gap-3">
                    <span>{char.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{char.name}</p>
                      <p className="text-xs text-gray-500">{session.date}</p>
                    </div>
                    <CheckCircle2 size={15} className="text-[#EF4444]" />
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Library */}
      {tab === 'biblioteca' && (
        <motion.div variants={fadeUp}>
          <LibraryPage onSelect={setStudyChar} />
        </motion.div>
      )}

      {/* History */}
      {tab === 'historial' && (
        <motion.div variants={fadeUp}>
          <HistoryPage />
        </motion.div>
      )}
    </motion.div>
  )
}
