'use server'

// Actions des devis des pros (04/10/2026). Les factures se font dans un outil
// agréé (Tiime, Indy ou celui du pro). Le pro agit toujours sur ses propres
// devis : client utilisateur, la RLS fait le reste. Seul
// le numéro (fonction réservée au serveur) passe par le service role, après
// vérification du propriétaire.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { parisToday } from '@/lib/stripe/deposit-window'
import { logger } from '@/lib/logger'
import { sendDocumentToClient } from '@/lib/email/pro-documents'
import {
  addDays, cleanLines, computeTotals, missingDocFields, missingProfileFields, sellerDisplayName,
  type BillingProfile, type DocLine, type ProDocument, type ProKind,
} from './billing'
import { BILLING_BASE, DOC_COLUMNS, getProOwner, loadBillingProfile, normalizeDoc, type ProOwner } from './billing-server'

const FICHE: Record<ProKind, string> = { photographer: '/dashboard/ma-fiche-photographe', cleaner: '/dashboard/ma-fiche-menage' }

const log = logger('pros/billing-actions')

type Res<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const s = (v: unknown, max = 300) => {
  const t = String(v ?? '').trim().slice(0, max)
  return t || null
}
const isoOrNull = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)

async function ctx(kind: ProKind): Promise<{ owner: ProOwner; db: Awaited<ReturnType<typeof createClient>> } | null> {
  if (kind !== 'photographer' && kind !== 'cleaner') return null
  const owner = await getProOwner(kind)
  if (!owner) return null
  return { owner, db: await createClient() }
}

function refresh(kind: ProKind, id?: string) {
  revalidatePath(BILLING_BASE[kind])
  revalidatePath(FICHE[kind])
  revalidatePath(`${FICHE[kind]}/facturation`)
  if (id) revalidatePath(`${BILLING_BASE[kind]}/${id}`)
}

async function getDoc(kind: ProKind, owner: ProOwner, db: Awaited<ReturnType<typeof createClient>>, id: string): Promise<ProDocument | null> {
  const { data } = await db.from('pro_documents').select(DOC_COLUMNS)
    .eq('id', id).eq('owner_kind', kind).eq('owner_id', owner.proId).maybeSingle()
  return data ? normalizeDoc(data as Record<string, unknown>) : null
}

// ─── Infos du pro ───────────────────────────────────────────

export async function saveBillingProfile(kind: ProKind, p: BillingProfile): Promise<Res> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  const row = {
    owner_kind: kind, owner_id: c.owner.proId,
    legal_name: s(p.legal_name, 120), trade_name: s(p.trade_name, 120),
    legal_form: p.legal_form === 'societe' ? 'societe' : 'EI',
    siret: s(p.siret, 20)?.replace(/[^\d ]/g, '') || null,
    address: s(p.address, 300), email: s(p.email, 200), phone: s(p.phone, 30),
    vat_mode: p.vat_mode === 'tva' ? 'tva' : 'franchise', vat_number: s(p.vat_number, 30),
    default_vat_rate: [20, 10, 5.5].includes(Number(p.default_vat_rate)) ? Number(p.default_vat_rate) : 20,
    quote_validity_days: [15, 30, 60, 90].includes(Number(p.quote_validity_days)) ? Number(p.quote_validity_days) : 30,
    footer_note: s(p.footer_note, 400),
    has_invoicing_tool: !!p.has_invoicing_tool, invoicing_tool: p.has_invoicing_tool ? s(p.invoicing_tool, 60) : null,
  }
  const { error } = await c.db.from('pro_billing_profiles').upsert(row, { onConflict: 'owner_kind,owner_id' })
  if (error) { log.error('saveBillingProfile', { err: error.message }); return { ok: false, error: 'Enregistrement impossible. Réessaie.' } }
  refresh(kind)
  return { ok: true }
}

/** « J'ai déjà mon outil de facturation » : masque nos partenaires (Tiime, Indy) */
export async function setInvoicingTool(kind: ProKind, has: boolean, tool?: string | null): Promise<Res> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  const { error } = await c.db.from('pro_billing_profiles').upsert(
    { owner_kind: kind, owner_id: c.owner.proId, has_invoicing_tool: has, invoicing_tool: has ? s(tool, 60) : null },
    { onConflict: 'owner_kind,owner_id' },
  )
  if (error) {
    log.error('setInvoicingTool', { err: error.message })
    return { ok: false, error: /does not exist|schema cache/i.test(error.message) ? 'Réglage bientôt disponible.' : 'Enregistrement impossible. Réessaie.' }
  }
  refresh(kind)
  return { ok: true }
}

// ─── Brouillons ─────────────────────────────────────────────────────

export interface DocInput {
  id?: string | null
  client_id?: string | null
  client_name?: string | null
  client_email?: string | null
  client_address?: string | null
  client_is_pro?: boolean
  client_siren?: string | null
  title?: string | null
  service_date?: string | null
  valid_until?: string | null
  lines: DocLine[]
  vat_rate?: number
  notes?: string | null
}

