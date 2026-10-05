import {
  Handshake, CursorClick, Users, Files, CurrencyEur, ChartLineUp, Compass, Lightbulb, Receipt, Info,
} from '@phosphor-icons/react/dist/ssr'
import { fmtInt, shortDate } from '@/lib/visibility/admin-rules'
import { euros, type PartnersData, type PartnerItem } from '@/lib/visibility/partners'
import type { ConversionStatus } from '@/lib/affiliation/affilae-parse'
import { AMBER, BROWN, tint } from '../_ui/theme'
import { v, PctDelta, PlacePill, badge, ACCENT } from './ui'
import TrendChart from './TrendChart'

// Onglet « Partenaires » de la page Visibilité (05/10/2026, demande de Jason) :
// les clics vers les liens affiliés du site, les pages qui les envoient et
// leur place dans Google, d'où viennent ceux qui cliquent, les pages à
// améliorer, et les ventes suivies par Affilae. Un clic n'est pas une vente.

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const STATUS_LABEL: Record<ConversionStatus, string> = { en_attente: 'En attente', validee: 'Validée', refusee: 'Refusée', payee: 'Payée' }
const plural = (n: number, one: string, many = `${one}s`) => `${fmtInt(n)} ${n > 1 ? many : one}`
const pctText = (p: number | null) => (p === null ? '–' : `${String(p).replace('.', ',')} %`)

function bucketLabel(key: string, g: PartnersData['granularity']): string {
  if (g === 'day') return shortDate(key)
  if (g === 'week') return `sem. du ${shortDate(key)}`
  return `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`
}

