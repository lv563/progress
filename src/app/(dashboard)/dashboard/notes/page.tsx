'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NotebookPen, Plus, Search, Pin, Trash2, X, Tag } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { useNotesStore } from '@/stores/notes.store'
import type { Note } from '@/stores/notes.store'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const NOTE_COLORS = [
  { label: 'Neutro',  value: '#1E1E2E' },
  { label: 'Violeta', value: '#2D1B4E' },
  { label: 'Verde',   value: '#0D2B1E' },
  { label: 'Azul',    value: '#0D1F3C' },
  { label: 'Ámbar',   value: '#2D1B00' },
  { label: 'Rojo',    value: '#2D0D0D' },
]

const NOTE_ACCENTS: Record<string, string> = {
  '#1E1E2E': '#7C3AED',
  '#2D1B4E': '#A78BFA',
  '#0D2B1E': '#10B981',
  '#0D1F3C': '#60A5FA',
  '#2D1B00': '#F59E0B',
  '#2D0D0D': '#EF4444',
}

function NoteItem({ note, active, onClick }: { note: Note; active: boolean; onClick: () => void }) {
  const accent = NOTE_ACCENTS[note.color] ?? '#7C3AED'
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all',
        active
          ? 'border-violet-500/40 bg-violet-500/10'
          : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white truncate leading-snug">
          {note.title || 'Sin título'}
        </p>
        {note.pinned && <Pin size={11} className="shrink-0 mt-0.5" style={{ color: accent }} />}
      </div>
      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-snug">
        {note.content || 'Nota vacía'}
      </p>
      <p className="text-[10px] text-slate-700 mt-2">
        {format(new Date(note.updatedAt), "d MMM, HH:mm", { locale: es })}
      </p>
    </motion.button>
  )
}

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote, togglePin, searchNotes } = useNotesStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [newTag, setNewTag] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  const displayed = query ? searchNotes(query) : [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const activeNote = notes.find(n => n.id === activeId)

  const handleNew = () => {
    const id = addNote({ title: '', content: '', tags: [], pinned: false, color: '#1E1E2E' })
    setActiveId(id)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const handleDelete = (id: string) => {
    deleteNote(id)
    if (activeId === id) setActiveId(displayed.find(n => n.id !== id)?.id ?? null)
  }

  // Auto-select first note on load
  useEffect(() => {
    if (!activeId && displayed.length > 0) setActiveId(displayed[0].id)
  }, [notes.length]) // eslint-disable-line

  const accent = activeNote ? (NOTE_ACCENTS[activeNote.color] ?? '#7C3AED') : '#7C3AED'

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden">
      {/* Sidebar — note list */}
      <div className={cn('flex flex-col gap-3 w-full md:w-72 shrink-0', activeNote ? 'hidden md:flex' : 'flex')}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <NotebookPen size={20} className="text-violet-400" /> Notas
          </h1>
          <Button variant="glow" size="sm" onClick={handleNew}>
            <Plus size={14} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar notas..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/40"
          />
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {displayed.length === 0 ? (
            <div className="text-center py-10">
              <NotebookPen size={28} className="mx-auto text-slate-700 mb-2" />
              <p className="text-sm text-slate-600">No hay notas</p>
              <button onClick={handleNew} className="text-xs text-violet-400 mt-1 hover:text-violet-300 transition-colors">
                Crear primera nota
              </button>
            </div>
          ) : (
            displayed.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                active={activeId === note.id}
                onClick={() => setActiveId(note.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <AnimatePresence mode="wait">
        {activeNote ? (
          <motion.div
            key={activeNote.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="flex-1 flex flex-col min-w-0 rounded-2xl border border-white/[0.08] overflow-hidden"
            style={{ background: activeNote.color }}
          >
            {/* Editor toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              {/* Back on mobile */}
              <button
                onClick={() => setActiveId(null)}
                className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 hover:text-white transition-colors mr-1"
              >
                <X size={14} />
              </button>

              {/* Color picker */}
              <div className="flex gap-1.5">
                {NOTE_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => updateNote(activeNote.id, { color: c.value })}
                    className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                    style={{
                      background: NOTE_ACCENTS[c.value],
                      outline: activeNote.color === c.value ? `2px solid ${NOTE_ACCENTS[c.value]}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>

              <div className="flex-1" />

              <button
                onClick={() => togglePin(activeNote.id)}
                className={cn('w-7 h-7 flex items-center justify-center rounded-lg transition-all', activeNote.pinned ? 'bg-violet-500/30' : 'bg-white/[0.04] hover:bg-white/[0.08]')}
                title={activeNote.pinned ? 'Desanclar' : 'Anclar'}
              >
                <Pin size={13} style={{ color: activeNote.pinned ? accent : '#64748b' }} />
              </button>
              <button
                onClick={() => handleDelete(activeNote.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Title input */}
            <input
              ref={titleRef}
              value={activeNote.title}
              onChange={e => updateNote(activeNote.id, { title: e.target.value })}
              placeholder="Título de la nota"
              className="w-full bg-transparent px-5 pt-5 pb-2 text-2xl font-bold text-white placeholder:text-white/20 outline-none"
            />

            {/* Tags */}
            <div className="flex items-center gap-2 px-5 pb-2 flex-wrap">
              {activeNote.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer hover:opacity-70 transition-opacity"
                  style={{ background: `${accent}30`, color: accent }}
                  onClick={() => updateNote(activeNote.id, { tags: activeNote.tags.filter(t => t !== tag) })}
                >
                  #{tag} <X size={9} />
                </span>
              ))}
              <form onSubmit={e => {
                e.preventDefault()
                const t = newTag.trim().toLowerCase().replace(/\s+/g, '-')
                if (t && !activeNote.tags.includes(t)) {
                  updateNote(activeNote.id, { tags: [...activeNote.tags, t] })
                }
                setNewTag('')
              }}>
                <input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="+ etiqueta"
                  className="bg-transparent text-[11px] text-slate-500 placeholder:text-slate-700 outline-none w-20"
                />
              </form>
            </div>

            {/* Content textarea */}
            <textarea
              value={activeNote.content}
              onChange={e => updateNote(activeNote.id, { content: e.target.value })}
              placeholder="Escribe tu nota aquí..."
              className="flex-1 w-full bg-transparent px-5 py-2 text-sm text-slate-200 placeholder:text-white/20 outline-none resize-none leading-relaxed"
            />

            {/* Footer */}
            <div className="px-5 py-2 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[10px] text-slate-600">
                {activeNote.content.length} caracteres · {activeNote.content.split(/\s+/).filter(Boolean).length} palabras
              </span>
              <span className="text-[10px] text-slate-600">
                Guardado automáticamente
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden md:flex flex-1 items-center justify-center"
          >
            <div className="text-center">
              <NotebookPen size={40} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-600 text-sm">Selecciona una nota o crea una nueva</p>
              <Button variant="glow" size="sm" className="mt-4" onClick={handleNew}>
                <Plus size={14} /> Nueva nota
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
