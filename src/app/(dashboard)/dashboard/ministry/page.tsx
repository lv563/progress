'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import {
  Church, Plus, Phone, MessageCircle, Heart, User, CheckCircle2,
  Send, Users, SkipForward, Settings, Loader2, XCircle, AlertCircle,
  Wifi, WifiOff,
} from 'lucide-react'
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
  call: Phone, whatsapp: MessageCircle, visit: User, pray: Heart, email: Phone,
}

// ─── UltraMsg helpers ─────────────────────────────────────────────────────────

interface UltraConfig { instance: string; token: string }

function getUltraConfig(): UltraConfig {
  if (typeof window === 'undefined') return { instance: '', token: '' }
  try { return JSON.parse(localStorage.getItem('ultramsg-config') || '{}') }
  catch { return { instance: '', token: '' } }
}

function saveUltraConfig(c: UltraConfig) {
  localStorage.setItem('ultramsg-config', JSON.stringify(c))
}

async function sendWA(cfg: UltraConfig, to: string, body: string): Promise<void> {
  const phone = to.replace(/\s/g, '')
  const res = await fetch(`https://api.ultramsg.com/${cfg.instance}/messages/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: cfg.token, to: phone, body, priority: '10' }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
}

// ─── Config Modal ─────────────────────────────────────────────────────────────

function ConfigModal({
  open, onClose, onSave,
}: { open: boolean; onClose: () => void; onSave: (c: UltraConfig) => void }) {
  const [instance, setInstance] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    if (open) {
      const c = getUltraConfig()
      setInstance(c.instance || '')
      setToken(c.token || '')
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="Configurar envío automático">
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-cyan-500/[0.07] border border-cyan-500/20 space-y-2">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Pasos (5 min)</p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400">
            <li>Ve a <span className="text-slate-200 font-medium">ultramsg.com</span> y crea cuenta gratis</li>
            <li>Crea una instancia → escanea el QR con tu WhatsApp</li>
            <li>Copia el <span className="text-slate-200">Instance ID</span> y <span className="text-slate-200">Token</span> de tu panel</li>
            <li>Pégalos aquí y guarda</li>
          </ol>
          <p className="text-xs text-slate-500 mt-1">Gratis hasta 1,000 mensajes/mes</p>
        </div>

        <Input
          label="Instance ID"
          value={instance}
          onChange={e => setInstance(e.target.value)}
          placeholder="instance12345"
        />

        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Token</label>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="••••••••••••••••••••"
            className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-slate-200 placeholder-slate-700 px-3 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="glow"
            disabled={!instance.trim() || !token.trim()}
            onClick={() => { onSave({ instance: instance.trim(), token: token.trim() }); onClose() }}
          >
            Guardar configuración
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Bulk Message Modal ───────────────────────────────────────────────────────

type SendStatus = 'pending' | 'sending' | 'sent' | 'error'

function BulkMessageModal({
  open, onClose, people, updatePerson, ultraCfg,
}: {
  open: boolean
  onClose: () => void
  people: SpiritualPerson[]
  updatePerson: (id: string, updates: Partial<SpiritualPerson>) => void
  ultraCfg: UltraConfig
}) {
  const [step, setStep] = useState<'compose' | 'sending' | 'done'>('compose')
  const [template, setTemplate] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statuses, setStatuses] = useState<Record<string, SendStatus>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const cancelRef = useRef(false)

  const withPhone = people.filter(p => p.phone)
  const withoutPhone = people.filter(p => !p.phone)
  const recipients = withPhone.filter(p => selectedIds.has(p.id))
  const isConfigured = !!(ultraCfg.instance && ultraCfg.token)

  const sentCount = Object.values(statuses).filter(s => s === 'sent').length
  const errorCount = Object.values(statuses).filter(s => s === 'error').length

  const personalized = (p: SpiritualPerson) =>
    template.replace(/\{\{nombre\}\}/gi, p.name.split(' ')[0])

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(withPhone.map(p => p.id)))
      setStep('compose')
      setTemplate('')
      setStatuses({})
      setCurrentIndex(0)
      cancelRef.current = false
    }
  }, [open]) // eslint-disable-line

  // Auto-send when step becomes 'sending'
  useEffect(() => {
    if (step !== 'sending' || !isConfigured) return
    cancelRef.current = false

    const run = async () => {
      const init: Record<string, SendStatus> = {}
      recipients.forEach(p => { init[p.id] = 'pending' })
      setStatuses(init)

      for (let i = 0; i < recipients.length; i++) {
        if (cancelRef.current) break
        const person = recipients[i]
        setCurrentIndex(i)
        setStatuses(prev => ({ ...prev, [person.id]: 'sending' }))

        try {
          await sendWA(ultraCfg, person.phone!, personalized(person))
          setStatuses(prev => ({ ...prev, [person.id]: 'sent' }))
        } catch {
          setStatuses(prev => ({ ...prev, [person.id]: 'error' }))
        }

        if (i < recipients.length - 1 && !cancelRef.current) {
          await new Promise(r => setTimeout(r, 1500))
        }
      }

      if (!cancelRef.current) setStep('done')
    }

    run()
    return () => { cancelRef.current = true }
  }, [step]) // eslint-disable-line

  const handleClose = () => {
    cancelRef.current = true
    setStep('compose')
    setTemplate('')
    setSelectedIds(new Set())
    setStatuses({})
    setCurrentIndex(0)
    onClose()
  }

  const handleUpdateContacts = () => {
    Object.entries(statuses)
      .filter(([, s]) => s === 'sent')
      .forEach(([id]) => updatePerson(id, { lastContact: new Date().toISOString() }))
    handleClose()
  }

  const statusIcon = (s: SendStatus) => {
    if (s === 'sending') return <Loader2 size={14} className="text-cyan-400 animate-spin" />
    if (s === 'sent')    return <CheckCircle2 size={14} className="text-emerald-400" />
    if (s === 'error')   return <XCircle size={14} className="text-red-400" />
    return <div className="w-3.5 h-3.5 rounded-full bg-white/10" />
  }

  return (
    <Modal open={open} onClose={handleClose} title="Mensaje masivo">

      {/* ── Compose ── */}
      {step === 'compose' && (
        <div className="space-y-5">
          {/* Config status */}
          <div className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs border',
            isConfigured
              ? 'bg-emerald-500/[0.07] border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/[0.07] border-amber-500/20 text-amber-400'
          )}>
            {isConfigured ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isConfigured
              ? 'WhatsApp automático activo — los mensajes se enviarán solos'
              : 'WhatsApp no configurado — cierra y presiona el ícono de ajustes primero'}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1">Mensaje</label>
            <p className="text-xs text-slate-500 mb-2">
              Usa{' '}
              <code className="bg-white/[0.08] text-cyan-400 px-1.5 py-0.5 rounded text-[11px] font-mono">
                {'{{nombre}}'}
              </code>{' '}
              para personalizar con el primer nombre
            </p>
            <textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={4}
              placeholder="Hola {{nombre}}, quería escribirte para..."
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-slate-200 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
            {template && (
              <p className="text-xs text-slate-500 mt-1.5">
                Ejemplo:{' '}
                <span className="text-slate-300 italic">
                  {template.replace(/\{\{nombre\}\}/gi, people[0]?.name.split(' ')[0] || 'Carlos')}
                </span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <Users size={14} className="text-cyan-400" />
                Destinatarios <span className="text-cyan-400 font-bold">({selectedIds.size})</span>
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
                Ninguna persona tiene número guardado
              </p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {withPhone.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] cursor-pointer transition-colors select-none">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={e => setSelectedIds(prev => {
                        const next = new Set(prev)
                        if (e.target.checked) next.add(p.id); else next.delete(p.id)
                        return next
                      })}
                      className="accent-cyan-500 w-4 h-4 shrink-0"
                    />
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: LEVEL_COLORS[p.level] }}>
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {withoutPhone.length > 0 && (
              <p className="text-xs text-slate-600 mt-2">
                {withoutPhone.length} persona{withoutPhone.length > 1 ? 's' : ''} sin número no aparecen
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button
              variant="glow"
              disabled={!template.trim() || selectedIds.size === 0 || !isConfigured}
              onClick={() => setStep('sending')}
            >
              <Send size={14} />
              Enviar a {selectedIds.size} personas
            </Button>
          </div>
        </div>
      )}

      {/* ── Sending (auto) ── */}
      {step === 'sending' && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{sentCount} enviados · {errorCount > 0 ? `${errorCount} errores · ` : ''}{recipients.length - sentCount - errorCount} pendientes</span>
              <span className="tabular-nums">{Math.round(((sentCount + errorCount) / recipients.length) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00D4B8, #06B6D4)' }}
                animate={{ width: `${((sentCount + errorCount) / recipients.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Recipient list */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {recipients.map((p, i) => {
              const s = statuses[p.id] || 'pending'
              const isActive = i === currentIndex && s === 'sending'
              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all',
                    isActive
                      ? 'bg-cyan-500/[0.08] border-cyan-500/25'
                      : s === 'sent'
                      ? 'bg-emerald-500/[0.05] border-emerald-500/15'
                      : s === 'error'
                      ? 'bg-red-500/[0.05] border-red-500/15'
                      : 'bg-white/[0.03] border-white/[0.05]'
                  )}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: LEVEL_COLORS[p.level] }}>
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.phone}</p>
                  </div>
                  <div className="shrink-0">{statusIcon(s)}</div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => { cancelRef.current = true; setStep('done') }}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors text-center"
          >
            Cancelar envío
          </button>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <div className="py-6 space-y-5 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(0,212,184,0.12)', border: '1px solid rgba(0,212,184,0.3)' }}>
            <CheckCircle2 size={32} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">¡Listo!</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="text-sm text-slate-400">
                <span className="text-emerald-400 font-semibold">{sentCount}</span> enviados
              </span>
              {errorCount > 0 && (
                <span className="text-sm text-slate-400">
                  <span className="text-red-400 font-semibold">{errorCount}</span> fallidos
                </span>
              )}
            </div>
            {errorCount > 0 && (
              <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
                <AlertCircle size={11} />
                Verifica que los números incluyan código de país (ej: +18299036540)
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={handleClose}>Cerrar</Button>
            {sentCount > 0 && (
              <Button variant="glow" onClick={handleUpdateContacts}>
                <CheckCircle2 size={14} /> Marcar como contactados
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
  const [configModal, setConfigModal] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [noteModal, setNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [ultraCfg, setUltraCfg] = useState<UltraConfig>({ instance: '', token: '' })
  const [newPerson, setNewPerson] = useState({
    name: '', phone: '', level: 'visitor' as SpiritualLevel, followUpType: 'call' as FollowUpType,
  })

  useEffect(() => { setUltraCfg(getUltraConfig()) }, [])

  const pending = getPendingFollowUps()
  const isConfigured = !!(ultraCfg.instance && ultraCfg.token)

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
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
          <button key={id} onClick={() => setTab(id as any)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id ? 'bg-violet-500/30 text-violet-300' : 'text-slate-400 hover:text-slate-200')}>
            {label}
          </button>
        ))}
      </motion.div>

      {tab === 'people' && (
        <>
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
                          <Button size="sm" variant="ghost" onClick={() => {
                            const msg = encodeURIComponent(`Hola ${p.name.split(' ')[0]}, te escribo para saludarte...`)
                            window.open(`https://wa.me/${p.phone!.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank')
                          }}>
                            <MessageCircle size={12} />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => {
                          updatePerson(p.id, {
                            nextFollowUp: new Date(Date.now() + 7 * 86400000).toISOString(),
                            lastContact: new Date().toISOString(),
                          })
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

          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {people.map(p => (
              <GlassCard key={p.id} className="p-4" hoverable animate={false}
                onClick={() => setSelectedPerson(p.id === selectedPerson ? null : p.id)}>
                <div className="flex items-center gap-3">
                  <ProgressRing value={p.discipleshipProgress} size={52} strokeWidth={5}
                    color={LEVEL_COLORS[p.level]} animate={false}>
                    <span className="text-lg font-bold text-white">{p.name[0]}</span>
                  </ProgressRing>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{p.name}</p>
                      <Badge size="sm"
                        style={{ background: `${LEVEL_COLORS[p.level]}20`, color: LEVEL_COLORS[p.level], borderColor: `${LEVEL_COLORS[p.level]}40` }}
                        className="border">
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
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
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
          {events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(ev => (
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
                  <input placeholder={f.placeholder}
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-violet-500/50" />
                </div>
              ))}
              <textarea placeholder="Escribe tu reflexión del día..." rows={4}
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-violet-500/50 resize-none" />
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
          <Input label="Teléfono con código de país" value={newPerson.phone} onChange={e => setNewPerson(p => ({ ...p, phone: e.target.value }))} placeholder="+18299036540" />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Nivel espiritual</label>
            <select value={newPerson.level} onChange={e => setNewPerson(p => ({ ...p, level: e.target.value as SpiritualLevel }))}
              className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none">
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
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Escribe una nota sobre esta persona..." rows={4}
            className="w-full rounded-xl bg-white/[0.05] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-700 px-3 py-2.5 focus:outline-none focus:border-violet-500/50 resize-none" />
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

      {/* Config Modal */}
      <ConfigModal
        open={configModal}
        onClose={() => setConfigModal(false)}
        onSave={cfg => { saveUltraConfig(cfg); setUltraCfg(cfg) }}
      />

      {/* Bulk Message Modal */}
      <BulkMessageModal
        open={bulkModal}
        onClose={() => setBulkModal(false)}
        people={people}
        updatePerson={updatePerson}
        ultraCfg={ultraCfg}
      />
    </motion.div>
  )
}
