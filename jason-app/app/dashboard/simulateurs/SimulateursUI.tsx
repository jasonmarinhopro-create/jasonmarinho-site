'use client'

import { useState, useMemo, useEffect } from 'react'
import { Calculator, Scales, CurrencyEur, Info, House, MapPin, ChartLineUp, TrendUp, Storefront } from '@phosphor-icons/react/dist/ssr'
import { citiesByCountry, estimateRevenue, calculatePrice, SUPPORTED_COUNTRIES, type MarketBenchmark } from '@/lib/lcd/market-benchmarks'

type Pays = MarketBenchmark['pays']
import type { LogementPrefill } from './page'

type CalcTab = 'fiscal' | 'statut' | 'rentabilite' | 'taxe' | 'revenus' | 'prix' | 'mesvilles'

interface Props {
  logementsPrefill?: LogementPrefill[]
}

// Mapping type_logement DB → clé engine (engine attend studio/t1/t2/t3/maison)
function normalizeType(raw: string | null | undefined): string {
  if (!raw) return 't2'
  const s = String(raw).toLowerCase()
  if (s.includes('studio')) return 'studio'
  if (s.includes('maison') || s.includes('villa') || s.includes('house')) return 'maison'
  if (s.includes('t1') || s.includes('1 piece') || s.includes('1 pièce')) return 't1'
  if (s.includes('t3') || s.includes('3 piece') || s.includes('3 pièce')) return 't3'
  return 't2'
}

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
  // 'non_classe' = meublé tourisme non classé : 30 % / 15 000 € (loi Le Meur 2025+)
  // 'classe'     = meublé tourisme classé Atout France : 50 % / 77 700 € (loi Le Meur 2025+)
  // 'cdh'        = chambres d'hôtes : 50 % / 77 700 € depuis la décision CE du 16/09/2025
  //                qui a confirmé l'alignement sur le régime des meublés classés
  //                (CGI art. 50-0, 2°). L'ancien régime 71 % / 188 700 € n'est plus
  //                applicable.
  const [regime, setRegime] = useState<'non_classe' | 'classe' | 'cdh'>('non_classe')
  const [autresRevenus, setAutresRevenus] = useState(45000)

  const result = useMemo(() => {
    // Loi Le Meur (n° 2024-1039 du 19 nov 2024), revenus 2025+
    // Confirmation : décision Conseil d'État 16/09/2025 pour les chambres d'hôtes
    const config = regime === 'non_classe'
      ? { plafond: 15000, tauxAbattement: 0.30 }
      : { plafond: 77700, tauxAbattement: 0.50 } // classé OU chambres d'hôtes : même régime
    const sousPlafond = ca <= config.plafond
    const baseImposable = sousPlafond ? ca * (1 - config.tauxAbattement) : ca
    // Économie marginale si passage non classé → classé (= 50 %−30 % = 20 pts)
    const economieClassement = ca * (0.50 - 0.30)
    return { ...config, sousPlafond, baseImposable, economieClassement }
  }, [ca, regime])

  // Statut LMNP / LMP (depuis loi Macron 2020) : 2 conditions cumulatives pour LMP :
  // (a) CA LCD > 23 000 € ET (b) CA LCD > autres revenus pro du foyer.
  const statut = useMemo(() => {
    const seuilCA = 23000
    const conditionA = ca > seuilCA
    const conditionB = ca > autresRevenus
    const isLMP = conditionA && conditionB
    // Bénéfice estimé = base imposable du micro-BIC (approximation pédagogique).
    const beneficeEstime = ca * (1 - result.tauxAbattement)
    // Cotisations sociales SSI (Sécurité Sociale des Indépendants) si LMP :
    // ~35% en moyenne du bénéfice net. Tranche basse ~30%, haute ~43%.
    const cotisLMP = isLMP ? beneficeEstime * 0.35 : 0
    // Raison contextuelle pour expliquer pourquoi le user est LMNP malgré
    // un éventuel dépassement de 23 k€ (cas le plus pédagogique).
    let lmnpReason = ''
    if (!isLMP) {
      if (!conditionA && !conditionB) {
        lmnpReason = `Tes ${fmtEur(ca)} de CA LCD sont sous les deux seuils (23 000 € et tes autres revenus pro).`
      } else if (!conditionA) {
        lmnpReason = `Ta LCD ne dépasse pas 23 000 € (actuellement ${fmtEur(ca)}). C'est la première condition à franchir.`
      } else {
        // conditionA vraie, conditionB fausse : cas du salarié qui dépasse 23k mais reste pro
        lmnpReason = `Tu as dépassé les 23 000 €, MAIS tes autres revenus pro (${fmtEur(autresRevenus)}) restent supérieurs à ta LCD (${fmtEur(ca)}). Tant que ta LCD n'est pas ta source principale de revenus, tu restes particulier.`
      }
    }
    return { isLMP, conditionA, conditionB, cotisLMP, seuilCA, beneficeEstime, lmnpReason }
  }, [ca, autresRevenus, result.tauxAbattement])

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
          <label style={s.label}>Type d&apos;activité</label>
          <div style={{ ...s.toggleRow, flexWrap: 'wrap' as const }}>
            <button onClick={() => setRegime('non_classe')} style={{ ...s.toggleBtn, ...(regime === 'non_classe' ? s.toggleActive : {}) }}>Meublé non classé</button>
            <button onClick={() => setRegime('classe')} style={{ ...s.toggleBtn, ...(regime === 'classe' ? s.toggleActive : {}) }}>Meublé classé 1–5★</button>
            <button onClick={() => setRegime('cdh')} style={{ ...s.toggleBtn, ...(regime === 'cdh' ? s.toggleActive : {}) }}>Chambres d&apos;hôtes</button>
          </div>
          <div style={s.helper}>
            Abattement {result.tauxAbattement * 100} % · plafond {fmtEur(result.plafond)}
            {regime === 'cdh' && <> · CE 16/09/2025</>}
            {regime !== 'cdh' && <> · loi Le Meur 2025+</>}
          </div>
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
              <div style={{ ...s.resultValue, color: 'var(--success-1)' }}>OK</div>
              <div style={s.resultHint}>Sous le plafond {fmtEur(result.plafond)}</div>
            </div>
          </>
        ) : (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={s.resultLabel}>Plafond dépassé</div>
            <div style={{ ...s.resultValue, color: 'var(--danger)' }}>Régime réel</div>
            <div style={s.resultHint}>Tu dépasses le plafond {fmtEur(result.plafond)} → bascule au réel obligatoire l&apos;année suivante</div>
          </div>
        )}
        {regime === 'non_classe' && ca > 0 && (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}>
            <div style={s.resultLabel}>Si tu te fais classer Atout France</div>
            <div style={{ ...s.resultValue, color: 'var(--success-1)', fontSize: '20px' }}>− {fmtEur(result.economieClassement)} de base imposable</div>
            <div style={s.resultHint}>
              Économie estimée d&apos;impôt : ~{fmtEur(result.economieClassement * 0.30)} (à TMI 30 %).
              Le classement fait aussi passer ton plafond CA de 15 000 € à 77 700 €.
            </div>
          </div>
        )}
        {regime === 'cdh' && ca > 0 && (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', background: 'rgba(255,213,107,0.06)', borderColor: 'rgba(255,213,107,0.25)' }}>
            <div style={s.resultLabel}>Bon à savoir, chambres d&apos;hôtes</div>
            <div style={{ ...s.resultValue, color: 'var(--accent-text)', fontSize: '15px', fontFamily: 'inherit', fontWeight: 600 }}>
              Régime aligné sur les meublés classés
            </div>
            <div style={s.resultHint}>
              Depuis la <strong>décision du Conseil d&apos;État du 16 septembre 2025</strong>, les chambres
              d&apos;hôtes relèvent du 2° de l&apos;article 50-0 du CGI : abattement de 50 % et plafond
              de 77 700 € (mêmes paramètres que les meublés de tourisme classés).
              L&apos;ancien régime à 71 % d&apos;abattement n&apos;est plus applicable.
              <br />Limite légale d&apos;activité : 5 chambres et 15 voyageurs simultanés
              (art. L.324-3 du Code du tourisme).
              {ca > 50000 && (
                <><br /><strong style={{ color: 'var(--warning)' }}>⚠️ Si tes charges réelles dépassent 50 % du CA,
                  le régime réel sera probablement plus avantageux que le micro-BIC.</strong></>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Statut LMNP / LMP ─── */}
      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <style>{`
          .lmp-section-row {
            display: grid;
            grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
            gap: 16px;
            width: 100%;
            align-items: stretch;
          }
          .lmp-section-row > * { min-width: 0; }
          .lmp-conds-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 12px;
          }
          @media (max-width: 720px) {
            .lmp-section-row,
            .lmp-conds-row { grid-template-columns: 1fr !important; }
          }
        `}</style>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px', letterSpacing: '-.1px' }}>
            Statut LMNP ou LMP ?
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>
            Au-delà de <strong style={{ color: 'var(--text-2)' }}>23 000 € de CA LCD</strong>
            {' '}<em>ET</em> si tes revenus locatifs dépassent tes autres revenus pro du foyer,
            tu bascules automatiquement en LMP (Loueur Meublé Professionnel) — pas un choix, la loi.
            <br />
            <strong style={{ color: 'var(--text-2)' }}>Les 2 conditions doivent être remplies en même temps.</strong>
            {' '}Si tu rates l&apos;une des deux (par exemple ton salaire reste supérieur à ta LCD), tu restes particulier (LMNP).
          </div>
        </div>
        <div className="lmp-section-row">
          <div style={s.field}>
            <label style={s.label}>Tes autres revenus pro du foyer / an</label>
            <div style={s.inputWrap}>
              <input type="number" value={autresRevenus} onChange={e => setAutresRevenus(Math.max(0, Number(e.target.value)))}
                style={s.input} min={0} step={1000} />
              <span style={s.suffix}>€</span>
            </div>
            <input type="range" value={autresRevenus} onChange={e => setAutresRevenus(Number(e.target.value))}
              min={0} max={100000} step={1000} style={s.range} />
            <div style={s.helper}>Salaires, BNC, autres BIC, retraites du foyer fiscal (hors LCD).</div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Verdict</label>
            <div style={{
              padding: '14px 16px', borderRadius: '12px',
              background: statut.isLMP ? 'rgba(251,146,60,0.10)' : 'rgba(16,185,129,0.10)',
              border: `1px solid ${statut.isLMP ? 'rgba(251,146,60,0.30)' : 'rgba(16,185,129,0.30)'}`,
              height: '100%', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const,
                color: statut.isLMP ? '#d97706' : '#059669', marginBottom: '4px' }}>
                {statut.isLMP ? '⚠️ Tu bascules en LMP' : '✓ Tu restes en LMNP'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.45 }}>
                {statut.isLMP
                  ? 'Particulier devenant pro. Cotisations sociales SSI à la clé.'
                  : 'Statut particulier conservé. Pas de cotisations sociales.'}
              </div>
              {!statut.isLMP && statut.lmnpReason && (
                <div style={{
                  marginTop: '10px', paddingTop: '10px',
                  borderTop: '1px solid rgba(16,185,129,0.18)',
                  fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5,
                }}>
                  <strong style={{ color: '#059669' }}>Pourquoi&nbsp;? </strong>
                  {statut.lmnpReason}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Détail des 2 conditions avec checkmarks visuels */}
      <div className="lmp-conds-row">
        <div style={{
          padding: '10px 12px', borderRadius: '10px',
          background: statut.conditionA ? 'rgba(251,146,60,0.08)' : 'rgba(16,185,129,0.06)',
          border: `1px solid ${statut.conditionA ? 'rgba(251,146,60,0.25)' : 'rgba(16,185,129,0.20)'}`,
          fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '14px' }}>{statut.conditionA ? '⚠️' : '✓'}</span>
          <span style={{ color: 'var(--text)' }}>
            <strong>CA &gt; 23 000 €</strong>
            <span style={{ color: 'var(--text-3)' }}> · actuellement {fmtEur(ca)}</span>
          </span>
        </div>
        <div style={{
          padding: '10px 12px', borderRadius: '10px',
          background: statut.conditionB ? 'rgba(251,146,60,0.08)' : 'rgba(16,185,129,0.06)',
          border: `1px solid ${statut.conditionB ? 'rgba(251,146,60,0.25)' : 'rgba(16,185,129,0.20)'}`,
          fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '14px' }}>{statut.conditionB ? '⚠️' : '✓'}</span>
          <span style={{ color: 'var(--text)' }}>
            <strong>CA &gt; autres revenus</strong>
            <span style={{ color: 'var(--text-3)' }}> · {fmtEur(ca)} vs {fmtEur(autresRevenus)}</span>
          </span>
        </div>
      </div>

      {/* Conséquences détaillées selon le statut */}
      {statut.isLMP ? (
        <div style={{
          marginTop: '12px', padding: '14px 16px', borderRadius: '12px',
          background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.20)',
        }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#d97706', marginBottom: '8px',
            textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            Ce qui change en LMP
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: 1.7, color: 'var(--text-2)' }}>
            <li><strong style={{ color: 'var(--text)' }}>Cotisations URSSAF (SSI)</strong> ~35% du bénéfice net
              {statut.cotisLMP > 0 && <> → estimé <strong style={{ color: '#d97706' }}>{fmtEur(statut.cotisLMP)}/an</strong></>}
            </li>
            <li><strong style={{ color: 'var(--text)' }}>Plus-values pro</strong> au lieu de privées
              {' '}<span style={{ color: 'var(--text-3)' }}>(exonération si CA &lt; 90 k€ HT pendant 5 ans)</span>
            </li>
            <li><strong style={{ color: 'var(--text)' }}>Déficits imputables sur ton revenu global</strong>
              {' '}(LMNP : déficits utilisables uniquement sur futurs loyers meublés)</li>
            <li><strong style={{ color: 'var(--text)' }}>Biens loués sortis de l&apos;assiette IFI</strong></li>
            <li>Immatriculation INSEE / SIRET obligatoire</li>
          </ul>
        </div>
      ) : (
        <div style={{
          marginTop: '12px', padding: '14px 16px', borderRadius: '12px',
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.20)',
        }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#059669', marginBottom: '8px',
            textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            Tu restes LMNP — ce que ça implique
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: 1.7, color: 'var(--text-2)' }}>
            <li><strong style={{ color: 'var(--text)' }}>Pas de cotisations sociales URSSAF</strong>
              {' '}(juste 17,2% prélèvements sociaux si régime réel)</li>
            <li><strong style={{ color: 'var(--text)' }}>Plus-values privées</strong>
              {' '}(abattement durée détention)</li>
            <li><strong style={{ color: 'var(--text)' }}>Déficits imputables uniquement</strong>
              {' '}sur futurs revenus de location meublée (10 ans max)</li>
            <li>Biens inclus dans l&apos;assiette IFI</li>
          </ul>
        </div>
      )}

      <div style={s.disclaimer}>
        <Info size={11} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>Estimation pédagogique. Le régime <strong>réel simplifié</strong> peut être plus avantageux au-delà de 30 k€/an si tu as des charges (amortissement, intérêts, travaux). Les cotisations SSI varient selon le bénéfice net réel et ton plan retraite. Consulte un expert-comptable.</span>
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
        <Info size={11} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>Modèle simplifié. La SASU peut combiner salaire + dividendes. La protection sociale, la retraite et l&apos;ACRE ne sont pas modélisées. Consulte un expert-comptable.</span>
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

  const sante = r.margePct >= 40 ? { color: 'var(--success-1)', label: 'Excellente' }
              : r.margePct >= 20 ? { color: 'var(--warning)', label: 'Correcte' }
              : { color: 'var(--danger)', label: 'Faible' }

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
        <Info size={11} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>Estimation pour <strong>1 logement</strong>. Ne tient pas compte des impôts, taxes spécifiques (CFE, taxe foncière) ni travaux. Pour une vue complète, ajoute ~20-30 % de charges supplémentaires.</span>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
 * 4. TAXE DE SÉJOUR
 * ────────────────────────────────────────── */

