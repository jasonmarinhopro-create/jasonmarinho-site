import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  // Use getSession() — reads the JWT from the cookie locally (no network call).
  // getUser() makes an outbound call to Supabase which can fail/timeout on cold starts,
  // causing a redirect loop even when the session is valid.
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  return (
    <div style={styles.layout}>
      {/* Sidebar is rendered inside Header component for mobile toggle */}
      <main style={styles.main} className="dash-main">
        {children}
      </main>
    </div>
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
