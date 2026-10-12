import 'server-only'

// QG : chargement des demandes d'hôtes et de ce qu'il faut pour les traiter
// (état de chaque envoi, pros à qui les transmettre). Service role, appelé
// par page.tsx après la vérification du rôle admin.

import { getServiceClient } from '@/lib/supabase/service'
import { describeAcquisition, type Acquisition } from '@/lib/acquisition/rules'
import { listProsChoix } from '@/lib/demandes/send'
import { etatAdmin, aTraiter, proAOuvert, type DemandeAdminRow, type EtatAdmin, type ProChoix } from '@/lib/demandes/admin'
import type { DemandeMetier } from '@/lib/demandes/rules'

export interface EnvoiQG { proId: string; nom: string; slug: string | null; ville: string | null; round: number; at: string | null; manual: boolean; ouvert: boolean }

export interface DemandeQG extends DemandeAdminRow {
  message: string | null
  nom: string
  email: string
  telephone: string | null
  source: string | null
  provenance: string
  admin_note: string | null
  envois: EnvoiQG[]
  etat: EtatAdmin
  /** État si la demande n'était pas marquée traitée (pour « Rouvrir ») */
  etatOuvert: EtatAdmin
  aTraiter: boolean
  /** À traiter une fois vue et rouverte (retard, sans pro) */
  aTraiterVue: boolean
}

export interface DemandesQGData {
  demandes: DemandeQG[]
  pros: Record<DemandeMetier, ProChoix[]>
  suiviOk: boolean
  error: string | null
}

const BASE_COLS = 'id, created_at, metier, ville, logement, quand, frequence, budget, message, nom, email, telephone, source, acquisition, status, sent_to, last_round_at'
const CONTACTS: Record<DemandeMetier, string> = { photographe: 'photographer_contacts', menage: 'cleaner_contacts' }
const PROS: Record<DemandeMetier, string> = { photographe: 'photographers', menage: 'cleaners' }

export async function loadDemandesQG(now = new Date()): Promise<DemandesQGData> {
  const db = getServiceClient()
  const empty = { photographe: [], menage: [] }
  let suiviOk = true
  let res = await db.from('demandes_hotes').select(`${BASE_COLS}, admin_seen_at, admin_note, admin_done_at`).order('created_at', { ascending: false }).limit(300)
  if (res.error && /admin_/.test(res.error.message)) {
    suiviOk = false
    res = await db.from('demandes_hotes').select(BASE_COLS).order('created_at', { ascending: false }).limit(300) as typeof res
  }
  if (res.error) {
    const absent = /demandes_hotes/.test(res.error.message)
    return { demandes: [], pros: empty, suiviOk, error: absent ? 'La table des demandes n’existe pas encore (migration 132).' : 'Lecture des demandes impossible.' }
  }
  const rows = (res.data ?? []) as unknown as Array<DemandeAdminRow & { message: string | null; nom: string; email: string; telephone: string | null; source: string | null; acquisition: Acquisition | null; admin_note?: string | null }>

  // État des lignes « Demandes reçues » créées pour ces demandes (statut seulement)
  // et noms des pros sollicités, même s'ils ont quitté l'annuaire depuis.
  const statuts = new Map<string, string>()
  const noms = new Map<string, { nom: string; slug: string | null; ville: string | null }>()
  const [prosPhoto, prosMenage] = await Promise.all([listProsChoix('photographe'), listProsChoix('menage')])
  for (const p of [...prosPhoto, ...prosMenage]) noms.set(p.id, { nom: p.nom, slug: p.slug, ville: p.ville })
  await Promise.all((['photographe', 'menage'] as const).map(async metier => {
    const mine = rows.filter(r => r.metier === metier)
    const contactIds = mine.flatMap(r => (r.sent_to ?? []).map(s => s.contact_id)).filter(Boolean) as string[]
    const proIds = [...new Set(mine.flatMap(r => (r.sent_to ?? []).map(s => s.id)))].filter(id => !noms.has(id))
    const [c, p] = await Promise.all([
      contactIds.length ? db.from(CONTACTS[metier]).select('id, status').in('id', contactIds) : Promise.resolve({ data: [] }),
      proIds.length ? db.from(PROS[metier]).select('id, full_name, pseudo, slug, ville').in('id', proIds) : Promise.resolve({ data: [] }),
    ])
    for (const x of (c.data ?? []) as Array<{ id: string; status: string }>) statuts.set(x.id, x.status)
    for (const x of (p.data ?? []) as Array<{ id: string; full_name: string; pseudo: string | null; slug: string | null; ville: string | null }>) noms.set(x.id, { nom: x.pseudo || x.full_name, slug: x.slug, ville: x.ville })
  }))

  const demandes: DemandeQG[] = rows.map(r => {
    const d: DemandeAdminRow = { ...r, sent_to: r.sent_to ?? [], admin_seen_at: r.admin_seen_at ?? null, admin_done_at: r.admin_done_at ?? null }
    const prov = describeAcquisition(r.acquisition)
    return {
      ...d,
      message: r.message, nom: r.nom, email: r.email, telephone: r.telephone, source: r.source,
      provenance: prov.kind === 'inconnu' ? 'Pas mesurée' : prov.detail ? `${prov.label} · ${prov.detail}` : prov.label,
      admin_note: r.admin_note ?? null,
      envois: d.sent_to.map(s => {
        const n = noms.get(s.id)
        return { proId: s.id, nom: n?.nom ?? 'Pro retiré de l’annuaire', slug: n?.slug ?? null, ville: n?.ville ?? null, round: s.round, at: s.at ?? null, manual: !!s.manual, ouvert: proAOuvert(s.contact_id, statuts) }
      }),
      etat: etatAdmin(d, statuts),
      etatOuvert: etatAdmin({ ...d, admin_done_at: null, status: d.status === 'close' ? 'envoyee' : d.status }, statuts),
      aTraiter: aTraiter(d, statuts, now),
      aTraiterVue: aTraiter({ ...d, admin_seen_at: d.admin_seen_at ?? now.toISOString(), admin_done_at: null, status: d.status === 'close' ? 'envoyee' : d.status }, statuts, now),
    }
  })
  return { demandes, pros: { photographe: prosPhoto, menage: prosMenage }, suiviOk, error: null }
}
