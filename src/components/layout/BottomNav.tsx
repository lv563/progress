'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BOTTOM_TABS, NAV_ITEMS } from '@/config/navigation'
import { cn } from '@/lib/utils/cn'
import { MoreHorizontal, X } from 'lucide-react'

const BOTTOM_IDS = BOTTOM_TABS.map(t => t.id as string)
const MORE_ITEMS = NAV_ITEMS.filter(item => !BOTTOM_IDS.includes(item.id as string))

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-xl border-t border-black/[0.06]"
        style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-around py-1 px-2">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon
            const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
            return (
              <Link key={tab.id} href={tab.href} className="flex-1">
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="flex flex-col items-center gap-0.5 py-1.5"
                >
                  <div className={cn(
                    'w-10 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                    active ? 'bg-indigo-50' : 'bg-transparent'
                  )}>
                    <Icon size={20} className={cn('transition-colors duration-200', active ? 'text-indigo-600' : 'text-gray-400')} />
                  </div>
                  <span className={cn('text-[10px] font-medium transition-colors duration-200', active ? 'text-indigo-600' : 'text-gray-400')}>
                    {tab.label}
                  </span>
                </motion.div>
              </Link>
            )
          })}

          <button className="flex-1" onClick={() => setMoreOpen(true)}>
            <div className="flex flex-col items-center gap-0.5 py-1.5">
              <div className={cn('w-10 h-8 rounded-xl flex items-center justify-center transition-all', moreOpen ? 'bg-indigo-50' : '')}>
                <MoreHorizontal size={20} className={cn('transition-colors', moreOpen ? 'text-indigo-600' : 'text-gray-400')} />
              </div>
              <span className={cn('text-[10px] font-medium', moreOpen ? 'text-indigo-600' : 'text-gray-400')}>Más</span>
            </div>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-black/[0.06] rounded-t-2xl"
              style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-900">Todos los módulos</span>
                <button onClick={() => setMoreOpen(false)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 p-4 pb-8">
                {MORE_ITEMS.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  return (
                    <Link key={item.id} href={item.href} onClick={() => setMoreOpen(false)}>
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all',
                          active ? 'bg-indigo-50' : 'bg-gray-50 hover:bg-gray-100'
                        )}
                      >
                        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', active ? 'bg-indigo-100' : 'bg-white shadow-sm border border-gray-100')}>
                          <Icon size={20} className={active ? 'text-indigo-600' : 'text-gray-500'} />
                        </div>
                        <span className={cn('text-xs font-medium text-center leading-tight', active ? 'text-indigo-700' : 'text-gray-600')}>
                          {item.label}
                        </span>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