// Tarifs par personne / nuit (€), barème 2025 indicatif
// nc = non classé (cap 5% du prix), 12 = 1-2★, 3 = 3★, 45 = 4-5★/Palace
type CityRates = { nc: number; '12': number; '3': number; '45': number }
type City = { id: string; name: string; rates: CityRates }

const CITIES: City[] = [
  { id: 'paris',       name: 'Paris',                   rates: { nc: 5.20, '12': 1.13, '3': 1.95, '45': 5.20 } },
  { id: 'cannes',      name: 'Cannes',                  rates: { nc: 5.00, '12': 1.10, '3': 1.90, '45': 4.50 } },
  { id: 'nice',        name: 'Nice',                    rates: { nc: 3.50, '12': 0.83, '3': 1.50, '45': 2.30 } },
  { id: 'lyon',        name: 'Lyon',                    rates: { nc: 3.46, '12': 0.99, '3': 1.65, '45': 2.53 } },
  { id: 'bordeaux',    name: 'Bordeaux',                rates: { nc: 3.40, '12': 0.83, '3': 1.40, '45': 2.10 } },
  { id: 'annecy',      name: 'Annecy',                  rates: { nc: 3.30, '12': 0.85, '3': 1.45, '45': 2.10 } },
  { id: 'biarritz',    name: 'Biarritz',                rates: { nc: 3.20, '12': 0.85, '3': 1.40, '45': 2.10 } },
  { id: 'aix',         name: 'Aix-en-Provence',         rates: { nc: 3.00, '12': 0.85, '3': 1.45, '45': 2.10 } },
  { id: 'chamonix',    name: 'Chamonix',                rates: { nc: 2.90, '12': 0.78, '3': 1.30, '45': 2.05 } },
  { id: 'strasbourg',  name: 'Strasbourg',              rates: { nc: 2.80, '12': 0.78, '3': 1.30, '45': 1.90 } },
  { id: 'avignon',     name: 'Avignon',                 rates: { nc: 2.65, '12': 0.75, '3': 1.30, '45': 1.95 } },
  { id: 'marseille',   name: 'Marseille',               rates: { nc: 2.42, '12': 0.83, '3': 1.40, '45': 2.10 } },
  { id: 'montpellier', name: 'Montpellier',             rates: { nc: 2.30, '12': 0.75, '3': 1.20, '45': 1.80 } },
  { id: 'nantes',      name: 'Nantes',                  rates: { nc: 2.20, '12': 0.70, '3': 1.15, '45': 1.75 } },
  { id: 'toulon',      name: 'Toulon',                  rates: { nc: 2.20, '12': 0.70, '3': 1.20, '45': 1.80 } },
  { id: 'la-rochelle', name: 'La Rochelle',             rates: { nc: 2.20, '12': 0.70, '3': 1.20, '45': 1.80 } },
  { id: 'st-malo',     name: 'Saint-Malo',              rates: { nc: 2.15, '12': 0.70, '3': 1.15, '45': 1.75 } },
  { id: 'toulouse',    name: 'Toulouse',                rates: { nc: 2.13, '12': 0.70, '3': 1.20, '45': 1.80 } },
  { id: 'reims',       name: 'Reims',                   rates: { nc: 2.10, '12': 0.65, '3': 1.10, '45': 1.65 } },
  { id: 'lille',       name: 'Lille',                   rates: { nc: 2.00, '12': 0.65, '3': 1.10, '45': 1.65 } },
  { id: 'rouen',       name: 'Rouen',                   rates: { nc: 1.95, '12': 0.65, '3': 1.10, '45': 1.65 } },
  { id: 'tours',       name: 'Tours',                   rates: { nc: 1.95, '12': 0.65, '3': 1.10, '45': 1.65 } },
  { id: 'nimes',       name: 'Nîmes',                   rates: { nc: 1.95, '12': 0.65, '3': 1.10, '45': 1.65 } },
  { id: 'caen',        name: 'Caen',                    rates: { nc: 1.85, '12': 0.60, '3': 1.05, '45': 1.55 } },
  { id: 'dijon',       name: 'Dijon',                   rates: { nc: 1.85, '12': 0.60, '3': 1.05, '45': 1.55 } },
  { id: 'grenoble',    name: 'Grenoble',                rates: { nc: 1.85, '12': 0.60, '3': 1.05, '45': 1.55 } },
  { id: 'metz',        name: 'Metz',                    rates: { nc: 1.80, '12': 0.60, '3': 1.05, '45': 1.55 } },
  { id: 'le-havre',    name: 'Le Havre',                rates: { nc: 1.75, '12': 0.55, '3': 1.00, '45': 1.50 } },
  { id: 'brest',       name: 'Brest',                   rates: { nc: 1.65, '12': 0.55, '3': 1.00, '45': 1.50 } },
  { id: 'perpignan',   name: 'Perpignan',               rates: { nc: 1.50, '12': 0.55, '3': 0.95, '45': 1.40 } },
]

