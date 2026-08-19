'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format, subMonths } from 'date-fns'
import {
  Wallet, Plus, Trash2, DollarSign, Check, Pencil, Target,
  ArrowUpRight, ArrowDownRight, PiggyBank, CreditCard,
  TrendingDown, Edit2, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useFinanceStore } from '@/stores/finance.store'
import { cn } from '@/lib/utils/cn'

const RESET_DAY = 29

function fmt(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n)
}
function fmtK(n: number) {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n))
}

const CAT_ICONS: Record<string, string> = {
  Comida: '🍽️', Transporte: '🚗', Entretenimiento: '🎬', Salud: '💊',
  Ropa: '👕', Servicios: '💡', Deuda: '💳', Educación: '📚', Otro: '📦', Fijo: '🔒',
}
const CATEGORIES = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Ropa', 'Servicios', 'Deuda', 'Educación', 'Otro']
const BUDGET_EMOJIS = ['🏠', '💳', '🚗', '📚', '💊', '🎬', '🛒', '🏋️', '💡', '📱', '👕', '✈️', '💰', '🎓', '🔒', '🏦']
const DEBT_COLORS = ['#EF4444', '#F59E0B', '#7C3AED', '#06B6D4', '#EC4899', '#10B981']
const GOAL_COLORS = ['#10B981', '#7C3AED', '#F59E0B', '#06B6D4', '#EC4899', '#EF4444']

type Tab = 'resumen' | 'presupuesto' | 'deudas' | 'tarjeta' | 'ahorros'
const TABS: [Tab, string][] = [
  ['resumen', 'Resumen'],
  ['presupuesto', 'Presupuesto'],
  ['deudas', 'Deudas'],
  ['tarjeta', '💳 Tarjeta'],
  ['ahorros', 'Ahorros'],
]

