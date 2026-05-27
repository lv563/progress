'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ban, Plus, RotateCcw, Trash2, AlertTriangle, X, Check, Trophy, Clock } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { useDetoxStore } from '@/stores/detox.store'
import type { DetoxHabit } from '@/stores/detox.store'

const ICONS = ['🚬', '🍺', '🍔', '📱', '🎮', '💊', '☕', '🍫', '😤', '🛋️', '💸', '🎰', '📺', '🍕', '😡', '🌙', '🍷', '🧁']
const COLORS = ['#EF4444', '#F97316', '#EAB308', '#10B981', '#3B82F6', '#7C3AED', '#EC4899', '#64748B']

function formatElapsed(startDate: string) {
  const ms = Date.now() - new Date(startDate).getTime()
  if (ms < 0) return { primary: '0s', secondary: 'Recién iniciado', totalDays: 0 }
  const totalDays = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const months = Math.floor(totalDays / 30)
  const days = totalDays % 30

  if (months >= 1) return {
    primary: `${months} ${months === 1 ? 'mes' : 'meses'}`,
    secondary: `${days}d ${hours}h sin recaer`,
    totalDays,
  }
  if (totalDays >= 1) return {
    primary: `${totalDays} ${totalDays === 1 ? 'día' : 'días'}`,
    secondary: `${hours}h ${minutes}m sin recaer`,
    totalDays,
  }
  if (hours >= 1) return {
    primary: `${hours}h ${minutes}m`,
    secondary: `${hours} ${hours === 1 ? 'hora' : 'horas'} sin recaer`,
    totalDays,
  }
  if (minutes >= 1) return {
    primary: `${minutes} min`,
    secondary: `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} sin recaer`,
    totalDays,
  }
  return { primary: `${seconds}s`, secondary: 'Racha iniciada', totalDays }
}

