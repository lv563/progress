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

export function StatCard({ label, value, subValue, trend, icon, color = '#EF4444', className, size = 'md' }: StatCardProps) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend === undefined ? '' : trend > 0 ? 'text-white' : trend < 0 ? 'text-red-400' : 'text-gray-500'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={cn(
        'bg-[#111] border border-white/8 rounded-2xl p-4 flex flex-col gap-2',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">{label}</p>
          <motion.p
            className={cn(
              'font-black text-white mt-1.5 tracking-tight',
              size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'
            )}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.08 }}
          >
            {value}
          </motion.p>
          {subValue && <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
        )}
      </div>
      {TrendIcon && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
          <TrendIcon size={12} />
          <span>{Math.abs(trend!)}% vs semana pasada</span>
        </div>
      )}
    </motion.div>
  )
}
