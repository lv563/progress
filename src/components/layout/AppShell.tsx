'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { useAppStore } from '@/stores/app.store'
import { useHabitsStore } from '@/stores/habits.store'
import { usePomodoroStore } from '@/stores/pomodoro.store'
import { useTasksStore } from '@/stores/tasks.store'
import { usePhysicalStore } from '@/stores/physical.store'
import { useDailyLogStore } from '@/stores/dailyLog.store'
import { XPToast } from '@/domains/gamification/components/XPToast'
import { LevelUpModal } from '@/domains/gamification/components/LevelUpModal'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarOpen, setCommandPaletteOpen, user } = useAppStore()
  const { habits, getTodayLogs } = useHabitsStore()
  const { getTodaySessions } = usePomodoroStore()
  const { tasks } = useTasksStore()
  const { waterToday, getTodayMacros, getWaterTarget, resetDaily } = usePhysicalStore()
  const { saveLog, lastResetDate, setLastResetDate } = useDailyLogStore()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  // Daily reset: runs once per day on app load
  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    if (lastResetDate && lastResetDate !== today) {
      // Save yesterday's performance log before resetting
      const todayLogs = getTodayLogs()
      const completedHabits = habits.filter(h => todayLogs[h.id]?.completed).length
      const sessions = getTodaySessions()
      const completedTasks = tasks.filter(t =>
        t.status === 'done' && t.completedAt?.startsWith(lastResetDate)
      ).length
      const score = Math.round(
        (habits.length > 0 ? (completedHabits / habits.length) * 30 : 0) +
        (Math.min(sessions.length, 4) / 4) * 25 +
        (Math.min(waterToday, getWaterTarget()) / getWaterTarget()) * 20 +
        0 +  // meals metric removed
        (completedTasks > 0 ? 10 : 0)
      )
      saveLog({
        date: lastResetDate,
        habitsCompleted: completedHabits,
        habitTotal: habits.length,
        pomodoroSessions: sessions.length,
        focusMinutes: sessions.reduce((a, s) => a + s.duration, 0),
        tasksCompleted: completedTasks,
        waterGlasses: waterToday,
        mealsEaten: getTodayMacros().calories > 0 ? 3 : 0,
        mealsTarget: 3,
        gymDone: false,
        score,
      })
      resetDaily()
    }
    setLastResetDate(today)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandPaletteOpen])

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Sidebar />
      <TopBar />

      <motion.main
        animate={{ marginLeft: isMobile ? 0 : (sidebarOpen ? 240 : 64) }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="pt-16 pb-20 md:pb-0 min-h-screen"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
          className="p-4 md:p-6 max-w-[1600px] mx-auto"
        >
          {children}
        </motion.div>
      </motion.main>

      <BottomNav />
      <XPToast />
      <LevelUpModal />
    </div>
  )
}
