'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import {
  CheckSquare, Plus, Folder, Kanban, List, Trash2, Calendar,
  GripVertical, AlertTriangle, Clock, TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useTasksStore } from '@/stores/tasks.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import type { TaskStatus, TaskPriority } from '@/types'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core'

const STATUS_COLS: { id: TaskStatus; label: string; color: string; icon: string }[] = [
  { id: 'todo',        label: 'Por hacer',   color: '#475569', icon: '○' },
  { id: 'in-progress', label: 'En progreso', color: '#00D4B8', icon: '◐' },
  { id: 'review',      label: 'En revisión', color: '#F59E0B', icon: '◑' },
  { id: 'done',        label: 'Completado',  color: '#10B981', icon: '●' },
]

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  p0: { label: 'Urgente', color: '#EF4444', dot: '#EF4444' },
  p1: { label: 'Alta',    color: '#F97316', dot: '#F97316' },
  p2: { label: 'Media',   color: '#00D4B8', dot: '#00D4B8' },
  p3: { label: 'Baja',    color: '#475569', dot: '#475569' },
}

const PRIORITY_BADGE: Record<TaskPriority, { label: string; variant: 'red' | 'orange' | 'cyan' | 'outline' }> = {
  p0: { label: 'Urgente', variant: 'red' },
  p1: { label: 'Alta',    variant: 'orange' },
  p2: { label: 'Media',   variant: 'cyan' },
  p3: { label: 'Baja',    variant: 'outline' },
}

const todayMidnight = () => { const d = new Date(); d.setHours(0,0,0,0); return d }

const isOverdue  = (due?: string) => due ? new Date(due) < todayMidnight() : false
const isDueToday = (due?: string) => {
  if (!due) return false
  const d = new Date(due); d.setHours(0,0,0,0)
  return d.getTime() === todayMidnight().getTime()
}

type TaskFilter = 'all' | 'today' | 'overdue' | 'done'

