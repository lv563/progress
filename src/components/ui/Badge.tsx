import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'violet' | 'cyan' | 'amber' | 'green' | 'red' | 'orange' | 'pink' | 'outline'
  size?: 'sm' | 'md'
  className?: string
  style?: React.CSSProperties
}

const variants = {
  default: 'bg-white/10 text-slate-300',
  violet:  'bg-[#EF4444]/15 text-red-300 border border-[#EF4444]/25',
  cyan:    'bg-white/8 text-gray-400 border border-white/12',
  amber:   'bg-white/8 text-gray-300 border border-white/12',
  green:   'bg-white/10 text-white border border-white/18',
  red:     'bg-red-500/20 text-red-300 border border-red-500/30',
  orange:  'bg-[#EF4444]/15 text-red-300 border border-[#EF4444]/25',
  pink:    'bg-white/6 text-gray-400 border border-white/10',
  outline: 'border border-white/20 text-slate-300',
}

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
}

export function Badge({ children, variant = 'default', size = 'md', className, style }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', variants[variant], sizes[size], className)} style={style}>
      {children}
    </span>
  )
}
