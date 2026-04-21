import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { getProfile } from '@/lib/queries/profile'
import { ThemeProvider } from '@/components/ThemeProvider'
import DashboardLoading from './loading'
import FeedbackWidget from '@/components/FeedbackWidget'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  return (
    <ThemeProvider>
      <div style={styles.layout}>
        {/* Sidebar rendered ONCE in layout — persiste entre les navigations sans re-mount */}
        <Sidebar isAdmin={profile?.role === 'admin'} isContributor={profile?.is_contributor ?? false} />
        <main style={styles.main} className="dash-main">
          <Suspense fallback={<DashboardLoading />}>
            {children}
          </Suspense>
        </main>
        <FeedbackWidget />
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
    minWidth: 0,          // empêche le flex item de dépasser son conteneur
    overflowX: 'hidden',  // aucun scroll horizontal sur la zone de contenu
    marginLeft: 'var(--sidebar-w)',
    paddingTop: 'var(--header-h)',
    minHeight: '100svh',
    background: 'var(--bg)',
  },
}
