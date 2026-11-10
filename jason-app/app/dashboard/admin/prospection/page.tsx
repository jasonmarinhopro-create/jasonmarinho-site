import { requireAdmin } from '@/lib/admin/require-admin'
import { getServiceClient } from '@/lib/supabase/service'
import { allRows } from '@/lib/supabase/all-rows'
import { outreachConfig } from '@/lib/outreach/mailer'
import { placesUsage } from '@/lib/google/places-budget'
import { parisToday } from '@/lib/stripe/deposit-window'
import { loadSettings, warmupStats, warmupStatsFrom } from '@/lib/outreach/service'
import { decideWarmup, WARMUP, type WarmupStats } from '@/lib/outreach/warmup'
import ProspectionScreen from './ProspectionScreen'
import type { ContactRow, SendRow, SequenceRow, SettingsRow, Stats, StepRow, WarmupView } from './shared'

const SEQ_COLS = 'id, nom, audience, description, trigger, trigger_stage, enabled, stop_on_reply, repeat_after_days, max_repeats, then_sequence_id, end_stage, position'
const CONTACT_COLS = 'id, audience, email, prenom, nom, entreprise, ville, departement, site_web, telephone, instagram, source, source_detail, stage, notes, tags, last_contacted_at, replied_at, created_at'

type SendDbRow = { id: string; contact_id: string | null; sequence_id: string | null; step_position: number; email: string; subject: string; status: string; error: string | null; sent_at: string }
type Q = PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>
/** Requête avec les colonnes récentes, puis sans elles si la base ne les connaît pas encore (code 42703). */
async function withFallback(full: () => Q, fallback: () => Q) {
  const res = await full()
  if (res.error && (res.error.code === '42703' || /column .* does not exist/i.test(res.error.message))) return fallback()
  return res
}

export const metadata = { title: 'Prospection, Admin' }
export const dynamic = 'force-dynamic'
// « Lancer un passage » et la recherche d'e-mails sur les sites prennent du temps
export const maxDuration = 60

export default async function ProspectionPage() {
  await requireAdmin()

  const db = getServiceClient()
  // Tous les contacts, page par page : Supabase plafonne chaque requête à 1 000 lignes
  const contactsPaged = (cols: string) => allRows<Record<string, unknown> & { id: string }>((from, to) =>
    db.from('outreach_contacts').select(cols).order('created_at', { ascending: false }).order('id').range(from, to) as never, 20_000)
    .then(r => ({ data: r.rows, error: r.error }))
  const since7 = new Date(Date.now() - 7 * 86400_000).toISOString()
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString()
  const today = parisToday()
  const dayStart = (() => {
    for (const off of ['+02:00', '+01:00']) {
      const t = new Date(`${today}T00:00:00${off}`)
      if (parisToday(t) === today && parisToday(new Date(t.getTime() - 1)) !== today) return t.toISOString()
    }
    return `${today}T00:00:00Z`
  })()

  // Séquences, e-mails des séquences et réglages : petites tables lues à part,
  // en même temps que le reste (un seul appel, migration 182) et le compteur Google
  const [[seqRes, { data: steps }, { data: settings }], data, warmSettings, usage] = await Promise.all([Promise.all([
    // Colonnes de la migration 116 (trigger_tag, next_action…) : repli sans elles si elle n'est pas appliquée
    withFallback(
      () => db.from('outreach_sequences').select(`${SEQ_COLS}, trigger_tag`).order('position'),
      () => db.from('outreach_sequences').select(SEQ_COLS).order('position'),
    ),
    db.from('outreach_steps').select('id, sequence_id, position, delay_days, subject, body, same_thread').order('position'),
    db.from('outreach_settings').select('*').eq('id', 1).maybeSingle(),
  ]),
  // Ancien chargement si la fonction de la migration 182 manque
  loadFast(db, { today, dayStart, since7, since30 }).then(r => r ?? loadLegacy(db, { today, dayStart, since7, since30, contactsPaged })),
  loadSettings(db),
  placesUsage().catch(() => null),
  ])
  if (seqRes.error && /relation|does not exist/i.test(seqRes.error.message) && !/column/i.test(seqRes.error.message)) {
    return (
      <div style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text)' }}>Prospection : base pas encore prête.</strong> Applique la migration <code>20260929_115_prospection.sql</code> dans Supabase, puis recharge la page.
      </div>
    )
  }
  const { contacts, sends, stats, counts, activeByContact, sentByStep, opensByStep, warmLive } = data

  const stepsBySeq = new Map<string, StepRow[]>()
  for (const st of steps ?? []) {
    const list = stepsBySeq.get(st.sequence_id) ?? []
    list.push({ id: st.id, position: st.position, delay_days: st.delay_days, subject: st.subject, body: st.body, same_thread: st.same_thread })
    stepsBySeq.set(st.sequence_id, list)
  }
  const opensTracked = opensByStep !== null
  const sequences: SequenceRow[] = ((seqRes.data ?? []) as Array<Record<string, unknown> & { id: string }>).map(sq => {
    const c = counts.get(sq.id) ?? { en_cours: 0, terminee: 0, arretee: 0, atStep: [] }
    const st = (stepsBySeq.get(sq.id) ?? []).sort((a, b) => a.position - b.position)
    const stepStats = st.map((_, i) => {
      const k = `${sq.id}|${i}`
      const b = sentByStep.get(k)
      return { sent: b?.sent ?? 0, people: b?.people ?? 0, opens: opensTracked ? opensByStep.get(k) ?? 0 : null }
    })
    return { trigger_tag: null, ...sq, steps: st, counts: { en_cours: c.en_cours, terminee: c.terminee, arretee: c.arretee }, atStep: st.map((_, i) => c.atStep[i] ?? 0), stepStats } as SequenceRow
  })
  const contactRows: ContactRow[] = (contacts ?? []).map(c => ({ next_action: null, next_action_on: null, ...c, tags: (c.tags as string[] | null) ?? [], active_sequence_id: activeByContact.get(c.id) ?? null }) as unknown as ContactRow)
  const cfg = outreachConfig()
  const settingsRow: SettingsRow = {
    daily_cap: settings?.daily_cap ?? 25, send_days: settings?.send_days ?? [1, 2, 3, 4, 5], paused: settings?.paused ?? false,
    signature: settings?.signature ?? null, signature_photo: settings?.signature_photo ?? true, last_run_at: settings?.last_run_at ?? null, last_run_summary: settings?.last_run_summary ?? null,
    warmup: warmupViewFrom(warmSettings, today, warmLive),
  }

  const placesTs = usage && !usage.error ? usage.items.find(i => i.sku === 'text_search_enterprise') : null
  const placesUsed = placesTs ? { used: placesTs.used, cap: placesTs.cap, free: placesTs.free } : null

  return (
    <ProspectionScreen
      today={today}
      sends={(sends ?? []) as SendRow[]}
      sequences={sequences}
      contacts={contactRows}
      settings={settingsRow}
      config={{ configured: !!cfg, from: cfg?.fromEmail ?? null, host: cfg?.smtpHost ?? null, placesKey: !!process.env.GOOGLE_PLACES_API_KEY, placesUsed }}
      stats={stats}
    />
  )
}

