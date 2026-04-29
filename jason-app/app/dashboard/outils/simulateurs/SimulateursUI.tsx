'use client'

import { useState, useMemo } from 'react'
import { Calculator, Scales, CurrencyEur, Info, House, MapPin, ChartLineUp } from '@phosphor-icons/react'

type CalcTab = 'fiscal' | 'statut' | 'rentabilite' | 'taxe'

function fmtEur(n: number, decimals: number = 0): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: decimals }) + ' €'
}

function fmtPct(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %'
}

/* ──────────────────────────────────────────
 * 1. FISCALITÉ LCD (micro-BIC)
 * ────────────────────────────────────────── */

function FiscalLCD() {
  const [ca, setCa] = useState(30000)
  const [classe, setClasse] = useState(false)

  const result = useMemo(() => {
    const plafond = classe ? 77700 : 15000
    const tauxAbattement = classe ? 0.71 : 0.30
    const sousPlafond = ca <= plafond
    const baseImposable = sousPlafond ? ca * (1 - tauxAbattement) : ca
    const economieClassement = ca * (0.71 - 0.30)
    return { plafond, tauxAbattement, sousPlafond, baseImposable, economieClassement }
  }, [ca, classe])

  return (
    <div style={s.calc}>
      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Chiffre d&apos;affaires annuel</label>
          <div style={s.inputWrap}>
            <input type="number" value={ca} onChange={e => setCa(Math.max(0, Number(e.target.value)))}
              style={s.input} min={0} step={1000} />
            <span style={s.suffix}>€</span>
          </div>
          <input type="range" value={ca} onChange={e => setCa(Number(e.target.value))}
            min={0} max={100000} step={1000} style={s.range} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Logement classé Atout France ?</label>
          <div style={s.toggleRow}>
            <button onClick={() => setClasse(false)} style={{ ...s.toggleBtn, ...(classe ? {} : s.toggleActive) }}>Non classé</button>
            <button onClick={() => setClasse(true)} style={{ ...s.toggleBtn, ...(classe ? s.toggleActive : {}) }}>Classé 1–5★</button>
          </div>
          <div style={s.helper}>Abattement {result.tauxAbattement * 100} % · plafond {fmtEur(result.plafond)}</div>
        </div>
      </div>

      <div style={s.results}>
        {result.sousPlafond ? (
          <>
            <div style={s.resultBox}>
              <div style={s.resultLabel}>Base imposable (micro-BIC)</div>
              <div style={s.resultValue}>{fmtEur(result.baseImposable)}</div>
              <div style={s.resultHint}>{fmtEur(ca)} − abattement {result.tauxAbattement * 100} %</div>
            </div>
            <div style={s.resultBox}>
              <div style={s.resultLabel}>Tu peux rester au micro</div>
              <div style={{ ...s.resultValue, color: '#10b981' }}>OK</div>
              <div style={s.resultHint}>Sous le plafond {fmtEur(result.plafond)}</div>
            </div>
          </>
        ) : (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={s.resultLabel}>Plafond dépassé</div>
            <div style={{ ...s.resultValue, color: '#ef4444' }}>Régime réel</div>
            <div style={s.resultHint}>Tu dépasses le plafond {fmtEur(result.plafond)} → bascule au réel obligatoire l&apos;année suivante</div>
          </div>
        )}
        {!classe && ca > 0 && (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}>
            <div style={s.resultLabel}>Si tu te fais classer Atout France</div>
            <div style={{ ...s.resultValue, color: '#10b981', fontSize: '20px' }}>− {fmtEur(result.economieClassement)} de base imposable</div>
            <div style={s.resultHint}>Économie estimée d&apos;impôt : ~{fmtEur(result.economieClassement * 0.30)} (à TMI 30 %)</div>
          </div>
        )}
      </div>

      <div style={s.disclaimer}>
        <Info size={11} weight="fill" />
        Estimation pédagogique. Le régime <strong>réel simplifié</strong> peut être plus avantageux au-delà de 30 k€/an si tu as des charges (amortissement, intérêts, travaux). Consulte un expert-comptable.
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
 * 2. EI vs SASU
 * ────────────────────────────────────────── */

function EIvsSASU() {
  const [benef, setBenef] = useState(40000)
  const [tmi, setTmi] = useState(30)

  const result = useMemo(() => {
    const cotisEI = benef * 0.42
    const netImposableEI = benef - cotisEI
    const irEI = netImposableEI * (tmi / 100)
    const netPocheEI = netImposableEI - irEI

    const seuilIS = 42500
    const isReduit = Math.min(benef, seuilIS) * 0.15
    const isPlein = Math.max(0, benef - seuilIS) * 0.25
    const totalIS = isReduit + isPlein
    const beneficeApresIS = benef - totalIS
    const flatTax = beneficeApresIS * 0.30
    const netPocheSASU = beneficeApresIS - flatTax

    const diff = netPocheSASU - netPocheEI
    const meilleur = diff > 0 ? 'sasu' : 'ei'

    return {
      ei: { cotis: cotisEI, ir: irEI, net: netPocheEI },
      sasu: { is: totalIS, flatTax, net: netPocheSASU },
      diff: Math.abs(diff),
      meilleur,
    }
  }, [benef, tmi])

  return (
    <div style={s.calc}>
      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Bénéfice annuel avant impôt</label>
          <div style={s.inputWrap}>
            <input type="number" value={benef} onChange={e => setBenef(Math.max(0, Number(e.target.value)))}
              style={s.input} min={0} step={1000} />
            <span style={s.suffix}>€</span>
          </div>
          <input type="range" value={benef} onChange={e => setBenef(Number(e.target.value))}
            min={0} max={150000} step={1000} style={s.range} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Tranche marginale d&apos;imposition (IR)</label>
          <div style={s.toggleRow}>
            {[11, 30, 41].map(t => (
              <button key={t} onClick={() => setTmi(t)} style={{ ...s.toggleBtn, ...(tmi === t ? s.toggleActive : {}) }}>{t} %</button>
            ))}
          </div>
          <div style={s.helper}>Selon ton revenu fiscal de référence</div>
        </div>
      </div>

      <div style={s.results}>
        <div style={{ ...s.resultBox, ...(result.meilleur === 'ei' ? { borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.06)' } : {}) }}>
          <div style={s.resultLabel}>EI · TNS · IR</div>
          <div style={s.resultValue}>{fmtEur(result.ei.net)}</div>
          <div style={s.resultHint}>Cotisations TNS ~42 % : {fmtEur(result.ei.cotis)}<br />IR ({tmi} %) : {fmtEur(result.ei.ir)}</div>
        </div>
        <div style={{ ...s.resultBox, ...(result.meilleur === 'sasu' ? { borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.06)' } : {}) }}>
          <div style={s.resultLabel}>SASU · 100 % dividendes</div>
          <div style={s.resultValue}>{fmtEur(result.sasu.net)}</div>
          <div style={s.resultHint}>IS (15/25 %) : {fmtEur(result.sasu.is)}<br />Flat tax 30 % : {fmtEur(result.sasu.flatTax)}</div>
        </div>
        {benef > 0 && (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
            <div style={s.resultLabel}>Différence en ta poche</div>
            <div style={{ ...s.resultValue, color: 'var(--accent-text)', fontSize: '20px' }}>
              {result.meilleur === 'sasu' ? 'SASU' : 'EI'} : + {fmtEur(result.diff)}
            </div>
            <div style={s.resultHint}>
              {result.meilleur === 'sasu'
                ? 'En SASU full dividendes, tu gardes plus net mais aucune protection sociale ni retraite cotisée.'
                : 'En EI, tu cotises pour ta protection sociale et ta retraite. Tu touches moins net mais tu construis tes droits.'}
            </div>
          </div>
        )}
      </div>

      <div style={s.disclaimer}>
        <Info size={11} weight="fill" />
        Modèle simplifié. La SASU peut combiner salaire + dividendes. La protection sociale, la retraite et l&apos;ACRE ne sont pas modélisées. Consulte un expert-comptable.
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
 * 3. RENTABILITÉ D'UN LOGEMENT LCD
 * ────────────────────────────────────────── */

const COMMISSION_PRESETS = [
  { label: 'Direct', value: 0 },
  { label: 'Airbnb', value: 17 },
  { label: 'Booking', value: 18 },
]

function Rentabilite() {
  // Operational
  const [prixNuit, setPrixNuit] = useState(100)
  const [occupation, setOccupation] = useState(65)
  const [commission, setCommission] = useState(17)
  const [fraisMenage, setFraisMenage] = useState(50)
  const [dureeMoy, setDureeMoy] = useState(3)
  const [chargesMens, setChargesMens] = useState(800)
  // Investissement (optionnel)
  const [investMode, setInvestMode] = useState(false)
  const [prixAchat, setPrixAchat] = useState(200000)
  const [apport, setApport] = useState(40000)
  const [dureeCredit, setDureeCredit] = useState(20)
  const [tauxCredit, setTauxCredit] = useState(3.8)

  const r = useMemo(() => {
    const nuitsOccupees = Math.round((365 * occupation) / 100)
    const nbSejours = dureeMoy > 0 ? Math.round(nuitsOccupees / dureeMoy) : 0
    const caBrut = prixNuit * nuitsOccupees
    const commissionAnnuelle = (caBrut * commission) / 100
    const fraisMenageAnnuels = nbSejours * fraisMenage
    const chargesAnnuelles = chargesMens * 12
    const totalCharges = commissionAnnuelle + fraisMenageAnnuels + chargesAnnuelles
    const netAnnuel = caBrut - totalCharges
    const netMensuel = netAnnuel / 12
    const margePct = caBrut > 0 ? (netAnnuel / caBrut) * 100 : 0

    // Investissement
    let mensualite = 0, coutCreditAnnuel = 0, cashFlowMensuel = 0, rentBrute = 0, rentNette = 0
    if (investMode && prixAchat > 0) {
      const capital = Math.max(0, prixAchat - apport)
      const tauxMensuel = tauxCredit / 100 / 12
      const n = dureeCredit * 12
      if (capital > 0 && tauxMensuel > 0 && n > 0) {
        mensualite = (capital * tauxMensuel * Math.pow(1 + tauxMensuel, n)) / (Math.pow(1 + tauxMensuel, n) - 1)
      }
      coutCreditAnnuel = mensualite * 12
      cashFlowMensuel = (netAnnuel - coutCreditAnnuel) / 12
      rentBrute = (caBrut / prixAchat) * 100
      rentNette = (netAnnuel / prixAchat) * 100
    }

    return {
      nuitsOccupees, nbSejours, caBrut, commissionAnnuelle, fraisMenageAnnuels,
      chargesAnnuelles, totalCharges, netAnnuel, netMensuel, margePct,
      mensualite, coutCreditAnnuel, cashFlowMensuel, rentBrute, rentNette,
    }
  }, [prixNuit, occupation, commission, fraisMenage, dureeMoy, chargesMens, investMode, prixAchat, apport, dureeCredit, tauxCredit])

  const sante = r.margePct >= 40 ? { color: '#10b981', label: 'Excellente' }
              : r.margePct >= 20 ? { color: '#f59e0b', label: 'Correcte' }
              : { color: '#ef4444', label: 'Faible' }

  return (
    <div style={s.calc}>
      {/* OPÉRATIONNEL */}
      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Prix moyen / nuit</label>
          <div style={s.inputWrap}>
            <input type="number" value={prixNuit} onChange={e => setPrixNuit(Math.max(0, Number(e.target.value)))}
              style={s.input} min={0} step={5} />
            <span style={s.suffix}>€</span>
          </div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Taux d&apos;occupation</label>
          <div style={s.inputWrap}>
            <input type="number" value={occupation} onChange={e => setOccupation(Math.max(0, Math.min(100, Number(e.target.value))))}
              style={s.input} min={0} max={100} />
            <span style={s.suffix}>%</span>
          </div>
          <input type="range" value={occupation} onChange={e => setOccupation(Number(e.target.value))}
            min={0} max={100} step={1} style={s.range} />
        </div>
      </div>

      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Commission plateforme</label>
          <div style={s.toggleRow}>
            {COMMISSION_PRESETS.map(p => (
              <button key={p.label} onClick={() => setCommission(p.value)}
                style={{ ...s.toggleBtn, ...(commission === p.value ? s.toggleActive : {}) }}>
                {p.label} {p.value}%
              </button>
            ))}
          </div>
          <div style={s.inputWrap}>
            <input type="number" value={commission} onChange={e => setCommission(Math.max(0, Math.min(50, Number(e.target.value))))}
              style={s.input} min={0} max={50} step={0.5} />
            <span style={s.suffix}>%</span>
          </div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Charges fixes mensuelles</label>
          <div style={s.inputWrap}>
            <input type="number" value={chargesMens} onChange={e => setChargesMens(Math.max(0, Number(e.target.value)))}
              style={s.input} min={0} step={50} />
            <span style={s.suffix}>€</span>
          </div>
          <div style={s.helper}>Loyer/crédit, assurance, abos, taxes</div>
        </div>
      </div>

      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Frais ménage / séjour</label>
          <div style={s.inputWrap}>
            <input type="number" value={fraisMenage} onChange={e => setFraisMenage(Math.max(0, Number(e.target.value)))}
              style={s.input} min={0} step={5} />
            <span style={s.suffix}>€</span>
          </div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Durée moyenne d&apos;un séjour</label>
          <div style={s.inputWrap}>
            <input type="number" value={dureeMoy} onChange={e => setDureeMoy(Math.max(1, Number(e.target.value)))}
              style={s.input} min={1} step={1} />
            <span style={s.suffix}>nuits</span>
          </div>
        </div>
      </div>

      {/* TOGGLE INVESTISSEMENT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
          <input type="checkbox" checked={investMode} onChange={e => setInvestMode(e.target.checked)} />
          J&apos;ai aussi acheté ce bien (calculer cash-flow + rentabilité)
        </label>
      </div>

      {investMode && (
        <>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Prix d&apos;achat</label>
              <div style={s.inputWrap}>
                <input type="number" value={prixAchat} onChange={e => setPrixAchat(Math.max(0, Number(e.target.value)))}
                  style={s.input} min={0} step={5000} />
                <span style={s.suffix}>€</span>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Apport personnel</label>
              <div style={s.inputWrap}>
                <input type="number" value={apport} onChange={e => setApport(Math.max(0, Number(e.target.value)))}
                  style={s.input} min={0} step={1000} />
                <span style={s.suffix}>€</span>
              </div>
            </div>
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Durée du crédit</label>
              <div style={s.inputWrap}>
                <input type="number" value={dureeCredit} onChange={e => setDureeCredit(Math.max(1, Number(e.target.value)))}
                  style={s.input} min={1} max={30} step={1} />
                <span style={s.suffix}>ans</span>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Taux d&apos;intérêt annuel</label>
              <div style={s.inputWrap}>
                <input type="number" value={tauxCredit} onChange={e => setTauxCredit(Math.max(0, Number(e.target.value)))}
                  style={s.input} min={0} step={0.1} />
                <span style={s.suffix}>%</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* RÉSULTATS */}
      <div style={s.results}>
        <div style={{ ...s.resultBox, gridColumn: '1 / -1', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
          <div style={s.resultLabel}>{investMode ? 'Cash-flow mensuel après crédit' : 'Revenu net mensuel'}</div>
          <div style={{ ...s.resultValue, color: 'var(--accent-text)', fontSize: '32px' }}>
            {fmtEur(investMode ? r.cashFlowMensuel : r.netMensuel)}
          </div>
          <div style={s.resultHint}>
            Soit {fmtEur(investMode ? r.cashFlowMensuel * 12 : r.netAnnuel)}/an · Marge opérationnelle{' '}
            <span style={{ color: sante.color, fontWeight: 600 }}>{fmtPct(r.margePct)} ({sante.label})</span>
          </div>
        </div>

        <div style={s.resultBox}>
          <div style={s.resultLabel}>CA brut annuel</div>
          <div style={s.resultValue}>{fmtEur(r.caBrut)}</div>
          <div style={s.resultHint}>{r.nuitsOccupees} nuits · ~{r.nbSejours} séjours</div>
        </div>
        <div style={s.resultBox}>
          <div style={s.resultLabel}>Charges totales</div>
          <div style={s.resultValue}>{fmtEur(r.totalCharges)}</div>
          <div style={s.resultHint}>
            Commission {fmtEur(r.commissionAnnuelle)}<br />
            Ménage {fmtEur(r.fraisMenageAnnuels)}<br />
            Fixes {fmtEur(r.chargesAnnuelles)}
          </div>
        </div>

        {investMode && (
          <>
            <div style={s.resultBox}>
              <div style={s.resultLabel}>Mensualité crédit</div>
              <div style={s.resultValue}>{fmtEur(r.mensualite)}</div>
              <div style={s.resultHint}>Sur {dureeCredit} ans à {tauxCredit}%</div>
            </div>
            <div style={{ ...s.resultBox, gridColumn: '1 / -1' }}>
              <div style={s.resultLabel}>Rentabilité de l&apos;investissement</div>
              <div style={s.resultValue}>
                Brute {fmtPct(r.rentBrute)} · Nette {fmtPct(r.rentNette)}
              </div>
              <div style={s.resultHint}>
                Brute = CA / prix d&apos;achat · Nette = revenu net opérationnel / prix d&apos;achat
              </div>
            </div>
          </>
        )}
      </div>

      <div style={s.disclaimer}>
        <Info size={11} weight="fill" />
        Estimation pour <strong>1 logement</strong>. Ne tient pas compte des impôts, taxes spécifiques (CFE, taxe foncière) ni travaux. Pour une vue complète, ajoute ~20-30 % de charges supplémentaires.
      </div>
    </div>
  )
}

export default function SimulateursUI() {
  const [tab, setTab] = useState<CalcTab>('fiscal')

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <span style={s.heroBadge}>
          <Calculator size={13} weight="fill" />
          4 simulateurs gratuits
        </span>
        <h1 style={s.heroTitle}>
          Simulateurs <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>LCD</em>
        </h1>
        <p style={s.heroDesc}>
          Estime ton imposition, choisis ton statut, calcule ta rentabilité et la taxe de séjour applicable. Tout en quelques secondes.
        </p>
      </div>

      <div style={s.tabs}>
        <button onClick={() => setTab('fiscal')} style={{ ...s.tab, ...(tab === 'fiscal' ? s.tabActive : {}) }}>
          <CurrencyEur size={14} weight="fill" /> Fiscalité LCD
        </button>
        <button onClick={() => setTab('statut')} style={{ ...s.tab, ...(tab === 'statut' ? s.tabActive : {}) }}>
          <Scales size={14} weight="fill" /> EI vs SASU
        </button>
        <button onClick={() => setTab('rentabilite')} style={{ ...s.tab, ...(tab === 'rentabilite' ? s.tabActive : {}) }}>
          <ChartLineUp size={14} weight="fill" /> Rentabilité
        </button>
        <button onClick={() => setTab('taxe')} style={{ ...s.tab, ...(tab === 'taxe' ? s.tabActive : {}) }}>
          <MapPin size={14} weight="fill" /> Taxe de séjour
        </button>
      </div>

      <div style={s.body}>
        {tab === 'fiscal' && <FiscalLCD />}
        {tab === 'statut' && <EIvsSASU />}
        {tab === 'rentabilite' && <Rentabilite />}
        {tab === 'taxe' && <div style={s.placeholder}>Bientôt disponible.</div>}
      </div>
    </div>
  )
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
    display: 'flex', gap: '6px', padding: '4px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '8px 14px', fontSize: '12.5px', fontWeight: 500,
    color: 'var(--text-2)', background: 'transparent',
    border: 'none', borderRadius: '9px', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  tabActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
  },
  body: { minHeight: '200px' },
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
  field: { display: 'flex', flexDirection: 'column' as const, gap: '7px' },
  label: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const, color: 'var(--text-3)',
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
    background: 'rgba(96,165,250,0.06)',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: '9px',
    fontSize: '11.5px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.5, marginTop: '4px',
  },
}
