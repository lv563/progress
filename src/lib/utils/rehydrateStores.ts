import { useHabitsStore } from '@/stores/habits.store'
import { useTasksStore } from '@/stores/tasks.store'
import { usePomodoroStore } from '@/stores/pomodoro.store'
import { useVaultStore } from '@/stores/vault.store'
import { useRoutineStore } from '@/stores/routine.store'
import { useFinanceStore } from '@/stores/finance.store'
import { useMinistryStore } from '@/stores/ministry.store'
import { usePhysicalStore } from '@/stores/physical.store'
import { useDetoxStore } from '@/stores/detox.store'

const userStores = [
  useHabitsStore,
  useTasksStore,
  usePomodoroStore,
  useVaultStore,
  useRoutineStore,
  useFinanceStore,
  useMinistryStore,
  usePhysicalStore,
  useDetoxStore,
] as const

export const resetAllStores = () => {
  userStores.forEach(store => (store.getState() as { _reset: () => void })._reset())
}

export const rehydrateAllStores = () => {
  userStores.forEach(store => store.persist.rehydrate())
}
