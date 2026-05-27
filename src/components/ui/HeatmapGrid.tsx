'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { eachDayOfInterval, subDays, format, getDay, startOfWeek } from 'date-fns'
import { cn } from '@/lib/utils/cn'

interface HeatmapGridProps {
  data: Record<string, number>
  weeks?: number
  className?: string
  maxValue?: number
}

export function HeatmapGrid({ data, weeks = 26, className, maxValue = 1 }: HeatmapGridProps) {
  const days = useMemo(() => {
    const end = new Date()
    const start = subDays(end, weeks * 7 - 1)
    return eachDayOfInterval({ start, end })
  }, [weeks])

  const getIntensity = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd')
    const val = data[key] ?? 0
    if (val === 0) return 0
    const pct = Math.min(val / maxValue, 1)
    if (pct < 0.25) return 1
    if (pct < 0.5) return 2
    if (pct < 0.75) return 3
    return 4
  }

  // Pad first week
  const firstDow = getDay(days[0])
  const paddedDays: (Date | null)[] = [
    ...Array(firstDow).fill(null),
    ...days,
  ]

  const cols: (Date | null)[][] = []
  for (let i = 0; i < paddedDays.length; i += 7) {
    cols.push(paddedDays.slice(i, i + 7))
  }

  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pt-5 mr-1">
          {dayLabels.map((d, i) => (
            <div key={i} className="h-3 flex items-center">
              {(i % 2 === 1) && <span className="text-[9px] text-slate-600 w-6">{d}</span>}
              {(i % 2 !== 1) && <span className="w-6" />}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-1">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {/* Month label */}
              <div className="h-4">
                {col[0] && getDay(col[0]) === 0 && format(col[0], 'd') === '1' && (
                  <span className="text-[9px] text-slate-600">{format(col[0], 'MMM')}</span>
                )}
              </div>
              {col.map((day, di) => (
                <motion.div
                  key={di}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: ci * 0.01, duration: 0.2 }}
                  className={cn(
                    'w-3 h-3 rounded-sm',
                    day ? `heatmap-${getIntensity(day)}` : 'opacity-0'
                  )}
                  title={day ? `${format(day, 'dd/MM')}: ${data[format(day, 'yyyy-MM-dd')] ?? 0}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
