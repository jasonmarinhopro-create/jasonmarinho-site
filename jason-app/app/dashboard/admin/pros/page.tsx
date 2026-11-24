// Admin « Pros » (24/11/2026, option A validée par Jason) : une seule page pour
// les 3 métiers de l'annuaire (photo et vidéo, ménage, dépannage), en fiches
// carrées avec une bascule en liste. Remplace les pages photographes, ménage
// et dépannage (redirigées ici avec ?metier=). Fiches d'exemple (comptes
// admin) à part, hors chiffres et places Fondateur. Rien des demandes reçues
// ni du carnet clients d'un pro (confidentialité) : seulement les compteurs.
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import { syncProSubscriptions } from '@/lib/pros/subscription-sync'
import { adminUserIds, splitDemo } from '@/lib/pros/demo'
import { KINDS, METIERS, metierParSlug, type ProKind } from '@/lib/pros/metiers'
import { COMMON_COLUMNS, EXTRA_COLUMNS, toAdminPro, buildDemandes, buildActivity, type AdminPro } from '@/lib/pros/admin-list'
import { photoDuPro } from '@/lib/demandes/public'
import { allRows } from '@/lib/supabase/all-rows'
import { loadMemberActivity } from '@/lib/admin/activity-load'
import { perfTimer } from '@/lib/perf/server-timing'
import ProsAdmin from './ProsAdmin'

export const metadata = { title: 'Pros, Admin' }
export const dynamic = 'force-dynamic'

const STATUTS = ['active', 'pending_payment', 'approved_pending_payment', 'hidden', 'cancelled']

export default async function ProsAdminPage({ searchParams }: { searchParams?: { metier?: string } }) {
  const timer = perfTimer('page /dashboard/admin/pros')
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const db = getServiceClient()
  // Statut des abonnements relu chez Stripe avant d'afficher (3 s au plus)
  await syncProSubscriptions(db, 3000)
  timer.mark('sync')
  const [admins, ...results] = await Promise.all([
    adminUserIds(db),
    ...KINDS.map(kind => db.from(METIERS[kind].table)
      .select(`${COMMON_COLUMNS}, ${EXTRA_COLUMNS[kind]}`)
      .in('status', STATUTS)
      .order('created_at', { ascending: false })
      .limit(1000)),
  ])
  timer.mark('fiches')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const pros: AdminPro[] = []
  const demo: AdminPro[] = []
  const errors: string[] = []
  KINDS.forEach((kind, i) => {
    const { data, error } = results[i] as { data: Array<Record<string, unknown>> | null; error: { message: string } | null }
    if (error) { errors.push(METIERS[kind].nom); return }
    const split = splitDemo((data ?? []) as Array<{ user_id?: string | null } & Record<string, unknown>>, admins)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conv = (r: any) => toAdminPro(kind, r, photoDuPro(r, supabaseUrl))
    pros.push(...split.real.map(conv))
    demo.push(...split.demo.map(conv))
  })

  // Activité (dates seulement) et origine des demandes : jamais le contenu des
  // demandes ni du carnet clients. Une source en panne laisse la fiche sans ce détail.
  type Contact = { pro: string; created_at: string; source_url: string | null; status: string | null }
  const everyone = [...pros, ...demo]
  const [contacts, clients, documents, seen] = await Promise.all([
    Promise.all(KINDS.map(async kind => {
      const M = METIERS[kind]
      const { rows, error } = await allRows<Record<string, string | null>>((from, to) =>
        db.from(M.contactsTable).select(`${M.idColumn}, created_at, source_url, status`).order('id').range(from, to))
      return error ? null : rows.map(r => ({ pro: `${kind}:${r[M.idColumn]}`, created_at: String(r.created_at), source_url: r.source_url, status: r.status }) as Contact)
    })),
    allRows<{ owner_kind: string; owner_id: string; created_at: string }>((from, to) =>
      db.from('pro_clients').select('owner_kind, owner_id, created_at').order('id').range(from, to)),
    allRows<{ owner_kind: string; owner_id: string; kind: string; created_at: string }>((from, to) =>
      db.from('pro_documents').select('owner_kind, owner_id, kind, created_at').order('id').range(from, to)),
    loadMemberActivity(everyone.map(p => p.userId).filter((v): v is string => !!v)).catch(() => new Map()),
  ])
  timer.mark('activite')
  timer.done()

  const byPro = new Map<string, Contact[]>()
  contacts.forEach(list => list?.forEach(c => byPro.set(c.pro, [...(byPro.get(c.pro) ?? []), c])))
  const contactsOk = (kind: ProKind) => contacts[KINDS.indexOf(kind)] !== null
  const lastOf = (rows: Array<{ owner_kind: string; owner_id: string; created_at: string }>, p: AdminPro) =>
    rows.filter(r => r.owner_kind === p.kind && r.owner_id === p.id).reduce<string | null>((m, r) => (!m || r.created_at > m ? r.created_at : m), null)
  for (const p of everyone) {
    const mine = byPro.get(`${p.kind}:${p.id}`) ?? []
    p.demandes = contactsOk(p.kind) ? buildDemandes(mine) : null
    p.lastSeenAt = p.userId ? seen.get(p.userId)?.lastSeenAt ?? null : null
    p.activity = buildActivity([
      { label: 'Dernière visite dans l’app', at: p.lastSeenAt },
      { label: 'Fiche mise à jour', at: p.updatedAt },
      { label: 'Dernière demande reçue', at: p.demandes?.derniere },
      { label: 'Client ajouté au carnet', at: clients.error ? null : lastOf(clients.rows, p) },
      { label: 'Devis créé', at: documents.error ? null : lastOf(documents.rows.filter(d => d.kind === 'devis'), p) },
      { label: 'Facture créée', at: documents.error ? null : lastOf(documents.rows.filter(d => d.kind !== 'devis'), p) },
      { label: 'Inscription', at: p.createdAt },
    ])
  }

  const initialKind: ProKind | 'tous' = metierParSlug(searchParams?.metier)?.kind ?? 'tous'
  return <ProsAdmin pros={pros} demo={demo} errors={errors} initialKind={initialKind} />
}