/** Montée en charge : réglages, journal et signaux des 7 derniers jours. */
function warmupViewFrom(st: Awaited<ReturnType<typeof loadSettings>>, today: string, live: WarmupStats | null): WarmupView {
  if (!st.warmup_supported) live = null
  return {
    supported: st.warmup_supported, enabled: st.warmup_enabled, ceiling: st.warmup_ceiling, checkedOn: st.warmup_checked_on, log: st.warmup_log, live,
    preview: live ? decideWarmup({ cap: st.daily_cap, ceiling: st.warmup_ceiling, stats: live, today, lastChange: st.warmup_last_change, lastCut: st.warmup_last_cut }) : null,
  }
}

type Db = ReturnType<typeof getServiceClient>
type Dates = { today: string; dayStart: string; since7: string; since30: string }
type SeqCounts = { en_cours: number; terminee: number; arretee: number; atStep: number[] }
interface Loaded {
  contacts: Array<Record<string, unknown> & { id: string }>
  sends: SendDbRow[]
  stats: Stats
  counts: Map<string, SeqCounts>
  activeByContact: Map<string, string>
  sentByStep: Map<string, { sent: number; people: number }>
  /** null : migration 117 absente, pas de chiffre d'ouvertures */
  opensByStep: Map<string, number> | null
  warmLive: WarmupStats | null
}

/**
 * Tout en un appel (migration 182, 10/11/2026). Avant : ~25 lectures à chaque
 * affichage et après chaque action. null si la fonction n'existe pas encore.
 */
async function loadFast(db: Db, d: Dates): Promise<Loaded | null> {
  const wsince = new Date(Date.now() - WARMUP.windowDays * 86400_000).toISOString()
  const wsince3 = new Date(Date.now() - 4 * 86400_000).toISOString()
  const { data, error } = await db.rpc('outreach_admin_data', { p_day_start: d.dayStart, p_since7: d.since7, p_since30: d.since30, p_wsince: wsince, p_wsince3: wsince3 })
  if (error || !data) return null
  type Raw = {
    stats: { sent_today: number; sent7: number; sent30: number; errors7: number; replies30: number; contacted30: number }
    step_stats: Array<{ s: string; p: number; sent: number; people: number }>
    enroll: Array<{ s: string; st: 'en_cours' | 'terminee' | 'arretee'; ns: number; n: number }>
    active: Array<[string, string]>
    opens: Array<{ s: string; p: number; opens: number }>
    warm: { sent: number; errors: Array<string | null>; reasons: string[]; replies: number; recent: string[] }
    contacts: Array<Record<string, unknown> & { id: string }>
    sends: SendDbRow[]
  }
  const r = data as Raw
  const counts = new Map<string, SeqCounts>()
  for (const e of r.enroll) {
    const c = counts.get(e.s) ?? { en_cours: 0, terminee: 0, arretee: 0, atStep: [] }
    c[e.st] += e.n
    if (e.st === 'en_cours') c.atStep[e.ns] = (c.atStep[e.ns] ?? 0) + e.n
    counts.set(e.s, c)
  }
  return {
    contacts: r.contacts,
    sends: r.sends,
    stats: { sentToday: r.stats.sent_today, sent7: r.stats.sent7, sent30: r.stats.sent30, errors7: r.stats.errors7, replies30: r.stats.replies30, contacted30: r.stats.contacted30 },
    counts,
    activeByContact: new Map(r.active.map(([c, sq]) => [c, sq])),
    sentByStep: new Map(r.step_stats.map(x => [`${x.s}|${x.p}`, { sent: x.sent, people: x.people }])),
    opensByStep: new Map(r.opens.map(o => [`${o.s}|${o.p}`, o.opens])),
    warmLive: warmupStatsFrom(r.warm, d.today),
  }
}

