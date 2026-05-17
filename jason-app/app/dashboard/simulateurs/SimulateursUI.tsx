'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Calculator, Scales, CurrencyEur, ChartLineUp, TrendUp, Storefront, Receipt, Percent } from '@phosphor-icons/react/dist/ssr'
import { citiesByCountry, estimateRevenue, calculatePrice, SUPPORTED_COUNTRIES, type MarketBenchmark } from '@/lib/lcd/market-benchmarks'
import type { AccountStats } from '@/lib/lcd/account-stats'
import { ActivityOverview } from '@/components/dashboard/ActivityOverview'
import { fmtEur, normalizeType, MiniBox, BenchmarkRow } from '@/components/simulateurs/_shared'

// Lazy-load des 5 simulateurs fiscaux : chacun dans son propre chunk JS.
// L'utilisateur ne télécharge que ce dont il a besoin selon l'onglet sélectionné.
// Loading skeleton générique compact pour ne pas avoir de saut visuel.
const TabLoader = () => (
  <div style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
    Chargement…
  </div>
)
const FiscalLCD     = dynamic(() => import('@/components/simulateurs/FiscalLCD'),     { loading: TabLoader, ssr: false })
const EIvsSASU      = dynamic(() => import('@/components/simulateurs/EIvsSASU'),      { loading: TabLoader, ssr: false })
const Rentabilite   = dynamic(() => import('@/components/simulateurs/Rentabilite'),   { loading: TabLoader, ssr: false })
const TaxeSejour    = dynamic(() => import('@/components/simulateurs/TaxeSejour'),    { loading: TabLoader, ssr: false })
const FranchiseTVA  = dynamic(() => import('@/components/simulateurs/FranchiseTVA'),  { loading: TabLoader, ssr: false })

type Pays = MarketBenchmark['pays']
import type { LogementPrefill } from './page'


interface Props {
  logementsPrefill?: LogementPrefill[]
  accountStats?: AccountStats
}

// Mapping type_logement DB → clé engine (engine attend studio/t1/t2/t3/maison)

/* ──────────────────────────────────────────
 * 5. ESTIMATEUR DE REVENUS LCD (préfilé)
 * ────────────────────────────────────────── */
