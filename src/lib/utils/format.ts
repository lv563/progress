import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Hoy'
  if (isYesterday(d)) return 'Ayer'
  return format(d, 'dd MMM yyyy')
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`
  return xp.toString()
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${kg.toFixed(0)} kg`
}

export function relativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function levelProgress(xp: number, currentLevel: number): number {
  const thresholds = [0, 500, 1500, 3500, 7000, 13000, 23000, 40000, 65000, 100000]
  const current = thresholds[currentLevel - 1] ?? 0
  const next = thresholds[currentLevel] ?? current + 10000
  return Math.min(((xp - current) / (next - current)) * 100, 100)
}

export function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: 'Iniciado', 2: 'Disciplinado', 3: 'Constante', 4: 'Comprometido',
    5: 'Dedicado', 6: 'Enfocado', 7: 'Decidido', 8: 'Persistente',
    9: 'Maestro', 10: 'Elite', 15: 'Campeón', 20: 'Leyenda',
  }
  if (level >= 20) return 'Kingdom Builder'
  return titles[level] ?? `Nivel ${level}`
}
