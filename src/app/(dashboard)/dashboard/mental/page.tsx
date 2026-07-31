'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { BookOpen, Plus, Trash2, Check, Play, Flag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useMentalStore, type ItemStatus, type Book, type StudyTopic } from '@/stores/mental.store'
import { cn } from '@/lib/utils/cn'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Tab = 'libros' | 'temas'

const STATUS_LABELS: Record<ItemStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Leyendo',    color: '#0891B2', bg: 'rgba(8,145,178,0.08)'  },
  upcoming:  { label: 'Próximo',    color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  completed: { label: 'Completado', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
}

const BOOK_EMOJIS = ['📚', '📖', '📕', '📗', '📘', '📙', '🔖', '✍️', '🧠', '💡']
const TOPIC_EMOJIS = ['🧠', '💻', '🔬', '🎯', '🎨', '📐', '🌍', '⚡', '🏛️', '🎵']

function StatusBadge({ status }: { status: ItemStatus }) {
  const s = STATUS_LABELS[status]
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

export default function MentalPage() {
  const {
    books, topics,
    addBook, updateBook, deleteBook, startBook, finishBook,
    addTopic, deleteTopic, startTopic, finishTopic,
  } = useMentalStore()

  const [tab, setTab] = useState<Tab>('libros')
  const [bookModal, setBookModal] = useState(false)
  const [topicModal, setTopicModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ItemStatus | 'all'>('all')

  const [newBook, setNewBook] = useState({ title: '', author: '', emoji: '📚', status: 'upcoming' as ItemStatus })
  const [newTopic, setNewTopic] = useState({ name: '', description: '', emoji: '🧠', status: 'upcoming' as ItemStatus })

  const handleAddBook = () => {
    if (!newBook.title.trim()) return
    addBook({ title: newBook.title.trim(), author: newBook.author.trim() || undefined, emoji: newBook.emoji, status: newBook.status, startDate: newBook.status === 'active' ? new Date().toISOString().slice(0, 10) : undefined })
    setBookModal(false)
    setNewBook({ title: '', author: '', emoji: '📚', status: 'upcoming' })
  }

  const handleAddTopic = () => {
    if (!newTopic.name.trim()) return
    addTopic({ name: newTopic.name.trim(), description: newTopic.description.trim() || undefined, emoji: newTopic.emoji, status: newTopic.status, startDate: newTopic.status === 'active' ? new Date().toISOString().slice(0, 10) : undefined })
    setTopicModal(false)
    setNewTopic({ name: '', description: '', emoji: '🧠', status: 'upcoming' })
  }

  const filteredBooks = filterStatus === 'all' ? books : books.filter(b => b.status === filterStatus)
  const filteredTopics = filterStatus === 'all' ? topics : topics.filter(t => t.status === filterStatus)

  const bookStats = {
    active:    books.filter(b => b.status === 'active').length,
    upcoming:  books.filter(b => b.status === 'upcoming').length,
    completed: books.filter(b => b.status === 'completed').length,
  }
  const topicStats = {
    active:    topics.filter(t => t.status === 'active').length,
    upcoming:  topics.filter(t => t.status === 'upcoming').length,
    completed: topics.filter(t => t.status === 'completed').length,
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🧠</span> Mental
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {bookStats.active} leyendo · {bookStats.completed} libros completados
          </p>
        </div>
        <Button onClick={() => tab === 'libros' ? setBookModal(true) : setTopicModal(true)} variant="glow" size="sm">
          <Plus size={14} /> {tab === 'libros' ? 'Libro' : 'Tema'}
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 w-fit">
        {([['libros', '📚 Libros'], ['temas', '🎯 Temas']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); setFilterStatus('all') }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            {label}
          </button>
        ))}
      </motion.div>

      {/* Status filter */}
      <motion.div variants={fadeUp} className="flex gap-2 flex-wrap">
        {([['all', 'Todos'], ['active', 'Leyendo/Activos'], ['upcoming', 'Próximos'], ['completed', 'Completados']] as [ItemStatus | 'all', string][]).map(([s, label]) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              filterStatus === s ? 'border-transparent' : 'border-gray-200 text-gray-500 hover:text-gray-700 bg-gray-50'
            )}
            style={filterStatus === s ? {
              background: s === 'all' ? '#F3F4F6' : STATUS_LABELS[s as ItemStatus].bg,
              color: s === 'all' ? '#374151' : STATUS_LABELS[s as ItemStatus].color,
              borderColor: s === 'all' ? '#E5E7EB' : STATUS_LABELS[s as ItemStatus].color + '40',
            } : undefined}
          >
            {label}
            {s !== 'all' && (
              <span className="ml-1.5 text-[9px] opacity-70">
                {tab === 'libros' ? bookStats[s as ItemStatus] : topicStats[s as ItemStatus]}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ LIBROS ══ */}
        {tab === 'libros' && (
          <motion.div key="books" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-14">
                <span className="text-4xl block mb-2">📚</span>
                <p className="text-gray-500 text-sm mb-3">
                  {filterStatus === 'all' ? 'Sin libros aún' : `Sin libros ${STATUS_LABELS[filterStatus as ItemStatus]?.label.toLowerCase()}`}
                </p>
                <Button variant="glow" size="sm" onClick={() => setBookModal(true)}><Plus size={14} /> Agregar libro</Button>
              </div>
            ) : filteredBooks.map(book => (
              <motion.div key={book.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'p-4 rounded-2xl border transition-all group',
                  book.status === 'active' ? 'border-cyan-200 bg-cyan-50' :
                  book.status === 'completed' ? 'border-emerald-100 bg-gray-50' :
                  'border-gray-100 bg-gray-50'
                )}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{book.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn('text-sm font-bold', book.status === 'completed' ? 'text-gray-400' : 'text-gray-900')}>
                          {book.title}
                        </p>
                        {book.author && <p className="text-xs text-gray-400 mt-0.5">{book.author}</p>}
                      </div>
                      <StatusBadge status={book.status} />
                    </div>
                    {(book.startDate || book.endDate) && (
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {book.startDate && `Inicio: ${format(new Date(book.startDate), "d MMM yyyy", { locale: es })}`}
                        {book.endDate && ` · Fin: ${format(new Date(book.endDate), "d MMM yyyy", { locale: es })}`}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2.5">
                      {book.status === 'upcoming' && (
                        <button onClick={() => startBook(book.id)}
                          className="flex items-center gap-1 text-[10px] text-cyan-600 hover:text-cyan-700 transition-colors">
                          <Play size={10} /> Empezar a leer
                        </button>
                      )}
                      {book.status === 'active' && (
                        <button onClick={() => finishBook(book.id)}
                          className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 transition-colors">
                          <Flag size={10} /> Marcar terminado
                        </button>
                      )}
                      <button onClick={() => deleteBook(book.id)}
                        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-auto">
                        <Trash2 size={10} /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ══ TEMAS ══ */}
        {tab === 'temas' && (
          <motion.div key="topics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
            {filteredTopics.length === 0 ? (
              <div className="text-center py-14">
                <span className="text-4xl block mb-2">🎯</span>
                <p className="text-gray-500 text-sm mb-3">
                  {filterStatus === 'all' ? 'Sin temas de estudio' : `Sin temas ${STATUS_LABELS[filterStatus as ItemStatus]?.label.toLowerCase()}`}
                </p>
                <Button variant="glow" size="sm" onClick={() => setTopicModal(true)}><Plus size={14} /> Agregar tema</Button>
              </div>
            ) : filteredTopics.map(topic => (
              <motion.div key={topic.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'p-4 rounded-2xl border transition-all group',
                  topic.status === 'active' ? 'border-violet-200 bg-violet-50' :
                  topic.status === 'completed' ? 'border-emerald-100 bg-gray-50' :
                  'border-gray-100 bg-gray-50'
                )}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{topic.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn('text-sm font-bold', topic.status === 'completed' ? 'text-gray-400' : 'text-gray-900')}>
                          {topic.name}
                        </p>
                        {topic.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{topic.description}</p>}
                      </div>
                      <StatusBadge status={topic.status} />
                    </div>
                    {(topic.startDate || topic.endDate) && (
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {topic.startDate && `Inicio: ${format(new Date(topic.startDate), "d MMM yyyy", { locale: es })}`}
                        {topic.endDate && ` · Fin: ${format(new Date(topic.endDate), "d MMM yyyy", { locale: es })}`}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2.5">
                      {topic.status === 'upcoming' && (
                        <button onClick={() => startTopic(topic.id)}
                          className="flex items-center gap-1 text-[10px] text-violet-600 hover:text-violet-700 transition-colors">
                          <Play size={10} /> Empezar
                        </button>
                      )}
                      {topic.status === 'active' && (
                        <button onClick={() => finishTopic(topic.id)}
                          className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 transition-colors">
                          <Flag size={10} /> Marcar completado
                        </button>
                      )}
                      <button onClick={() => deleteTopic(topic.id)}
                        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-auto">
                        <Trash2 size={10} /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Book Modal */}
      <Modal open={bookModal} onClose={() => setBookModal(false)} title="Agregar Libro">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {BOOK_EMOJIS.map(e => (
                <button key={e} onClick={() => setNewBook(b => ({ ...b, emoji: e }))}
                  className={cn('w-9 h-9 rounded-lg text-xl transition-all', newBook.emoji === e ? 'bg-cyan-100 ring-1 ring-cyan-300 scale-110' : 'bg-gray-100 hover:bg-gray-200')}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Input label="Título del libro" placeholder="Atomic Habits, El Alquimista..."
            value={newBook.title} onChange={e => setNewBook(b => ({ ...b, title: e.target.value }))} />
          <Input label="Autor (opcional)" placeholder="James Clear..."
            value={newBook.author} onChange={e => setNewBook(b => ({ ...b, author: e.target.value }))} />
          <div>
            <label className="text-sm text-gray-700 font-medium block mb-2">Estado inicial</label>
            <div className="flex gap-2">
              {(['upcoming', 'active'] as ItemStatus[]).map(s => (
                <button key={s} onClick={() => setNewBook(b => ({ ...b, status: s }))}
                  className={cn('flex-1 py-2 rounded-xl text-xs font-medium transition-all border', newBook.status === s ? '' : 'border-gray-200 text-gray-500 bg-gray-50')}
                  style={newBook.status === s ? { background: STATUS_LABELS[s].bg, borderColor: STATUS_LABELS[s].color + '50', color: STATUS_LABELS[s].color } : undefined}>
                  {STATUS_LABELS[s].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setBookModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newBook.title.trim()} onClick={handleAddBook}>
              <Plus size={14} /> Agregar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Topic Modal */}
      <Modal open={topicModal} onClose={() => setTopicModal(false)} title="Agregar Tema de Estudio">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {TOPIC_EMOJIS.map(e => (
                <button key={e} onClick={() => setNewTopic(t => ({ ...t, emoji: e }))}
                  className={cn('w-9 h-9 rounded-lg text-xl transition-all', newTopic.emoji === e ? 'bg-violet-100 ring-1 ring-violet-300 scale-110' : 'bg-gray-100 hover:bg-gray-200')}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Input label="Nombre del tema" placeholder="TypeScript, Finanzas personales, Hebreo..."
            value={newTopic.name} onChange={e => setNewTopic(t => ({ ...t, name: e.target.value }))} />
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Descripción (opcional)</label>
            <textarea value={newTopic.description} onChange={e => setNewTopic(t => ({ ...t, description: e.target.value }))}
              placeholder="Qué quiero aprender, por qué..."
              rows={2}
              className="w-full rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 px-3 py-2.5 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="text-sm text-gray-700 font-medium block mb-2">Estado inicial</label>
            <div className="flex gap-2">
              {(['upcoming', 'active'] as ItemStatus[]).map(s => (
                <button key={s} onClick={() => setNewTopic(t => ({ ...t, status: s }))}
                  className={cn('flex-1 py-2 rounded-xl text-xs font-medium transition-all border', newTopic.status === s ? '' : 'border-gray-200 text-gray-500 bg-gray-50')}
                  style={newTopic.status === s ? { background: STATUS_LABELS[s].bg, borderColor: STATUS_LABELS[s].color + '50', color: STATUS_LABELS[s].color } : undefined}>
                  {STATUS_LABELS[s].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setTopicModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newTopic.name.trim()} onClick={handleAddTopic}>
              <Plus size={14} /> Agregar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
