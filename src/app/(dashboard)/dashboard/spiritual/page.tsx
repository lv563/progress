'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { Plus, Trash2, Check, Flame, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useSpiritualStore } from '@/stores/spiritual.store'
import type { FastType } from '@/stores/spiritual.store'
import { cn } from '@/lib/utils/cn'
import { format, eachDayOfInterval, subDays, addDays, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

const FAST_TYPES: { id: FastType; icon: string; label: string; desc: string }[] = [
  { id: 'daniel',    icon: '🥦', label: 'Ayuno de Daniel', desc: 'Solo vegetales y agua' },
  { id: 'una-comida', icon: '🍽️', label: 'Una sola comida', desc: 'Una comida al día' },
  { id: 'redes',     icon: '📵', label: 'Redes sociales',  desc: 'Sin apps ni redes' },
]

const FAST_DURATIONS = [1, 3, 7, 21, 40]

type Tab = 'devocional' | 'oracion' | 'ayuno'

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function SpiritualPage() {
  const {
    devotionals, prayerLogs, fasts,
    markDevotional, unmarkDevotional,
    addPrayer, setPrayerCount,
    addFast, completeFast, deleteFast, updateFastPurpose,
    getTodayDevotion, getTodayPrayers, getDevotionalStreak, getPrayerStreak, getThisWeekFast,
  } = useSpiritualStore()

  const [tab, setTab] = useState<Tab>('devocional')
  const [devNotes, setDevNotes] = useState('')
  const [notesOpen, setNotesOpen] = useState(false)
  const [fastModal, setFastModal] = useState(false)
  const [fastType, setFastType]   = useState<FastType>('una-comida')
  const [fastDays, setFastDays]   = useState(1)
  const [fastPurpose, setFastPurpose] = useState('')
  const [editFast, setEditFast] = useState<string | null>(null)
  const [editPurpose, setEditPurpose] = useState('')

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayDevotion = getTodayDevotion()
  const todayPrayers = getTodayPrayers()
  const devStreak = getDevotionalStreak()
  const prayStreak = getPrayerStreak()
  const thisWeekFast = getThisWeekFast()

  const last14 = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() })

  const handleMarkDevotional = () => {
    markDevotional(today, devNotes || undefined)
    setNotesOpen(false)
    setDevNotes('')
  }

  const handleAddFast = () => {
    if (!fastPurpose.trim()) return
    const today = new Date()
    const startDate = today.toISOString().slice(0, 10)
    addFast(startDate, today.getDay(), fastPurpose.trim(), fastType, fastDays)
    setFastModal(false)
    setFastPurpose('')
    setFastType('una-comida')
    setFastDays(1)
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-2xl">🙏</span> Espiritual
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-3">
            {devStreak > 0 && <span className="flex items-center gap-1 text-violet-400"><Flame size={12} />{devStreak}d devoción</span>}
            {prayStreak > 0 && <span className="flex items-center gap-1 text-amber-400"><Flame size={12} />{prayStreak}d oración</span>}
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {([['devocional', '📖 Devocional'], ['oracion', '🤲 Oración'], ['ayuno', '✨ Ayuno']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:text-slate-200'
            )}>
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ DEVOCIONAL ══ */}
        {tab === 'devocional' && (
          <motion.div key="dev" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Today's devotional */}
            <div className={cn(
              'p-5 rounded-2xl border transition-all',
              todayDevotion?.completed
                ? 'border-violet-500/30 bg-violet-500/[0.07]'
                : 'border-white/[0.06] bg-white/[0.02]'
            )}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-white">Devocional de hoy</p>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
                </div>
                {devStreak > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <Flame size={13} className="text-violet-400" />
                    <span className="text-xs font-bold text-violet-400">{devStreak} días</span>
                  </div>
                )}
              </div>

              {todayDevotion?.completed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Check size={16} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-violet-300">¡Completado hoy!</p>
                      {todayDevotion.notes && <p className="text-xs text-slate-500 mt-0.5">{todayDevotion.notes}</p>}
                    </div>
                  </div>
                  <button onClick={() => unmarkDevotional(today)} className="text-xs text-slate-700 hover:text-slate-500 transition-colors">
                    Desmarcar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={devNotes}
                    onChange={e => setDevNotes(e.target.value)}
                    placeholder="Reflexión del día (opcional)..."
                    rows={3}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.07] text-sm text-slate-300 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-violet-500/40 resize-none transition-colors"
                  />
                  <Button variant="glow" className="w-full" onClick={handleMarkDevotional}
                    style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}>
                    <Check size={14} /> Marcar devocional completado
                  </Button>
                </div>
              )}
            </div>

            {/* 14-day history */}
            <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-3">Últimos 14 días</p>
              <div className="grid grid-cols-7 gap-1.5">
                {last14.map(day => {
                  const key = format(day, 'yyyy-MM-dd')
                  const log = devotionals.find(d => d.date === key)
                  const isToday = key === today
                  return (
                    <div key={key} className={cn(
                      'flex flex-col items-center gap-1 p-1.5 rounded-xl border',
                      isToday ? 'border-violet-500/40' : 'border-white/[0.04]'
                    )}>
                      <span className="text-[9px] text-slate-700">{format(day, 'EEE', { locale: es }).slice(0, 2)}</span>
                      <span className="text-[10px] font-bold text-slate-600">{format(day, 'd')}</span>
                      <div className={cn(
                        'w-5 h-5 rounded-md flex items-center justify-center',
                        log?.completed ? 'bg-violet-500/25' : 'bg-white/[0.03]'
                      )}>
                        {log?.completed
                          ? <Check size={10} className="text-violet-400" />
                          : <span className="text-slate-800 text-[9px]">—</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notes history */}
            {devotionals.filter(d => d.completed && d.notes).slice(0, 5).length > 0 && (
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-2">Reflexiones recientes</p>
                <div className="space-y-2">
                  {devotionals.filter(d => d.completed && d.notes).slice(-5).reverse().map(d => (
                    <div key={d.date} className="p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                      <p className="text-[10px] text-violet-400/70 mb-1">{format(new Date(d.date), "d 'de' MMMM", { locale: es })}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{d.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ ORACIÓN ══ */}
        {tab === 'oracion' && (
          <motion.div key="pray" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Today counter */}
            <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] flex flex-col items-center gap-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Oraciones de hoy</p>
              <motion.p
                key={todayPrayers}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl font-black text-white tabular-nums"
              >
                {todayPrayers}
              </motion.p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => addPrayer(today)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 0 24px rgba(245,158,11,0.3)' }}
                >
                  🤲 +1 Oración
                </motion.button>
                {todayPrayers > 0 && (
                  <button
                    onClick={() => setPrayerCount(today, Math.max(0, todayPrayers - 1))}
                    className="px-4 py-3 rounded-2xl text-slate-500 hover:text-slate-300 bg-white/[0.05] border border-white/[0.07] text-sm transition-all"
                  >
                    −
                  </button>
                )}
              </div>
              {prayStreak > 0 && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Flame size={14} /> <span className="text-sm font-bold">{prayStreak} días seguidos</span>
                </div>
              )}
            </div>

            {/* 14-day prayer history */}
            <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-3">Últimos 14 días</p>
              <div className="grid grid-cols-7 gap-1.5">
                {last14.map(day => {
                  const key = format(day, 'yyyy-MM-dd')
                  const log = prayerLogs.find(p => p.date === key)
                  const isToday = key === today
                  const count = log?.count ?? 0
                  return (
                    <div key={key} className={cn(
                      'flex flex-col items-center gap-1 p-1.5 rounded-xl border',
                      isToday ? 'border-amber-500/40' : 'border-white/[0.04]'
                    )}>
                      <span className="text-[9px] text-slate-700">{format(day, 'EEE', { locale: es }).slice(0, 2)}</span>
                      <span className="text-[10px] font-bold text-slate-600">{format(day, 'd')}</span>
                      <div className={cn(
                        'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold',
                        count > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/[0.03] text-slate-800'
                      )}>
                        {count > 0 ? count : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ AYUNO ══ */}
        {tab === 'ayuno' && (
          <motion.div key="fast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* This week's fast */}
            <div className={cn(
              'p-5 rounded-2xl border transition-all',
              thisWeekFast
                ? thisWeekFast.completed ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-cyan-500/25 bg-cyan-500/[0.04]'
                : 'border-dashed border-white/[0.10]'
            )}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-white">Ayuno de esta semana</p>
                {!thisWeekFast && (
                  <Button size="sm" variant="glow" onClick={() => setFastModal(true)}
                    style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' }}>
                    <Plus size={14} /> Programar
                  </Button>
                )}
              </div>

              {thisWeekFast ? (() => {
                const tinfo = FAST_TYPES.find(t => t.id === thisWeekFast.type) ?? FAST_TYPES[1]
                const days  = thisWeekFast.days ?? 1
                const start = new Date(thisWeekFast.weekDate)
                const end   = addDays(start, days - 1)
                const today2 = new Date(); today2.setHours(0,0,0,0)
                const daysLeft = Math.max(0, differenceInDays(end, today2) + 1)
                const isActive = today2 >= start && today2 <= end
                return (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0',
                      thisWeekFast.completed ? 'bg-emerald-500/20' : 'bg-cyan-500/15'
                    )}>
                      {tinfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn('text-sm font-semibold', thisWeekFast.completed ? 'text-emerald-300' : 'text-white')}>
                          {tinfo.label}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-medium">
                          {days === 1 ? '1 día' : `${days} días`}
                        </span>
                        {thisWeekFast.completed && <span className="text-[10px] text-emerald-400 font-medium">✓ Completado</span>}
                        {isActive && !thisWeekFast.completed && daysLeft > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                            {daysLeft === 1 ? 'Último día' : `${daysLeft} días restantes`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {format(start, "d MMM", { locale: es })}
                        {days > 1 && ` → ${format(end, "d MMM", { locale: es })}`}
                      </p>
                    </div>
                    {!thisWeekFast.completed && (
                      <Button size="sm" variant="glow" onClick={() => completeFast(thisWeekFast.id)}
                        style={{ background: '#10B981' }}>
                        <Check size={13} /> Completar
                      </Button>
                    )}
                  </div>

                  {/* Purpose */}
                  {editFast === thisWeekFast.id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editPurpose}
                        onChange={e => setEditPurpose(e.target.value)}
                        className="flex-1 h-8 rounded-lg bg-white/[0.06] border border-cyan-500/30 text-sm text-white px-3 focus:outline-none"
                        onKeyDown={e => {
                          if (e.key === 'Enter') { updateFastPurpose(thisWeekFast.id, editPurpose); setEditFast(null) }
                          if (e.key === 'Escape') setEditFast(null)
                        }}
                      />
                      <Button size="sm" variant="glow" onClick={() => { updateFastPurpose(thisWeekFast.id, editPurpose); setEditFast(null) }}>
                        <Check size={13} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <p className="text-xs text-slate-400 flex-1 leading-relaxed">
                        <span className="text-slate-600 text-[10px] uppercase tracking-wider block mb-1">Propósito</span>
                        {thisWeekFast.purpose}
                      </p>
                      <button onClick={() => { setEditFast(thisWeekFast.id); setEditPurpose(thisWeekFast.purpose) }}
                        className="text-slate-700 hover:text-slate-400 transition-colors shrink-0">
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}

                  <button onClick={() => deleteFast(thisWeekFast.id)} className="text-xs text-slate-700 hover:text-red-400 transition-colors flex items-center gap-1">
                    <Trash2 size={11} /> Eliminar
                  </button>
                </div>
                )})() : (
                <div className="text-center py-4">
                  <p className="text-4xl mb-2">✨</p>
                  <p className="text-sm text-slate-500">No hay ayuno programado esta semana</p>
                  <p className="text-xs text-slate-700 mt-1">Programa uno con un propósito específico</p>
                </div>
              )}
            </div>

            {/* Past fasts */}
            {fasts.filter(f => f.completed).length > 0 && (
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-2">Ayunos completados</p>
                <div className="space-y-2">
                  {fasts.filter(f => f.completed).slice(-5).reverse().map(f => {
                    const ti = FAST_TYPES.find(t => t.id === f.type) ?? FAST_TYPES[1]
                    return (
                      <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.02]">
                        <span className="text-base shrink-0">{ti.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-400 truncate">{f.purpose}</p>
                            {(f.days ?? 1) > 1 && <span className="text-[10px] text-cyan-400 shrink-0">{f.days}d</span>}
                          </div>
                          <p className="text-[10px] text-slate-700">{ti.label} · {format(new Date(f.weekDate), "d 'de' MMM", { locale: es })}</p>
                        </div>
                        <Check size={13} className="text-emerald-400 shrink-0" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add fast modal */}
      <Modal open={fastModal} onClose={() => setFastModal(false)} title="Programar Ayuno">
        <div className="space-y-5">

          {/* Type */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider font-medium block mb-2.5">Tipo de ayuno</label>
            <div className="grid grid-cols-3 gap-2">
              {FAST_TYPES.map(t => (
                <button key={t.id} onClick={() => setFastType(t.id)}
                  className={cn(
                    'p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5',
                    fastType === t.id
                      ? 'border-cyan-500/50 bg-cyan-500/[0.10]'
                      : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
                  )}>
                  <span className="text-2xl">{t.icon}</span>
                  <p className={cn('text-xs font-semibold leading-tight', fastType === t.id ? 'text-cyan-300' : 'text-slate-300')}>{t.label}</p>
                  <p className="text-[10px] text-slate-600 leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider font-medium block mb-2.5">Duración</label>
            <div className="flex gap-2 flex-wrap">
              {FAST_DURATIONS.map(d => (
                <button key={d} onClick={() => setFastDays(d)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                    fastDays === d
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-500 hover:text-slate-300'
                  )}>
                  {d === 1 ? '1 día' : `${d} días`}
                </button>
              ))}
            </div>
            {fastDays > 1 && (
              <p className="text-[10px] text-slate-600 mt-2">
                Termina el {format(addDays(new Date(), fastDays - 1), "EEEE d 'de' MMMM", { locale: es })}
              </p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider font-medium block mb-2.5">Propósito</label>
            <textarea
              autoFocus
              value={fastPurpose}
              onChange={e => setFastPurpose(e.target.value)}
              placeholder="Por sanidad, por dirección, intercesión por..."
              rows={3}
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-slate-200 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-cyan-500/40 resize-none transition-colors"
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setFastModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!fastPurpose.trim()} onClick={handleAddFast}
              style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' }}>
              <Check size={14} /> Programar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
