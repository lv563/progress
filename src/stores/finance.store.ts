import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

export type TransactionType = 'income' | 'expense'
export type SavingsTxType   = 'deposit' | 'withdrawal'
export type PaymentMethod   = 'cash' | 'credit'

export interface Transaction {
  id: string
  type: TransactionType
  category: string
  amount: number
  description: string
  date: string
  icon: string
  paymentMethod?: PaymentMethod
  creditCardId?: string
  budgetPaymentKey?: string
  fixedChargeKey?: string
}

export interface SavingsTransaction {
  id: string
  goalId: string
  type: SavingsTxType
  amount: number
  description: string
  date: string
}

export interface Budget {
  category: string
  limit: number
  icon: string
  color: string
}

export interface SavingsGoal {
  id: string
  name: string
  target: number
  current: number
  icon: string
  color: string
  deadline?: string
}

export interface CreditCard {
  id: string
  name: string
  limit: number
  balance: number
  color: string
}

export interface Debt {
  id: string
  name: string
  icon: string
  totalOriginal: number
  remaining: number
  minPayment: number
  color: string
  dueDay?: number
}

export interface FixedCharge {
  id: string
  creditCardId: string
  name: string
  amount: number
  icon: string
  billingDay?: number
}

export interface FinancialConfig {
  monthlyIncome: number
  fixedExpenses: number
  autoSavings: number
  safetyZone: number
}

const DEFAULT_CONFIG: FinancialConfig = {
  monthlyIncome: 0,
  fixedExpenses: 0,
  autoSavings: 0,
  safetyZone: 5000,
}

const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Comida',          limit: 400,  icon: '🍽️', color: '#F59E0B' },
  { category: 'Transporte',      limit: 150,  icon: '🚗',  color: '#06B6D4' },
  { category: 'Entretenimiento', limit: 100,  icon: '🎬',  color: '#EC4899' },
  { category: 'Salud',           limit: 200,  icon: '💊',  color: '#10B981' },
  { category: 'Ropa',            limit: 100,  icon: '👕',  color: '#7C3AED' },
  { category: 'Servicios',       limit: 250,  icon: '💡',  color: '#F97316' },
]

interface FinanceStore {
  transactions: Transaction[]
  savingsTransactions: SavingsTransaction[]
  budgets: Budget[]
  savingsGoals: SavingsGoal[]
  creditCards: CreditCard[]
  debts: Debt[]
  config: FinancialConfig
  fixedCharges: FixedCharge[]

  addTransaction: (t: Omit<Transaction, 'id'>) => void
  removeTransaction: (id: string) => void

  addCreditCard: (c: Omit<CreditCard, 'id'>) => void
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void
  removeCreditCard: (id: string) => void

  addDebt: (d: Omit<Debt, 'id'>) => void
  updateDebt: (id: string, updates: Partial<Debt>) => void
  removeDebt: (id: string) => void
  payDebt: (id: string, amount: number) => void

  updateConfig: (updates: Partial<FinancialConfig>) => void

  addFixedCharge: (c: Omit<FixedCharge, 'id'>) => void
  removeFixedCharge: (id: string) => void
  updateFixedCharge: (id: string, updates: Partial<FixedCharge>) => void
  isFixedChargePaid: (id: string, month?: string) => boolean
  payFixedCharge: (id: string) => void
  unpayFixedCharge: (id: string) => void
  getCardFixedCharges: (cardId: string) => FixedCharge[]

  isBudgetPaid: (category: string, month?: string) => boolean
  markBudgetPaid: (category: string, amount?: number) => void
  unmarkBudgetPaid: (category: string) => void

  addSavingsGoal: (g: Omit<SavingsGoal, 'id'>) => void
  removeSavingsGoal: (id: string) => void
  addSavingsTransaction: (t: Omit<SavingsTransaction, 'id'>) => void
  removeSavingsTransaction: (id: string) => void
  getGoalTransactions: (goalId: string) => SavingsTransaction[]

