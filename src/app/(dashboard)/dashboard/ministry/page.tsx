'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Church, Plus, Phone, MessageCircle, CheckCircle2,
  Send, Settings, Loader2, Wifi, X, ChevronRight,
  Clock, Calendar, Users, UserCheck, Bell, AlertTriangle,
  Tv2, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useMinistryStore } from '@/stores/ministry.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { SpiritualLevel, FollowUpType, SpiritualPerson } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<SpiritualLevel, string> = {
  visitor: 'Visitante', 'new-believer': 'Nuevo creyente',
  growing: 'Creciendo', mature: 'Maduro', leader: 'Líder',
}
const LEVEL_COLORS: Record<SpiritualLevel, string> = {
  visitor: '#475569', 'new-believer': '#06B6D4',
  growing: '#7C3AED', mature: '#10B981', leader: '#F59E0B',
}

const DISC_STAGES = [
  { icon: '🟢', label: 'Nuevo creyente',      color: '#06B6D4' },
  { icon: '📖', label: 'Primer seguimiento',   color: '#8B5CF6' },
  { icon: '🙏', label: 'Oración',              color: '#F59E0B' },
  { icon: '⛪', label: 'Primera visita',        color: '#10B981' },
  { icon: '👥', label: 'Discipulado',          color: '#EC4899' },
  { icon: '📚', label: 'Bautismo',             color: '#F97316' },
  { icon: '🌱', label: 'Creciendo',            color: '#84CC16' },
  { icon: '🙌', label: 'Sirviendo',            color: '#F59E0B' },
]

const TEMPLATES = [
  {
    id: 'bienvenida', icon: '👋', name: 'Bienvenida',
    body: '¡Hola {{nombre}}!\n\nDios te bendiga.\n\nNos alegra mucho que hayas tomado la decisión de seguir a Cristo.\n\nQueremos acompañarte en este nuevo comienzo y saber cómo podemos ayudarte.\n\nQue Dios continúe obrando en tu vida.',
  },
  {
    id: 'como-estas', icon: '❤️', name: '¿Cómo estás?',
    body: '¡Hola {{nombre}}!\n\nDios te bendiga.\n\nSolo quería saber cómo te encuentras.\n\n¿Hay algo por lo que podamos orar o ayudarte?\n\nEstamos para servirte.',
  },
  {
    id: 'ya-respondo', icon: '🙏', name: 'Ya te respondo',
    body: 'Hola {{nombre}}.\n\nRecibí tu mensaje.\n\nEn unos minutos te responderé con más detalle.\n\n¡Dios te bendiga!',
  },
  {
    id: 'discipulado', icon: '📖', name: 'Invitación al discipulado',
    body: 'Hola {{nombre}}.\n\nQuería recordarte nuestro discipulado.\n\nNos encantaría verte.\n\nSerá un tiempo de crecimiento y comunión.\n\n¡Te esperamos!',
  },
  {
    id: 'servicio', icon: '⛪', name: 'Invitación al servicio',
    body: 'Hola {{nombre}}.\n\nEste domingo tendremos nuestro servicio.\n\nSerá una bendición contar contigo.\n\n¡Nos vemos!',
  },
]

const SNOOZE_OPTIONS = [
  { label: 'Mañana',       days: 1 },
  { label: 'En 3 días',    days: 3 },
  { label: 'En una semana', days: 7 },
]