const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const MONTHS_LONG = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export function EstimateurRevenus({ logements }: { logements: LogementPrefill[] }) {
  const [logementId, setLogementId] = useState<string>(logements[0]?.id ?? '__manual__')
  const selected = logements.find(l => l.id === logementId)

  const [pays, setPays] = useState<Pays>((selected?.pays as Pays) ?? 'FR')
  const [ville, setVille] = useState<string>(selected?.ville ?? '')
  const [typeLogement, setTypeLogement] = useState<string>(normalizeType(selected?.typeLogement))
  const [nbChambres, setNbChambres] = useState<number>(selected?.nbChambres ?? 2)
  const [mode, setMode] = useState<string>('toute-annee')
  const [useAdrReel, setUseAdrReel] = useState<boolean>(!!selected?.tarifNuitee)

  // Si l'utilisateur change de logement → on resync les champs
  useEffect(() => {
    if (!selected) return
    setPays(selected.pays as Pays)
    setVille(selected.ville ?? '')
    setTypeLogement(normalizeType(selected.typeLogement))
    setNbChambres(selected.nbChambres ?? 2)
    setUseAdrReel(!!selected.tarifNuitee)
  }, [selected])

  const cityOptions = useMemo(() => citiesByCountry(pays), [pays])
  const adrOverride = useAdrReel ? (selected?.tarifNuitee ?? null) : null

  const res = useMemo(() => estimateRevenue({
    pays, ville: ville || null, typeLogement, nbChambres, mode, adrOverride,
  }), [pays, ville, typeLogement, nbChambres, mode, adrOverride])

  const maxMonth = Math.max(...res.monthly.map(m => m.revenu))

  return (
    <div>
      <h2 style={s.sectionTitle}><TrendUp size={20} weight="fill" /> Estimateur de revenus annuels</h2>
      <p style={s.sectionDesc}>
        Combien peut rapporter ton bien (ou un bien que tu envisages d'acheter) selon ta ville, ton type de bien et ton mode d'exploitation.
        {logements.length > 0 && ' Préfilé avec tes logements.'}
      </p>

      <div style={s.grid2}>
        <div style={s.formCard}>
          {logements.length > 0 && (
            <div style={s.field}>
              <label style={s.label}>Logement</label>
              <select value={logementId} onChange={e => setLogementId(e.target.value)} style={s.input}>
                {logements.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nom} {l.ville ? `· ${l.ville}` : ''}
                  </option>
                ))}
                <option value="__manual__">— Saisie manuelle (autre bien) —</option>
              </select>
            </div>
          )}

          <div style={s.field}>
            <label style={s.label}>Pays</label>
            <select value={pays} onChange={e => setPays(e.target.value as Pays)} style={s.input}>
              {SUPPORTED_COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.label}</option>
              ))}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Ville</label>
            <select value={ville} onChange={e => setVille(e.target.value)} style={s.input}>
              <option value="">— Autre ville (moyenne pays) —</option>
              {cityOptions.map(c => <option key={c.ville} value={c.ville}>{c.ville}</option>)}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Type de bien</label>
            <select value={typeLogement} onChange={e => setTypeLogement(e.target.value)} style={s.input}>
              <option value="studio">Studio</option>
              <option value="t1">T1 / 1 chambre</option>
              <option value="t2">T2 / 2 pièces</option>
              <option value="t3">T3 / 3 pièces</option>
              <option value="maison">Maison entière</option>
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Nombre de chambres</label>
            <select value={nbChambres} onChange={e => setNbChambres(parseInt(e.target.value, 10))} style={s.input}>
              <option value={0}>Aucune (studio)</option>
              <option value={1}>1 chambre</option>
              <option value={2}>2 chambres</option>
              <option value={3}>3 chambres</option>
              <option value={4}>4+ chambres</option>
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Mode d'exploitation</label>
            <select value={mode} onChange={e => setMode(e.target.value)} style={s.input}>
              <option value="toute-annee">Toute l'année</option>
              <option value="saisonnier-ete">Saisonnier été (3 mois)</option>
              <option value="saisonnier-hiver">Saisonnier hiver (3 mois)</option>
              <option value="weekends">Weekends uniquement</option>
            </select>
          </div>

          {selected?.tarifNuitee && (
            <label className="jm-check">
              <input type="checkbox" checked={useAdrReel} onChange={e => setUseAdrReel(e.target.checked)} />
              <span>
                Utiliser mon <strong>tarif réel ({selected.tarifNuitee} €/nuit)</strong> au lieu de la moyenne marché
              </span>
            </label>
          )}
        </div>

        <div style={s.resultCard}>
          <div style={s.resultLabel}>Revenu annuel estimé pour {res.city}</div>
          <div style={s.resultBigVal}>{fmtEur(res.revenuAnnuel)}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
            Fourchette : <strong>{fmtEur(res.revenuLow)}</strong> → <strong>{fmtEur(res.revenuHigh)}</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '16px' }}>
            <MiniBox label="Occupation" value={`${res.occupation} %`} />
            <MiniBox label="ADR moyen" value={fmtEur(res.adr)} />
            <MiniBox label="RevPAR" value={fmtEur(res.revpar)} />
            <MiniBox label="Nuits/an" value={String(Math.round(365 * res.occupation / 100))} />
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Répartition mensuelle
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', alignItems: 'end', minHeight: '60px' }}>
              {res.monthly.map((m, i) => {
                const h = maxMonth > 0 ? Math.max(4, (m.revenu / maxMonth) * 50) : 4
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title={`${MONTHS_LONG[i]} : ${fmtEur(m.revenu)}`}>
                    <div style={{
                      width: '100%', height: `${h}px`,
                      background: m.isHigh
                        ? 'linear-gradient(180deg, var(--success-1) 0%, #2BA56A 100%)'
                        : 'linear-gradient(180deg, #FFD56B 0%, #FFC845 100%)',
                      borderRadius: '4px 4px 0 0',
                    }} />
                    <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{MONTHS_SHORT[i]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bloc 'Toi vs Marché' : si l'hôte a déjà des séjours réels sur
              ce logement, on compare son ADR/occupation réels à l'estimation
              marché. Très puissant pour valider que tes vraies perfs sont
              cohérentes (ou meilleures !) vs benchmark. */}
          {selected?.stats && selected.stats.nuitsLouees > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99,214,131,0.08) 0%, var(--bg-2) 100%)',
              border: '1px solid rgba(99,214,131,0.25)',
            }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                textTransform: 'uppercase' as const, color: 'var(--success-1)',
                marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <ChartLineUp size={12} weight="fill" /> Toi vs Marché ({selected.nom}, 12 derniers mois)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(110px, 100%), 1fr))', gap: '10px' }}>
                <BenchmarkRow
                  label="Occupation"
                  toi={`${selected.stats.occupationReelle} %`}
                  marche={`${res.occupation} %`}
                  toiNum={selected.stats.occupationReelle}
                  marcheNum={res.occupation}
                />
                <BenchmarkRow
                  label="ADR"
                  toi={fmtEur(selected.stats.adrReel)}
                  marche={fmtEur(res.adr)}
                  toiNum={selected.stats.adrReel}
                  marcheNum={res.adr}
                />
                <BenchmarkRow
                  label="Revenu (annualisé)"
                  toi={fmtEur(selected.stats.revenuTotal)}
                  marche={fmtEur(res.revenuAnnuel)}
                  toiNum={selected.stats.revenuTotal}
                  marcheNum={res.revenuAnnuel}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '10px', marginBottom: 0, lineHeight: 1.5 }}>
                {selected.stats.adrReel > res.adr * 1.1
                  ? `🎉 Ton ADR (${fmtEur(selected.stats.adrReel)}) dépasse le marché (${fmtEur(res.adr)}). Tu as un positionnement premium, vérifie que ton occupation suit.`
                  : selected.stats.occupationReelle < res.occupation - 8
                  ? `⚠ Ton occupation (${selected.stats.occupationReelle} %) est sous la moyenne marché (${res.occupation} %). Marge de remplissage possible.`
                  : `Tes performances sont alignées avec le marché. Pour gagner du potentiel : pricing dynamique, photos pro, classement.`}
              </p>
              <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0, fontStyle: 'italic' as const }}>
                Données réelles sur {selected.stats.nbSejours} séjour{selected.stats.nbSejours > 1 ? 's' : ''} encaissé{selected.stats.nbSejours > 1 ? 's' : ''} les 12 derniers mois.
              </p>
            </div>
          )}

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', marginBottom: 0, fontStyle: 'italic' as const, borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            Source : {res.source}. Estimation indicative (±20 %). Pas une garantie de revenus.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
 * 6. CALCULATEUR DE PRIX LCD (préfilé)
 * ────────────────────────────────────────── */
