'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Zap, X } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { getLevelTitle } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'

export function LevelUpModal() {
  const { levelUpVisible, levelUpData, dismissLevelUp } = useAppStore()

  return (
    <AnimatePresence>
      {levelUpVisible && levelUpData && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 glass-elevated rounded-3xl p-8 text-center shadow-2xl border border-violet-500/30"
          >
            <button onClick={dismissLevelUp} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X size={16} />
            </button>

            {/* Glow orb */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(124,58,237,0.6)]"
            >
              <Crown size={36} className="text-white" />
            </motion.div>

            <p className="text-sm text-violet-400 font-semibold uppercase tracking-widest mb-1">¡Subiste de nivel!</p>
            <h2 className="text-5xl font-black text-white mb-2">
              Lv.{levelUpData.newLevel}
            </h2>
            <p className="text-xl font-bold gradient-text mb-2">{getLevelTitle(levelUpData.newLevel)}</p>
            <p className="text-sm text-slate-400 mb-6">Has pasado de Lv.{levelUpData.oldLevel} a Lv.{levelUpData.newLevel}</p>

            <div className="flex items-center justify-center gap-1 mb-6">
              <Zap size={14} className="text-amber-400" />
              <span className="text-sm text-amber-400">Nuevas recompensas desbloqueadas</span>
            </div>

            <Button variant="glow" className="w-full" onClick={dismissLevelUp}>
              ¡Continuar! 🎉
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
