import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import { anonymizedNeed } from '@/lib/demandes/rules'
import DemandesView, { type DemandeAdmin } from './DemandesView'

export const metadata = { title: 'Demandes d’hôtes, Admin' }
export const dynamic = 'force-dynamic'

// Demande inversée (12/10/2026) : besoins décrits par les hôtes sur
// jasonmarinho.com/trouver-un-pro et pros à qui ils ont été envoyés.
export default async function DemandesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const db = getServiceClient()
  const { data, error } = await db.from('demandes_hotes')
    .select('id, created_at, metier, ville, logement, quand, frequence, budget, message, nom, email, telephone, status, sent_to, source')
    .order('created_at', { ascending: false }).limit(300)

  const ids = new Map<string, Set<string>>([['photographe', new Set()], ['menage', new Set()]])
  for (const d of data ?? []) for (const s of (d.sent_to as Array<{ id: string }>) ?? []) ids.get(d.metier)?.add(s.id)
  const [ph, cl] = await Promise.all([
    ids.get('photographe')!.size ? db.from('photographers').select('id, full_name, pseudo, slug').in('id', [...ids.get('photographe')!]) : Promise.resolve({ data: [] }),
    ids.get('menage')!.size ? db.from('cleaners').select('id, full_name, pseudo, slug').in('id', [...ids.get('menage')!]) : Promise.resolve({ data: [] }),
  ])
  const names = new Map<string, string>()
  for (const p of [...((ph.data ?? []) as Array<{ id: string; full_name: string; pseudo: string | null }>), ...((cl.data ?? []) as Array<{ id: string; full_name: string; pseudo: string | null }>)]) names.set(p.id, p.pseudo || p.full_name)

  const demandes: DemandeAdmin[] = (data ?? []).map(d => ({
    id: d.id, created_at: d.created_at, metier: d.metier, ville: d.ville, status: d.status,
    nom: d.nom, email: d.email, telephone: d.telephone, message: d.message,
    details: [d.logement, d.frequence, d.quand, d.budget ? `budget ${d.budget}` : null].filter(Boolean).join(' · '),
    besoin: anonymizedNeed(d),
    pros: ((d.sent_to as Array<{ id: string; round: number }>) ?? []).map(s => ({ name: names.get(s.id) ?? 'Fiche supprimée', round: s.round })),
  }))

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <DemandesView demandes={demandes} missing={!!error} />
    </div>
  )
}
