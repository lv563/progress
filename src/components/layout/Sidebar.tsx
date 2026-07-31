'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV_ITEMS } from '@/config/navigation'
import { cn } from '@/lib/utils/cn'
import { Crown, ChevronLeft, ChevronRight, Flame, Zap, LogOut } from 'lucide-react'
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
      animate={{ width: sidebarOpen ? 232 : 60 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col fixed left-0 top-0 h-full z-30 border-r border-black/[0.06] bg-white overflow-hidden"
      style={{ boxShadow: '1px 0 0 rgba(0,0,0,0.04)' }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-3.5 border-b border-black/[0.06] shrink-0">
        <div className="w-8 h-8 rounded-xl gradient-hero flex items-center justify-center shrink-0 shadow-sm">
          <Crown size={15} className="text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="ml-3 font-bold text-gray-900 text-sm tracking-tight whitespace-nowrap"
            >
              Kingdom OS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.id} href={item.href}>
              <motion.div
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer transition-all duration-150 group relative',
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                )}
              >
                <div className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-colors',
                  active ? 'bg-indigo-100' : 'group-hover:bg-gray-100'
                )}>
                  <Icon size={15} className={active ? 'text-indigo-600' : ''} />
                </div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.14 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User mini profile */}
      <div className="p-2 border-t border-black/[0.06] shrink-0">
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-xl', sidebarOpen ? '' : 'justify-center')}>
          <div className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center shrink-0 text-xs font-bold text-white">
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
                <p className="text-xs font-semibold text-gray-800 truncate">{user?.name ?? 'Usuario'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Flame size={9} className="text-orange-400" />
                  <span className="text-[10px] text-gray-400">{user?.streak ?? 0}d</span>
                  <Zap size={9} className="text-indigo-400 ml-1" />
                  <span className="text-[10px] text-gray-400">Lv.{user?.level ?? 1}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout */}
      <div className="px-2 pb-3 shrink-0">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-2 py-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all',
            !sidebarOpen && 'justify-center'
          )}
        >
          <LogOut size={14} className="shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.14 }}
                className="text-sm whitespace-nowrap"
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute top-[70px] -right-3 w-6 h-6 rounded-full bg-white border border-black/[0.08] shadow-sm flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </motion.aside>
  )
}
