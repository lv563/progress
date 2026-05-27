'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  trend?: number
  icon?: React.ReactNode
  color?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StatCard({ label, value, subValue, trend, icon, color = '#7C3AED', className, size = 'md' }: StatCardProps) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend === undefined ? '' : trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={cn(
        'glass rounded-2xl p-4 flex flex-col gap-2',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
          <motion.p
            className={cn(
              'font-bold text-white mt-1',
              size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            {value}
          </motion.p>
          {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}20` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
        )}
      </div>
      {TrendIcon && (
        <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
          <TrendIcon size={12} />
          <span>{Math.abs(trend!)}% vs semana pasada</span>
        </div>
      )}
    </motion.div>
  )
}
