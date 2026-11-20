// Admin > Prospection > E-mails de la plateforme (20/11/2026, demande de Jason :
// voir si les e-mails partent bien et ce qui est cliqué, « en faisant bien les
// choses »). Remise (webhook Resend), clics anonymes par bouton, bilan mensuel
// des pros. Aucune ouverture suivie (CNIL), aucune adresse de voyageur ni de
// client d'un pro (migration 20261120_196_suivi_emails.sql).
import { requireAdmin } from '@/lib/admin/require-admin'
import { getServiceClient } from '@/lib/supabase/service'
import { parisToday } from '@/lib/stripe/deposit-window'
import { buildEmailDashboard, type EmailDashboard, type RawEmailStats } from '@/lib/email/stats'
import { isPaidActive, previousMonth } from '@/lib/visibility/pro-monthly'
import { MONTHLY_OFF_FLAG, monthlySentFlag } from '@/lib/visibility/pro-stats'
import AdminHero, { adminAsideCard } from '../../_ui/AdminHero'
import RelativeTime from '@/components/ui/RelativeTime'
import Link from 'next/link'
import { emailCatalogue } from '@/lib/email/catalogue'

export const metadata = { title: 'E-mails de la plateforme, Admin' }
export const dynamic = 'force-dynamic'

const JOURS = 30
const nf = (n: number) => n.toLocaleString('fr-FR')

async function bilanDuMois(db: ReturnType<typeof getServiceClient>, today: string) {
  const month = previousMonth(today)
  const tables = ['photographers', 'cleaners', 'depannage_pros']
  const fiches = (await Promise.all(tables.map(t => db.from(t).select('user_id, status, stripe_subscription_status').eq('status', 'active').then(r => r.data ?? []))))
    .flat().filter(f => isPaidActive(f as { status: string | null; stripe_subscription_status: string | null }) && f.user_id) as Array<{ user_id: string }>
  const ids = [...new Set(fiches.map(f => f.user_id))]
  if (!ids.length) return { label: month.label, total: 0, envoyes: 0, desabonnes: 0 }
  const { data } = await db.from('profiles').select('id, onboarding_completed_steps').in('id', ids)
  const steps = (data ?? []).map(p => (p.onboarding_completed_steps as string[] | null) ?? [])
  const desabonnes = steps.filter(s => s.includes(MONTHLY_OFF_FLAG)).length
  return { label: month.label, total: ids.length - desabonnes, envoyes: steps.filter(s => s.includes(monthlySentFlag(month.key))).length, desabonnes }
}

