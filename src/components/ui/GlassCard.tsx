'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'glow' | 'violet' | 'cyan' | 'amber' | 'green'
  hoverable?: boolean
  onClick?: () => void
  animate?: boolean
}

const variants = {
  default:  'bg-white/[0.04] border-white/[0.08]',
  elevated: 'bg-white/[0.06] border-white/[0.12]',
  glow:     'bg-violet-500/[0.08] border-violet-500/25 shadow-[0_0_40px_rgba(124,58,237,0.15)]',
  violet:   'bg-violet-500/[0.06] border-violet-500/20',
  cyan:     'bg-cyan-500/[0.06] border-cyan-500/20',
  amber:    'bg-amber-500/[0.06] border-amber-500/20',
  green:    'bg-emerald-500/[0.06] border-emerald-500/20',
}

export function GlassCard({ children, className, variant = 'default', hoverable, onClick, animate = true }: GlassCardProps) {
  const base = cn(
    'backdrop-blur-xl border rounded-2xl',
    variants[variant],
    hoverable && 'cursor-pointer transition-all duration-200 hover:bg-white/[0.07] hover:border-white/[0.14]',
    className
  )

  if (!animate) return <div className={base} onClick={onClick}>{children}</div>

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      whileHover={hoverable ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      className={base}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
