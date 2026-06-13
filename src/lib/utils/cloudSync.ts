// Cloud sync utility — client side only

const STORE_KEYS = [
  'kingdom-app', 'kingdom-notes', 'kingdom-tasks', 'kingdom-habits',
  'kingdom-finance', 'kingdom-ministry', 'kingdom-pomodoro', 'kingdom-routine',
  'kingdom-physical', 'kingdom-vault', 'kingdom-detox', 'kingdom-dailylog',
  'kingdom-goals',
]

const META_KEY = 'kingdom-sync-meta'

function getSyncMeta(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') }
  catch { return {} }
}

function setSyncMeta(key: string, ts: string) {
  const meta = getSyncMeta()
  meta[key] = ts
  localStorage.setItem(META_KEY, JSON.stringify(meta))
}

/** Read all kingdom store values for a user from localStorage */
export function readLocalStores(userId: string): { key: string; value: string }[] {
  return STORE_KEYS
    .map(k => ({ key: k, value: localStorage.getItem(`${userId}:${k}`) ?? '' }))
    .filter(e => e.value !== '')
}

/** Push all local stores to Supabase */
export async function pushToCloud(userId: string): Promise<boolean> {
  const entries = readLocalStores(userId)
  if (!entries.length) return true

  try {
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, entries }),
    })
    if (res.ok) {
      const now = new Date().toISOString()
      entries.forEach(e => setSyncMeta(e.key, now))
    }
    return res.ok
  } catch {
    return false
  }
}

/** Pull stores from Supabase and write newer ones to localStorage.
 *  Returns true if any store was updated (caller should rehydrate). */
export async function pullFromCloud(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/pull?userId=${encodeURIComponent(userId)}`)
    if (!res.ok) return false

    const { entries } = await res.json() as {
      entries: { key: string; value: string; updatedAt: string }[]
    }

    const meta = getSyncMeta()
    let hasNew = false

    for (const entry of entries) {
      if (!entry.value) continue
      const localTs = meta[entry.key]
      const cloudTs = entry.updatedAt

      // Use cloud data if: no local data OR cloud is strictly newer
      const localMissing = !localStorage.getItem(`${userId}:${entry.key}`)
      const cloudNewer   = !localTs || new Date(cloudTs) > new Date(localTs)

      if (localMissing || cloudNewer) {
        localStorage.setItem(`${userId}:${entry.key}`, entry.value)
        setSyncMeta(entry.key, cloudTs)
        hasNew = true
      }
    }

    return hasNew
  } catch {
    return false
  }
}

// ── Debounced auto-push ───────────────────────────────────────────────────────

let pushTimer: ReturnType<typeof setTimeout> | null = null
let pendingUserId: string | null = null

export function schedulePush(userId: string, delayMs = 4000) {
  pendingUserId = userId
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    if (pendingUserId) pushToCloud(pendingUserId)
  }, delayMs)
}
