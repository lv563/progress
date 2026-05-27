import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'
import type { VaultItem, VaultFolder } from '@/types'

const DEMO_FOLDERS: VaultFolder[] = [
  { id: 'f1', name: 'Documentos',   icon: '📄', color: '#7C3AED', createdAt: new Date().toISOString() },
  { id: 'f2', name: 'CV / Trabajo', icon: '💼', color: '#10B981', createdAt: new Date().toISOString() },
  { id: 'f3', name: 'Cuentas',      icon: '🔑', color: '#F59E0B', createdAt: new Date().toISOString() },
  { id: 'f4', name: 'Notas',        icon: '📝', color: '#06B6D4', createdAt: new Date().toISOString() },
  { id: 'f5', name: 'Fe',           icon: '🙏', color: '#EC4899', createdAt: new Date().toISOString() },
]

const DEMO_ITEMS: VaultItem[] = [
  { id: 'v1', title: 'Cédula de Identidad',         type: 'document',   folderId: 'f1', tags: ['importante', 'personal'], encrypted: true,  starred: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v2', title: 'Pasaporte',                   type: 'document',   folderId: 'f1', tags: ['importante', 'viaje'],    encrypted: true,  starred: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v3', title: 'CV Senior Developer v3',      type: 'document',   folderId: 'f2', tags: ['trabajo', 'cv'],          encrypted: false, starred: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v4', title: 'Gmail Personal',              type: 'credential', folderId: 'f3', tags: ['cuenta', 'google'],       encrypted: true,  starred: false, username: 'luis@gmail.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v5', title: 'GitHub',                      type: 'credential', folderId: 'f3', tags: ['dev', 'código'],          encrypted: true,  starred: false, username: 'luisvargas',    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v6', title: 'Ideas para Kingdom OS',       type: 'note',       folderId: 'f4', tags: ['proyecto', 'ideas'],      encrypted: false, starred: false, content: '# Ideas\n\n- Dashboard gamificado\n- Modo monk', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v7', title: 'Reflexión sobre disciplina',  type: 'note',       folderId: 'f5', tags: ['fe', 'crecimiento'],      encrypted: false, starred: false, content: 'La disciplina es el puente entre las metas y los logros...', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

interface VaultStore {
  folders: VaultFolder[]
  items: VaultItem[]
  addFolder: (folder: Omit<VaultFolder, 'id' | 'createdAt'>) => void
  deleteFolder: (id: string) => void
  addItem: (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateItem: (id: string, updates: Partial<VaultItem>) => void
  deleteItem: (id: string) => void
  toggleStar: (id: string) => void
  searchItems: (query: string) => VaultItem[]
  getFolderItems: (folderId: string) => VaultItem[]
  _reset: () => void
}

export const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      folders: DEMO_FOLDERS,
      items: DEMO_ITEMS,
      _reset: () => set({ folders: DEMO_FOLDERS, items: DEMO_ITEMS }),

      addFolder: (folder) => set(s => ({
        folders: [...s.folders, { ...folder, id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString() }]
      })),

      deleteFolder: (id) => set(s => ({
        folders: s.folders.filter(f => f.id !== id),
        items: s.items.filter(i => i.folderId !== id),
      })),

      addItem: (item) => set(s => ({
        items: [...s.items, { ...item, id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
      })),

      updateItem: (id, updates) => set(s => ({
        items: s.items.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i)
      })),

      deleteItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),

      toggleStar: (id) => set(s => ({
        items: s.items.map(i => i.id === id ? { ...i, starred: !i.starred } : i)
      })),

      searchItems: (query) => {
        const q = query.toLowerCase()
        return get().items.filter(i =>
          i.title.toLowerCase().includes(q) ||
          i.tags.some(t => t.toLowerCase().includes(q)) ||
          i.content?.toLowerCase().includes(q)
        )
      },

      getFolderItems: (folderId) => get().items.filter(i => i.folderId === folderId),
    }),
    { name: 'kingdom-vault', storage: userStorage }
  )
)
