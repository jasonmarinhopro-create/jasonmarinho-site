// Demande inversée, côté serveur : enregistrement, envoi aux pros, e-mails,
// relances (cron notifications-engine) et purge. Règles pures : rules.ts.
// E-mails par Resend (offre gratuite : 100 par jour) : au plus 3 pros + l'hôte
// + Jason par demande.

import 'server-only'
import { Resend } from 'resend'
import { getServiceClient } from '@/lib/supabase/service'
import { logger } from '@/lib/logger'
import { adminUserIds, isDemoFiche } from '@/lib/pros/demo'
import { sendAdminEmail } from '@/lib/email/admin'
import { buildEmail, emailBtn, emailInfoBlock, emailNote, emailP, escHtml } from '@/lib/email/template'
import {
  choisirPros, messagePourPro, anonymizedNeed, prochaineAction, CONSERVATION_MOIS,
  type DemandeInput, type DemandeMetier, type ProCandidat, type DemandeEtat,
} from './rules'

const log = logger('demandes')
const FROM = 'Jason Marinho <notifications@jasonmarinho.com>'
const SITE = 'https://jasonmarinho.com'
const APP = 'https://app.jasonmarinho.com'

type Pro = ProCandidat & { slug: string; full_name: string; pseudo: string | null; email: string; user_id: string | null }

const T = {
  photographe: { table: 'photographers', contacts: 'contacts' as const, contactTable: 'photographer_contacts', fk: 'photographer_id', rpc: 'increment_photographer_contacts', dir: 'photographes', dash: 'ma-fiche-photographe', label: 'photographe', labels: 'photographes', un: 'un photographe' },
  menage: { table: 'cleaners', contacts: 'contacts' as const, contactTable: 'cleaner_contacts', fk: 'cleaner_id', rpc: 'increment_cleaner_contacts', dir: 'menage', dash: 'ma-fiche-menage', label: 'équipe de ménage', labels: 'équipes de ménage', un: 'une équipe de ménage' },
} as const

interface DemandeRow extends DemandeEtat {
  id: string; metier: DemandeMetier; ville: string; logement: string | null; quand: string | null; frequence: string | null
  budget: string | null; message: string | null; nom: string; email: string; telephone: string | null; source: string | null
}

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

async function loadPros(metier: DemandeMetier): Promise<Pro[]> {
  const db = getServiceClient()
  const t = T[metier]
  const cols = 'id, slug, full_name, pseudo, email, ville, zone_couverte, villes_couvertes, contacts_count, created_at, user_id'
  const q = (c: string) => db.from(t.table).select(c).eq('status', 'active').eq('is_public', true).not('slug', 'is', null).limit(1000)
  let res: { data: unknown; error: { message: string } | null } = await q(cols)
  if (res.error && /villes_couvertes/.test(res.error.message)) res = await q(cols.replace(' villes_couvertes,', ''))
  if (res.error) { log.error('lecture des pros', { metier, err: res.error.message }); return [] }
  const admins = await adminUserIds(db)
  return ((res.data ?? []) as unknown as Pro[]).filter(p => p.email && !isDemoFiche(p, admins))
}

const firstName = (p: Pro) => (p.pseudo || p.full_name || '').split(' ')[0]
const displayName = (p: Pro) => p.pseudo || p.full_name

async function emailPro(d: DemandeInput, pro: Pro, metier: DemandeMetier) {
  const r = resend(); if (!r) return
  const t = T[metier]
  const rows = [
    { label: 'Ville', value: escHtml(d.ville) },
    d.logement ? { label: 'Logement', value: escHtml(d.logement) } : null,
    d.frequence ? { label: 'Besoin', value: escHtml(d.frequence) } : null,
    d.quand ? { label: 'Quand', value: escHtml(d.quand) } : null,
    d.budget ? { label: 'Budget indiqué', value: escHtml(d.budget) } : null,
    { label: 'Contact', value: `${escHtml(d.nom)}<br><a href="mailto:${escHtml(d.email)}" style="color:#004C3F">${escHtml(d.email)}</a>${d.telephone ? `<br>${escHtml(d.telephone)}` : ''}` },
  ].filter(Boolean) as Array<{ label: string; value: string }>
  const html = buildEmail({
    title: `Un hôte cherche ${t.un} à ${escHtml(d.ville)}`,
    preview: `Demande à ${d.ville} : réponds directement à l’hôte`,
    body: [
      emailP(`Bonjour ${escHtml(firstName(pro))},`),
      emailP(`Un hôte vient de décrire son besoin sur jasonmarinho.com et <strong>tu fais partie des 3 pros les plus proches</strong> de son logement. Réponds-lui directement : réponds à cet e-mail, il arrive dans sa boîte.`),
      emailInfoBlock(rows),
      d.message ? emailP(`<em>« ${escHtml(d.message).replace(/\n/g, '<br>')} »</em>`) : '',
      emailBtn(`mailto:${encodeURIComponent(d.email)}?subject=${encodeURIComponent(`Ta demande ${metier === 'photographe' ? 'de photographe' : 'de ménage'} à ${d.ville}`)}`, 'Répondre à l’hôte'),
      emailNote(`La demande est aussi rangée dans <a href="${APP}/dashboard/${t.dash}/demandes" style="color:#004C3F">Demandes reçues</a>. Change son statut quand tu as répondu : sans réponse d’aucun des pros sous 48 h, la demande part à d’autres pros. Aucune commission : le devis et le paiement se règlent entre toi et l’hôte.`),
    ].join(''),
  })
  await r.emails.send({ from: FROM, to: pro.email, replyTo: d.email, subject: `Un hôte cherche ${t.un} à ${d.ville}`, html })
    .catch(e => log.error('e-mail au pro', { err: e instanceof Error ? e.message : String(e) }))
}