function BarChart({ data, limit }: { data: { label: string; amount: number }[]; limit: number }) {
  const maxVal = Math.max(...data.map(d => d.amount), limit, 1)
  return (
    <div>
      <div className="flex items-end gap-1.5 h-20">
        {data.map((d, i) => {
          const pct = (d.amount / maxVal) * 100
          const over = limit > 0 && d.amount > limit
          const isLast = i === data.length - 1
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
              {d.amount > 0 && <span className="text-[8px] text-gray-400 tabular-nums">{fmtK(d.amount)}</span>}
              <div
                className={cn('w-full rounded-t-md transition-all duration-500',
                  over ? 'bg-red-400' : isLast ? 'bg-violet-500' : 'bg-violet-200'
                )}
                style={{ height: `${Math.max(pct, d.amount > 0 ? 3 : 0)}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <p className="text-[9px] text-gray-400">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FinancePage() {
  const {
    transactions, budgets, savingsGoals, config, debts, fixedCharges,
    addTransaction, removeTransaction,
    addBudget, removeBudget, updateBudget,
    updateConfig,
    addDebt, updateDebt, removeDebt, payDebt,
    addFixedCharge, removeFixedCharge, isFixedChargePaid, payFixedCharge, unpayFixedCharge,
    addSavingsGoal, removeSavingsGoal, addSavingsTransaction,
  } = useFinanceStore()

  const [tab, setTab] = useState<Tab>('resumen')
  const [incomeModal, setIncomeModal] = useState(false)
  const [incomeVal, setIncomeVal] = useState(String(config.monthlyIncome || ''))

  // Budget
  const [editingBudget, setEditingBudget] = useState<{ oldCategory: string; category: string; icon: string; limit: string } | null>(null)
  const [addBudgetOpen, setAddBudgetOpen] = useState(false)
  const [newBudget, setNewBudget] = useState({ category: '', icon: '🏠', limit: '' })

  // Debts
  const [debtModal, setDebtModal] = useState(false)
  const [editDebtId, setEditDebtId] = useState<string | null>(null)
  const [newDebt, setNewDebt] = useState({ name: '', icon: '💳', totalOriginal: '', remaining: '', minPayment: '', color: '#EF4444' })
  const [payDebtModal, setPayDebtModal] = useState<string | null>(null)
  const [payDebtAmount, setPayDebtAmount] = useState('')

  // Fixed charges (credit card)
  const [addChargeOpen, setAddChargeOpen] = useState(false)
  const [newCharge, setNewCharge] = useState({ name: '', icon: '🔒', amount: '' })

  // Expenses
  const [expenseModal, setExpenseModal] = useState(false)
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Comida', date: format(new Date(), 'yyyy-MM-dd') })

  // Savings
  const [goalModal, setGoalModal] = useState(false)
  const [depositModal, setDepositModal] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [newGoal, setNewGoal] = useState({ name: '', target: '', icon: '🎯', color: '#10B981' })

  // Credit limit
  const [creditLimitModal, setCreditLimitModal] = useState(false)
  const [creditLimitVal, setCreditLimitVal] = useState(String(config.creditCardLimit || ''))

  // Period: resets on day 29
  const periodStart = useMemo(() => {
    const now = new Date()
    return now.getDate() >= RESET_DAY
      ? new Date(now.getFullYear(), now.getMonth(), RESET_DAY)
      : new Date(now.getFullYear(), now.getMonth() - 1, RESET_DAY)
  }, [])

  const periodEnd = useMemo(() =>
    new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, RESET_DAY - 1),
    [periodStart]
  )
  const periodLabel = `${format(periodStart, 'd MMM')} – ${format(periodEnd, 'd MMM')}`

  const periodExpenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense' && new Date(`${t.date}T12:00:00`) >= periodStart),
    [transactions, periodStart]
  )

  const spentByCategory = useMemo(() =>
    periodExpenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {} as Record<string, number>),
    [periodExpenses]
  )

  const periodTotal = periodExpenses.reduce((a, t) => a + t.amount, 0)

  const periodCreditSpent = useMemo(() =>
    periodExpenses.filter(t => t.paymentMethod === 'credit').reduce((a, t) => a + t.amount, 0),
    [periodExpenses]
  )

  const creditHistory = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i)
      const m = format(d, 'yyyy-MM')
      return {
        label: format(d, 'MMM'),
        amount: transactions.filter(t => t.type === 'expense' && t.paymentMethod === 'credit' && t.date.startsWith(m)).reduce((a, t) => a + t.amount, 0),
      }
    }),
    [transactions]
  )

  const income = config.monthlyIncome ?? 0
  const creditLimit = config.creditCardLimit ?? 0
  const totalBudget = budgets.reduce((a, b) => a + b.limit, 0)
  const totalDebtMin = debts.reduce((a, d) => a + d.minPayment, 0)
  const libre = income - totalBudget

  const recentExpenses = [...transactions]
    .filter(t => t.type === 'expense')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

  const handleSaveIncome = () => {
    const val = Number(incomeVal)
    if (val >= 0) updateConfig({ monthlyIncome: val })
    setIncomeModal(false)
  }

  const handleSaveBudget = () => {
    if (!editingBudget?.category || !editingBudget.limit) return
    removeBudget(editingBudget.oldCategory)
    addBudget({ category: editingBudget.category, icon: editingBudget.icon, limit: Number(editingBudget.limit), color: '#7C3AED' })
    setEditingBudget(null)
  }

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.limit) return
    addBudget({ category: newBudget.category, icon: newBudget.icon, limit: Number(newBudget.limit), color: '#7C3AED' })
    setAddBudgetOpen(false)
    setNewBudget({ category: '', icon: '🏠', limit: '' })
  }

  const openAddDebt = () => {
    setEditDebtId(null)
    setNewDebt({ name: '', icon: '💳', totalOriginal: '', remaining: '', minPayment: '', color: '#EF4444' })
    setDebtModal(true)
  }

  const openEditDebt = (id: string) => {
    const d = debts.find(x => x.id === id)
    if (!d) return
    setEditDebtId(id)
    setNewDebt({ name: d.name, icon: d.icon, totalOriginal: String(d.totalOriginal), remaining: String(d.remaining), minPayment: String(d.minPayment), color: d.color })
    setDebtModal(true)
  }

  const handleSaveDebt = () => {
    if (!newDebt.name || !newDebt.totalOriginal) return
    const payload = {
      name: newDebt.name, icon: newDebt.icon,
      totalOriginal: Number(newDebt.totalOriginal),
      remaining: Number(newDebt.remaining) || Number(newDebt.totalOriginal),
      minPayment: Number(newDebt.minPayment) || 0,
      color: newDebt.color,
    }
    if (editDebtId) updateDebt(editDebtId, payload)
    else addDebt(payload)
    setDebtModal(false)
    setEditDebtId(null)
  }

  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.description) return
    addTransaction({
      type: 'expense', category: newExpense.category, amount: Number(newExpense.amount),
      description: newExpense.description, date: newExpense.date, icon: CAT_ICONS[newExpense.category] ?? '📦',
    })
    setExpenseModal(false)
    setNewExpense({ description: '', amount: '', category: 'Comida', date: format(new Date(), 'yyyy-MM-dd') })
  }

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.target) return
    addSavingsGoal({ name: newGoal.name, target: Number(newGoal.target), current: 0, icon: newGoal.icon, color: newGoal.color })
    setGoalModal(false)
    setNewGoal({ name: '', target: '', icon: '🎯', color: '#10B981' })
  }

  const handleDeposit = (goalId: string) => {
    if (!depositAmount) return
    addSavingsTransaction({ goalId, type: 'deposit', amount: Number(depositAmount), description: 'Depósito', date: format(new Date(), 'yyyy-MM-dd') })
    setDepositModal(null)
    setDepositAmount('')
  }

  const saveCreditLimit = () => {
    updateConfig({ creditCardLimit: Number(creditLimitVal) || 0 })
    setCreditLimitModal(false)
  }

  const handlePayDebt = (id: string) => {
    if (!payDebtAmount) return
    payDebt(id, Number(payDebtAmount))
    setPayDebtModal(null)
    setPayDebtAmount('')
  }

  const handleAddCharge = () => {
    if (!newCharge.name || !newCharge.amount) return
    addFixedCharge({ name: newCharge.name, icon: newCharge.icon, amount: Number(newCharge.amount), paymentMethod: 'credit' })
    setAddChargeOpen(false)
    setNewCharge({ name: '', icon: '🔒', amount: '' })
  }

  const currentMonth = format(new Date(), 'yyyy-MM')

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 max-w-2xl mx-auto pb-8">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Wallet size={24} className="text-emerald-600" /> Finanzas
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Período: {periodLabel} · reinicia día {RESET_DAY}</p>
        </div>
        <Button onClick={() => setExpenseModal(true)} variant="glow" size="sm">
          <Plus size={14} /> Gasto
        </Button>
      </motion.div>

      {/* Top 3 cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <button onClick={() => { setIncomeVal(String(income || '')); setIncomeModal(true) }}
          className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-left hover:bg-emerald-100 transition-all group">
          <div className="flex items-center gap-1 mb-1">
            <ArrowUpRight size={11} className="text-emerald-600" />
            <p className="text-[10px] text-gray-500">Ingreso</p>
            <Pencil size={9} className="text-gray-300 group-hover:text-gray-500 ml-auto" />
          </div>
          <p className="text-sm font-black text-emerald-700 tabular-nums leading-tight truncate">{fmt(income)}</p>
        </button>

        <div className="p-4 rounded-2xl border border-red-200 bg-red-50">
          <div className="flex items-center gap-1 mb-1">
            <ArrowDownRight size={11} className="text-red-500" />
            <p className="text-[10px] text-gray-500">Gastos período</p>
          </div>
          <p className="text-sm font-black text-red-500 tabular-nums leading-tight truncate">{fmt(periodTotal)}</p>
        </div>

        <div className={cn('p-4 rounded-2xl border', libre >= 0 ? 'border-cyan-200 bg-cyan-50' : 'border-orange-200 bg-orange-50')}>
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown size={11} className={libre >= 0 ? 'text-cyan-600' : 'text-orange-500'} />
            <p className="text-[10px] text-gray-500">Sin asignar</p>
          </div>
          <p className={cn('text-sm font-black tabular-nums leading-tight truncate', libre >= 0 ? 'text-cyan-700' : 'text-orange-600')}>
            {fmt(libre)}
          </p>
        </div>
      </motion.div>

      {/* Credit card mini bar — always visible when limit is set */}
      {creditLimit > 0 && (
        <motion.button variants={fadeUp} onClick={() => setTab('tarjeta')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all text-left">
          <CreditCard size={15} className="text-violet-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Tarjeta este período</span>
              <span className={cn('font-bold tabular-nums', periodCreditSpent > creditLimit ? 'text-red-500' : 'text-gray-900')}>
                {fmt(periodCreditSpent)} <span className="text-gray-400 font-normal">/ {fmt(creditLimit)}</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', periodCreditSpent > creditLimit ? 'bg-red-400' : 'bg-violet-400')}
                style={{ width: `${Math.min(100, (periodCreditSpent / creditLimit) * 100)}%` }} />
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-300 shrink-0" />
        </motion.button>
      )}

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap px-1',
              tab === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ RESUMEN ══ */}
        {tab === 'resumen' && (
          <motion.div key="res" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Budget overview bar */}
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm font-bold text-gray-900">Presupuesto</p>
                <span className={cn('text-xs font-bold', libre >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {libre >= 0 ? `Libre: ${fmt(libre)}` : `Excede: ${fmt(Math.abs(libre))}`}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <motion.div className="h-full rounded-full bg-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: income > 0 ? `${Math.min(100, (totalBudget / income) * 100)}%` : '0%' }}
                  transition={{ duration: 0.7 }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
                <span>Presupuestado: {fmt(totalBudget)}</span>
                <span>Ingreso: {fmt(income)}</span>
              </div>
            </div>

            {/* Deudas quick view */}
            {debts.length > 0 && (
              <button onClick={() => setTab('deudas')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-orange-100 bg-orange-50 hover:bg-orange-100 transition-all">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900">{debts.length} deuda{debts.length > 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-gray-400">Pago mínimo: {fmt(totalDebtMin)}/mes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-black text-orange-600 tabular-nums">{fmt(debts.reduce((a, d) => a + d.remaining, 0))}</p>
                    <p className="text-[10px] text-gray-400">restante</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </button>
            )}

            {/* Recent expenses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Últimos gastos</p>
                <button onClick={() => setExpenseModal(true)} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  <Plus size={11} /> Agregar
                </button>
              </div>
              {recentExpenses.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">Sin gastos registrados</div>
              ) : recentExpenses.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 mb-1.5 group">
                  <span className="text-lg shrink-0">{tx.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{tx.description}</p>
                    <p className="text-[10px] text-gray-400">{tx.category} · {format(new Date(`${tx.date}T12:00:00`), 'd/MM')}</p>
                  </div>
                  <span className="text-sm font-bold text-red-500 shrink-0 tabular-nums">{fmt(tx.amount)}</span>
                  <button onClick={() => removeTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══ PRESUPUESTO ══ */}
        {tab === 'presupuesto' && (
          <motion.div key="bud" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">

            {/* Income — editable card */}
            <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Ingreso mensual</p>
                <p className="text-2xl font-black text-emerald-700 tabular-nums">{income > 0 ? fmt(income) : 'Sin configurar'}</p>
              </div>
              <button onClick={() => { setIncomeVal(String(income || '')); setIncomeModal(true) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold transition-all shrink-0">
                <Pencil size={12} /> Cambiar
              </button>
            </div>

            {/* Period info */}
            <p className="text-xs text-gray-400 px-1">Período: {periodLabel} · se reinicia el día {RESET_DAY}</p>

            {/* Budget item cards */}
            <div className="space-y-2">
              {budgets.map(b => {
                const spent = spentByCategory[b.category] ?? 0
                const pct = b.limit > 0 ? Math.min(100, (spent / b.limit) * 100) : 0
                const over = spent > b.limit
                const isEditing = editingBudget?.oldCategory === b.category

                if (isEditing && editingBudget) {
                  return (
                    <div key={b.category} className="p-4 rounded-2xl border-2 border-violet-300 bg-violet-50 space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        {BUDGET_EMOJIS.map(e => (
                          <button key={e} onClick={() => setEditingBudget(eb => eb ? { ...eb, icon: e } : eb)}
                            className={cn('w-8 h-8 rounded-lg text-lg transition-all', editingBudget.icon === e ? 'bg-violet-200 ring-1 ring-violet-400 scale-110' : 'bg-white')}>
                            {e}
                          </button>
                        ))}
                      </div>
                      <input className="w-full h-10 rounded-xl bg-white border border-violet-200 text-sm text-gray-900 px-3 focus:outline-none"
                        placeholder="Nombre del rubro..." value={editingBudget.category}
                        onChange={e => setEditingBudget(eb => eb ? { ...eb, category: e.target.value } : eb)} />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 shrink-0">RD$</span>
                        <input type="number" className="flex-1 h-10 rounded-xl bg-white border border-violet-200 text-base text-gray-900 px-3 focus:outline-none font-black"
                          placeholder="Monto mensual" value={editingBudget.limit}
                          onChange={e => setEditingBudget(eb => eb ? { ...eb, limit: e.target.value } : eb)} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingBudget(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-xs text-gray-500 font-medium">Cancelar</button>
                        <button onClick={handleSaveBudget} disabled={!editingBudget.category || !editingBudget.limit}
                          className="px-4 py-2 rounded-xl bg-violet-600 text-xs text-white font-bold disabled:opacity-40">Guardar</button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={b.category} className="p-4 rounded-2xl border border-gray-100 bg-white group shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-2xl mt-0.5 shrink-0">{b.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-800">{b.category}</p>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditingBudget({ oldCategory: b.category, category: b.category, icon: b.icon, limit: String(b.limit) })}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => removeBudget(b.category)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className={cn('text-xl font-black tabular-nums', over ? 'text-red-500' : 'text-gray-900')}>
                            {fmt(spent)}
                          </span>
                          <span className="text-xs text-gray-400">/ {fmt(b.limit)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', over ? 'bg-red-400' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-400')}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px]">
                      <span className={cn(over ? 'text-red-400 font-medium' : 'text-gray-400')}>
                        {over ? `⚠ Excedido ${fmt(spent - b.limit)}` : `Disponible ${fmt(b.limit - spent)}`}
                      </span>
                      <span className="text-gray-400">{Math.round(pct)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add new budget item */}
            {addBudgetOpen ? (
              <div className="p-4 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 space-y-3">
                <p className="text-xs font-bold text-violet-700">Nuevo rubro de presupuesto</p>
                <div className="flex gap-2 flex-wrap">
                  {BUDGET_EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewBudget(b => ({ ...b, icon: e }))}
                      className={cn('w-8 h-8 rounded-lg text-lg transition-all', newBudget.icon === e ? 'bg-violet-200 ring-1 ring-violet-400 scale-110' : 'bg-white')}>
                      {e}
                    </button>
                  ))}
                </div>
                <input className="w-full h-10 rounded-xl bg-white border border-violet-200 text-sm text-gray-900 px-3 focus:outline-none"
                  placeholder="Nombre (ej: Casa, Netflix, Gym...)" value={newBudget.category}
                  onChange={e => setNewBudget(b => ({ ...b, category: e.target.value }))} />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 shrink-0">RD$</span>
                  <input type="number" className="flex-1 h-10 rounded-xl bg-white border border-violet-200 text-base text-gray-900 px-3 focus:outline-none font-black"
                    placeholder="Monto mensual" value={newBudget.limit}
                    onChange={e => setNewBudget(b => ({ ...b, limit: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAddBudgetOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-xs text-gray-500 font-medium">Cancelar</button>
                  <button onClick={handleAddBudget} disabled={!newBudget.category || !newBudget.limit}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-xs text-white font-bold disabled:opacity-40">Agregar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddBudgetOpen(true)}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all flex items-center justify-center gap-2">
                <Plus size={18} /> <span className="text-sm font-medium">Agregar rubro</span>
              </button>
            )}

            {/* Totals row */}
            {budgets.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="p-3 rounded-xl border border-violet-100 bg-violet-50">
                  <p className="text-[10px] text-gray-400 mb-0.5">Total presupuestado</p>
                  <p className="text-base font-black text-violet-700 tabular-nums">{fmt(totalBudget)}</p>
                </div>
                <div className={cn('p-3 rounded-xl border', libre >= 0 ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50')}>
                  <p className="text-[10px] text-gray-400 mb-0.5">{libre >= 0 ? 'Sin asignar' : 'Excede ingreso'}</p>
                  <p className={cn('text-base font-black tabular-nums', libre >= 0 ? 'text-emerald-700' : 'text-red-500')}>{fmt(Math.abs(libre))}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ DEUDAS ══ */}
        {tab === 'deudas' && (
          <motion.div key="deu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">

            {debts.length === 0 ? (
              <div className="text-center py-14">
                <span className="text-5xl block mb-3">📋</span>
                <p className="text-gray-500 text-sm mb-4">Sin deudas registradas</p>
                <Button variant="glow" size="sm" onClick={openAddDebt}><Plus size={14} /> Agregar deuda</Button>
              </div>
            ) : (
              <>
                {/* Total summary */}
                <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Total restante</p>
                      <p className="text-2xl font-black text-orange-600 tabular-nums">{fmt(debts.reduce((a, d) => a + d.remaining, 0))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Pago mínimo/mes</p>
                      <p className="text-lg font-black text-gray-700 tabular-nums">{fmt(totalDebtMin)}</p>
                    </div>
                  </div>
                </div>

                {/* Debt cards */}
                {debts.map(debt => {
                  const paid = debt.totalOriginal - debt.remaining
                  const pct = debt.totalOriginal > 0 ? Math.min(100, (paid / debt.totalOriginal) * 100) : 0
                  return (
                    <div key={debt.id} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm group">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl mt-0.5 shrink-0">{debt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-gray-900">{debt.name}</p>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => openEditDebt(debt.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => removeDebt(debt.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-red-500 tabular-nums">{fmt(debt.remaining)}</span>
                            <span className="text-xs text-gray-400">restante de {fmt(debt.totalOriginal)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: debt.color }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} />
                      </div>
                      <div className="flex justify-between mt-1.5 text-[10px]">
                        <span className="text-gray-400">{Math.round(pct)}% pagado · {fmt(paid)} pagado</span>
                        {debt.minPayment > 0 && <span className="text-gray-500 font-medium">Mínimo: {fmt(debt.minPayment)}/mes</span>}
                      </div>
                      <button
                        onClick={() => { setPayDebtModal(debt.id); setPayDebtAmount('') }}
                        className="mt-3 w-full py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold border border-orange-200 transition-all flex items-center justify-center gap-1.5">
                        <Plus size={12} /> Registrar pago
                      </button>
                    </div>
                  )
                })}
              </>
            )}

            <button onClick={openAddDebt}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
              <Plus size={18} /> <span className="text-sm font-medium">Agregar deuda</span>
            </button>
          </motion.div>
        )}

        {/* ══ TARJETA ══ */}
        {tab === 'tarjeta' && (
          <motion.div key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Monthly limit */}
            <div className="p-4 rounded-2xl border border-violet-100 bg-violet-50 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Límite mensual de tarjeta</p>
                <p className="text-2xl font-black text-violet-700 tabular-nums">
                  {creditLimit > 0 ? fmt(creditLimit) : <span className="text-base text-gray-400">Sin configurar</span>}
                </p>
              </div>
              <button onClick={() => { setCreditLimitVal(String(creditLimit || '')); setCreditLimitModal(true) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-700 text-xs font-bold transition-all shrink-0">
                <Pencil size={12} /> Cambiar
              </button>
            </div>

            {/* Usage this period */}
            {creditLimit > 0 && (
              <div className={cn('p-4 rounded-2xl border', periodCreditSpent > creditLimit ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50')}>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Usado este período</p>
                    <p className={cn('text-2xl font-black tabular-nums', periodCreditSpent > creditLimit ? 'text-red-500' : 'text-gray-900')}>
                      {fmt(periodCreditSpent)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Disponible</p>
                    <p className={cn('text-xl font-black tabular-nums', creditLimit - periodCreditSpent < 0 ? 'text-red-500' : 'text-emerald-600')}>
                      {fmt(Math.max(0, creditLimit - periodCreditSpent))}
                    </p>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', periodCreditSpent > creditLimit ? 'bg-red-400' : 'bg-violet-500')}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (periodCreditSpent / creditLimit) * 100)}%` }}
                    transition={{ duration: 0.7 }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  {periodLabel} · {Math.round((periodCreditSpent / creditLimit) * 100)}% del límite usado
                </p>
              </div>
            )}

            {/* Free money breakdown */}
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Dinero libre</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ingreso mensual</span>
                  <span className="font-bold text-emerald-600 tabular-nums">+{fmt(income)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Presupuesto fijo</span>
                  <span className="font-bold text-gray-500 tabular-nums">-{fmt(totalBudget)}</span>
                </div>
                {totalDebtMin > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pagos mínimos deudas</span>
                    <span className="font-bold text-orange-500 tabular-nums">-{fmt(totalDebtMin)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-sm font-bold text-gray-900">Disponible real</span>
                  <span className={cn('text-lg font-black tabular-nums', (libre - totalDebtMin) >= 0 ? 'text-emerald-700' : 'text-red-500')}>
                    {fmt(Math.max(0, libre - totalDebtMin))}
                  </span>
                </div>
              </div>
            </div>

            {/* Fixed charges on credit card */}
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gastos fijos de tarjeta</p>
                <p className="text-[10px] text-gray-400">Se cuentan en el uso del período</p>
              </div>

              {fixedCharges.length === 0 && !addChargeOpen && (
                <p className="text-xs text-gray-400 py-2 text-center">Sin gastos fijos registrados</p>
              )}

              {fixedCharges.map(fc => {
                const paid = isFixedChargePaid(fc.id, currentMonth)
                return (
                  <div key={fc.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white">
                    <span className="text-xl shrink-0">{fc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{fc.name}</p>
                      <p className="text-xs text-gray-400 tabular-nums">{fmt(fc.amount)}/mes</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => paid ? unpayFixedCharge(fc.id) : payFixedCharge(fc.id)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                          paid ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-700'
                        )}>
                        {paid ? '✓ Pagado' : 'Marcar pagado'}
                      </button>
                      <button onClick={() => removeFixedCharge(fc.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}

              {addChargeOpen ? (
                <div className="p-3 rounded-xl border border-violet-200 bg-violet-50 space-y-2 mt-1">
                  <div className="flex gap-2">
                    {['🔒', '📱', '🎬', '🏋️', '🎵', '☁️', '📦', '🌐'].map(e => (
                      <button key={e} onClick={() => setNewCharge(c => ({ ...c, icon: e }))}
                        className={cn('w-8 h-8 rounded-lg text-lg', newCharge.icon === e ? 'bg-violet-200 ring-1 ring-violet-400' : 'bg-white')}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <input className="w-full h-9 rounded-xl bg-white border border-violet-200 text-sm text-gray-900 px-3 focus:outline-none"
                    placeholder="Nombre (Netflix, Spotify, Gym...)" value={newCharge.name}
                    onChange={e => setNewCharge(c => ({ ...c, name: e.target.value }))} />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 shrink-0">RD$</span>
                    <input type="number" className="flex-1 h-9 rounded-xl bg-white border border-violet-200 text-sm text-gray-900 px-3 focus:outline-none font-bold"
                      placeholder="Monto mensual" value={newCharge.amount}
                      onChange={e => setNewCharge(c => ({ ...c, amount: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setAddChargeOpen(false)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs text-gray-500">Cancelar</button>
                    <button onClick={handleAddCharge} disabled={!newCharge.name || !newCharge.amount}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 text-xs text-white font-bold disabled:opacity-40">Agregar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddChargeOpen(true)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all text-xs flex items-center justify-center gap-1.5">
                  <Plus size={13} /> Agregar gasto fijo de tarjeta
                </button>
              )}
            </div>

            {/* 6-month chart */}
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gasto en tarjeta — 6 meses</p>
                {creditLimit > 0 && (
                  <span className="text-[10px] text-gray-400">Límite: {fmt(creditLimit)}</span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mb-4">Registra gastos con pago "crédito" para verlos aquí</p>
              {creditHistory.every(m => m.amount === 0) ? (
                <div className="text-center py-6 text-gray-300 text-xs">Sin datos de tarjeta aún</div>
              ) : (
                <>
                  <BarChart data={creditHistory} limit={creditLimit} />
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-violet-500" /> Este mes</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-violet-200" /> Meses anteriores</div>
                    {creditLimit > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-400" /> Excede límite</div>}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ AHORROS ══ */}
        {tab === 'ahorros' && (
          <motion.div key="sav" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            {savingsGoals.length === 0 ? (
              <div className="text-center py-14">
                <PiggyBank size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 text-sm mb-4">Sin metas de ahorro</p>
                <Button variant="glow" size="sm" onClick={() => setGoalModal(true)}><Plus size={14} /> Crear meta</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {savingsGoals.map(goal => {
                  const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0
                  const done = goal.current >= goal.target
                  return (
                    <div key={goal.id} className={cn('p-4 rounded-2xl border transition-all group', done ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-white shadow-sm')}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{goal.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{goal.name}</p>
                          <p className="text-xs text-gray-500">{fmt(goal.current)} de {fmt(goal.target)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!done && (
                            <button onClick={() => { setDepositModal(goal.id); setDepositAmount('') }}
                              className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium"
                              style={{ background: `${goal.color}18`, color: goal.color }}>
                              <Plus size={11} /> Agregar
                            </button>
                          )}
                          <button onClick={() => removeSavingsGoal(goal.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: done ? '#10B981' : goal.color }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} />
                      </div>
                      <div className="flex justify-between mt-1.5 text-[10px]">
                        <span className="text-gray-400">{Math.round(pct)}%</span>
                        {done ? <span className="text-emerald-600 font-bold">✓ Meta alcanzada</span>
                          : <span className="text-gray-400">Faltan {fmt(goal.target - goal.current)}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <button onClick={() => setGoalModal(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:text-emerald-500 hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">
              <Plus size={18} /> <span className="text-sm font-medium">Nueva meta de ahorro</span>
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
            <label className="text-sm text-gray-700 font-medium block mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setNewExpense(x => ({ ...x, category: cat }))}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    newExpense.category === cat ? 'bg-violet-100 text-violet-700 border border-violet-300' : 'bg-gray-100 text-gray-500 hover:text-gray-700')}>
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-700 font-medium block mb-1.5">Fecha</label>
            <input type="date" value={newExpense.date} onChange={e => setNewExpense(x => ({ ...x, date: e.target.value }))}
              className="w-full h-10 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 px-3 focus:outline-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setExpenseModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newExpense.amount || !newExpense.description} onClick={handleAddExpense}>
              <Plus size={14} /> Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deuda */}
      <Modal open={debtModal} onClose={() => setDebtModal(false)} title={editDebtId ? 'Editar Deuda' : 'Agregar Deuda'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Ícono</label>
            <div className="flex gap-2 flex-wrap">
              {['💳', '🏦', '🏠', '🚗', '📱', '💰', '🏪', '📋'].map(e => (
                <button key={e} onClick={() => setNewDebt(d => ({ ...d, icon: e }))}
                  className={cn('w-10 h-10 rounded-xl text-2xl transition-all', newDebt.icon === e ? 'bg-violet-100 ring-1 ring-violet-300 scale-105' : 'bg-gray-100')}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Input label="Nombre" placeholder="Tarjeta Visa, Préstamo banco..."
            value={newDebt.name} onChange={e => setNewDebt(d => ({ ...d, name: e.target.value }))} />
          <Input label="Total original (RD$)" type="number" placeholder="0" icon={<DollarSign size={14} />}
            value={newDebt.totalOriginal} onChange={e => setNewDebt(d => ({ ...d, totalOriginal: e.target.value }))} />
          <Input label="Restante actual (RD$)" type="number" placeholder="0" icon={<DollarSign size={14} />}
            value={newDebt.remaining} onChange={e => setNewDebt(d => ({ ...d, remaining: e.target.value }))} />
          <Input label="Pago mínimo mensual (RD$)" type="number" placeholder="0" icon={<DollarSign size={14} />}
            value={newDebt.minPayment} onChange={e => setNewDebt(d => ({ ...d, minPayment: e.target.value }))} />
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Color</label>
            <div className="flex gap-2">
              {DEBT_COLORS.map(c => (
                <button key={c} onClick={() => setNewDebt(d => ({ ...d, color: c }))}
                  className={cn('w-7 h-7 rounded-full transition-all', newDebt.color === c ? 'ring-2 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDebtModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!newDebt.name || !newDebt.totalOriginal} onClick={handleSaveDebt}>
              <Check size={14} /> {editDebtId ? 'Guardar cambios' : 'Agregar deuda'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Meta de ahorro */}
      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Nueva Meta de Ahorro">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {['🎯', '🏠', '✈️', '🚗', '💍', '📱', '💻', '🎓', '🏝️', '💰'].map(e => (
                <button key={e} onClick={() => setNewGoal(g => ({ ...g, icon: e }))}
                  className={cn('w-9 h-9 rounded-lg text-xl transition-all', newGoal.icon === e ? 'bg-emerald-100 ring-1 ring-emerald-300 scale-110' : 'bg-gray-100')}>
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
            <label className="text-xs text-gray-500 mb-2 block">Color</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c} onClick={() => setNewGoal(g => ({ ...g, color: c }))}
                  className={cn('w-7 h-7 rounded-full transition-all', newGoal.color === c ? 'ring-2 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100')}
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

      {/* Cambiar ingreso */}
      <Modal open={incomeModal} onClose={() => setIncomeModal(false)} title="Ingreso mensual">
        <div className="space-y-4">
          <Input label="Ingreso mensual (RD$)" type="number" placeholder="0" icon={<DollarSign size={14} />}
            value={incomeVal} onChange={e => setIncomeVal(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSaveIncome()} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setIncomeModal(false)}>Cancelar</Button>
            <Button variant="glow" disabled={!incomeVal} onClick={handleSaveIncome}>
              <Check size={14} /> Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Límite tarjeta */}
      <Modal open={creditLimitModal} onClose={() => setCreditLimitModal(false)} title="Límite de tarjeta">
        <div className="space-y-4">
          <Input label="Límite mensual (RD$)" type="number" placeholder="0" icon={<DollarSign size={14} />}
            value={creditLimitVal} onChange={e => setCreditLimitVal(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && saveCreditLimit()} />
          <p className="text-xs text-gray-400">Cuánto quieres gastar máximo en tu tarjeta de crédito cada mes</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setCreditLimitModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={saveCreditLimit}>
              <Check size={14} /> Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pagar deuda */}
      <Modal open={!!payDebtModal} onClose={() => setPayDebtModal(null)} title="Registrar pago">
        {payDebtModal && (() => {
          const debt = debts.find(d => d.id === payDebtModal)
          return (
            <div className="space-y-4">
              {debt && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <span className="text-2xl">{debt.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{debt.name}</p>
                    <p className="text-xs text-gray-400">Restante: {fmt(debt.remaining)}</p>
                  </div>
                </div>
              )}
              <Input label="Monto pagado (RD$)" type="number" placeholder="0" icon={<DollarSign size={14} />}
                value={payDebtAmount} onChange={e => setPayDebtAmount(e.target.value)} />
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setPayDebtModal(null)}>Cancelar</Button>
                <Button variant="glow" disabled={!payDebtAmount} onClick={() => payDebtModal && handlePayDebt(payDebtModal)}>
                  <Check size={14} /> Registrar pago
                </Button>
              </div>
            </div>
          )
        })()}
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
