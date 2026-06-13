import {
  LayoutDashboard, Target, Timer, CheckSquare, Calendar,
  Dumbbell, Church, FolderLock, BarChart3, Wallet, Ban, NotebookPen, Trophy
} from 'lucide-react'

export const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',    href: '/dashboard',           icon: LayoutDashboard, shortcut: 'G D' },
  { id: 'goals',      label: 'Metas',        href: '/dashboard/goals',     icon: Trophy,          shortcut: 'G G' },
  { id: 'habits',     label: 'Hábitos',      href: '/dashboard/habits',    icon: Target,          shortcut: 'G H' },
  { id: 'pomodoro',   label: 'Pomodoro',     href: '/dashboard/pomodoro',  icon: Timer,           shortcut: 'G P' },
  { id: 'tasks',      label: 'Tareas',       href: '/dashboard/tasks',     icon: CheckSquare,     shortcut: 'G T' },
  { id: 'notes',      label: 'Notas',        href: '/dashboard/notes',     icon: NotebookPen,     shortcut: 'G N' },
  { id: 'routine',    label: 'Rutina',       href: '/dashboard/routine',   icon: Calendar,        shortcut: 'G R' },
  { id: 'physical',   label: 'Físico',       href: '/dashboard/physical',  icon: Dumbbell,        shortcut: 'G F' },
  { id: 'detox',      label: 'Detox',        href: '/dashboard/detox',     icon: Ban,             shortcut: 'G X' },
  { id: 'ministry',   label: 'Ministerio',   href: '/dashboard/ministry',  icon: Church,          shortcut: 'G M' },
  { id: 'finance',    label: 'Finanzas',     href: '/dashboard/finance',   icon: Wallet,          shortcut: 'G $' },
  { id: 'vault',      label: 'Bóveda',       href: '/dashboard/vault',     icon: FolderLock,      shortcut: 'G V' },
  { id: 'analytics',  label: 'Análisis',     href: '/dashboard/analytics', icon: BarChart3,       shortcut: 'G A' },
] as const

export const BOTTOM_TABS = [
  { id: 'dashboard', label: 'Hoy',      href: '/dashboard',          icon: LayoutDashboard },
  { id: 'habits',    label: 'Hábitos',  href: '/dashboard/habits',   icon: Target },
  { id: 'pomodoro',  label: 'Focus',    href: '/dashboard/pomodoro', icon: Timer },
  { id: 'finance',   label: 'Finanzas', href: '/dashboard/finance',  icon: Wallet },
  { id: 'physical',  label: 'Gym',      href: '/dashboard/physical', icon: Dumbbell },
] as const