  addBudget: (b: Budget) => void
  updateBudget: (category: string, limit: number) => void
  removeBudget: (category: string) => void

  getMonthlyIncome: (month?: string) => number
  getMonthlyExpenses: (month?: string) => number
  getMonthlyBalance: (month?: string) => number
  getExpensesByCategory: (month?: string) => Record<string, number>
  getSpentOnCategory: (category: string, month?: string) => number
  getCreditExpenses: (month?: string) => number
  getCashExpenses: (month?: string) => number
  getMonthlySavings: (month?: string) => number
  getTotalDebt: () => number
  getAvailableMoney: () => number
  getDaysMoneyWillLast: () => number
  getProjectedEndBalance: () => number
  getFinancialScore: () => number

  _reset: () => void
}

const currentMonth = () => new Date().toISOString().slice(0, 7)
const today        = () => new Date().toISOString().slice(0, 10)
const genId        = () => Math.random().toString(36).slice(2, 9)

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      savingsTransactions: [],
      budgets: DEFAULT_BUDGETS,
      savingsGoals: [],
      creditCards: [],
      debts: [],
      config: DEFAULT_CONFIG,
      fixedCharges: [],

      _reset: () => set({
        transactions: [], savingsTransactions: [], budgets: DEFAULT_BUDGETS,
        savingsGoals: [], creditCards: [], debts: [], config: DEFAULT_CONFIG, fixedCharges: [],
      }),

      addTransaction: (t) => set(s => ({ transactions: [{ ...t, id: genId() }, ...s.transactions] })),
      removeTransaction: (id) => set(s => ({ transactions: s.transactions.filter(t => t.id !== id) })),

      addCreditCard: (c) => set(s => ({ creditCards: [...s.creditCards, { ...c, id: genId() }] })),
      updateCreditCard: (id, updates) => set(s => ({
        creditCards: s.creditCards.map(c => c.id === id ? { ...c, ...updates } : c),
      })),
      removeCreditCard: (id) => set(s => ({ creditCards: s.creditCards.filter(c => c.id !== id) })),

      addDebt: (d) => set(s => ({ debts: [...s.debts, { ...d, id: genId() }] })),
      updateDebt: (id, updates) => set(s => ({
        debts: s.debts.map(d => d.id === id ? { ...d, ...updates } : d),
      })),
      removeDebt: (id) => set(s => ({ debts: s.debts.filter(d => d.id !== id) })),
      payDebt: (id, amount) => {
        const debt = get().debts.find(d => d.id === id)
        if (!debt) return
        set(s => ({
          debts: s.debts.map(d => d.id === id ? { ...d, remaining: Math.max(0, d.remaining - amount) } : d),
          transactions: [{
            id: genId(), type: 'expense', category: 'Deuda', amount,
            description: `Pago — ${debt.name}`, date: today(), icon: debt.icon,
          }, ...s.transactions],
        }))
      },

      updateConfig: (updates) => set(s => ({ config: { ...s.config, ...updates } })),

      addFixedCharge: (c) => set(s => ({ fixedCharges: [...s.fixedCharges, { ...c, id: genId() }] })),
      removeFixedCharge: (id) => set(s => ({
        fixedCharges: s.fixedCharges.filter(c => c.id !== id),
        transactions: s.transactions.filter(t => !t.fixedChargeKey?.endsWith(`:${id}`)),
      })),
      updateFixedCharge: (id, updates) => set(s => ({
        fixedCharges: s.fixedCharges.map(c => c.id === id ? { ...c, ...updates } : c),
      })),
      isFixedChargePaid: (id, month) => {
        const key = `${month ?? currentMonth()}:${id}`
        return get().transactions.some(t => t.fixedChargeKey === key)
      },
      payFixedCharge: (id) => {
        const charge = get().fixedCharges.find(c => c.id === id)
        if (!charge) return
        const key = `${currentMonth()}:${id}`
        if (get().transactions.some(t => t.fixedChargeKey === key)) return
        set(s => ({
          transactions: [{
            id: genId(), type: 'expense', category: 'Fijo',
            amount: charge.amount, description: `${charge.icon} ${charge.name}`,
            date: today(), icon: charge.icon, paymentMethod: 'credit',
            creditCardId: charge.creditCardId, fixedChargeKey: key,
          }, ...s.transactions],
          creditCards: s.creditCards.map(c =>
            c.id === charge.creditCardId ? { ...c, balance: c.balance + charge.amount } : c
          ),
        }))
      },
      unpayFixedCharge: (id) => {
        const key = `${currentMonth()}:${id}`
        const tx = get().transactions.find(t => t.fixedChargeKey === key)
        if (!tx) return
        const charge = get().fixedCharges.find(c => c.id === id)
        set(s => ({
          transactions: s.transactions.filter(t => t.fixedChargeKey !== key),
          creditCards: charge ? s.creditCards.map(c =>
            c.id === charge.creditCardId ? { ...c, balance: Math.max(0, c.balance - tx.amount) } : c
          ) : s.creditCards,
        }))
      },
      getCardFixedCharges: (cardId) => get().fixedCharges.filter(c => c.creditCardId === cardId),

      isBudgetPaid: (category, month) => {
        const key = `${month ?? currentMonth()}:${category}`
        return get().transactions.some(t => t.budgetPaymentKey === key)
      },
      markBudgetPaid: (category, amount) => {
        const budget = get().budgets.find(b => b.category === category)
        if (!budget) return
        const month = currentMonth()
        const key = `${month}:${category}`
        if (get().transactions.some(t => t.budgetPaymentKey === key)) return
        set(s => ({
          transactions: [{
            id: genId(), type: 'expense', category, amount: amount ?? budget.limit,
            description: `${budget.icon} Pago — ${category}`, date: today(), icon: budget.icon,
            budgetPaymentKey: key,
          }, ...s.transactions],
        }))
      },
      unmarkBudgetPaid: (category) => {
        const key = `${currentMonth()}:${category}`
        set(s => ({ transactions: s.transactions.filter(t => t.budgetPaymentKey !== key) }))
      },

      addSavingsGoal: (g) => set(s => ({ savingsGoals: [...s.savingsGoals, { ...g, id: genId() }] })),
      removeSavingsGoal: (id) => set(s => ({
        savingsGoals: s.savingsGoals.filter(g => g.id !== id),
        savingsTransactions: s.savingsTransactions.filter(t => t.goalId !== id),
      })),
      addSavingsTransaction: (t) => {
        const id = genId()
        set(s => {
          const delta = t.type === 'deposit' ? t.amount : -t.amount
          return {
            savingsTransactions: [{ ...t, id }, ...s.savingsTransactions],
            savingsGoals: s.savingsGoals.map(g =>
              g.id === t.goalId ? { ...g, current: Math.max(0, g.current + delta) } : g
            ),
          }
        })
      },
      removeSavingsTransaction: (id) => {
        const tx = get().savingsTransactions.find(t => t.id === id)
        if (!tx) return
        const delta = tx.type === 'deposit' ? -tx.amount : tx.amount
        set(s => ({
          savingsTransactions: s.savingsTransactions.filter(t => t.id !== id),
          savingsGoals: s.savingsGoals.map(g =>
            g.id === tx.goalId ? { ...g, current: Math.max(0, g.current + delta) } : g
          ),
        }))
      },
      getGoalTransactions: (goalId) => get().savingsTransactions.filter(t => t.goalId === goalId),

      addBudget: (b) => set(s => ({ budgets: [...s.budgets, b] })),
      updateBudget: (category, limit) => set(s => ({
        budgets: s.budgets.map(b => b.category === category ? { ...b, limit } : b),
      })),
      removeBudget: (category) => set(s => ({ budgets: s.budgets.filter(b => b.category !== category) })),

      getMonthlyIncome: (month) => {
        const m = month ?? currentMonth()
        return get().transactions.filter(t => t.type === 'income' && t.date.startsWith(m)).reduce((a, t) => a + t.amount, 0)
      },
      getMonthlyExpenses: (month) => {
        const m = month ?? currentMonth()
        return get().transactions.filter(t => t.type === 'expense' && t.date.startsWith(m)).reduce((a, t) => a + t.amount, 0)
      },
      getMonthlyBalance: (month) => get().getMonthlyIncome(month) - get().getMonthlyExpenses(month),
      getExpensesByCategory: (month) => {
        const m = month ?? currentMonth()
        return get().transactions
          .filter(t => t.type === 'expense' && t.date.startsWith(m))
          .reduce((acc, t) => { acc[t.category] = (acc[t.category] ?? 0) + t.amount; return acc }, {} as Record<string, number>)
      },
      getSpentOnCategory: (category, month) => {
        const m = month ?? currentMonth()
        return get().transactions
          .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(m))
          .reduce((a, t) => a + t.amount, 0)
      },
      getCreditExpenses: (month) => {
        const m = month ?? currentMonth()
        return get().transactions
          .filter(t => t.type === 'expense' && t.paymentMethod === 'credit' && t.date.startsWith(m))
          .reduce((a, t) => a + t.amount, 0)
      },
      getCashExpenses: (month) => {
        const m = month ?? currentMonth()
        return get().transactions
          .filter(t => t.type === 'expense' && t.paymentMethod !== 'credit' && t.date.startsWith(m))
          .reduce((a, t) => a + t.amount, 0)
      },
      getMonthlySavings: (month) => {
        const m = month ?? currentMonth()
        return get().savingsTransactions.filter(t => t.type === 'deposit' && t.date.startsWith(m)).reduce((a, t) => a + t.amount, 0)
      },
      getTotalDebt: () =>
        get().debts.reduce((a, d) => a + d.remaining, 0) +
        get().creditCards.reduce((a, c) => a + c.balance, 0),

      getAvailableMoney: () => {
        const { config, debts } = get()
        const minPayments = debts.reduce((a, d) => a + d.minPayment, 0)
        return config.monthlyIncome - config.fixedExpenses - minPayments - config.autoSavings
      },

      getDaysMoneyWillLast: () => {
        const day = new Date().getDate()
        if (day === 0) return 30
        const expenses = get().getMonthlyExpenses()
        const income = get().getMonthlyIncome() || get().config.monthlyIncome
        if (expenses === 0 || income === 0) return 30
        const currentBalance = income - expenses
        if (currentBalance <= 0) return 0
        const dailyBurn = expenses / day
        if (dailyBurn === 0) return 30
        return Math.max(0, Math.round(currentBalance / dailyBurn))
      },

      getProjectedEndBalance: () => {
        const now = new Date()
        const day = now.getDate()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const expenses = get().getMonthlyExpenses()
        const income = get().getMonthlyIncome() || get().config.monthlyIncome
        if (day === 0 || expenses === 0) return income
        const projected = (expenses / day) * daysInMonth
        return income - projected
      },

      getFinancialScore: () => {
        const income = get().config.monthlyIncome || get().getMonthlyIncome()
        if (income === 0) return 0
        const expenses = get().getMonthlyExpenses()
        const savingsRate = Math.max(0, (income - expenses) / income)
        const savingsScore = Math.min(40, savingsRate * 200)
        const budgets = get().budgets
        const over = budgets.filter(b => get().getSpentOnCategory(b.category) > b.limit).length
        const budgetScore = budgets.length > 0 ? ((budgets.length - over) / budgets.length) * 30 : 15
        const totalDebt = get().getTotalDebt()
        const debtRatio = Math.min(1, totalDebt / (income * 6))
        const debtScore = (1 - debtRatio) * 30
        return Math.min(100, Math.max(0, Math.round(savingsScore + budgetScore + debtScore)))
      },
    }),
    { name: 'kingdom-finance', storage: userStorage }
  )
)