const NEW_BELIEVERS: Omit<SpiritualPerson, 'id' | 'notes' | 'createdAt'>[] = [
  { name: 'Yeison Fracois Evariste',      phone: '8493771748',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Luiggi Adames',               phone: '8297871024',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Noah Erreguerena Toca',       phone: '8096696652',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Felix David Santana Reynoso', phone: '8293969653',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Jordy Fegueraz',              phone: '8494734813',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Keni Ulloa',                  phone: '8297976954',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Felix Antonio Then',          phone: '8093459836',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Luis Mario Selismon Louis',   phone: '8099405277',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Onix Saí Reyes Gómez',       phone: '8299817766',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Grimaldi Martínez',           phone: '8299735056',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Joshua Emmanuel Perez Reyes', phone: '8493997772',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
  { name: 'Alan Grullon Urtarte',        phone: '8293985897',  level: 'new-believer', discipleshipProgress: 5, discipleshipStage: 0, followUpType: 'whatsapp', conversionDate: new Date().toISOString().slice(0,10) },
]

// ─── UltraMsg helpers ──────────────────────────────────────────────────────────

interface UltraConfig { instance: string; token: string }
const getUltraConfig = (): UltraConfig => {
  if (typeof window === 'undefined') return { instance: '', token: '' }
  try { return JSON.parse(localStorage.getItem('ultramsg-config') || '{}') }
  catch { return { instance: '', token: '' } }
}
const saveUltraConfig = (c: UltraConfig) => localStorage.setItem('ultramsg-config', JSON.stringify(c))

async function sendWA(cfg: UltraConfig, to: string, body: string): Promise<void> {
  const res = await fetch(`https://api.ultramsg.com/${cfg.instance}/messages/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: cfg.token, to: to.replace(/\s/g, ''), body, priority: '10' }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
}

const personalize = (template: string, person: SpiritualPerson) =>
  template.replace(/\{\{nombre\}\}/gi, person.name.split(' ')[0])

const stageOf = (p: SpiritualPerson) =>
  p.discipleshipStage ?? Math.min(7, Math.floor(p.discipleshipProgress / (100 / 8)))

// ─── Person Drawer ─────────────────────────────────────────────────────────────

type DrawerStep = 'detail' | 'templates' | 'preview' | 'schedule'

function PersonDrawer({
  person, onClose, ultraCfg,
}: { person: SpiritualPerson; onClose: () => void; ultraCfg: UltraConfig }) {
  const { updatePerson, addNote, addFollowUpRecord, setDiscipleshipStage, deletePerson, getPersonFollowUps } = useMinistryStore()
  const { addXP } = useAppStore()

  const [step, setStep]             = useState<DrawerStep>('detail')
  const [selectedTpl, setSelectedTpl] = useState<typeof TEMPLATES[0] | null>(null)
  const [sending, setSending]       = useState(false)
  const [noteText, setNoteText]     = useState('')
  const [showNoteBox, setShowNoteBox] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const history = getPersonFollowUps(person.id)
  const stage   = stageOf(person)
  const isConfigured = !!(ultraCfg.instance && ultraCfg.token)
  const now = new Date()

  const pendingFollowUp = person.nextFollowUp && new Date(person.nextFollowUp) <= now

  const handleSendMessage = async (tpl: typeof TEMPLATES[0]) => {
    if (!person.phone) return
    const msg = personalize(tpl.body, person)
    setSending(true)
    try {
      if (isConfigured) {
        await sendWA(ultraCfg, person.phone, msg)
      } else {
        const waPhone = person.phone.replace(/[^0-9]/g, '')
        window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank')
      }
      addFollowUpRecord({
        personId: person.id,
        date: new Date().toISOString(),
        templateId: tpl.id,
        templateName: tpl.name,
        medium: 'whatsapp',
        status: 'sent',
        messagePreview: msg.slice(0, 80),
      })
      updatePerson(person.id, { lastContact: new Date().toISOString() })
      addXP(10, `Seguimiento: ${person.name}`)
      setStep('schedule')
    } catch {
      addFollowUpRecord({
        personId: person.id,
        date: new Date().toISOString(),
        templateId: tpl.id,
        templateName: tpl.name,
        medium: 'whatsapp',
        status: 'failed',
      })
    } finally {
      setSending(false)
    }
  }

  const handleSchedule = (days: number) => {
    updatePerson(person.id, {
      nextFollowUp: new Date(Date.now() + days * 86400000).toISOString(),
    })
    setStep('detail')
    setSelectedTpl(null)
  }

  const handleCustomSchedule = () => {
    if (!customDate) return
    updatePerson(person.id, { nextFollowUp: new Date(customDate).toISOString() })
    setStep('detail')
    setSelectedTpl(null)
    setCustomDate('')
  }

  const handleAddNote = () => {
    if (!noteText.trim()) return
    addNote(person.id, noteText.trim())
    setNoteText('')
    setShowNoteBox(false)
  }

  const handleDelete = () => {
    deletePerson(person.id)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="w-full md:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-2xl bg-[#0D1218] border border-white/[0.08] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.06] sticky top-0 bg-[#0D1218] z-10">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-black text-white shrink-0"
            style={{ background: LEVEL_COLORS[person.level] }}
          >
            {person.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-base leading-tight truncate">{person.name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full inline-block mt-0.5"
              style={{ background: `${LEVEL_COLORS[person.level]}20`, color: LEVEL_COLORS[person.level] }}>
              {LEVEL_LABELS[person.level]}
            </span>
          </div>
          {confirmDelete ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-slate-500 px-2 py-1 rounded-lg hover:bg-white/[0.05] transition-all">Cancelar</button>
              <button onClick={handleDelete} className="text-xs text-red-400 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all">Eliminar</button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setConfirmDelete(true)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <Trash2 size={14} />
              </button>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.05] text-slate-400 hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">

          {/* ── DETAIL ── */}
          {step === 'detail' && (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-5">

              {/* Discipleship stages */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Progreso de discipulado</p>
                  <span className="text-xs text-slate-600">{DISC_STAGES[stage]?.label}</span>
                </div>
                <div className="flex gap-1">
                  {DISC_STAGES.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setDiscipleshipStage(person.id, i)}
                      title={s.label}
                      className={cn(
                        'flex-1 h-8 rounded-lg flex items-center justify-center text-base transition-all',
                        i <= stage ? 'opacity-100 scale-105' : 'opacity-20 hover:opacity-50'
                      )}
                      style={{ background: i <= stage ? `${s.color}25` : 'rgba(255,255,255,0.04)', borderColor: i === stage ? s.color : 'transparent', border: `1px solid ${i === stage ? s.color : 'transparent'}` }}
                    >
                      {s.icon}
                    </button>
                  ))}
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-2">
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((stage + 1) / 8) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    style={{ background: DISC_STAGES[stage]?.color ?? '#06B6D4' }}
                  />
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2">
                {person.phone && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-[10px] text-slate-600 mb-0.5">Teléfono</p>
                    <p className="text-sm text-white font-medium">{person.phone}</p>
                  </div>
                )}
                {person.conversionDate && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-[10px] text-slate-600 mb-0.5">Conversión</p>
                    <p className="text-sm text-white font-medium">
                      {format(new Date(person.conversionDate), 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                )}
                {person.lastContact && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-[10px] text-slate-600 mb-0.5">Último contacto</p>
                    <p className="text-sm text-white font-medium">
                      {formatDistanceToNow(new Date(person.lastContact), { locale: es, addSuffix: true })}
                    </p>
                  </div>
                )}
                {person.nextFollowUp && (
                  <div className={cn('p-3 rounded-xl border', pendingFollowUp ? 'bg-amber-500/[0.07] border-amber-500/20' : 'bg-white/[0.03] border-white/[0.05]')}>
                    <p className="text-[10px] text-slate-600 mb-0.5">Próximo contacto</p>
                    <p className={cn('text-sm font-medium', pendingFollowUp ? 'text-amber-400' : 'text-white')}>
                      {format(new Date(person.nextFollowUp), 'd MMM', { locale: es })}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick contacts */}
              {person.phone && (
                <div className="flex gap-2">
                  <a href={`tel:${person.phone}`}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center gap-2 text-sm text-slate-300 hover:bg-white/[0.07] transition-all">
                    <Phone size={14} className="text-emerald-400" /> Llamar
                  </a>
                  <a href={`https://wa.me/${person.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center gap-2 text-sm text-slate-300 hover:bg-white/[0.07] transition-all">
                    <MessageCircle size={14} className="text-emerald-400" /> WhatsApp
                  </a>
                </div>
              )}

              {/* Send message CTA */}
              <button
                onClick={() => setStep('templates')}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #06B6D4, #7C3AED)', color: 'white' }}
              >
                <Send size={16} /> Enviar mensaje con plantilla
              </button>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Notas</p>
                  <button onClick={() => setShowNoteBox(v => !v)} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    + Agregar
                  </button>
                </div>
                <AnimatePresence>
                  {showNoteBox && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                      <textarea
                        autoFocus
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Escribe una nota..."
                        rows={3}
                        className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-slate-200 placeholder-slate-700 px-3 py-2 focus:outline-none focus:border-cyan-500/50 resize-none"
                      />
                      <div className="flex gap-2 mt-1.5">
                        <button onClick={() => { setShowNoteBox(false); setNoteText('') }} className="text-xs text-slate-600 hover:text-slate-400 px-2 py-1">Cancelar</button>
                        <button onClick={handleAddNote} className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1">Guardar</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {person.notes.length === 0 ? (
                  <p className="text-xs text-slate-700 py-2">Sin notas aún</p>
                ) : (
                  <div className="space-y-1.5">
                    {[...person.notes].reverse().map(n => (
                      <div key={n.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <p className="text-sm text-slate-300 leading-snug">{n.content}</p>
                        <p className="text-[10px] text-slate-700 mt-1">{format(new Date(n.createdAt), 'd MMM, HH:mm', { locale: es })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-up history */}
              {history.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Historial de seguimientos</p>
                  <div className="space-y-1.5">
                    {history.map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <div className={cn('w-2 h-2 rounded-full shrink-0', r.status === 'sent' ? 'bg-emerald-500' : 'bg-red-500')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white">{TEMPLATES.find(t => t.id === r.templateId)?.icon} {r.templateName}</p>
                          <p className="text-[10px] text-slate-600">{r.medium} · {format(new Date(r.date), 'd MMM, HH:mm', { locale: es })}</p>
                        </div>
                        <span className={cn('text-[10px] font-medium', r.status === 'sent' ? 'text-emerald-400' : 'text-red-400')}>
                          {r.status === 'sent' ? 'Enviado' : 'Falló'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── TEMPLATES ── */}
          {step === 'templates' && (
            <motion.div key="templates" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setStep('detail')} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={16} /></button>
                <p className="text-sm font-semibold text-white">Selecciona una plantilla</p>
              </div>
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => { setSelectedTpl(tpl); setStep('preview') }}
                  className="w-full p-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-cyan-500/25 text-left transition-all flex items-center gap-3"
                >
                  <span className="text-2xl shrink-0">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{tpl.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{personalize(tpl.body.split('\n')[0], person)}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 shrink-0" />
                </button>
              ))}
            </motion.div>
          )}

          {/* ── PREVIEW ── */}
          {step === 'preview' && selectedTpl && (
            <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep('templates')} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={16} /></button>
                <p className="text-sm font-semibold text-white">{selectedTpl.icon} {selectedTpl.name}</p>
              </div>

              {/* Message preview bubble */}
              <div className="p-4 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/15">
                <p className="text-[10px] text-emerald-400 font-medium mb-2 uppercase tracking-wider">Vista previa</p>
                <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                  {personalize(selectedTpl.body, person)}
                </p>
              </div>

              {!person.phone && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/20 text-xs text-amber-400">
                  <AlertTriangle size={13} /> Esta persona no tiene número guardado
                </div>
              )}

              <Button
                variant="glow"
                disabled={!person.phone || sending}
                onClick={() => handleSendMessage(selectedTpl)}
                className="w-full"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Enviando...' : isConfigured ? 'Enviar por WhatsApp' : 'Abrir WhatsApp'}
              </Button>
            </motion.div>
          )}

          {/* ── SCHEDULE ── */}
          {step === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 space-y-4">
              <div className="text-center py-3">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-base font-bold text-white">Mensaje enviado</p>
                <p className="text-sm text-slate-500 mt-1">¿Cuándo deseas volver a contactar?</p>
              </div>

              <div className="space-y-2">
                {SNOOZE_OPTIONS.map(opt => (
                  <button key={opt.days} onClick={() => handleSchedule(opt.days)}
                    className="w-full py-3 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-cyan-500/25 text-sm text-white font-medium flex items-center justify-between px-4 transition-all">
                    {opt.label}
                    <span className="text-xs text-slate-600">
                      {format(new Date(Date.now() + opt.days * 86400000), 'EEEE d/MM', { locale: es })}
                    </span>
                  </button>
                ))}
                <button onClick={() => setShowCustomDate(v => !v)}
                  className="w-full py-3 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-sm text-slate-400 flex items-center justify-between px-4 transition-all">
                  Elegir fecha <Calendar size={14} />
                </button>
                {showCustomDate && (
                  <div className="flex gap-2">
                    <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
                      className="flex-1 h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none" />
                    <button onClick={handleCustomSchedule} disabled={!customDate}
                      className="px-4 rounded-xl bg-cyan-500/20 text-cyan-300 text-sm disabled:opacity-40 hover:bg-cyan-500/30 transition-all">
                      OK
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => setStep('detail')} className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors py-1">
                Omitir
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── Stat Tile ─────────────────────────────────────────────────────────────────

function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-3 min-w-[140px]">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black text-white leading-none">{value}</p>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Ministry = 'seguimiento' | 'television'
type LevelFilter = 'all' | SpiritualLevel
type StatusFilter = 'all' | 'pending' | 'no-contact' | 'responded'

export default function MinistryPage() {
  const {
    people, addPerson, updatePerson, getPendingFollowUps,
    getTodayFollowUpsDone, getNoContactPeople,
  } = useMinistryStore()
  const { addXP } = useAppStore()

  const [ministry, setMinistry]         = useState<Ministry>('seguimiento')
  const [addModal, setAddModal]         = useState(false)
  const [configModal, setConfigModal]   = useState(false)
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [levelFilter, setLevelFilter]   = useState<LevelFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ultraCfg, setUltraCfg]         = useState<UltraConfig>({ instance: '', token: '' })
  const [newPerson, setNewPerson]       = useState({
    name: '', phone: '', level: 'new-believer' as SpiritualLevel, followUpType: 'whatsapp' as FollowUpType,
  })
  const seeded = useRef(false)

  useEffect(() => { setUltraCfg(getUltraConfig()) }, [])

  // Auto-seed new believers (idempotent by phone)
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    const existingPhones = new Set(people.map(p => p.phone).filter(Boolean))
    NEW_BELIEVERS.forEach(p => {
      if (!existingPhones.has(p.phone)) addPerson(p)
    })
  }, []) // eslint-disable-line

  const pending      = getPendingFollowUps()
  const donToday     = getTodayFollowUpsDone()
  const noContact7   = getNoContactPeople(7)
  const newBelievers = people.filter(p => p.level === 'new-believer')
  const isConfigured = !!(ultraCfg.instance && ultraCfg.token)
  const selectedPerson = people.find(p => p.id === selectedId) ?? null

  const now = new Date()
  const filtered = people.filter(p => {
    if (levelFilter !== 'all' && p.level !== levelFilter) return false
    if (statusFilter === 'pending') return p.nextFollowUp && new Date(p.nextFollowUp) <= now
    if (statusFilter === 'no-contact') return !p.lastContact || new Date(p.lastContact).getTime() < Date.now() - 7 * 86400000
    if (statusFilter === 'responded') return p.lastContact && new Date(p.lastContact).getTime() > Date.now() - 3 * 86400000
    return true
  })

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Church size={24} className="text-pink-400" /> Ministerio
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfigModal(true)}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center border transition-all',
              isConfigured
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-500 hover:text-slate-300'
            )}
            title={isConfigured ? 'WhatsApp configurado' : 'Configurar WhatsApp'}
          >
            {isConfigured ? <Wifi size={15} /> : <Settings size={15} />}
          </button>
          <Button onClick={() => setAddModal(true)} variant="glow" size="sm">
            <Plus size={14} /> Agregar
          </Button>
        </div>
      </div>

      {/* ── Ministry selector ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        <button onClick={() => setMinistry('seguimiento')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
            ministry === 'seguimiento' ? 'bg-pink-500/25 text-pink-300' : 'text-slate-400 hover:text-slate-200')}>
          <Users size={14} /> Seguimiento
        </button>
        <button onClick={() => setMinistry('television')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
            ministry === 'television' ? 'bg-pink-500/25 text-pink-300' : 'text-slate-400 hover:text-slate-200')}>
          <Tv2 size={14} /> Televisión
        </button>
      </div>

      {/* ── Televisión placeholder ── */}
      {ministry === 'television' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <Tv2 size={40} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-500 text-sm">El módulo Televisión estará disponible pronto</p>
        </motion.div>
      )}

      {/* ── Seguimiento ── */}
      {ministry === 'seguimiento' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Stats */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <StatTile icon={<Users size={16} />}         label="Nuevos creyentes"    value={newBelievers.length} color="#06B6D4" />
            <StatTile icon={<Bell size={16} />}           label="Seguimientos hoy"    value={pending.length}       color="#F59E0B" />
            <StatTile icon={<UserCheck size={16} />}     label="Realizados hoy"      value={donToday.length}      color="#10B981" />
            <StatTile icon={<Clock size={16} />}         label="Personas activas"    value={people.length}        color="#7C3AED" />
            <StatTile icon={<AlertTriangle size={16} />} label="+7 días sin contacto" value={noContact7.length}   color="#EF4444" />
          </div>

          {/* Today's pending follow-ups */}
          {pending.length > 0 && (
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05]">
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Bell size={12} /> Seguimientos para hoy · {pending.length}
              </p>
              <div className="space-y-2">
                {pending.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: LEVEL_COLORS[p.level] }}>
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">{LEVEL_LABELS[p.level]}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.phone && (
                        <button
                          onClick={() => setSelectedId(p.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all flex items-center gap-1">
                          <Send size={10} /> Contactar
                        </button>
                      )}
                      <button
                        onClick={() => { updatePerson(p.id, { lastContact: new Date().toISOString(), nextFollowUp: new Date(Date.now() + 7 * 86400000).toISOString() }); addXP(20, `Seguimiento: ${p.name}`) }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/[0.06] text-slate-400 hover:text-white transition-all flex items-center gap-1">
                        <CheckCircle2 size={10} /> Hecho
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-2">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {(['all', 'new-believer', 'visitor', 'growing', 'mature'] as LevelFilter[]).map(f => (
                <button key={f} onClick={() => setLevelFilter(f)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                    levelFilter === f
                      ? 'border-transparent text-white'
                      : 'border-white/[0.08] text-slate-500 hover:text-slate-300 bg-white/[0.02]'
                  )}
                  style={levelFilter === f ? { background: f === 'all' ? '#374151' : `${LEVEL_COLORS[f as SpiritualLevel]}30`, color: f === 'all' ? 'white' : LEVEL_COLORS[f as SpiritualLevel] } : undefined}>
                  {f === 'all' ? 'Todos' : LEVEL_LABELS[f as SpiritualLevel]}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {([['all', 'Sin filtro'], ['pending', 'Seg. pendiente'], ['no-contact', 'Sin responder'], ['responded', 'Respondió']] as [StatusFilter, string][]).map(([f, label]) => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                    statusFilter === f
                      ? 'bg-pink-500/20 border-pink-500/30 text-pink-300'
                      : 'border-white/[0.08] text-slate-500 hover:text-slate-300 bg-white/[0.02]'
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* People list */}
          <div className="space-y-2">
            <p className="text-xs text-slate-600 font-medium">{filtered.length} persona{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-sm">No hay personas con estos filtros</div>
            ) : filtered.map(p => {
              const stage = stageOf(p)
              const stageInfo = DISC_STAGES[stage]
              const isOverdue = p.nextFollowUp && new Date(p.nextFollowUp) <= now
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="w-full p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ background: LEVEL_COLORS[p.level] }}>
                        {p.name[0]}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">{stageInfo?.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                        {isOverdue && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{LEVEL_LABELS[p.level]} · {stageInfo?.label}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {p.phone && <p className="text-xs text-slate-600">{p.phone}</p>}
                      {p.lastContact ? (
                        <p className="text-[10px] text-slate-700 mt-0.5">
                          {formatDistanceToNow(new Date(p.lastContact), { locale: es, addSuffix: true })}
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-500/80 mt-0.5">Sin contacto</p>
                      )}
                    </div>
                  </div>

                  {/* Stage progress strip */}
                  <div className="flex gap-0.5 mt-3">
                    {DISC_STAGES.map((s, i) => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all"
                        style={{ background: i <= stage ? s.color : 'rgba(255,255,255,0.06)' }} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── Person Drawer ── */}
      <AnimatePresence>
        {selectedPerson && (
          <PersonDrawer
            key={selectedPerson.id}
            person={selectedPerson}
            onClose={() => setSelectedId(null)}
            ultraCfg={ultraCfg}
          />
        )}
      </AnimatePresence>

      {/* ── Add Person Modal ── */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Agregar Persona">
        <div className="space-y-4">
          <Input label="Nombre completo" value={newPerson.name}
            onChange={e => setNewPerson(p => ({ ...p, name: e.target.value }))} placeholder="Carlos Méndez" />
          <Input label="Teléfono (sin +, ej: 18299036540)" value={newPerson.phone}
            onChange={e => setNewPerson(p => ({ ...p, phone: e.target.value }))} placeholder="18299036540" />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Nivel espiritual</label>
            <select value={newPerson.level}
              onChange={e => setNewPerson(p => ({ ...p, level: e.target.value as SpiritualLevel }))}
              className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none">
              {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newPerson.name} onClick={() => {
              addPerson({
                ...newPerson,
                discipleshipProgress: 5,
                discipleshipStage: 0,
                conversionDate: new Date().toISOString().slice(0, 10),
                followUpType: 'whatsapp',
              })
              setAddModal(false)
              setNewPerson({ name: '', phone: '', level: 'new-believer', followUpType: 'whatsapp' })
            }}>
              Agregar
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── WhatsApp Config Modal ── */}
      <Modal open={configModal} onClose={() => setConfigModal(false)} title="Configurar WhatsApp automático">
        <WhatsAppConfigModal
          onSave={cfg => { saveUltraConfig(cfg); setUltraCfg(cfg); setConfigModal(false) }}
          onClose={() => setConfigModal(false)}
        />
      </Modal>
    </div>
  )
}

function WhatsAppConfigModal({ onSave, onClose }: { onSave: (c: UltraConfig) => void; onClose: () => void }) {
  const [instance, setInstance] = useState('')
  const [token, setToken]       = useState('')
  useEffect(() => {
    const c = getUltraConfig()
    setInstance(c.instance || '')
    setToken(c.token || '')
  }, [])
  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-xl bg-cyan-500/[0.07] border border-cyan-500/20 space-y-2">
        <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Pasos (5 min)</p>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400">
          <li>Ve a <span className="text-slate-200 font-medium">ultramsg.com</span> y crea cuenta gratis</li>
          <li>Crea una instancia → escanea el QR con tu WhatsApp</li>
          <li>Copia el <span className="text-slate-200">Instance ID</span> y <span className="text-slate-200">Token</span></li>
          <li>Pégalos aquí y guarda</li>
        </ol>
      </div>
      <Input label="Instance ID" value={instance} onChange={e => setInstance(e.target.value)} placeholder="instance12345" />
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Token</label>
        <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="••••••••••••••••••••"
          className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-slate-200 placeholder-slate-700 px-3 focus:outline-none focus:border-cyan-500/50" />
      </div>
      <div className="flex gap-3 justify-end pt-1">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="glow" disabled={!instance.trim() || !token.trim()}
          onClick={() => onSave({ instance: instance.trim(), token: token.trim() })}>
          Guardar configuración
        </Button>
      </div>
    </div>
  )
}
