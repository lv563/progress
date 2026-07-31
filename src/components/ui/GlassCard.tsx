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
  default:  'bg-white border-black/[0.07]',
  elevated: 'bg-white border-black/[0.07]',
  glow:     'bg-indigo-50 border-indigo-200/60',
  violet:   'bg-violet-50 border-violet-200/60',
  cyan:     'bg-cyan-50 border-cyan-200/60',
  amber:    'bg-amber-50 border-amber-200/60',
  green:    'bg-emerald-50 border-emerald-200/60',
}

export function GlassCard({ children, className, style, variant = 'default', hoverable, onClick, animate = true }: GlassCardProps) {
  const base = cn(
    'border rounded-2xl',
    variants[variant],
    hoverable && 'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-black/[0.10]',
    className
  )
  const shadow = 'box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'

  if (!animate) return <div className={base} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', ...style }} onClick={onClick}>{children}</div>

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      whileHover={hoverable ? { scale: 1.005, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      className={base}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', ...style }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
