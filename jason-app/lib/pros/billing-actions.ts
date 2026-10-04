'use server'

// Actions des devis et factures des pros (04/10/2026). Le pro agit toujours
// sur ses propres documents : client utilisateur, la RLS fait le reste. Seul
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
  type BillingProfile, type DocKind, type DocLine, type ProDocument, type ProKind,
} from './billing'
import { BILLING_BASE, DOC_COLUMNS, getProOwner, loadBillingProfile, normalizeDoc, type ProOwner } from './billing-server'

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
  if (id) revalidatePath(`${BILLING_BASE[kind]}/${id}`)
}

async function getDoc(kind: ProKind, owner: ProOwner, db: Awaited<ReturnType<typeof createClient>>, id: string): Promise<ProDocument | null> {
  const { data } = await db.from('pro_documents').select(DOC_COLUMNS)
    .eq('id', id).eq('owner_kind', kind).eq('owner_id', owner.proId).maybeSingle()
  return data ? normalizeDoc(data as Record<string, unknown>) : null
}

// ─── Infos de facturation ───────────────────────────────────────────

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
    iban: s(p.iban, 40)?.toUpperCase() ?? null, bic: s(p.bic, 15)?.toUpperCase() ?? null,
    payment_days: [0, 7, 15, 30, 45].includes(Number(p.payment_days)) ? Number(p.payment_days) : 0,
    quote_validity_days: [15, 30, 60, 90].includes(Number(p.quote_validity_days)) ? Number(p.quote_validity_days) : 30,
    footer_note: s(p.footer_note, 400),
  }
  const { error } = await c.db.from('pro_billing_profiles').upsert(row, { onConflict: 'owner_kind,owner_id' })
  if (error) { log.error('saveBillingProfile', { err: error.message }); return { ok: false, error: 'Enregistrement impossible. Réessaie.' } }
  refresh(kind)
  return { ok: true }
}

// ─── Brouillons ─────────────────────────────────────────────────────

export interface DocInput {
  id?: string | null
  kind: DocKind
  client_id?: string | null
  client_name?: string | null
  client_email?: string | null
  client_address?: string | null
  client_is_pro?: boolean
  client_siren?: string | null
  title?: string | null
  service_date?: string | null
  valid_until?: string | null
  due_date?: string | null
  lines: DocLine[]
  vat_rate?: number
  notes?: string | null
}

export async function saveDocument(kind: ProKind, input: DocInput): Promise<Res<{ id: string }>> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  if (input.kind !== 'devis' && input.kind !== 'facture') return { ok: false, error: 'Type de document inconnu.' }
  const { profile } = await loadBillingProfile(kind, c.owner)
  const lines = cleanLines(input.lines ?? [])
  const vatRate = profile.vat_mode === 'tva' ? (Number(input.vat_rate) || profile.default_vat_rate) : 0
  const row = {
    kind: input.kind,
    client_id: input.client_id || null,
    client_name: s(input.client_name, 150), client_email: s(input.client_email, 200)?.toLowerCase() ?? null,
    client_address: s(input.client_address, 300), client_is_pro: !!input.client_is_pro,
    client_siren: input.client_is_pro ? s(input.client_siren, 20) : null,
    title: s(input.title, 150),
    service_date: isoOrNull(input.service_date), valid_until: isoOrNull(input.valid_until), due_date: isoOrNull(input.due_date),
    lines, vat_mode: profile.vat_mode, vat_rate: vatRate,
    ...computeTotals(lines, profile.vat_mode, vatRate),
    notes: s(input.notes, 2000),
  }
  if (input.id) {
    const doc = await getDoc(kind, c.owner, c.db, input.id)
    if (!doc) return { ok: false, error: 'Document introuvable.' }
    if (doc.status !== 'brouillon') return { ok: false, error: 'Ce document est finalisé : il ne se modifie plus.' }
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
  if (!doc) return { ok: false, error: 'Document introuvable.' }
  if (doc.status !== 'brouillon' && doc.kind !== 'devis') return { ok: false, error: 'Une facture finalisée ne se supprime pas : annule-la par un avoir.' }
  const { error } = await c.db.from('pro_documents').delete().eq('id', id)
  if (error) return { ok: false, error: 'Suppression impossible.' }
  refresh(kind)
  return { ok: true }
}

