import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'

export const dynamic = 'force-dynamic'

export default async function DebugAdminPage() {
  const supabase = await createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  const { data: profileDirect, error: profileError } = session
    ? await supabase
        .from('profiles')
        .select('id, full_name, role, plan, driing_status')
        .eq('id', session.user.id)
        .maybeSingle()
    : { data: null, error: null }

  const profileFromQuery = await getProfile()

  return (
    <div style={{ padding: '40px', color: '#fff', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.8, background: '#001a13', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '22px', color: '#FFD56B', marginBottom: '24px' }}>🔍 Debug Admin Access</h1>

      <section style={block}>
        <h2 style={h2}>1. Session</h2>
        {session ? (
          <>
            <p style={ok}>✅ Connecté</p>
            <p><b>user.id</b>: <code>{session.user.id}</code></p>
            <p><b>user.email</b>: <code>{session.user.email}</code></p>
          </>
        ) : (
          <p style={err}>❌ Pas de session (non connecté)</p>
        )}
        {sessionError && <p style={err}>Error: {sessionError.message}</p>}
      </section>

      <section style={block}>
        <h2 style={h2}>2. Requête directe .from(&apos;profiles&apos;)</h2>
        {profileError && <p style={err}>❌ Error RLS: {JSON.stringify(profileError)}</p>}
        {profileDirect ? (
          <>
            <p style={ok}>✅ Row trouvée</p>
            <p><b>id</b>: <code>{profileDirect.id}</code></p>
            <p><b>full_name</b>: <code>{profileDirect.full_name ?? 'NULL'}</code></p>
            <p><b>role</b>: <code style={{ color: profileDirect.role === 'admin' ? '#34d399' : '#f87171' }}>{profileDirect.role ?? 'NULL'}</code></p>
            <p><b>plan</b>: <code>{profileDirect.plan ?? 'NULL'}</code></p>
            <p><b>driing_status</b>: <code>{profileDirect.driing_status ?? 'NULL'}</code></p>
          </>
        ) : (
          <p style={err}>❌ Aucune row trouvée (RLS bloque ou user.id ne correspond à aucun profile)</p>
        )}
      </section>

      <section style={block}>
        <h2 style={h2}>3. getProfile() (utilisé par le layout)</h2>
        {profileFromQuery ? (
          <>
            <p><b>userId</b>: <code>{profileFromQuery.userId}</code></p>
            <p><b>role</b>: <code style={{ color: profileFromQuery.role === 'admin' ? '#34d399' : '#f87171' }}>{profileFromQuery.role}</code></p>
            <p><b>plan</b>: <code>{profileFromQuery.plan}</code></p>
            <p><b>isAdmin (role === &apos;admin&apos;)</b>: <code style={{ color: profileFromQuery.role === 'admin' ? '#34d399' : '#f87171' }}>{String(profileFromQuery.role === 'admin')}</code></p>
          </>
        ) : (
          <p style={err}>❌ getProfile() retourne null</p>
        )}
      </section>

      <section style={{ ...block, background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)' }}>
        <h2 style={h2}>💡 Diagnostic</h2>
        {!session && <p>→ Tu n&apos;es pas connecté. Connecte-toi d&apos;abord.</p>}
        {session && !profileDirect && <p style={{ color: '#f87171' }}>→ RLS bloque la lecture de ton profil. Il faut ajuster la policy.</p>}
        {session && profileDirect && profileDirect.role !== 'admin' && (
          <p style={{ color: '#f87171' }}>
            → Ton profile existe mais role = <code>{String(profileDirect.role)}</code> (pas &apos;admin&apos;).
            L&apos;email connecté est <code>{session.user.email}</code> — met à jour cette ligne dans Supabase.
          </p>
        )}
        {session && profileDirect?.role === 'admin' && (
          <p style={{ color: '#34d399' }}>
            ✅ Tout est bon côté DB. Si l&apos;UI affiche encore &quot;Découverte&quot;, c&apos;est un cache navigateur
            — vide le cache (Ctrl+Shift+R) ou déconnecte-toi et reconnecte-toi.
          </p>
        )}
      </section>
    </div>
  )
}

const block: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '16px',
}
const h2: React.CSSProperties = { fontSize: '14px', color: '#FFD56B', marginTop: 0, marginBottom: '12px', fontFamily: 'system-ui' }
const ok: React.CSSProperties = { color: '#34d399' }
const err: React.CSSProperties = { color: '#f87171' }
