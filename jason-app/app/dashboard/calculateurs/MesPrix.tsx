'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { CurrencyEur, House, Sun, Snowflake, TrendUp, CheckCircle, Warning, FloppyDisk, ArrowsClockwise, ChartBar } from '@phosphor-icons/react/dist/ssr'
import type { LogementPrefill } from '@/lib/lcd/dashboard-prefill'
import { updateLogementPricing } from '../logements/actions'
import { findMarketBenchmark } from '@/lib/lcd/market-benchmarks'

// Commissions moyennes appliquées aux plateformes (côté hôte).
// Airbnb = split fee 3-5 % hôte, on prend 5 %. Booking = 15-18 % hôte,
// on prend 17 % (médiane FR). Direct = 0 % (mais le voyageur paie net,
// donc affiché tel quel sans rabais).
const COMMISSIONS = {
  airbnb: 0.05,
  booking: 0.17,
  direct: 0,
} as const

interface Props {
  logements: LogementPrefill[]
}

type DraftPrices = {
  prix_airbnb_nuit: string
  prix_booking_nuit: string
  prix_direct_nuit: string
  prix_saison_basse_pct: string
  prix_saison_haute_pct: string
}

function emptyDraft(l: LogementPrefill): DraftPrices {
  return {
    prix_airbnb_nuit: l.prixAirbnb?.toString() ?? '',
    prix_booking_nuit: l.prixBooking?.toString() ?? '',
    prix_direct_nuit: l.prixDirect?.toString() ?? '',
    prix_saison_basse_pct: (l.saisonBassePct ?? 70).toString(),
    prix_saison_haute_pct: (l.saisonHautePct ?? 140).toString(),
  }
}

