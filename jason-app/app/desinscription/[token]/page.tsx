// Page publique de désinscription de la prospection (lien en pied de chaque
// e-mail). Confirmation par bouton : un antivirus qui ouvre les liens ne doit
// désinscrire personne. L'opposition est gardée même si le contact est
// supprimé ensuite (outreach_suppressions).

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServiceClient } from '@/lib/supabase/service'
import { suppress } from '@/lib/outreach/service'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Désinscription · Jason Marinho', robots: { index: false, follow: false } }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function unsubscribe(formData: FormData) {
  'use server'
  const token = String(formData.get('token') ?? '')
  if (!UUID.test(token)) redirect('/desinscription/invalide')
  const db = getServiceClient()
  const { data } = await db.from('outreach_contacts').select('email').eq('unsubscribe_token', token).maybeSingle()
  if (data?.email) await suppress(db, data.email, 'desinscrit')
  redirect(`/desinscription/${token}?ok=1`)
}

export default async function DesinscriptionPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { token } = await params
  const { ok } = await searchParams
  const valid = UUID.test(token)
  let email: string | null = null
  let already = false
  if (valid) {
    const db = getServiceClient()
    const { data } = await db.from('outreach_contacts').select('email, email_norm, stage').eq('unsubscribe_token', token).maybeSingle()
    email = data?.email ?? null
    already = data?.stage === 'desinscrit'
  }
  const done = ok === '1' || already

  return (
    <main style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>Jason <em style={{ color: 'var(--accent-text)' }}>Marinho</em></div>
        {!valid || (!email && !done) ? (
          <>
            <h1 style={s.title}>Lien introuvable</h1>
            <p style={s.text}>Ce lien de désinscription n&apos;est plus valable. Pour ne plus recevoir de message, réponds simplement « stop » à l&apos;e-mail reçu, ou écris à contact@jasonmarinho.com.</p>
          </>
        ) : done ? (
          <>
            <h1 style={s.title}>C&apos;est fait</h1>
            <p style={s.text}>{email ? <><strong>{email}</strong> ne</> : 'Tu ne'} recevras plus de message de prospection de ma part. Désolé pour le dérangement.</p>
          </>
        ) : (
          <>
            <h1 style={s.title}>Ne plus recevoir mes messages ?</h1>
            <p style={s.text}>Un clic et <strong>{email}</strong> ne recevra plus aucun e-mail de prospection de Jason Marinho.</p>
            <form action={unsubscribe}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" style={s.btn}>Me désinscrire</button>
            </form>
          </>
        )}
        <p style={s.small}>Jason Marinho, jasonmarinho.com. Tes données : nom, e-mail et ville, trouvés sur une source publique, utilisés uniquement pour ces messages. Tu peux demander leur suppression à contact@jasonmarinho.com.</p>
      </div>
    </main>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'var(--bg)' },
  card: { width: '100%', maxWidth: '480px', background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: '20px', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '14px' },
  brand: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', color: 'var(--text)' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.2 },
  text: { fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 },
  btn: { padding: '12px 20px', borderRadius: '12px', border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  small: { fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.55, margin: '8px 0 0' },
}
