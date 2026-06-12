'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { Church, Plus, Phone, MessageCircle, Heart, User, CheckCircle2, Send, Users, ChevronRight, SkipForward } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { useMinistryStore } from '@/stores/ministry.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import type { SpiritualLevel, FollowUpType, SpiritualPerson } from '@/types'

const LEVEL_LABELS: Record<SpiritualLevel, string> = {
  'visitor':      'Visitante',
  'new-believer': 'Nuevo creyente',
  'growing':      'Creciendo',
  'mature':       'Maduro',
  'leader':       'Líder',
}
const LEVEL_COLORS: Record<SpiritualLevel, string> = {
  'visitor':      '#475569',
  'new-believer': '#06B6D4',
  'growing':      '#7C3AED',
  'mature':       '#10B981',
  'leader':       '#F59E0B',
}
const FOLLOW_UP_ICON: Record<FollowUpType, typeof Phone> = {
  call:      Phone,
  whatsapp:  MessageCircle,
  visit:     User,
  pray:      Heart,
  email:     Phone,
}

// ─── Bulk Message Modal ───────────────────────────────────────────────────────

function BulkMessageModal({
  open,
  onClose,
  people,
  updatePerson,
}: {
  open: boolean
  onClose: () => void
  people: SpiritualPerson[]
  updatePerson: (id: string, updates: Partial<SpiritualPerson>) => void
}) {
  const [step, setStep] = useState<'compose' | 'sending' | 'done'>('compose')
  const [template, setTemplate] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  const withPhone = people.filter(p => p.phone)
  const withoutPhone = people.filter(p => !p.phone)
  const recipients = withPhone.filter(p => selectedIds.has(p.id))
  const currentPerson = recipients[currentIndex]

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(withPhone.map(p => p.id)))
      setStep('compose')
      setTemplate('')
      setCurrentIndex(0)
      setSentIds(new Set())
    }
  }, [open]) // eslint-disable-line

  const personalized = (person: SpiritualPerson) =>
    template.replace(/\{\{nombre\}\}/gi, person.name.split(' ')[0])

  const openWhatsApp = (person: SpiritualPerson) => {
    const phone = person.phone!.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(personalized(person))}`, '_blank')
  }

  const handleNext = (sent: boolean) => {
    if (sent) setSentIds(prev => new Set([...prev, currentPerson.id]))
    if (currentIndex < recipients.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setStep('done')
    }
  }

  const handleClose = () => {
    setStep('compose')
    setTemplate('')
    setSelectedIds(new Set())
    setCurrentIndex(0)
    setSentIds(new Set())
    onClose()
  }

  const handleUpdateContacts = () => {
    sentIds.forEach(id => updatePerson(id, { lastContact: new Date().toISOString() }))
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Mensaje masivo">
      {/* ── Compose ── */}
      {step === 'compose' && (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1">Mensaje</label>
            <p className="text-xs text-slate-500 mb-2">
              Usa{' '}
              <code className="bg-white/[0.08] text-cyan-400 px-1.5 py-0.5 rounded text-[11px] font-mono">
                {'{{nombre}}'}
              </code>{' '}
              para personalizar con el nombre de cada persona
            </p>
            <textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={4}
              placeholder={`Hola {{nombre}}, quería escribirte para...`}
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-slate-200 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
            {template && (
              <p className="text-xs text-slate-500 mt-1.5">
                Vista previa:{' '}
                <span className="text-slate-400 italic">
                  {template.replace(/\{\{nombre\}\}/gi, 'Carlos')}
                </span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <Users size={14} className="text-cyan-400" />
                Destinatarios{' '}
                <span className="text-cyan-400 font-bold">({selectedIds.size})</span>
              </label>
              <button
                onClick={() =>
                  selectedIds.size === withPhone.length
                    ? setSelectedIds(new Set())
                    : setSelectedIds(new Set(withPhone.map(p => p.id)))
                }
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {selectedIds.size === withPhone.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>

            {withPhone.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Ninguna persona tiene número de teléfono registrado
              </p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {withPhone.map(p => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] cursor-pointer transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={e => {
                        setSelectedIds(prev => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(p.id)
                          else next.delete(p.id)
                          return next
                        })
                      }}
                      className="accent-cyan-500 w-4 h-4 shrink-0"
                    />
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: LEVEL_COLORS[p.level] }}
                    >
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.phone}</p>
                    </div>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full border"
                      style={{
                        background: `${LEVEL_COLORS[p.level]}18`,
                        color: LEVEL_COLORS[p.level],
                        borderColor: `${LEVEL_COLORS[p.level]}40`,
                      }}
                    >
                      {LEVEL_LABELS[p.level]}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {withoutPhone.length > 0 && (
              <p className="text-xs text-slate-600 mt-2">
                {withoutPhone.length} persona{withoutPhone.length > 1 ? 's' : ''} sin número guardado no aparecen
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button
              variant="glow"
              disabled={!template.trim() || selectedIds.size === 0}
              onClick={() => { setCurrentIndex(0); setSentIds(new Set()); setStep('sending') }}
            >
              <Send size={14} /> Iniciar envío ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      {/* ── Sending ── */}
      {step === 'sending' && currentPerson && (
        <div className="space-y-5">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00D4B8, #06B6D4)' }}
                initial={{ width: 0 }}
                animate={{ width: `${(currentIndex / recipients.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0 tabular-nums">
              {currentIndex + 1} / {recipients.length}
            </span>
          </div>

          {/* Person card */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
              style={{ background: LEVEL_COLORS[currentPerson.level] }}
            >
              {currentPerson.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{currentPerson.name}</p>
              <p className="text-xs text-slate-400">{currentPerson.phone}</p>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{
                background: `${LEVEL_COLORS[currentPerson.level]}18`,
                color: LEVEL_COLORS[currentPerson.level],
                borderColor: `${LEVEL_COLORS[currentPerson.level]}40`,
              }}
            >
              {LEVEL_LABELS[currentPerson.level]}
            </span>
          </div>

          {/* Message preview */}
          <div className="p-3.5 rounded-xl bg-cyan-500/[0.07] border border-cyan-500/20">
            <p className="text-[11px] text-cyan-400 font-medium uppercase tracking-wider mb-2">
              Mensaje personalizado
            </p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {personalized(currentPerson)}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => { openWhatsApp(currentPerson); handleNext(true) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #00D4B8 0%, #06B6D4 100%)',
                boxShadow: '0 4px 24px rgba(0,212,184,0.35)',
              }}
            >
              <MessageCircle size={16} />
              Abrir en WhatsApp
              <ChevronRight size={14} className="ml-auto opacity-70" />
            </button>
            <button
              onClick={() => handleNext(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-500 hover:text-slate-300 transition-colors rounded-xl hover:bg-white/[0.04]"
            >
              <SkipForward size={14} />
              Saltar a la siguiente
            </button>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <div className="py-6 space-y-5 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(0,212,184,0.15)', border: '1px solid rgba(0,212,184,0.3)' }}
          >
            <CheckCircle2 size={32} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">¡Envío completado!</p>
            <p className="text-sm text-slate-400 mt-1">
              Mensajes abiertos para{' '}
              <span className="text-cyan-400 font-semibold">{sentIds.size}</span>{' '}
              de {recipients.length} personas
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={handleClose}>Cerrar</Button>
            {sentIds.size > 0 && (
              <Button variant="glow" onClick={handleUpdateContacts}>
                <CheckCircle2 size={14} />
                Marcar como contactados
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MinistryPage() {
  const { people, events, addPerson, updatePerson, addNote, getTodayEvents, getPendingFollowUps } = useMinistryStore()
  const { addXP } = useAppStore()
  const [tab, setTab] = useState<'people' | 'events' | 'devotional'>('people')
  const [addModal, setAddModal] = useState(false)
  const [bulkModal, setBulkModal] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [noteModal, setNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [newPerson, setNewPerson] = useState({ name: '', phone: '', level: 'visitor' as SpiritualLevel, followUpType: 'call' as FollowUpType })

  const pending = getPendingFollowUps()
  const person = people.find(p => p.id === selectedPerson)

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Church size={24} className="text-pink-400" /> Ministerio
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => setBulkModal(true)} variant="secondary" size="sm">
            <Send size={14} /> Mensaje masivo
          </Button>
          <Button onClick={() => setAddModal(true)} variant="glow" size="sm">
            <Plus size={14} /> Agregar
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {[['people', 'Personas'], ['events', 'Calendario'], ['devotional', 'Espiritual']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id ? 'bg-violet-500/30 text-violet-300' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {tab === 'people' && (
        <>
          {/* Pending follow-ups */}
          {pending.length > 0 && (
            <motion.div variants={fadeUp}>
              <GlassCard className="p-5" variant="violet" animate={false}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-500/30 text-pink-300 text-xs flex items-center justify-center font-bold">{pending.length}</span>
                  Seguimientos para hoy
                </h3>
                <div className="space-y-2">
                  {pending.map(p => {
                    const Icon = FOLLOW_UP_ICON[p.followUpType]
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.04]">
                        <div className="w-8 h-8 rounded-full gradient-spirit flex items-center justify-center text-sm font-bold text-white">
                          {p.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{p.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{LEVEL_LABELS[p.level]}</p>
                        </div>
                        <Badge variant="pink" size="sm" className="flex items-center gap-1">
                          <Icon size={10} /> {p.followUpType}
                        </Badge>
                        {p.phone && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const msg = encodeURIComponent(`Hola ${p.name.split(' ')[0]}, te escribo para...`)
                              window.open(`https://wa.me/${p.phone!.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank')
                            }}
                          >
                            <MessageCircle size={12} />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => {
                          const nextDate = new Date(Date.now() + 7 * 86400000).toISOString()
                          updatePerson(p.id, { nextFollowUp: nextDate, lastContact: new Date().toISOString() })
                          addXP(20, `Seguimiento: ${p.name}`)
                        }}>
                          <CheckCircle2 size={14} /> Hecho
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* People grid */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {people.map(p => (
              <GlassCard
                key={p.id}
                className="p-4"
                hoverable
                animate={false}
                onClick={() => setSelectedPerson(p.id === selectedPerson ? null : p.id)}
              >
                <div className="flex items-center gap-3">
                  <ProgressRing
                    value={p.discipleshipProgress}
                    size={52}
                    strokeWidth={5}
                    color={LEVEL_COLORS[p.level]}
                    animate={false}
                  >
                    <span className="text-lg font-bold text-white">{p.name[0]}</span>
                  </ProgressRing>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{p.name}</p>
                      <Badge
                        size="sm"
                        style={{ background: `${LEVEL_COLORS[p.level]}20`, color: LEVEL_COLORS[p.level], borderColor: `${LEVEL_COLORS[p.level]}40` }}
                        className="border"
                      >
                        {LEVEL_LABELS[p.level]}
                      </Badge>
                    </div>
                    {p.phone && <p className="text-xs text-slate-500 mt-0.5">{p.phone}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-600">{p.discipleshipProgress}% discipulado</span>
                      {p.nextFollowUp && (
                        <span className="text-xs text-amber-400">
                          Próx: {new Date(p.nextFollowUp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedPerson === p.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-white/[0.06] space-y-2"
                  >
                    {p.notes.slice(-3).map(n => (
                      <p key={n.id} className="text-xs text-slate-400 bg-white/[0.04] rounded-lg p-2">{n.content}</p>
                    ))}
                    <div className="flex gap-2 mt-2">
                      {p.phone && (
                        <>
                          <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); window.open(`tel:${p.phone}`) }}>
                            <Phone size={12} /> Llamar
                          </Button>
                          <Button size="sm" variant="secondary" onClick={e => {
                            e.stopPropagation()
                            window.open(`https://wa.me/${p.phone!.replace(/[^0-9]/g, '')}`, '_blank')
                          }}>
                            <MessageCircle size={12} /> WhatsApp
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); setNoteModal(true) }}>
                        + Nota
                      </Button>
                    </div>
                  </motion.div>
                )}
              </GlassCard>
            ))}
          </motion.div>
        </>
      )}

      {tab === 'events' && (
        <motion.div variants={fadeUp} className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Próximos eventos</h3>
          {events
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(ev => (
              <GlassCard key={ev.id} className="p-4" animate={false}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl glass flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-violet-400">
                      {new Date(ev.date).toLocaleDateString('es-ES', { day: 'numeric' })}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase">
                      {new Date(ev.date).toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{ev.title}</p>
                    <p className="text-xs text-slate-500">{ev.time}{ev.location ? ` · ${ev.location}` : ''}</p>
                  </div>
                  <Badge variant={ev.type === 'service' ? 'violet' : ev.type === 'retreat' ? 'amber' : 'cyan'} size="sm">
                    {ev.type}
                  </Badge>
                </div>
              </GlassCard>
            ))}
        </motion.div>
      )}

      {tab === 'devotional' && (
        <motion.div variants={fadeUp} className="space-y-4">
          <GlassCard className="p-5" variant="glow" animate={false}>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-xl">📖</span> Devocional de Hoy
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Pasaje', placeholder: 'Juan 15:1-17' },
                { label: 'Oración — ¿Por qué estás orando hoy?', placeholder: 'Familia, ministerio, propósito...' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs text-slate-500 mb-1 block">{f.label}</label>
                  <input
                    placeholder={f.placeholder}
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              ))}
              <textarea
                placeholder="Escribe tu reflexión del día..."
                rows={4}
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-violet-500/50 resize-none"
              />
              <Button variant="glow" onClick={() => addXP(20, 'Devocional completado')}>
                Guardar devocional +20 XP
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Add Person Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Agregar Persona">
        <div className="space-y-4">
          <Input label="Nombre completo" value={newPerson.name} onChange={e => setNewPerson(p => ({ ...p, name: e.target.value }))} placeholder="Carlos Méndez" />
          <Input label="Teléfono (opcional)" value={newPerson.phone} onChange={e => setNewPerson(p => ({ ...p, phone: e.target.value }))} placeholder="+1234567890" />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Nivel espiritual</label>
            <select value={newPerson.level} onChange={e => setNewPerson(p => ({ ...p, level: e.target.value as SpiritualLevel }))} className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none">
              {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={() => {
              if (!newPerson.name) return
              addPerson({ ...newPerson, discipleshipProgress: 10, followUpType: newPerson.followUpType })
              setAddModal(false)
              setNewPerson({ name: '', phone: '', level: 'visitor', followUpType: 'call' })
            }}>Agregar</Button>
          </div>
        </div>
      </Modal>

      {/* Note Modal */}
      <Modal open={noteModal} onClose={() => { setNoteModal(false); setNoteText('') }} title="Agregar nota">
        <div className="space-y-4">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Escribe una nota sobre esta persona..."
            rows={4}
            className="w-full rounded-xl bg-white/[0.05] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-violet-500/50 resize-none"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setNoteModal(false); setNoteText('') }}>Cancelar</Button>
            <Button variant="glow" onClick={() => {
              if (!noteText.trim() || !selectedPerson) return
              addNote(selectedPerson, noteText)
              setNoteModal(false)
              setNoteText('')
            }}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Message Modal */}
      <BulkMessageModal
        open={bulkModal}
        onClose={() => setBulkModal(false)}
        people={people}
        updatePerson={updatePerson}
      />
    </motion.div>
  )
}
