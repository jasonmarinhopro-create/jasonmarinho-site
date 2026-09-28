import { redirect } from 'next/navigation'
import { getServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { parisToday } from '@/lib/stripe/deposit-window'
import { flaggedVoyageurs } from '@/lib/securite/lookup'
import { POSITIVE_TYPES, isPositive } from '@/lib/securite/identifiers'
import SecuriteView, { type MyReport, type UpcomingGuest } from './SecuriteView'

export const metadata = { title: 'Sécurité voyageur' }
export const dynamic = 'force-dynamic'

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export default async function SecuritePage({ searchParams }: {
  searchParams: { q?: string; signaler?: string; email?: string; tel?: string; nom?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = parisToday()
  // Service role : compteurs de toute la communauté et MES signalements
  // (la RLS ne laisse pas relire ses signalements en attente). Toujours
  // filtré explicitement.
  const admin = getServiceClient()
  const [allRes, posRes, mineRes, sejoursRes] = await Promise.all([
    admin.from('reported_guests').select('id', { count: 'exact', head: true }).eq('is_validated', true),
    admin.from('reported_guests').select('id', { count: 'exact', head: true }).eq('is_validated', true).in('incident_type', [...POSITIVE_TYPES]),
    admin.from('reported_guests')
      .select('id, identifier, name, incident_type, reported_at, is_validated, moderation_status')
      .eq('reporter_id', user.id)
      .order('reported_at', { ascending: false })
      .limit(50),
    // Voyageurs qui arrivent dans les 60 jours : vérifiés automatiquement
    supabase.from('sejours')
      .select('id, logement, date_arrivee, voyageurs(id, prenom, nom, email, telephone)')
      .eq('user_id', user.id)
      .is('annule_at', null)
      .gte('date_arrivee', today)
      .lte('date_arrivee', addDays(today, 60))
      .order('date_arrivee', { ascending: true })
      .limit(200),
  ])

  const total = allRes.count ?? 0
  const positives = posRes.count ?? 0

  // Un voyageur peut avoir plusieurs séjours : on garde sa prochaine arrivée
  type V = { id: string; prenom: string | null; nom: string | null; email: string | null; telephone: string | null }
  const byVoyageur = new Map<string, { v: V; arrivee: string; logement: string | null }>()
  for (const s of (sejoursRes.data ?? []) as Array<{ logement: string | null; date_arrivee: string; voyageurs: V | V[] | null }>) {
    const v = Array.isArray(s.voyageurs) ? s.voyageurs[0] : s.voyageurs
    if (!v || byVoyageur.has(v.id)) continue
    byVoyageur.set(v.id, { v, arrivee: s.date_arrivee, logement: s.logement })
  }
  const voyageurs = Array.from(byVoyageur.values()).map(x => x.v)
  const flagged = await flaggedVoyageurs(voyageurs, t => !isPositive(t))
  const upcoming: UpcomingGuest[] = Array.from(byVoyageur.values()).map(({ v, arrivee, logement }) => ({
    id: v.id,
    nom: `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() || 'Voyageur',
    arrivee,
    logement,
    verifiable: !!(v.email?.trim() || v.telephone?.trim()),
    motifs: flagged.get(v.id) ?? [],
  }))

  const myReports: MyReport[] = (mineRes.data ?? []).map(r => ({
    id: r.id,
    qui: r.name || r.identifier,
    incident_type: r.incident_type,
    reported_at: r.reported_at,
    positive: isPositive(r.incident_type),
    statut: r.moderation_status === 'approved' ? 'publie'
      : r.moderation_status === 'rejected' || r.moderation_status === 'removed' ? 'refuse'
      : r.is_validated ? 'valide' : 'relecture',
  }))

  return (
    <SecuriteView
      totalNegative={total - positives}
      totalPositive={positives}
      myReports={myReports}
      upcoming={upcoming}
      initialQuery={searchParams.q ?? ''}
      prefill={searchParams.signaler ? {
        email: searchParams.email ?? '',
        phone: searchParams.tel ?? '',
        full_name: searchParams.nom ?? '',
      } : null}
    />
  )
}