function TaskCard({ task, onDelete, onMove, isDragOverlay = false }: {
  task: ReturnType<typeof useTasksStore.getState>['tasks'][0]
  onDelete: () => void
  onMove: (status: TaskStatus) => void
  isDragOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  const overdue  = task.status !== 'done' && isOverdue(task.dueDate)
  const dueToday = task.status !== 'done' && isDueToday(task.dueDate)
  const pm = PRIORITY_META[task.priority]

  return (
    <div
      ref={setNodeRef}
      className={cn('touch-none', isDragging && !isDragOverlay && 'opacity-30')}
      {...attributes}
    >
      <div
        className={cn(
          'group rounded-xl p-3 border transition-all cursor-default',
          overdue  ? 'border-red-500/30 bg-red-500/[0.04]' :
          dueToday ? 'border-amber-500/30 bg-amber-500/[0.04]' :
          task.status === 'done' ? 'border-white/[0.04] bg-white/[0.01]' :
          'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
        )}
        style={isDragOverlay ? { boxShadow: '0 20px 60px rgba(0,0,0,0.6)' } : undefined}
      >
        <div className="flex items-start gap-2">
          <button
            {...listeners}
            className="mt-0.5 text-slate-700 hover:text-slate-500 transition-colors cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical size={13} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <p className={cn('text-sm font-medium leading-snug', task.status === 'done' ? 'text-slate-600 line-through' : 'text-white')}>
                {task.title}
              </p>
              <button onClick={onDelete} className="text-slate-700 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                <Trash2 size={11} />
              </button>
            </div>
            {task.description && (
              <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">{task.description}</p>
            )}
            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {task.tags.map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-500">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Priority dot */}
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: pm.dot }} />
                <span className="text-[10px]" style={{ color: pm.color }}>{pm.label}</span>
              </div>
              {task.dueDate && (
                <span className={cn('text-[10px] flex items-center gap-0.5', overdue ? 'text-red-400' : dueToday ? 'text-amber-400' : 'text-slate-500')}>
                  {overdue ? <AlertTriangle size={9} /> : <Calendar size={9} />}
                  {overdue ? 'Vencido · ' : dueToday ? 'Hoy · ' : ''}
                  {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
            {/* Quick move */}
            {task.status !== 'done' && (
              <div className="flex gap-2 mt-2">
                {task.status === 'todo' && (
                  <button onClick={() => onMove('in-progress')} className="text-[10px] text-slate-600 hover:text-cyan-400 transition-colors">
                    → Iniciar
                  </button>
                )}
                {task.status === 'in-progress' && (
                  <button onClick={() => onMove('review')} className="text-[10px] text-slate-600 hover:text-amber-400 transition-colors">
                    → Revisión
                  </button>
                )}
                {(task.status === 'in-progress' || task.status === 'review') && (
                  <button onClick={() => onMove('done')} className="text-[10px] text-slate-600 hover:text-emerald-400 transition-colors">
                    ✓ Completar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DroppableColumn({ id, color, label, icon, count, children }: {
  id: string; color: string; label: string; icon: string; count: number; children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-sm font-bold" style={{ color }}>{icon}</span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="ml-auto text-xs font-mono px-1.5 py-0.5 rounded-md bg-white/[0.04] text-slate-600">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[120px] space-y-2 rounded-xl p-2 transition-colors',
          isOver ? 'ring-1 ring-inset' : ''
        )}
        style={isOver ? { background: `${color}0A`, ringColor: `${color}40` } : undefined}
      >
        {children}
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { tasks, projects, addTask, updateTask, moveTask, deleteTask } = useTasksStore()
  const { addXP } = useAppStore()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all')
  const [selectedProject, setSelectedProject] = useState<string | 'all'>('all')
  const [addModal, setAddModal] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'p1' as TaskPriority, projectId: '', dueDate: '', tags: '',
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const projectFiltered = selectedProject === 'all' ? tasks : tasks.filter(t => t.projectId === selectedProject)

  const filteredTasks = useMemo(() => {
    switch (taskFilter) {
      case 'today':   return projectFiltered.filter(t => t.status !== 'done' && (isDueToday(t.dueDate) || !t.dueDate))
      case 'overdue': return projectFiltered.filter(t => t.status !== 'done' && isOverdue(t.dueDate))
      case 'done':    return projectFiltered.filter(t => t.status === 'done')
      default:        return projectFiltered
    }
  }, [projectFiltered, taskFilter])

  // Stats
  const stats = useMemo(() => ({
    total:      projectFiltered.filter(t => t.status !== 'done').length,
    done:       projectFiltered.filter(t => t.status === 'done').length,
    inProgress: projectFiltered.filter(t => t.status === 'in-progress').length,
    overdue:    projectFiltered.filter(t => t.status !== 'done' && isOverdue(t.dueDate)).length,
    dueToday:   projectFiltered.filter(t => t.status !== 'done' && isDueToday(t.dueDate)).length,
  }), [projectFiltered])

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (over && active.id !== over.id) {
      const colIds = STATUS_COLS.map(c => c.id as string)
      if (colIds.includes(over.id as string)) {
        const status = over.id as TaskStatus
        moveTask(active.id as string, status)
        if (status === 'done') addXP(5, 'Tarea completada')
      }
    }
  }

  const handleCreate = () => {
    if (!newTask.title.trim()) return
    const tags = newTask.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    addTask({
      title: newTask.title.trim(),
      description: newTask.description.trim() || undefined,
      priority: newTask.priority,
      projectId: newTask.projectId || undefined,
      dueDate: newTask.dueDate || undefined,
      status: 'todo',
      tags,
    })
    setAddModal(false)
    setNewTask({ title: '', description: '', priority: 'p1', projectId: '', dueDate: '', tags: '' })
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  const FILTER_TABS: { id: TaskFilter; label: string; count: number; color: string }[] = [
    { id: 'all',     label: 'Todas',     count: stats.total,      color: '#94A3B8' },
    { id: 'today',   label: 'Hoy',       count: stats.dueToday,   color: '#00D4B8' },
    { id: 'overdue', label: 'Vencidas',  count: stats.overdue,    color: '#EF4444' },
    { id: 'done',    label: 'Completadas', count: stats.done,     color: '#10B981' },
  ]

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <CheckSquare size={24} className="text-cyan-400" /> Tareas
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button onClick={() => setView('kanban')} className={cn('p-1.5 rounded-md transition-all', view === 'kanban' ? 'bg-cyan-500/25 text-cyan-300' : 'text-slate-500 hover:text-slate-300')}>
              <Kanban size={14} />
            </button>
            <button onClick={() => setView('list')} className={cn('p-1.5 rounded-md transition-all', view === 'list' ? 'bg-cyan-500/25 text-cyan-300' : 'text-slate-500 hover:text-slate-300')}>
              <List size={14} />
            </button>
          </div>
          <Button onClick={() => setAddModal(true)} variant="glow" size="sm">
            <Plus size={14} /> Nueva tarea
          </Button>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pendientes',  value: stats.total,      color: '#94A3B8', icon: <Clock size={14}/> },
          { label: 'En progreso', value: stats.inProgress, color: '#00D4B8', icon: <TrendingUp size={14}/> },
          { label: 'Completadas', value: stats.done,       color: '#10B981', icon: <CheckSquare size={14}/> },
          { label: 'Vencidas',    value: stats.overdue,    color: '#EF4444', icon: <AlertTriangle size={14}/> },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}15`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-black text-white tabular-nums">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters + Projects */}
      <motion.div variants={fadeUp} className="flex gap-2 flex-wrap items-center">
        {FILTER_TABS.map(f => (
          <button
            key={f.id}
            onClick={() => setTaskFilter(f.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              taskFilter === f.id ? 'text-white border' : 'glass text-slate-400 hover:text-slate-200'
            )}
            style={taskFilter === f.id ? { background: `${f.color}18`, borderColor: `${f.color}40`, color: f.color } : undefined}
          >
            {f.label}
            {f.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${f.color}25`, color: f.color }}>
                {f.count}
              </span>
            )}
          </button>
        ))}

        <div className="w-px h-5 bg-white/[0.08]" />

        <button
          onClick={() => setSelectedProject('all')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', selectedProject === 'all' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300')}
        >
          <Folder size={11} className="inline mr-1" /> Todos
        </button>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedProject(p.id)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', selectedProject === p.id ? 'text-white border' : 'glass text-slate-400 hover:text-slate-200')}
            style={selectedProject === p.id ? { background: `${p.color}20`, borderColor: `${p.color}40`, color: p.color } : undefined}
          >
            {p.icon} {p.name}
          </button>
        ))}
      </motion.div>

      {/* Kanban */}
      {view === 'kanban' && (
        <motion.div variants={fadeUp}>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATUS_COLS.map(col => {
                const colTasks = filteredTasks.filter(t => t.status === col.id)
                return (
                  <DroppableColumn key={col.id} id={col.id} color={col.color} label={col.label} icon={col.icon} count={colTasks.length}>
                    <AnimatePresence>
                      {colTasks.map(task => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <TaskCard
                            task={task}
                            onDelete={() => deleteTask(task.id)}
                            onMove={(s) => { moveTask(task.id, s); if (s === 'done') addXP(5, 'Tarea completada') }}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {colTasks.length === 0 && (
                      <div className="py-8 text-center text-slate-700 text-xs rounded-xl border border-dashed border-white/[0.06]">
                        Arrastra aquí
                      </div>
                    )}
                  </DroppableColumn>
                )
              })}
            </div>
            <DragOverlay>
              {activeTask && (
                <TaskCard task={activeTask} onDelete={() => {}} onMove={() => {}} isDragOverlay />
              )}
            </DragOverlay>
          </DndContext>
        </motion.div>
      )}

      {/* List view */}
      {view === 'list' && (
        <motion.div variants={fadeUp} className="space-y-2">
          {filteredTasks.filter(t => t.status !== 'done').map(task => {
            const overdue  = isOverdue(task.dueDate)
            const dueToday = isDueToday(task.dueDate)
            const pm = PRIORITY_META[task.priority]
            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all',
                  overdue  ? 'border-red-500/25 bg-red-500/[0.03]' :
                  dueToday ? 'border-amber-500/25 bg-amber-500/[0.03]' :
                  'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                )}
              >
                <button
                  onClick={() => { moveTask(task.id, 'done'); addXP(5, 'Tarea completada') }}
                  className="w-5 h-5 rounded-full border-2 hover:scale-110 transition-all shrink-0 flex items-center justify-center"
                  style={{ borderColor: pm.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{task.title}</p>
                  {task.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {task.tags.map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-600">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: pm.dot }} />
                  {task.dueDate && (
                    <span className={cn('text-[10px] flex items-center gap-0.5', overdue ? 'text-red-400' : dueToday ? 'text-amber-400' : 'text-slate-500')}>
                      {overdue && <AlertTriangle size={9} />}
                      {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <button onClick={() => deleteTask(task.id)} className="text-slate-700 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
          {/* Completed section */}
          {filteredTasks.filter(t => t.status === 'done').length > 0 && taskFilter !== 'done' && (
            <div className="pt-2">
              <p className="text-xs text-slate-700 uppercase tracking-wider mb-2 px-1">Completadas</p>
              {filteredTasks.filter(t => t.status === 'done').slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.03] bg-transparent mb-1.5">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <span className="text-[8px] text-emerald-400">✓</span>
                  </div>
                  <p className="text-sm text-slate-600 line-through flex-1 truncate">{task.title}</p>
                  <button onClick={() => deleteTask(task.id)} className="text-slate-800 hover:text-red-400 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {filteredTasks.filter(t => t.status !== 'done').length === 0 && taskFilter === 'all' && (
            <div className="text-center py-14 text-slate-600">
              <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">¡Sin tareas pendientes!</p>
              <button onClick={() => setAddModal(true)} className="text-xs text-cyan-400 mt-2 hover:text-cyan-300 transition-colors">
                + Agregar tarea
              </button>
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
            <label className="text-xs text-slate-400 mb-1.5 block">Descripción (opcional)</label>
            <textarea
              value={newTask.description}
              onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))}
              placeholder="Detalla lo que necesitas hacer..."
              rows={2}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 resize-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Prioridad</label>
            <div className="grid grid-cols-4 gap-2">
              {(['p0', 'p1', 'p2', 'p3'] as TaskPriority[]).map(p => {
                const pm = PRIORITY_META[p]
                return (
                  <button
                    key={p}
                    onClick={() => setNewTask(t => ({ ...t, priority: p }))}
                    className={cn('px-2 py-2 rounded-xl text-xs font-medium transition-all border', newTask.priority === p ? 'text-white border-opacity-40' : 'border-white/[0.06] text-slate-500 hover:text-slate-300')}
                    style={newTask.priority === p ? { background: `${pm.color}20`, borderColor: `${pm.color}50`, color: pm.color } : undefined}
                  >
                    {pm.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400 font-medium block mb-1.5">Proyecto</label>
              <select
                value={newTask.projectId}
                onChange={e => setNewTask(t => ({ ...t, projectId: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">Sin proyecto</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
              </select>
            </div>
            <Input
              label="Fecha límite"
              type="date"
              value={newTask.dueDate}
              onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Tags (separados por coma)</label>
            <input
              value={newTask.tags}
              onChange={e => setNewTask(t => ({ ...t, tags: e.target.value }))}
              placeholder="diseño, backend, urgente"
              className="w-full h-9 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={handleCreate} disabled={!newTask.title.trim()}>Crear tarea</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
