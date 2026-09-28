'use client'

import { useState, useMemo } from 'react'
import { Info, CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import type { AccountStats } from '@/lib/lcd/account-stats'
import { FISCAL_PARAMS_2026 } from '@/lib/lcd/fiscal-params'
import { s, fmtEur } from './_shared'
import InlineStyle from '@/components/ui/InlineStyle'

const AMBER = '#B7791F'
const AMBER_BG = 'rgba(255,213,107,0.14)'
const AMBER_BORDER = 'rgba(183,121,31,0.35)'

export default function FiscalLCD({ accountStats }: { accountStats?: AccountStats }) {
  const [ca, setCa] = useState(accountStats && accountStats.caTotal12m > 0 ? Math.round(accountStats.caTotal12m) : 30000)
  // Régime initial déduit du classement majoritaire des logements de l'hôte.
  // Sinon non_classe par défaut (conservateur).
  // 'non_classe' = meublé tourisme non classé : 30 % / 15 000 € (loi Le Meur 2025+)
  // 'classe'     = meublé tourisme classé Atout France : 50 % / 83 600 € en 2026 (loi Le Meur)
  // 'cdh'        = chambres d'hôtes : 50 % / 83 600 € (CE 16/09/2025, 71 % non rétabli par la LFi 2026)
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
    // Abattement minimum de 305 € (art. 50-0 CGI), sans dépasser les recettes
    const abattement = Math.max(ca * config.tauxAbattement, Math.min(microBic.nonClasse.abattementMinimum, ca))
    const baseImposable = Math.max(0, ca - abattement)
    const economieClassement = ca * (microBic.classe.abattement - microBic.nonClasse.abattement)
    return { ...config, sousPlafond, baseImposable, economieClassement }
  }, [ca, regime])

  const statut = useMemo(() => {
    const seuilCA = FISCAL_PARAMS_2026.ei.seuilLmp
    const conditionA = ca > seuilCA
    const conditionB = ca > autresRevenus
    const isLMP = conditionA && conditionB
    const beneficeEstime = ca * (1 - result.tauxAbattement)
    // Location courte durée : au-delà de 23 000 € de recettes, cotisations
    // sociales dues même en LMNP (art. L613-1 CSS), à la place des 18,6 %
    const socialPro = conditionA
    const cotisLMP = socialPro ? beneficeEstime * FISCAL_PARAMS_2026.ei.tauxCotisationsTns : 0
    let lmnpReason = ''
    if (!isLMP) {
      if (!conditionA && !conditionB) {
        lmnpReason = `Tes ${fmtEur(ca)} de CA LCD sont sous les deux seuils (23 000 € et tes autres revenus pro).`
      } else if (!conditionA) {
        lmnpReason = `Ta LCD ne dépasse pas 23 000 € (actuellement ${fmtEur(ca)}). C'est la première condition à franchir.`
      } else {
        lmnpReason = `Tu as dépassé les 23 000 €, mais tes autres revenus d'activité (${fmtEur(autresRevenus)}) restent supérieurs à ta LCD (${fmtEur(ca)}) : tu restes LMNP pour l'impôt. Les cotisations sociales, elles, sont dues dès 23 000 € en courte durée.`
      }
    }
    return { isLMP, socialPro, conditionA, conditionB, cotisLMP, seuilCA, beneficeEstime, lmnpReason }
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
              <div style={{ ...s.resultValue, color: 'var(--accent-text)' }}>OK</div>
              <div style={s.resultHint}>Sous le plafond {fmtEur(result.plafond)}</div>
            </div>
          </>
        ) : (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', borderColor: 'var(--danger-border)' }}>
            <div style={s.resultLabel}>Plafond dépassé</div>
            <div style={{ ...s.resultValue, color: 'var(--danger)' }}>Régime réel</div>
            <div style={s.resultHint}>Tu dépasses le plafond de {fmtEur(result.plafond)}. Un premier dépassement ne change rien ; si ça se répète 2 années de suite, tu passes au régime réel l&apos;année d&apos;après.</div>
          </div>
        )}
        {regime === 'non_classe' && ca > 0 && (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
            <div style={s.resultLabel}>Si tu fais classer ton meublé</div>
            <div style={{ ...s.resultValue, color: 'var(--accent-text)', fontSize: '20px' }}>− {fmtEur(result.economieClassement)} de base imposable</div>
            <div style={s.resultHint}>
              Économie estimée : ~{fmtEur(result.economieClassement * (0.30 + FISCAL_PARAMS_2026.societe.prelevementsSociauxLmnp))} par an (impôt à 30 % + 18,6 % de prélèvements sociaux).
              Le classement fait aussi passer ton plafond CA de 15 000 € à 83 600 € (revenus 2026).
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
              de 83 600 € pour les revenus 2026 (mêmes paramètres que les meublés de tourisme classés).
              L&apos;ancien régime à 71 % d&apos;abattement n&apos;est plus applicable.
              <br />Limite légale d&apos;activité : 5 chambres et 15 voyageurs simultanés
              (art. L.324-3 du Code du tourisme).
              {ca > 50000 && (
                <><br /><strong style={{ color: '#B7791F' }}>Si tes charges réelles dépassent 50 % du CA,
                  le régime réel sera probablement plus avantageux que le micro-BIC.</strong></>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Statut LMNP / LMP ─── */}
      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <InlineStyle css={`
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
        `} />
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px', letterSpacing: '-.1px' }}>
            Statut LMNP ou LMP ?
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>
            Au-delà de <strong style={{ color: 'var(--text-2)' }}>23 000 € de CA LCD</strong>
            {' '}<em>ET</em> si tes revenus locatifs dépassent tes autres revenus pro du foyer,
            tu deviens loueur en meublé professionnel (LMP) pour l&apos;impôt : ce n&apos;est pas un choix.
            <br />
            <strong style={{ color: 'var(--text-2)' }}>Attention, en courte durée les cotisations sociales ne suivent pas cette règle :</strong>
            {' '}elles sont dues dès 23 000 € de recettes, même si tu restes LMNP (salarié par exemple).
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
              background: statut.socialPro ? AMBER_BG : 'var(--accent-bg)',
              border: `1px solid ${statut.socialPro ? AMBER_BORDER : 'var(--accent-border)'}`,
              height: '100%', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const,
                color: statut.socialPro ? AMBER : 'var(--accent-text)', marginBottom: '4px' }}>
                {statut.isLMP ? 'Tu deviens LMP' : statut.socialPro ? 'LMNP, avec cotisations sociales' : 'Tu restes LMNP'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.45 }}>
                {statut.isLMP
                  ? 'Loueur professionnel : cotisations sociales des indépendants et fiscalité des professionnels.'
                  : statut.socialPro
                    ? 'LMNP pour l’impôt, mais cotisations sociales dues au-delà de 23 000 € de recettes en courte durée.'
                    : 'Pas de cotisations sociales : 18,6 % de prélèvements sociaux sur la base imposable.'}
              </div>
              {!statut.isLMP && statut.lmnpReason && (
                <div style={{
                  marginTop: '10px', paddingTop: '10px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5,
                }}>
                  <strong style={{ color: 'var(--text)' }}>Pourquoi&nbsp;? </strong>
                  {statut.lmnpReason}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lmp-conds-row">
        {[
          { on: statut.conditionA, label: <>Recettes &gt; 23 000 €</>, sub: `actuellement ${fmtEur(ca)}` },
          { on: statut.conditionB, label: <>Recettes &gt; autres revenus</>, sub: `${fmtEur(ca)} contre ${fmtEur(autresRevenus)}` },
        ].map((c, i) => (
          <div key={i} style={{
            padding: '10px 12px', borderRadius: '10px',
            background: c.on ? AMBER_BG : 'var(--accent-bg)',
            border: `1px solid ${c.on ? AMBER_BORDER : 'var(--accent-border)'}`,
            fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {c.on ? <WarningCircle size={15} weight="fill" color={AMBER} /> : <CheckCircle size={15} weight="fill" color="var(--accent-text)" />}
            <span style={{ color: 'var(--text)' }}>
              <strong>{c.label}</strong>
              <span style={{ color: 'var(--text-3)' }}> · {c.sub}</span>
            </span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '12px', padding: '14px 16px', borderRadius: '12px',
        background: 'var(--surface)', border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px',
          textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
          {statut.isLMP ? 'Ce qui change en LMP' : 'Tu restes LMNP : ce que ça implique'}
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: 1.7, color: 'var(--text-2)' }}>
          {statut.socialPro ? (
            <li><strong style={{ color: 'var(--text)' }}>Cotisations sociales (Urssaf, indépendants)</strong> à la place des 18,6 % de prélèvements sociaux,
              {' '}environ {Math.round(FISCAL_PARAMS_2026.ei.tauxCotisationsTns * 100)} % du bénéfice : estimé <strong style={{ color: AMBER }}>{fmtEur(statut.cotisLMP)}/an</strong>
              <span style={{ color: 'var(--text-3)' }}> (le simulateur de l&apos;Urssaf donne le montant exact)</span>
            </li>
          ) : (
            <li><strong style={{ color: 'var(--text)' }}>Pas de cotisations sociales</strong>
              {' '}: 18,6 % de prélèvements sociaux sur le bénéfice imposable, en micro-BIC comme au réel</li>
          )}
          {statut.isLMP ? (
            <>
              <li><strong style={{ color: 'var(--text)' }}>Plus-values professionnelles</strong>
                {' '}<span style={{ color: 'var(--text-3)' }}>(exonération possible après 5 ans d&apos;activité si les recettes restent sous 90 000 €)</span>
              </li>
              <li><strong style={{ color: 'var(--text)' }}>Déficits imputables sur ton revenu global</strong></li>
              <li><strong style={{ color: 'var(--text)' }}>Logements loués sortis de l&apos;IFI</strong> (sous conditions)</li>
            </>
          ) : (
            <>
              <li><strong style={{ color: 'var(--text)' }}>Plus-values des particuliers</strong> (abattement pour durée de détention)</li>
              <li><strong style={{ color: 'var(--text)' }}>Déficits imputables uniquement</strong>
                {' '}sur tes futurs revenus de location meublée (10 ans)</li>
              <li>Logements inclus dans l&apos;assiette de l&apos;IFI</li>
            </>
          )}
        </ul>
      </div>

      <div style={s.disclaimer}>
        <Info size={11} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>Estimation pédagogique. Le régime <strong>réel simplifié</strong> peut être plus avantageux au-delà de 30 k€/an si tu as des charges (amortissement, intérêts, travaux). Les cotisations sociales dépendent de ton bénéfice réel et de ton régime (indépendant, micro-entrepreneur). Consulte un expert-comptable.</span>
      </div>
    </div>
  )
}
