'use client'

import { useState, useMemo } from 'react'
import { Info } from '@phosphor-icons/react/dist/ssr'
import type { AccountStats } from '@/lib/lcd/account-stats'
import { s, fmtEur, fmtPct } from './_shared'

const COMMISSION_PRESETS = [
  { label: 'Direct', value: 0 },
  { label: 'Airbnb', value: 17 },
  { label: 'Booking', value: 18 },
]

export default function Rentabilite({ accountStats }: { accountStats?: AccountStats }) {
  const hasReal = !!(accountStats && accountStats.caTotal12m > 0)
  // Operational
  const [prixNuit, setPrixNuit] = useState(hasReal && accountStats!.adrMoyen > 0 ? accountStats!.adrMoyen : 100)
  const [occupation, setOccupation] = useState(hasReal && accountStats!.occupationMoyenne > 0 ? accountStats!.occupationMoyenne : 65)
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
