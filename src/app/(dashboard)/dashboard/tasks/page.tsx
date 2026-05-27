'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { CheckSquare, Plus, Folder, Kanban, List, Trash2, Calendar } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useTasksStore } from '@/stores/tasks.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import type { TaskStatus, TaskPriority } from '@/types'

const STATUS_COLS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',        label: 'Por hacer',   color: '#475569' },
  { id: 'in-progress', label: 'En progreso', color: '#7C3AED' },
  { id: 'review',      label: 'En revisión', color: '#F59E0B' },
  { id: 'done',        label: 'Completado',  color: '#10B981' },
]

const PRIORITY_BADGE: Record<TaskPriority, { label: string; variant: 'red' | 'orange' | 'cyan' | 'outline' }> = {
  p0: { label: 'Urgente', variant: 'red' },
  p1: { label: 'Alta',    variant: 'orange' },
  p2: { label: 'Media',   variant: 'cyan' },
  p3: { label: 'Baja',    variant: 'outline' },
}


export default function TasksPage() {
  const { tasks, projects, addTask, moveTask, deleteTask } = useTasksStore()
  const { addXP } = useAppStore()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [selectedProject, setSelectedProject] = useState<string | 'all'>('all')
  const [addModal, setAddModal] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', priority: 'p1' as TaskPriority, projectId: '', dueDate: '' })

  const filteredTasks = selectedProject === 'all'
    ? tasks
    : tasks.filter(t => t.projectId === selectedProject)

  const handleComplete = (id: string) => {
    moveTask(id, 'done')
    addXP(5, 'Tarea completada')
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <CheckSquare size={24} className="text-cyan-400" /> Tareas
        </h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button onClick={() => setView('kanban')} className={cn('p-1.5 rounded-md transition-all', view === 'kanban' ? 'bg-violet-500/30 text-violet-300' : 'text-slate-500 hover:text-slate-300')}>
              <Kanban size={14} />
            </button>
            <button onClick={() => setView('list')} className={cn('p-1.5 rounded-md transition-all', view === 'list' ? 'bg-violet-500/30 text-violet-300' : 'text-slate-500 hover:text-slate-300')}>
              <List size={14} />
            </button>
          </div>
          <Button onClick={() => setAddModal(true)} variant="glow" size="sm">
            <Plus size={14} /> Nueva tarea
          </Button>
        </div>
      </motion.div>

      {/* Project filter */}
      <motion.div variants={fadeUp} className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedProject('all')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', selectedProject === 'all' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'glass text-slate-400 hover:text-slate-200')}
        >
          Todos ({tasks.length})
        </button>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedProject(p.id)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', selectedProject === p.id ? 'text-white border' : 'glass text-slate-400 hover:text-slate-200')}
            style={selectedProject === p.id ? { background: `${p.color}20`, borderColor: `${p.color}40`, color: p.color } : undefined}
          >
            <span>{p.icon}</span> {p.name}
          </button>
        ))}
      </motion.div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id)
            return (
              <div key={col.id}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{col.label}</span>
                  <span className="ml-auto text-xs text-slate-600">{colTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  <AnimatePresence>
                    {colTasks.map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <GlassCard
                          className="p-3"
                          hoverable
                          animate={false}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn('text-sm font-medium leading-tight', task.status === 'done' ? 'text-slate-500 line-through' : 'text-white')}>
                              {task.title}
                            </p>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-slate-700 hover:text-red-400 transition-colors shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant={PRIORITY_BADGE[task.priority].variant} size="sm">
                              {PRIORITY_BADGE[task.priority].label}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                <Calendar size={8} />
                                {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                          {/* Quick move buttons */}
                          {task.status !== 'done' && (
                            <div className="flex gap-1 mt-2">
                              {task.status !== 'in-progress' && (
                                <button onClick={() => moveTask(task.id, 'in-progress')} className="text-[10px] text-slate-600 hover:text-violet-400 transition-colors">
                                  → Iniciar
                                </button>
                              )}
                              {task.status === 'in-progress' && (
                                <button onClick={() => handleComplete(task.id)} className="text-[10px] text-slate-600 hover:text-emerald-400 transition-colors">
                                  ✓ Completar
                                </button>
                              )}
                            </div>
                          )}
                        </GlassCard>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* List view */}
      {view === 'list' && (
        <motion.div variants={fadeUp} className="space-y-2">
          {filteredTasks.filter(t => t.status !== 'done').map(task => (
            <GlassCard key={task.id} className="p-3" hoverable animate={false}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleComplete(task.id)}
                  className="w-5 h-5 rounded-md border-2 border-slate-600 hover:border-emerald-400 hover:bg-emerald-400/10 transition-all shrink-0 flex items-center justify-center"
                >
                  {task.status === 'done' && <span className="text-emerald-400 text-xs">✓</span>}
                </button>
                <p className="flex-1 text-sm text-white">{task.title}</p>
                <Badge variant={PRIORITY_BADGE[task.priority].variant} size="sm">
                  {PRIORITY_BADGE[task.priority].label}
                </Badge>
                {task.dueDate && (
                  <span className="text-xs text-slate-500">
                    {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                <button onClick={() => deleteTask(task.id)} className="text-slate-700 hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </GlassCard>
          ))}
          {filteredTasks.filter(t => t.status !== 'done').length === 0 && (
            <div className="text-center py-12 text-slate-600">
              <CheckSquare size={32} className="mx-auto mb-2 opacity-40" />
              <p>¡Sin tareas pendientes!</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Add Task Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Nueva Tarea">
        <div className="space-y-4">
          <Input
            label="Título"
            placeholder="¿Qué necesitas hacer?"
            value={newTask.title}
            onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
          />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Prioridad</label>
            <div className="flex gap-2">
              {(['p0', 'p1', 'p2', 'p3'] as TaskPriority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setNewTask(t => ({ ...t, priority: p }))}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all',
                    newTask.priority === p ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50' : 'bg-white/[0.05] text-slate-400'
                  )}
                >
                  {PRIORITY_BADGE[p].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Proyecto</label>
            <select
              value={newTask.projectId}
              onChange={e => setNewTask(t => ({ ...t, projectId: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none focus:border-violet-500/50"
            >
              <option value="">Sin proyecto</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
            </select>
          </div>
          <Input
            label="Fecha límite (opcional)"
            type="date"
            value={newTask.dueDate}
            onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={() => {
              if (!newTask.title) return
              addTask({ title: newTask.title, priority: newTask.priority, projectId: newTask.projectId || undefined, dueDate: newTask.dueDate || undefined, status: 'todo', tags: [] })
              setAddModal(false)
              setNewTask({ title: '', priority: 'p1', projectId: '', dueDate: '' })
            }}>
              Crear tarea
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
