'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Crown, User, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/stores/app.store'
import { emailToId, setCurrentUserId } from '@/lib/utils/userStorage'
import { resetAllStores, rehydrateAllStores } from '@/lib/utils/rehydrateStores'

const PERKS = [
  'Hábitos con rachas y XP',
  'Pomodoro + bloqueo de foco',
  'Módulo espiritual y ministerio',
  'Control de finanzas personal',
  'Físico, gimnasio y nutrición',
  'Análisis de vida completo',
]

export default function RegisterPage() {
  const router  = useRouter()
  const { setUser } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Completa todos los campos'); return }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)

    const uid = emailToId(form.email)
    setCurrentUserId(null)
    resetAllStores()
    setCurrentUserId(uid)
    setUser({ id: uid, name: form.name, email: form.email, xp: 0, level: 1, streak: 0, bestStreak: 0, badges: [], createdAt: new Date().toISOString() })
    rehydrateAllStores()

    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 max-w-3xl mx-auto w-full">
      {/* Left — perks */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-col gap-5 flex-1"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-hero flex items-center justify-center shadow-[0_0_32px_rgba(124,58,237,0.5)]">
            <Crown size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-h2 text-gray-900">Kingdom OS</h1>
            <p className="text-xs text-gray-500">Sistema operativo de vida</p>
          </div>
        </div>
        <p className="text-gray-700 text-body-lg leading-relaxed">
          Todo lo que necesitas para vivir con propósito, disciplina y orden — en un solo lugar.
        </p>
        <div className="space-y-3">
          {PERKS.map((perk, i) => (
            <motion.div
              key={perk}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span className="text-sm text-gray-700">{perk}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Right — form */}
      <div className="flex flex-col gap-5 w-full max-w-sm">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 lg:hidden">
          <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center shadow-[0_0_32px_rgba(124,58,237,0.5)]">
            <Crown size={28} className="text-white" />
          </div>
          <h1 className="text-h2 text-gray-900">Empieza tu Kingdom</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
            <h2 className="text-h3 text-gray-900 mb-5">Crear cuenta gratuita</h2>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Nombre completo"
                placeholder="Luis Vargas"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                icon={<User size={14} />}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                icon={<Mail size={14} />}
                required
              />
              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  icon={<Lock size={14} />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Al registrarte aceptas los{' '}
                <span className="text-indigo-600 cursor-pointer hover:text-indigo-700 transition-colors">Términos de servicio</span>.
              </p>
              <Button type="submit" variant="glow" className="w-full mt-1" loading={loading}>
                Crear mi Kingdom <ArrowRight size={14} />
              </Button>
            </form>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-500 text-center"
        >
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            Inicia sesión
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
