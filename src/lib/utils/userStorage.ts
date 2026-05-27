import { createJSONStorage } from 'zustand/middleware'

/** Module-level user ID. Set explicitly at login/logout so storage writes are always deterministic. */
let currentUserId: string | null = null

// Seed from localStorage on first module load so page refreshes work without explicit login.
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('kingdom-app')
    currentUserId = JSON.parse(raw ?? '{}')?.state?.user?.id ?? null
  } catch {}
}

export const setCurrentUserId = (id: string | null): void => {
  currentUserId = id
}

const rawUserStorage = {
  getItem: (name: string): string | null => {
    if (!currentUserId) return null
    return localStorage.getItem(`${currentUserId}:${name}`)
  },
  setItem: (name: string, value: string): void => {
    if (!currentUserId) return
    localStorage.setItem(`${currentUserId}:${name}`, value)
  },
  removeItem: (name: string): void => {
    if (!currentUserId) return
    localStorage.removeItem(`${currentUserId}:${name}`)
  },
}

export const userStorage = createJSONStorage(() => rawUserStorage)

export const emailToId = (email: string): string => {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i)
    hash = hash & hash
  }
  return `u${Math.abs(hash).toString(36)}`
}
