import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import MaFichePhotographe from './MaFichePhotographe'

export const metadata = { title: 'Ma fiche photographe' }
export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = getServiceClient()
  const { data: photographer } = await admin
    .from('photographers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!photographer) {
    // Ne devrait pas arriver : le rôle 'photographer' implique une fiche.
    // Cas limite : compte créé mais paiement Stripe annulé → message clair.
    return (
      <div style={{ padding: 40, maxWidth: 720, margin: '0 auto', fontFamily: 'var(--font-outfit), sans-serif' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 24, marginBottom: 14 }}>
          Aucune fiche photographe rattachée
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 14 }}>
          Ton compte existe mais aucune fiche photographe n'y est associée. Cela peut arriver si le paiement Stripe a été annulé.
          Inscris-toi à nouveau depuis le site public ou contacte <a href="mailto:contact@jasonmarinho.com" style={{ color: 'var(--accent-text)' }}>contact@jasonmarinho.com</a>.
        </p>
        <a href="https://jasonmarinho.com/annuaires/photographes/inscription" style={{ display: 'inline-block', marginTop: 18, padding: '10px 18px', background: 'var(--accent-text)', color: 'var(--bg)', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>
          Créer ma fiche
        </a>
      </div>
    )
  }

  // KPIs basiques (vues + contacts + ancienneté)
  const createdAt = new Date(photographer.created_at)
  const daysActive = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86400000))

  return (
    <MaFichePhotographe
      photographer={photographer}
      kpis={{
        views: photographer.views_count ?? 0,
        contacts: photographer.contacts_count ?? 0,
        daysActive,
      }}
    />
  )
}