async function emailHote(d: DemandeInput, metier: DemandeMetier, pros: Pro[], vague: number) {
  const r = resend(); if (!r) return
  const t = T[metier]
  const list = pros.map(p => `<li style="margin:4px 0"><a href="${SITE}/annuaires/${t.dir}/${escHtml(p.slug)}" style="color:#004C3F;font-weight:600">${escHtml(displayName(p))}</a> (${escHtml(p.ville ?? '')})</li>`).join('')
  const body = pros.length
    ? [
        emailP(`Bonjour ${escHtml(d.nom.split(' ')[0])},`),
        emailP(vague === 1
          ? `Ta demande est partie chez ${pros.length > 1 ? `les ${pros.length} ${t.labels} les plus proches` : `${t.un} proche`} de ton logement à ${escHtml(d.ville)} :`
          : `Les premiers pros n’ont pas encore répondu : ta demande vient de partir chez ${pros.length > 1 ? `${pros.length} autres ${t.labels}` : `un autre pro`} :`),
        `<ul style="margin:6px 0 14px;padding-left:18px;font-size:14px;color:#3D5038">${list}</ul>`,
        emailP('Ils te répondent directement par e-mail. Tu peux aussi regarder leur fiche (photos, formules) en attendant.'),
        emailNote('Sans réponse d’aucun d’eux sous 48 h, on transmet ta demande à d’autres pros de ta zone. Aucune commission : le devis et le paiement se règlent directement entre toi et le pro.'),
      ].join('')
    : [
        emailP(`Bonjour ${escHtml(d.nom.split(' ')[0])},`),
        emailP(`Ta demande est bien enregistrée. Il n’y a pas encore ${metier === 'menage' ? 'd’équipe de ménage inscrite' : 'de photographe inscrit'} près de ${escHtml(d.ville)} : on la transmet dès qu’un pro de ta zone rejoint l’annuaire (dans les 30 jours).`),
        emailBtn(`${SITE}/annuaires/${t.dir}#villes`, `Voir le guide de ta ville`),
        emailNote('Tes coordonnées ne sont transmises qu’aux pros de l’annuaire qui reçoivent ta demande.'),
      ].join('')
  const html = buildEmail({ title: pros.length ? 'Ta demande est partie' : 'Ta demande est enregistrée', body })
  await r.emails.send({ from: FROM, to: d.email, subject: pros.length ? `Ta demande à ${d.ville} est partie chez ${pros.length} pro${pros.length > 1 ? 's' : ''}` : `Ta demande à ${d.ville} est enregistrée`, html })
    .catch(e => log.error('e-mail à l’hôte', { err: e instanceof Error ? e.message : String(e) }))
}

/** Envoie une vague : ligne dans Demandes reçues + e-mail, pour chaque pro */
async function envoyerVague(d: DemandeInput, metier: DemandeMetier, pros: Pro[], round: number, demandeId: string) {
  const db = getServiceClient()
  const t = T[metier]
  const sent: Array<{ id: string; contact_id: string | null; round: number; at: string }> = []
  for (const pro of pros) {
    const { data, error } = await db.from(t.contactTable)
      .insert({ [t.fk]: pro.id, contact_email: d.email, contact_name: d.nom, message: messagePourPro(d), source_url: `${SITE}/trouver-un-pro#demande-${demandeId}` })
      .select('id').maybeSingle()
    if (error) log.error('ligne Demandes reçues', { err: error.message })
    await db.rpc(t.rpc, { p_id: pro.id })
    await emailPro(d, pro, metier)
    sent.push({ id: pro.id, contact_id: (data as { id: string } | null)?.id ?? null, round, at: new Date().toISOString() })
  }
  return sent
}

