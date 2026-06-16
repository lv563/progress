'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format } from 'date-fns'
import {
  Wallet, Plus, Trash2, DollarSign,
  Receipt, Check, X, Pencil, CheckCircle2, Circle, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useFinanceStore } from '@/stores/finance.store'
import { cn } from '@/lib/utils/cn'
import type { TransactionType } from '@/stores/finance.store'

function fmt(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n)
}

const CATEGORIES = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Ropa', 'Servicios', 'Deuda', 'Otro']
const CAT_ICONS: Record<string, string> = {
  Comida: '🍽️', Transporte: '🚗', Entretenimiento: '🎬', Salud: '💊',
  Ropa: '👕', Servicios: '💡', Deuda: '💳', Otro: '📦',
}
const BUDGET_COLORS = ['#7C3AED', '#06B6D4', '#F59E0B', '#10B981', '#EC4899', '#F97316', '#EF4444', '#8B5CF6']

type Tab = 'movimientos' | 'presupuesto'

export default function FinancePage() {
  const {
    transactions, budgets,
    addTransaction, removeTransaction,
    addBudget, updateBudget, removeBudget,
    getMonthlyIncome, getMonthlyExpenses, getMonthlyBalance,
    getSpentOnCategory, isBudgetPaid, markBudgetPaid, unmarkBudgetPaid,
  } = useFinanceStore()

  const [tab, setTab]                     = useState<Tab>('movimientos')
  const [txModal, setTxModal]             = useState(false)
  const [budgetModal, setBudgetModal]     = useState(false)
  const [filterType, setFilterType]       = useState<'all' | TransactionType>('all')
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [editValue, setEditValue]         = useState('')
  const [payModal, setPayModal]           = useState<string | null>(null)
  const [payAmount, setPayAmount]         = useState('')

  const [newTx, setNewTx] = useState({
    type: 'expense' as TransactionType,
    category: 'Comida', amount: '', description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [newBudget, setNewBudget] = useState({ category: '', icon: '💰', limit: '', color: '#7C3AED' })

  const income   = getMonthlyIncome()
  const expenses = getMonthlyExpenses()
  const balance  = getMonthlyBalance()

  const filteredTx = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .slice(0, 60)

  const handleAddTx = () => {
    if (!newTx.amount || !newTx.description) return
    addTransaction({
      type: newTx.type,
      category: newTx.type === 'income' ? 'Ingreso' : newTx.category,
      amount: Number(newTx.amount),
      description: newTx.description,
      date: newTx.date,
      icon: newTx.type === 'income' ? '💰' : (CAT_ICONS[newTx.category] ?? '📦'),
    })
    setTxModal(false)
    setNewTx({ type: 'expense', category: 'Comida', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') })
  }

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.limit) return
    addBudget({ category: newBudget.category, icon: newBudget.icon, limit: Number(newBudget.limit), color: newBudget.color })
    setBudgetModal(false)
    setNewBudget({ category: '', icon: '💰', limit: '', color: '#7C3AED' })
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Wallet size={24} className="text-emerald-400" /> Finanzas
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Control de ingresos y gastos</p>
        </div>
        <Button onClick={() => setTxModal(true)} variant="glow" size="sm">
          <Plus size={14} /> Transacción
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
          <div className="flex items-center gap-1 mb-1">
            <ArrowUpRight size={12} className="text-emerald-400" />
            <p className="text-xs text-slate-500">Ingresos</p>
          </div>
          <p className="text-base font-black text-emerald-400 tabular-nums leading-tight">{fmt(income)}</p>
        </div>
        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/[0.05]">
          <div className="flex items-center gap-1 mb-1">
            <ArrowDownRight size={12} className="text-red-400" />
            <p className="text-xs text-slate-500">Gastos</p>
          </div>
          <p className="text-base font-black text-red-400 tabular-nums leading-tight">{fmt(expenses)}</p>
        </div>
        <div className={cn(
          'p-4 rounded-2xl border',
          balance >= 0 ? 'border-cyan-500/20 bg-cyan-500/[0.05]' : 'border-orange-500/20 bg-orange-500/[0.05]'
        )}>
          <div className="flex items-center gap-1 mb-1">
            <DollarSign size={12} className={balance >= 0 ? 'text-cyan-400' : 'text-orange-400'} />
            <p className="text-xs text-slate-500">Balance</p>
          </div>
          <p className={cn('text-base font-black tabular-nums leading-tight', balance >= 0 ? 'text-cyan-400' : 'text-orange-400')}>
            {fmt(balance)}
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {([['movimientos', 'Movimientos'], ['presupuesto', 'Presupuesto']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
            )}>
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ MOVIMIENTOS ══ */}
        {tab === 'movimientos' && (
          <motion.div key="mov" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            <div className="flex gap-2">
              {([['all', 'Todos'], ['income', 'Ingresos'], ['expense', 'Gastos']] as ['all' | TransactionType, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setFilterType(v)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    filterType === v ? 'bg-white/[0.1] text-white' : 'text-slate-500 hover:text-slate-300'
                  )}>
                  {l}
                </button>
              ))}
            </div>

            {filteredTx.length === 0 ? (
              <div className="text-center py-14">
                <Receipt size={32} className="mx-auto text-slate-700 mb-2" />
                <p className="text-slate-500 text-sm">Sin movimientos este mes</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredTx.map(tx => (
                  <div key={tx.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all group">
                    <span className="text-lg shrink-0">{tx.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                      <p className="text-xs text-slate-600">{tx.category} · {format(new Date(tx.date), 'd/MM')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-sm font-bold tabular-nums', tx.type === 'income' ? 'text-emerald-400' : 'text-red-400')}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                      </span>
                      <button onClick={() => removeTransaction(tx.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ PRESUPUESTO ══ */}
        {tab === 'presupuesto' && (
          <motion.div key="pre" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {budgets.filter(b => isBudgetPaid(b.category)).length}/{budgets.length} pagados este mes
              </p>
              <button onClick={() => setBudgetModal(true)}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">
                <Plus size={12} /> Agregar
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className="text-center py-14">
                <Receipt size={32} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm mb-4">Sin categorías de presupuesto</p>
                <Button variant="glow" size="sm" onClick={() => setBudgetModal(true)}>
                  <Plus size={14} /> Agregar categoría
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {budgets.map(budget => {
                  const spent     = getSpentOnCategory(budget.category)
                  const pct       = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0
                  const over      = spent > budget.limit
                  const paid      = isBudgetPaid(budget.category)
                  const remaining = Math.max(0, budget.limit - spent)
                  const editing   = editingBudget === budget.category
                  const barColor  = paid ? '#10B981' : over ? '#EF4444' : pct >= 80 ? '#F59E0B' : budget.color

                  return (
                    <div key={budget.category}
                      className="group p-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          onClick={() => paid ? unmarkBudgetPaid(budget.category) : (setPayAmount(String(budget.limit)), setPayModal(budget.category))}
                          className="shrink-0 transition-transform active:scale-90">
                          {paid
                            ? <CheckCircle2 size={22} className="text-emerald-400" />
                            : <Circle size={22} className="text-slate-600 hover:text-emerald-400 transition-colors" />}
                        </button>
                        <span className="text-xl shrink-0">{budget.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-semibold', paid ? 'text-slate-400 line-through' : 'text-white')}>
                            {budget.category}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: paid ? '#10B981' : over ? '#EF4444' : '#64748B' }}>
                            {paid ? '✓ Pagado' : over ? `⚠️ Excedido ${fmt(spent - budget.limit)}` : `Disponible: ${fmt(remaining)}`}
                          </p>
                        </div>
                        {editing ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <input autoFocus type="number" min={1} value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') { const v = Number(editValue); if (v > 0) updateBudget(budget.category, v); setEditingBudget(null) }
                                if (e.key === 'Escape') setEditingBudget(null)
                              }}
                              className="w-20 h-7 rounded-lg bg-white/[0.08] border border-emerald-500/40 text-white text-xs px-2 focus:outline-none" />
                            <button onClick={() => { const v = Number(editValue); if (v > 0) updateBudget(budget.category, v); setEditingBudget(null) }} className="text-emerald-400"><Check size={14} /></button>
                            <button onClick={() => setEditingBudget(null)} className="text-slate-500"><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="text-right">
                              <p className="text-xs font-bold tabular-nums" style={{ color: barColor }}>{fmt(spent)}</p>
                              <p className="text-[10px] text-slate-600">/ {fmt(budget.limit)}</p>
                            </div>
                            <button onClick={() => { setEditingBudget(budget.category); setEditValue(String(budget.limit)) }}
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-emerald-400 transition-all">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => removeBudget(budget.category)}
                              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: barColor }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ MODALS ════ */}

      {/* Nueva transacción */}
      <Modal open={txModal} onClose={() => setTxModal(false)} title="Nueva Transacción">
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['expense', 'income'] as TransactionType[]).map(t => (
              <button key={t} onClick={() => setNewTx(tx => ({ ...tx, type: t }))}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  newTx.type === t
                    ? t === 'income'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]'
                )}>
                {t === 'income' ? '💰 Ingreso' : '💸 Gasto'}
              </button>
            ))}
          </div>

          <Input label="Descripción" placeholder="Supermercado, Salario..."
            value={newTx.description} onChange={e => setNewTx(tx => ({ ...tx, description: e.target.value }))} />
          <Input label="Monto (RD$)" type="number" placeholder="0" min={0}
            value={newTx.amount} onChange={e => setNewTx(tx => ({ ...tx, amount: e.target.value }))}
            icon={<DollarSign size={14} />} />

          {newTx.type === 'expense' && (
            <div>
              <label className="text-sm text-slate-400 font-medium block mb-2">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setNewTx(tx => ({ ...tx, category: cat }))}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                      newTx.category === cat
                        ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40'
                        : 'bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.08]'
                    )}>
                    {CAT_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Fecha</label>
            <input type="date" value={newTx.date} onChange={e => setNewTx(tx => ({ ...tx, date: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none" />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setTxModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newTx.amount || !newTx.description} onClick={handleAddTx}>
              <Plus size={14} /> Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Nueva categoría de presupuesto */}
      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Nueva Categoría">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Emoji" value={newBudget.icon}
              onChange={e => setNewBudget(b => ({ ...b, icon: e.target.value }))} />
            <Input label="Nombre" placeholder="Comida, Ropa..."
              value={newBudget.category} onChange={e => setNewBudget(b => ({ ...b, category: e.target.value }))} />
          </div>
          <Input label="Límite mensual (RD$)" type="number" min={1} placeholder="5000"
            value={newBudget.limit} onChange={e => setNewBudget(b => ({ ...b, limit: e.target.value }))}
            icon={<DollarSign size={14} />} />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {BUDGET_COLORS.map(c => (
                <button key={c} onClick={() => setNewBudget(b => ({ ...b, color: c }))}
                  className={cn('w-7 h-7 rounded-full transition-all', newBudget.color === c ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-[#0D0D16] scale-110' : 'opacity-60 hover:opacity-100')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setBudgetModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newBudget.category || !newBudget.limit} onClick={handleAddBudget}>
              <Plus size={14} /> Agregar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pagar categoría */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Pagar — ${payModal ?? ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">El pago se registrará como gasto en tus movimientos.</p>
          <Input label="Monto pagado (RD$)" type="number" min={1}
            value={payAmount} onChange={e => setPayAmount(e.target.value)}
            icon={<DollarSign size={14} />} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setPayModal(null)}>Cancelar</Button>
            <Button variant="glow" disabled={!payAmount} onClick={() => {
              if (!payModal || !payAmount) return
              addTransaction({
                type: 'expense', category: payModal, amount: Number(payAmount),
                description: `Pago ${payModal}`,
                date: format(new Date(), 'yyyy-MM-dd'),
                icon: budgets.find(b => b.category === payModal)?.icon ?? '💳',
              })
              markBudgetPaid(payModal)
              setPayModal(null)
              setPayAmount('')
            }}>
              <Check size={14} /> Registrar pago
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
