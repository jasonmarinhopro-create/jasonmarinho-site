// Opérations de prospection lancées hors du navigateur (workflow GitHub
// « Prospection », .github/workflows/prospection.yml) : état, import de pros
// depuis Google Maps + e-mail publié sur leur site, activation des séquences,
// passage d'envoi. Même secret que la publication des réseaux sociaux
// (CRON_SECRET ou SOCIAL_CRON_SECRET) ; refus si aucun n'est défini.
// Les réponses ne contiennent que des nombres et des noms de séquences :
// les journaux du workflow sont publics (dépôt public), jamais d'adresse.

import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { outreachConfig } from '@/lib/outreach/mailer'
import { installPlaybookSequences, loadSettings, runOutreach, sendTest } from '@/lib/outreach/service'
import { relaunchOutreach } from '@/lib/outreach/relaunch'
import { searchGooglePlaces, findEmailOnSite } from '@/lib/outreach/sources'
import type { Audience } from '@/lib/outreach/engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const AUDIENCES: Audience[] = ['photographe', 'menage', 'hote']
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function authorized(req: Request): boolean {
  const secrets = [process.env.CRON_SECRET, process.env.SOCIAL_CRON_SECRET].filter(Boolean)
  if (!secrets.length) return false
  return secrets.some(s => req.headers.get('authorization') === `Bearer ${s}`)
}

const hostOf = (u: string) => { try { return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, '') } catch { return null } }

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as { op?: string; audience?: Audience; query?: string; audiences?: Audience[]; daily_cap?: number }
  const db = getServiceClient()
  try {
    switch (body.op) {
      case 'status': return NextResponse.json(await status(db))
      case 'import': return NextResponse.json(await importFromMaps(db, body.audience, body.query))
      case 'activate': return NextResponse.json(await activate(db, body.audiences ?? ['photographe', 'menage'], body.daily_cap))
      case 'test': {
        // E-mail d'essai (1er e-mail du premier contact photographes) envoyé à la boîte d'envoi elle-même
        const { data: seq } = await db.from('outreach_sequences').select('id').eq('playbook_key', 'photo_premier_contact').maybeSingle()
        const { data: step } = seq ? await db.from('outreach_steps').select('subject, body').eq('sequence_id', seq.id).order('position').limit(1).maybeSingle() : { data: null }
        if (!step) throw new Error('séquence « Photographes : premier contact » introuvable')
        const res = await sendTest(step.subject, step.body, await loadSettings(db))
        return NextResponse.json({ ok: res.ok, envoye_a_la_boite_d_envoi: res.ok, error: res.error ?? null })
      }
      case 'run': {
        const summary = await runOutreach(db, { budgetMs: 45_000, force: true })
        const relaunched = summary.more ? await relaunchOutreach(1, true) : false
        return NextResponse.json({ ok: true, relaunched, ...summary })
      }
      default: return NextResponse.json({ error: 'op inconnue (status, import, activate, test, run)' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message.slice(0, 300) : 'erreur' }, { status: 500 })
  }
}

type Db = ReturnType<typeof getServiceClient>

async function status(db: Db) {
  const tables = await db.from('outreach_sequences').select('id', { count: 'exact', head: true })
  if (tables.error) return { ok: false, migration115: false, error: tables.error.message.slice(0, 200) }
  const m116 = await db.from('outreach_contacts').select('next_action').limit(1)
  const { data: settings } = await db.from('outreach_settings').select('*').eq('id', 1).maybeSingle()
  const { data: seqs } = await db.from('outreach_sequences').select('id, nom, audience, enabled, trigger')
  const { data: enr } = await db.from('outreach_enrollments').select('sequence_id').eq('status', 'en_cours').limit(20000)
  const inSeq = new Map<string, number>()
  for (const e of enr ?? []) inSeq.set(e.sequence_id, (inSeq.get(e.sequence_id) ?? 0) + 1)
  const contacts: Record<string, Record<string, number>> = {}
  for (const a of AUDIENCES) {
    const { data } = await db.from('outreach_contacts').select('stage').eq('audience', a).limit(20000)
    const by: Record<string, number> = {}
    for (const c of data ?? []) by[c.stage] = (by[c.stage] ?? 0) + 1
    contacts[a] = by
  }
  const { count: sentTotal } = await db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'envoye')
  const cfg = outreachConfig()
  return {
    ok: true,
    migration115: true,
    migration116: !m116.error,
    boite_configuree: !!cfg,
    serveur_smtp: cfg?.smtpHost ?? null,
    cle_google_maps: !!process.env.GOOGLE_PLACES_API_KEY,
    reglages: settings ? { plafond: settings.daily_cap, jours: settings.send_days, pause: settings.paused, dernier_passage: settings.last_run_at, resume: settings.last_run_summary } : null,
    contacts,
    sequences: (seqs ?? []).map(s => ({ nom: s.nom, audience: s.audience, active: s.enabled, declencheur: s.trigger, en_cours: inSeq.get(s.id) ?? 0 })),
    envoyes_total: sentTotal ?? 0,
  }
}

