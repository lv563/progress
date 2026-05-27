'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Bell, Settings, Zap, Flame } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useAppStore } from '@/stores/app.store'
import { formatXP, getLevelTitle, levelProgress } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { CommandPalette } from './CommandPalette'

export function TopBar() {
  const { user, commandPaletteOpen, setCommandPaletteOpen } = useAppStore()
  const [searchFocused, setSearchFocused] = useState(false)

  const today = format(new Date(), "EEEE, d 'de' MMMM")
  const xpPct = user ? levelProgress(user.xp, user.level) : 0

  return (
    <>
      <header className="fixed top-0 right-0 left-0 h-16 z-20 flex items-center gap-4 px-4 border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-xl">
        {/* spacer for sidebar */}
        <div className="w-16 shrink-0" />

        {/* Date */}
        <div className="hidden md:block">
          <p className="text-sm text-slate-400 capitalize">{today}</p>
        </div>

        <div className="flex-1" />

        {/* Search bar — opens command palette */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 text-sm text-slate-500 hover:text-slate-300',
            'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10',
            'hidden sm:flex'
          )}
        >
          <Search size={14} />
          <span>Buscar o ejecutar...</span>
          <kbd className="ml-6 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-500">⌘K</kbd>
        </button>

        {/* XP Bar */}
        {user && (
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-orange-400 animate-streak-fire" />
              <span className="text-sm font-bold text-orange-400">{user.streak}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 leading-none">Lv.{user.level} {getLevelTitle(user.level)}</span>
                <div className="mt-1 w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full gradient-xp"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <span className="text-xs text-amber-400 font-mono">{formatXP(user.xp)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link href="/dashboard/settings">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors">
              <Settings size={16} />
            </button>
          </Link>
          <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-xs font-bold text-white cursor-pointer">
            {user?.name?.[0] ?? 'U'}
          </div>
        </div>
      </header>

      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </>
  )
}