export default function MesPrix({ logements }: Props) {
  // Logement actif si on arrive avec ?logement={id} dans l'URL (deep link
  // depuis la page Mes Logements).
  const [activeId, setActiveId] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    const id = p.get('logement')
    if (id && logements.find(l => l.id === id)) setActiveId(id)
  }, [logements])

  if (logements.length === 0) {
    return (
      <div style={s.empty}>
        <House size={32} weight="duotone" color="var(--accent-text)" />
        <h3 style={s.emptyH}>Pas encore de logement</h3>
        <p style={s.emptyP}>
          Ajoute ton premier logement pour définir une stratégie tarifaire
          (prix par plateforme + saisonnalité + comparaison marché local).
        </p>
        <a href="/dashboard/logements" style={s.emptyCta}>Ajouter mon premier logement →</a>
      </div>
    )
  }

  return (
    <div>
      <div style={s.intro}>
        <h2 style={s.introTitle}>
          <CurrencyEur size={22} weight="fill" color="var(--accent-text)" />
          Ta stratégie tarifaire <em style={s.introEm}>par logement</em>
        </h2>
        <p style={s.introDesc}>
          Définis ton prix de base pour chaque plateforme. On calcule en temps
          réel ton <strong>revenu net après commissions</strong>, tes prix
          basse / haute saison et la comparaison avec le marché local.
        </p>
      </div>

      <div style={s.cards}>
        {logements.map(l => (
          <LogementPricingCard
            key={l.id}
            logement={l}
            startsOpen={activeId === l.id || logements.length === 1}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Carte par logement
// ─────────────────────────────────────────────────────────────────────
function LogementPricingCard({ logement, startsOpen }: { logement: LogementPrefill; startsOpen: boolean }) {
  const [open, setOpen] = useState(startsOpen)
  const [draft, setDraft] = useState<DraftPrices>(emptyDraft(logement))
  const [savedSnapshot, setSavedSnapshot] = useState<DraftPrices>(emptyDraft(logement))
  const [saving, startSaving] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  const isDirty = useMemo(() =>
    JSON.stringify(draft) !== JSON.stringify(savedSnapshot)
  , [draft, savedSnapshot])

  const hasAnyPrice = !!(draft.prix_airbnb_nuit || draft.prix_booking_nuit || draft.prix_direct_nuit)
  const hasConfigured = !!(logement.prixAirbnb || logement.prixBooking || logement.prixDirect)

  function reset() {
    setDraft(emptyDraft(logement))
    setSavedSnapshot(emptyDraft(logement))
    setFeedback(null)
  }

  function handleSave() {
    setFeedback(null)
    startSaving(async () => {
      const payload = {
        prix_airbnb_nuit: draft.prix_airbnb_nuit ? Number(draft.prix_airbnb_nuit) : null,
        prix_booking_nuit: draft.prix_booking_nuit ? Number(draft.prix_booking_nuit) : null,
        prix_direct_nuit: draft.prix_direct_nuit ? Number(draft.prix_direct_nuit) : null,
        prix_saison_basse_pct: draft.prix_saison_basse_pct ? Number(draft.prix_saison_basse_pct) : null,
        prix_saison_haute_pct: draft.prix_saison_haute_pct ? Number(draft.prix_saison_haute_pct) : null,
      }
      const res = await updateLogementPricing(logement.id, payload)
      if (res.error) {
        setFeedback({ kind: 'err', msg: res.error })
      } else {
        setSavedSnapshot(draft)
        setFeedback({ kind: 'ok', msg: 'Stratégie tarifaire enregistrée.' })
      }
    })
  }

  return (
    <div style={s.card}>
      {/* Header card cliquable pour ouvrir/fermer */}
      <button onClick={() => setOpen(o => !o)} style={s.cardHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={s.cardIco}>
            <House size={18} weight="duotone" />
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={s.cardTitle}>{logement.nom}</div>
            <div style={s.cardMeta}>
              {logement.ville ?? 'Ville inconnue'}
              {logement.nbChambres ? ` · ${logement.nbChambres} ch.` : ''}
              {logement.typeLogement ? ` · ${logement.typeLogement}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {hasConfigured
            ? <span style={s.badgeOk}><CheckCircle size={11} weight="fill" /> Configuré</span>
            : <span style={s.badgeWarn}><Warning size={11} weight="fill" /> À configurer</span>}
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
            {open ? '−' : '+'}
          </span>
        </div>
      </button>

      {/* Corps dépliable */}
      {open && (
        <div style={s.cardBody}>
          {/* Bloc 1 : Prix de base par plateforme */}
          <section style={s.section}>
            <h4 style={s.sectionH}>Prix de base par plateforme (en saison moyenne)</h4>
            <p style={s.sectionP}>
              Ce que voit le voyageur. La commission s'applique ensuite
              différemment selon la plateforme.
            </p>
            <div style={s.priceGrid}>
              <PriceInput
                label="Airbnb"
                color="#FF5A5F"
                value={draft.prix_airbnb_nuit}
                onChange={v => setDraft(d => ({ ...d, prix_airbnb_nuit: v }))}
                hint={draft.prix_airbnb_nuit ? `Tu touches ${fmtEur(Number(draft.prix_airbnb_nuit) * (1 - COMMISSIONS.airbnb))} net (-5%)` : 'Commission hôte ~5%'}
              />
              <PriceInput
                label="Booking"
                color="#003B95"
                value={draft.prix_booking_nuit}
                onChange={v => setDraft(d => ({ ...d, prix_booking_nuit: v }))}
                hint={draft.prix_booking_nuit ? `Tu touches ${fmtEur(Number(draft.prix_booking_nuit) * (1 - COMMISSIONS.booking))} net (-17%)` : 'Commission hôte ~17%'}
              />
              <PriceInput
                label="Direct / Driing"
                color="#63D683"
                value={draft.prix_direct_nuit}
                onChange={v => setDraft(d => ({ ...d, prix_direct_nuit: v }))}
                hint={draft.prix_direct_nuit ? `Tu touches ${fmtEur(Number(draft.prix_direct_nuit))} net (0%)` : 'Sans commission'}
              />
            </div>
          </section>

          {/* Bloc 2 : Multiplicateurs saison */}
          <section style={s.section}>
            <h4 style={s.sectionH}>Saisonnalité</h4>
            <p style={s.sectionP}>
              Modulateurs appliqués au prix de base ci-dessus pour les
              périodes hors saison moyenne.
            </p>
            <div style={s.seasonGrid}>
              <div style={s.seasonInput}>
                <label style={s.seasonLabel}>
                  <Snowflake size={13} weight="fill" color="#60a5fa" />
                  Saison basse
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={30} max={200} step={5}
                    value={draft.prix_saison_basse_pct}
                    onChange={e => setDraft(d => ({ ...d, prix_saison_basse_pct: e.target.value }))}
                    style={s.numInput}
                  />
                  <span style={s.pctSign}>%</span>
                </div>
                <div style={s.seasonHint}>Défaut 70 = −30 % du prix base</div>
              </div>
              <div style={s.seasonInput}>
                <label style={s.seasonLabel}>
                  <Sun size={13} weight="fill" color="#fbbf24" />
                  Saison haute
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={100} max={300} step={5}
                    value={draft.prix_saison_haute_pct}
                    onChange={e => setDraft(d => ({ ...d, prix_saison_haute_pct: e.target.value }))}
                    style={s.numInput}
                  />
                  <span style={s.pctSign}>%</span>
                </div>
                <div style={s.seasonHint}>Défaut 140 = +40 % du prix base</div>
              </div>
            </div>
          </section>

          {/* Bloc 3 : Matrice prix recommandés (3 saisons × 3 plateformes) */}
          {hasAnyPrice && (
            <section style={s.section}>
              <h4 style={s.sectionH}>Ta grille tarifaire</h4>
              <p style={s.sectionP}>
                Les prix à appliquer selon la période. Net = ce que tu touches
                après commission plateforme.
              </p>
              <PricingMatrix draft={draft} />
            </section>
          )}

          {/* Comparaison live : prix saisi vs marché local + ADR réel */}
          {hasAnyPrice && (
            <MarketComparison logement={logement} draft={draft} />
          )}

          {/* Feedback save */}
          {feedback && (
            <div style={feedback.kind === 'ok' ? s.feedbackOk : s.feedbackErr}>
              {feedback.kind === 'ok' ? <CheckCircle size={13} weight="fill" /> : <Warning size={13} weight="fill" />}
              {feedback.msg}
            </div>
          )}

          {/* Actions */}
          <div style={s.actions}>
            {isDirty && (
              <button onClick={reset} disabled={saving} style={s.btnGhost}>
                <ArrowsClockwise size={13} weight="bold" /> Annuler
              </button>
            )}
            <button onClick={handleSave} disabled={saving || !isDirty} style={s.btnPrimary}>
              <FloppyDisk size={13} weight="fill" />
              {saving ? 'Enregistrement…' : isDirty ? 'Enregistrer' : 'Sauvegardé'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Inputs et sous-composants
// ─────────────────────────────────────────────────────────────────────
function PriceInput({ label, color, value, onChange, hint }: { label: string; color: string; value: string; onChange: (v: string) => void; hint: string }) {
  return (
    <div style={{ ...s.priceField, borderColor: value ? color + '55' : 'var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ ...s.priceDot, background: color }} />
        <span style={s.priceLabel}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          type="number"
          min={0} max={10000} step={1}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="—"
          style={s.priceInput}
        />
        <span style={s.priceEur}>€</span>
      </div>
      <div style={s.priceHint}>{hint}</div>
    </div>
  )
}

function PricingMatrix({ draft }: { draft: DraftPrices }) {
  const basePct = 100
  const lowPct = Number(draft.prix_saison_basse_pct) || 70
  const highPct = Number(draft.prix_saison_haute_pct) || 140

  const rows = [
    { label: 'Basse saison', pct: lowPct, icon: <Snowflake size={12} weight="fill" color="#60a5fa" /> },
    { label: 'Saison moyenne', pct: basePct, icon: null },
    { label: 'Haute saison', pct: highPct, icon: <Sun size={12} weight="fill" color="#fbbf24" /> },
  ]

  const platforms = [
    { key: 'airbnb' as const, label: 'Airbnb', color: '#FF5A5F', base: Number(draft.prix_airbnb_nuit) || 0, commission: COMMISSIONS.airbnb },
    { key: 'booking' as const, label: 'Booking', color: '#003B95', base: Number(draft.prix_booking_nuit) || 0, commission: COMMISSIONS.booking },
    { key: 'direct' as const, label: 'Direct', color: '#63D683', base: Number(draft.prix_direct_nuit) || 0, commission: COMMISSIONS.direct },
  ]

  return (
    <div style={s.matrixWrap}>
      <table style={s.matrix}>
        <thead>
          <tr>
            <th style={s.matrixHeadCell}></th>
            {platforms.map(p => (
              <th key={p.key} style={{ ...s.matrixHeadCell, color: p.color }}>{p.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label}>
              <td style={s.matrixRowLabel}>
                {r.icon}
                <span>{r.label}</span>
              </td>
              {platforms.map(p => {
                const prix = p.base * (r.pct / 100)
                const net = prix * (1 - p.commission)
                if (!p.base) return <td key={p.key} style={s.matrixCellEmpty}>—</td>
                return (
                  <td key={p.key} style={s.matrixCell}>
                    <div style={{ ...s.matrixPrice, color: p.color }}>{fmtEur(prix)}</div>
                    <div style={s.matrixNet}>net {fmtEur(net)}</div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Comparaison vs marché ville (sourcée) + ADR réel observé
// ─────────────────────────────────────────────────────────────────────
function MarketComparison({ logement, draft }: { logement: LogementPrefill; draft: DraftPrices }) {
  const bench = findMarketBenchmark(logement.ville, logement.pays)
  const adrReel = logement.stats?.adrReel ?? 0
  // Prix de base "représentatif" du hôte : on prend le max des 3 plateformes
  // saisies (Airbnb a souvent le prix le plus visible voyageur, mais on
  // veut comparer le HAUT de gamme tarifaire si Airbnb est vide).
  const userBase = Math.max(
    Number(draft.prix_airbnb_nuit) || 0,
    Number(draft.prix_booking_nuit) || 0,
    Number(draft.prix_direct_nuit) || 0,
  )
  if (userBase === 0) return null

  // 3 comparaisons : vs marché ville (si dispo) + vs ADR réel observé
  // Le bench peut être null si la ville n'est pas dans nos 83 sourcées —
  // dans ce cas on affiche juste le bench pays via le retour de
  // findMarketBenchmark qui fallback déjà.
  const benchAdr = bench?.adrEur ?? 0
  const benchDiff = benchAdr > 0 ? Math.round(((userBase - benchAdr) / benchAdr) * 100) : null
  const reelDiff = adrReel > 0 ? Math.round(((userBase - adrReel) / adrReel) * 100) : null

  function diffLabel(diff: number | null): { text: string; color: string } {
    if (diff === null) return { text: '—', color: 'var(--text-muted)' }
    if (Math.abs(diff) < 5) return { text: 'Dans la moyenne', color: 'var(--success-1)' }
    if (diff > 0) return {
      text: `+${diff}% au-dessus`,
      color: diff > 30 ? 'var(--danger)' : '#d97706',
    }
    return {
      text: `${diff}% en dessous`,
      color: diff < -30 ? 'var(--danger)' : '#d97706',
    }
  }

  function reco(diff: number | null): string {
    if (diff === null) return ''
    if (Math.abs(diff) < 5) return 'Position optimale, tu es bien dans le marché.'
    if (diff >= 30) return 'Risque de perdre des réservations face à la concurrence. Envisage de baisser ou de mieux justifier (qualité photo, équipements premium).'
    if (diff > 5) return 'Léger surplus assumable si ton offre est mieux positionnée (équipements, déco, avis).'
    if (diff <= -30) return 'Tu laisses de l\'argent sur la table. Teste +10 à 15 % et observe le taux de réservation.'
    return 'Marge de progression possible, teste +5 à 10 % progressivement.'
  }

  const benchInfo = diffLabel(benchDiff)
  const reelInfo = diffLabel(reelDiff)
  const recoText = reco(benchDiff ?? reelDiff)

  return (
    <section style={s.section}>
      <h4 style={s.sectionH}>
        <ChartBar size={15} weight="fill" color="var(--success-1)" /> Comparaison marché
      </h4>
      <p style={s.sectionP}>
        Confronte ton prix de base au marché local et à tes performances
        passées pour ajuster sereinement.
      </p>
      <div style={s.compareGrid}>
        {bench && (
          <div style={s.compareCard}>
            <div style={s.compareLabel}>Marché {bench.ville} ({bench.pays})</div>
            <div style={s.compareValue}>{fmtEur(benchAdr)}</div>
            <div style={{ ...s.compareDiff, color: benchInfo.color }}>{benchInfo.text}</div>
            <div style={s.compareSource}>Source : {bench.source}</div>
          </div>
        )}
        {!bench && (
          <div style={s.compareCard}>
            <div style={s.compareLabel}>Marché ville</div>
            <div style={s.compareValue} title="Aucun benchmark précis pour cette ville">—</div>
            <div style={s.compareSource}>Ville hors des 83 sourcées</div>
          </div>
        )}
        {adrReel > 0 ? (
          <div style={s.compareCard}>
            <div style={s.compareLabel}>Ton ADR réel observé</div>
            <div style={s.compareValue}>{fmtEur(adrReel)}</div>
            <div style={{ ...s.compareDiff, color: reelInfo.color }}>{reelInfo.text}</div>
            <div style={s.compareSource}>{logement.stats?.nbSejours ?? 0} séjours passés</div>
          </div>
        ) : (
          <div style={s.compareCard}>
            <div style={s.compareLabel}>Ton ADR réel observé</div>
            <div style={s.compareValue}>—</div>
            <div style={s.compareSource}>Pas encore de séjour facturé</div>
          </div>
        )}
        <div style={s.compareCard}>
          <div style={s.compareLabel}>Ton prix de base saisi</div>
          <div style={{ ...s.compareValue, color: 'var(--accent-text)' }}>{fmtEur(userBase)}</div>
          <div style={s.compareSource}>Max des 3 plateformes</div>
        </div>
      </div>
      {recoText && (
        <div style={s.recoBox}>
          <Warning size={13} weight="fill" />
          <span>{recoText}</span>
        </div>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────
function fmtEur(n: number): string {
  if (!isFinite(n)) return '—'
  return Math.round(n) + ' €'
}

const s: Record<string, React.CSSProperties> = {
  intro: { marginBottom: '24px' },
  introTitle: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(20px, 2.4vw, 26px)', fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' },
  introEm: { color: 'var(--accent-text)', fontStyle: 'italic', fontWeight: 300 },
  introDesc: { fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: 1.7, margin: '10px 0 0', maxWidth: '720px' },

  cards: { display: 'flex', flexDirection: 'column' as const, gap: '14px' },

  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' as const },
  cardHead: { display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit' },
  cardIco: { width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-bg)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const },
  cardMeta: { fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' },
  badgeOk: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '999px', background: 'rgba(16,185,129,0.12)', color: 'var(--success-1)', fontSize: '11px', fontWeight: 600 },
  badgeWarn: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '999px', background: 'rgba(217,119,6,0.12)', color: '#d97706', fontSize: '11px', fontWeight: 600 },

  cardBody: { padding: '18px 20px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' as const, gap: '22px' },

  section: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  sectionH: { fontSize: '13px', fontWeight: 700, color: 'var(--text)', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' },
  sectionP: { fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 },

  priceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' },
  priceField: { padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column' as const, gap: '8px', transition: 'border-color 0.18s' },
  priceDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  priceLabel: { fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
  priceInput: { flex: 1, padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, width: '100%' },
  priceEur: { fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 },
  priceHint: { fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 },

  seasonGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
  seasonInput: { padding: '14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  seasonLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' },
  numInput: { flex: 1, padding: '7px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13.5px', fontWeight: 600, fontFamily: 'inherit', width: '80px' },
  pctSign: { fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 },
  seasonHint: { fontSize: '11px', color: 'var(--text-muted)' },

  compareGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' },
  compareCard: { padding: '14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  compareLabel: { fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.4px' },
  compareValue: { fontSize: '22px', fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1.1 },
  compareDiff: { fontSize: '12px', fontWeight: 600, marginTop: '2px' },
  compareSource: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  recoBox: { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '10px', fontSize: '13px', color: '#d97706', lineHeight: 1.55, fontWeight: 500 },

  matrixWrap: { overflowX: 'auto' as const },
  matrix: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  matrixHeadCell: { padding: '8px 12px', textAlign: 'left' as const, fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' },
  matrixRowLabel: { padding: '12px', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-2)', borderBottom: '1px solid var(--border)', display: 'flex' as const, alignItems: 'center' as const, gap: '6px' },
  matrixCell: { padding: '12px', textAlign: 'left' as const, borderBottom: '1px solid var(--border)' },
  matrixCellEmpty: { padding: '12px', textAlign: 'left' as const, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' },
  matrixPrice: { fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif' },
  matrixNet: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },

  feedbackOk: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--success-1)', fontSize: '13px', fontWeight: 500 },
  feedbackErr: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--danger)', fontSize: '13px', fontWeight: 500 },

  actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },

  empty: { padding: '40px 24px', textAlign: 'center' as const, background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '14px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px' },
  emptyH: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: '20px', color: 'var(--text)', margin: 0 },
  emptyP: { fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, maxWidth: '420px' },
  emptyCta: { marginTop: '8px', padding: '10px 18px', background: 'var(--accent-text)', color: 'var(--bg)', borderRadius: '10px', textDecoration: 'none', fontSize: '13.5px', fontWeight: 600 },
}
