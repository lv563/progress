'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format, subMonths } from 'date-fns'
import {
  Wallet, Plus, Trash2, DollarSign, Check, Pencil, Target,
  ArrowUpRight, ArrowDownRight, PiggyBank, CreditCard,
  TrendingUp, TrendingDown, AlertTriangle, FileText, ChevronRight,
} from 'lucide-react'
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
  Ropa: '👕', Servicios: '💡', Deuda: '💳', Educación: '📚', Otro: '📦', Fijo: '🔒',
}
const CATEGORIES = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Ropa', 'Servicios', 'Deuda', 'Educación', 'Otro']
const GOAL_COLORS = ['#10B981', '#7C3AED', '#F59E0B', '#06B6D4', '#EC4899', '#EF4444']

const CAT_KEYWORDS: [string, string[]][] = [
  ['Comida', ['super', 'nacional', 'jumbo', 'sirena', 'ollie', 'pizza', 'burger', 'restaurant', 'food', 'domino', 'subway', 'mcdonald', 'wendy', 'kfc', 'pollo', 'panaderia', 'colmado', 'deli', 'comida']],
  ['Transporte', ['shell', 'texaco', 'gulf', 'gasolinera', 'uber', 'gasolina', 'parking', 'peaje', 'carwash', 'taxi', 'combustible']],
  ['Entretenimiento', ['netflix', 'spotify', 'disney', 'amazon', 'youtube', 'twitch', 'hbo', 'paramount', 'cine', 'juego', 'apple music', 'deezer']],
  ['Salud', ['farmacia', 'clinica', 'medico', 'doctor', 'hospital', 'dental', 'laboratorio', 'carol', 'salud', 'gym', 'gimnasio', 'fitness']],
  ['Ropa', ['zara', 'h&m', 'mango', 'primark', 'nike', 'adidas', 'puma', 'ropa', 'clothing', 'fashion', 'tienda']],
  ['Servicios', ['claro', 'altice', 'wind', 'tricom', 'internet', 'agua', 'luz', 'edesur', 'edenorte', 'edeste', 'telefon', 'electric', 'caasd']],
  ['Deuda', ['interes', 'mora', 'cargo financiero', 'finance charge', 'interest', 'late fee', 'pago minimo', 'cargo por', 'interés']],
  ['Educación', ['universidad', 'colegio', 'escuela', 'libro', 'curso', 'udemy', 'coursera', 'platzi', 'educa', 'duolingo']],
]

function autoCategorize(desc: string): string {
  const lower = desc.toLowerCase()
  for (const [cat, keywords] of CAT_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return cat
  }
  return 'Otro'
}

interface ParsedRow {
  id: string
  date: string
  description: string
  amount: number
  category: string
  selected: boolean
}

