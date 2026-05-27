'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'

export function XPToast() {
  const { xpEvents } = useAppStore()

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 pointer-events-none md:bottom-6">
      <AnimatePresence>
        {xpEvents.map(ev => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: 60, scale: 0.7 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl glass-elevated border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap size={12} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400">+{ev.amount} XP</p>
              <p className="text-[10px] text-slate-500">{ev.reason}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
