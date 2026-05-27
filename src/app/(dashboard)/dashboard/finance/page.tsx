'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format } from 'date-fns'
import {
  Wallet, TrendingUp, TrendingDown, Plus, Target, Trash2,
  DollarSign, PiggyBank, Receipt, ArrowUpRight, ArrowDownRight,
  Pencil, Check, X, CheckCircle2, Circle, ChevronDown, ChevronUp,
  ArrowDown, ArrowUp
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useFinanceStore } from '@/stores/finance.store'
import { cn } from '@/lib/utils/cn'
import type { TransactionType, SavingsTxType } from '@/stores/finance.store'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const PIE_COLORS = ['#7C3AED','#06B6D4','#F59E0B','#10B981','#EC4899','#F97316','#EF4444','#8B5CF6']

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n)
}

export default function FinancePage() {
  const {
    transactions, budgets, savingsGoals, savingsTransactions,
    addTransaction, removeTransaction,
    isBudgetPaid, markBudgetPaid, unmarkBudgetPaid,
    addSavingsGoal, removeSavingsGoal,
    addSavingsTransaction, removeSavingsTransaction, getGoalTransactions,
    addBudget, updateBudget, removeBudget,
    getMonthlyIncome, getMonthlyExpenses, getMonthlyBalance,
    getExpensesByCategory, getSpentOnCategory,
  } = useFinanceStore()

  // Modals
  const [txModal, setTxModal]         = useState(false)
  const [goalModal, setGoalModal]     = useState(false)
  const [budgetModal, setBudgetModal] = useState(false)

  // Budget — inline edit
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [editValue, setEditValue]         = useState('')

  // Budget — pay with custom amount
  const [payModal, setPayModal]     = useState<string | null>(null)
  const [payAmount, setPayAmount]   = useState('')

  // Savings — active goal drawer
  const [activeGoal, setActiveGoal]         = useState<string | null>(null)
  const [savingsTxModal, setSavingsTxModal] = useState<string | null>(null)
  const [newSavingsTx, setNewSavingsTx]     = useState({
    type: 'deposit' as SavingsTxType,
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  // New transaction
  const [newTx, setNewTx] = useState({
    type: 'expense' as TransactionType,
    category: 'Comida',
    amount: '',
    description: '',
    icon: '💸',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  // New savings goal
  const [newGoal, setNewGoal] = useState({
    name: '', target: '', current: '0', icon: '🎯', color: '#7C3AED', deadline: '',
  })

  // New budget category
  const [newBudget, setNewBudget] = useState({
    category: '', icon: '💰', limit: '', color: '#7C3AED',
  })

  const income     = getMonthlyIncome()
  const expenses   = getMonthlyExpenses()
  const balance    = getMonthlyBalance()
  const byCategory = getExpensesByCategory()
  const pieData    = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const key = d.toISOString().slice(0, 7)
    return {
      mes: MONTHS[d.getMonth()],
      ingresos: getMonthlyIncome(key),
      gastos: getMonthlyExpenses(key),
    }
  })

  const tooltipStyle = {
    contentStyle: {
      background: '#1A1A27',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      fontSize: '12px',
      color: '#F8FAFC',
    },
  }

  /* ── Handlers ── */
  const handleAddTransaction = () => {
    if (!newTx.amount || !newTx.description) return
    addTransaction({
      type: newTx.type,
      category: newTx.category,
      amount: Number(newTx.amount),
      description: newTx.description,
      date: newTx.date,
      icon: newTx.type === 'income' ? '💰' : newTx.icon,
    })
    setTxModal(false)
    setNewTx({ type: 'expense', category: 'Comida', amount: '', description: '', icon: '💸', date: format(new Date(), 'yyyy-MM-dd') })
  }

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.target) return
    addSavingsGoal({
      name: newGoal.name,
      target: Number(newGoal.target),
      current: Number(newGoal.current),
      icon: newGoal.icon,
      color: newGoal.color,
      deadline: newGoal.deadline || undefined,
    })
    setGoalModal(false)
    setNewGoal({ name: '', target: '', current: '0', icon: '🎯', color: '#7C3AED', deadline: '' })
  }

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.limit) return
    addBudget({ category: newBudget.category, icon: newBudget.icon, limit: Number(newBudget.limit), color: newBudget.color })
    setBudgetModal(false)
    setNewBudget({ category: '', icon: '💰', limit: '', color: '#7C3AED' })
  }

  const handlePay = (category: string) => {
    const val = Number(payAmount)
    if (!val || val <= 0) return
    markBudgetPaid(category, val)
    setPayModal(null)
    setPayAmount('')
  }

  const handleAddSavingsTx = (goalId: string) => {
    const val = Number(newSavingsTx.amount)
    if (!val || !newSavingsTx.description) return
    addSavingsTransaction({
      goalId,
      type: newSavingsTx.type,
      amount: val,
      description: newSavingsTx.description,
      date: newSavingsTx.date,
    })
    setSavingsTxModal(null)
    setNewSavingsTx({ type: 'deposit', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') })
  }

  const startEdit = (category: string, limit: number) => {
    setEditingBudget(category)
    setEditValue(String(limit))
  }
  const confirmEdit = (category: string) => {
    const v = Number(editValue)
    if (v > 0) updateBudget(category, v)
    setEditingBudget(null)
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Wallet size={24} className="text-emerald-400" /> Finanzas
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Control de ahorros, presupuestos y gastos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setGoalModal(true)} variant="ghost" size="sm">
            <Target size={14} /> Meta
          </Button>
          <Button onClick={() => setTxModal(true)} variant="glow" size="sm">
            <Plus size={14} /> Transacción
          </Button>
        </div>
      </motion.div>

      {/* Balance cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <GlassCard className="p-5 border-emerald-500/20" animate={false}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-label text-slate-500">Balance del mes</p>
              <p className={cn('text-2xl font-black tabular-nums', balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
          <div className={cn('flex items-center gap-1 text-xs', balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {balance >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span>{balance >= 0 ? 'Superávit' : 'Déficit'} este mes</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5" animate={false}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
              <TrendingUp size={18} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-label text-slate-500">Ingresos del mes</p>
              <p className="text-2xl font-black text-cyan-400 tabular-nums">{formatCurrency(income)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {transactions.filter(t => t.type === 'income' && t.date.startsWith(new Date().toISOString().slice(0, 7))).length} transacciones
          </p>
        </GlassCard>

        <GlassCard className="p-5" animate={false}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
              <TrendingDown size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-label text-slate-500">Gastos del mes</p>
              <p className="text-2xl font-black text-red-400 tabular-nums">{formatCurrency(expenses)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {transactions.filter(t => t.type === 'expense' && t.date.startsWith(new Date().toISOString().slice(0, 7))).length} transacciones
          </p>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Presupuesto mensual ── */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Receipt size={16} className="text-amber-400" /> Presupuesto Mensual
              </h3>
              <button
                onClick={() => setBudgetModal(true)}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>

            <div className="space-y-2">
              {budgets.map(budget => {
                const spent   = getSpentOnCategory(budget.category)
                const pct     = Math.min((spent / budget.limit) * 100, 100)
                const over    = spent > budget.limit
                const paid    = isBudgetPaid(budget.category)
                const editing = editingBudget === budget.category

                return (
                  <div key={budget.category} className="group rounded-xl p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.04]">
                    {/* Row top */}
                    <div className="flex items-center gap-3">
                      {/* Paid toggle */}
                      <button
                        onClick={() => {
                          if (paid) {
                            unmarkBudgetPaid(budget.category)
                          } else {
                            setPayAmount(String(budget.limit))
                            setPayModal(budget.category)
                          }
                        }}
                        title={paid ? 'Marcar como no pagado' : 'Marcar como pagado'}
                        className="shrink-0 transition-transform active:scale-90"
                      >
                        {paid
                          ? <CheckCircle2 size={22} className="text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                          : <Circle size={22} className="text-slate-600 hover:text-emerald-400 transition-colors" />
                        }
                      </button>

                      {/* Icon + name */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-base leading-none">{budget.icon}</span>
                        <span className={cn('text-sm font-medium truncate', paid ? 'text-slate-400 line-through' : 'text-white')}>
                          {budget.category}
                        </span>
                        {paid && (
                          <span className="shrink-0 text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                            Pagado
                          </span>
                        )}
                      </div>

                      {/* Limit edit / value */}
                      {editing ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-slate-500">RD$</span>
                          <input
                            autoFocus
                            type="number"
                            min={1}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter')  confirmEdit(budget.category)
                              if (e.key === 'Escape') setEditingBudget(null)
                            }}
                            className="w-24 h-7 rounded-lg bg-white/[0.08] border border-violet-500/40 text-white text-xs px-2 focus:outline-none focus:ring-1 focus:ring-violet-500/50 tabular-nums"
                          />
                          <button onClick={() => confirmEdit(budget.category)} className="text-emerald-400 hover:text-emerald-300">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingBudget(null)} className="text-slate-500 hover:text-slate-300">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn('text-xs font-bold tabular-nums', over ? 'text-red-400' : paid ? 'text-emerald-400' : 'text-slate-300')}>
                            {formatCurrency(spent)}
                          </span>
                          <span className="text-xs text-slate-600">/ {formatCurrency(budget.limit)}</span>
                          <button
                            onClick={() => startEdit(budget.category, budget.limit)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-violet-400 transition-all ml-1"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => removeBudget(budget.category)}
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: over ? '#EF4444' : paid ? '#10B981' : budget.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                      />
                    </div>

                    {over && !paid && (
                      <p className="text-[10px] text-red-400 mt-1">
                        ⚠️ Superado por {formatCurrency(spent - budget.limit)}
                      </p>
                    )}
                  </div>
                )
              })}

              {budgets.length === 0 && (
                <div className="text-center py-8 text-slate-600">
                  <Receipt size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin presupuestos — agrega uno</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Gastos por categoría ── */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingDown size={16} className="text-red-400" /> Gastos por Categoría
            </h3>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                <Receipt size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Sin gastos este mes</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={0}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {pieData.slice(0, 6).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-slate-400">{d.name}</span>
                      </div>
                      <span className="text-xs font-medium text-white tabular-nums">{formatCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* ── Ingresos vs gastos ── */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-400" /> Ingresos vs Gastos
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={last6Months} barSize={10} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), '']} />
                <Bar dataKey="ingresos" fill="#06B6D4" radius={[3,3,0,0]} opacity={0.85} name="Ingresos" />
                <Bar dataKey="gastos"   fill="#EF4444" radius={[3,3,0,0]} opacity={0.75} name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* ── Metas de ahorro ── */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5" animate={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <PiggyBank size={16} className="text-emerald-400" /> Metas de Ahorro
              </h3>
              <button
                onClick={() => setGoalModal(true)}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>

            {savingsGoals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-slate-600">
                <PiggyBank size={28} className="mb-2 opacity-30" />
                <p className="text-sm">Sin metas de ahorro aún</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savingsGoals.map(goal => {
                  const pct      = Math.min((goal.current / goal.target) * 100, 100)
                  const isOpen   = activeGoal === goal.id
                  const goalTxs  = getGoalTransactions(goal.id)

                  return (
                    <div key={goal.id} className="rounded-xl border border-white/[0.05] overflow-hidden">
                      {/* Goal header */}
                      <div className="flex items-center gap-3 p-3 bg-white/[0.02]">
                        <span className="text-xl leading-none">{goal.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-white">{goal.name}</span>
                            <span className="text-xs font-bold tabular-nums" style={{ color: goal.color }}>
                              {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: goal.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-600">{Math.round(pct)}% completado</span>
                            {goal.deadline && <span className="text-[10px] text-slate-600">Meta: {goal.deadline}</span>}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setSavingsTxModal(goal.id); setNewSavingsTx(t => ({ ...t, type: 'deposit' })) }}
                            className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center justify-center"
                            title="Depositar"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            onClick={() => { setSavingsTxModal(goal.id); setNewSavingsTx(t => ({ ...t, type: 'withdrawal' })) }}
                            className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center justify-center"
                            title="Retirar"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            onClick={() => setActiveGoal(isOpen ? null : goal.id)}
                            className="w-7 h-7 rounded-lg bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] transition-colors flex items-center justify-center"
                            title="Ver movimientos"
                          >
                            {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                          <button
                            onClick={() => removeSavingsGoal(goal.id)}
                            className="w-7 h-7 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Transaction history drawer */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-white/[0.05] bg-white/[0.01]">
                              {goalTxs.length === 0 ? (
                                <p className="text-xs text-slate-600 text-center py-4">Sin movimientos aún</p>
                              ) : (
                                <div className="divide-y divide-white/[0.04]">
                                  {goalTxs.map(tx => (
                                    <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 group hover:bg-white/[0.03] transition-colors">
                                      <div className={cn(
                                        'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
                                        tx.type === 'deposit' ? 'bg-emerald-500/15' : 'bg-orange-500/10'
                                      )}>
                                        {tx.type === 'deposit'
                                          ? <ArrowDown size={11} className="text-emerald-400" />
                                          : <ArrowUp size={11} className="text-orange-400" />
                                        }
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-white truncate">{tx.description}</p>
                                        <p className="text-[10px] text-slate-600">{tx.date}</p>
                                      </div>
                                      <span className={cn(
                                        'text-xs font-bold tabular-nums shrink-0',
                                        tx.type === 'deposit' ? 'text-emerald-400' : 'text-orange-400'
                                      )}>
                                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                      </span>
                                      <button
                                        onClick={() => removeSavingsTransaction(tx.id)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Transacciones recientes ── */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-5" animate={false}>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Receipt size={16} className="text-violet-400" /> Transacciones Recientes
          </h3>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-slate-600">
              <DollarSign size={28} className="mb-2 opacity-30" />
              <p className="text-sm">Sin transacciones aún</p>
              <button onClick={() => setTxModal(true)} className="text-xs text-violet-400 hover:text-violet-300 mt-1">
                + Agregar primera transacción
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {transactions.slice(0, 12).map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0',
                      tx.type === 'income' ? 'bg-cyan-500/15' : 'bg-red-500/10'
                    )}>
                      {tx.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                      <p className="text-xs text-slate-500">{tx.category} · {tx.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-bold tabular-nums', tx.type === 'income' ? 'text-cyan-400' : 'text-red-400')}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <button
                        onClick={() => removeTransaction(tx.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* ════ MODALS ════ */}

      {/* Nueva transacción */}
      <Modal open={txModal} onClose={() => setTxModal(false)} title="Nueva Transacción">
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['expense','income'] as TransactionType[]).map(t => (
              <button
                key={t}
                onClick={() => setNewTx(tx => ({ ...tx, type: t }))}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  newTx.type === t
                    ? t === 'income'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]'
                )}
              >
                {t === 'income' ? '💰 Ingreso' : '💸 Gasto'}
              </button>
            ))}
          </div>
          <Input label="Descripción" placeholder="Ej: Supermercado, Salario..." value={newTx.description} onChange={e => setNewTx(tx => ({ ...tx, description: e.target.value }))} />
          <Input label="Monto (RD$)" type="number" placeholder="0" min={0} value={newTx.amount} onChange={e => setNewTx(tx => ({ ...tx, amount: e.target.value }))} icon={<DollarSign size={14} />} />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {['Comida','Transporte','Entretenimiento','Salud','Ropa','Servicios','Ingreso','Otro'].map(cat => (
                <button key={cat} onClick={() => setNewTx(tx => ({ ...tx, category: cat }))}
                  className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all',
                    newTx.category === cat ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50' : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]'
                  )}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <Input label="Fecha" type="date" value={newTx.date} onChange={e => setNewTx(tx => ({ ...tx, date: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setTxModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={handleAddTransaction}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Marcar presupuesto como pagado */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title={`Pagar — ${payModal ?? ''}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Ingresa el monto exacto que pagaste. Se registrará como gasto y se descontará del balance del mes.
          </p>
          <Input
            label="Monto pagado (RD$)"
            type="number"
            min={1}
            placeholder="0"
            value={payAmount}
            onChange={e => setPayAmount(e.target.value)}
            icon={<DollarSign size={14} />}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setPayModal(null)}>Cancelar</Button>
            <Button variant="glow" onClick={() => handlePay(payModal!)}>
              <CheckCircle2 size={14} /> Marcar como pagado
            </Button>
          </div>
        </div>
      </Modal>

      {/* Nueva categoría de presupuesto */}
      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Nueva Categoría de Presupuesto">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input label="Emoji" value={newBudget.icon} onChange={e => setNewBudget(b => ({ ...b, icon: e.target.value }))} className="w-20" />
            <div className="flex-1">
              <Input label="Nombre" placeholder="Educación, Mascotas..." value={newBudget.category} onChange={e => setNewBudget(b => ({ ...b, category: e.target.value }))} />
            </div>
          </div>
          <Input label="Límite mensual (RD$)" type="number" min={1} placeholder="500" value={newBudget.limit} onChange={e => setNewBudget(b => ({ ...b, limit: e.target.value }))} icon={<DollarSign size={14} />} />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {['#7C3AED','#06B6D4','#F59E0B','#10B981','#EC4899','#F97316','#EF4444','#8B5CF6'].map(c => (
                <button key={c} onClick={() => setNewBudget(b => ({ ...b, color: c }))}
                  className={cn('w-7 h-7 rounded-lg transition-all', newBudget.color === c && 'ring-2 ring-white/40 scale-110')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setBudgetModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={handleAddBudget}>Agregar</Button>
          </div>
        </div>
      </Modal>

      {/* Nueva meta de ahorro */}
      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Nueva Meta de Ahorro">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input label="Emoji" value={newGoal.icon} onChange={e => setNewGoal(g => ({ ...g, icon: e.target.value }))} className="w-20" />
            <div className="flex-1">
              <Input label="Nombre" placeholder="Vacaciones, iPhone, Auto..." value={newGoal.name} onChange={e => setNewGoal(g => ({ ...g, name: e.target.value }))} />
            </div>
          </div>
          <Input label="Monto objetivo (RD$)" type="number" min={0} placeholder="50000" value={newGoal.target} onChange={e => setNewGoal(g => ({ ...g, target: e.target.value }))} icon={<Target size={14} />} />
          <Input label="Ya tengo ahorrado (RD$)" type="number" min={0} placeholder="0" value={newGoal.current} onChange={e => setNewGoal(g => ({ ...g, current: e.target.value }))} icon={<PiggyBank size={14} />} />
          <Input label="Fecha límite (opcional)" type="date" value={newGoal.deadline} onChange={e => setNewGoal(g => ({ ...g, deadline: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setGoalModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={handleAddGoal}>Crear meta</Button>
          </div>
        </div>
      </Modal>

      {/* Transacción de ahorro (depósito / retiro) */}
      <Modal
        open={!!savingsTxModal}
        onClose={() => setSavingsTxModal(null)}
        title={newSavingsTx.type === 'deposit' ? '⬇️ Depositar a meta' : '⬆️ Retirar de meta'}
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['deposit','withdrawal'] as SavingsTxType[]).map(t => (
              <button
                key={t}
                onClick={() => setNewSavingsTx(tx => ({ ...tx, type: t }))}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  newSavingsTx.type === t
                    ? t === 'deposit'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]'
                )}
              >
                {t === 'deposit' ? '⬇️ Depositar' : '⬆️ Retirar'}
              </button>
            ))}
          </div>
          <Input
            label="Descripción"
            placeholder="Ej: Quincena, Bono, Gasto imprevisto..."
            value={newSavingsTx.description}
            onChange={e => setNewSavingsTx(tx => ({ ...tx, description: e.target.value }))}
          />
          <Input
            label="Monto (RD$)"
            type="number"
            min={1}
            placeholder="0"
            value={newSavingsTx.amount}
            onChange={e => setNewSavingsTx(tx => ({ ...tx, amount: e.target.value }))}
            icon={<DollarSign size={14} />}
          />
          <Input
            label="Fecha"
            type="date"
            value={newSavingsTx.date}
            onChange={e => setNewSavingsTx(tx => ({ ...tx, date: e.target.value }))}
          />
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setSavingsTxModal(null)}>Cancelar</Button>
            <Button
              variant="glow"
              onClick={() => handleAddSavingsTx(savingsTxModal!)}
            >
              Guardar movimiento
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
