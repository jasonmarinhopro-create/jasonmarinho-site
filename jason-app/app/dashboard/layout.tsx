import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { getProfile } from '@/lib/queries/profile'
import { ThemeProvider } from '@/components/ThemeProvider'
import DashboardLoading from './loading'

function planToLabel(plan: 'decouverte' | 'standard' | 'driing', role: 'user' | 'driing' | 'admin'): string {
  if (role === 'admin') return 'Administrateur'
  if (plan === 'driing') return 'Membre Driing'
  if (plan === 'standard') return 'Standard'
  return 'Découverte'
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const isAdmin = profile.role === 'admin'
  const planLabel = planToLabel(profile.plan, profile.role)

  return (
    <ThemeProvider>
      <div style={styles.layout}>
        {/* Sidebar et Header rendus une seule fois dans le layout — pas de re-mount entre navigations.
            Élimine le flicker du titre + économise 1 query Supabase par navigation. */}
        <Sidebar isAdmin={isAdmin} isContributor={profile.is_contributor ?? false} />
        <Header
          userName={profile.full_name ?? undefined}
          currentPlan={planLabel}
          isAdmin={isAdmin}
          userId={profile.userId}
        />
        <main style={styles.main} className="dash-main">
          <Suspense fallback={<DashboardLoading />}>
            {children}
          </Suspense>
        </main>
      </div>
    </ThemeProvider>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100svh',
  },
  main: {
    flex: 1,
    minWidth: 0,
    overflowX: 'hidden',
    marginLeft: 'var(--sidebar-w)',
    paddingTop: 'var(--header-h)',
    minHeight: '100svh',
    background: 'var(--bg)',
  },
}
