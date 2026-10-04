// Chargement côté serveur des devis et factures d'un pro (client utilisateur :
// la RLS de la migration 122 limite tout au pro connecté).

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { EMPTY_PROFILE, type BillingProfile, type ProDocument, type ProKind } from './billing'

export const PRO_TABLE: Record<ProKind, 'photographers' | 'cleaners'> = { photographer: 'photographers', cleaner: 'cleaners' }
export const BILLING_BASE: Record<ProKind, string> = {
  photographer: '/dashboard/ma-fiche-photographe/devis-factures',
  cleaner: '/dashboard/ma-fiche-menage/devis-factures',
}

export interface ProOwner {
  userId: string
  proId: string
  email: string
  fullName: string
  displayName: string
  phone: string | null
  ville: string | null
  logoUrl: string | null
  siret: string | null
}

export const DOC_COLUMNS = 'id, kind, number, status, client_id, client_name, client_email, client_address, client_is_pro, client_siren, title, issue_date, service_date, valid_until, due_date, lines, vat_mode, vat_rate, total_ht, total_tva, total_ttc, notes, seller, source_id, public_token, sent_at, accepted_at, accepted_name, paid_at, paid_method, reminded_at, created_at, updated_at'
const PROFILE_COLUMNS = 'legal_name, trade_name, legal_form, siret, address, email, phone, vat_mode, vat_number, default_vat_rate, iban, bic, payment_days, quote_validity_days, footer_note'

/** Le pro connecté (sa propre fiche, jamais celle d'un autre : pas d'accès admin) */
export async function getProOwner(kind: ProKind): Promise<ProOwner | null> {
  const user = await getAuthUser()
  if (!user) return null
  const db = await createClient()
  const cols = kind === 'cleaner'
    ? 'id, email, full_name, pseudo, telephone, ville, logo_url, siret'
    : 'id, email, full_name, pseudo, telephone, ville, logo_url'
  const { data } = await db.from(PRO_TABLE[kind]).select(cols).eq('user_id', user.id).maybeSingle()
  if (!data) return null
  const row = data as unknown as { id: string; email: string; full_name: string; pseudo: string | null; telephone: string | null; ville: string | null; logo_url: string | null; siret?: string | null }
  return {
    userId: user.id, proId: row.id, email: row.email, fullName: row.full_name,
    displayName: row.pseudo || row.full_name, phone: row.telephone, ville: row.ville,
    logoUrl: row.logo_url, siret: row.siret ?? null,
  }
}

export function normalizeDoc(d: Record<string, unknown>): ProDocument {
  const num = (v: unknown) => Number(v) || 0
  return {
    ...(d as unknown as ProDocument),
    lines: Array.isArray(d.lines) ? (d.lines as ProDocument['lines']) : [],
    vat_rate: num(d.vat_rate), total_ht: num(d.total_ht), total_tva: num(d.total_tva), total_ttc: num(d.total_ttc),
  }
}

/** Infos de facturation enregistrées, sinon pré-remplies depuis la fiche */
export async function loadBillingProfile(kind: ProKind, owner: ProOwner): Promise<{ profile: BillingProfile; saved: boolean }> {
  const db = await createClient()
  const { data, error } = await db.from('pro_billing_profiles').select(PROFILE_COLUMNS)
    .eq('owner_kind', kind).eq('owner_id', owner.proId).maybeSingle()
  if (data && !error) {
    const p = data as unknown as BillingProfile
    return { profile: { ...p, default_vat_rate: Number(p.default_vat_rate) || 20 }, saved: true }
  }
  return {
    profile: { ...EMPTY_PROFILE, legal_name: owner.fullName, email: owner.email, phone: owner.phone, siret: owner.siret },
    saved: false,
  }
}

export async function loadDocuments(kind: ProKind, owner: ProOwner): Promise<{ docs: ProDocument[]; tableMissing: boolean }> {
  const db = await createClient()
  const { data, error } = await db.from('pro_documents').select(DOC_COLUMNS)
    .eq('owner_kind', kind).eq('owner_id', owner.proId)
    .order('created_at', { ascending: false }).limit(500)
  if (error) return { docs: [], tableMissing: error.code === '42P01' || /does not exist|schema cache/i.test(error.message) }
  return { docs: (data ?? []).map(d => normalizeDoc(d as Record<string, unknown>)), tableMissing: false }
}

export async function loadClients(kind: ProKind, owner: ProOwner) {
  const db = await createClient()
  const { data } = await db.from('pro_clients').select('id, nom, email, ville, logement')
    .eq('owner_kind', kind).eq('owner_id', owner.proId).order('nom').limit(500)
  return (data ?? []) as Array<{ id: string; nom: string; email: string | null; ville: string | null; logement: string | null }>
}
