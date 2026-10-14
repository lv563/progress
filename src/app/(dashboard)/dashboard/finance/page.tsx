'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import {
  Wallet, Plus, TrendingUp, TrendingDown, PiggyBank, LayoutGrid,
  Target, History, Check, AlertTriangle, Trash2, X, ChevronDown,
  DollarSign, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useFinanceStore } from '@/stores/finance.store'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const $ = (n: number) =>
  '$' + Math.abs(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const todayStr = () => new Date().toISOString().slice(0, 10)
const monthStr = () => new Date().toISOString().slice(0, 7)

const INCOME_CATS = ['Salario', 'Freelance', 'Comisión', 'Negocio', 'Inversión', 'Renta', 'Beca', 'Otros']
const INCOME_COLOR: Record<string, string> = {
  Salario: '#FFFFFF', Freelance: '#CCCCCC', Comisión: '#AAAAAA',
  Negocio: '#EF4444', Inversión: '#EF4444', Renta: '#CCCCCC', Beca: '#AAAAAA', Otros: '#666666',
}
const BUDGET_META: Record<string, { icon: string; color: string }> = {
  Alimentación: { icon: '🍽️', color: '#EF4444' },
  Transporte:   { icon: '🚗',  color: '#EF4444' },
  Vivienda:     { icon: '🏠',  color: '#EF4444' },
  Entretenimiento: { icon: '🎬', color: '#EF4444' },
  Educación:    { icon: '📚',  color: '#EF4444' },
  Salud:        { icon: '💊',  color: '#EF4444' },
  Compras:      { icon: '🛍️', color: '#EF4444' },
  Otros:        { icon: '📦',  color: '#888888' },
}
const TABS = ['Resumen', 'Deudas', 'Ingresos', 'Ahorros', 'Presupuesto', 'Movimientos'] as const
type Tab = typeof TABS[number]

/* ─── Progress Bar ───────────────────────────────────────────────────────────── */
function ProgressBar({ pct, color = '#EF4444' }: { pct: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

/* ─── Field ──────────────────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
function Inp({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn('w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 px-3 text-sm focus:outline-none focus:border-[#EF4444]/40 transition-colors', className)}
    />
  )
}
function Sel({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn('w-full h-10 rounded-xl bg-[#111] border border-white/10 text-white px-3 text-sm focus:outline-none focus:border-[#EF4444]/40 transition-colors', className)}
    >
      {children}
    </select>
  )
}

/* ─── Stat card ──────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color = '#EF4444', icon }: {
  label: string; value: string; sub?: string; color?: string; icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#111] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black tracking-[0.3em] text-gray-600 uppercase">{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-gray-600">{sub}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB: RESUMEN
══════════════════════════════════════════════════════════════════════════════ */
function SummaryTab() {
  const store = useFinanceStore()
  const income    = store.getMonthlyIncome()
  const expenses  = store.getMonthlyExpenses()
  const savings   = store.getMonthlySavings()
  const totalDebt = store.getTotalDebt()
  const balance   = income - expenses - savings
  const month     = format(new Date(), "MMMM yyyy", { locale: es })

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
      <motion.p variants={fadeUp} className="text-xs text-gray-600 capitalize">{month}</motion.p>

      {/* 4 stat cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
        <StatCard label="Balance disponible" value={$(balance)} color={balance >= 0 ? '#FFFFFF' : '#EF4444'}
          sub={balance >= 0 ? 'Positivo este mes' : 'Déficit este mes'}
          icon={<DollarSign size={14} />} />
        <StatCard label="Ingresos del mes" value={$(income)} color="#FFFFFF"
          sub="Total registrado" icon={<TrendingUp size={14} />} />
        <StatCard label="Gastos del mes" value={$(expenses)} color="#EF4444"
          sub="Gastos + deudas" icon={<TrendingDown size={14} />} />
        <StatCard label="Ahorros" value={$(savings)} color="#CCCCCC"
          sub="Depósitos este mes" icon={<PiggyBank size={14} />} />
      </motion.div>

      {/* Financial summary */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
        <p className="text-[10px] font-black tracking-[0.3em] text-gray-600 uppercase">Resumen financiero</p>
        {[
          { label: 'Ingresos',      value: income,    color: '#FFFFFF', prefix: '+' },
          { label: 'Gastos',        value: expenses,  color: '#EF4444', prefix: '-' },
          { label: 'Ahorros',       value: savings,   color: '#CCCCCC', prefix: '' },
          { label: 'Disponible',    value: balance,   color: balance >= 0 ? '#FFFFFF' : '#EF4444', prefix: balance >= 0 ? '+' : '-' },
        ].map(r => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{r.label}</span>
            <span className="font-black tabular-nums" style={{ color: r.color }}>
              {r.prefix}{$(Math.abs(r.value))}
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-white/6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Deuda total pendiente</span>
            <span className="text-sm font-black text-[#EF4444]">{$(totalDebt)}</span>
          </div>
        </div>
      </motion.div>

      {/* Score */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-[#111] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black tracking-[0.3em] text-gray-600 uppercase">Salud financiera</p>
          <span className="text-2xl font-black text-white">{store.getFinancialScore()}</span>
        </div>
        <ProgressBar pct={store.getFinancialScore()} color={store.getFinancialScore() >= 60 ? '#FFFFFF' : store.getFinancialScore() >= 40 ? '#CCCCCC' : '#EF4444'} />
        <p className="text-[11px] text-gray-600 mt-2">
          {store.getFinancialScore() >= 80 ? 'Excelente control financiero' :
           store.getFinancialScore() >= 60 ? 'Buen manejo del dinero' :
           store.getFinancialScore() >= 40 ? 'Hay áreas de mejora' : 'Necesitas ajustar tus finanzas'}
        </p>
      </motion.div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB: DEUDAS
══════════════════════════════════════════════════════════════════════════════ */
function DebtsTab() {
  const { debts, addDebt, removeDebt, payDebt } = useFinanceStore()
  const [newModal, setNewModal] = useState(false)
  const [payModal, setPayModal] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', totalOriginal: '', deadline: '', note: '' })
  const [payForm, setPayForm] = useState({ amount: '', note: '', date: todayStr() })

  const handleAdd = () => {
    const total = parseFloat(form.totalOriginal)
    if (!form.name.trim() || isNaN(total) || total <= 0) return
    addDebt({ name: form.name.trim(), icon: '💳', totalOriginal: total, remaining: total,
      minPayment: 0, color: '#EF4444', deadline: form.deadline || undefined, note: form.note || undefined })
    setForm({ name: '', totalOriginal: '', deadline: '', note: '' })
    setNewModal(false)
  }

  const handlePay = (id: string) => {
    const amount = parseFloat(payForm.amount)
    if (isNaN(amount) || amount <= 0) return
    payDebt(id, amount, payForm.note || undefined)
    setPayForm({ amount: '', note: '', date: todayStr() })
    setPayModal(null)
  }

  const totalDebt = debts.reduce((a, d) => a + d.remaining, 0)
  const totalPaid = debts.reduce((a, d) => a + (d.totalOriginal - d.remaining), 0)

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
      {/* Header row */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white">Mis deudas</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {$(totalDebt)} pendiente · {$(totalPaid)} pagado
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setNewModal(true)}>
          <Plus size={13} /> Nueva deuda
        </Button>
      </motion.div>

      {/* Debt cards */}
      {debts.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-16">
          <div className="text-4xl mb-3">💳</div>
          <p className="text-gray-600 text-sm">Sin deudas registradas</p>
          <button onClick={() => setNewModal(true)} className="mt-3 text-xs text-[#EF4444] hover:underline">Agregar deuda →</button>
        </motion.div>
      ) : (
        <AnimatePresence>
          {debts.map((debt, i) => {
            const paid = debt.totalOriginal - debt.remaining
            const pct = debt.totalOriginal > 0 ? Math.round((paid / debt.totalOriginal) * 100) : 0
            const done = debt.remaining <= 0
            return (
              <motion.div key={debt.id} variants={fadeUp} transition={{ delay: i * 0.04 }}
                className={cn('rounded-2xl border p-5 space-y-3', done ? 'border-white/15 bg-white/5' : 'border-white/8 bg-[#111]')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-white truncate">{debt.name}</p>
                      {done && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-white/15 px-2 py-0.5 rounded-full">
                          <Check size={10} /> Pagada
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Original: {$(debt.totalOriginal)} · Pagado: {$(paid)}
                    </p>
                    {debt.deadline && (
                      <p className="text-[11px] text-gray-600">Vence: {debt.deadline}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-white tabular-nums">{$(debt.remaining)}</p>
                    <p className="text-[10px] text-gray-600">pendiente</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <ProgressBar pct={pct} color={done ? '#FFFFFF' : pct > 50 ? '#CCCCCC' : '#EF4444'} />
                  <p className="text-[10px] text-gray-600">{pct}% pagado</p>
                </div>

                <div className="flex gap-2">
                  {!done && (
                    <button
                      onClick={() => setPayModal(debt.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EF4444] text-white text-xs font-black hover:bg-red-500 transition-colors"
                    >
                      <Plus size={12} /> Abonar
                    </button>
                  )}
                  <button
                    onClick={() => removeDebt(debt.id)}
                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-600 hover:text-red-400 hover:border-red-400/30 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}

      {/* New debt modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Nueva deuda">
        <div className="space-y-3">
          <Field label="Nombre de la deuda">
            <Inp placeholder="Tarjeta de crédito, préstamo..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Monto total">
            <Inp type="number" placeholder="0.00" value={form.totalOriginal}
              onChange={e => setForm(f => ({ ...f, totalOriginal: e.target.value }))} />
          </Field>
          <Field label="Fecha límite (opcional)">
            <Inp type="date" value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </Field>
          <Field label="Nota (opcional)">
            <Inp placeholder="Observaciones..." value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setNewModal(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={handleAdd}>Agregar</Button>
          </div>
        </div>
      </Modal>

      {/* Pay debt modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Registrar abono">
        {payModal && (() => {
          const debt = debts.find(d => d.id === payModal)
          return (
            <div className="space-y-3">
              {debt && (
                <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/8 text-sm">
                  <span className="text-gray-500">{debt.name}</span>
                  <span className="ml-2 font-black text-white">{$(debt.remaining)} pendiente</span>
                </div>
              )}
              <Field label="Monto del abono">
                <Inp type="number" placeholder="0.00" value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
              </Field>
              <Field label="Fecha">
                <Inp type="date" value={payForm.date}
                  onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Nota (opcional)">
                <Inp placeholder="Referencia, banco..." value={payForm.note}
                  onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} />
              </Field>
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" className="flex-1" onClick={() => setPayModal(null)}>Cancelar</Button>
                <Button variant="primary" className="flex-1" onClick={() => handlePay(payModal!)}>Confirmar abono</Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB: INGRESOS
══════════════════════════════════════════════════════════════════════════════ */
function IncomesTab() {
  const { transactions, addTransaction, removeTransaction, getMonthlyIncome } = useFinanceStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ concept: '', amount: '', category: 'Salario', date: todayStr(), note: '' })

  const monthlyTotal = getMonthlyIncome()
  const incomes = transactions
    .filter(t => t.type === 'income')
    .sort((a, b) => b.date.localeCompare(a.date))

  const handleAdd = () => {
    const amount = parseFloat(form.amount)
    if (!form.concept.trim() || isNaN(amount) || amount <= 0) return
    addTransaction({
      type: 'income', category: form.category, amount,
      description: form.note ? `${form.concept} — ${form.note}` : form.concept,
      date: form.date, icon: '💵',
    })
    setForm({ concept: '', amount: '', category: 'Salario', date: todayStr(), note: '' })
    setModal(false)
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
      {/* Live total */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-[10px] font-black tracking-[0.4em] text-gray-400 uppercase">Total ingresos del mes</p>
        <motion.p
          key={monthlyTotal}
          initial={{ scale: 0.95, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black text-white tabular-nums mt-1"
        >
          {$(monthlyTotal)}
        </motion.p>
        <p className="text-xs text-gray-500 mt-1">{incomes.filter(t => t.date.startsWith(monthStr())).length} registro{incomes.filter(t => t.date.startsWith(monthStr())).length !== 1 ? 's' : ''} este mes</p>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <p className="text-sm font-black text-white">Mis ingresos</p>
        <Button variant="primary" size="sm" onClick={() => setModal(true)}>
          <Plus size={13} /> Agregar ingreso
        </Button>
      </motion.div>

      {/* Income list */}
      {incomes.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-12">
          <div className="text-4xl mb-3">💵</div>
          <p className="text-gray-600 text-sm">Sin ingresos registrados</p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-2">
          {incomes.map(t => {
            const color = INCOME_COLOR[t.category] ?? '#9CA3AF'
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/6 bg-[#111] group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <ArrowUpRight size={16} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{t.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
                      {t.category}
                    </span>
                    <span className="text-[10px] text-gray-600">{t.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-white tabular-nums">+{$(t.amount)}</p>
                </div>
                <button onClick={() => removeTransaction(t.id)}
                  className="ml-1 w-6 h-6 rounded-lg flex items-center justify-center text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Agregar ingreso">
        <div className="space-y-3">
          <Field label="Concepto">
            <Inp placeholder="Salario quincenal, pago cliente..." value={form.concept}
              onChange={e => setForm(f => ({ ...f, concept: e.target.value }))} />
          </Field>
          <Field label="Monto">
            <Inp type="number" placeholder="0.00" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </Field>
          <Field label="Categoría">
            <Sel value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {INCOME_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </Sel>
          </Field>
          <Field label="Fecha">
            <Inp type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Nota (opcional)">
            <Inp placeholder="Referencia, cliente..." value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={handleAdd}>Agregar ingreso</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB: AHORROS
══════════════════════════════════════════════════════════════════════════════ */
function SavingsTab() {
  const { savingsGoals, addSavingsGoal, removeSavingsGoal, addSavingsTransaction } = useFinanceStore()
  const [goalModal, setGoalModal] = useState(false)
  const [depositModal, setDepositModal] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', target: '', deadline: '', description: '' })
  const [depForm, setDepForm] = useState({ amount: '', date: todayStr(), note: '' })

  const handleAddGoal = () => {
    const target = parseFloat(form.target)
    if (!form.name.trim() || isNaN(target) || target <= 0) return
    addSavingsGoal({ name: form.name, target, current: 0, icon: '🎯', color: '#EF4444',
      deadline: form.deadline || undefined })
    setForm({ name: '', target: '', deadline: '', description: '' })
    setGoalModal(false)
  }

  const handleDeposit = (goalId: string) => {
    const amount = parseFloat(depForm.amount)
    if (isNaN(amount) || amount <= 0) return
    addSavingsTransaction({ goalId, type: 'deposit', amount,
      description: depForm.note || 'Depósito', date: depForm.date })
    setDepForm({ amount: '', date: todayStr(), note: '' })
    setDepositModal(null)
  }

  const totalSaved = savingsGoals.reduce((a, g) => a + g.current, 0)

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white">Mis ahorros</p>
          <p className="text-xs text-gray-600 mt-0.5">Total ahorrado: {$(totalSaved)}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setGoalModal(true)}>
          <Plus size={13} /> Nueva meta
        </Button>
      </motion.div>

      {savingsGoals.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-16">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-600 text-sm">Sin metas de ahorro</p>
          <button onClick={() => setGoalModal(true)} className="mt-3 text-xs text-[#EF4444] hover:underline">Crear meta →</button>
        </motion.div>
      ) : (
        <AnimatePresence>
          {savingsGoals.map((goal, i) => {
            const pct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0
            const done = pct >= 100
            return (
              <motion.div key={goal.id} variants={fadeUp} transition={{ delay: i * 0.04 }}
                className={cn('rounded-2xl border p-5 space-y-3', done ? 'border-white/15 bg-white/5' : 'border-white/8 bg-[#111]')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-white">{goal.name}</p>
                      {done && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-white/15 px-2 py-0.5 rounded-full">
                          🎯 Meta alcanzada
                        </span>
                      )}
                    </div>
                    {goal.deadline && <p className="text-[11px] text-gray-600 mt-0.5">Objetivo: {goal.deadline}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-white tabular-nums">{$(goal.current)}</p>
                    <p className="text-[10px] text-gray-600">de {$(goal.target)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Meta', value: $(goal.target), color: '#CCCCCC' },
                    { label: 'Ahorrado', value: $(goal.current), color: '#FFFFFF' },
                    { label: 'Faltante', value: $(Math.max(0, goal.target - goal.current)), color: '#EF4444' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-white/[0.03] py-2">
                      <p className="text-sm font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <ProgressBar pct={pct} color={done ? '#FFFFFF' : '#EF4444'} />
                  <p className="text-[10px] text-gray-600">{pct}% completado</p>
                </div>

                <div className="flex gap-2">
                  {!done && (
                    <button onClick={() => setDepositModal(goal.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EF4444] text-white text-xs font-black hover:bg-red-500 transition-colors">
                      <Plus size={12} /> Agregar ahorro
                    </button>
                  )}
                  <button onClick={() => removeSavingsGoal(goal.id)}
                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-600 hover:text-red-400 hover:border-red-400/30 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}

      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Nueva meta de ahorro">
        <div className="space-y-3">
          <Field label="Nombre de la meta">
            <Inp placeholder="Comprar vehículo, Viaje, Emergencias..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Monto objetivo">
            <Inp type="number" placeholder="0.00" value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
          </Field>
          <Field label="Fecha objetivo (opcional)">
            <Inp type="date" value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setGoalModal(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={handleAddGoal}>Crear meta</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!depositModal} onClose={() => setDepositModal(null)} title="Agregar ahorro">
        {depositModal && (
          <div className="space-y-3">
            <Field label="Monto a depositar">
              <Inp type="number" placeholder="0.00" value={depForm.amount}
                onChange={e => setDepForm(f => ({ ...f, amount: e.target.value }))} />
            </Field>
            <Field label="Fecha">
              <Inp type="date" value={depForm.date}
                onChange={e => setDepForm(f => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field label="Nota (opcional)">
              <Inp placeholder="Fuente, observación..." value={depForm.note}
                onChange={e => setDepForm(f => ({ ...f, note: e.target.value }))} />
            </Field>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => setDepositModal(null)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={() => handleDeposit(depositModal!)}>Depositar</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB: PRESUPUESTO
══════════════════════════════════════════════════════════════════════════════ */
function BudgetTab() {
  const { budgets, addBudget, updateBudget, removeBudget, addTransaction, getSpentOnCategory } = useFinanceStore()
  const [expModal, setExpModal] = useState<string | null>(null)
  const [catModal, setCatModal] = useState(false)
  const [limitModal, setLimitModal] = useState<string | null>(null)
  const [expForm, setExpForm] = useState({ concept: '', amount: '', date: todayStr() })
  const [newCat, setNewCat] = useState({ name: '', limit: '' })
  const [newLimit, setNewLimit] = useState('')

  const totalLimit = budgets.reduce((a, b) => a + b.limit, 0)
  const totalSpent = budgets.reduce((a, b) => a + getSpentOnCategory(b.category), 0)
  const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0

  const handleAddExpense = (cat: string) => {
    const amount = parseFloat(expForm.amount)
    if (!expForm.concept.trim() || isNaN(amount) || amount <= 0) return
    const meta = BUDGET_META[cat] ?? { icon: '📦', color: '#9CA3AF' }
    addTransaction({ type: 'expense', category: cat, amount,
      description: expForm.concept, date: expForm.date, icon: meta.icon })
    setExpForm({ concept: '', amount: '', date: todayStr() })
    setExpModal(null)
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
      {/* Overall */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-[#111] p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-black tracking-[0.3em] text-gray-600 uppercase">Presupuesto mensual</p>
          <span className="text-xs font-bold text-gray-500">{overallPct}% usado</span>
        </div>
        <div className="flex items-end justify-between gap-2 mt-3">
          <div>
            <p className="text-2xl font-black text-white tabular-nums">{$(totalSpent)}</p>
            <p className="text-xs text-gray-600 mt-0.5">gastado de {$(totalLimit)}</p>
          </div>
          <div className="text-right">
            <p className={cn('text-lg font-black tabular-nums', totalLimit - totalSpent >= 0 ? 'text-white' : 'text-red-400')}>
              {$(Math.abs(totalLimit - totalSpent))}
            </p>
            <p className="text-xs text-gray-600">{totalLimit - totalSpent >= 0 ? 'disponible' : 'excedido'}</p>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar pct={overallPct} color={overallPct > 100 ? '#EF4444' : overallPct > 80 ? '#CCCCCC' : '#FFFFFF'} />
        </div>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <p className="text-sm font-black text-white">Categorías</p>
        <Button variant="secondary" size="sm" onClick={() => setCatModal(true)}>
          <Plus size={13} /> Nueva categoría
        </Button>
      </motion.div>

      {/* Category cards */}
      <motion.div variants={fadeUp} className="space-y-2">
        {budgets.map(b => {
          const spent = getSpentOnCategory(b.category)
          const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0
          const over = b.limit > 0 && spent > b.limit
          const warn = b.limit > 0 && pct >= 80 && !over
          const meta = BUDGET_META[b.category] ?? { icon: '📦', color: '#9CA3AF' }
          return (
            <div key={b.category} className={cn('rounded-2xl border p-4 space-y-2 group',
              over ? 'border-red-500/25 bg-red-500/5' : 'border-white/8 bg-[#111]')}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white">{b.category}</p>
                    {over && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                        <AlertTriangle size={9} /> Excedido
                      </span>
                    )}
                    {warn && (
                      <span className="text-[10px] font-bold text-gray-400">⚠ Casi al límite</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600">
                    {$(spent)} / {b.limit > 0 ? $(b.limit) : 'Sin límite'}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setLimitModal(b.category); setNewLimit(String(b.limit)) }}
                    className="text-[10px] text-gray-500 hover:text-white px-2 py-1 rounded-lg bg-white/5 border border-white/8 transition-colors">
                    Límite
                  </button>
                  <button onClick={() => { setExpModal(b.category); setExpForm({ concept: '', amount: '', date: todayStr() }) }}
                    className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#EF4444] hover:bg-red-500 px-2 py-1 rounded-lg transition-colors">
                    <Plus size={10} /> Gasto
                  </button>
                  <button onClick={() => removeBudget(b.category)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 bg-white/5 border border-white/8 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              {b.limit > 0 && <ProgressBar pct={pct} color={over ? '#EF4444' : warn ? '#CCCCCC' : meta.color} />}
            </div>
          )
        })}
      </motion.div>

      {/* Add expense modal */}
      <Modal open={!!expModal} onClose={() => setExpModal(null)} title={`Gasto — ${expModal}`}>
        <div className="space-y-3">
          <Field label="Concepto">
            <Inp placeholder="Supermercado, gasolina..." value={expForm.concept}
              onChange={e => setExpForm(f => ({ ...f, concept: e.target.value }))} />
          </Field>
          <Field label="Monto">
            <Inp type="number" placeholder="0.00" value={expForm.amount}
              onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} />
          </Field>
          <Field label="Fecha">
            <Inp type="date" value={expForm.date}
              onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setExpModal(null)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={() => handleAddExpense(expModal!)}>Registrar gasto</Button>
          </div>
        </div>
      </Modal>

      {/* New category modal */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Nueva categoría">
        <div className="space-y-3">
          <Field label="Nombre de la categoría">
            <Inp placeholder="Mascotas, Tecnología..." value={newCat.name}
              onChange={e => setNewCat(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Límite mensual">
            <Inp type="number" placeholder="0.00" value={newCat.limit}
              onChange={e => setNewCat(f => ({ ...f, limit: e.target.value }))} />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setCatModal(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={() => {
              if (!newCat.name.trim()) return
              addBudget({ category: newCat.name.trim(), limit: parseFloat(newCat.limit) || 0,
                icon: '📦', color: '#9CA3AF' })
              setNewCat({ name: '', limit: '' })
              setCatModal(false)
            }}>Agregar</Button>
          </div>
        </div>
      </Modal>

      {/* Update limit modal */}
      <Modal open={!!limitModal} onClose={() => setLimitModal(null)} title={`Límite — ${limitModal}`}>
        <div className="space-y-3">
          <Field label="Nuevo límite mensual">
            <Inp type="number" placeholder="0.00" value={newLimit}
              onChange={e => setNewLimit(e.target.value)} />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setLimitModal(null)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={() => {
              if (limitModal) { updateBudget(limitModal, parseFloat(newLimit) || 0); setLimitModal(null) }
            }}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB: MOVIMIENTOS
══════════════════════════════════════════════════════════════════════════════ */
function MovementsTab() {
  const { transactions, savingsTransactions, removeTransaction } = useFinanceStore()
  const [filter, setFilter] = useState<'todos' | 'ingresos' | 'gastos' | 'deudas' | 'ahorros'>('todos')

  const savingsAsTx = useMemo(() =>
    savingsTransactions.map(st => ({
      id: st.id, type: 'savings' as const, category: 'Ahorro', amount: st.amount,
      description: st.description, date: st.date, icon: '🎯',
    })), [savingsTransactions])

  const all = useMemo(() => {
    const combined = [
      ...transactions.map(t => ({ ...t, _src: 'tx' as const })),
      ...savingsAsTx.map(t => ({ ...t, _src: 'sv' as const })),
    ].sort((a, b) => b.date.localeCompare(a.date))
    if (filter === 'ingresos') return combined.filter(t => t.type === 'income')
    if (filter === 'gastos')   return combined.filter(t => t.type === 'expense' && t.category !== 'Deuda')
    if (filter === 'deudas')   return combined.filter(t => t.type === 'expense' && t.category === 'Deuda')
    if (filter === 'ahorros')  return combined.filter(t => t._src === 'sv')
    return combined
  }, [transactions, savingsAsTx, filter])

  const TYPE_STYLE = {
    income:   { label: 'Ingreso',  color: '#FFFFFF', prefix: '+', Icon: ArrowUpRight },
    expense:  { label: 'Gasto',    color: '#EF4444', prefix: '-', Icon: ArrowDownRight },
    deuda:    { label: 'Deuda',    color: '#EF4444', prefix: '-', Icon: Minus },
    savings:  { label: 'Ahorro',   color: '#CCCCCC', prefix: '',  Icon: PiggyBank },
  }

  const getStyle = (t: typeof all[0]) => {
    if (t._src === 'sv') return TYPE_STYLE.savings
    if (t.type === 'income') return TYPE_STYLE.income
    if (t.category === 'Deuda') return TYPE_STYLE.deuda
    return TYPE_STYLE.expense
  }

  const FILTERS = [
    { key: 'todos', label: 'Todos' },
    { key: 'ingresos', label: 'Ingresos' },
    { key: 'gastos', label: 'Gastos' },
    { key: 'deudas', label: 'Deudas' },
    { key: 'ahorros', label: 'Ahorros' },
  ] as const

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <p className="text-sm font-black text-white">Movimientos recientes</p>
        <span className="text-xs text-gray-600">{all.length} registros</span>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
              filter === f.key ? 'bg-[#EF4444] text-white' : 'bg-white/[0.04] border border-white/8 text-gray-500 hover:text-white')}>
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* List */}
      {all.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-600 text-sm">Sin movimientos</p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-1.5">
          {all.map(t => {
            const s = getStyle(t)
            const Icon = s.Icon
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/6 bg-[#111] group">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
                  <Icon size={14} style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{t.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.label}</span>
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-[10px] text-gray-600">{t.category}</span>
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-[10px] text-gray-600">{t.date}</span>
                  </div>
                </div>
                <p className="font-black tabular-nums text-sm shrink-0" style={{ color: s.color }}>
                  {s.prefix}{$(t.amount)}
                </p>
                {t._src === 'tx' && (
                  <button onClick={() => removeTransaction(t.id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-1">
                    <X size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function FinancePage() {
  const [tab, setTab] = useState<Tab>('Resumen')

  const TAB_ICON: Record<Tab, React.ReactNode> = {
    Resumen:       <LayoutGrid size={13} />,
    Deudas:        <TrendingDown size={13} />,
    Ingresos:      <TrendingUp size={13} />,
    Ahorros:       <PiggyBank size={13} />,
    Presupuesto:   <Target size={13} />,
    Movimientos:   <History size={13} />,
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Page header */}
      <div>
        <p className="text-[9px] tracking-[0.4em] text-[#EF4444] font-black uppercase mb-0.5">DINERO</p>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Wallet size={22} className="text-[#EF4444]" /> Finanzas
        </h1>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-0.5 p-1 rounded-2xl bg-white/[0.04] border border-white/6 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center',
              tab === t ? 'bg-[#EF4444] text-white' : 'text-gray-600 hover:text-gray-300'
            )}
          >
            {TAB_ICON[t]}
            <span className="hidden sm:inline">{t}</span>
            <span className="sm:hidden">{t.slice(0, 3)}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'Resumen'     && <SummaryTab />}
          {tab === 'Deudas'      && <DebtsTab />}
          {tab === 'Ingresos'    && <IncomesTab />}
          {tab === 'Ahorros'     && <SavingsTab />}
          {tab === 'Presupuesto' && <BudgetTab />}
          {tab === 'Movimientos' && <MovementsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