export default async function EmailsPage({ searchParams }: { searchParams?: { apercu?: string } }) {
  await requireAdmin()
  const db = getServiceClient()
  const today = parisToday()
  const webhookConfigured = !!process.env.RESEND_WEBHOOK_SECRET
  const [statsRes, bilan] = await Promise.all([
    db.rpc('email_stats', { p_jours: JOURS }),
    bilanDuMois(db, today).catch(() => null),
  ])
  // Fonction absente (migration pas passée) ou autre erreur, affichée telle quelle
  const missing = !!statsRes.error && /PGRST202|42883|42P01/.test(`${statsRes.error.code ?? ''} ${statsRes.error.message}`)
  const readError = statsRes.error && !missing ? statsRes.error.message.slice(0, 200) : null
  const catalogue = emailCatalogue()
  const choisi = catalogue.find(c => c.id === searchParams?.apercu) ?? catalogue.find(c => c.id === 'bilan') ?? catalogue[0]
  const apercu = choisi.render()
  const groupesApercu = [...new Set(catalogue.map(c => c.group))]
  const d: EmailDashboard | null = statsRes.error ? null : buildEmailDashboard(statsRes.data as RawEmailStats, { today, jours: JOURS, webhookConfigured })
  const dernier = (statsRes.data as RawEmailStats | null)?.dernier_evenement ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: 'var(--dash-page-px)', width: '100%', boxSizing: 'border-box' }}>
      <AdminHero
        section="Prospection"
        title="Les e-mails de la plateforme,"
        em="bien arrivés ?"
        desc="Ce que l'app et le site envoient à tes membres, aux voyageurs, aux pros et à toi : ce qui arrive bien, ce qui est rejeté, et les boutons cliqués. Sur les 30 derniers jours."
        aside={
          <div style={adminAsideCard}>
            <span style={kicker}>30 derniers jours</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={big}>{d ? nf(d.total.envoyes) : '-'}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>e-mails envoyés</span>
            </div>
            <Row k="Bien arrivés" v={d?.total.tauxRemise != null ? `${String(d.total.tauxRemise).replace('.', ',')} %` : '-'} />
            <Row k="Rejetés" v={d ? nf(d.total.rejetes) : '-'} warn={!!d?.total.rejetes} />
            <Row k="Signalés comme spam" v={d ? nf(d.total.spam) : '-'} warn={!!d?.total.spam} />
            <Row k="Clics sur les boutons" v={d ? nf(d.total.clics) : '-'} />
            <Row k="Dernier événement" v={dernier ? <RelativeTime iso={dernier} /> : 'aucun'} />
          </div>
        }
      />

      {missing && (
        <div style={notice}>
          <strong>Base pas encore prête.</strong> La migration <code>20261120_196_suivi_emails.sql</code> s&apos;applique au prochain passage du workflow « Migrations Supabase ».
        </div>
      )}
      {readError && <div style={notice}><strong>Lecture des chiffres impossible.</strong> {readError}</div>}
      {d?.alertes.map(a => <div key={a} style={notice}>{a}</div>)}

      {bilan && bilan.total > 0 && (
        <section style={card}>
          <h2 style={h2}>Bilan mensuel des pros</h2>
          <p style={muted}>Bilan de {bilan.label}, envoyé du 1er au 7 du mois. Tu reçois un récap après chaque envoi.</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
            <span style={big}>{bilan.envoyes} / {bilan.total}</span>
            <span style={muted}>fiches servies{bilan.desabonnes ? `, ${bilan.desabonnes} désabonnée${bilan.desabonnes > 1 ? 's' : ''}` : ''}</span>
          </div>
          <div style={barBg}><div style={{ ...barFill, width: `${Math.min(100, (bilan.envoyes / bilan.total) * 100)}%` }} /></div>
        </section>
      )}

      {d && (
        <section style={card}>
          <h2 style={h2}>Envois par jour</h2>
          <Bars jours={d.jours} />
        </section>
      )}

      {d?.groupes.map(g => (
        <section key={g.audience} style={card}>
          <h2 style={h2}>{g.label}</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>{['E-mail', 'Envoyés', 'Arrivés', 'Rejetés', 'Clics', 'Bouton le plus cliqué'].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 0 || i === 5 ? 'left' : 'right' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {g.lignes.map(l => (
                  <tr key={l.categorie}>
                    <td style={td}>{l.label}</td>
                    <td style={tdNum}>{nf(l.envoyes)}</td>
                    <td style={tdNum}>{nf(l.remis)}</td>
                    <td style={{ ...tdNum, color: l.rejetes ? '#8A5A12' : 'var(--text)' }}>{nf(l.rejetes)}</td>
                    <td style={tdNum}>{l.tauxClic === null ? <span style={{ color: 'var(--text-3)' }}>non suivi</span> : <>{nf(l.clics)} <span style={{ color: 'var(--text-3)' }}>({l.tauxClic} %)</span></>}</td>
                    <td style={td}>{l.topBouton ? `${l.topBouton.bouton.replace(/-/g, ' ')} (${l.topBouton.clics})` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {d && (
        <section style={card}>
          <h2 style={h2}>Rejets et signalements</h2>
          {d.rejets.length === 0
            ? <p style={muted}>Aucun sur la période.</p>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={table}>
                  <thead><tr>{['Quand', 'E-mail', 'Adresse', 'Raison'].map(h => <th key={h} style={{ ...th, textAlign: 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {d.rejets.map((r, i) => (
                      <tr key={i}>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}><RelativeTime iso={r.le} /></td>
                        <td style={td}>{r.type === 'complained' ? 'Spam · ' : ''}{r.categorie}</td>
                        <td style={{ ...td, overflowWrap: 'anywhere' }}>{r.destinataire ?? '-'}</td>
                        <td style={{ ...td, color: 'var(--text-2)', overflowWrap: 'anywhere' }}>{r.raison ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      )}

      <section id="apercu" style={card}>
        <h2 style={h2}>Les e-mails, tels qu&apos;ils arrivent</h2>
        <p style={muted}>{catalogue.length} e-mails avec des données fictives. Rien n&apos;est envoyé ni lu en base : seul l&apos;e-mail choisi est préparé.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: '1 1 260px', maxWidth: '100%', minWidth: 0 }}>
            {groupesApercu.map(g => (
              <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ ...kicker, color: 'var(--text-3)', marginBottom: '4px' }}>{g}</span>
                {catalogue.filter(c => c.group === g).map(c => {
                  const on = c.id === choisi.id
                  return (
                    <Link key={c.id} href={`?apercu=${c.id}#apercu`} scroll={false} aria-current={on ? 'true' : undefined} style={{ display: 'flex', flexDirection: 'column', padding: '7px 10px', borderRadius: '10px', textDecoration: 'none', background: on ? 'var(--accent-bg)' : 'transparent', border: on ? '1px solid var(--border)' : '1px solid transparent' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: on ? 600 : 500, color: on ? 'var(--accent-text)' : 'var(--text)' }}>{c.when}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Pour : {c.to}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '3 1 420px', minWidth: 0, maxWidth: '100%' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>Objet : <strong style={{ color: 'var(--text)', overflowWrap: 'anywhere' }}>{apercu.subject}</strong></div>
            <iframe title={`Aperçu : ${apercu.subject}`} srcDoc={apercu.html} sandbox="" style={{ width: '100%', height: '820px', border: '1px solid var(--border)', borderRadius: '14px', background: '#F3F6F4' }} />
          </div>
        </div>
      </section>

      <section style={{ ...card, background: 'transparent' }}>
        <h2 style={h2}>Comment c&apos;est mesuré</h2>
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px', color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.6 }}>
          <li><strong>Envoyés, arrivés, rejetés, spam</strong> : Resend prévient l&apos;app à chaque étape. Aucune ouverture n&apos;est suivie : la CNIL demande un consentement pour ça (recommandation du 12/03/2026), et les chiffres seraient faussés par Apple Mail.</li>
          <li><strong>Clics</strong> : comptés par bouton, sans savoir qui a cliqué. Les liens de connexion, de contrat et de devis ne passent jamais par le compteur. Les antivirus de messagerie qui testent les liens peuvent ajouter quelques clics.</li>
          <li><strong>Adresses</strong> : gardées seulement pour un rejet ou un signalement, pour que tu saches quoi corriger. Jamais celle d&apos;un voyageur ni d&apos;un client d&apos;un pro. Tout est effacé au bout de 13 mois.</li>
          {!webhookConfigured && <li><strong>À brancher</strong> : dans Resend, Webhooks, ajouter <code>https://app.jasonmarinho.com/api/webhooks/resend</code> (événements sent, delivered, bounced, complained, delivery_delayed, failed), puis mettre son secret de signature dans la variable Vercel <code>RESEND_WEBHOOK_SECRET</code> du dashboard.</li>}
        </ul>
      </section>
    </div>
  )
}

function Bars({ jours }: { jours: Array<{ jour: string; envoyes: number }> }) {
  const max = Math.max(1, ...jours.map(j => j.envoyes))
  return (
    <div>
      <div role="img" aria-label={`Envois des ${jours.length} derniers jours, ${jours.reduce((t, j) => t + j.envoyes, 0)} au total`} style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '110px' }}>
        {jours.map(j => (
          <div key={j.jour} title={`${new Date(`${j.jour}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })} : ${j.envoyes}`} style={{ flex: 1, minWidth: 0, height: `${Math.max(2, (j.envoyes / max) * 100)}%`, borderRadius: '4px 4px 0 0', background: j.envoyes ? 'var(--accent-text)' : 'var(--border)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-3)', marginTop: '6px' }}>
        <span>{new Date(`${jours[0].jour}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</span>
        <span>max {max} par jour</span>
        <span>aujourd&apos;hui</span>
      </div>
    </div>
  )
}

function Row({ k, v, warn }: { k: string; v: React.ReactNode; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px', padding: '4px 0', borderTop: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-3)' }}>{k}</span>
      <strong style={{ color: warn ? '#8A5A12' : 'var(--text)', textAlign: 'right' }}>{v}</strong>
    </div>
  )
}

const kicker: React.CSSProperties = { fontSize: '11px', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--accent-text)' }
const big: React.CSSProperties = { fontFamily: 'var(--font-fraunces), serif', fontSize: '34px', color: 'var(--text)', lineHeight: 1 }
const card: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', borderRadius: '18px', border: '1px solid var(--border)', background: 'var(--surface)', minWidth: 0 }
const h2: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: '21px', color: 'var(--text)' }
const muted: React.CSSProperties = { margin: 0, fontSize: '14px', color: 'var(--text-2)' }
const notice: React.CSSProperties = { padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(183,121,31,0.35)', background: 'rgba(255,213,107,0.12)', color: 'var(--text)', fontSize: '14px', lineHeight: 1.55 }
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '560px' }
const th: React.CSSProperties = { padding: '8px 10px', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }
const td: React.CSSProperties = { padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text)' }
const tdNum: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }
const barBg: React.CSSProperties = { height: '8px', borderRadius: '999px', background: 'var(--border)', overflow: 'hidden' }
const barFill: React.CSSProperties = { height: '100%', borderRadius: '999px', background: 'var(--accent-text)' }
