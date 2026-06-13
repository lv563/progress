import { AppShell } from '@/components/layout/AppShell'
import { SyncProvider } from '@/components/SyncProvider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SyncProvider>
      <AppShell>{children}</AppShell>
    </SyncProvider>
  )
}
