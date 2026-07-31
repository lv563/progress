'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Search, LayoutDashboard, Target, Timer, CheckSquare,
  Calendar, Dumbbell, Church, FolderLock, BarChart3,
  Plus, Play, ArrowRight, Wallet
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: 'navigate' | 'action'
  shortcut?: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)

  const commands: CommandItem[] = [
    { id: 'goto-dashboard',  label: 'Ir a Dashboard',   icon: LayoutDashboard, action: () => router.push('/dashboard'),           category: 'navigate', shortcut: 'G D' },
    { id: 'goto-habits',     label: 'Ir a Hábitos',     icon: Target,          action: () => router.push('/dashboard/habits'),    category: 'navigate', shortcut: 'G H' },
    { id: 'goto-pomodoro',   label: 'Ir a Pomodoro',    icon: Timer,           action: () => router.push('/dashboard/pomodoro'),  category: 'navigate', shortcut: 'G P' },
    { id: 'goto-tasks',      label: 'Ir a Tareas',      icon: CheckSquare,     action: () => router.push('/dashboard/tasks'),     category: 'navigate', shortcut: 'G T' },
    { id: 'goto-routine',    label: 'Ir a Rutina',      icon: Calendar,        action: () => router.push('/dashboard/routine'),   category: 'navigate', shortcut: 'G R' },
    { id: 'goto-physical',   label: 'Ir a Físico',      icon: Dumbbell,        action: () => router.push('/dashboard/physical'),  category: 'navigate', shortcut: 'G F' },
    { id: 'goto-ministry',   label: 'Ir a Ministerio',  icon: Church,          action: () => router.push('/dashboard/ministry'),  category: 'navigate', shortcut: 'G M' },
    { id: 'goto-finance',    label: 'Ir a Finanzas',    icon: Wallet,          action: () => router.push('/dashboard/finance'),   category: 'navigate', shortcut: 'G $' },
    { id: 'goto-vault',      label: 'Ir a Bóveda',      icon: FolderLock,      action: () => router.push('/dashboard/vault'),     category: 'navigate', shortcut: 'G V' },
    { id: 'goto-analytics',  label: 'Ver Análisis',     icon: BarChart3,       action: () => router.push('/dashboard/analytics'), category: 'navigate', shortcut: 'G A' },
    { id: 'new-task',        label: 'Nueva tarea',      icon: Plus,            action: () => router.push('/dashboard/tasks'),     category: 'action',   shortcut: '⌘N' },
    { id: 'start-pomodoro',  label: 'Iniciar Pomodoro', icon: Play,            action: () => router.push('/dashboard/pomodoro'),  category: 'action',   shortcut: '⌘P' },
  ]

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  const execute = useCallback((cmd: CommandItem) => {
    cmd.action()
    onClose()
    setQuery('')
    setSelected(0)
  }, [onClose])

  useEffect(() => {
    if (!open) { setQuery(''); setSelected(0) }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onClose() }
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && filtered[selected]) execute(filtered[selected])
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, selected, filtered, execute, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0) }}
                placeholder="Buscar o ejecutar un comando..."
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
              />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Sin resultados para "{query}"</p>
              )}
              {['navigate', 'action'].map(cat => {
                const items = filtered.filter(c => c.category === cat)
                if (!items.length) return null
                return (
                  <div key={cat}>
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {cat === 'navigate' ? 'Navegar' : 'Acciones'}
                    </p>
                    {items.map((cmd, i) => {
                      const Icon = cmd.icon
                      const idx = filtered.indexOf(cmd)
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => execute(cmd)}
                          onMouseEnter={() => setSelected(idx)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            idx === selected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                            idx === selected ? 'bg-indigo-100' : 'bg-gray-100'
                          )}>
                            <Icon size={14} />
                          </div>
                          <span className="flex-1 text-sm">{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-mono">
                              {cmd.shortcut}
                            </kbd>
                          )}
                          {idx === selected && <ArrowRight size={14} className="text-indigo-500" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
