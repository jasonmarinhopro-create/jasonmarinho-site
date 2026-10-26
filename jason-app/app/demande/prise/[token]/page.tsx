// « Je m'en occupe » depuis l'e-mail d'une demande d'hôte (26/10/2026). Le
// pro confirme d'un bouton, sans se connecter : la demande passe « Répondue »
// dans ses Demandes reçues, s'affiche « Ouverte » dans le QG et ne part plus à
// d'autres pros au bout de 48 h. Confirmation par bouton : un antivirus qui
// ouvre les liens des e-mails ne doit rien valider à la place du pro.

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServiceClient } from '@/lib/supabase/service'
import { verifyPriseToken, type PriseMetier } from '@/lib/demandes/prise'
import { memberMailSecret } from '@/lib/admin/member-mail-secret'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Je m’en occupe · Jason Marinho', robots: { index: false, follow: false } }

const TABLE: Record<PriseMetier, string> = { photographe: 'photographer_contacts', menage: 'cleaner_contacts' }
const DASH: Record<PriseMetier, string> = { photographe: 'ma-fiche-photographe', menage: 'ma-fiche-menage' }

async function lire(token: string) {
  const v = verifyPriseToken(token, memberMailSecret())
  if (!v) return null
  const { data } = await getServiceClient().from(TABLE[v.metier]).select('id, contact_name, status').eq('id', v.contactId).maybeSingle()
  return data ? { ...v, nom: (data.contact_name as string | null) ?? null, status: data.status as string } : null
}

async function prendre(formData: FormData) {
  'use server'
  const token = String(formData.get('token') ?? '')
  const d = await lire(token)
  if (d && d.status === 'nouvelle') {
    await getServiceClient().from(TABLE[d.metier]).update({ status: 'repondue' }).eq('id', d.contactId).eq('status', 'nouvelle')
  }
  redirect(`/demande/prise/${encodeURIComponent(token)}?ok=1`)
}

export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { token: raw } = await params
  const { ok } = await searchParams
  const token = decodeURIComponent(raw)
  const d = await lire(token)
  const prenom = (d?.nom ?? '').split(' ')[0] || 'l’hôte'
  const deja = d && d.status !== 'nouvelle'

  return (
    <main style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>Jason <em style={{ color: 'var(--accent-text)' }}>Marinho</em></div>
        {!d ? (
          <>
            <h1 style={s.title}>Lien introuvable</h1>
            <p style={s.text}>Ce lien n&apos;est plus valable. Tu retrouves la demande dans ton espace, rubrique Demandes reçues.</p>
            <a href="/auth/login" style={s.btn}>Ouvrir mon espace</a>
          </>
        ) : ok === '1' || deja ? (
          <>
            <h1 style={s.title}>C&apos;est noté</h1>
            <p style={s.text}>La demande de {prenom} est à toi : elle ne part pas à d&apos;autres pros. Réponds-lui directement par e-mail ou par téléphone.</p>
            <a href={`/dashboard/${DASH[d.metier]}/demandes`} style={s.link}>Voir mes Demandes reçues</a>
          </>
        ) : (
          <>
            <h1 style={s.title}>Tu t&apos;occupes de la demande de {prenom} ?</h1>
            <p style={s.text}>Un clic : la demande passe en « Répondue » dans ton espace et ne part pas à d&apos;autres pros. Tu réponds ensuite à {prenom} comme tu veux, par e-mail ou par téléphone.</p>
            <form action={prendre}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" style={s.btn}>Je m&apos;en occupe</button>
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
  btn: { display: 'inline-block', textAlign: 'center', textDecoration: 'none', padding: '12px 20px', borderRadius: '12px', border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  link: { fontSize: '14px', fontWeight: 600, color: 'var(--accent-text)' },
}
