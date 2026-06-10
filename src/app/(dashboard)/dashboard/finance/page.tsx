'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Wallet, TrendingUp, TrendingDown, Plus, Target, Trash2,
  DollarSign, PiggyBank, Receipt, ArrowUpRight, ArrowDownRight,
  Pencil, Check, X, CheckCircle2, Circle, ChevronDown, ChevronUp,
  ArrowDown, ArrowUp, CreditCard, Shield, AlertTriangle, Calendar,
  Settings, Zap, Lock, AlertCircle,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
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
const CARD_COLORS = ['#7C3AED','#06B6D4','#F59E0B','#10B981','#EC4899','#F97316','#EF4444']
const DEBT_COLORS = ['#EF4444','#F97316','#F59E0B','#EC4899','#7C3AED']

function fmt(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n)
}

const tooltipStyle = {
  contentStyle: { background: '#1A1A27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px', color: '#F8FAFC' },
}

function ScoreGauge({ score }: { score: number }) {
  const fill = (Math.min(100, Math.max(0, score)) / 100) * 135.1
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'
  const label = score >= 70 ? 'Saludable' : score >= 40 ? 'Regular' : 'Crítico'
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="96" height="58" viewBox="0 0 96 58">
          <path d="M 5 54 A 43 43 0 0 1 91 54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} strokeLinecap="round" />
          <path d="M 5 54 A 43 43 0 0 1 91 54" fill="none" stroke={color} strokeWidth={9} strokeLinecap="round"
            strokeDasharray={`${fill} 135.1`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
          <span className="text-xl font-black text-white leading-none">{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold mt-0.5" style={{ color }}>{label}</span>
    </div>
  )
}

type Tab = 'resumen' | 'gastos' | 'deudas' | 'presupuesto'

export default function FinancePage() {
  const {
    transactions, budgets, savingsGoals, savingsTransactions,
    creditCards, debts, config,
    addTransaction, removeTransaction,
    addCreditCard, updateCreditCard, removeCreditCard,
    addDebt, updateDebt, removeDebt, payDebt,
    updateConfig,
    addFixedCharge, removeFixedCharge, isFixedChargePaid, payFixedCharge, unpayFixedCharge, getCardFixedCharges,
    isBudgetPaid, markBudgetPaid, unmarkBudgetPaid,
    addSavingsGoal, removeSavingsGoal,
    addSavingsTransaction, removeSavingsTransaction, getGoalTransactions,
    addBudget, updateBudget, removeBudget,
    getMonthlyIncome, getMonthlyExpenses, getMonthlyBalance,
    getExpensesByCategory, getSpentOnCategory,
    getCreditExpenses, getCashExpenses,
    getMonthlySavings, getTotalDebt,
    getAvailableMoney, getDaysMoneyWillLast, getProjectedEndBalance, getFinancialScore,
  } = useFinanceStore()

  const [activeTab, setActiveTab] = useState<Tab>('resumen')

  // modals
  const [txModal, setTxModal]               = useState(false)
  const [cardModal, setCardModal]           = useState<'add' | string | null>(null)
  const [debtModal, setDebtModal]           = useState<'add' | string | null>(null)
  const [payDebtModal, setPayDebtModal]     = useState<string | null>(null)
  const [configModal, setConfigModal]       = useState(false)
  const [goalModal, setGoalModal]           = useState(false)
  const [budgetModal, setBudgetModal]       = useState(false)
  const [payModal, setPayModal]             = useState<string | null>(null)
  const [savingsTxModal, setSavingsTxModal] = useState<string | null>(null)
  const [activeGoal, setActiveGoal]         = useState<string | null>(null)
  const [editingBudget, setEditingBudget]   = useState<string | null>(null)
  const [editValue, setEditValue]           = useState('')
  const [chargeModal, setChargeModal]       = useState<string | null>(null) // cardId
  const [expandedCard, setExpandedCard]     = useState<string | null>(null)

  // forms
  const [newTx, setNewTx] = useState({
    type: 'expense' as TransactionType, category: 'Comida', amount: '', description: '',
    icon: '💸', date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash' as 'cash' | 'credit', creditCardId: '',
  })
  const [newCard, setNewCard]   = useState({ name: '', limit: '', balance: '', color: '#7C3AED' })
  const [editCard, setEditCard] = useState({ name: '', limit: '', balance: '', color: '#7C3AED' })
  const [newDebt, setNewDebt]   = useState({ name: '', icon: '💳', totalOriginal: '', remaining: '', minPayment: '', color: '#EF4444', dueDay: '' })
  const [editDebt, setEditDebt] = useState({ name: '', icon: '💳', totalOriginal: '', remaining: '', minPayment: '', color: '#EF4444', dueDay: '' })
  const [payDebtAmt, setPayDebtAmt]       = useState('')
  const [payAmount, setPayAmount]         = useState('')
  const [newGoal, setNewGoal]   = useState({ name: '', target: '', current: '0', icon: '🎯', color: '#7C3AED', deadline: '' })
  const [newBudget, setNewBudget] = useState({ category: '', icon: '💰', limit: '', color: '#7C3AED' })
  const [newCharge, setNewCharge] = useState({ name: '', amount: '', icon: '🔄', billingDay: '' })

  const [newSavingsTx, setNewSavingsTx] = useState({
    type: 'deposit' as SavingsTxType, amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [cfgForm, setCfgForm] = useState({
    monthlyIncome: '', fixedExpenses: '', autoSavings: '', safetyZone: '',
  })

  // computed
  const income           = getMonthlyIncome()
  const expenses         = getMonthlyExpenses()
  const balance          = getMonthlyBalance()
  const creditExp        = getCreditExpenses()
  const cashExp          = getCashExpenses()
  const monthlySavings   = getMonthlySavings()
  const totalDebt        = getTotalDebt()
  const availableMoney   = getAvailableMoney()
  const daysLeft         = getDaysMoneyWillLast()
  const projectedBalance = getProjectedEndBalance()
  const score            = getFinancialScore()
  const byCategory       = getExpensesByCategory()
  const pieData          = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const key = d.toISOString().slice(0, 7)
    return {
      mes: MONTHS[d.getMonth()],
      ingresos: getMonthlyIncome(key),
      gastos: getMonthlyExpenses(key),
      efectivo: getCashExpenses(key),
      credito: getCreditExpenses(key),
    }
  })

  const insights = useMemo(() => {
    const r: { icon: string; text: string; type: 'success' | 'warning' | 'danger' | 'info' }[] = []
    creditCards.forEach(c => {
      const pct = c.limit > 0 ? (c.balance / c.limit) * 100 : 0
      if (pct >= 50) r.push({ icon: '💳', type: pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'info',
        text: `Tu tarjeta "${c.name}" está al ${Math.round(pct)}% del límite.${pct > 70 ? ` Pagar ${fmt(c.balance - c.limit * 0.5)} te llevaría a zona saludable.` : ''}` })
    })
    if (config.safetyZone > 0 && projectedBalance < config.safetyZone) {
      r.push({ icon: '🛡️', type: 'danger', text: `Proyección fin de mes (${fmt(Math.max(0, projectedBalance))}) está por debajo de tu zona de seguridad (${fmt(config.safetyZone)}).` })
    }
    const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
    if (topCat) r.push({ icon: '📊', type: 'info', text: `Tu categoría con mayor gasto este mes es ${topCat[0]} con ${fmt(topCat[1])}.` })
    if (income > 0 && monthlySavings > 0) {
      const rate = Math.round((monthlySavings / income) * 100)
      r.push({ icon: '💰', type: rate >= 20 ? 'success' : 'info', text: `Llevas ${rate}% de tu ingreso ahorrado este mes.${rate >= 20 ? ' ¡Excelente disciplina!' : ' Meta recomendada: 20%.'}` })
    }
    if (daysLeft < 10 && daysLeft >= 0 && income > 0) {
      r.push({ icon: '⏰', type: 'danger', text: `Con tu ritmo actual, tu dinero durará ${daysLeft} días más. Reduce gastos discrecionales.` })
    }
    if (expenses > 0 && creditExp > 0) {
      const pct = Math.round((creditExp / expenses) * 100)
      if (pct > 40) r.push({ icon: '⚠️', type: 'warning', text: `El ${pct}% de tus gastos este mes fueron con tarjeta de crédito.` })
    }
    return r
  }, [creditCards, projectedBalance, config, byCategory, income, monthlySavings, daysLeft, expenses, creditExp])

  /* ── handlers ── */
  const handleAddTx = () => {
    if (!newTx.amount || !newTx.description) return
    addTransaction({
      type: newTx.type, category: newTx.category, amount: Number(newTx.amount),
      description: newTx.description, date: newTx.date,
      icon: newTx.type === 'income' ? '💰' : newTx.icon,
      paymentMethod: newTx.paymentMethod,
      creditCardId: newTx.creditCardId || undefined,
    })
    setTxModal(false)
    setNewTx({ type: 'expense', category: 'Comida', amount: '', description: '', icon: '💸', date: format(new Date(), 'yyyy-MM-dd'), paymentMethod: 'cash', creditCardId: '' })
  }

  const handleAddCard = () => {
    if (!newCard.name || !newCard.limit) return
    addCreditCard({ name: newCard.name, limit: Number(newCard.limit), balance: Number(newCard.balance || 0), color: newCard.color })
    setCardModal(null)
    setNewCard({ name: '', limit: '', balance: '', color: '#7C3AED' })
  }

  const handleEditCard = (id: string) => {
    if (!editCard.name || !editCard.limit) return
    updateCreditCard(id, { name: editCard.name, limit: Number(editCard.limit), balance: Number(editCard.balance), color: editCard.color })
    setCardModal(null)
  }

  const handleAddDebt = () => {
    if (!newDebt.name || !newDebt.remaining || !newDebt.minPayment) return
    addDebt({
      name: newDebt.name, icon: newDebt.icon, color: newDebt.color,
      totalOriginal: Number(newDebt.totalOriginal || newDebt.remaining),
      remaining: Number(newDebt.remaining), minPayment: Number(newDebt.minPayment),
      dueDay: newDebt.dueDay ? Number(newDebt.dueDay) : undefined,
    })
    setDebtModal(null)
    setNewDebt({ name: '', icon: '💳', totalOriginal: '', remaining: '', minPayment: '', color: '#EF4444', dueDay: '' })
  }

  const handleEditDebt = (id: string) => {
    if (!editDebt.name) return
    updateDebt(id, {
      name: editDebt.name, icon: editDebt.icon, color: editDebt.color,
      totalOriginal: Number(editDebt.totalOriginal),
      remaining: Number(editDebt.remaining), minPayment: Number(editDebt.minPayment),
      dueDay: editDebt.dueDay ? Number(editDebt.dueDay) : undefined,
    })
    setDebtModal(null)
  }

  const handlePayDebt = (id: string) => {
    const v = Number(payDebtAmt)
    if (!v || v <= 0) return
    payDebt(id, v)
    setPayDebtModal(null)
    setPayDebtAmt('')
  }

  const handleSaveConfig = () => {
    updateConfig({
      monthlyIncome: Number(cfgForm.monthlyIncome) || config.monthlyIncome,
      fixedExpenses: Number(cfgForm.fixedExpenses) || config.fixedExpenses,
      autoSavings:   Number(cfgForm.autoSavings)   || config.autoSavings,
      safetyZone:    Number(cfgForm.safetyZone)    || config.safetyZone,
    })
    setConfigModal(false)
  }

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.target) return
    addSavingsGoal({ name: newGoal.name, target: Number(newGoal.target), current: Number(newGoal.current), icon: newGoal.icon, color: newGoal.color, deadline: newGoal.deadline || undefined })
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
    const v = Number(payAmount)
    if (!v || v <= 0) return
    markBudgetPaid(category, v)
    setPayModal(null)
    setPayAmount('')
  }

  const handleAddSavingsTx = (goalId: string) => {
    const v = Number(newSavingsTx.amount)
    if (!v || !newSavingsTx.description) return
    addSavingsTransaction({ goalId, type: newSavingsTx.type, amount: v, description: newSavingsTx.description, date: newSavingsTx.date })
    setSavingsTxModal(null)
    setNewSavingsTx({ type: 'deposit', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') })
  }

  const openEditCard = (id: string) => {
    const c = creditCards.find(c => c.id === id)
    if (!c) return
    setEditCard({ name: c.name, limit: String(c.limit), balance: String(c.balance), color: c.color })
    setCardModal(id)
  }

  const openEditDebt = (id: string) => {
    const d = debts.find(d => d.id === id)
    if (!d) return
    setEditDebt({ name: d.name, icon: d.icon, totalOriginal: String(d.totalOriginal), remaining: String(d.remaining), minPayment: String(d.minPayment), color: d.color, dueDay: String(d.dueDay ?? '') })
    setDebtModal(id)
  }

  const openConfig = () => {
    setCfgForm({ monthlyIncome: String(config.monthlyIncome), fixedExpenses: String(config.fixedExpenses), autoSavings: String(config.autoSavings), safetyZone: String(config.safetyZone) })
    setConfigModal(true)
  }

  const handleAddCharge = (cardId: string) => {
    if (!newCharge.name || !newCharge.amount) return
    addFixedCharge({ creditCardId: cardId, name: newCharge.name, amount: Number(newCharge.amount), icon: newCharge.icon, billingDay: newCharge.billingDay ? Number(newCharge.billingDay) : undefined })
    setChargeModal(null)
    setNewCharge({ name: '', amount: '', icon: '🔄', billingDay: '' })
  }

  const riskLevel = projectedBalance < 0 ? 'CRÍTICO' : projectedBalance < config.safetyZone ? 'ALTO' : projectedBalance < config.safetyZone * 2 ? 'MEDIO' : 'BAJO'
  const riskColor = riskLevel === 'CRÍTICO' ? 'bg-red-500/20 text-red-400' : riskLevel === 'ALTO' ? 'bg-orange-500/15 text-orange-400' : riskLevel === 'MEDIO' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Wallet size={24} className="text-emerald-400" /> Finanzas
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Control financiero inteligente</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={openConfig} variant="ghost" size="sm"><Settings size={14} /> Configurar</Button>
          <Button onClick={() => setTxModal(true)} variant="glow" size="sm"><Plus size={14} /> Transacción</Button>
        </div>
      </motion.div>

      {/* Days Money Will Last Banner */}
      {(income > 0 || config.monthlyIncome > 0) && (
        <motion.div variants={fadeUp}>
          <div className={cn('rounded-2xl px-4 py-3 flex items-center gap-3 border', daysLeft === 0 ? 'bg-red-500/15 border-red-500/30' : daysLeft < 10 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20')}>
            <Calendar size={18} className={daysLeft < 10 ? 'text-red-400' : 'text-emerald-400'} />
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-semibold', daysLeft < 10 ? 'text-red-400' : 'text-emerald-400')}>
                {daysLeft === 0 ? 'Tu dinero se agotó — revisa tus gastos inmediatamente' :
                 daysLeft < 10 ? `Tu dinero durará ${daysLeft} días más con el ritmo actual` :
                 'Tu dinero durará hasta el próximo pago'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Balance actual: {fmt(balance)} · {new Date().toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className={cn('text-2xl font-black tabular-nums shrink-0', daysLeft < 10 ? 'text-red-400' : 'text-emerald-400')}>
              {daysLeft}d
            </div>
          </div>
        </motion.div>
      )}

      {/* 5 KPI cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <GlassCard className="p-4" animate={false}>
          <p className="text-xs text-slate-500 mb-1.5">Balance Total</p>
          <p className={cn('text-lg font-black tabular-nums', balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>{fmt(balance)}</p>
          <div className={cn('flex items-center gap-1 text-[10px] mt-1', balance >= 0 ? 'text-emerald-400/60' : 'text-red-400/60')}>
            {balance >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            <span>{balance >= 0 ? 'Superávit' : 'Déficit'}</span>
          </div>
        </GlassCard>

        <GlassCard className={cn('p-4', availableMoney >= 0 ? 'border-emerald-500/20' : 'border-red-500/20')} animate={false}>
          <p className="text-xs text-slate-500 mb-1.5">Disponible</p>
          <p className={cn('text-lg font-black tabular-nums', availableMoney >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {config.monthlyIncome > 0 ? fmt(availableMoney) : '—'}
          </p>
          <p className="text-[10px] text-slate-600 mt-1 leading-snug">
            {config.monthlyIncome > 0 ? 'Sin afectar objetivos' : 'Configura tu ingreso'}
          </p>
        </GlassCard>

        <GlassCard className="p-4" animate={false}>
          <p className="text-xs text-slate-500 mb-1.5">Gastos del Mes</p>
          <p className="text-lg font-black text-red-400 tabular-nums">{fmt(expenses)}</p>
          <p className="text-[10px] text-slate-600 mt-1">Crédito: {fmt(creditExp)}</p>
        </GlassCard>

        <GlassCard className="p-4" animate={false}>
          <p className="text-xs text-slate-500 mb-1.5">Ahorro del Mes</p>
          <p className="text-lg font-black text-cyan-400 tabular-nums">{fmt(monthlySavings)}</p>
          <p className="text-[10px] text-slate-600 mt-1">
            {income > 0 ? `${Math.round((monthlySavings / income) * 100)}% del ingreso` : 'Sin datos aún'}
          </p>
        </GlassCard>

        <GlassCard className="col-span-2 lg:col-span-1 p-4 flex items-center justify-between lg:flex-col lg:justify-center lg:items-center" animate={false}>
          <div className="lg:hidden">
            <p className="text-xs text-slate-500">Score Financiero</p>
            <p className="text-xs text-slate-600 mt-0.5">Salud del dinero</p>
          </div>
          <ScoreGauge score={score} />
        </GlassCard>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.05] overflow-x-auto">
        {([['resumen', '📊 Resumen'], ['gastos', '💸 Gastos'], ['deudas', '💳 Deudas'], ['presupuesto', '📋 Presupuesto']] as [Tab, string][]).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('flex-1 min-w-[80px] py-2 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              activeTab === tab ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-300')}>
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ TAB: RESUMEN ══ */}
        {activeTab === 'resumen' && (
          <motion.div key="resumen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Setup prompt */}
            {config.monthlyIncome === 0 && (
              <GlassCard className="p-5 border-amber-500/20" animate={false}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Settings size={18} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Configura tu perfil financiero</p>
                    <p className="text-sm text-slate-400 mt-1">Para ver proyecciones, dinero disponible y score necesito saber tu ingreso mensual y compromisos fijos.</p>
                    <Button variant="glow" size="sm" className="mt-3" onClick={openConfig}>
                      <Settings size={14} /> Configurar ahora
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Available money callout */}
            {config.monthlyIncome > 0 && (
              <div className={cn('rounded-2xl px-5 py-4 border', availableMoney >= 0 ? 'bg-emerald-500/08 border-emerald-500/20' : 'bg-red-500/08 border-red-500/20')}>
                <p className="text-xs text-slate-500 mb-1">Dinero disponible para gastar libremente</p>
                <p className={cn('text-3xl font-black tabular-nums', availableMoney >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {fmt(availableMoney)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {availableMoney >= 0
                    ? `Puedes gastar ${fmt(availableMoney)} sin afectar tus objetivos.`
                    : 'Tus compromisos superan tu ingreso. Revisa tu configuración.'}
                </p>
                {config.monthlyIncome > 0 && (
                  <div className="flex gap-4 mt-3 text-xs text-slate-600 flex-wrap">
                    <span>Ingreso: <strong className="text-slate-400">{fmt(config.monthlyIncome)}</strong></span>
                    <span>Gastos fijos: <strong className="text-slate-400">{fmt(config.fixedExpenses)}</strong></span>
                    <span>Deudas mín: <strong className="text-slate-400">{fmt(debts.reduce((a,d) => a + d.minPayment, 0))}</strong></span>
                    <span>Ahorro auto: <strong className="text-slate-400">{fmt(config.autoSavings)}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Credit Card Control */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <CreditCard size={16} className="text-violet-400" /> Control de Tarjeta
                </h3>
                <button onClick={() => setCardModal('add')} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all">
                  <Plus size={12} /> Agregar
                </button>
              </div>
              {creditCards.length === 0 ? (
                <GlassCard className="p-5" animate={false}>
                  <div className="flex flex-col items-center py-4 text-center">
                    <CreditCard size={28} className="text-slate-700 mb-2" />
                    <p className="text-sm text-slate-600">Sin tarjetas de crédito registradas</p>
                    <button onClick={() => setCardModal('add')} className="text-xs text-violet-400 hover:text-violet-300 mt-1">+ Agregar tarjeta</button>
                  </div>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {creditCards.map(card => {
                    const pct = card.limit > 0 ? (card.balance / card.limit) * 100 : 0
                    const avail = Math.max(0, card.limit - card.balance)
                    const lvl = pct >= 90 ? 'critical' : pct >= 70 ? 'high' : pct >= 50 ? 'medium' : 'low'
                    const ac = lvl === 'critical' ? '#EF4444' : lvl === 'high' ? '#F97316' : lvl === 'medium' ? '#F59E0B' : '#10B981'
                    const ab = lvl === 'critical' ? 'border-red-500/25' : lvl === 'high' ? 'border-orange-500/25' : lvl === 'medium' ? 'border-amber-500/25' : 'border-white/[0.07]'
                    return (
                      <GlassCard key={card.id} className={cn('p-4', ab)} animate={false}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-white">{card.name}</p>
                            <p className="text-xs text-slate-500">Límite: {fmt(card.limit)}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEditCard(card.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/10 transition-all"><Pencil size={11} /></button>
                            <button onClick={() => removeCreditCard(card.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.05] text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={11} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div><p className="text-[10px] text-slate-600">Balance</p><p className="text-sm font-bold text-white tabular-nums">{fmt(card.balance)}</p></div>
                          <div><p className="text-[10px] text-slate-600">Utilizado</p><p className="text-sm font-bold tabular-nums" style={{ color: ac }}>{Math.round(pct)}%</p></div>
                          <div><p className="text-[10px] text-slate-600">Disponible</p><p className="text-sm font-bold text-emerald-400 tabular-nums">{fmt(avail)}</p></div>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-2">
                          <motion.div className="h-full rounded-full" style={{ background: ac }} initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.7 }} />
                        </div>
                        {pct >= 50 && (
                          <p className="text-[10px] leading-snug" style={{ color: ac }}>
                            {pct >= 90 ? '🚨 Alerta crítica: ' : pct >= 70 ? '⚠️ En riesgo: ' : '💡 Advertencia: '}
                            {pct >= 90 ? 'Tarjeta al límite. Paga de inmediato.' : pct >= 70 ? `Reducir ${fmt(card.balance - card.limit * 0.5)} te llevaría a zona saludable.` : 'Considera reducir el uso de crédito.'}
                          </p>
                        )}

                        {/* Fixed Charges Section */}
                        {(() => {
                          const charges = getCardFixedCharges(card.id)
                          const totalFixed = charges.reduce((a, c) => a + c.amount, 0)
                          const paidCount = charges.filter(c => isFixedChargePaid(c.id)).length
                          const isExpanded = expandedCard === card.id
                          return (
                            <div className="mt-3 pt-3 border-t border-white/[0.06]">
                              <div className="flex items-center justify-between mb-2">
                                <button onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                                  <span>📅 Gastos Fijos</span>
                                  {charges.length > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[10px]">
                                      {paidCount}/{charges.length}
                                    </span>
                                  )}
                                  {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                </button>
                                <div className="flex items-center gap-2">
                                  {charges.length > 0 && (
                                    <span className="text-[10px] text-slate-500 tabular-nums">{fmt(totalFixed)}/mes</span>
                                  )}
                                  <button onClick={() => { setNewCharge({ name: '', amount: '', icon: '🔄', billingDay: '' }); setChargeModal(card.id) }}
                                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 px-1.5 py-0.5 rounded bg-violet-500/10 hover:bg-violet-500/20 transition-all">
                                    <Plus size={9} /> Agregar
                                  </button>
                                </div>
                              </div>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                    {charges.length === 0 ? (
                                      <p className="text-[10px] text-slate-600 text-center py-2">Sin gastos fijos — agrega suscripciones, servicios...</p>
                                    ) : (
                                      <div className="space-y-1">
                                        {charges.map(charge => {
                                          const paid = isFixedChargePaid(charge.id)
                                          return (
                                            <div key={charge.id} className="flex items-center gap-2 group">
                                              <button onClick={() => paid ? unpayFixedCharge(charge.id) : payFixedCharge(charge.id)}
                                                className="shrink-0 transition-transform active:scale-90">
                                                {paid
                                                  ? <CheckCircle2 size={16} className="text-emerald-400" />
                                                  : <Circle size={16} className="text-slate-600 hover:text-emerald-400 transition-colors" />}
                                              </button>
                                              <span className="text-sm leading-none">{charge.icon}</span>
                                              <div className="flex-1 min-w-0">
                                                <p className={cn('text-xs font-medium truncate', paid ? 'text-slate-500 line-through' : 'text-slate-200')}>{charge.name}</p>
                                                {charge.billingDay && <p className="text-[10px] text-slate-600">Día {charge.billingDay} de cada mes</p>}
                                              </div>
                                              <span className={cn('text-xs font-bold tabular-nums shrink-0', paid ? 'text-emerald-400' : 'text-slate-300')}>{fmt(charge.amount)}</span>
                                              <button onClick={() => removeFixedCharge(charge.id)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all shrink-0">
                                                <Trash2 size={11} />
                                              </button>
                                            </div>
                                          )
                                        })}
                                        <div className="flex justify-between items-center pt-1.5 mt-1 border-t border-white/[0.04]">
                                          <span className="text-[10px] text-slate-600">{paidCount === charges.length ? '✅ Todos registrados este mes' : `${charges.length - paidCount} pendiente${charges.length - paidCount > 1 ? 's' : ''} de registrar`}</span>
                                          <span className="text-[10px] font-semibold text-slate-400 tabular-nums">{fmt(totalFixed)}/mes</span>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })()}
                      </GlassCard>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Projection + Safety Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="p-5" animate={false}>
                <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-cyan-400" /> Proyección Financiera
                </h3>
                {income === 0 && config.monthlyIncome === 0 ? (
                  <p className="text-sm text-slate-600 text-center py-4">Registra ingresos para ver proyecciones</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                      <span className="text-sm text-slate-400">Balance esperado</span>
                      <span className={cn('text-sm font-bold tabular-nums', projectedBalance >= 0 ? 'text-emerald-400' : 'text-red-400')}>{fmt(projectedBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                      <span className="text-sm text-slate-400">Ahorro estimado</span>
                      <span className="text-sm font-bold text-cyan-400 tabular-nums">{fmt(Math.max(0, projectedBalance))}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-400">Riesgo</span>
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', riskColor)}>{riskLevel}</span>
                    </div>
                    {projectedBalance < 0 && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mt-2">
                        <p className="text-xs text-red-400">⚡ Al ritmo actual terminarás el mes con déficit de {fmt(Math.abs(projectedBalance))}. Reduce gastos inmediatamente.</p>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>

              <GlassCard className="p-5" animate={false}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2"><Shield size={16} className="text-violet-400" /> Zona de Seguridad</h3>
                  <button onClick={openConfig} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] text-slate-500 hover:text-violet-400 transition-colors"><Settings size={13} /></button>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0"><Lock size={16} className="text-violet-400" /></div>
                  <div>
                    <p className="text-xs text-slate-500">Monto mínimo a conservar</p>
                    <p className="text-xl font-black text-white tabular-nums">{fmt(config.safetyZone)}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Proyección fin de mes</span>
                    <span className={cn('font-semibold tabular-nums', projectedBalance >= config.safetyZone ? 'text-emerald-400' : 'text-red-400')}>{fmt(projectedBalance)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background: projectedBalance >= config.safetyZone ? '#10B981' : projectedBalance >= 0 ? '#F97316' : '#EF4444' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, config.safetyZone > 0 ? (projectedBalance / (config.safetyZone * 2)) * 100 : 50))}%` }}
                      transition={{ duration: 0.8 }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>RD$0</span><span>Zona segura: {fmt(config.safetyZone)}</span>
                  </div>
                </div>
                {projectedBalance < config.safetyZone && config.safetyZone > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400 leading-snug">🚨 Si continúas con este ritmo terminarás el mes con {fmt(Math.max(0, projectedBalance))}. Estás por debajo de tu zona de seguridad.</p>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <GlassCard className="p-5" animate={false}>
                <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-amber-400" /> Insights Inteligentes
                </h3>
                <div className="space-y-2">
                  {insights.map((ins, i) => (
                    <div key={i} className={cn('flex items-start gap-3 p-3 rounded-xl border',
                      ins.type === 'danger' ? 'bg-red-500/08 border-red-500/20' :
                      ins.type === 'warning' ? 'bg-amber-500/06 border-amber-500/20' :
                      ins.type === 'success' ? 'bg-emerald-500/08 border-emerald-500/20' :
                      'bg-white/[0.03] border-white/[0.06]')}>
                      <span className="text-base leading-none mt-0.5">{ins.icon}</span>
                      <p className="text-sm text-slate-300 leading-snug">{ins.text}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* ══ TAB: GASTOS ══ */}
        {activeTab === 'gastos' && (
          <motion.div key="gastos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Cash vs Credit summary */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-4" animate={false}>
                <p className="text-xs text-slate-500 mb-1">Efectivo</p>
                <p className="text-xl font-black text-emerald-400 tabular-nums">{fmt(cashExp)}</p>
                <p className="text-[10px] text-slate-600 mt-1">{expenses > 0 ? `${Math.round((cashExp / expenses) * 100)}% del total` : '—'}</p>
              </GlassCard>
              <GlassCard className="p-4 border-orange-500/20" animate={false}>
                <p className="text-xs text-slate-500 mb-1">Tarjeta de Crédito</p>
                <p className="text-xl font-black text-orange-400 tabular-nums">{fmt(creditExp)}</p>
                <p className="text-[10px] text-slate-600 mt-1">{expenses > 0 ? `${Math.round((creditExp / expenses) * 100)}% del total` : '—'}</p>
              </GlassCard>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GlassCard className="p-5" animate={false}>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingDown size={16} className="text-orange-400" /> Efectivo vs Crédito
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={last6Months} barSize={10} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip {...tooltipStyle} formatter={(v) => [fmt(Number(v)), '']} />
                    <Bar dataKey="efectivo" fill="#10B981" radius={[3,3,0,0]} opacity={0.85} name="Efectivo" />
                    <Bar dataKey="credito"  fill="#F97316" radius={[3,3,0,0]} opacity={0.75} name="Crédito" />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="p-5" animate={false}>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingDown size={16} className="text-red-400" /> Gastos por Categoría
                </h3>
                {pieData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-600"><Receipt size={32} className="mb-2 opacity-30" /><p className="text-sm">Sin gastos este mes</p></div>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={130} height={130}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={36} outerRadius={60} strokeWidth={0}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip {...tooltipStyle} formatter={(v) => [fmt(Number(v)), '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5">
                      {pieData.slice(0, 6).map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="text-xs text-slate-400 truncate">{d.name}</span></div>
                          <span className="text-xs font-medium text-white tabular-nums shrink-0">{fmt(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Ingresos vs Gastos 6 months */}
            <GlassCard className="p-5" animate={false}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-cyan-400" /> Ingresos vs Gastos — 6 meses</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={last6Months} barSize={10} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [fmt(Number(v)), '']} />
                  <Bar dataKey="ingresos" fill="#06B6D4" radius={[3,3,0,0]} opacity={0.85} name="Ingresos" />
                  <Bar dataKey="gastos"   fill="#EF4444" radius={[3,3,0,0]} opacity={0.75} name="Gastos" />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Transaction list */}
            <GlassCard className="p-5" animate={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><Receipt size={16} className="text-violet-400" /> Transacciones Recientes</h3>
                <button onClick={() => setTxModal(true)} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all"><Plus size={12} /> Agregar</button>
              </div>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-slate-600"><DollarSign size={28} className="mb-2 opacity-30" /><p className="text-sm">Sin transacciones</p><button onClick={() => setTxModal(true)} className="text-xs text-violet-400 mt-1">+ Agregar primera</button></div>
              ) : (
                <div className="space-y-1">
                  <AnimatePresence>
                    {transactions.slice(0, 15).map((tx, i) => (
                      <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0', tx.type === 'income' ? 'bg-cyan-500/15' : 'bg-red-500/10')}>{tx.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            {tx.category} · {tx.date}
                            {tx.paymentMethod === 'credit' && <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 text-[9px]">crédito</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn('text-sm font-bold tabular-nums', tx.type === 'income' ? 'text-cyan-400' : 'text-red-400')}>{tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}</span>
                          <button onClick={() => removeTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* ══ TAB: DEUDAS ══ */}
        {activeTab === 'deudas' && (
          <motion.div key="deudas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Debt summary */}
            {(debts.length > 0 || creditCards.some(c => c.balance > 0)) && (
              <div className="grid grid-cols-3 gap-3">
                <GlassCard className="p-4 border-red-500/20" animate={false}>
                  <p className="text-xs text-slate-500 mb-1">Deuda Total</p>
                  <p className="text-xl font-black text-red-400 tabular-nums">{fmt(totalDebt)}</p>
                </GlassCard>
                <GlassCard className="p-4" animate={false}>
                  <p className="text-xs text-slate-500 mb-1">Pago Mínimo/Mes</p>
                  <p className="text-xl font-black text-orange-400 tabular-nums">{fmt(debts.reduce((a,d) => a + d.minPayment, 0))}</p>
                </GlassCard>
                <GlassCard className="p-4" animate={false}>
                  <p className="text-xs text-slate-500 mb-1">Deudas Activas</p>
                  <p className="text-xl font-black text-white">{debts.length}</p>
                </GlassCard>
              </div>
            )}

            {/* Debt Plan */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2"><CreditCard size={16} className="text-red-400" /> Plan de Libertad Financiera</h3>
                <button onClick={() => setDebtModal('add')} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all"><Plus size={12} /> Agregar deuda</button>
              </div>
              {debts.length === 0 ? (
                <GlassCard className="p-6 text-center" animate={false}>
                  <Shield size={28} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-sm text-slate-600">Sin deudas registradas</p>
                  <button onClick={() => setDebtModal('add')} className="text-xs text-violet-400 hover:text-violet-300 mt-1">+ Registrar deuda</button>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {debts.map((debt) => {
                    const pct = debt.totalOriginal > 0 ? Math.max(0, (1 - debt.remaining / debt.totalOriginal) * 100) : 0
                    const monthsLeft = debt.minPayment > 0 ? Math.ceil(debt.remaining / debt.minPayment) : 0
                    const payoffDate = new Date(); payoffDate.setMonth(payoffDate.getMonth() + monthsLeft)
                    return (
                      <GlassCard key={debt.id} className="p-4" animate={false}>
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-2xl leading-none mt-0.5">{debt.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="font-semibold text-white">{debt.name}</p>
                              <div className="flex gap-1">
                                <button onClick={() => { setPayDebtAmt(String(debt.minPayment)); setPayDebtModal(debt.id) }} className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-medium transition-all">Pagar</button>
                                <button onClick={() => openEditDebt(debt.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 hover:text-white transition-all"><Pencil size={11} /></button>
                                <button onClick={() => removeDebt(debt.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 transition-all"><Trash2 size={11} /></button>
                              </div>
                            </div>
                            <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                              <span>Restante: <strong className="text-red-400 tabular-nums">{fmt(debt.remaining)}</strong></span>
                              <span>Original: <strong className="text-slate-400 tabular-nums">{fmt(debt.totalOriginal)}</strong></span>
                              <span>Pago mín: <strong className="text-orange-400 tabular-nums">{fmt(debt.minPayment)}</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-2">
                          <motion.div className="h-full rounded-full" style={{ background: debt.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-600">
                          <span>{Math.round(pct)}% pagado</span>
                          <span>{monthsLeft > 0 ? `~${monthsLeft} meses · ${format(payoffDate, 'MMM yyyy', { locale: es })}` : 'Pagada ✓'}</span>
                        </div>
                        {debt.dueDay && <p className="text-[10px] text-amber-400/70 mt-1">Vence día {debt.dueDay} de cada mes</p>}
                      </GlassCard>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Savings Goals */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2"><PiggyBank size={16} className="text-emerald-400" /> Metas Financieras</h3>
                <button onClick={() => setGoalModal(true)} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all"><Plus size={12} /> Agregar</button>
              </div>
              {savingsGoals.length === 0 ? (
                <GlassCard className="p-6 text-center" animate={false}>
                  <PiggyBank size={28} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-sm text-slate-600">Sin metas de ahorro</p>
                  <button onClick={() => setGoalModal(true)} className="text-xs text-violet-400 hover:text-violet-300 mt-1">+ Crear primera meta</button>
                </GlassCard>
              ) : (
                <div className="space-y-2">
                  {savingsGoals.map(goal => {
                    const pct = Math.min((goal.current / goal.target) * 100, 100)
                    const isOpen = activeGoal === goal.id
                    const goalTxs = getGoalTransactions(goal.id)
                    const monthsLeft = config.autoSavings > 0 ? Math.ceil((goal.target - goal.current) / config.autoSavings) : null
                    return (
                      <div key={goal.id} className="rounded-xl border border-white/[0.05] overflow-hidden">
                        <div className="flex items-center gap-3 p-3 bg-white/[0.02]">
                          <span className="text-xl leading-none">{goal.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-white">{goal.name}</span>
                              <span className="text-xs font-bold tabular-nums" style={{ color: goal.color }}>{fmt(goal.current)} / {fmt(goal.target)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <motion.div className="h-full rounded-full" style={{ background: goal.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-slate-600">{Math.round(pct)}% completado</span>
                              <span className="text-[10px] text-slate-600">{goal.deadline ? `Meta: ${goal.deadline}` : monthsLeft ? `~${monthsLeft} meses` : ''}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => { setSavingsTxModal(goal.id); setNewSavingsTx(t => ({ ...t, type: 'deposit' })) }} className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center" title="Depositar"><ArrowDown size={13} /></button>
                            <button onClick={() => { setSavingsTxModal(goal.id); setNewSavingsTx(t => ({ ...t, type: 'withdrawal' })) }} className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 flex items-center justify-center" title="Retirar"><ArrowUp size={13} /></button>
                            <button onClick={() => setActiveGoal(isOpen ? null : goal.id)} className="w-7 h-7 rounded-lg bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] flex items-center justify-center">{isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
                            <button onClick={() => removeSavingsGoal(goal.id)} className="w-7 h-7 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center"><Trash2 size={13} /></button>
                          </div>
                        </div>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                              <div className="border-t border-white/[0.05] bg-white/[0.01]">
                                {goalTxs.length === 0 ? <p className="text-xs text-slate-600 text-center py-4">Sin movimientos</p> : (
                                  <div className="divide-y divide-white/[0.04]">
                                    {goalTxs.map(tx => (
                                      <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 group hover:bg-white/[0.03] transition-colors">
                                        <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', tx.type === 'deposit' ? 'bg-emerald-500/15' : 'bg-orange-500/10')}>
                                          {tx.type === 'deposit' ? <ArrowDown size={11} className="text-emerald-400" /> : <ArrowUp size={11} className="text-orange-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0"><p className="text-xs font-medium text-white truncate">{tx.description}</p><p className="text-[10px] text-slate-600">{tx.date}</p></div>
                                        <span className={cn('text-xs font-bold tabular-nums shrink-0', tx.type === 'deposit' ? 'text-emerald-400' : 'text-orange-400')}>{tx.type === 'deposit' ? '+' : '-'}{fmt(tx.amount)}</span>
                                        <button onClick={() => removeSavingsTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"><Trash2 size={11} /></button>
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
            </div>
          </motion.div>
        )}

        {/* ══ TAB: PRESUPUESTO ══ */}
        {activeTab === 'presupuesto' && (
          <motion.div key="presupuesto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2"><Receipt size={16} className="text-amber-400" /> Presupuesto Mensual</h3>
              <button onClick={() => setBudgetModal(true)} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all"><Plus size={12} /> Agregar</button>
            </div>
            <div className="space-y-2">
              {budgets.map(budget => {
                const spent = getSpentOnCategory(budget.category)
                const pct = Math.min((spent / budget.limit) * 100, 100)
                const over = spent > budget.limit
                const paid = isBudgetPaid(budget.category)
                const editing = editingBudget === budget.category
                return (
                  <div key={budget.category} className="group rounded-xl p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { if (paid) { unmarkBudgetPaid(budget.category) } else { setPayAmount(String(budget.limit)); setPayModal(budget.category) } }} className="shrink-0 transition-transform active:scale-90">
                        {paid ? <CheckCircle2 size={22} className="text-emerald-400" /> : <Circle size={22} className="text-slate-600 hover:text-emerald-400 transition-colors" />}
                      </button>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-base leading-none">{budget.icon}</span>
                        <span className={cn('text-sm font-medium truncate', paid ? 'text-slate-400 line-through' : 'text-white')}>{budget.category}</span>
                        {paid && <span className="shrink-0 text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">Pagado</span>}
                      </div>
                      {editing ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-slate-500">RD$</span>
                          <input autoFocus type="number" min={1} value={editValue} onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { const v = Number(editValue); if (v > 0) updateBudget(budget.category, v); setEditingBudget(null) } if (e.key === 'Escape') setEditingBudget(null) }}
                            className="w-24 h-7 rounded-lg bg-white/[0.08] border border-violet-500/40 text-white text-xs px-2 focus:outline-none" />
                          <button onClick={() => { const v = Number(editValue); if (v > 0) updateBudget(budget.category, v); setEditingBudget(null) }} className="text-emerald-400 hover:text-emerald-300"><Check size={14} /></button>
                          <button onClick={() => setEditingBudget(null)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn('text-xs font-bold tabular-nums', over ? 'text-red-400' : paid ? 'text-emerald-400' : 'text-slate-300')}>{fmt(spent)}</span>
                          <span className="text-xs text-slate-600">/ {fmt(budget.limit)}</span>
                          <button onClick={() => { setEditingBudget(budget.category); setEditValue(String(budget.limit)) }} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-violet-400 transition-all ml-1"><Pencil size={11} /></button>
                          <button onClick={() => removeBudget(budget.category)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"><Trash2 size={11} /></button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: over ? '#EF4444' : paid ? '#10B981' : budget.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} />
                    </div>
                    {over && !paid && <p className="text-[10px] text-red-400 mt-1">⚠️ Superado por {fmt(spent - budget.limit)}</p>}
                  </div>
                )
              })}
              {budgets.length === 0 && (
                <div className="text-center py-8 text-slate-600"><Receipt size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Sin presupuestos</p></div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ MODALS ════ */}

      {/* Nueva transacción */}
      <Modal open={txModal} onClose={() => setTxModal(false)} title="Nueva Transacción">
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['expense','income'] as TransactionType[]).map(t => (
              <button key={t} onClick={() => setNewTx(tx => ({ ...tx, type: t }))}
                className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all', newTx.type === t ? t === 'income' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>
                {t === 'income' ? '💰 Ingreso' : '💸 Gasto'}
              </button>
            ))}
          </div>
          <Input label="Descripción" placeholder="Ej: Supermercado, Salario..." value={newTx.description} onChange={e => setNewTx(tx => ({ ...tx, description: e.target.value }))} />
          <Input label="Monto (RD$)" type="number" placeholder="0" min={0} value={newTx.amount} onChange={e => setNewTx(tx => ({ ...tx, amount: e.target.value }))} icon={<DollarSign size={14} />} />
          {newTx.type === 'expense' && (
            <div>
              <label className="text-sm text-slate-400 font-medium block mb-2">Método de pago</label>
              <div className="flex gap-2">
                {(['cash','credit'] as const).map(m => (
                  <button key={m} onClick={() => setNewTx(tx => ({ ...tx, paymentMethod: m }))}
                    className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all', newTx.paymentMethod === m ? m === 'cash' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>
                    {m === 'cash' ? '💵 Efectivo' : '💳 Crédito'}
                  </button>
                ))}
              </div>
              {newTx.paymentMethod === 'credit' && creditCards.length > 0 && (
                <div className="mt-2">
                  <label className="text-sm text-slate-400 font-medium block mb-1.5">Tarjeta</label>
                  <div className="flex flex-wrap gap-2">
                    {creditCards.map(c => (
                      <button key={c.id} onClick={() => setNewTx(tx => ({ ...tx, creditCardId: c.id }))}
                        className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all', newTx.creditCardId === c.id ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50' : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-1.5">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {['Comida','Transporte','Entretenimiento','Salud','Ropa','Servicios','Deuda','Otro'].map(cat => (
                <button key={cat} onClick={() => setNewTx(tx => ({ ...tx, category: cat }))}
                  className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all', newTx.category === cat ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50' : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <Input label="Fecha" type="date" value={newTx.date} onChange={e => setNewTx(tx => ({ ...tx, date: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setTxModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={handleAddTx}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Config */}
      <Modal open={configModal} onClose={() => setConfigModal(false)} title="⚙️ Configuración Financiera">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Define tu ingreso y compromisos fijos para calcular métricas precisas.</p>
          <Input label="Ingreso mensual (RD$)" type="number" min={0} placeholder="0" value={cfgForm.monthlyIncome} onChange={e => setCfgForm(f => ({ ...f, monthlyIncome: e.target.value }))} icon={<TrendingUp size={14} />} />
          <Input label="Gastos fijos comprometidos (alquiler, servicios, etc.)" type="number" min={0} placeholder="0" value={cfgForm.fixedExpenses} onChange={e => setCfgForm(f => ({ ...f, fixedExpenses: e.target.value }))} icon={<Receipt size={14} />} />
          <Input label="Ahorro automático mensual" type="number" min={0} placeholder="0" value={cfgForm.autoSavings} onChange={e => setCfgForm(f => ({ ...f, autoSavings: e.target.value }))} icon={<PiggyBank size={14} />} />
          <Input label="Zona de seguridad — mínimo a conservar" type="number" min={0} placeholder="5000" value={cfgForm.safetyZone} onChange={e => setCfgForm(f => ({ ...f, safetyZone: e.target.value }))} icon={<Shield size={14} />} />
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setConfigModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={handleSaveConfig}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Credit Card */}
      <Modal open={cardModal === 'add'} onClose={() => setCardModal(null)} title="Nueva Tarjeta de Crédito">
        <div className="space-y-4">
          <Input label="Nombre de la tarjeta" placeholder="Visa, Mastercard Banco X..." value={newCard.name} onChange={e => setNewCard(c => ({ ...c, name: e.target.value }))} />
          <Input label="Límite de crédito (RD$)" type="number" min={0} placeholder="25000" value={newCard.limit} onChange={e => setNewCard(c => ({ ...c, limit: e.target.value }))} icon={<DollarSign size={14} />} />
          <Input label="Balance actual adeudado (RD$)" type="number" min={0} placeholder="0" value={newCard.balance} onChange={e => setNewCard(c => ({ ...c, balance: e.target.value }))} icon={<CreditCard size={14} />} />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map(c => <button key={c} onClick={() => setNewCard(nc => ({ ...nc, color: c }))} className={cn('w-7 h-7 rounded-lg transition-all', newCard.color === c && 'ring-2 ring-white/40 scale-110')} style={{ background: c }} />)}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setCardModal(null)}>Cancelar</Button>
            <Button variant="glow" onClick={handleAddCard}>Agregar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!(cardModal && cardModal !== 'add')} onClose={() => setCardModal(null)} title="Editar Tarjeta">
        <div className="space-y-4">
          <Input label="Nombre" value={editCard.name} onChange={e => setEditCard(c => ({ ...c, name: e.target.value }))} />
          <Input label="Límite (RD$)" type="number" min={0} value={editCard.limit} onChange={e => setEditCard(c => ({ ...c, limit: e.target.value }))} icon={<DollarSign size={14} />} />
          <Input label="Balance actual (RD$)" type="number" min={0} value={editCard.balance} onChange={e => setEditCard(c => ({ ...c, balance: e.target.value }))} icon={<CreditCard size={14} />} />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map(c => <button key={c} onClick={() => setEditCard(ec => ({ ...ec, color: c }))} className={cn('w-7 h-7 rounded-lg transition-all', editCard.color === c && 'ring-2 ring-white/40 scale-110')} style={{ background: c }} />)}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setCardModal(null)}>Cancelar</Button>
            <Button variant="glow" onClick={() => handleEditCard(cardModal as string)}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Add Debt */}
      <Modal open={debtModal === 'add'} onClose={() => setDebtModal(null)} title="Registrar Deuda">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input label="Emoji" value={newDebt.icon} onChange={e => setNewDebt(d => ({ ...d, icon: e.target.value }))} className="w-20" />
            <div className="flex-1"><Input label="Nombre" placeholder="Tarjeta Banco X, Préstamo..." value={newDebt.name} onChange={e => setNewDebt(d => ({ ...d, name: e.target.value }))} /></div>
          </div>
          <Input label="Monto restante (RD$)" type="number" min={0} placeholder="0" value={newDebt.remaining} onChange={e => setNewDebt(d => ({ ...d, remaining: e.target.value }))} icon={<DollarSign size={14} />} />
          <Input label="Monto original (RD$)" type="number" min={0} placeholder="0" value={newDebt.totalOriginal} onChange={e => setNewDebt(d => ({ ...d, totalOriginal: e.target.value }))} icon={<DollarSign size={14} />} />
          <Input label="Pago mínimo mensual (RD$)" type="number" min={0} placeholder="0" value={newDebt.minPayment} onChange={e => setNewDebt(d => ({ ...d, minPayment: e.target.value }))} icon={<Receipt size={14} />} />
          <Input label="Día de vencimiento (opcional)" type="number" min={1} max={31} placeholder="15" value={newDebt.dueDay} onChange={e => setNewDebt(d => ({ ...d, dueDay: e.target.value }))} />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {DEBT_COLORS.map(c => <button key={c} onClick={() => setNewDebt(d => ({ ...d, color: c }))} className={cn('w-7 h-7 rounded-lg transition-all', newDebt.color === c && 'ring-2 ring-white/40 scale-110')} style={{ background: c }} />)}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setDebtModal(null)}>Cancelar</Button>
            <Button variant="glow" onClick={handleAddDebt}>Registrar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Debt */}
      <Modal open={!!(debtModal && debtModal !== 'add')} onClose={() => setDebtModal(null)} title="Editar Deuda">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input label="Emoji" value={editDebt.icon} onChange={e => setEditDebt(d => ({ ...d, icon: e.target.value }))} className="w-20" />
            <div className="flex-1"><Input label="Nombre" value={editDebt.name} onChange={e => setEditDebt(d => ({ ...d, name: e.target.value }))} /></div>
          </div>
          <Input label="Monto restante (RD$)" type="number" min={0} value={editDebt.remaining} onChange={e => setEditDebt(d => ({ ...d, remaining: e.target.value }))} icon={<DollarSign size={14} />} />
          <Input label="Monto original (RD$)" type="number" min={0} value={editDebt.totalOriginal} onChange={e => setEditDebt(d => ({ ...d, totalOriginal: e.target.value }))} icon={<DollarSign size={14} />} />
          <Input label="Pago mínimo mensual (RD$)" type="number" min={0} value={editDebt.minPayment} onChange={e => setEditDebt(d => ({ ...d, minPayment: e.target.value }))} icon={<Receipt size={14} />} />
          <Input label="Día de vencimiento (opcional)" type="number" min={1} max={31} value={editDebt.dueDay} onChange={e => setEditDebt(d => ({ ...d, dueDay: e.target.value }))} />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {DEBT_COLORS.map(c => <button key={c} onClick={() => setEditDebt(d => ({ ...d, color: c }))} className={cn('w-7 h-7 rounded-lg transition-all', editDebt.color === c && 'ring-2 ring-white/40 scale-110')} style={{ background: c }} />)}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setDebtModal(null)}>Cancelar</Button>
            <Button variant="glow" onClick={() => handleEditDebt(debtModal as string)}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Pay Debt */}
      <Modal open={!!payDebtModal} onClose={() => setPayDebtModal(null)} title={`Pagar — ${debts.find(d => d.id === payDebtModal)?.name ?? ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">El pago se registrará como gasto y reducirá el balance de la deuda.</p>
          <Input label="Monto a pagar (RD$)" type="number" min={1} placeholder="0" value={payDebtAmt} onChange={e => setPayDebtAmt(e.target.value)} icon={<DollarSign size={14} />} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setPayDebtModal(null)}>Cancelar</Button>
            <Button variant="glow" onClick={() => handlePayDebt(payDebtModal!)}><CheckCircle2 size={14} /> Registrar pago</Button>
          </div>
        </div>
      </Modal>

      {/* Marcar presupuesto pagado */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Pagar — ${payModal ?? ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Ingresa el monto exacto pagado. Se registrará como gasto del mes.</p>
          <Input label="Monto pagado (RD$)" type="number" min={1} placeholder="0" value={payAmount} onChange={e => setPayAmount(e.target.value)} icon={<DollarSign size={14} />} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setPayModal(null)}>Cancelar</Button>
            <Button variant="glow" onClick={() => handlePay(payModal!)}><CheckCircle2 size={14} /> Marcar como pagado</Button>
          </div>
        </div>
      </Modal>

      {/* Nueva categoría presupuesto */}
      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Nueva Categoría de Presupuesto">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input label="Emoji" value={newBudget.icon} onChange={e => setNewBudget(b => ({ ...b, icon: e.target.value }))} className="w-20" />
            <div className="flex-1"><Input label="Nombre" placeholder="Educación, Mascotas..." value={newBudget.category} onChange={e => setNewBudget(b => ({ ...b, category: e.target.value }))} /></div>
          </div>
          <Input label="Límite mensual (RD$)" type="number" min={1} placeholder="500" value={newBudget.limit} onChange={e => setNewBudget(b => ({ ...b, limit: e.target.value }))} icon={<DollarSign size={14} />} />
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {['#7C3AED','#06B6D4','#F59E0B','#10B981','#EC4899','#F97316','#EF4444','#8B5CF6'].map(c => (
                <button key={c} onClick={() => setNewBudget(b => ({ ...b, color: c }))} className={cn('w-7 h-7 rounded-lg transition-all', newBudget.color === c && 'ring-2 ring-white/40 scale-110')} style={{ background: c }} />
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
            <div className="flex-1"><Input label="Nombre" placeholder="Vacaciones, iPhone, Auto..." value={newGoal.name} onChange={e => setNewGoal(g => ({ ...g, name: e.target.value }))} /></div>
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

      {/* Nuevo gasto fijo de tarjeta */}
      <Modal open={!!chargeModal} onClose={() => setChargeModal(null)} title={`📅 Gasto Fijo — ${creditCards.find(c => c.id === chargeModal)?.name ?? ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Define un gasto recurrente mensual cargado a esta tarjeta (suscripciones, servicios, etc.).</p>
          <div className="flex gap-3">
            <Input label="Emoji" value={newCharge.icon} onChange={e => setNewCharge(c => ({ ...c, icon: e.target.value }))} className="w-20" />
            <div className="flex-1"><Input label="Nombre" placeholder="Netflix, Spotify, Internet..." value={newCharge.name} onChange={e => setNewCharge(c => ({ ...c, name: e.target.value }))} /></div>
          </div>
          <Input label="Monto mensual (RD$)" type="number" min={1} placeholder="0" value={newCharge.amount} onChange={e => setNewCharge(c => ({ ...c, amount: e.target.value }))} icon={<DollarSign size={14} />} />
          <Input label="Día de cobro (opcional)" type="number" min={1} max={31} placeholder="15" value={newCharge.billingDay} onChange={e => setNewCharge(c => ({ ...c, billingDay: e.target.value }))} />
          <p className="text-xs text-slate-500">Al marcarlo como registrado cada mes, se creará la transacción y se sumará al balance de la tarjeta automáticamente.</p>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setChargeModal(null)}>Cancelar</Button>
            <Button variant="glow" onClick={() => handleAddCharge(chargeModal!)}>Agregar cargo</Button>
          </div>
        </div>
      </Modal>

      {/* Movimiento de ahorro */}
      <Modal open={!!savingsTxModal} onClose={() => setSavingsTxModal(null)} title={newSavingsTx.type === 'deposit' ? '⬇️ Depositar a meta' : '⬆️ Retirar de meta'}>
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['deposit','withdrawal'] as SavingsTxType[]).map(t => (
              <button key={t} onClick={() => setNewSavingsTx(tx => ({ ...tx, type: t }))}
                className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all', newSavingsTx.type === t ? t === 'deposit' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>
                {t === 'deposit' ? '⬇️ Depositar' : '⬆️ Retirar'}
              </button>
            ))}
          </div>
          <Input label="Descripción" placeholder="Quincena, Bono..." value={newSavingsTx.description} onChange={e => setNewSavingsTx(tx => ({ ...tx, description: e.target.value }))} />
          <Input label="Monto (RD$)" type="number" min={1} placeholder="0" value={newSavingsTx.amount} onChange={e => setNewSavingsTx(tx => ({ ...tx, amount: e.target.value }))} icon={<DollarSign size={14} />} />
          <Input label="Fecha" type="date" value={newSavingsTx.date} onChange={e => setNewSavingsTx(tx => ({ ...tx, date: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setSavingsTxModal(null)}>Cancelar</Button>
            <Button variant="glow" onClick={() => handleAddSavingsTx(savingsTxModal!)}>Guardar</Button>
          </div>
        </div>
      </Modal>

    </motion.div>
  )
}
