'use client'

import { useState, useMemo } from 'react'
import { Info } from '@phosphor-icons/react/dist/ssr'
import type { AccountStats } from '@/lib/lcd/account-stats'
import { FISCAL_PARAMS_2026 } from '@/lib/lcd/fiscal-params'
import { s, fmtEur } from './_shared'

export default function FiscalLCD({ accountStats }: { accountStats?: AccountStats }) {
  const [ca, setCa] = useState(accountStats && accountStats.caTotal12m > 0 ? Math.round(accountStats.caTotal12m) : 30000)
  // Régime initial déduit du classement majoritaire des logements de l'hôte.
  // Sinon non_classe par défaut (conservateur).
  // 'non_classe' = meublé tourisme non classé : 30 % / 15 000 € (loi Le Meur 2025+)
  // 'classe'     = meublé tourisme classé Atout France : 50 % / 77 700 € (loi Le Meur 2025+)
  // 'cdh'        = chambres d'hôtes : 50 % / 77 700 € depuis la décision CE du 16/09/2025
  const [regime, setRegime] = useState<'non_classe' | 'classe' | 'cdh'>(
    accountStats?.defaultRegimeFiscal ?? 'non_classe'
  )
  const [autresRevenus, setAutresRevenus] = useState(45000)

  const result = useMemo(() => {
    const microBic = FISCAL_PARAMS_2026.microBic
    const config = regime === 'non_classe'
      ? { plafond: microBic.nonClasse.plafond, tauxAbattement: microBic.nonClasse.abattement }
      : { plafond: microBic.classe.plafond, tauxAbattement: microBic.classe.abattement }
    const sousPlafond = ca <= config.plafond
    const baseImposable = sousPlafond ? ca * (1 - config.tauxAbattement) : ca
    const economieClassement = ca * (microBic.classe.abattement - microBic.nonClasse.abattement)
    return { ...config, sousPlafond, baseImposable, economieClassement }
  }, [ca, regime])

  const statut = useMemo(() => {
    const seuilCA = FISCAL_PARAMS_2026.ei.seuilLmp
    const conditionA = ca > seuilCA
    const conditionB = ca > autresRevenus
    const isLMP = conditionA && conditionB
    const beneficeEstime = ca * (1 - result.tauxAbattement)
    const cotisLMP = isLMP ? beneficeEstime * 0.35 : 0
    let lmnpReason = ''
    if (!isLMP) {
      if (!conditionA && !conditionB) {
        lmnpReason = `Tes ${fmtEur(ca)} de CA LCD sont sous les deux seuils (23 000 € et tes autres revenus pro).`
      } else if (!conditionA) {
        lmnpReason = `Ta LCD ne dépasse pas 23 000 € (actuellement ${fmtEur(ca)}). C'est la première condition à franchir.`
      } else {
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
