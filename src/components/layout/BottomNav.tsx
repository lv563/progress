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
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-[#111]/95 backdrop-blur-xl border-t border-white/6">
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
                    active ? 'bg-[#EF4444]/15' : 'bg-transparent'
                  )}>
                    <Icon size={20} className={cn('transition-colors duration-200', active ? 'text-[#EF4444]' : 'text-gray-600')} />
                  </div>
                  <span className={cn('text-[10px] font-medium transition-colors duration-200', active ? 'text-[#EF4444]' : 'text-gray-600')}>
                    {tab.label}
                  </span>
                </motion.div>
              </Link>
            )
          })}

          <button className="flex-1" onClick={() => setMoreOpen(true)}>
            <div className="flex flex-col items-center gap-0.5 py-1.5">
              <div className={cn('w-10 h-8 rounded-xl flex items-center justify-center transition-all', moreOpen ? 'bg-[#EF4444]/15' : '')}>
                <MoreHorizontal size={20} className={cn('transition-colors', moreOpen ? 'text-[#EF4444]' : 'text-gray-600')} />
              </div>
              <span className={cn('text-[10px] font-medium', moreOpen ? 'text-[#EF4444]' : 'text-gray-600')}>Más</span>
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
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#111] border-t border-white/8 rounded-t-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
                <span className="text-sm font-black text-white tracking-wide">TODOS LOS MÓDULOS</span>
                <button onClick={() => setMoreOpen(false)} className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
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
                          active ? 'bg-[#EF4444]/12' : 'bg-white/[0.03] hover:bg-white/6'
                        )}
                      >
                        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', active ? 'bg-[#EF4444]/20' : 'bg-white/5 border border-white/8')}>
                          <Icon size={20} className={active ? 'text-[#EF4444]' : 'text-gray-400'} />
                        </div>
                        <span className={cn('text-xs font-medium text-center leading-tight', active ? 'text-[#EF4444]' : 'text-gray-400')}>
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
