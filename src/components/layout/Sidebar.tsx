'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV_ITEMS } from '@/config/navigation'
import { cn } from '@/lib/utils/cn'
import { Crown, ChevronLeft, ChevronRight, Flame, Star, LogOut } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { resetAllStores } from '@/lib/utils/rehydrateStores'
import { setCurrentUserId } from '@/lib/utils/userStorage'

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { sidebarOpen, toggleSidebar, user, logout } = useAppStore()

  const handleLogout = () => {
    setCurrentUserId(null)
    resetAllStores()
    logout()
    router.replace('/login')
  }

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col fixed left-0 top-0 h-full z-30 border-r border-white/[0.06] bg-[#0D0D16] overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.06] shrink-0">
        <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shrink-0">
          <Crown size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="ml-3 font-bold text-white text-sm tracking-wide whitespace-nowrap"
            >
              Kingdom OS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.id} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group',
                  active
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                )}
              >
                <div className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-colors',
                  active ? 'bg-violet-500/20' : 'group-hover:bg-white/[0.05]'
                )}>
                  <Icon size={16} className={active ? 'text-violet-400' : ''} />
                </div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute right-0 w-0.5 h-6 bg-violet-400 rounded-l-full"
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User mini profile */}
      <div className="p-2 border-t border-white/[0.06] shrink-0">
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-lg', sidebarOpen ? '' : 'justify-center')}>
          <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center shrink-0 text-xs font-bold text-white">
            {user?.name?.[0] ?? 'U'}
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'Usuario'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Flame size={10} className="text-orange-400" />
                  <span className="text-[10px] text-slate-400">{user?.streak ?? 0}d</span>
                  <Star size={10} className="text-amber-400 ml-1" />
                  <span className="text-[10px] text-slate-400">Lv.{user?.level ?? 1}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout */}
      <div className="px-2 pb-2 shrink-0">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all group',
            !sidebarOpen && 'justify-center'
          )}
        >
          <LogOut size={15} className="shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="text-sm whitespace-nowrap"
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-[70px] -right-3 w-6 h-6 rounded-full bg-[#1A1A27] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-violet-500/20 transition-colors"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </motion.aside>
  )
}
