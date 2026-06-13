import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

interface SyncStore {
  status: SyncStatus
  lastSync: string | null
  setStatus: (s: SyncStatus) => void
  setLastSync: (ts: string) => void
}

export const useSyncStore = create<SyncStore>()((set) => ({
  status: 'idle',
  lastSync: null,
  setStatus: (status) => set({ status }),
  setLastSync: (lastSync) => set({ lastSync, status: 'synced' }),
}))