type Classement = 'nc' | '12' | '3' | '45'
const CLASSEMENT_LABELS: Record<Classement, string> = {
  nc: 'Non classé',
  '12': '1–2★',
  '3': '3★',
  '45': '4–5★ / Palace',
}

function TaxeSejour() {
  const [cityId, setCityId] = useState<string>('paris')
  const [classement, setClassement] = useState<Classement>('nc')
  const [adultes, setAdultes] = useState(2)
  const [nuits, setNuits] = useState(3)
  const [prixNuit, setPrixNuit] = useState(120)

  const r = useMemo(() => {
    const city = CITIES.find(c => c.id === cityId) ?? CITIES[0]
    const cap = city.rates[classement]

    // Pour non classé : 5 % du prix par personne, plafonné au cap palace de la ville
    let tarifNuitPersonne: number
    if (classement === 'nc') {
      const cinqPct = (prixNuit * 0.05) / Math.max(1, adultes)
      tarifNuitPersonne = Math.min(cinqPct, cap)
    } else {
      tarifNuitPersonne = cap
    }

    const taxeCommunale = tarifNuitPersonne * adultes * nuits
    const taxeDept = taxeCommunale * 0.10
    const total = taxeCommunale + taxeDept

    // Comparaison avec 3 villes différentes
    const others = CITIES.filter(c => c.id !== cityId).slice(0, 3).map(c => {
      const otherCap = c.rates[classement]
      let tarifOther: number
      if (classement === 'nc') {
        const cinqPct = (prixNuit * 0.05) / Math.max(1, adultes)
        tarifOther = Math.min(cinqPct, otherCap)
      } else {
        tarifOther = otherCap
      }
      const totalOther = tarifOther * adultes * nuits * 1.10
      return { name: c.name, total: totalOther }
    })

    return { city, tarifNuitPersonne, taxeCommunale, taxeDept, total, others }
  }, [cityId, classement, adultes, nuits, prixNuit])

  return (
    <div style={s.calc}>
      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Ville</label>
          <select value={cityId} onChange={e => setCityId(e.target.value)}
            style={{ ...s.input, padding: '11px 14px', cursor: 'pointer' }}>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={s.helper}>30 villes touristiques · barème 2025 indicatif</div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Classement</label>
          <div style={{ ...s.toggleRow, flexWrap: 'wrap' as const }}>
            {(Object.keys(CLASSEMENT_LABELS) as Classement[]).map(c => (
              <button key={c} onClick={() => setClassement(c)}
                style={{ ...s.toggleBtn, ...(classement === c ? s.toggleActive : {}) }}>
                {CLASSEMENT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Adultes (≥18 ans)</label>
          <div style={s.inputWrap}>
            <input type="number" value={adultes} onChange={e => setAdultes(Math.max(1, Number(e.target.value)))}
              style={s.input} min={1} max={20} step={1} />
            <span style={s.suffix}>pers</span>
          </div>
          <div style={s.helper}>Les &lt;18 ans sont exonérés</div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Nombre de nuits</label>
          <div style={s.inputWrap}>
            <input type="number" value={nuits} onChange={e => setNuits(Math.max(1, Number(e.target.value)))}
              style={s.input} min={1} step={1} />
            <span style={s.suffix}>nuits</span>
          </div>
        </div>
      </div>

      {classement === 'nc' && (
        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Prix d&apos;une nuit (total)</label>
            <div style={s.inputWrap}>
              <input type="number" value={prixNuit} onChange={e => setPrixNuit(Math.max(0, Number(e.target.value)))}
                style={s.input} min={0} step={5} />
              <span style={s.suffix}>€</span>
            </div>
            <div style={s.helper}>Pour calculer le 5% par personne</div>
          </div>
        </div>
      )}

      <div style={s.results}>
        <div style={{ ...s.resultBox, gridColumn: '1 / -1', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
          <div style={s.resultLabel}>Taxe de séjour totale à collecter</div>
          <div style={{ ...s.resultValue, color: 'var(--accent-text)', fontSize: '32px' }}>
            {fmtEur(r.total, 2)}
          </div>
          <div style={s.resultHint}>
            {fmtEur(r.tarifNuitPersonne, 2)}/personne/nuit × {adultes} adulte{adultes > 1 ? 's' : ''} × {nuits} nuit{nuits > 1 ? 's' : ''}
          </div>
        </div>

        <div style={s.resultBox}>
          <div style={s.resultLabel}>Taxe communale</div>
          <div style={s.resultValue}>{fmtEur(r.taxeCommunale, 2)}</div>
          <div style={s.resultHint}>Reversée à {r.city.name}</div>
        </div>
        <div style={s.resultBox}>
          <div style={s.resultLabel}>Taxe départementale (+10 %)</div>
          <div style={s.resultValue}>{fmtEur(r.taxeDept, 2)}</div>
          <div style={s.resultHint}>Additionnelle obligatoire</div>
        </div>

        <div style={{ ...s.resultBox, gridColumn: '1 / -1' }}>
          <div style={s.resultLabel}>Comparaison avec d&apos;autres villes</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginTop: '6px' }}>
            {r.others.map(o => (
              <div key={o.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-2)' }}>
                <span>{o.name}</span>
                <span style={{ fontWeight: 600 }}>{fmtEur(o.total, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.disclaimer}>
        <Info size={11} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>Tarifs <strong>indicatifs 2025</strong>. Chaque mairie fixe son barème, vérifie sur le site officiel <em>impots.gouv.fr</em> ou ta mairie. La taxe départementale (10 %) est additionnée automatiquement.</span>
      </div>
    </div>
  )
}

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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
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

/* Sous-composant : ligne benchmark Toi vs Marché */
function BenchmarkRow({ label, toi, marche, toiNum, marcheNum }: {
  label: string; toi: string; marche: string; toiNum: number; marcheNum: number
}) {
  const diffPct = marcheNum > 0 ? Math.round(((toiNum - marcheNum) / marcheNum) * 100) : 0
  const isAbove = diffPct > 5
  const isBelow = diffPct < -5
  return (
    <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-2)' }}>
      <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.3px', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '11px', color: 'var(--text-3)' }}>
        <span>Toi</span>
        <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: isAbove ? 'var(--success-1)' : isBelow ? '#F59E0B' : 'var(--text)' }}>{toi}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
        <span>Marché</span>
        <span>{marche}</span>
      </div>
      {Math.abs(diffPct) >= 5 && (
        <div style={{
          fontSize: '10.5px', fontWeight: 600,
          color: isAbove ? 'var(--success-1)' : '#F59E0B',
          marginTop: '4px',
        }}>
          {isAbove ? '▲' : '▼'} {Math.abs(diffPct)} % {isAbove ? 'au-dessus' : 'en dessous'}
        </div>
      )}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
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
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 140px 32px', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: ['#10b981', '#3b82f6', '#f59e0b', '#a78bfa'][i],
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700,
                }}>{i + 1}</div>
                <select value={sel.ville} onChange={e => updateSelection(i, 'ville', e.target.value)} style={s.input}>
                  {citiesByCountry(sel.pays).map(c => (
                    <option key={c.ville} value={c.ville}>
                      {c.ville}{villesLogements.some(v => v.pays === sel.pays && v.ville === c.ville) ? ' ★ (mon bien)' : ''}
                    </option>
                  ))}
                </select>
                <select value={sel.pays} onChange={e => updateSelection(i, 'pays', e.target.value)} style={{ ...s.input, fontSize: '12.5px' }}>
                  {SUPPORTED_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.label}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => removeCity(i)}
                  disabled={selection.length <= 2}
                  style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-muted)', cursor: selection.length <= 2 ? 'not-allowed' : 'pointer',
                    fontSize: '13px', opacity: selection.length <= 2 ? 0.3 : 1,
                  }}
                  title="Retirer"
                >✕</button>
                {isMine && (
                  <div style={{
                    gridColumn: '2 / 4',
                    fontSize: '10.5px',
                    color: 'var(--accent-text)',
                    fontWeight: 600,
                    marginTop: '-2px',
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

      {/* Tableau comparatif */}
      <div style={{ ...s.resultCard, marginTop: '14px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' }}>
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

function MiniBox({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: '10px',
      background: highlight ? 'linear-gradient(135deg, rgba(99,214,131,0.10) 0%, var(--bg-2) 100%)' : 'var(--bg-2)',
      border: '1px solid ' + (highlight ? 'rgba(99,214,131,0.25)' : 'var(--border)'),
    }}>
      <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: highlight ? 'var(--success-1)' : 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

export default function SimulateursUI({ logementsPrefill = [] }: Props) {
  const [tab, setTab] = useState<CalcTab>('revenus')

  return (
    <div style={s.page}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Selects en vert Jason quand ouverts */
        .sim-root select option { background-color: var(--bg-2); color: var(--text); padding: 8px 12px; font-weight: 500; }
        .sim-root select option:hover { background-color: var(--accent-bg); }
        .sim-root select option:checked { background: var(--accent-text); color: var(--bg); font-weight: 700; }
        /* Checkbox custom élégante */
        .jm-check { display: flex !important; align-items: center; gap: 10px; cursor: pointer; padding: 12px 14px !important; border-radius: 10px; background: linear-gradient(135deg, rgba(0,76,63,.05) 0%, rgba(255,213,107,.06) 100%); border: 1px solid var(--accent-border); transition: all .2s cubic-bezier(.4,0,.2,1); margin-top: 4px !important; }
        .jm-check:hover { border-color: var(--accent-text); background: linear-gradient(135deg, rgba(0,76,63,.10) 0%, rgba(255,213,107,.12) 100%); }
        .jm-check input[type="checkbox"] { appearance: none; -webkit-appearance: none; width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--accent-border); background: var(--bg); cursor: pointer; flex-shrink: 0; position: relative; transition: all .15s; margin: 0; }
        .jm-check input[type="checkbox"]:hover { border-color: var(--accent-text); }
        .jm-check input[type="checkbox"]:checked { background: var(--accent-text); border-color: var(--accent-text); }
        .jm-check input[type="checkbox"]:checked::after { content: ''; position: absolute; top: 3px; left: 6px; width: 5px; height: 9px; border: solid var(--bg); border-width: 0 2px 2px 0; transform: rotate(45deg); }
        .jm-check span { font-size: 13.5px; color: var(--text); font-weight: 500; line-height: 1.4; }
        .jm-check span strong { color: var(--accent-text); }
      ` }} />
      <div className="sim-root" style={{}}>
      <div style={s.hero}>
        <span style={s.heroBadge}>
          <Calculator size={13} weight="fill" />
          4 simulateurs fiscaux
        </span>
        <h1 style={s.heroTitle}>
          Simulateurs <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>fiscaux</em>
        </h1>
        <p style={s.heroDesc}>
          Calcule ton imposition, choisis ton statut, estime ta taxe de séjour, projette ta rentabilité nette. Tout en quelques secondes, préfilé avec tes vrais logements. Pour estimer revenus et prix, file dans <a href="/dashboard/calculateurs" style={{ color: 'var(--accent-text)', textDecoration: 'underline', textDecorationThickness: '1px', textUnderlineOffset: '3px' }}>Calculateurs marché</a>.
        </p>
      </div>

      <div style={s.tabs}>
        <button onClick={() => setTab('fiscal')} style={{ ...s.tab, ...(tab === 'fiscal' ? s.tabActive : {}) }}>
          <CurrencyEur size={14} weight="fill" /> Fiscalité
        </button>
        <button onClick={() => setTab('statut')} style={{ ...s.tab, ...(tab === 'statut' ? s.tabActive : {}) }}>
          <Scales size={14} weight="fill" /> EI vs SASU
        </button>
        <button onClick={() => setTab('rentabilite')} style={{ ...s.tab, ...(tab === 'rentabilite' ? s.tabActive : {}) }}>
          <ChartLineUp size={14} weight="fill" /> Rentabilité
        </button>
        <button onClick={() => setTab('taxe')} style={{ ...s.tab, ...(tab === 'taxe' ? s.tabActive : {}) }}>
          <House size={14} weight="fill" /> Taxe de séjour
        </button>
      </div>

      <div style={s.body}>
        {tab === 'fiscal' && <FiscalLCD />}
        {tab === 'statut' && <EIvsSASU />}
        {tab === 'rentabilite' && <Rentabilite />}
        {tab === 'taxe' && <TaxeSejour />}
      </div>
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
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px',
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
