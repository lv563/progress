'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { FolderLock, Search, Plus, File, FileText, Key, Star, StarOff, Trash2, Eye, EyeOff, Lock } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useVaultStore } from '@/stores/vault.store'
import { cn } from '@/lib/utils/cn'
import type { VaultItemType } from '@/types'

const TYPE_ICON: Record<VaultItemType, typeof File> = {
  document:   File,
  note:       FileText,
  credential: Key,
  link:       File,
  image:      File,
}


export default function VaultPage() {
  const { folders, items, toggleStar, deleteItem, searchItems, getFolderItems, addItem } = useVaultStore()
  const [query, setQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [noteModal, setNoteModal] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [newItem, setNewItem] = useState({ title: '', type: 'note' as VaultItemType, content: '', folderId: '' })

  const displayItems = query
    ? searchItems(query)
    : selectedFolder
    ? getFolderItems(selectedFolder)
    : items

  const noteItem = items.find(i => i.id === noteModal)

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FolderLock size={24} className="text-amber-400" /> Vault Personal
        </h1>
        <Button onClick={() => setAddModal(true)} variant="glow" size="sm">
          <Plus size={14} /> Agregar
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar documentos, notas, credenciales..."
            className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-slate-500 pl-9 pr-3 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Folder sidebar */}
        <motion.div variants={fadeUp} className="lg:col-span-1">
          <GlassCard className="p-4" animate={false}>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Carpetas</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolder(null)}
                className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all', !selectedFolder ? 'bg-violet-500/15 text-violet-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200')}
              >
                <FolderLock size={14} />
                <span>Todo</span>
                <span className="ml-auto text-xs text-slate-600">{items.length}</span>
              </button>
              {folders.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolder(f.id === selectedFolder ? null : f.id)}
                  className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all', selectedFolder === f.id ? 'text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200')}
                  style={selectedFolder === f.id ? { background: `${f.color}15` } : undefined}
                >
                  <span>{f.icon}</span>
                  <span>{f.name}</span>
                  <span className="ml-auto text-xs text-slate-600">{getFolderItems(f.id).length}</span>
                </button>
              ))}
            </div>

            {/* Starred */}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Favoritos</h3>
              {items.filter(i => i.starred).map(i => (
                <button key={i.id} onClick={() => setNoteModal(i.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-all text-left">
                  <Star size={10} className="text-amber-400 shrink-0" />
                  <span className="truncate">{i.title}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Items grid */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {displayItems.map(item => {
                const Icon = TYPE_ICON[item.type]
                const isRevealed = revealed[item.id]

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <GlassCard
                      className="p-4 cursor-pointer"
                      hoverable
                      animate={false}
                      onClick={() => item.type === 'note' && setNoteModal(item.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                          item.type === 'document' ? 'bg-violet-500/20' :
                          item.type === 'credential' ? 'bg-amber-500/20' :
                          item.type === 'note' ? 'bg-cyan-500/20' : 'bg-slate-500/20'
                        )}>
                          {item.encrypted ? <Lock size={16} className="text-amber-400" /> : <Icon size={16} className="text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                          {item.type === 'credential' && item.username && (
                            <p className="text-xs text-slate-500 mt-0.5">{item.username}</p>
                          )}
                          {item.type === 'note' && item.content && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.content}</p>
                          )}
                          <div className="flex items-center gap-1 flex-wrap mt-1.5">
                            {item.tags.slice(0, 2).map(t => (
                              <Badge key={t} variant="outline" size="sm">#{t}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                        <span className="text-[10px] text-slate-600">
                          {new Date(item.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          {item.encrypted && (
                            <button
                              onClick={e => { e.stopPropagation(); setRevealed(r => ({ ...r, [item.id]: !r[item.id] })) }}
                              className="p-1 text-slate-600 hover:text-amber-400 transition-colors"
                            >
                              {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); toggleStar(item.id) }}
                            className={cn('p-1 transition-colors', item.starred ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400')}
                          >
                            {item.starred ? <Star size={12} /> : <StarOff size={12} />}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); deleteItem(item.id) }}
                            className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {displayItems.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              <FolderLock size={32} className="mx-auto mb-2 opacity-40" />
              <p>{query ? `Sin resultados para "${query}"` : 'Esta carpeta está vacía'}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Note viewer */}
      <Modal open={!!noteModal} onClose={() => setNoteModal(null)} title={noteItem?.title} size="lg">
        <div className="min-h-32">
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {noteItem?.content ?? 'Sin contenido'}
          </p>
        </div>
      </Modal>

      {/* Add item Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Agregar al Vault">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Tipo</label>
            <div className="flex gap-2">
              {(['note', 'document', 'credential'] as VaultItemType[]).map(t => (
                <button key={t} onClick={() => setNewItem(i => ({ ...i, type: t }))}
                  className={cn('px-3 py-1 rounded-lg text-xs capitalize transition-all', newItem.type === t ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50' : 'glass text-slate-400')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Input label="Título" value={newItem.title} onChange={e => setNewItem(i => ({ ...i, title: e.target.value }))} placeholder="Nombre del elemento..." />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Carpeta</label>
            <select value={newItem.folderId} onChange={e => setNewItem(i => ({ ...i, folderId: e.target.value }))} className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none">
              <option value="">Sin carpeta</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
            </select>
          </div>
          {(newItem.type === 'note') && (
            <div>
              <label className="text-sm text-slate-400 font-medium block mb-1.5">Contenido</label>
              <textarea value={newItem.content} onChange={e => setNewItem(i => ({ ...i, content: e.target.value }))} rows={4} className="w-full rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-slate-600 px-3 py-2.5 focus:outline-none focus:border-violet-500/50 resize-none" placeholder="Escribe tu nota..." />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={() => {
              if (!newItem.title) return
              addItem({ ...newItem, folderId: newItem.folderId || undefined, tags: [], encrypted: newItem.type === 'credential', starred: false })
              setAddModal(false)
              setNewItem({ title: '', type: 'note', content: '', folderId: '' })
            }}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