export default function PartenairesTab({ d, clicksOk, clicksError }: { d: PartnersData; clicksOk: boolean; clicksError?: string }) {
  const af = d.affilae
  const afTotals = af?.state === 'ok' ? af.summary.totals : null
  const earned = afTotals ? afTotals.byStatus.validee + afTotals.byStatus.payee : 0
  const active = d.partners.filter(p => p.clicks > 0 || p.prevClicks > 0 || (p.sales && p.sales.conversions > 0))
  const idle = d.partners.filter(p => !active.includes(p))

  return (
    <>
      {!clicksOk && (
        <p style={note}><Info size={15} weight="bold" color={AMBER} style={{ flexShrink: 0, marginTop: 2 }} /> Les clics vers les partenaires n&apos;ont pas pu être lus : {clicksError}</p>
      )}

      <div style={grid4}>
        <Stat icon={<CursorClick size={18} weight="bold" />} label="Clics vers les partenaires" value={fmtInt(d.clicks)}
          delta={<PctDelta pct={d.clicksPct} suffix="vs période d'avant" />} sub={`${fmtInt(d.prevClicks)} sur la période d'avant`} />
        <Stat icon={<Users size={18} weight="bold" />} label="Visiteurs qui ont cliqué" value={fmtInt(d.clickers)}
          sub={d.clickRatePct === null ? 'Visites du site indisponibles' : `soit ${pctText(d.clickRatePct)} des ${fmtInt(d.siteVisitors)} visiteurs du site`} />
        <Stat icon={<Files size={18} weight="bold" />} label="Pages qui envoient des clics" value={fmtInt(d.pages.length)}
          sub={d.pages[0] ? `la première : ${d.pages[0].label}` : 'aucune sur la période'} />
        <Stat icon={<CurrencyEur size={18} weight="bold" />} label="Ventes suivies par Affilae" value={afTotals ? fmtInt(afTotals.conversions) : '–'}
          sub={afTotals ? `${euros(earned)} validés ou payés, ${euros(afTotals.byStatus.en_attente)} en attente (depuis le début)` : af?.state === 'erreur' ? af.message : af?.state === 'absent' ? 'Clé AFFILAE_API_KEY absente' : 'Affilae indisponible'} />
      </div>

      <section style={v.card}>
        <header style={v.head}>
          <span style={v.icon}><ChartLineUp size={18} weight="bold" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={v.title}>Clics vers les partenaires, par {d.granularity === 'day' ? 'jour' : d.granularity === 'week' ? 'semaine' : 'mois'}</h2>
            <p style={v.sub}>Chaque clic sur un lien affilié du site (lien marqué « sponsorisé »), comparé à la période d&apos;avant</p>
          </div>
        </header>
        <TrendChart points={d.series.map(p => ({ key: p.key, label: bucketLabel(p.key, d.granularity), value: p.clicks, prev: p.prev }))} unit="clic" height={180} />
      </section>

      <section style={v.card}>
        <header style={v.head}>
          <span style={v.icon}><Handshake size={18} weight="bold" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={v.title}>Partenaire par partenaire</h2>
            <p style={v.sub}>Clics de la période, pages qui les envoient, d&apos;où viennent ceux qui cliquent et ce que rapporte un client</p>
          </div>
        </header>
        {active.length === 0 ? <p style={v.empty}>Aucun clic vers un partenaire sur la période.</p> : (
          <div style={cardsGrid}>{active.map(p => <PartnerCard key={p.slug} p={p} />)}</div>
        )}
        {idle.length > 0 && (
          <p style={v.sub}>Sans clic sur la période : {idle.map(p => p.name).join(', ')}.</p>
        )}
      </section>

      <div style={v.grid2}>
        <section style={v.card}>
          <header style={{ ...v.head, alignItems: 'flex-start' }}>
            <span style={v.icon}><Files size={18} weight="bold" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={v.title}>Les pages qui envoient des clics</h2>
              <p style={{ ...v.sub, marginTop: 2 }}>Taux = visiteurs de la page qui ont cliqué un lien partenaire. Pastille = place moyenne de la page dans Google.</p>
            </div>
          </header>
          {d.pages.length === 0 ? <p style={v.empty}>Aucune page n&apos;a envoyé de clic sur la période.</p> : (
            <ol style={list}>
              {d.pages.slice(0, 15).map(pg => (
                <li key={pg.path} style={row}>
                  <PlacePill place={pg.place} size="sm" />
                  <span style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <a href={`https://jasonmarinho.com${pg.path}`} target="_blank" rel="noopener noreferrer" style={rowTitle}>{pg.label}</a>
                    <span style={rowSub}>{pg.partners.map(x => `${x.name} ${fmtInt(x.clicks)}`).join(' · ')}</span>
                  </span>
                  <span style={nums}>
                    <Num label="clics" value={fmtInt(pg.clicks)} strong />
                    <Num label="visiteurs" value={fmtInt(pg.visitors)} />
                    <Num label="taux" value={pctText(pg.ratePct)} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section style={v.card}>
          <header style={{ ...v.head, alignItems: 'flex-start' }}>
            <span style={{ ...v.icon, background: tint(AMBER, 13), color: AMBER }}><Lightbulb size={18} weight="bold" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={v.title}>Pages à mieux exploiter</h2>
              <p style={{ ...v.sub, marginTop: 2 }}>Pages avis, prix, partenaires et comparatifs vues dans Google ou visitées, mais qui envoient peu de clics : un encadré plus haut, un code promo ou un bouton plus visible peut suffire.</p>
            </div>
          </header>
          {d.opportunities.length === 0 ? <p style={v.empty}>Rien à signaler : les pages partenaires vues envoient déjà des clics.</p> : (
            <ol style={list}>
              {d.opportunities.map(o => (
                <li key={o.path} style={row}>
                  <PlacePill place={o.place} size="sm" />
                  <span style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <a href={`https://jasonmarinho.com${o.path}`} target="_blank" rel="noopener noreferrer" style={rowTitle}>{o.label}</a>
                    <span style={rowSub}>{fmtInt(o.impressions)} affichages Google</span>
                  </span>
                  <span style={nums}>
                    <Num label="visiteurs" value={fmtInt(o.visitors)} />
                    <Num label="clics" value={fmtInt(o.clicks)} strong />
                    <Num label="taux" value={pctText(o.ratePct)} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div style={v.grid2}>
        <section style={v.card}>
          <header style={v.head}>
            <span style={v.icon}><Compass size={18} weight="bold" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={v.title}>D&apos;où viennent ceux qui cliquent</h2>
              <p style={v.sub}>Provenance de leur première page vue sur le site</p>
            </div>
          </header>
          {d.sources.length === 0 ? <p style={v.empty}>Pas encore de clic rattaché à une visite.</p> : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {d.sources.map(s => (
                <li key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}>
                    <span style={{ color: 'var(--text-2)', minWidth: 0 }}>{s.label}</span>
                    <span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      <strong style={{ color: 'var(--text)' }}>{s.pct} %</strong>
                      <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{fmtInt(s.count)}</span>
                    </span>
                  </span>
                  <span style={{ display: 'block', height: 8, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.max(2, s.pct)}%`, borderRadius: 99, background: ACCENT }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={v.card}>
          <header style={v.head}>
            <span style={{ ...v.icon, background: tint(BROWN, 13), color: BROWN }}><Receipt size={18} weight="bold" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={v.title}>Dernières ventes suivies par Affilae</h2>
              <p style={v.sub}>Indy, LegalPlace et Tiime. Lodgify, Hospitable et Shine : ventes dans leur propre tableau de bord.</p>
            </div>
          </header>
          {af?.state !== 'ok' ? (
            <p style={v.empty}>{af?.state === 'erreur' ? af.message : af?.state === 'absent' ? 'Clé Affilae absente (AFFILAE_API_KEY dans Vercel).' : 'Affilae indisponible pour le moment.'}</p>
          ) : af.summary.recent.length === 0 ? (
            <p style={v.empty}>Aucune vente pour l&apos;instant. Les clics d&apos;Affilae : {afTotals?.clicks === null || afTotals?.clicks === undefined ? '–' : fmtInt(afTotals.clicks)}.</p>
          ) : (
            <ol style={list}>
              {af.summary.recent.map((c, i) => (
                <li key={i} style={row}>
                  <span style={{ flex: '1 1 160px', minWidth: 0 }}>
                    <span style={rowTitle}>{c.program}</span>
                    <span style={rowSub}>{c.date ? new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' }) : 'Date inconnue'}</span>
                  </span>
                  <span style={badge(c.status === 'refusee' ? AMBER : c.status === 'en_attente' ? BROWN : ACCENT)}>{STATUS_LABEL[c.status]}</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums', fontSize: 14, color: 'var(--text)' }}>{euros(c.commissionCents)}</strong>
                </li>
              ))}
            </ol>
          )}
          {af?.state === 'ok' && af.missing.length > 0 && <p style={v.sub}>Réponse partielle d&apos;Affilae ({af.missing.join(', ')} manquants) : réessaie dans quelques minutes.</p>}
        </section>
      </div>

      <p style={{ display: 'flex', gap: 6, fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.55 }}>
        <Info size={13} weight="bold" style={{ flexShrink: 0, marginTop: 3 }} />
        Un clic n&apos;est pas une vente : le partenaire ne paie que pour un client qui s&apos;inscrit ou s&apos;abonne. Tout nouveau lien affilié est suivi automatiquement s&apos;il porte bien rel=&quot;sponsored&quot;. Rémunérations : relevés de septembre et octobre 2026, à revérifier dans chaque programme.
      </p>
    </>
  )
}

function PartnerCard({ p }: { p: PartnerItem }) {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 18px', borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', minWidth: 0 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, fontSize: 18, color: 'var(--text)', flex: 1, minWidth: 0 }}>{p.name}</strong>
        <span style={badge(p.affilae ? BROWN : ACCENT)}>{p.affilae ? 'Affilae' : 'Lien direct'}</span>
      </header>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 30, color: 'var(--text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{fmtInt(p.clicks)}</strong>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>clic{p.clicks > 1 ? 's' : ''}</span>
        <PctDelta pct={p.clicksPct} />
      </div>
      <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{plural(p.clickers, 'visiteur')} · {fmtInt(p.prevClicks)} sur la période d&apos;avant</span>

      {p.pages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={v.colHead}>Pages qui envoient</span>
          {p.pages.slice(0, 3).map(pg => (
            <span key={pg.path} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--text-2)', minWidth: 0, overflowWrap: 'anywhere' }}>{pg.label}</span>
              <strong style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmtInt(pg.clicks)}</strong>
            </span>
          ))}
        </div>
      )}

      {p.sources.length > 0 && (
        <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
          <strong style={{ color: 'var(--text)' }}>Ils arrivent de :</strong> {p.sources.slice(0, 3).map(s => `${s.label.replace(/^Trouvé sur /, '').replace(/^Depuis /, '')} (${s.count})`).join(', ')}
        </span>
      )}

      {p.sales && p.sales.conversions > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={badge(ACCENT)}>{plural(p.sales.conversions, 'vente')}</span>
          {p.sales.byStatus.validee + p.sales.byStatus.payee > 0 && <span style={badge(ACCENT)}>{euros(p.sales.byStatus.validee + p.sales.byStatus.payee)} gagnés</span>}
          {p.sales.byStatus.en_attente > 0 && <span style={badge(BROWN)}>{euros(p.sales.byStatus.en_attente)} en attente</span>}
        </div>
      )}

      {p.reward && <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}><strong style={{ color: 'var(--text-2)' }}>Un client rapporte :</strong> {p.reward}. Ventes : {p.salesWhere}.</span>}
    </article>
  )
}

function Stat({ icon, label, value, delta, sub }: { icon: React.ReactNode; label: string; value: string; delta?: React.ReactNode; sub: string }) {
  return (
    <div style={{ ...v.card, gap: 10 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ ...v.icon, width: 32, height: 32, borderRadius: 10 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', lineHeight: 1.3 }}>{label}</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 34, color: 'var(--text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
        {delta}
      </span>
      <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5, overflowWrap: 'anywhere' }}>{sub}</span>
    </div>
  )
}

function Num({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 52 }}>
      <span style={{ fontSize: 14, fontWeight: strong ? 700 : 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
    </span>
  )
}

const grid4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 16 }
const cardsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 12 }
const list: React.CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' }
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '11px 2px', borderBottom: '1px solid var(--border)' }
const rowTitle: React.CSSProperties = { display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', overflowWrap: 'anywhere' }
const rowSub: React.CSSProperties = { display: 'block', fontSize: 12, color: 'var(--text-3)', overflowWrap: 'anywhere' }
const nums: React.CSSProperties = { display: 'flex', gap: 14, flexShrink: 0, marginLeft: 'auto' }
const note: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'flex-start', margin: 0, padding: '12px 14px', borderRadius: 12, background: tint(AMBER, 8), border: `1px solid ${tint(AMBER, 26)}`, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }
