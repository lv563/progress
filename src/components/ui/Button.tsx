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
  primary:   'bg-[#EF4444] hover:bg-red-500 text-white',
  secondary: 'bg-white/8 hover:bg-white/12 text-gray-300 border border-white/10',
  ghost:     'hover:bg-white/6 text-gray-400 hover:text-white',
  danger:    'bg-red-500 hover:bg-red-600 text-white',
  glow:      'bg-[#EF4444] hover:bg-red-500 text-white',
  outline:   'border border-white/10 hover:bg-white/5 text-gray-400 hover:text-gray-300 hover:border-white/15',
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
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
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