export async function saveDocument(kind: ProKind, input: DocInput): Promise<Res<{ id: string }>> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  const { profile } = await loadBillingProfile(kind, c.owner)
  const lines = cleanLines(input.lines ?? [])
  const vatRate = profile.vat_mode === 'tva' ? (Number(input.vat_rate) || profile.default_vat_rate) : 0
  const row = {
    kind: 'devis' as const,
    client_id: input.client_id || null,
    client_name: s(input.client_name, 150), client_email: s(input.client_email, 200)?.toLowerCase() ?? null,
    client_address: s(input.client_address, 300), client_is_pro: !!input.client_is_pro,
    client_siren: input.client_is_pro ? s(input.client_siren, 20) : null,
    title: s(input.title, 150),
    service_date: isoOrNull(input.service_date), valid_until: isoOrNull(input.valid_until),
    lines, vat_mode: profile.vat_mode, vat_rate: vatRate,
    ...computeTotals(lines, profile.vat_mode, vatRate),
    notes: s(input.notes, 2000),
  }
  if (input.id) {
    const doc = await getDoc(kind, c.owner, c.db, input.id)
    if (!doc) return { ok: false, error: 'Devis introuvable.' }
    if (doc.status !== 'brouillon') return { ok: false, error: 'Ce devis est envoyé : il ne se modifie plus. Duplique-le pour en faire une nouvelle version.' }
    const { error } = await c.db.from('pro_documents').update(row).eq('id', doc.id)
    if (error) { log.error('saveDocument update', { err: error.message }); return { ok: false, error: 'Enregistrement impossible. Réessaie.' } }
    refresh(kind, doc.id)
    return { ok: true, id: doc.id }
  }
  const { data, error } = await c.db.from('pro_documents')
    .insert({ ...row, owner_kind: kind, owner_id: c.owner.proId, status: 'brouillon' }).select('id').single()
  if (error || !data) { log.error('saveDocument insert', { err: error?.message }); return { ok: false, error: 'Enregistrement impossible. Réessaie.' } }
  refresh(kind)
  return { ok: true, id: data.id as string }
}

export async function deleteDraft(kind: ProKind, id: string): Promise<Res> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  const doc = await getDoc(kind, c.owner, c.db, id)
  if (!doc) return { ok: false, error: 'Devis introuvable.' }
  const { error } = await c.db.from('pro_documents').delete().eq('id', id)
  if (error) return { ok: false, error: 'Suppression impossible.' }
  refresh(kind)
  return { ok: true }
}

// ─── Finalisation et envoi ──────────────────────────────────────────

async function nextNumber(kind: ProKind, proId: string, year: number): Promise<string | null> {
  const { data, error } = await getServiceClient().rpc('next_pro_document_number', {
    p_owner_kind: kind, p_owner_id: proId, p_kind: 'devis', p_year: year,
  })
  if (error) { log.error('numérotation', { err: error.message }); return null }
  return data as string
}

/** Ajoute le client au carnet « Mes clients » s'il n'y est pas encore */
async function ensureClient(kind: ProKind, owner: ProOwner, db: Awaited<ReturnType<typeof createClient>>, doc: ProDocument): Promise<string | null> {
  if (doc.client_id || !doc.client_name) return doc.client_id
  let q = db.from('pro_clients').select('id').eq('owner_kind', kind).eq('owner_id', owner.proId)
  q = doc.client_email ? q.eq('email', doc.client_email) : q.eq('nom', doc.client_name)
  const { data: found } = await q.limit(1).maybeSingle()
  if (found) return found.id as string
  const { data } = await db.from('pro_clients').insert({
    owner_kind: kind, owner_id: owner.proId, nom: doc.client_name, email: doc.client_email,
    statut: 'client', notes: doc.client_address ? `Adresse : ${doc.client_address}` : null,
  }).select('id').single()
  return (data?.id as string) ?? null
}

