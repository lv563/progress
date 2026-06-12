'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  NotebookPen, Plus, Search, Pin, Trash2, X,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Type, Palette, Quote, Code2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { useNotesStore } from '@/stores/notes.store'
import type { Note } from '@/stores/notes.store'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

const NOTE_COLORS = [
  { label: 'Oscuro', value: '#0E1318' },
  { label: 'Teal',   value: '#071A1A' },
  { label: 'Verde',  value: '#0D2B1E' },
  { label: 'Azul',   value: '#0D1F3C' },
  { label: 'Ámbar',  value: '#2D1B00' },
  { label: 'Rojo',   value: '#2D0D0D' },
]

const NOTE_ACCENTS: Record<string, string> = {
  '#0E1318': '#00D4B8',
  '#071A1A': '#06B6D4',
  '#0D2B1E': '#10B981',
  '#0D1F3C': '#60A5FA',
  '#2D1B00': '#F59E0B',
  '#2D0D0D': '#EF4444',
  // backward compat
  '#1E1E2E': '#00D4B8',
  '#2D1B4E': '#A78BFA',
}

const TEXT_COLORS = [
  '#F8FAFC', '#94A3B8', '#00D4B8', '#06B6D4',
  '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#8B5CF6', '#F97316',
]

const FONT_SIZES = [
  { label: 'S',  value: '1' },
  { label: 'M',  value: '3' },
  { label: 'L',  value: '5' },
  { label: 'XL', value: '7' },
]

