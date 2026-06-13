'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/app.store'
import { useSyncStore } from '@/stores/sync.store'
import { pullFromCloud, pushToCloud } from '@/lib/utils/cloudSync'
import { rehydrateAllStores } from '@/lib/utils/rehydrateStores'

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const user        = useAppStore(s => s.user)
  const { setStatus, setLastSync } = useSyncStore()
  const syncedRef   = useRef(false)

  useEffect(() => {
    if (!user?.id || syncedRef.current) return
    syncedRef.current = true

    const sync = async () => {
      setStatus('syncing')
      try {
        // 1. Pull from cloud — if there's newer data, write to localStorage and rehydrate
        const hasNewData = await pullFromCloud(user.id)
        if (hasNewData) rehydrateAllStores()

        // 2. Push current local data to cloud (ensures cloud is up to date)
        await pushToCloud(user.id)

        setLastSync(new Date().toISOString())
      } catch {
        setStatus('error')
      }
    }

    sync()

    // Re-push when tab becomes visible again (user switched devices)
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        setStatus('syncing')
        pullFromCloud(user.id).then(hasNew => {
          if (hasNew) rehydrateAllStores()
          return pushToCloud(user.id)
        }).then(() => setLastSync(new Date().toISOString()))
          .catch(() => setStatus('error'))
      }
    }

    // Push immediately before tab closes
    const onBeforeUnload = () => {
      if (user?.id) pushToCloud(user.id)
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [user?.id]) // eslint-disable-line

  return <>{children}</>
}