export function CalculateurPrix({ logements }: { logements: LogementPrefill[] }) {
  const [logementId, setLogementId] = useState<string>(logements[0]?.id ?? '__manual__')
  const selected = logements.find(l => l.id === logementId)

  const [pays, setPays] = useState<Pays>((selected?.pays as Pays) ?? 'FR')
  const [ville, setVille] = useState<string>(selected?.ville ?? '')
  const [typeLogement, setTypeLogement] = useState<string>(normalizeType(selected?.typeLogement))
  const [nbChambres, setNbChambres] = useState<number>(selected?.nbChambres ?? 2)
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [channel, setChannel] = useState<string>('mix')
  const [useAdrReel, setUseAdrReel] = useState<boolean>(!!selected?.tarifNuitee)

  useEffect(() => {
    if (!selected) return
    setPays(selected.pays as Pays)
    setVille(selected.ville ?? '')
    setTypeLogement(normalizeType(selected.typeLogement))
    setNbChambres(selected.nbChambres ?? 2)
    setUseAdrReel(!!selected.tarifNuitee)
  }, [selected])

  const cityOptions = useMemo(() => citiesByCountry(pays), [pays])
  const adrOverride = useAdrReel ? (selected?.tarifNuitee ?? null) : null

  const res = useMemo(() => calculatePrice({
    pays, ville: ville || null, typeLogement, nbChambres, month, channel, adrOverride,
  }), [pays, ville, typeLogement, nbChambres, month, channel, adrOverride])

  const diffPct = res.marketAdr > 0 ? Math.round(((res.adjustedAdr - res.marketAdr) / res.marketAdr) * 100) : 0
  const maxYearPrice = Math.max(...res.yearPricing.map(p => p.price))

  return (
    <div>
      <h2 style={s.sectionTitle}><CurrencyEur size={20} weight="fill" /> Calculateur de prix par nuit</h2>
      <p style={s.sectionDesc}>
        Combien afficher selon ta ville, le mois, le canal de réservation. Compensation auto des commissions Airbnb / Booking / direct.
      </p>

      <div style={s.grid2}>
        <div style={s.formCard}>
          {logements.length > 0 && (
            <div style={s.field}>
              <label style={s.label}>Logement</label>
              <select value={logementId} onChange={e => setLogementId(e.target.value)} style={s.input}>
                {logements.map(l => <option key={l.id} value={l.id}>{l.nom} {l.ville ? `· ${l.ville}` : ''}</option>)}
                <option value="__manual__">— Saisie manuelle —</option>
              </select>
            </div>
          )}

          <div style={s.field}>
            <label style={s.label}>Pays</label>
            <select value={pays} onChange={e => setPays(e.target.value as Pays)} style={s.input}>
              {SUPPORTED_COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.label}</option>
              ))}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Ville</label>
            <select value={ville} onChange={e => setVille(e.target.value)} style={s.input}>
              <option value="">— Autre ville (moyenne pays) —</option>
              {cityOptions.map(c => <option key={c.ville} value={c.ville}>{c.ville}</option>)}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Type de bien</label>
            <select value={typeLogement} onChange={e => setTypeLogement(e.target.value)} style={s.input}>
              <option value="studio">Studio</option>
              <option value="t1">T1</option>
              <option value="t2">T2</option>
              <option value="t3">T3</option>
              <option value="maison">Maison</option>
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Nombre de chambres</label>
            <select value={nbChambres} onChange={e => setNbChambres(parseInt(e.target.value, 10))} style={s.input}>
              <option value={0}>Aucune</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4+</option>
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Mois cible</label>
            <select value={month} onChange={e => setMonth(parseInt(e.target.value, 10))} style={s.input}>
              {MONTHS_LONG.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Canal de réservation</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', gap: '6px' }}>
              {[
                { v: 'airbnb',  l: 'Airbnb',     sub: '~3 % comm.' },
                { v: 'booking', l: 'Booking',    sub: '~15 % comm.' },
                { v: 'direct',  l: 'Direct',     sub: '0 % comm.' },
                { v: 'mix',     l: 'Mix tous',   sub: 'pondéré' },
              ].map(c => (
                <button key={c.v} type="button" onClick={() => setChannel(c.v)} style={{
                  padding: '10px', borderRadius: '8px', cursor: 'pointer',
                  border: '1px solid ' + (channel === c.v ? 'var(--accent-text)' : 'var(--border)'),
                  background: channel === c.v ? 'var(--accent-bg)' : 'var(--bg-2)',
                  color: channel === c.v ? 'var(--accent-text)' : 'var(--text-2)',
                  fontSize: '12.5px', fontWeight: channel === c.v ? 700 : 500,
                  fontFamily: 'inherit', textAlign: 'center' as const,
                }}>
                  {c.l}<br/><span style={{ fontSize: '10.5px', fontWeight: 400, opacity: 0.75 }}>{c.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {selected?.tarifNuitee && (
            <label className="jm-check">
              <input type="checkbox" checked={useAdrReel} onChange={e => setUseAdrReel(e.target.checked)} />
              <span>
                Utiliser mon <strong>tarif réel ({selected.tarifNuitee} €/nuit)</strong> au lieu de la moyenne marché
              </span>
            </label>
          )}
        </div>

        <div style={s.resultCard}>
          <div style={s.resultLabel}>Prix recommandé · {res.city} · {MONTHS_LONG[month - 1]}</div>
          <div style={s.resultBigVal}>{fmtEur(res.basePrice)} <span style={{ fontSize: '14px', color: 'var(--text-3)', fontWeight: 300 }}>/ nuit</span></div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>
            Fourchette : {fmtEur(res.minPrice)} → {fmtEur(res.maxPrice)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '16px' }}>
            <MiniBox label="Semaine (lun→jeu)" value={fmtEur(res.weekPrice)} sub="−8 % vs base" />
            <MiniBox label="Weekend (ven+sam)" value={fmtEur(res.weekendPrice)} sub="+20 % vs base" highlight />
          </div>

          <div style={{
            marginTop: '14px', padding: '10px 12px', borderRadius: '10px',
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '12.5px',
          }}>
            <span style={{ color: 'var(--text-2)' }}>ADR marché {res.city} :</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>
              {fmtEur(res.marketAdr)}
              {Math.abs(diffPct) >= 2 && (
                <span style={{ marginLeft: '8px', fontSize: '11.5px', color: diffPct >= 0 ? 'var(--success-1)' : '#F59E0B' }}>
                  {diffPct >= 0 ? '+' : ''}{diffPct} %
                </span>
              )}
            </span>
          </div>

          <div style={{ marginTop: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Prix recommandés sur 12 mois
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', alignItems: 'end', minHeight: '60px' }}>
              {res.yearPricing.map((p, i) => {
                const h = maxYearPrice > 0 ? Math.max(4, (p.price / maxYearPrice) * 50) : 4
                const isCurrent = p.month === month
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }} title={`${MONTHS_LONG[i]} : ${fmtEur(p.price)} (weekend ${fmtEur(p.weekend)})`}>
                    <div style={{
                      width: '100%', height: `${h}px`,
                      background: p.isHigh
                        ? 'linear-gradient(180deg, var(--success-1) 0%, #2BA56A 100%)'
                        : 'linear-gradient(180deg, #FFD56B 0%, #FFC845 100%)',
                      borderRadius: '4px 4px 0 0',
                      boxShadow: isCurrent ? '0 0 0 2px var(--accent-text)' : 'none',
                    }} />
                    <span style={{ fontSize: '9.5px', fontWeight: 600, color: 'var(--text-2)' }}>{p.price}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{MONTHS_SHORT[i]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', marginBottom: 0, fontStyle: 'italic' as const, borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            Source : {res.source}. Ajuste selon ta concurrence directe et la qualité de ton bien.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
 * 7. COMPARATEUR MES VILLES (multi-villes, préfilé avec tes logements)
 * ────────────────────────────────────────── */
export function CompareurMesVilles({ logements }: { logements: LogementPrefill[] }) {
  // Villes uniques des logements de l'utilisateur (déduplication par ville+pays)
  const villesLogements = useMemo(() => {
    const seen = new Set<string>()
    const out: Array<{ pays: Pays; ville: string; isMine: true; logementNom?: string; statsReelles?: NonNullable<LogementPrefill['stats']> }> = []
    logements.forEach(l => {
      const key = `${l.pays}|${l.ville ?? ''}`
      if (!l.ville || seen.has(key)) return
      seen.add(key)
      out.push({ pays: l.pays as Pays, ville: l.ville, isMine: true, logementNom: l.nom, statsReelles: l.stats })
    })
    return out
  }, [logements])

  // 4 villes max (les 2 premières de l'hôte, puis 2 villes par défaut à comparer)
  const defaultSelection = useMemo(() => {
    const sel: Array<{ pays: Pays; ville: string }> = []
    villesLogements.slice(0, 2).forEach(v => sel.push({ pays: v.pays, ville: v.ville }))
    // Complète avec des villes-référence si moins de 2 logements
    if (sel.length < 2) sel.push({ pays: 'FR', ville: 'Paris' })
    if (sel.length < 3) sel.push({ pays: 'FR', ville: 'Lyon' })
    return sel
  }, [villesLogements])

  const [selection, setSelection] = useState(defaultSelection)

  const benches = useMemo(() => {
    return selection
      .map(s => {
        const bench = citiesByCountry(s.pays).find(c => c.ville === s.ville)
        if (!bench) return null
        const mine = villesLogements.find(v => v.pays === s.pays && v.ville === s.ville)
        return { bench, mine }
      })
      .filter((b): b is { bench: ReturnType<typeof citiesByCountry>[0]; mine: typeof villesLogements[0] | undefined } => !!b)
  }, [selection, villesLogements])

  function updateSelection(idx: number, field: 'pays' | 'ville', value: string) {
    setSelection(prev => {
      const next = [...prev]
      if (field === 'pays') {
        const cities = citiesByCountry(value as Pays)
        next[idx] = { pays: value as Pays, ville: cities[0]?.ville ?? '' }
      } else {
        next[idx] = { ...next[idx], ville: value }
      }
      return next
    })
  }
  function addCity() {
    if (selection.length >= 4) return
    const last = selection[selection.length - 1]
    const cities = citiesByCountry(last?.pays ?? 'FR')
    const used = new Set(selection.map(s => s.ville))
    const next = cities.find(c => !used.has(c.ville)) ?? cities[0]
    if (next) setSelection([...selection, { pays: last?.pays ?? 'FR', ville: next.ville }])
  }
  function removeCity(idx: number) {
    if (selection.length <= 2) return
    setSelection(prev => prev.filter((_, i) => i !== idx))
  }

  // Best per metric
  function bestIdx(values: number[], higherIsBetter = true): number {
    let best = -1, bestVal = higherIsBetter ? -Infinity : Infinity
    values.forEach((v, i) => { if (higherIsBetter ? v > bestVal : v < bestVal) { bestVal = v; best = i } })
    return best
  }
  const occs = benches.map(b => b.bench.occupationAnnuellePct)
  const adrs = benches.map(b => b.bench.adrEur)
  const revpars = benches.map(b => b.bench.revparAnnuelEur)
  const bestOcc = bestIdx(occs), bestAdr = bestIdx(adrs), bestRev = bestIdx(revpars)

  return (
    <div>
      <h2 style={s.sectionTitle}>
        <Storefront size={20} weight="fill" /> Compare tes villes
      </h2>
      <p style={s.sectionDesc}>
        Compare les benchmarks marché de tes propres villes à d&apos;autres villes pour décider d&apos;un investissement.
        {villesLogements.length > 0 && ` Préfilé avec ${villesLogements.length} ville${villesLogements.length > 1 ? 's' : ''} où tu as déjà un bien.`}
      </p>

      {/* Sélection villes */}
      <div style={s.formCard}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '14px' }}>
          {selection.map((sel, i) => {
            const isMine = villesLogements.some(v => v.pays === sel.pays && v.ville === sel.ville)
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: ['#10b981', '#3b82f6', '#f59e0b', '#a78bfa'][i],
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  <select
                    value={sel.ville}
                    onChange={e => updateSelection(i, 'ville', e.target.value)}
                    style={{ ...s.input, flex: '1 1 180px', minWidth: 0 }}
                  >
                    {citiesByCountry(sel.pays).map(c => (
                      <option key={c.ville} value={c.ville}>
                        {c.ville}{villesLogements.some(v => v.pays === sel.pays && v.ville === c.ville) ? ' ★ (mon bien)' : ''}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sel.pays}
                    onChange={e => updateSelection(i, 'pays', e.target.value)}
                    style={{ ...s.input, fontSize: '12.5px', flex: '0 1 130px', minWidth: 0 }}
                  >
                    {SUPPORTED_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.label}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeCity(i)}
                    disabled={selection.length <= 2}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      border: '1px solid var(--border)', background: 'transparent',
                      color: 'var(--text-muted)', cursor: selection.length <= 2 ? 'not-allowed' : 'pointer',
                      fontSize: '13px', opacity: selection.length <= 2 ? 0.3 : 1,
                      flexShrink: 0,
                    }}
                    title="Retirer"
                    aria-label="Retirer cette ville"
                  >✕</button>
                </div>
                {isMine && (
                  <div style={{
                    fontSize: '10.5px',
                    color: 'var(--accent-text)',
                    fontWeight: 600,
                    marginLeft: '32px',
                  }}>★ Ville où tu as un bien</div>
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={addCity}
          disabled={selection.length >= 4}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px',
            border: '1px dashed var(--border)', background: 'transparent',
            color: 'var(--accent-text)', fontSize: '12.5px', fontWeight: 500,
            cursor: selection.length >= 4 ? 'not-allowed' : 'pointer',
            opacity: selection.length >= 4 ? 0.4 : 1,
            fontFamily: 'inherit',
          }}
        >
          + Ajouter une ville
        </button>
      </div>

      {/* Tableau comparatif : scroll-x sur mobile pour ne pas casser le layout */}
      <div style={{ ...s.resultCard, marginTop: '14px', padding: '12px', overflowX: 'auto' as const, WebkitOverflowScrolling: 'touch' as const }}>
        <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse' as const, fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' as const, padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}></th>
              {benches.map((b, i) => (
                <th key={i} style={{ textAlign: 'left' as const, padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
                  {SUPPORTED_COUNTRIES.find(c => c.code === b.bench.pays)?.flag} {b.bench.ville}
                  {b.mine && <span style={{ display: 'block', fontSize: '10px', color: 'var(--accent-text)', fontWeight: 600, marginTop: '2px' }}>★ ton bien</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>Occupation</td>
              {benches.map((b, i) => (
                <td key={i} style={{ padding: '12px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-fraunces), serif', fontSize: '15px', color: i === bestOcc ? 'var(--success-1)' : 'var(--text)', fontWeight: i === bestOcc ? 600 : 400 }}>
                  {i === bestOcc && '🏆 '}{b.bench.occupationAnnuellePct} %
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>ADR moyen</td>
              {benches.map((b, i) => (
                <td key={i} style={{ padding: '12px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-fraunces), serif', fontSize: '15px', color: i === bestAdr ? 'var(--success-1)' : 'var(--text)', fontWeight: i === bestAdr ? 600 : 400 }}>
                  {i === bestAdr && '🏆 '}{fmtEur(b.bench.adrEur)}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>RevPAR annuel</td>
              {benches.map((b, i) => (
                <td key={i} style={{ padding: '12px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-fraunces), serif', fontSize: '15px', color: i === bestRev ? 'var(--success-1)' : 'var(--text)', fontWeight: i === bestRev ? 600 : 400 }}>
                  {i === bestRev && '🏆 '}{fmtEur(b.bench.revparAnnuelEur)}
                </td>
              ))}
            </tr>
            {/* Tes vraies stats si dispo */}
            {benches.some(b => b.mine?.statsReelles && b.mine.statsReelles.nuitsLouees > 0) && (
              <tr>
                <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--accent-text)', borderBottom: '1px solid var(--border)' }}>★ Ton occupation réelle</td>
                {benches.map((b, i) => (
                  <td key={i} style={{ padding: '12px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-fraunces), serif', fontSize: '15px', color: 'var(--accent-text)' }}>
                    {b.mine?.statsReelles ? `${b.mine.statsReelles.occupationReelle} %` : '—'}
                  </td>
                ))}
              </tr>
            )}
            {benches.some(b => b.mine?.statsReelles && b.mine.statsReelles.adrReel > 0) && (
              <tr>
                <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--accent-text)' }}>★ Ton ADR réel</td>
                {benches.map((b, i) => (
                  <td key={i} style={{ padding: '12px 12px', fontFamily: 'var(--font-fraunces), serif', fontSize: '15px', color: 'var(--accent-text)' }}>
                    {b.mine?.statsReelles?.adrReel ? fmtEur(b.mine.statsReelles.adrReel) : '—'}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>

        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', marginBottom: 0, fontStyle: 'italic' as const, borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          Sources publiques INSEE, DGE, INE, ENIT, CBS, OFS, Statistik Austria 2024. Tes stats réelles calculées sur les 12 derniers mois de séjours encaissés.
        </p>
      </div>
    </div>
  )
}

// ─── Simulateur Franchise TVA ────────────────────────────────────────


type SimTab = 'fiscal' | 'statut' | 'rentabilite' | 'taxe' | 'tva'
const SIM_TABS: SimTab[] = ['fiscal', 'statut', 'rentabilite', 'taxe', 'tva']

export default function SimulateursUI({ logementsPrefill = [], accountStats }: Props) {
  const [tab, setTab] = useState<SimTab>('fiscal')

  // Deep-linking via URL hash : /dashboard/simulateurs#statut ouvre l'onglet
  useEffect(() => {
    const fromHash = () => {
      const h = (typeof window !== 'undefined' ? window.location.hash.slice(1) : '') as SimTab
      if (SIM_TABS.includes(h)) setTab(h)
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  const selectTab = (t: SimTab) => {
    setTab(t)
    if (typeof window !== 'undefined') {
      history.replaceState(null, '', `#${t}`)
    }
  }

  return (
    <div style={s.page}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Selects en vert Jason quand ouverts */
        .sim-root select option { background-color: var(--bg-2); color: var(--text); padding: 8px 12px; font-weight: 500; }
        .sim-root select option:hover { background-color: rgba(0,76,63,0.55); color: #fff; }
        .sim-root select option:checked { background: linear-gradient(0deg, var(--accent-text) 0%, var(--accent-text) 100%); color: var(--bg); font-weight: 700; }
        /* Inputs et selects : focus state vert Jason */
        .sim-root input[type="text"]:focus, .sim-root input[type="number"]:focus,
        .sim-root select:focus, .sim-root textarea:focus {
          border-color: rgba(99,214,131,0.55) !important;
          box-shadow: 0 0 0 3px rgba(0,76,63,0.18), 0 0 0 1px rgba(99,214,131,0.40);
          outline: none;
        }
        .sim-root select { transition: border-color .18s, box-shadow .18s; cursor: pointer; }
        .sim-root select:hover { border-color: rgba(99,214,131,0.32); }
        /* Plus d'air entre label et input */
        .sim-root .jm-field-spaced > div[class*="field"], .sim-root .sim-field { gap: 11px !important; }
        /* Checkbox custom élégante */
        .jm-check { display: flex !important; align-items: center; gap: 10px; cursor: pointer; padding: 12px 14px !important; border-radius: 10px; background: linear-gradient(135deg, rgba(0,76,63,.05) 0%, rgba(255,213,107,.06) 100%); border: 1px solid var(--accent-border); transition: all .2s cubic-bezier(.4,0,.2,1); margin-top: 4px !important; }
        .jm-check:hover { border-color: var(--accent-text); background: linear-gradient(135deg, rgba(0,76,63,.10) 0%, rgba(255,213,107,.12) 100%); }
        .jm-check input[type="checkbox"] { appearance: none; -webkit-appearance: none; width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--accent-border); background: var(--bg); cursor: pointer; flex-shrink: 0; position: relative; transition: all .15s; margin: 0; }
        .jm-check input[type="checkbox"]:hover { border-color: var(--accent-text); }
        .jm-check input[type="checkbox"]:checked { background: var(--accent-text); border-color: var(--accent-text); }
        .jm-check input[type="checkbox"]:checked::after { content: ''; position: absolute; top: 3px; left: 6px; width: 5px; height: 9px; border: solid var(--bg); border-width: 0 2px 2px 0; transform: rotate(45deg); }
        .jm-check span { font-size: 13.5px; color: var(--text); font-weight: 500; line-height: 1.4; }
        .jm-check span strong { color: var(--accent-text); }
        /* Tabs hover + focus */
        .sim-root [role="tab"]:hover { color: var(--text); background: rgba(255,255,255,.03); }
        .sim-root [role="tab"][aria-selected="true"] { background: var(--accent-bg); color: var(--accent-text); box-shadow: 0 1px 0 rgba(255,213,107,0.06) inset, 0 2px 8px rgba(255,213,107,0.10); }
      ` }} />
      <div className="sim-root">

        <PageSwitcher current="fiscal" />

        <div style={s.hero}>
          <span style={s.heroBadge}>
            <Calculator size={13} weight="fill" />
            5 simulateurs fiscaux
          </span>
          <h1 style={s.heroTitle}>
            Simulateurs <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>fiscaux</em>
          </h1>
          <p style={s.heroDesc}>
            Calcule ton imposition, choisis ton statut, estime ta taxe de séjour, projette ta rentabilité nette, vérifie ta franchise TVA. Tout en quelques secondes, préfilé avec tes vrais logements.
          </p>
        </div>

        {accountStats && <ActivityOverview stats={accountStats} />}

        <div style={s.tabs} role="tablist" aria-label="Simulateurs fiscaux">
          <button onClick={() => selectTab('fiscal')} role="tab" aria-selected={tab === 'fiscal'} style={s.tab}>
            <CurrencyEur size={15} weight="fill" /> Fiscalité
          </button>
          <button onClick={() => selectTab('statut')} role="tab" aria-selected={tab === 'statut'} style={s.tab}>
            <Scales size={15} weight="fill" /> EI vs SASU
          </button>
          <button onClick={() => selectTab('rentabilite')} role="tab" aria-selected={tab === 'rentabilite'} style={s.tab}>
            <ChartLineUp size={15} weight="fill" /> Rentabilité
          </button>
          <button onClick={() => selectTab('taxe')} role="tab" aria-selected={tab === 'taxe'} style={s.tab}>
            <Receipt size={15} weight="fill" /> Taxe de séjour
          </button>
          <button onClick={() => selectTab('tva')} role="tab" aria-selected={tab === 'tva'} style={s.tab}>
            <Percent size={15} weight="fill" /> Franchise TVA
          </button>
        </div>

        <div style={s.bodyCard} role="tabpanel">
          {/* key={tab} force le remount → trigger l'anim fadeIn pour un crossfade subtil */}
          <div key={tab} className="anim-fade-in">
            {tab === 'fiscal' && <FiscalLCD accountStats={accountStats} />}
            {tab === 'statut' && <EIvsSASU accountStats={accountStats} />}
            {tab === 'rentabilite' && <Rentabilite accountStats={accountStats} />}
            {tab === 'taxe' && <TaxeSejour accountStats={accountStats} />}
            {tab === 'tva' && <FranchiseTVA accountStats={accountStats} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function PageSwitcher({ current }: { current: 'fiscal' | 'marche' }) {
  const isFiscal = current === 'fiscal'
  return (
    <div style={ps.wrap} role="navigation" aria-label="Choix de la suite d'outils">
      <a href="/dashboard/simulateurs" style={isFiscal ? { ...ps.btn, ...ps.btnActive } : ps.btn} aria-current={isFiscal ? 'page' : undefined}>
        <Calculator size={13} weight="fill" /> Simulateurs fiscaux
      </a>
      <a href="/dashboard/calculateurs" style={!isFiscal ? { ...ps.btn, ...ps.btnActive } : ps.btn} aria-current={!isFiscal ? 'page' : undefined}>
        <ChartLineUp size={13} weight="fill" /> Calculateurs marché
      </a>
    </div>
  )
}

const ps: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'inline-flex', gap: '4px', padding: '4px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', marginBottom: 'clamp(18px, 2.5vw, 26px)',
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 12px', borderRadius: '7px',
    fontSize: '12.5px', fontWeight: 500,
    color: 'var(--text-2)', background: 'transparent',
    textDecoration: 'none',
    transition: 'all .18s cubic-bezier(.4,0,.2,1)',
  },
  btnActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    fontWeight: 700,
  },
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(14px, 3vw, 44px)', width: '100%' },
  hero: { marginBottom: 'clamp(20px, 3vw, 32px)' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: 'var(--accent-text)', background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '999px', padding: '4px 12px', marginBottom: '14px',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 10px',
  },
  heroDesc: {
    fontSize: '14px', lineHeight: 1.7, color: 'var(--text-2)',
    maxWidth: '600px', margin: 0,
  },
  tabs: {
    display: 'flex', gap: '8px', padding: '6px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', marginBottom: 'clamp(18px, 2.5vw, 24px)',
    flexWrap: 'wrap' as const,
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '11px 18px', fontSize: '13px', fontWeight: 500,
    color: 'var(--text-2)', background: 'transparent',
    border: 'none', borderRadius: '10px', cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all .18s cubic-bezier(.4,0,.2,1)',
  },
  tabActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
  },
  body: { minHeight: '200px' },
  bodyCard: {
    minHeight: '200px',
    padding: 'clamp(18px, 2.6vw, 28px)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    boxShadow: '0 1px 0 rgba(255,255,255,.02) inset',
  },
  placeholder: {
    padding: '40px', textAlign: 'center' as const,
    fontSize: '13px', color: 'var(--text-muted)',
  },

  /* ── Shared calc styles ── */
  calc: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '11px' },
  label: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
    textTransform: 'uppercase' as const, color: 'var(--text-3)',
    marginBottom: '1px',
  },
  inputWrap: { position: 'relative' as const },
  input: {
    width: '100%', padding: '11px 36px 11px 14px',
    fontSize: '15px', fontWeight: 500, color: 'var(--text)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', fontFamily: 'inherit', outline: 'none',
  },
  suffix: {
    position: 'absolute' as const, right: '14px', top: '50%',
    transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 400,
    color: 'var(--text-3)', pointerEvents: 'none' as const,
  },
  range: { width: '100%', accentColor: 'var(--accent-text)' },
  helper: { fontSize: '11px', fontWeight: 300, color: 'var(--text-3)' },

  toggleRow: {
    display: 'flex', gap: '6px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    padding: '4px', borderRadius: '10px',
  },
  toggleBtn: {
    flex: 1, padding: '8px 10px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-2)',
    background: 'transparent', border: 'none', borderRadius: '7px',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  toggleActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
  },

  results: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px', marginTop: '4px',
  },
  resultBox: {
    padding: '14px 16px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '12px',
  },
  resultLabel: {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-3)',
    textTransform: 'uppercase' as const, letterSpacing: '0.4px',
    marginBottom: '6px',
  },
  resultValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '24px', fontWeight: 400, color: 'var(--text)',
    marginBottom: '6px',
  },
  resultHint: {
    fontSize: '11.5px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.5,
  },

  disclaimer: {
    display: 'flex', alignItems: 'flex-start', gap: '7px',
    padding: '10px 12px',
    background: 'var(--info-bg)',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: '9px',
    fontSize: '11.5px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.5, marginTop: '4px',
  },

  // ─── Estimateur / Calculateur (nouveaux onglets Sprint 2) ─────────────
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '22px', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 6px',
    letterSpacing: '-0.01em',
  },
  sectionDesc: {
    fontSize: '13.5px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.6, margin: '0 0 22px',
  },
  grid2: {
    display: 'grid',
    // auto-fit + minmax 320px : 2 colonnes desktop ≥ 660px, 1 colonne mobile/tablette
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
    gap: 'clamp(14px, 2.5vw, 18px)',
    alignItems: 'flex-start',
  },
  formCard: {
    padding: '20px 22px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  resultCard: {
    padding: '20px 22px', borderRadius: '14px',
    background: 'linear-gradient(135deg, var(--accent-bg) 0%, var(--surface) 100%)',
    border: '1px solid var(--accent-border)',
  },
  resultBigVal: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '36px', fontWeight: 400,
    color: 'var(--text)', letterSpacing: '-0.02em',
    margin: '4px 0',
  },
}
