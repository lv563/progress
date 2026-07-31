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
  primary:   'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200',
  ghost:     'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  glow:      'gradient-hero text-white shadow-sm hover:opacity-90',
  outline:   'border border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300',
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
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
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