function parseStatement(text: string): ParsedRow[] {
  const rows: ParsedRow[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let idx = 0

  for (const line of lines) {
    const m = line.match(/^(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})\s+(.+?)\s+([\d,]+\.?\d{0,2})\s*$/)
    if (!m) continue
    const [, rawDate, desc, rawAmt] = m
    const amount = parseFloat(rawAmt.replace(/,/g, ''))
    if (isNaN(amount) || amount <= 0) continue

    let date = rawDate
    const parts = rawDate.split(/[-/]/)
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        date = rawDate
      } else if (parts[2].length === 4) {
        date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      } else {
        const yr = parseInt(parts[2]) < 50 ? `20${parts[2]}` : `19${parts[2]}`
        date = `${yr}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
      }
    }

    rows.push({ id: `p${idx++}`, date, description: desc.trim(), amount, category: autoCategorize(desc), selected: true })
  }
  return rows
}

function detectIssues(rows: ParsedRow[], prevCredit: number): string[] {
  const issues: string[] = []

  const debtRows = rows.filter(r => r.category === 'Deuda')
  if (debtRows.length > 0) {
    const total = debtRows.reduce((a, r) => a + r.amount, 0)
    issues.push(`💸 Cargos de interés/mora: ${fmt(total)} — dinero que pierdes por no pagar el saldo completo`)
  }

  const groups: Record<string, ParsedRow[]> = {}
  rows.forEach(r => {
    const key = r.description.slice(0, 15).toLowerCase()
    groups[key] = [...(groups[key] || []), r]
  })
  const hormiga = Object.entries(groups).filter(([, g]) => g.length >= 3 && (g.reduce((a, r) => a + r.amount, 0) / g.length) < 600)
  if (hormiga.length > 0) {
    const total = hormiga.flatMap(([, g]) => g).reduce((a, r) => a + r.amount, 0)
    issues.push(`☕ Gastos hormiga: ${hormiga.length} comercio(s) con compras pequeñas frecuentes — ${fmt(total)} en total`)
  }

  const total = rows.reduce((a, r) => a + r.amount, 0)
  if (prevCredit > 0 && total > prevCredit * 1.2) {
    const pct = Math.round(((total - prevCredit) / prevCredit) * 100)
    issues.push(`📈 Gasto con tarjeta ${pct}% mayor que el período anterior`)
  }

  const subs = rows.filter(r => r.category === 'Entretenimiento')
  if (subs.length >= 3) {
    issues.push(`📱 ${subs.length} suscripciones en un período — revisa cuáles realmente usas`)
  }

  return issues
}

function getRecommendations(rows: ParsedRow[], issues: string[]): string[] {
  const recs: string[] = []
  const byCat = rows.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + r.amount; return acc }, {} as Record<string, number>)
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]

  if (top) recs.push(`Analiza tus gastos en ${top[0]} (${fmt(top[1])}) — es tu categoría más alta este período`)
  if (issues.some(i => i.includes('interés'))) recs.push('Paga el saldo completo cada mes — los intereses son dinero perdido sin ningún beneficio')
  if (issues.some(i => i.includes('hormiga'))) recs.push('Agrupa compras pequeñas: una compra semanal es mejor que múltiples compras diarias pequeñas')
  if (recs.length < 2) recs.push('Reserva la tarjeta para compras planificadas y usa efectivo para gastos discrecionales del día a día')

  return recs.slice(0, 3)
}

type Tab = 'resumen' | 'presupuesto' | 'gastos' | 'ahorros' | 'tarjeta'

const TABS: [Tab, string][] = [
  ['resumen', 'Resumen'],
  ['presupuesto', 'Presupuesto'],
  ['gastos', 'Gastos'],
  ['ahorros', 'Ahorros'],
  ['tarjeta', '💳 Tarjeta'],
]

export default function FinancePage() {
  const {
    transactions, budgets, savingsGoals, config, fixedCharges,
    addTransaction, removeTransaction,
    addBudget, removeBudget,
    updateConfig, updateFixedCharge,
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

  const [statementText, setStatementText] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [analysisStep, setAnalysisStep] = useState<'input' | 'review'>('input')
  const [imported, setImported] = useState(false)

  const income = config.monthlyIncome ?? 0
  const expenses = getMonthlyExpenses()
  const balance = income - expenses
  const totalBudget = budgets.reduce((a, b) => a + b.limit, 0)
  const remaining = income - totalBudget

  const thisMonth = format(new Date(), 'yyyy-MM')
  const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM')

  const monthExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(thisMonth))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const currCredit = useMemo(
    () => transactions.filter(t => t.type === 'expense' && t.paymentMethod === 'credit' && t.date.startsWith(thisMonth)).reduce((a, t) => a + t.amount, 0),
    [transactions, thisMonth]
  )
  const prevCredit = useMemo(
    () => transactions.filter(t => t.type === 'expense' && t.paymentMethod === 'credit' && t.date.startsWith(prevMonth)).reduce((a, t) => a + t.amount, 0),
    [transactions, prevMonth]
  )
  const creditTrendPct = prevCredit > 0 ? Math.round(((currCredit - prevCredit) / prevCredit) * 100) : null

  const stmtByCategory = useMemo(() => {
    if (analysisStep !== 'review') return {} as Record<string, number>
    return parsedRows.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + r.amount; return acc }, {} as Record<string, number>)
  }, [parsedRows, analysisStep])

  const stmtTotal = parsedRows.reduce((a, r) => a + r.amount, 0)
  const selectedCount = parsedRows.filter(r => r.selected).length
  const issues = analysisStep === 'review' ? detectIssues(parsedRows, prevCredit) : []
  const recommendations = analysisStep === 'review' ? getRecommendations(parsedRows, issues) : []

  const handleSaveIncome = () => {
    const val = Number(incomeVal)
    if (val >= 0) updateConfig({ monthlyIncome: val })
    setIncomeEdit(false)
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
    addSavingsTransaction({ goalId, type: 'deposit', amount: Number(depositAmount), description: 'Depósito', date: format(new Date(), 'yyyy-MM-dd') })
    setDepositModal(null)
    setDepositAmount('')
  }

  const handleAnalyze = () => {
    const rows = parseStatement(statementText)
    if (rows.length === 0) return
    setParsedRows(rows)
    setAnalysisStep('review')
    setImported(false)
  }

  const handleImport = () => {
    parsedRows.filter(r => r.selected).forEach(r => {
      addTransaction({ type: 'expense', category: r.category, amount: r.amount, description: r.description, date: r.date, icon: CAT_ICONS[r.category] ?? '📦', paymentMethod: 'credit' })
    })
    setImported(true)
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Wallet size={24} className="text-emerald-600" /> Finanzas
        </h1>
        <Button onClick={() => setExpenseModal(true)} variant="glow" size="sm">
          <Plus size={14} /> Gasto
        </Button>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <button onClick={() => { setIncomeEdit(true); setIncomeVal(String(income || '')) }}
          className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-left hover:bg-emerald-100 transition-all group">
          <div className="flex items-center gap-1 mb-1">
            <ArrowUpRight size={11} className="text-emerald-600" />
            <p className="text-[10px] text-gray-500">Ingreso</p>
            <Pencil size={9} className="text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" />
          </div>
          {incomeEdit ? (
            <input autoFocus type="number" value={incomeVal} onChange={e => setIncomeVal(e.target.value)}
              onBlur={handleSaveIncome} onKeyDown={e => e.key === 'Enter' && handleSaveIncome()}
              className="w-full bg-transparent text-base font-black text-emerald-700 focus:outline-none" />
          ) : (
            <p className="text-sm font-black text-emerald-700 tabular-nums leading-tight truncate">{fmt(income)}</p>
          )}
        </button>

        <div className="p-4 rounded-2xl border border-red-200 bg-red-50">
          <div className="flex items-center gap-1 mb-1">
            <ArrowDownRight size={11} className="text-red-500" />
            <p className="text-[10px] text-gray-500">Gastos</p>
          </div>
          <p className="text-sm font-black text-red-500 tabular-nums leading-tight truncate">{fmt(expenses)}</p>
        </div>

        <div className={cn('p-4 rounded-2xl border', balance >= 0 ? 'border-cyan-200 bg-cyan-50' : 'border-orange-200 bg-orange-50')}>
          <div className="flex items-center gap-1 mb-1">
            <DollarSign size={11} className={balance >= 0 ? 'text-cyan-600' : 'text-orange-500'} />
            <p className="text-[10px] text-gray-500">Balance</p>
          </div>
          <p className={cn('text-sm font-black tabular-nums leading-tight truncate', balance >= 0 ? 'text-cyan-700' : 'text-orange-600')}>
            {fmt(balance)}
          </p>
        </div>
      </motion.div>

      {/* Credit card trend indicator — always visible when there's data */}
      {(currCredit > 0 || prevCredit > 0) && (
        <motion.button variants={fadeUp} onClick={() => setTab('tarjeta')}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm text-left transition-all hover:opacity-90',
            creditTrendPct !== null && creditTrendPct > 10 ? 'border-orange-200 bg-orange-50' : 'border-emerald-200 bg-emerald-50'
          )}>
          <CreditCard size={16} className={creditTrendPct !== null && creditTrendPct > 10 ? 'text-orange-500 shrink-0' : 'text-emerald-600 shrink-0'} />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-gray-400 block">Tarjeta de crédito este mes</span>
            <span className="font-black text-gray-900 tabular-nums">{fmt(currCredit)}</span>
          </div>
          {creditTrendPct !== null ? (
            <div className={cn('flex items-center gap-1 text-xs font-bold shrink-0', creditTrendPct > 0 ? 'text-orange-600' : 'text-emerald-600')}>
              {creditTrendPct > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {creditTrendPct > 0 ? '+' : ''}{creditTrendPct}% vs mes anterior
            </div>
          ) : (
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
          )}
        </motion.button>
      )}

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap px-1', tab === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ RESUMEN ══ */}
        {tab === 'resumen' && (
          <motion.div key="res" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="flex justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">Presupuesto total</p>
                <div className={cn('text-xs font-bold', remaining >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {remaining >= 0 ? `Libre: ${fmt(remaining)}` : `Excede: ${fmt(Math.abs(remaining))}`}
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <motion.div className="h-full rounded-full bg-violet-500" style={{ maxWidth: '100%' }}
                  initial={{ width: 0 }} animate={{ width: income > 0 ? `${Math.min(100, (totalBudget / income) * 100)}%` : '0%' }} transition={{ duration: 0.7 }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
                <span>Presupuestado: {fmt(totalBudget)}</span>
                <span>Ingreso: {fmt(income)}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Gastos recientes</p>
              {monthExpenses.slice(0, 6).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Sin gastos este mes</div>
              ) : monthExpenses.slice(0, 6).map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 mb-1.5 group">
                  <span className="text-lg shrink-0">{tx.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{tx.description}</p>
                    <p className="text-[10px] text-gray-400">{tx.category} · {format(new Date(`${tx.date}T12:00:00`), 'd/MM')}</p>
                  </div>
                  <span className="text-sm font-bold text-red-500 shrink-0">{fmt(tx.amount)}</span>
                  <button onClick={() => removeTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {monthExpenses.length > 6 && (
                <button onClick={() => setTab('gastos')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors w-full text-center mt-1">
                  Ver todos ({monthExpenses.length}) →
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ PRESUPUESTO ══ */}
        {tab === 'presupuesto' && (
          <motion.div key="bud" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500">Ingreso mensual</span>
              <span className="text-sm font-black text-emerald-700">{fmt(income)}</span>
            </div>

            {budgets.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm mb-3">Sin categorías de presupuesto</p>
                <Button variant="glow" size="sm" onClick={() => setBudgetModal(true)}><Plus size={14} /> Agregar categoría</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {budgets.map(b => (
                  <div key={b.category} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 group">
                    <span className="text-lg shrink-0">{b.icon}</span>
                    <span className="text-sm text-gray-900 flex-1">{b.category}</span>
                    <span className="text-sm font-bold text-violet-700 tabular-nums">{fmt(b.limit)}</span>
                    <button onClick={() => removeBudget(b.category)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-xl border border-violet-200 bg-violet-50">
              <span className="text-sm font-bold text-gray-900">Total presupuestado</span>
              <span className="text-lg font-black text-violet-700 tabular-nums">{fmt(totalBudget)}</span>
            </div>
            {income > 0 && (
              <div className={cn('flex items-center justify-between px-4 py-3 rounded-xl border', remaining >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
                <span className="text-sm text-gray-500">{remaining >= 0 ? 'Sin asignar' : 'Excede ingreso'}</span>
                <span className={cn('text-base font-black tabular-nums', remaining >= 0 ? 'text-emerald-700' : 'text-red-500')}>{fmt(Math.abs(remaining))}</span>
              </div>
            )}

            <button onClick={() => setBudgetModal(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all text-sm flex items-center justify-center gap-2">
              <Plus size={14} /> Agregar categoría
            </button>

            {/* Fixed charges payment method selector */}
            {fixedCharges.length > 0 && (
              <div className="mt-2 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Gastos Fijos — Método de Pago</p>
                <div className="space-y-2">
                  {fixedCharges.map(fc => (
                    <div key={fc.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <span className="text-lg shrink-0">{fc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{fc.name}</p>
                        <p className="text-[10px] text-gray-400">{fmt(fc.amount)}/mes</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => updateFixedCharge(fc.id, { paymentMethod: 'credit' })}
                          className={cn('px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
                            (!fc.paymentMethod || fc.paymentMethod === 'credit')
                              ? 'bg-violet-100 text-violet-700 border border-violet-300'
                              : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                          )}>
                          💳 Tarjeta
                        </button>
                        <button
                          onClick={() => updateFixedCharge(fc.id, { paymentMethod: 'cash' })}
                          className={cn('px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
                            fc.paymentMethod === 'cash'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                              : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                          )}>
                          💵 Efectivo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ GASTOS ══ */}
        {tab === 'gastos' && (
          <motion.div key="exp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">{monthExpenses.length} gastos este mes · {fmt(expenses)}</p>
              <button onClick={() => setExpenseModal(true)}
                className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-all">
                <Plus size={12} /> Agregar
              </button>
            </div>
            {monthExpenses.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <p className="text-sm mb-3">Sin gastos este mes</p>
                <Button variant="glow" size="sm" onClick={() => setExpenseModal(true)}><Plus size={14} /> Registrar gasto</Button>
              </div>
            ) : monthExpenses.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 group">
                <span className="text-lg shrink-0">{tx.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{tx.description}</p>
                  <p className="text-[10px] text-gray-400">{tx.category} · {format(new Date(`${tx.date}T12:00:00`), 'd/MM')}</p>
                </div>
                <span className="text-sm font-bold text-red-500 tabular-nums shrink-0">{fmt(tx.amount)}</span>
                <button onClick={() => removeTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
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
                <PiggyBank size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm mb-3">Sin metas de ahorro</p>
                <Button variant="glow" size="sm" onClick={() => setGoalModal(true)}><Plus size={14} /> Crear meta</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {savingsGoals.map(goal => {
                  const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0
                  const done = goal.current >= goal.target
                  return (
                    <div key={goal.id} className={cn('p-4 rounded-2xl border transition-all group', done ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50')}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{goal.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{goal.name}</p>
                          <p className="text-xs text-gray-500">{fmt(goal.current)} de {fmt(goal.target)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!done && (
                            <button onClick={() => { setDepositModal(goal.id); setDepositAmount('') }}
                              className="text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                              style={{ background: `${goal.color}18`, color: goal.color }}>
                              <Plus size={11} /> Agregar
                            </button>
                          )}
                          <button onClick={() => removeSavingsGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: done ? '#10B981' : goal.color }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-gray-400">{Math.round(pct)}%</span>
                        {done ? <span className="text-[10px] text-emerald-600 font-bold">✓ Meta alcanzada</span>
                          : <span className="text-[10px] text-gray-400">Faltan {fmt(goal.target - goal.current)}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <button onClick={() => setGoalModal(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all text-sm flex items-center justify-center gap-2">
              <Plus size={14} /> Nueva meta de ahorro
            </button>
          </motion.div>
        )}

        {/* ══ TARJETA ══ */}
        {tab === 'tarjeta' && (
          <motion.div key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {analysisStep === 'input' ? (
              <>
                <div className="p-4 rounded-2xl border border-violet-100 bg-violet-50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-violet-600" />
                    <p className="text-sm font-bold text-gray-900">Analizar estado de cuenta</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Pega las transacciones de tu estado de cuenta. Formato: fecha · descripción · monto (una por línea)</p>
                  <p className="text-[10px] text-gray-400 mb-3 font-mono bg-white rounded-lg px-3 py-2 border border-gray-100 leading-relaxed">
                    15/01/2026{'  '}SUPERMERCADOS NACIONAL{'  '}2500<br />
                    16/01/2026{'  '}NETFLIX.COM{'  '}850<br />
                    17/01/2026{'  '}TEXACO GASOLINERA{'  '}1800
                  </p>
                  <textarea
                    value={statementText}
                    onChange={e => setStatementText(e.target.value)}
                    placeholder="Pega aquí las transacciones de tu estado de cuenta..."
                    rows={8}
                    className="w-full rounded-xl bg-white border border-gray-200 text-sm text-gray-900 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-300 resize-none font-mono"
                  />
                </div>
                <Button variant="glow" className="w-full" disabled={!statementText.trim()} onClick={handleAnalyze}>
                  <FileText size={14} /> Analizar transacciones
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <button onClick={() => { setAnalysisStep('input'); setImported(false) }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ← Nuevo análisis
                  </button>
                  <span className="text-xs text-gray-400">{parsedRows.length} transacciones · {fmt(stmtTotal)}</span>
                </div>

                {/* By-category summary */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-2.5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gasto por categoría</p>
                  {Object.entries(stmtByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                    const pct = stmtTotal > 0 ? (amt / stmtTotal) * 100 : 0
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700">{CAT_ICONS[cat] ?? '📦'} {cat}</span>
                          <span className="font-bold text-gray-900 tabular-nums">{fmt(amt)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-xs font-bold text-gray-500">Total</span>
                    <span className="text-sm font-black text-gray-900 tabular-nums">{fmt(stmtTotal)}</span>
                  </div>
                </div>

                {/* vs previous period */}
                {prevCredit > 0 && (
                  <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border',
                    stmtTotal > prevCredit ? 'border-orange-200 bg-orange-50' : 'border-emerald-200 bg-emerald-50'
                  )}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400">vs período anterior registrado</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 tabular-nums">{fmt(prevCredit)}</span>
                        <ChevronRight size={12} className="text-gray-300" />
                        <span className="text-sm font-bold text-gray-900 tabular-nums">{fmt(stmtTotal)}</span>
                      </div>
                    </div>
                    {(() => {
                      const diff = Math.round(((stmtTotal - prevCredit) / prevCredit) * 100)
                      return (
                        <span className={cn('text-sm font-black shrink-0', diff > 0 ? 'text-orange-600' : 'text-emerald-600')}>
                          {diff > 0 ? '+' : ''}{diff}%
                        </span>
                      )
                    })()}
                  </div>
                )}

                {/* Bad practices */}
                {issues.length > 0 && (
                  <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-orange-500 shrink-0" />
                      <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Malas prácticas detectadas</p>
                    </div>
                    {issues.map((issue, i) => (
                      <p key={i} className="text-xs text-orange-800 leading-relaxed">{issue}</p>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50 space-y-2">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Recomendaciones</p>
                    {recommendations.map((rec, i) => (
                      <p key={i} className="text-xs text-emerald-800 leading-relaxed">• {rec}</p>
                    ))}
                  </div>
                )}

                {/* Transactions */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Transacciones — edita categorías antes de importar</p>
                  <div className="space-y-1.5">
                    {parsedRows.map(row => (
                      <div key={row.id} className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all',
                        row.selected ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 opacity-40'
                      )}>
                        <input type="checkbox" checked={row.selected}
                          onChange={e => setParsedRows(prev => prev.map(r => r.id === row.id ? { ...r, selected: e.target.checked } : r))}
                          className="rounded shrink-0 accent-violet-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-900 truncate">{row.description}</p>
                          <p className="text-[10px] text-gray-400">{row.date}</p>
                        </div>
                        <select value={row.category}
                          onChange={e => setParsedRows(prev => prev.map(r => r.id === row.id ? { ...r, category: e.target.value } : r))}
                          className="text-[10px] rounded-lg bg-gray-100 border-none px-1.5 py-1 text-gray-600 focus:outline-none shrink-0 max-w-[100px]">
                          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                        </select>
                        <span className="text-xs font-bold text-red-500 tabular-nums shrink-0 ml-1">{fmt(row.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Import button */}
                {imported ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
                    <Check size={16} /> {selectedCount} transacciones importadas a Movimientos
                  </div>
                ) : (
                  <Button variant="glow" className="w-full" disabled={selectedCount === 0} onClick={handleImport}>
                    <Plus size={14} /> Importar {selectedCount} transacciones a Movimientos
                  </Button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ MODALS ════ */}

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

      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Categoría de Presupuesto">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 font-medium block mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setNewBudget(b => ({ ...b, category: cat, icon: CAT_ICONS[cat] }))}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    newBudget.category === cat ? 'bg-violet-100 text-violet-700 border border-violet-300' : 'bg-gray-100 text-gray-500 hover:text-gray-700')}>
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
