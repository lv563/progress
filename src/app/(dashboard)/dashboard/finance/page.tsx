'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format } from 'date-fns'
import { Wallet, Plus, Trash2, DollarSign, Check, Pencil, Target, ArrowUpRight, ArrowDownRight, PiggyBank } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useFinanceStore } from '@/stores/finance.store'
import { cn } from '@/lib/utils/cn'

function fmt(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n)
}

const CAT_ICONS: Record<string, string> = {
  Comida: '🍽️', Transporte: '🚗', Entretenimiento: '🎬', Salud: '💊',
  Ropa: '👕', Servicios: '💡', Deuda: '💳', Educación: '📚', Otro: '📦',
}
const CATEGORIES = Object.keys(CAT_ICONS)
const GOAL_COLORS = ['#10B981', '#7C3AED', '#F59E0B', '#06B6D4', '#EC4899', '#EF4444']

type Tab = 'resumen' | 'presupuesto' | 'gastos' | 'ahorros'

export default function FinancePage() {
  const {
    transactions, budgets, savingsGoals, config,
    addTransaction, removeTransaction,
    addBudget, removeBudget, updateBudget,
    updateConfig,
    addSavingsGoal, removeSavingsGoal, addSavingsTransaction,
    getMonthlyExpenses,
  } = useFinanceStore()

  const [tab, setTab] = useState<Tab>('resumen')
  const [incomeEdit, setIncomeEdit] = useState(false)
  const [incomeVal, setIncomeVal] = useState(String(config.monthlyIncome || ''))
  const [expenseModal, setExpenseModal] = useState(false)
  const [budgetModal, setBudgetModal] = useState(false)
  const [goalModal, setGoalModal] = useState(false)
  const [depositModal, setDepositModal] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Comida', date: format(new Date(), 'yyyy-MM-dd') })
  const [newBudget, setNewBudget] = useState({ category: '', icon: '📦', amount: '' })
  const [newGoal, setNewGoal] = useState({ name: '', target: '', icon: '🎯', color: '#10B981' })

  const income = config.monthlyIncome ?? 0
  const expenses = getMonthlyExpenses()
  const balance = income - expenses
  const totalBudget = budgets.reduce((a, b) => a + b.limit, 0)
  const remaining = income - totalBudget

  // This month's expenses
  const thisMonth = format(new Date(), 'yyyy-MM')
  const monthExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(thisMonth))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleSaveIncome = () => {
    const val = Number(incomeVal)
    if (val >= 0) updateConfig({ monthlyIncome: val })
    setIncomeEdit(false)
  }

  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.description) return
    addTransaction({
      type: 'expense',
      category: newExpense.category,
      amount: Number(newExpense.amount),
      description: newExpense.description,
      date: newExpense.date,
      icon: CAT_ICONS[newExpense.category] ?? '📦',
    })
    setExpenseModal(false)
    setNewExpense({ description: '', amount: '', category: 'Comida', date: format(new Date(), 'yyyy-MM-dd') })
  }

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.amount) return
    addBudget({ category: newBudget.category, icon: CAT_ICONS[newBudget.category] ?? newBudget.icon, limit: Number(newBudget.amount), color: '#7C3AED' })
    setBudgetModal(false)
    setNewBudget({ category: '', icon: '📦', amount: '' })
  }

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.target) return
    addSavingsGoal({ name: newGoal.name, target: Number(newGoal.target), current: 0, icon: newGoal.icon, color: newGoal.color })
    setGoalModal(false)
    setNewGoal({ name: '', target: '', icon: '🎯', color: '#10B981' })
  }

  const handleDeposit = (goalId: string) => {
    if (!depositAmount) return
    const amt = Number(depositAmount)
    addSavingsTransaction({ goalId, type: 'deposit', amount: amt, description: 'Depósito', date: format(new Date(), 'yyyy-MM-dd') })
    setDepositModal(null)
    setDepositAmount('')
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Wallet size={24} className="text-emerald-400" /> Finanzas
        </h1>
        <Button onClick={() => setExpenseModal(true)} variant="glow" size="sm">
          <Plus size={14} /> Gasto
        </Button>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {/* Income */}
        <button
          onClick={() => { setIncomeEdit(true); setIncomeVal(String(income || '')) }}
          className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] text-left hover:bg-emerald-500/[0.08] transition-all group"
        >
          <div className="flex items-center gap-1 mb-1">
            <ArrowUpRight size={11} className="text-emerald-400" />
            <p className="text-[10px] text-slate-500">Ingreso</p>
            <Pencil size={9} className="text-slate-700 group-hover:text-slate-500 ml-auto transition-colors" />
          </div>
          {incomeEdit ? (
            <input autoFocus type="number" value={incomeVal} onChange={e => setIncomeVal(e.target.value)}
              onBlur={handleSaveIncome} onKeyDown={e => e.key === 'Enter' && handleSaveIncome()}
              className="w-full bg-transparent text-base font-black text-emerald-400 focus:outline-none" />
          ) : (
            <p className="text-sm font-black text-emerald-400 tabular-nums leading-tight truncate">{fmt(income)}</p>
          )}
        </button>

        {/* Expenses */}
        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/[0.05]">
          <div className="flex items-center gap-1 mb-1">
            <ArrowDownRight size={11} className="text-red-400" />
            <p className="text-[10px] text-slate-500">Gastos</p>
          </div>
          <p className="text-sm font-black text-red-400 tabular-nums leading-tight truncate">{fmt(expenses)}</p>
        </div>

        {/* Balance */}
        <div className={cn('p-4 rounded-2xl border', balance >= 0 ? 'border-cyan-500/20 bg-cyan-500/[0.05]' : 'border-orange-500/20 bg-orange-500/[0.05]')}>
          <div className="flex items-center gap-1 mb-1">
            <DollarSign size={11} className={balance >= 0 ? 'text-cyan-400' : 'text-orange-400'} />
            <p className="text-[10px] text-slate-500">Balance</p>
          </div>
          <p className={cn('text-sm font-black tabular-nums leading-tight truncate', balance >= 0 ? 'text-cyan-400' : 'text-orange-400')}>
            {fmt(balance)}
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        {([['resumen', 'Resumen'], ['presupuesto', 'Presupuesto'], ['gastos', 'Gastos'], ['ahorros', 'Ahorros']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all', tab === id ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200')}>
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ RESUMEN ══ */}
        {tab === 'resumen' && (
          <motion.div key="res" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            {/* Budget vs income */}
            <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex justify-between mb-3">
                <p className="text-sm font-semibold text-white">Presupuesto total</p>
                <div className={cn('text-xs font-bold', remaining >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {remaining >= 0 ? `Libre: ${fmt(remaining)}` : `Excede: ${fmt(Math.abs(remaining))}`}
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div className="h-full rounded-full bg-violet-500"
                  style={{ maxWidth: '100%' }}
                  initial={{ width: 0 }}
                  animate={{ width: income > 0 ? `${Math.min(100, (totalBudget / income) * 100)}%` : '0%' }}
                  transition={{ duration: 0.7 }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                <span>Presupuestado: {fmt(totalBudget)}</span>
                <span>Ingreso: {fmt(income)}</span>
              </div>
            </div>

            {/* Recent expenses */}
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-2">Gastos recientes</p>
              {monthExpenses.slice(0, 6).length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-sm">Sin gastos este mes</div>
              ) : monthExpenses.slice(0, 6).map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-1.5 group">
                  <span className="text-lg shrink-0">{tx.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{tx.description}</p>
                    <p className="text-[10px] text-slate-600">{tx.category} · {format(new Date(tx.date), 'd/MM')}</p>
                  </div>
                  <span className="text-sm font-bold text-red-400 shrink-0">{fmt(tx.amount)}</span>
                  <button onClick={() => removeTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {monthExpenses.length > 6 && (
                <button onClick={() => setTab('gastos')} className="text-xs text-slate-600 hover:text-slate-400 transition-colors w-full text-center mt-1">
                  Ver todos ({monthExpenses.length}) →
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ PRESUPUESTO ══ */}
        {tab === 'presupuesto' && (
          <motion.div key="bud" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            {/* Income banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <span className="text-xs text-slate-500">Ingreso mensual</span>
              <span className="text-sm font-black text-emerald-400">{fmt(income)}</span>
            </div>

            {budgets.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm mb-3">Sin categorías de presupuesto</p>
                <Button variant="glow" size="sm" onClick={() => setBudgetModal(true)}><Plus size={14} /> Agregar categoría</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {budgets.map(b => (
                  <div key={b.category} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] group">
                    <span className="text-lg shrink-0">{b.icon}</span>
                    <span className="text-sm text-white flex-1">{b.category}</span>
                    <span className="text-sm font-bold text-violet-300 tabular-nums">{fmt(b.limit)}</span>
                    <button onClick={() => removeBudget(b.category)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.06]">
              <span className="text-sm font-bold text-white">Total presupuestado</span>
              <span className="text-lg font-black text-violet-300 tabular-nums">{fmt(totalBudget)}</span>
            </div>
            {income > 0 && (
              <div className={cn('flex items-center justify-between px-4 py-3 rounded-xl border', remaining >= 0 ? 'border-emerald-500/20 bg-emerald-500/[0.05]' : 'border-red-500/20 bg-red-500/[0.05]')}>
                <span className="text-sm text-slate-400">{remaining >= 0 ? 'Sin asignar' : 'Excede ingreso'}</span>
                <span className={cn('text-base font-black tabular-nums', remaining >= 0 ? 'text-emerald-400' : 'text-red-400')}>{fmt(Math.abs(remaining))}</span>
              </div>
            )}

            <button onClick={() => setBudgetModal(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.1] text-slate-600 hover:text-slate-400 hover:border-white/[0.2] transition-all text-sm flex items-center justify-center gap-2">
              <Plus size={14} /> Agregar categoría
            </button>
          </motion.div>
        )}

        {/* ══ GASTOS ══ */}
        {tab === 'gastos' && (
          <motion.div key="exp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">{monthExpenses.length} gastos este mes · {fmt(expenses)}</p>
              <button onClick={() => setExpenseModal(true)}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">
                <Plus size={12} /> Agregar
              </button>
            </div>
            {monthExpenses.length === 0 ? (
              <div className="text-center py-14 text-slate-600">
                <p className="text-sm mb-3">Sin gastos este mes</p>
                <Button variant="glow" size="sm" onClick={() => setExpenseModal(true)}><Plus size={14} /> Registrar gasto</Button>
              </div>
            ) : monthExpenses.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] group">
                <span className="text-lg shrink-0">{tx.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{tx.description}</p>
                  <p className="text-[10px] text-slate-600">{tx.category} · {format(new Date(tx.date), 'd/MM')}</p>
                </div>
                <span className="text-sm font-bold text-red-400 tabular-nums shrink-0">{fmt(tx.amount)}</span>
                <button onClick={() => removeTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* ══ AHORROS ══ */}
        {tab === 'ahorros' && (
          <motion.div key="sav" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            {savingsGoals.length === 0 ? (
              <div className="text-center py-14">
                <PiggyBank size={36} className="mx-auto text-slate-700 mb-2" />
                <p className="text-slate-500 text-sm mb-3">Sin metas de ahorro</p>
                <Button variant="glow" size="sm" onClick={() => setGoalModal(true)}><Plus size={14} /> Crear meta</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {savingsGoals.map(goal => {
                  const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0
                  const done = goal.current >= goal.target
                  return (
                    <div key={goal.id} className={cn(
                      'p-4 rounded-2xl border transition-all group',
                      done ? 'border-emerald-500/25 bg-emerald-500/[0.05]' : 'border-white/[0.06] bg-white/[0.02]'
                    )}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{goal.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{goal.name}</p>
                          <p className="text-xs text-slate-500">{fmt(goal.current)} de {fmt(goal.target)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!done && (
                            <button onClick={() => { setDepositModal(goal.id); setDepositAmount('') }}
                              className="text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                              style={{ background: `${goal.color}20`, color: goal.color }}>
                              <Plus size={11} /> Agregar
                            </button>
                          )}
                          <button onClick={() => removeSavingsGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: done ? '#10B981' : goal.color }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-slate-600">{Math.round(pct)}%</span>
                        {done && <span className="text-[10px] text-emerald-400 font-bold">✓ Meta alcanzada</span>}
                        {!done && <span className="text-[10px] text-slate-600">Faltan {fmt(goal.target - goal.current)}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <button onClick={() => setGoalModal(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.1] text-slate-600 hover:text-slate-400 hover:border-white/[0.2] transition-all text-sm flex items-center justify-center gap-2">
              <Plus size={14} /> Nueva meta de ahorro
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ MODALS ════ */}

      {/* Gasto */}
      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="Registrar Gasto">
        <div className="space-y-4">
          <Input label="Descripción" placeholder="Supermercado, gasolina..."
            value={newExpense.description} onChange={e => setNewExpense(x => ({ ...x, description: e.target.value }))} />
          <Input label="Monto (RD$)" type="number" placeholder="0" icon={<DollarSign size={14} />}
            value={newExpense.amount} onChange={e => setNewExpense(x => ({ ...x, amount: e.target.value }))} />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setNewExpense(x => ({ ...x, category: cat }))}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    newExpense.category === cat ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40' : 'bg-white/[0.04] text-slate-500 hover:text-slate-300')}>
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Fecha</label>
            <input type="date" value={newExpense.date} onChange={e => setNewExpense(x => ({ ...x, date: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-3 focus:outline-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setExpenseModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newExpense.amount || !newExpense.description} onClick={handleAddExpense}>
              <Plus size={14} /> Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Categoría presupuesto */}
      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Categoría de Presupuesto">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setNewBudget(b => ({ ...b, category: cat, icon: CAT_ICONS[cat] }))}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    newBudget.category === cat ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40' : 'bg-white/[0.04] text-slate-500 hover:text-slate-300')}>
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
          <Input label="Monto mensual (RD$)" type="number" placeholder="5000" icon={<DollarSign size={14} />}
            value={newBudget.amount} onChange={e => setNewBudget(b => ({ ...b, amount: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setBudgetModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newBudget.category || !newBudget.amount} onClick={handleAddBudget}>
              <Plus size={14} /> Agregar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Meta de ahorro */}
      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Nueva Meta de Ahorro">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Emoji</label>
            <div className="flex gap-2">
              {['🎯', '🏠', '✈️', '🚗', '💍', '📱', '💻', '🎓', '🏝️', '💰'].map(e => (
                <button key={e} onClick={() => setNewGoal(g => ({ ...g, icon: e }))}
                  className={cn('w-9 h-9 rounded-lg text-xl transition-all', newGoal.icon === e ? 'bg-emerald-500/20 ring-1 ring-emerald-500/40 scale-110' : 'bg-white/[0.04]')}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Input label="Nombre de la meta" placeholder="Casa propia, Viaje, Fondo de emergencia..."
            value={newGoal.name} onChange={e => setNewGoal(g => ({ ...g, name: e.target.value }))} />
          <Input label="Meta (RD$)" type="number" placeholder="100000" icon={<DollarSign size={14} />}
            value={newGoal.target} onChange={e => setNewGoal(g => ({ ...g, target: e.target.value }))} />
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Color</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c} onClick={() => setNewGoal(g => ({ ...g, color: c }))}
                  className={cn('w-7 h-7 rounded-full transition-all', newGoal.color === c ? 'ring-2 ring-white/60 scale-110' : 'opacity-60 hover:opacity-100')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setGoalModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newGoal.name || !newGoal.target} onClick={handleAddGoal}>
              <Target size={14} /> Crear meta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Depositar a meta */}
      <Modal open={!!depositModal} onClose={() => setDepositModal(null)} title="Agregar a la meta">
        <div className="space-y-4">
          <Input label="Monto a agregar (RD$)" type="number" placeholder="0" icon={<DollarSign size={14} />}
            value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDepositModal(null)}>Cancelar</Button>
            <Button variant="glow" disabled={!depositAmount} onClick={() => depositModal && handleDeposit(depositModal)}>
              <Check size={14} /> Agregar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