/* ── Note list item ───────────────────────────────────────── */
function NoteItem({ note, active, onClick }: { note: Note; active: boolean; onClick: () => void }) {
  const accent = NOTE_ACCENTS[note.color] ?? '#00D4B8'
  const preview = stripHtml(note.content)
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all',
        active
          ? 'border-cyan-500/40 bg-cyan-500/[0.08]'
          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white truncate leading-snug">
          {note.title || 'Sin título'}
        </p>
        {note.pinned && <Pin size={11} className="shrink-0 mt-0.5" style={{ color: accent }} />}
      </div>
      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-snug">
        {preview || 'Nota vacía'}
      </p>
      {note.tags.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${accent}20`, color: accent }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-700 mt-1.5">
        {format(new Date(note.updatedAt), "d MMM, HH:mm", { locale: es })}
      </p>
    </motion.button>
  )
}

/* ── Toolbar button ───────────────────────────────────────── */
function TBtn({
  active, onClick, title, children, className,
}: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode; className?: string
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded-md text-xs transition-all',
        active
          ? 'bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/40'
          : 'text-slate-400 hover:text-white hover:bg-white/[0.08]',
        className
      )}
    >
      {children}
    </button>
  )
}

/* ── Main page ───────────────────────────────────────────── */
export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote, togglePin, searchNotes } = useNotesStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [newTag, setNewTag] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTextColor, setShowTextColor] = useState(false)
  const [showFontSize, setShowFontSize] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  // saveRef always holds the latest save function — no stale closures
  const saveRef = useRef<(html: string) => void>(() => {})

  const [fmt, setFmt] = useState({
    bold: false, italic: false, underline: false, strikethrough: false,
    justifyLeft: true, justifyCenter: false, justifyRight: false,
  })

  const displayed = query ? searchNotes(query) : [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const activeNote = notes.find(n => n.id === activeId)
  const accent = activeNote ? (NOTE_ACCENTS[activeNote.color] ?? '#00D4B8') : '#00D4B8'

  // Keep saveRef fresh every render so listeners never use stale state
  saveRef.current = (html: string) => {
    if (activeNote) updateNote(activeNote.id, { content: html })
  }

  // useLayoutEffect: runs synchronously after DOM commit so editorRef points to the NEW editor
  // (useEffect would run too late with AnimatePresence because the new element might not be mounted)
  useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor || !activeNote) return
    editor.innerHTML = activeNote.content || ''
  }, [activeId]) // eslint-disable-line

  // Attach native input listener — captures local `editor` so cleanup hits the right element
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const handler = () => saveRef.current(editor.innerHTML)
    editor.addEventListener('input', handler)
    return () => editor.removeEventListener('input', handler)
  }, [activeId]) // eslint-disable-line

  // Auto-select first note
  useEffect(() => {
    if (!activeId && displayed.length > 0) setActiveId(displayed[0].id)
  }, [notes.length]) // eslint-disable-line

  const updateFormatState = useCallback(() => {
    try {
      setFmt({
        bold:          document.queryCommandState('bold'),
        italic:        document.queryCommandState('italic'),
        underline:     document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
        justifyLeft:   document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight:  document.queryCommandState('justifyRight'),
      })
    } catch { /* ignore */ }
  }, [])

  const exec = useCallback((cmd: string, value?: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand(cmd, false, value ?? undefined)
    saveRef.current(editor.innerHTML)
    updateFormatState()
  }, [updateFormatState])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); exec('bold') }
      if (e.key === 'i') { e.preventDefault(); exec('italic') }
      if (e.key === 'u') { e.preventDefault(); exec('underline') }
    }
  }

  const handleNew = () => {
    const id = addNote({ title: '', content: '', tags: [], pinned: false, color: '#0E1318' })
    setActiveId(id)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const handleDelete = (id: string) => {
    deleteNote(id)
    if (activeId === id) setActiveId(displayed.find(n => n.id !== id)?.id ?? null)
  }

  const plain = activeNote ? stripHtml(activeNote.content) : ''
  const wordCount = plain.split(/\s+/).filter(Boolean).length
  const charCount = plain.length

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden">

      {/* ── Sidebar ── */}
      <div className={cn('flex flex-col gap-3 w-full md:w-72 shrink-0', activeNote ? 'hidden md:flex' : 'flex')}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <NotebookPen size={20} className="text-cyan-400" /> Notas
          </h1>
          <Button variant="glow" size="sm" onClick={handleNew}>
            <Plus size={14} />
          </Button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar notas..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/40"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {displayed.length === 0 ? (
            <div className="text-center py-10">
              <NotebookPen size={28} className="mx-auto text-slate-700 mb-2" />
              <p className="text-sm text-slate-600">No hay notas</p>
              <button onClick={handleNew} className="text-xs text-cyan-400 mt-1 hover:text-cyan-300 transition-colors">
                Crear primera nota
              </button>
            </div>
          ) : (
            displayed.map(note => (
              <NoteItem key={note.id} note={note} active={activeId === note.id} onClick={() => setActiveId(note.id)} />
            ))
          )}
        </div>

        <div className="text-[10px] text-slate-700 text-center">
          {notes.length} nota{notes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Editor ── */}
      <AnimatePresence>
        {activeNote ? (
          <motion.div
            key={activeNote.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="flex-1 flex flex-col min-w-0 rounded-2xl border border-white/[0.08] overflow-hidden"
            style={{ background: activeNote.color || '#0E1318' }}
          >
            {/* ── Top bar: back + colors + actions ── */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
              <button
                onClick={() => setActiveId(null)}
                className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>

              {/* Color dots */}
              <div className="flex gap-1.5 relative">
                {NOTE_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => updateNote(activeNote.id, { color: c.value })}
                    className="w-3.5 h-3.5 rounded-full transition-transform hover:scale-125"
                    style={{
                      background: NOTE_ACCENTS[c.value] ?? c.value,
                      outline: activeNote.color === c.value ? `2px solid ${NOTE_ACCENTS[c.value]}` : 'none',
                      outlineOffset: 2,
                    }}
                    title={c.label}
                  />
                ))}
              </div>

              <div className="flex-1" />

              <button
                onClick={() => togglePin(activeNote.id)}
                className={cn('w-7 h-7 flex items-center justify-center rounded-lg transition-all', activeNote.pinned ? 'bg-cyan-500/25 ring-1 ring-cyan-500/40' : 'bg-white/[0.04] hover:bg-white/[0.08]')}
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

            {/* ── Formatting toolbar ── */}
            <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/[0.05] flex-wrap">
              {/* Text style */}
              <TBtn active={fmt.bold}         onClick={() => exec('bold')}         title="Negrita (Ctrl+B)"><Bold size={13}/></TBtn>
              <TBtn active={fmt.italic}       onClick={() => exec('italic')}       title="Cursiva (Ctrl+I)"><Italic size={13}/></TBtn>
              <TBtn active={fmt.underline}    onClick={() => exec('underline')}    title="Subrayado (Ctrl+U)"><Underline size={13}/></TBtn>
              <TBtn active={fmt.strikethrough} onClick={() => exec('strikeThrough')} title="Tachado">
                <span className="text-[11px] font-medium line-through">S</span>
              </TBtn>

              <div className="w-px h-5 bg-white/[0.08] mx-1" />

              {/* Headings */}
              <TBtn onClick={() => exec('formatBlock', 'h1')} title="Título 1">
                <span className="text-[10px] font-black">H1</span>
              </TBtn>
              <TBtn onClick={() => exec('formatBlock', 'h2')} title="Título 2">
                <span className="text-[10px] font-bold">H2</span>
              </TBtn>
              <TBtn onClick={() => exec('formatBlock', 'h3')} title="Título 3">
                <span className="text-[10px] font-semibold">H3</span>
              </TBtn>
              <TBtn onClick={() => exec('formatBlock', 'p')} title="Párrafo">
                <span className="text-[10px]">¶</span>
              </TBtn>

              <div className="w-px h-5 bg-white/[0.08] mx-1" />

              {/* Alignment */}
              <TBtn active={fmt.justifyLeft}   onClick={() => exec('justifyLeft')}   title="Izquierda"><AlignLeft size={12}/></TBtn>
              <TBtn active={fmt.justifyCenter} onClick={() => exec('justifyCenter')} title="Centro"><AlignCenter size={12}/></TBtn>
              <TBtn active={fmt.justifyRight}  onClick={() => exec('justifyRight')}  title="Derecha"><AlignRight size={12}/></TBtn>

              <div className="w-px h-5 bg-white/[0.08] mx-1" />

              {/* Lists */}
              <TBtn onClick={() => exec('insertUnorderedList')} title="Lista con viñetas"><List size={13}/></TBtn>
              <TBtn onClick={() => exec('insertOrderedList')}   title="Lista numerada"><ListOrdered size={13}/></TBtn>
              <TBtn onClick={() => exec('formatBlock', 'blockquote')} title="Cita"><Quote size={13}/></TBtn>

              <div className="w-px h-5 bg-white/[0.08] mx-1" />

              {/* Font size */}
              <div className="relative">
                <TBtn onClick={() => { setShowFontSize(v => !v); setShowTextColor(false) }} title="Tamaño de fuente">
                  <Type size={13}/>
                </TBtn>
                {showFontSize && (
                  <div className="absolute top-full left-0 mt-1 bg-[#111820] border border-white/10 rounded-xl p-2 z-20 flex gap-1.5 shadow-xl">
                    {FONT_SIZES.map(s => (
                      <button
                        key={s.value}
                        onMouseDown={e => { e.preventDefault(); exec('fontSize', s.value); setShowFontSize(false) }}
                        className="w-8 h-8 rounded-lg text-xs font-semibold text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text color */}
              <div className="relative">
                <TBtn onClick={() => { setShowTextColor(v => !v); setShowFontSize(false) }} title="Color de texto">
                  <Palette size={13}/>
                </TBtn>
                {showTextColor && (
                  <div className="absolute top-full left-0 mt-1 bg-[#111820] border border-white/10 rounded-xl p-2.5 z-20 shadow-xl">
                    <div className="grid grid-cols-5 gap-1.5">
                      {TEXT_COLORS.map(color => (
                        <button
                          key={color}
                          onMouseDown={e => { e.preventDefault(); exec('foreColor', color); setShowTextColor(false) }}
                          className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white/40 transition-all hover:scale-110"
                          style={{ background: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <TBtn onClick={() => exec('formatBlock', 'pre')} title="Código">
                <Code2 size={13}/>
              </TBtn>
            </div>

            {/* ── Title ── */}
            <input
              ref={titleRef}
              value={activeNote.title}
              onChange={e => updateNote(activeNote.id, { title: e.target.value })}
              placeholder="Título de la nota"
              className="w-full bg-transparent px-5 pt-4 pb-1 text-2xl font-bold text-white placeholder:text-white/20 outline-none"
            />

            {/* ── Tags ── */}
            <div className="flex items-center gap-1.5 px-5 pb-2 flex-wrap">
              {activeNote.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer hover:opacity-70 transition-opacity"
                  style={{ background: `${accent}25`, color: accent }}
                  onClick={() => updateNote(activeNote.id, { tags: activeNote.tags.filter(t => t !== tag) })}
                >
                  #{tag} <X size={9} />
                </span>
              ))}
              <form onSubmit={e => {
                e.preventDefault()
                const t = newTag.trim().toLowerCase().replace(/\s+/g, '-')
                if (t && !activeNote.tags.includes(t)) updateNote(activeNote.id, { tags: [...activeNote.tags, t] })
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

            {/* ── Editor ── */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Escribe tu nota aquí..."
              onKeyDown={handleKeyDown}
              onKeyUp={updateFormatState}
              onMouseUp={updateFormatState}
              onSelect={updateFormatState}
              onClick={() => { setShowTextColor(false); setShowFontSize(false) }}
              className="notes-editor flex-1 w-full px-5 py-2 text-sm text-slate-200 outline-none leading-relaxed overflow-y-auto"
              style={{ minHeight: 0 }}
            />

            {/* ── Footer ── */}
            <div className="px-5 py-2 border-t border-white/[0.05] flex items-center justify-between">
              <span className="text-[10px] text-slate-700">
                {charCount} caracteres · {wordCount} palabras
              </span>
              <span className="text-[10px] text-slate-700">
                {format(new Date(activeNote.updatedAt), "d MMM, HH:mm", { locale: es })}
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
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <NotebookPen size={28} className="text-cyan-400" />
              </div>
              <p className="text-slate-500 text-sm">Selecciona una nota o crea una nueva</p>
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
