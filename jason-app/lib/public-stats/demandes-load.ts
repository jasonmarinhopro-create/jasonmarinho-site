// Chargement des demandes d'hôtes publiées sur /chiffres (server only).
// Règles et confidentialité : demandes.ts. Gardé 10 min (une nouvelle demande
// apparaît vite) ; une table en panne donne null, la page affiche alors
// « indisponible » plutôt qu'un faux zéro.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { allRows } from '@/lib/supabase/all-rows'
import { parisToday } from '@/lib/stripe/deposit-window'
import { anyCitySlugOf, cityLabel } from '@/lib/visibility/city-page'
import { adminUserIds, isDemoFiche } from '@/lib/pros/demo'
import { prosByCity } from './rules'
import {
  buildPublicDemandes, directItems, etatOfContact, etatOfDemande, fromTrouverUnPro, isTestEmail,
  type DemandeItem, type DemandeMetier, type PublicDemandes,
} from './demandes'

type Fiche = { id: string; ville: string | null; zone_couverte: string | null; status: string | null; is_public: boolean | null; user_id: string | null; villes_couvertes?: string[] | null }
type Contact = { id: string; created_at: string; fiche_id: string; source_url: string | null; status: string | null; contact_email: string | null }

const PROS = {
  photographe: { table: 'photographers', contacts: 'photographer_contacts', fk: 'photographer_id' },
  menage: { table: 'cleaners', contacts: 'cleaner_contacts', fk: 'cleaner_id' },
  depannage: { table: 'depannage_pros', contacts: 'depannage_contacts', fk: 'depannage_id' },
} as const

async function compute(): Promise<PublicDemandes> {
  const db = getServiceClient()
  const admins = await adminUserIds(db)
  const adminEmails = new Set<string>()
  if (admins.size) {
    const { data } = await db.from('profiles').select('email').in('id', [...admins])
    for (const r of (data ?? []) as Array<{ email: string | null }>) if (r.email) adminEmails.add(r.email.trim().toLowerCase())
  }

  const items: DemandeItem[] = []
  const contactStatus = new Map<string, string | null>()
  const excluded = { test: 0, exemple: 0 }
  const prosMaps = { photographe: new Map<string, number>(), menage: new Map<string, number>(), depannage: new Map<string, number>() }

  for (const metier of ['photographe', 'menage', 'depannage'] as DemandeMetier[]) {
    const t = PROS[metier]
    let fiches = await db.from(t.table).select('id, ville, zone_couverte, status, is_public, user_id, villes_couvertes')
    if (fiches.error) fiches = await db.from(t.table).select('id, ville, zone_couverte, status, is_public, user_id')
    // Dépannage (31/10/2026) : une table en panne n'efface pas les chiffres des 2 autres métiers
    if (fiches.error && metier === 'depannage') continue
    if (fiches.error) throw new Error(`fiches ${metier}`)
    const byId = new Map(((fiches.data ?? []) as Fiche[]).map(f => [f.id, f]))
    prosMaps[metier] = prosByCity([...byId.values()].filter(f => !isDemoFiche(f, admins)), anyCitySlugOf)

    const { rows, error } = await allRows<Record<string, unknown>>((from, to) =>
      db.from(t.contacts).select(`id, created_at, ${t.fk}, source_url, status, contact_email`).order('created_at').order('id').range(from, to))
    if (error && metier === 'depannage') continue
    if (error) throw new Error(`demandes ${metier}`)
    for (const r of rows) {
      const c: Contact = {
        id: String(r.id), created_at: String(r.created_at), fiche_id: String(r[t.fk] ?? ''),
        source_url: (r.source_url as string | null) ?? null, status: (r.status as string | null) ?? null, contact_email: (r.contact_email as string | null) ?? null,
      }
      contactStatus.set(c.id, c.status)
      if (fromTrouverUnPro(c.source_url)) continue
      const fiche = byId.get(c.fiche_id)
      // Fiches d'exemple et messages de test jamais comptés
      if (!fiche || isDemoFiche(fiche, admins)) { excluded.exemple++; continue }
      if (isTestEmail(c.contact_email, adminEmails)) { excluded.test++; continue }
      items.push({ at: c.created_at, metier, slug: anyCitySlugOf(fiche.ville, fiche.zone_couverte), source: 'fiche', etat: etatOfContact(c.status) })
    }
  }

  const { rows: demandes, error } = await allRows<{ created_at: string; metier: DemandeMetier; ville: string; status: string; sent_to: Array<{ contact_id?: string }> | null; email: string }>((from, to) =>
    db.from('demandes_hotes').select('id, created_at, metier, ville, status, sent_to, email').order('created_at').order('id').range(from, to))
  if (error) throw new Error('demandes_hotes')
  for (const d of demandes) {
    if (isTestEmail(d.email, adminEmails)) { excluded.test++; continue }
    const statuses = (d.sent_to ?? []).map(s => s.contact_id).filter((x): x is string => !!x).map(id => contactStatus.get(id))
    items.push({ at: d.created_at, metier: d.metier, slug: anyCitySlugOf(d.ville), source: 'formulaire', etat: etatOfDemande(d.status, statuses) })
  }

  items.push(...directItems())
  return buildPublicDemandes(items, { today: parisToday(), labelOf: cityLabel, pros: prosMaps, excluded })
}

const cached = unstable_cache(compute, ['public-demandes-v5'], { revalidate: 600, tags: ['public-demandes'] })

export async function loadPublicDemandes(): Promise<PublicDemandes | null> {
  try {
    return await cached()
  } catch {
    return null
  }
}
