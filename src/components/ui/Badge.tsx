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
  violet:  'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  cyan:    'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  amber:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  green:   'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  red:     'bg-red-500/20 text-red-300 border border-red-500/30',
  orange:  'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  pink:    'bg-pink-500/20 text-pink-300 border border-pink-500/30',
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
