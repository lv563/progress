'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glow' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  children: React.ReactNode
}

const variants = {
  primary:   'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)]',
  secondary: 'bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 border border-white/10',
  ghost:     'hover:bg-white/[0.06] text-slate-300 hover:text-white',
  danger:    'bg-red-500/80 hover:bg-red-500 text-white',
  glow:      'gradient-hero text-white shadow-[0_4px_20px_rgba(124,58,237,0.5)] hover:shadow-[0_4px_32px_rgba(124,58,237,0.7)]',
  outline:   'border border-white/20 hover:bg-white/[0.06] text-slate-300',
}

const sizes = {
  sm:   'h-7 px-3 text-xs rounded-lg',
  md:   'h-9 px-4 text-sm rounded-xl',
  lg:   'h-11 px-6 text-base rounded-xl',
  icon: 'h-9 w-9 rounded-xl',
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </motion.button>
  )
}