/** Nouvelle demande : enregistrement, première vague, e-mails. */
export async function creerDemande(d: DemandeInput, acquisition: unknown): Promise<{ ok: true; envoyes: number } | { error: string }> {
  const db = getServiceClient()
  const { data: row, error } = await db.from('demandes_hotes').insert({
    metier: d.metier, ville: d.ville, logement: d.logement, quand: d.quand, frequence: d.frequence, budget: d.budget,
    message: d.message, nom: d.nom, email: d.email, telephone: d.telephone, source: d.source,
    acquisition: acquisition && typeof acquisition === 'object' ? acquisition : null,
    consent_at: new Date().toISOString(),
  }).select('id').maybeSingle()
  if (error || !row) {
    log.error('enregistrement de la demande', { err: error?.message })
    return { error: 'Envoi impossible pour le moment. Réessaie dans quelques minutes.' }
  }
  const id = (row as { id: string }).id
  const pros = choisirPros(await loadPros(d.metier), d.ville, new Set())
  const sent = pros.length ? await envoyerVague(d, d.metier, pros, 1, id) : []
  await db.from('demandes_hotes').update({
    sent_to: sent, status: sent.length ? 'envoyee' : 'sans_pro', last_round_at: new Date().toISOString(),
    admin_notified_at: sent.length ? null : new Date().toISOString(),
  }).eq('id', id)
  await emailHote(d, d.metier, pros, 1)
  await sendAdminEmail({
    subject: sent.length ? `Demande d’hôte : ${T[d.metier].label} à ${d.ville} (${sent.length} pro${sent.length > 1 ? 's' : ''})` : `Demande d’hôte SANS PRO : ${T[d.metier].label} à ${d.ville}`,
    text: `${anonymizedNeed(d)}\n\n${sent.length ? `Envoyée à : ${pros.map(displayName).join(', ')}.` : 'Aucun pro de l’annuaire dans la zone : besoin à présenter aux pros de la ville (sans les coordonnées de l’hôte).'}\n\nToutes les demandes : ${APP}/dashboard/admin/demandes`,
  })
  return { ok: true, envoyes: sent.length }
}

/** Cron quotidien : relances (48 h sans réponse), nouveaux pros, purge 12 mois. */
export async function traiterDemandes(now = new Date()): Promise<{ elargies: number; transmises: number; sansPro: number; purgees: number }> {
  const db = getServiceClient()
  const out = { elargies: 0, transmises: 0, sansPro: 0, purgees: 0 }
  const { data, error } = await db.from('demandes_hotes')
    .select('id, metier, ville, logement, quand, frequence, budget, message, nom, email, telephone, source, status, created_at, last_round_at, sent_to')
    .in('status', ['envoyee', 'elargie', 'sans_pro']).gte('created_at', new Date(now.getTime() - 35 * 86_400_000).toISOString()).limit(200)
  if (error) { if (!/demandes_hotes/.test(error.message)) log.error('relances des demandes', { err: error.message }); return out }
  const rows = (data ?? []) as unknown as DemandeRow[]

  // Statuts des lignes « Demandes reçues » des dernières vagues
  const statuts = new Map<string, string>()
  for (const metier of ['photographe', 'menage'] as const) {
    const ids = rows.filter(r => r.metier === metier).flatMap(r => r.sent_to.map(s => s.contact_id)).filter(Boolean) as string[]
    if (!ids.length) continue
    const { data: c } = await db.from(T[metier].contactTable).select('id, status').in('id', ids)
    for (const x of (c ?? []) as Array<{ id: string; status: string }>) statuts.set(x.id, x.status)
  }

  const prosCache = new Map<DemandeMetier, Pro[]>()
  for (const r of rows) {
    const action = prochaineAction(r, statuts, now)
    if (action === 'rien') continue
    if (!prosCache.has(r.metier)) prosCache.set(r.metier, await loadPros(r.metier))
    const pros = choisirPros(prosCache.get(r.metier)!, r.ville, new Set(r.sent_to.map(s => s.id)))
    if (!pros.length) {
      if (action === 'elargir') {
        await db.from('demandes_hotes').update({ status: 'sans_pro', admin_notified_at: now.toISOString() }).eq('id', r.id)
        out.sansPro++
        await sendAdminEmail({ subject: `Demande d’hôte sans réponse : ${T[r.metier].label} à ${r.ville}`, text: `${anonymizedNeed(r)}\n\nAucun des pros sollicités n’a répondu sous 48 h et il n’y en a pas d’autres dans la zone.\n\n${APP}/dashboard/admin/demandes` })
      }
      continue
    }
    const round = Math.max(0, ...r.sent_to.map(s => s.round)) + 1
    const sent = await envoyerVague(r, r.metier, pros, round, r.id)
    await db.from('demandes_hotes').update({ sent_to: [...r.sent_to, ...sent], status: 'elargie', last_round_at: now.toISOString() }).eq('id', r.id)
    await emailHote(r, r.metier, pros, round)
    if (action === 'elargir') out.elargies++; else out.transmises++
  }

  const limite = new Date(now); limite.setMonth(limite.getMonth() - CONSERVATION_MOIS)
  const { count } = await db.from('demandes_hotes').delete({ count: 'exact' }).lt('created_at', limite.toISOString())
  out.purgees = count ?? 0
  return out
}
