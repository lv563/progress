import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userStorage } from '@/lib/utils/userStorage'

export type TransactionType = 'income' | 'expense'
export type SavingsTxType   = 'deposit' | 'withdrawal'

export interface Transaction {
  id: string
  type: TransactionType
  category: string
  amount: number
  description: string
  date: string
  icon: string
  budgetPaymentKey?: string // `${month}:${category}` — identifica pagos de presupuesto
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

interface FinanceStore {
  transactions: Transaction[]
  savingsTransactions: SavingsTransaction[]
  budgets: Budget[]
  savingsGoals: SavingsGoal[]

  // Transactions
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  removeTransaction: (id: string) => void

  // Budget payments
  isBudgetPaid: (category: string, month?: string) => boolean
  markBudgetPaid: (category: string, amount?: number) => void
  unmarkBudgetPaid: (category: string) => void

  // Savings goals
  addSavingsGoal: (g: Omit<SavingsGoal, 'id'>) => void
  removeSavingsGoal: (id: string) => void
  addSavingsTransaction: (t: Omit<SavingsTransaction, 'id'>) => void
  removeSavingsTransaction: (id: string) => void
  getGoalTransactions: (goalId: string) => SavingsTransaction[]

  // Budgets
  addBudget: (b: Budget) => void
  updateBudget: (category: string, limit: number) => void
  removeBudget: (category: string) => void

  // Aggregates
  getMonthlyIncome: (month?: string) => number
  getMonthlyExpenses: (month?: string) => number
  getMonthlyBalance: (month?: string) => number
  getExpensesByCategory: (month?: string) => Record<string, number>
  getSpentOnCategory: (category: string, month?: string) => number
  _reset: () => void
}

const currentMonth = () => new Date().toISOString().slice(0, 7)
const today        = () => new Date().toISOString().slice(0, 10)
const genId        = () => Math.random().toString(36).slice(2, 9)

const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Comida',          limit: 400,  icon: '🍽️', color: '#F59E0B' },
  { category: 'Transporte',      limit: 150,  icon: '🚗',  color: '#06B6D4' },
  { category: 'Entretenimiento', limit: 100,  icon: '🎬',  color: '#EC4899' },
  { category: 'Salud',           limit: 200,  icon: '💊',  color: '#10B981' },
  { category: 'Ropa',            limit: 100,  icon: '👕',  color: '#7C3AED' },
  { category: 'Servicios',       limit: 250,  icon: '💡',  color: '#F97316' },
]

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      savingsTransactions: [],
      budgets: DEFAULT_BUDGETS,
      savingsGoals: [],
      _reset: () => set({ transactions: [], savingsTransactions: [], budgets: DEFAULT_BUDGETS, savingsGoals: [] }),

      /* ── Transactions ── */
      addTransaction: (t) => set(s => ({
        transactions: [{ ...t, id: genId() }, ...s.transactions],
      })),

      removeTransaction: (id) => set(s => ({
        transactions: s.transactions.filter(t => t.id !== id),
      })),

      /* ── Budget payments ── */
      isBudgetPaid: (category, month) => {
        const key = `${month ?? currentMonth()}:${category}`
        return get().transactions.some(t => t.budgetPaymentKey === key)
      },

      markBudgetPaid: (category, amount) => {
        const budget = get().budgets.find(b => b.category === category)
        if (!budget) return
        const month = currentMonth()
        const key   = `${month}:${category}`
        // prevent double payment
        if (get().transactions.some(t => t.budgetPaymentKey === key)) return
        const finalAmount = amount ?? budget.limit
        set(s => ({
          transactions: [{
            id: genId(),
            type: 'expense',
            category,
            amount: finalAmount,
            description: `${budget.icon} Pago — ${category}`,
            date: today(),
            icon: budget.icon,
            budgetPaymentKey: key,
          }, ...s.transactions],
        }))
      },

      unmarkBudgetPaid: (category) => {
        const key = `${currentMonth()}:${category}`
        set(s => ({
          transactions: s.transactions.filter(t => t.budgetPaymentKey !== key),
        }))
      },

      /* ── Savings goals ── */
      addSavingsGoal: (g) => set(s => ({
        savingsGoals: [...s.savingsGoals, { ...g, id: genId() }],
      })),

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
              g.id === t.goalId
                ? { ...g, current: Math.max(0, g.current + delta) }
                : g
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
            g.id === tx.goalId
              ? { ...g, current: Math.max(0, g.current + delta) }
              : g
          ),
        }))
      },

      getGoalTransactions: (goalId) =>
        get().savingsTransactions.filter(t => t.goalId === goalId),

      /* ── Budgets ── */
      addBudget: (b) => set(s => ({ budgets: [...s.budgets, b] })),

      updateBudget: (category, limit) => set(s => ({
        budgets: s.budgets.map(b => b.category === category ? { ...b, limit } : b),
      })),

      removeBudget: (category) => set(s => ({
        budgets: s.budgets.filter(b => b.category !== category),
      })),

      /* ── Aggregates ── */
      getMonthlyIncome: (month) => {
        const m = month ?? currentMonth()
        return get().transactions
          .filter(t => t.type === 'income' && t.date.startsWith(m))
          .reduce((a, t) => a + t.amount, 0)
      },

      getMonthlyExpenses: (month) => {
        const m = month ?? currentMonth()
        return get().transactions
          .filter(t => t.type === 'expense' && t.date.startsWith(m))
          .reduce((a, t) => a + t.amount, 0)
      },

      getMonthlyBalance: (month) =>
        get().getMonthlyIncome(month) - get().getMonthlyExpenses(month),

      getExpensesByCategory: (month) => {
        const m = month ?? currentMonth()
        return get().transactions
          .filter(t => t.type === 'expense' && t.date.startsWith(m))
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] ?? 0) + t.amount
            return acc
          }, {} as Record<string, number>)
      },

      getSpentOnCategory: (category, month) => {
        const m = month ?? currentMonth()
        return get().transactions
          .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(m))
          .reduce((a, t) => a + t.amount, 0)
      },
    }),
    { name: 'kingdom-finance', storage: userStorage }
  )
)
