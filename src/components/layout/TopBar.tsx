'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Settings, Zap, Flame, Crown, Cloud, CloudOff, Loader2, CloudCheck } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { useAppStore } from '@/stores/app.store'
import { useSyncStore, SyncStatus } from '@/stores/sync.store'
import { formatXP, getLevelTitle, levelProgress } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { CommandPalette } from './CommandPalette'

const SYNC_UI: Record<SyncStatus, { icon: any; color: string; title: string }> = {
  idle:    { icon: Cloud,      color: 'text-gray-600',    title: 'Sin sincronizar' },
  syncing: { icon: Loader2,    color: 'text-[#EF4444]',   title: 'Sincronizando...' },
  synced:  { icon: CloudCheck, color: 'text-emerald-500', title: 'Sincronizado' },
  error:   { icon: CloudOff,   color: 'text-red-400',     title: 'Error al sincronizar' },
  offline: { icon: CloudOff,   color: 'text-gray-600',    title: 'Sin conexión' },
}

export function TopBar() {
  const { user, commandPaletteOpen, setCommandPaletteOpen } = useAppStore()
  const { status: syncStatus, lastSync } = useSyncStore()
  const syncUi = SYNC_UI[syncStatus]
  const SyncIcon = syncUi.icon

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es })
  const xpPct = user ? levelProgress(user.xp, user.level) : 0

  return (
    <>
      <header className="fixed top-0 right-0 left-0 h-16 z-20 flex items-center gap-3 px-4 border-b border-white/6 bg-[#111]/90 backdrop-blur-xl">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-[#EF4444] flex items-center justify-center shrink-0">
            <Crown size={13} className="text-white" />
          </div>
          <span className="font-black text-white text-sm tracking-tight">Kingdom OS</span>
        </div>
        <div className="hidden md:block w-[60px] shrink-0" />

        {/* Date */}
        <div className="hidden md:block">
          <p className="text-sm text-gray-600 capitalize font-medium">{today}</p>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/8 bg-white/[0.03] text-sm text-gray-500 hover:text-gray-300 hover:bg-white/6 hover:border-white/12 transition-all"
        >
          <Search size={14} />
          <span className="hidden md:inline">Buscar...</span>
          <kbd className="hidden md:inline ml-4 text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-600">⌘K</kbd>
        </button>

        {/* Mobile search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
        >
          <Search size={18} />
        </button>

        {/* XP Bar — desktop */}
        {user && (
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Flame size={13} className="text-orange-400 animate-streak-fire" />
              <span className="text-sm font-bold text-orange-400">{user.streak}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Zap size={13} className="text-[#EF4444]" />
              <div className="flex flex-col items-end">
                <span className="text-[11px] text-gray-500 leading-none">Lv.{user.level} · {getLevelTitle(user.level)}</span>
                <div className="mt-1 w-20 h-1 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#EF4444]"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <span className="text-xs text-[#EF4444] font-bold tabular-nums">{formatXP(user.xp)}</span>
            </div>
          </div>
        )}

        {/* Mobile XP mini */}
        {user && (
          <div className="flex lg:hidden items-center gap-1.5">
            <Flame size={13} className="text-orange-400" />
            <span className="text-xs font-bold text-orange-400">{user.streak}d</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <div
            title={`${syncUi.title}${lastSync ? ` · ${format(new Date(lastSync), 'HH:mm')}` : ''}`}
            className="w-8 h-8 flex items-center justify-center"
          >
            <SyncIcon size={15} className={cn(syncUi.color, syncStatus === 'syncing' && 'animate-spin')} />
          </div>

          <Link href="/dashboard/settings">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white/5 hover:text-gray-300 transition-colors">
              <Settings size={16} />
            </button>
          </Link>

          <div className="w-8 h-8 rounded-full bg-[#EF4444] flex items-center justify-center text-xs font-black text-white cursor-pointer">
            {user?.name?.[0] ?? 'U'}
          </div>
        </div>
      </header>

      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </>
  )
}
