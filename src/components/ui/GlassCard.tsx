'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  variant?: 'default' | 'elevated' | 'glow' | 'violet' | 'cyan' | 'amber' | 'green'
  hoverable?: boolean
  onClick?: () => void
  animate?: boolean
}

const variants = {
  default:  'bg-[#111] border-white/8',
  elevated: 'bg-[#161616] border-white/10',
  glow:     'bg-[#EF4444]/5 border-[#EF4444]/15',
  violet:   'bg-[#EF4444]/5 border-[#EF4444]/12',
  cyan:     'bg-white/[0.03] border-white/8',
  amber:    'bg-white/[0.03] border-white/8',
  green:    'bg-white/[0.03] border-white/8',
}

export function GlassCard({ children, className, style, variant = 'default', hoverable, onClick, animate = true }: GlassCardProps) {
  const base = cn(
    'border rounded-2xl',
    variants[variant],
    hoverable && 'cursor-pointer transition-all duration-200 hover:border-white/15',
    className
  )

  if (!animate) return <div className={base} style={style} onClick={onClick}>{children}</div>

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      whileHover={hoverable ? { scale: 1.005 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      className={base}
      style={style}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
