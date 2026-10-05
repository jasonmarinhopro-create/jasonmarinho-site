// Désinscription des e-mails envoyés aux membres de l'app (05/10/2026). Le
// jeton est l'id du compte signé (member-unsub.ts). Confirmation par bouton :
// un antivirus qui ouvre les liens ne doit désinscrire personne. Les e-mails
// liés à l'activité (contrats, paiements) continuent.

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServiceClient } from '@/lib/supabase/service'
import { suppress } from '@/lib/outreach/service'
import { verifyMemberUnsubToken } from '@/lib/admin/member-unsub'
import { memberMailSecret } from '@/lib/admin/member-mail-secret'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Désinscription · Jason Marinho', robots: { index: false, follow: false } }

async function emailOf(token: string): Promise<string | null> {
  const userId = verifyMemberUnsubToken(token, memberMailSecret())
  if (!userId) return null
  const { data } = await getServiceClient().from('profiles').select('email').eq('id', userId).maybeSingle()
  return data?.email ?? null
}

async function unsubscribe(formData: FormData) {
  'use server'
  const token = String(formData.get('token') ?? '')
  const email = await emailOf(token)
  if (email) await suppress(getServiceClient(), email, 'desinscrit')
  redirect(`/desinscription/membre/${encodeURIComponent(token)}?ok=1`)
}

export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { token: raw } = await params
  const { ok } = await searchParams
  const token = decodeURIComponent(raw)
  const email = await emailOf(token)

  return (
    <main style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>Jason <em style={{ color: 'var(--accent-text)' }}>Marinho</em></div>
        {!email ? (
          <>
            <h1 style={s.title}>Lien introuvable</h1>
            <p style={s.text}>Ce lien n&apos;est plus valable. Pour ne plus recevoir ces messages, réponds simplement « stop » à l&apos;e-mail reçu, ou écris à contact@jasonmarinho.com.</p>
          </>
        ) : ok === '1' ? (
          <>
            <h1 style={s.title}>C&apos;est fait</h1>
            <p style={s.text}><strong>{email}</strong> ne recevra plus ce type de message. Les e-mails liés à ton activité dans l&apos;app (contrats, paiements, notifications) continuent.</p>
          </>
        ) : (
          <>
            <h1 style={s.title}>Ne plus recevoir ces messages ?</h1>
            <p style={s.text}>Un clic et <strong>{email}</strong> ne recevra plus les messages d&apos;information de Jason Marinho. Ton compte et les e-mails liés à ton activité (contrats, paiements) ne changent pas.</p>
            <form action={unsubscribe}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" style={s.btn}>Me désinscrire</button>
            </form>
          </>
        )}
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
}
