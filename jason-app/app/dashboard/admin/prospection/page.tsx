import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { outreachConfig } from '@/lib/outreach/mailer'
import { placesUsage } from '@/lib/google/places-budget'
import { parisToday } from '@/lib/stripe/deposit-window'
import ProspectionScreen from './ProspectionScreen'
import type { ContactRow, SendRow, SequenceRow, SettingsRow, StepRow } from './shared'

const SEQ_COLS = 'id, nom, audience, description, trigger, trigger_stage, enabled, stop_on_reply, repeat_after_days, max_repeats, then_sequence_id, end_stage, position'
const CONTACT_COLS = 'id, audience, email, prenom, nom, entreprise, ville, departement, site_web, telephone, instagram, source, source_detail, stage, notes, tags, last_contacted_at, replied_at, created_at'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const db = getServiceClient()
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

  const [seqRes, { data: steps }, { data: enr }, contactsRes, { data: settings }, { data: sends }, sentToday, sent7, sent30, errors7, replies30, contacted30, { data: allSends }, openRes] = await Promise.all([
    // Colonnes de la migration 116 (trigger_tag, next_action…) : repli sans elles si elle n'est pas appliquée
    withFallback(
      () => db.from('outreach_sequences').select(`${SEQ_COLS}, trigger_tag`).order('position'),
      () => db.from('outreach_sequences').select(SEQ_COLS).order('position'),
    ),
    db.from('outreach_steps').select('id, sequence_id, position, delay_days, subject, body, same_thread').order('position'),
    db.from('outreach_enrollments').select('sequence_id, contact_id, status, next_step').limit(20000),
    withFallback(
      () => db.from('outreach_contacts').select(`${CONTACT_COLS}, next_action, next_action_on`).order('created_at', { ascending: false }).limit(5000),
      () => db.from('outreach_contacts').select(CONTACT_COLS).order('created_at', { ascending: false }).limit(5000),
    ),
    db.from('outreach_settings').select('*').eq('id', 1).maybeSingle(),
    db.from('outreach_sends').select('id, contact_id, sequence_id, step_position, email, subject, status, error, sent_at').gte('sent_at', since30).order('sent_at', { ascending: false }).limit(3000),
    db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'envoye').gte('sent_at', dayStart),
    db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'envoye').gte('sent_at', since7),
    db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'envoye').gte('sent_at', since30),
    db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'erreur').gte('sent_at', since7),
    db.from('outreach_contacts').select('id', { count: 'exact', head: true }).gte('replied_at', since30),
    db.from('outreach_contacts').select('id', { count: 'exact', head: true }).gte('last_contacted_at', since30),
    // Par e-mail de séquence, depuis le début : envois et personnes distinctes
    db.from('outreach_sends').select('contact_id, sequence_id, step_position').eq('status', 'envoye').limit(20000),
    // Ouvertures anonymes (migration 117, absente = pas de chiffre)
    db.from('outreach_open_stats').select('sequence_id, step_position, opens'),
  ])

  const contacts = contactsRes.data as Array<Record<string, unknown> & { id: string }> | null
  if (seqRes.error && /relation|does not exist/i.test(seqRes.error.message) && !/column/i.test(seqRes.error.message)) {
    return (
      <div style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text)' }}>Prospection : base pas encore prête.</strong> Applique la migration <code>20260929_115_prospection.sql</code> dans Supabase, puis recharge la page.
      </div>
    )
  }

  const stepsBySeq = new Map<string, StepRow[]>()
  for (const st of steps ?? []) {
    const list = stepsBySeq.get(st.sequence_id) ?? []
    list.push({ id: st.id, position: st.position, delay_days: st.delay_days, subject: st.subject, body: st.body, same_thread: st.same_thread })
    stepsBySeq.set(st.sequence_id, list)
  }
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
  const opensTracked = !openRes.error
  const opensByStep = new Map((openRes.data ?? []).map(o => [`${o.sequence_id}|${o.step_position}`, o.opens as number]))
  const sequences: SequenceRow[] = ((seqRes.data ?? []) as Array<Record<string, unknown> & { id: string }>).map(sq => {
    const c = counts.get(sq.id) ?? { en_cours: 0, terminee: 0, arretee: 0, atStep: [] }
    const st = (stepsBySeq.get(sq.id) ?? []).sort((a, b) => a.position - b.position)
    const stepStats = st.map((_, i) => {
      const k = `${sq.id}|${i}`
      const b = sentByStep.get(k)
      return { sent: b?.sent ?? 0, people: b?.people.size ?? 0, opens: opensTracked ? opensByStep.get(k) ?? 0 : null }
    })
    return { trigger_tag: null, ...sq, steps: st, counts: { en_cours: c.en_cours, terminee: c.terminee, arretee: c.arretee }, atStep: st.map((_, i) => c.atStep[i] ?? 0), stepStats } as SequenceRow
  })
  const contactRows: ContactRow[] = (contacts ?? []).map(c => ({ next_action: null, next_action_on: null, ...c, tags: (c.tags as string[] | null) ?? [], active_sequence_id: activeByContact.get(c.id) ?? null }) as unknown as ContactRow)
  const cfg = outreachConfig()
  const settingsRow: SettingsRow = {
    daily_cap: settings?.daily_cap ?? 25, send_days: settings?.send_days ?? [1, 2, 3, 4, 5], paused: settings?.paused ?? false,
    signature: settings?.signature ?? null, signature_photo: settings?.signature_photo ?? true, last_run_at: settings?.last_run_at ?? null, last_run_summary: settings?.last_run_summary ?? null,
  }

  const usage = await placesUsage().catch(() => null)
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
      stats={{
        sentToday: sentToday.count ?? 0, sent7: sent7.count ?? 0, sent30: sent30.count ?? 0, errors7: errors7.count ?? 0,
        replies30: replies30.count ?? 0, contacted30: contacted30.count ?? 0,
      }}
    />
  )
}
