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

interface PageProps {
  searchParams?: Promise<{ id?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams
  const previewId = sp?.id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?as=photographe')

  const admin = getServiceClient()
  // Multi-espaces : pas de strict role gating. L'accès se vérifie via la
  // présence d'une row dans photographers.user_id (sinon empty state).
  // Seul le mode preview admin est gardé pour le support.
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const isAdmin = profile?.role === 'admin'

  let photographer: any = null
  let isAdminPreview = false
  if (previewId && isAdmin) {
    const { data } = await admin
      .from('photographers')
      .select('*')
      .eq('id', previewId)
      .maybeSingle()
    photographer = data
    isAdminPreview = true
  } else {
    const { data } = await admin
      .from('photographers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    photographer = data
  }

  if (!photographer) {
    return (
      <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%', fontFamily: 'var(--font-outfit), sans-serif' }}>
        <div style={{ maxWidth: 640, margin: '40px auto 0', padding: 32, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, textAlign: 'center' as const }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 22, marginBottom: 12 }}>
            {previewId ? 'Photographe introuvable' : 'Aucune fiche photographe'}
          </h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 14, marginBottom: 22 }}>
            {previewId
              ? `L'identifiant ${previewId} ne correspond à aucune fiche.`
              : <>Aucune fiche photographe n'est rattachée à ce compte. Cela peut arriver si le paiement Stripe a été annulé.</>
            }
          </p>
          {!previewId && (
            <a href="https://jasonmarinho.com/annuaires/photographes/inscription" style={{ display: 'inline-block', padding: '10px 18px', background: 'var(--accent-text)', color: 'var(--bg)', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>
              Créer ma fiche
            </a>
          )}
        </div>
      </div>
    )
  }

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
      isAdminPreview={isAdminPreview}
    />
  )
}
