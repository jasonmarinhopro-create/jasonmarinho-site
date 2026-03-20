import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import { getProfile } from '@/lib/queries/profile'
import { ThemeProvider } from '@/components/ThemeProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const profile = await getProfile()

  return (
    <ThemeProvider>
      <div style={styles.layout}>
        {/* Sidebar rendered ONCE in layout — persiste entre les navigations sans re-mount */}
        <Sidebar isAdmin={profile?.role === 'admin'} />
        <main style={styles.main} className="dash-main">
          <Suspense fallback={null}>
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
    marginLeft: 'var(--sidebar-w)',
    paddingTop: 'var(--header-h)',
    minHeight: '100svh',
    background: 'var(--bg)',
  },
}