export async function finalizeDocument(kind: ProKind, id: string, send: boolean): Promise<Res<{ number: string; emailError?: string }>> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  const doc = await getDoc(kind, c.owner, c.db, id)
  if (!doc) return { ok: false, error: 'Devis introuvable.' }
  if (doc.status !== 'brouillon') return { ok: false, error: 'Ce devis est déjà envoyé.' }
  const { profile, saved } = await loadBillingProfile(kind, c.owner)
  const missingP = missingProfileFields(saved ? profile : null)
  if (missingP.length) return { ok: false, error: `Complète d'abord tes infos (en haut de la page Devis) : ${missingP.join(', ')}.` }
  const missingD = missingDocFields(doc)
  if (missingD.length) return { ok: false, error: `Il manque ${missingD.join(' et ')}.` }
  if (send && !doc.client_email) return { ok: false, error: 'Ajoute l\'e-mail du client pour lui envoyer le devis.' }

  const today = parisToday()
  const number = await nextNumber(kind, c.owner.proId, Number(today.slice(0, 4)))
  if (!number) return { ok: false, error: 'Numérotation indisponible pour le moment. Réessaie dans un instant.' }
  const clientId = await ensureClient(kind, c.owner, c.db, doc)
  const lines = cleanLines(doc.lines)
  const patch = {
    number, status: 'envoye', issue_date: today, client_id: clientId, lines,
    ...computeTotals(lines, doc.vat_mode, doc.vat_rate),
    seller: profile,
    valid_until: doc.valid_until && doc.valid_until >= today ? doc.valid_until : addDays(today, profile.quote_validity_days),
  }
  // Mise à jour conditionnelle : deux clics simultanés ne finalisent qu'une fois
  const { data: done, error } = await c.db.from('pro_documents').update(patch)
    .eq('id', id).eq('status', 'brouillon').select(DOC_COLUMNS).maybeSingle()
  if (error || !done) { log.error('finalize', { err: error?.message }); return { ok: false, error: 'Finalisation impossible. Réessaie.' } }

  let emailError: string | undefined
  if (send) {
    const final = normalizeDoc(done as Record<string, unknown>)
    const r = await sendDocumentToClient({ doc: final, sellerName: profile.trade_name || sellerDisplayName(profile), replyTo: profile.email || c.owner.email })
    if (r.ok) await c.db.from('pro_documents').update({ sent_at: new Date().toISOString() }).eq('id', id)
    else emailError = r.error
  }
  refresh(kind, id)
  return { ok: true, number, ...(emailError ? { emailError } : {}) }
}

export async function sendDocument(kind: ProKind, id: string, reminder = false): Promise<Res> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  const doc = await getDoc(kind, c.owner, c.db, id)
  if (!doc || doc.status === 'brouillon') return { ok: false, error: 'Finalise d\'abord le devis.' }
  const seller = doc.seller ?? (await loadBillingProfile(kind, c.owner)).profile
  const r = await sendDocumentToClient({ doc, sellerName: seller.trade_name || sellerDisplayName(seller), replyTo: seller.email || c.owner.email, reminder })
  if (!r.ok) return { ok: false, error: r.error ?? 'Envoi impossible.' }
  await c.db.from('pro_documents').update({ sent_at: new Date().toISOString() }).eq('id', id)
  refresh(kind, id)
  return { ok: true }
}

// ─── Suivi ──────────────────────────────────────────────────────────

export async function setDocStatus(kind: ProKind, id: string, status: 'accepte' | 'refuse' | 'envoye'): Promise<Res> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  if (!['accepte', 'refuse', 'envoye'].includes(status)) return { ok: false, error: 'Action impossible sur ce devis.' }
  const doc = await getDoc(kind, c.owner, c.db, id)
  if (!doc || doc.status === 'brouillon') return { ok: false, error: 'Action impossible sur ce devis.' }
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = { status }
  if (status === 'accepte') Object.assign(patch, { accepted_at: now, refused_at: null })
  if (status === 'refuse') Object.assign(patch, { refused_at: now, accepted_at: null, accepted_name: null })
  if (status === 'envoye') Object.assign(patch, { accepted_at: null, accepted_name: null, refused_at: null })
  const { error } = await c.db.from('pro_documents').update(patch).eq('id', id)
  if (error) return { ok: false, error: 'Mise à jour impossible.' }
  refresh(kind, id)
  return { ok: true }
}

/** Copie un devis en nouveau brouillon (nouvelle version, ou même prestation pour un autre client) */
export async function duplicateDocument(kind: ProKind, id: string): Promise<Res<{ id: string }>> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  const doc = await getDoc(kind, c.owner, c.db, id)
  if (!doc) return { ok: false, error: 'Devis introuvable.' }
  const { profile } = await loadBillingProfile(kind, c.owner)
  const vatRate = profile.vat_mode === 'tva' ? (doc.vat_rate || profile.default_vat_rate) : 0
  const { data, error } = await c.db.from('pro_documents').insert({
    owner_kind: kind, owner_id: c.owner.proId, kind: 'devis', status: 'brouillon',
    client_id: doc.client_id, client_name: doc.client_name, client_email: doc.client_email,
    client_address: doc.client_address, client_is_pro: doc.client_is_pro, client_siren: doc.client_siren,
    title: doc.title, service_date: doc.service_date,
    lines: doc.lines, vat_mode: profile.vat_mode, vat_rate: vatRate, ...computeTotals(doc.lines, profile.vat_mode, vatRate),
    notes: doc.notes,
  }).select('id').single()
  if (error || !data) return { ok: false, error: 'Copie impossible. Réessaie.' }
  refresh(kind)
  return { ok: true, id: data.id as string }
}
