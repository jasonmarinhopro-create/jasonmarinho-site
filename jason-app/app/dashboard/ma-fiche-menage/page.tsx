import { getServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { getProfile } from '@/lib/queries/profile'
import { perfTimer } from '@/lib/perf/server-timing'
import MaFicheMenage from './MaFicheMenage'
import { getViewsTrend } from '@/lib/pros/views'

export const metadata = { title: 'Ma fiche équipe ménage' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams?: Promise<{ id?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams
  const previewId = sp?.id

  const timer = perfTimer('page /dashboard/ma-fiche-menage')
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?as=menage')

  const admin = getServiceClient()
  // Multi-espaces : pas de strict role gating. L'accès se vérifie via la
  // présence d'une fiche rattachée au compte (sinon état vide). Seul l'aperçu
  // admin (?id=) est gardé. Rôle lu par getProfile (déjà chargé par le
  // layout) : avant, une requête profiles de plus avant la fiche.
  const isAdmin = previewId ? (await getProfile())?.role === 'admin' : false
  const isAdminPreview = !!previewId && isAdmin

  let cleaner: any = null
  let viewsTrend: Awaited<ReturnType<typeof getViewsTrend>> | undefined
  if (isAdminPreview) {
    // Aperçu admin : fiche et vues du mois en même temps (l'id est connu)
    const [{ data }, trend] = await Promise.all([
      admin.from('cleaners').select('*').eq('id', previewId).maybeSingle(),
      getViewsTrend(admin, 'cleaner', previewId!),
    ])
    cleaner = data
    viewsTrend = trend
  } else {
    const { data } = await admin
      .from('cleaners')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    cleaner = data
  }
  timer.mark('fiche')

  if (!cleaner) {
    return (
      <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%', fontFamily: 'var(--font-outfit), sans-serif' }}>
        <div style={{ maxWidth: 640, margin: '40px auto 0', padding: 32, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, textAlign: 'center' as const }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 22, marginBottom: 12 }}>
            {previewId ? 'Équipe ménage introuvable' : 'Aucune fiche équipe ménage'}
          </h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 14, marginBottom: 22 }}>
            {previewId
              ? `L'identifiant ${previewId} ne correspond à aucune fiche.`
              : <>Aucune fiche équipe ménage n'est rattachée à ce compte. Cela peut arriver si le paiement Stripe a été annulé.</>
            }
          </p>
          {!previewId && (
            <a href="https://jasonmarinho.com/annuaires/menage/inscription" style={{ display: 'inline-block', padding: '10px 18px', background: 'var(--accent-text)', color: 'var(--bg)', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>
              Créer ma fiche
            </a>
          )}
        </div>
      </div>
    )
  }

  if (!viewsTrend) viewsTrend = await getViewsTrend(admin, 'cleaner', cleaner.id)
  timer.mark('vues du mois')
  timer.done()
  const createdAt = new Date(cleaner.created_at)
  const daysActive = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86400000))

  return (
    <MaFicheMenage
      cleaner={cleaner}
      kpis={{
        views: cleaner.views_count ?? 0,
        contacts: cleaner.contacts_count ?? 0,
        clics: (cleaner.site_clicks_count ?? 0) + (cleaner.instagram_clicks_count ?? 0),
        daysActive,
      }}
      isAdminPreview={isAdminPreview}
      viewsTrend={viewsTrend}
    />
  )
}