/** Une recherche Google Maps (20 résultats), e-mail publié sur le site de chaque pro, ajout en « À contacter ». */
async function importFromMaps(db: Db, audience: Audience | undefined, query: string | undefined) {
  if (!audience || !AUDIENCES.includes(audience)) throw new Error('audience manquante')
  if (!query || query.trim().length < 3) throw new Error('recherche manquante')
  const started = Date.now()
  const { results } = await searchGooglePlaces({ audience, query })
  const withSite = results.filter(r => r.site_web && hostOf(r.site_web))

  // Sites déjà connus (contact existant, toutes audiences) : pas de nouvelle visite
  const { data: known } = await db.from('outreach_contacts').select('site_web').not('site_web', 'is', null).limit(20000)
  const knownHosts = new Set((known ?? []).map(k => hostOf(k.site_web as string)).filter(Boolean))
  const seen = new Set<string>()
  const todo = withSite.filter(r => {
    const h = hostOf(r.site_web!)!
    if (knownHosts.has(h) || seen.has(h)) return false
    seen.add(h)
    return true
  })

  // Visite des sites, 5 à la fois, dans le temps disponible
  const found: Array<{ row: typeof todo[number]; email: string }> = []
  let crawled = 0
  for (let i = 0; i < todo.length; i += 5) {
    if (Date.now() - started > 40_000) break
    const batch = todo.slice(i, i + 5)
    const res = await Promise.all(batch.map(r => findEmailOnSite(r.site_web!).catch(() => ({ email: null, checked: 0 }))))
    crawled += batch.length
    res.forEach((r, j) => { if (r.email && EMAIL_OK.test(r.email)) found.push({ row: batch[j], email: r.email.toLowerCase() }) })
  }

  const emails = found.map(f => f.email)
  const { data: supp } = emails.length ? await db.from('outreach_suppressions').select('email_norm').in('email_norm', emails) : { data: [] }
  const blocked = new Set((supp ?? []).map(s => s.email_norm))
  let added = 0
  let duplicates = 0
  for (const f of found) {
    if (blocked.has(f.email)) { duplicates++; continue }
    const r = f.row
    const { error } = await db.from('outreach_contacts').insert({
      audience, email: f.email, nom: r.nom?.slice(0, 200) ?? null, entreprise: r.entreprise?.slice(0, 200) ?? null,
      ville: r.ville?.slice(0, 80) ?? null, departement: r.departement?.slice(0, 3) ?? null, site_web: r.site_web?.slice(0, 300) ?? null,
      telephone: r.telephone?.slice(0, 40) ?? null, source: 'site',
      source_detail: `E-mail publié sur ${r.site_web} (${r.source_detail ?? 'Google Maps'})`.slice(0, 300),
      stage: 'a_contacter',
    })
    if (error) duplicates++
    else added++
  }
  return {
    ok: true, recherche: query, resultats_maps: results.length, avec_site: withSite.length, sites_deja_connus: withSite.length - todo.length,
    sites_visites: crawled, emails_trouves: found.length, ajoutes: added, doublons_ou_opposes: duplicates, secondes: Math.round((Date.now() - started) / 1000),
  }
}

/** Installe les séquences proposées, active celles des audiences choisies, sort de pause avec un plafond prudent. */
async function activate(db: Db, audiences: Audience[], cap?: number) {
  const list = audiences.filter(a => AUDIENCES.includes(a))
  if (!list.length) throw new Error('aucune audience')
  const installed = await installPlaybookSequences(db)
  // Premier contact automatique : tout contact « À contacter » y entre, au rythme du plafond
  await db.from('outreach_sequences').update({ trigger: 'nouveau_contact', updated_at: new Date().toISOString() })
    .in('playbook_key', list.map(a => `${a === 'photographe' ? 'photo' : a}_premier_contact`)).eq('trigger', 'manuel')
  const { data: seqs, error } = await db.from('outreach_sequences').update({ enabled: true, updated_at: new Date().toISOString() }).in('audience', list).select('nom, audience')
  if (error) throw new Error(error.message)
  // Montée en charge : 25 par jour par défaut, jamais plus de 80 (boîte Hostinger gratuite : 100 par jour, messages de Jason compris)
  const dailyCap = Math.min(80, Math.max(5, Math.round(cap ?? 25)))
  await db.from('outreach_settings').update({ paused: false, daily_cap: dailyCap, send_days: [1, 2, 3, 4, 5], updated_at: new Date().toISOString() }).eq('id', 1)
  return { ok: true, sequences_installees: installed, sequences_actives: (seqs ?? []).map(s => `${s.audience} : ${s.nom}`), plafond_par_jour: dailyCap }
}