// ─── Finalisation et envoi ──────────────────────────────────────────

async function nextNumber(kind: ProKind, proId: string, docKind: DocKind, year: number): Promise<string | null> {
  const { data, error } = await getServiceClient().rpc('next_pro_document_number', {
    p_owner_kind: kind, p_owner_id: proId, p_kind: docKind, p_year: year,
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
  if (!doc) return { ok: false, error: 'Document introuvable.' }
  if (doc.status !== 'brouillon') return { ok: false, error: 'Ce document est déjà finalisé.' }
  const { profile, saved } = await loadBillingProfile(kind, c.owner)
  const missingP = missingProfileFields(saved ? profile : null)
  if (missingP.length) return { ok: false, error: `Complète d'abord tes infos de facturation : ${missingP.join(', ')}.` }
  const missingD = missingDocFields(doc)
  if (missingD.length) return { ok: false, error: `Il manque ${missingD.join(' et ')}.` }
  if (send && !doc.client_email) return { ok: false, error: 'Ajoute l\'e-mail du client pour lui envoyer le document.' }

  const today = parisToday()
  const number = await nextNumber(kind, c.owner.proId, doc.kind, Number(today.slice(0, 4)))
  if (!number) return { ok: false, error: 'Numérotation indisponible pour le moment. Réessaie dans un instant.' }
  const clientId = await ensureClient(kind, c.owner, c.db, doc)
  const lines = cleanLines(doc.lines)
  const patch = {
    number, status: 'envoye', issue_date: today, client_id: clientId, lines,
    ...computeTotals(lines, doc.vat_mode, doc.vat_rate),
    seller: profile,
    valid_until: doc.kind === 'devis' ? (doc.valid_until && doc.valid_until >= today ? doc.valid_until : addDays(today, profile.quote_validity_days)) : null,
    due_date: doc.kind === 'facture' ? (doc.due_date && doc.due_date >= today ? doc.due_date : addDays(today, profile.payment_days)) : null,
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
  if (!doc || doc.status === 'brouillon') return { ok: false, error: 'Finalise d\'abord le document.' }
  const seller = doc.seller ?? (await loadBillingProfile(kind, c.owner)).profile
  const r = await sendDocumentToClient({ doc, sellerName: seller.trade_name || sellerDisplayName(seller), replyTo: seller.email || c.owner.email, reminder })
  if (!r.ok) return { ok: false, error: r.error ?? 'Envoi impossible.' }
  await c.db.from('pro_documents').update(reminder ? { reminded_at: new Date().toISOString() } : { sent_at: new Date().toISOString() }).eq('id', id)
  refresh(kind, id)
  return { ok: true }
}

// ─── Suivi ──────────────────────────────────────────────────────────

export async function setDocStatus(kind: ProKind, id: string, status: 'accepte' | 'refuse' | 'paye' | 'envoye', opts: { paidAt?: string; paidMethod?: string } = {}): Promise<Res> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  const doc = await getDoc(kind, c.owner, c.db, id)
  if (!doc || doc.status === 'brouillon' || doc.status === 'annule') return { ok: false, error: 'Action impossible sur ce document.' }
  const allowed = doc.kind === 'devis' ? ['accepte', 'refuse', 'envoye'] : doc.kind === 'facture' ? ['paye', 'envoye'] : []
  if (!allowed.includes(status)) return { ok: false, error: 'Action impossible sur ce document.' }
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = { status }
  if (status === 'accepte') Object.assign(patch, { accepted_at: now, refused_at: null })
  if (status === 'refuse') Object.assign(patch, { refused_at: now, accepted_at: null, accepted_name: null })
  if (status === 'paye') Object.assign(patch, { paid_at: isoOrNull(opts.paidAt) ?? parisToday(), paid_method: s(opts.paidMethod, 40) })
  if (status === 'envoye') Object.assign(patch, { paid_at: null, paid_method: null, accepted_at: null, accepted_name: null, refused_at: null })
  const { error } = await c.db.from('pro_documents').update(patch).eq('id', id)
  if (error) return { ok: false, error: 'Mise à jour impossible.' }
  refresh(kind, id)
  return { ok: true }
}

/** Copie un document en nouveau brouillon (devis → facture, ou duplication) */
async function copyAsDraft(kind: ProKind, id: string, as: 'facture' | 'same'): Promise<Res<{ id: string }>> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  const doc = await getDoc(kind, c.owner, c.db, id)
  if (!doc) return { ok: false, error: 'Document introuvable.' }
  const target: DocKind = as === 'facture' ? 'facture' : doc.kind === 'avoir' ? 'facture' : doc.kind
  const { profile } = await loadBillingProfile(kind, c.owner)
  const vatRate = profile.vat_mode === 'tva' ? (doc.vat_rate || profile.default_vat_rate) : 0
  const lines = doc.kind === 'avoir' ? doc.lines.map(l => ({ ...l, unit_price: Math.abs(l.unit_price) })) : doc.lines
  const { data, error } = await c.db.from('pro_documents').insert({
    owner_kind: kind, owner_id: c.owner.proId, kind: target, status: 'brouillon',
    client_id: doc.client_id, client_name: doc.client_name, client_email: doc.client_email,
    client_address: doc.client_address, client_is_pro: doc.client_is_pro, client_siren: doc.client_siren,
    title: doc.title, service_date: as === 'facture' ? doc.service_date : null,
    lines, vat_mode: profile.vat_mode, vat_rate: vatRate, ...computeTotals(lines, profile.vat_mode, vatRate),
    notes: doc.notes, source_id: as === 'facture' ? doc.id : null,
  }).select('id').single()
  if (error || !data) return { ok: false, error: 'Copie impossible. Réessaie.' }
  refresh(kind)
  return { ok: true, id: data.id as string }
}

export async function createInvoiceFromQuote(kind: ProKind, id: string) { return copyAsDraft(kind, id, 'facture') }
export async function duplicateDocument(kind: ProKind, id: string) { return copyAsDraft(kind, id, 'same') }

/** Annule une facture finalisée par un avoir du même montant, numéroté aussitôt */
export async function cancelWithCreditNote(kind: ProKind, id: string): Promise<Res<{ id: string; number: string }>> {
  const c = await ctx(kind)
  if (!c) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  const doc = await getDoc(kind, c.owner, c.db, id)
  if (!doc || doc.kind !== 'facture' || doc.status === 'brouillon' || doc.status === 'annule') return { ok: false, error: 'Seule une facture finalisée peut être annulée par un avoir.' }
  const today = parisToday()
  const number = await nextNumber(kind, c.owner.proId, 'avoir', Number(today.slice(0, 4)))
  if (!number) return { ok: false, error: 'Numérotation indisponible pour le moment.' }
  const lines = doc.lines.map(l => ({ ...l, unit_price: -Math.abs(l.unit_price) }))
  const { data, error } = await c.db.from('pro_documents').insert({
    owner_kind: kind, owner_id: c.owner.proId, kind: 'avoir', status: 'envoye', number, issue_date: today,
    client_id: doc.client_id, client_name: doc.client_name, client_email: doc.client_email,
    client_address: doc.client_address, client_is_pro: doc.client_is_pro, client_siren: doc.client_siren,
    title: doc.title, service_date: doc.service_date, lines,
    vat_mode: doc.vat_mode, vat_rate: doc.vat_rate, ...computeTotals(lines, doc.vat_mode, doc.vat_rate),
    seller: doc.seller, source_id: doc.id,
  }).select('id').single()
  if (error || !data) { log.error('avoir', { err: error?.message }); return { ok: false, error: 'Création de l\'avoir impossible.' } }
  await c.db.from('pro_documents').update({ status: 'annule' }).eq('id', doc.id)
  refresh(kind, doc.id)
  return { ok: true, id: data.id as string, number }
}