function HabitCard({ habit }: { habit: DetoxHabit }) {
  const { relapse, deleteHabit } = useDetoxStore()
  const [, setTick] = useState(0)
  const [confirmRelapse, setConfirmRelapse] = useState(false)
  const [relapseNote, setRelapseNote] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  // Re-render every second to keep timer live
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const elapsed = formatElapsed(habit.startDate)
  const progress = habit.targetDays ? Math.min(100, (elapsed.totalDays / habit.targetDays) * 100) : null
  const achieved = !!(habit.targetDays && elapsed.totalDays >= habit.targetDays)
  const bestStreak = habit.relapses.length === 0 ? elapsed.totalDays : Math.max(elapsed.totalDays, 0)

  const handleRelapse = () => {
    relapse(habit.id, relapseNote || undefined)
    setConfirmRelapse(false)
    setRelapseNote('')
  }

  return (
    <GlassCard className="p-5 flex flex-col gap-4" style={{ borderColor: `${habit.color}40` }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${habit.color}20` }}>
            {habit.icon}
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">{habit.name}</h3>
            {habit.description && (
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{habit.description}</p>
            )}
          </div>
        </div>
        <button onClick={() => deleteHabit(habit.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1 shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Timer display */}
      <div className="rounded-2xl py-5 px-4 text-center" style={{ background: `${habit.color}12` }}>
        {achieved && (
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Trophy size={13} className="text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Meta alcanzada</span>
          </div>
        )}
        <div className="text-4xl font-black text-white tracking-tight">{elapsed.primary}</div>
        <div className="text-xs text-slate-500 mt-1">{elapsed.secondary}</div>
        <div className="text-xs font-medium mt-2" style={{ color: habit.color }}>
          sin {habit.name.toLowerCase()}
        </div>
      </div>

      {/* Goal progress */}
      {progress !== null && (
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500">Meta: {habit.targetDays} días</span>
            <span className="font-semibold" style={{ color: habit.color }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: habit.color }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-center">
          <div className="text-base font-bold text-white">{habit.relapses.length}</div>
          <div className="text-xs text-slate-600">recaídas</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-center">
          <div className="text-base font-bold text-white">{bestStreak}d</div>
          <div className="text-xs text-slate-600">racha actual</div>
        </div>
      </div>

      {/* Relapse history */}
      {habit.relapses.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors w-full"
          >
            <Clock size={11} />
            Historial de recaídas ({habit.relapses.length})
            <span className="ml-auto">{showHistory ? '▲' : '▼'}</span>
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1 max-h-28 overflow-y-auto pr-1">
                  {[...habit.relapses].reverse().map((r, i) => (
                    <div key={r.id} className="flex items-start gap-2 text-xs py-1 border-b border-white/[0.04] last:border-0">
                      <span className="text-slate-600 shrink-0">
                        {new Date(r.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                      {r.note && <span className="text-slate-500 truncate">{r.note}</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Relapse button */}
      <AnimatePresence mode="wait">
        {!confirmRelapse ? (
          <motion.button
            key="btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmRelapse(true)}
            className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={13} /> Recaída — reiniciar contador
          </motion.button>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2.5"
          >
            <p className="text-xs text-amber-400 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              El contador se reiniciará a 0. ¿Seguro?
            </p>
            <input
              value={relapseNote}
              onChange={e => setRelapseNote(e.target.value)}
              placeholder="Nota opcional (ej: estrés laboral)"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-white/20"
            />
            <div className="flex gap-2">
              <button
                onClick={handleRelapse}
                className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors"
              >
                Confirmar recaída
              </button>
              <button
                onClick={() => { setConfirmRelapse(false); setRelapseNote('') }}
                className="px-3 py-2 rounded-xl bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}

export default function DetoxPage() {
  const { habits, addHabit } = useDetoxStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', icon: '🚬', color: '#EF4444', targetDays: '',
  })

  const handleAdd = () => {
    if (!form.name.trim()) return
    addHabit({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      icon: form.icon,
      color: form.color,
      targetDays: form.targetDays ? parseInt(form.targetDays) : undefined,
    })
    setForm({ name: '', description: '', icon: '🚬', color: '#EF4444', targetDays: '' })
    setShowModal(false)
  }

  const totalRelapses = habits.reduce((a, h) => a + h.relapses.length, 0)
  const achieved = habits.filter(h => {
    const days = Math.floor((Date.now() - new Date(h.startDate).getTime()) / 86400000)
    return h.targetDays ? days >= h.targetDays : days >= 30
  }).length

  return (
    <>
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Ban size={22} className="text-red-400" /> Desintoxicación
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Registra malos hábitos y lleva tu racha limpia</p>
          </div>
          <Button variant="glow" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Agregar
          </Button>
        </motion.div>

        {/* Stats — only shown when there's data */}
        {habits.length > 0 && (
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-black text-white">{habits.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">En detox</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-black text-red-400">{totalRelapses}</div>
              <div className="text-xs text-slate-500 mt-0.5">Recaídas totales</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">{achieved}</div>
              <div className="text-xs text-slate-500 mt-0.5">Metas logradas</div>
            </GlassCard>
          </motion.div>
        )}

        {/* Grid */}
        {habits.length === 0 ? (
          <motion.div variants={fadeUp}>
            <GlassCard className="p-14 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <Ban size={28} className="text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Sin hábitos registrados</p>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                  Agrega un mal hábito que quieras eliminar y empieza a registrar tu racha limpia
                </p>
              </div>
              <Button variant="glow" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Agregar primer hábito
              </Button>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {habits.map(h => <HabitCard key={h.id} habit={h} />)}
          </motion.div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <GlassCard className="p-6" variant="elevated">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-white">Nuevo hábito a eliminar</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Nombre del hábito *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ej: Fumar, Redes sociales, Comida chatarra..."
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">¿Por qué quieres dejarlo? (opcional)</label>
                    <input
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Ej: Mejora mi salud, gasto mucho dinero..."
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Ícono</label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {ICONS.map(icon => (
                        <button
                          key={icon}
                          onClick={() => setForm(f => ({ ...f, icon }))}
                          className={`h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                            form.icon === icon
                              ? 'bg-violet-500/30 ring-1 ring-violet-500/60 scale-110'
                              : 'bg-white/[0.04] hover:bg-white/[0.08]'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Color</label>
                    <div className="flex gap-2.5 flex-wrap">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setForm(f => ({ ...f, color: c }))}
                          className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                          style={{
                            background: c,
                            outline: form.color === c ? `2px solid ${c}` : 'none',
                            outlineOffset: 3,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Meta en días (opcional)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.targetDays}
                      onChange={e => setForm(f => ({ ...f, targetDays: e.target.value }))}
                      placeholder="Ej: 30, 90, 365..."
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>

                  <Button variant="glow" className="w-full" onClick={handleAdd} disabled={!form.name.trim()}>
                    <Check size={14} /> Iniciar racha limpia
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
