'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { useAppStore } from '@/stores/app.store'
import { XPToast } from '@/domains/gamification/components/XPToast'
import { LevelUpModal } from '@/domains/gamification/components/LevelUpModal'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarOpen, setCommandPaletteOpen, user } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

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
        animate={{ marginLeft: sidebarOpen ? 240 : 64 }}
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
