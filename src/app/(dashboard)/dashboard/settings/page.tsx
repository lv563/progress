'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { Settings, User, Bell, Palette, Shield, LogOut, ChevronRight, Crown, Flame, Zap, Star } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { useAppStore } from '@/stores/app.store'
import { formatXP, getLevelTitle, levelProgress } from '@/lib/utils/format'
import { resetAllStores } from '@/lib/utils/rehydrateStores'
import { setCurrentUserId } from '@/lib/utils/userStorage'

const BADGE_DATA: Record<string, { name: string; icon: string; desc: string }> = {
  'fire-7':       { name: 'Semana de Fuego',    icon: '🔥', desc: '7 días consecutivos' },
  'iron-30':      { name: 'Voluntad de Hierro', icon: '⚙️', desc: '30 días consecutivos' },
  'early-bird':   { name: 'Madrugador',         icon: '🌅', desc: 'Completar antes de las 7am' },
  'deep-worker':  { name: 'Deep Worker',        icon: '🧠', desc: '100 pomodoros completados' },
}


export default function SettingsPage() {
  const { user, setUser, logout } = useAppStore()
  const [name, setName] = useState(user?.name ?? '')
  const [saved, setSaved] = useState(false)
  const xpPct = user ? levelProgress(user.xp, user.level) : 0

  const handleSave = () => {
    if (user) setUser({ ...user, name })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = () => {
    setCurrentUserId(null)
    resetAllStores()
    logout()
    window.location.href = '/login'
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 max-w-2xl mx-auto">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Settings size={24} className="text-gray-400" /> Configuración
        </h1>
      </motion.div>

      {/* Profile card */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-6" variant="elevated" animate={false}>
          <div className="flex items-center gap-5">
            <ProgressRing value={xpPct} size={72} strokeWidth={6} color="#7C3AED" animate={false}>
              <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center text-xl font-black text-white">
                {user?.name?.[0] ?? 'U'}
              </div>
            </ProgressRing>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Crown size={12} className="text-violet-600" />
                  <span className="text-xs text-violet-600">Lv.{user?.level} — {getLevelTitle(user?.level ?? 1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame size={12} className="text-orange-500" />
                  <span className="text-xs text-orange-500">{user?.streak}d racha</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Badges */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-500" /> Mis Badges ({user?.badges.length ?? 0})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(user?.badges ?? []).map(b => {
              const bd = BADGE_DATA[b]
              if (!bd) return null
              return (
                <div key={b} className="flex flex-col items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-2xl">{bd.icon}</span>
                  <p className="text-xs font-semibold text-gray-900 text-center">{bd.name}</p>
                  <p className="text-[10px] text-gray-500 text-center">{bd.desc}</p>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Profile settings */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={16} className="text-cyan-600" /> Perfil
          </h3>
          <div className="space-y-4">
            <Input label="Nombre completo" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Email" value={user?.email ?? ''} disabled className="opacity-50" />
            <Button variant="glow" onClick={handleSave}>
              {saved ? '✓ Guardado' : 'Guardar cambios'}
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Settings menu */}
      <motion.div variants={fadeUp}>
        <GlassCard className="overflow-hidden" animate={false}>
          {[
            { icon: Palette, label: 'Apariencia',    desc: 'Tema y colores',        color: '#7C3AED' },
            { icon: Bell,    label: 'Recordatorios', desc: 'Hábitos y rutinas',      color: '#F59E0B' },
            { icon: Shield,  label: 'Privacidad',    desc: 'Datos y seguridad',      color: '#10B981' },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${i > 0 ? 'border-t border-gray-100' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15`, color: item.color }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            )
          })}
        </GlassCard>
      </motion.div>

      {/* Danger zone */}
      <motion.div variants={fadeUp}>
        <Button variant="danger" className="w-full" onClick={handleLogout}>
          <LogOut size={16} /> Cerrar sesión
        </Button>
      </motion.div>
    </motion.div>
  )
}
