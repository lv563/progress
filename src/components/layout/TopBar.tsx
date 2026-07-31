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
  idle:    { icon: Cloud,      color: 'text-gray-400',    title: 'Sin sincronizar' },
  syncing: { icon: Loader2,    color: 'text-indigo-500',  title: 'Sincronizando...' },
  synced:  { icon: CloudCheck, color: 'text-emerald-500', title: 'Sincronizado' },
  error:   { icon: CloudOff,   color: 'text-red-400',     title: 'Error al sincronizar' },
  offline: { icon: CloudOff,   color: 'text-gray-400',    title: 'Sin conexión' },
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
      <header className="fixed top-0 right-0 left-0 h-16 z-20 flex items-center gap-3 px-4 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg gradient-hero flex items-center justify-center shrink-0 shadow-sm">
            <Crown size={13} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">Kingdom OS</span>
        </div>
        <div className="hidden md:block w-[60px] shrink-0" />

        {/* Date */}
        <div className="hidden md:block">
          <p className="text-sm text-gray-400 capitalize font-medium">{today}</p>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className={cn(
            'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 text-sm text-gray-400 hover:text-gray-600',
            'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
          )}
        >
          <Search size={14} />
          <span className="hidden md:inline">Buscar...</span>
          <kbd className="hidden md:inline ml-4 text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-400 shadow-sm">⌘K</kbd>
        </button>

        {/* Mobile search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Search size={18} />
        </button>

        {/* XP Bar — desktop */}
        {user && (
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Flame size={13} className="text-orange-400 animate-streak-fire" />
              <span className="text-sm font-bold text-orange-500">{user.streak}</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <Zap size={13} className="text-indigo-500" />
              <div className="flex flex-col items-end">
                <span className="text-[11px] text-gray-400 leading-none">Lv.{user.level} · {getLevelTitle(user.level)}</span>
                <div className="mt-1 w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full gradient-hero"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <span className="text-xs text-indigo-600 font-semibold tabular-nums">{formatXP(user.xp)}</span>
            </div>
          </div>
        )}

        {/* Mobile XP mini */}
        {user && (
          <div className="flex lg:hidden items-center gap-1.5">
            <Flame size={13} className="text-orange-400" />
            <span className="text-xs font-bold text-orange-500">{user.streak}d</span>
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
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <Settings size={16} />
            </button>
          </Link>

          <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-sm">
            {user?.name?.[0] ?? 'U'}
          </div>
        </div>
      </header>

      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </>
  )
}
