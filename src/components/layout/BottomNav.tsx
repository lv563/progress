'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { BOTTOM_TABS } from '@/config/navigation'
import { cn } from '@/lib/utils/cn'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-[#0D0D16]/95 backdrop-blur-xl border-t border-white/[0.06]">
      <div className="flex items-center justify-around py-2 px-4">
        {BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          return (
            <Link key={tab.id} href={tab.href} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 py-1"
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                  active ? 'bg-violet-500/20' : 'bg-transparent'
                )}>
                  <Icon
                    size={20}
                    className={cn(
                      'transition-colors duration-200',
                      active ? 'text-violet-400' : 'text-slate-500'
                    )}
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-medium transition-colors duration-200',
                  active ? 'text-violet-400' : 'text-slate-600'
                )}>
                  {tab.label}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