/** Ancien chargement (migration 182 pas encore appliquée). */
async function loadLegacy(db: Db, d: Dates & { contactsPaged: (cols: string) => Promise<{ data: Array<Record<string, unknown> & { id: string }>; error: { message: string; code?: string } | null }> }): Promise<Loaded> {
  const { since7, since30, dayStart, contactsPaged } = d
  const [{ data: enr }, contactsRes, { data: sends }, sentToday, sent7, sent30, errors7, replies30, contacted30, { data: allSends }, openRes, warmLive] = await Promise.all([
    allRows<{ sequence_id: string; contact_id: string; status: string; next_step: number }>((from, to) => db.from('outreach_enrollments').select('sequence_id, contact_id, status, next_step').order('id').range(from, to)).then(r => ({ data: r.rows })),
    withFallback(
      () => contactsPaged(`${CONTACT_COLS}, next_action, next_action_on`),
      () => contactsPaged(CONTACT_COLS),
    ),
    allRows<SendDbRow>((from, to) => db.from('outreach_sends').select('id, contact_id, sequence_id, step_position, email, subject, status, error, sent_at').gte('sent_at', since30).order('sent_at', { ascending: false }).order('id').range(from, to), 10_000).then(r => ({ data: r.rows })),
    db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'envoye').gte('sent_at', dayStart),
    db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'envoye').gte('sent_at', since7),
    db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'envoye').gte('sent_at', since30),
    db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'erreur').gte('sent_at', since7),
    db.from('outreach_contacts').select('id', { count: 'exact', head: true }).gte('replied_at', since30),
    db.from('outreach_contacts').select('id', { count: 'exact', head: true }).gte('last_contacted_at', since30),
    // Par e-mail de séquence, depuis le début : envois et personnes distinctes
    allRows<{ contact_id: string | null; sequence_id: string; step_position: number }>((from, to) => db.from('outreach_sends').select('contact_id, sequence_id, step_position').eq('status', 'envoye').order('id').range(from, to)).then(r => ({ data: r.rows })),
    // Ouvertures anonymes (migration 117, absente = pas de chiffre)
    db.from('outreach_open_stats').select('sequence_id, step_position, opens'),
    warmupStats(db, d.today).catch(() => null),
  ])

  const activeByContact = new Map<string, string>()
  const counts = new Map<string, { en_cours: number; terminee: number; arretee: number; atStep: number[] }>()
  for (const e of enr ?? []) {
    const c = counts.get(e.sequence_id) ?? { en_cours: 0, terminee: 0, arretee: 0, atStep: [] }
    c[e.status as 'en_cours' | 'terminee' | 'arretee']++
    if (e.status === 'en_cours') {
      c.atStep[e.next_step] = (c.atStep[e.next_step] ?? 0) + 1
      activeByContact.set(e.contact_id, e.sequence_id)
    }
    counts.set(e.sequence_id, c)
  }
  const sentByStep = new Map<string, { sent: number; people: Set<string> }>()
  for (const x of allSends ?? []) {
    const k = `${x.sequence_id}|${x.step_position}`
    const cur = sentByStep.get(k) ?? { sent: 0, people: new Set<string>() }
    cur.sent++
    if (x.contact_id) cur.people.add(x.contact_id)
    sentByStep.set(k, cur)
  }
  return {
    contacts: (contactsRes.data ?? []) as Array<Record<string, unknown> & { id: string }>,
    sends: (sends ?? []) as SendDbRow[],
    stats: {
      sentToday: sentToday.count ?? 0, sent7: sent7.count ?? 0, sent30: sent30.count ?? 0, errors7: errors7.count ?? 0,
      replies30: replies30.count ?? 0, contacted30: contacted30.count ?? 0,
    },
    counts,
    activeByContact,
    sentByStep: new Map(Array.from(sentByStep.entries()).map(([k, v]) => [k, { sent: v.sent, people: v.people.size }])),
    opensByStep: openRes.error ? null : new Map((openRes.data ?? []).map(o => [`${o.sequence_id}|${o.step_position}`, o.opens as number])),
    warmLive,
  }
}
