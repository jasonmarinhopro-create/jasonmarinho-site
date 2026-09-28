'use client'

import { useState, useMemo } from 'react'
import { Info } from '@phosphor-icons/react/dist/ssr'
import type { AccountStats } from '@/lib/lcd/account-stats'
import { computeTaxeSejour, TAXE_SEJOUR_2026, type CategorieTaxe } from '@/lib/lcd/taxe-sejour'
import { s, fmtEur } from './_shared'

// Taxe de séjour au réel, barème 2026 : plafonds nationaux + tarif voté par la
// commune de l'hôte (saisi), taxes additionnelles départementale et
// Île-de-France. Calcul dans lib/lcd/taxe-sejour.ts (testé).
export default function TaxeSejour({ accountStats }: { accountStats?: AccountStats }) {
  const defaultPrix = accountStats && accountStats.adrMoyen > 0 ? Math.round(accountStats.adrMoyen) : 120
  const enIdf = (accountStats?.villes?.[0] ?? '').trim().toLowerCase() === 'paris'
  const [categorie, setCategorie] = useState<CategorieTaxe>('nc')
  const [tarifCommune, setTarifCommune] = useState(1.7)
  const [tauxPct, setTauxPct] = useState(5)
  const [plafondCommune, setPlafondCommune] = useState(TAXE_SEJOUR_2026.plafondMax)
  const [adultes, setAdultes] = useState(2)
  const [mineurs, setMineurs] = useState(0)
  const [nuits, setNuits] = useState(3)
  const [prixNuit, setPrixNuit] = useState(defaultPrix)
  const [departementale, setDepartementale] = useState(true)
  const [ileDeFrance, setIleDeFrance] = useState(enIdf)

  const cat = TAXE_SEJOUR_2026.categories.find(c => c.id === categorie)!
  const r = useMemo(() => computeTaxeSejour({
    categorie, tarifCommune, taux: tauxPct / 100, plafondCommune, prixNuit,
    adultes, mineurs, nuits, departementale, ileDeFrance,
  }), [categorie, tarifCommune, tauxPct, plafondCommune, prixNuit, adultes, mineurs, nuits, departementale, ileDeFrance])

  function chooseCategorie(c: CategorieTaxe) {
    setCategorie(c)
    const p = TAXE_SEJOUR_2026.categories.find(x => x.id === c)?.plafond
    if (p != null) setTarifCommune(p)
  }

  const additionnelles = r.departementale + r.regionale + r.mobilites

  return (
    <div style={s.calc}>
      <div style={s.row}>
        <div style={{ ...s.field, gridColumn: '1 / -1' }}>
          <label style={s.label}>Classement du logement</label>
          <div style={{ ...s.toggleRow, flexWrap: 'wrap' as const }}>
            {TAXE_SEJOUR_2026.categories.map(c => (
              <button key={c.id} onClick={() => chooseCategorie(c.id)}
                style={{ ...s.toggleBtn, ...(categorie === c.id ? s.toggleActive : {}) }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {categorie === 'nc' ? (
        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Taux voté par ta commune</label>
            <div style={s.inputWrap}>
              <input type="number" value={tauxPct} onChange={e => setTauxPct(Math.min(5, Math.max(1, Number(e.target.value))))}
                style={s.input} min={1} max={5} step={0.5} />
              <span style={s.suffix}>%</span>
            </div>
            <div style={s.helper}>Entre 1 et 5 % du prix de la nuit par personne</div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Tarif le plus élevé voté par ta commune</label>
            <div style={s.inputWrap}>
              <input type="number" value={plafondCommune} onChange={e => setPlafondCommune(Math.min(TAXE_SEJOUR_2026.plafondMax, Math.max(0, Number(e.target.value))))}
                style={s.input} min={0} max={TAXE_SEJOUR_2026.plafondMax} step={0.1} />
              <span style={s.suffix}>€</span>
            </div>
            <div style={s.helper}>Sert de plafond, {fmtEur(TAXE_SEJOUR_2026.plafondMax, 2)} au plus en 2026</div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Prix d&apos;une nuit (logement entier, hors taxe)</label>
            <div style={s.inputWrap}>
              <input type="number" value={prixNuit} onChange={e => setPrixNuit(Math.max(0, Number(e.target.value)))}
                style={s.input} min={0} step={5} />
              <span style={s.suffix}>€</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Tarif voté par ta commune ({cat.label})</label>
            <div style={s.inputWrap}>
              <input type="number" value={tarifCommune} onChange={e => setTarifCommune(Math.max(0, Number(e.target.value)))}
                style={s.input} min={0} max={cat.plafond ?? undefined} step={0.05} />
              <span style={s.suffix}>€</span>
            </div>
            <div style={s.helper}>Par personne et par nuit. Plafond national 2026 : {fmtEur(cat.plafond ?? 0, 2)}</div>
          </div>
        </div>
      )}

      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Adultes</label>
          <div style={s.inputWrap}>
            <input type="number" value={adultes} onChange={e => setAdultes(Math.max(0, Math.round(Number(e.target.value))))}
              style={s.input} min={0} max={20} step={1} />
            <span style={s.suffix}>pers</span>
          </div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Mineurs</label>
          <div style={s.inputWrap}>
            <input type="number" value={mineurs} onChange={e => setMineurs(Math.max(0, Math.round(Number(e.target.value))))}
              style={s.input} min={0} max={20} step={1} />
            <span style={s.suffix}>pers</span>
          </div>
          <div style={s.helper}>Exonérés{categorie === 'nc' ? ', mais comptés pour diviser le prix' : ''}</div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Nombre de nuits</label>
          <div style={s.inputWrap}>
            <input type="number" value={nuits} onChange={e => setNuits(Math.max(1, Math.round(Number(e.target.value))))}
              style={s.input} min={1} step={1} />
            <span style={s.suffix}>nuits</span>
          </div>
        </div>
      </div>

      <div style={s.row}>
        <div style={{ ...s.field, gridColumn: '1 / -1' }}>
          <label style={s.label}>Taxes additionnelles</label>
          <div style={{ ...s.toggleRow, flexWrap: 'wrap' as const }}>
            <button onClick={() => setDepartementale(v => !v)} style={{ ...s.toggleBtn, ...(departementale ? s.toggleActive : {}) }}>
              Départementale +10 %
            </button>
            <button onClick={() => setIleDeFrance(v => !v)} style={{ ...s.toggleBtn, ...(ileDeFrance ? s.toggleActive : {}) }}>
              Île-de-France +15 % et +200 %
            </button>
          </div>
          <div style={s.helper}>La départementale s&apos;applique si ton département l&apos;a votée (la plupart). En Île-de-France s&apos;ajoutent la taxe régionale (15 %) et celle d&apos;Île-de-France Mobilités (200 %).</div>
        </div>
      </div>

      <div style={s.results}>
        <div style={{ ...s.resultBox, gridColumn: '1 / -1', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
          <div style={s.resultLabel}>Taxe de séjour à collecter pour ce séjour</div>
          <div style={{ ...s.resultValue, color: 'var(--accent-text)', fontSize: '32px' }}>
            {fmtEur(r.total, 2)}
          </div>
          <div style={s.resultHint}>
            {fmtEur(r.totalParNuit, 2)} par adulte et par nuit, taxes additionnelles comprises, × {adultes} adulte{adultes > 1 ? 's' : ''} × {nuits} nuit{nuits > 1 ? 's' : ''}
            {r.plafonne && <><br />Plafonné : {categorie === 'nc' ? 'tarif le plus élevé voté par ta commune' : 'plafond national de la catégorie'}</>}
          </div>
        </div>
        <div style={s.resultBox}>
          <div style={s.resultLabel}>Part communale</div>
          <div style={s.resultValue}>{fmtEur(r.communale, 2)}</div>
          <div style={s.resultHint}>{fmtEur(r.tarifParNuit, 2)} par adulte et par nuit</div>
        </div>
        <div style={s.resultBox}>
          <div style={s.resultLabel}>Taxes additionnelles</div>
          <div style={s.resultValue}>{fmtEur(additionnelles, 2)}</div>
          <div style={s.resultHint}>
            {[departementale && 'départementale', ileDeFrance && 'régionale et Île-de-France Mobilités'].filter(Boolean).join(', ') || 'aucune'}
          </div>
        </div>
      </div>

      <div style={s.disclaimer}>
        <Info size={11} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          Plafonds nationaux 2026 : palace 4,90 €, 5★ 3,60 €, 4★ 2,60 €, 3★ 1,70 €, 1★, 2★ et chambres d&apos;hôtes jusqu&apos;à 1,00 €.
          Ta commune vote son propre tarif dans ces limites : reprends celui de sa délibération (mairie ou office de tourisme).
          Si tu loues en non professionnel, les plateformes qui encaissent le paiement (Airbnb, Booking quand il encaisse) collectent la taxe pour toi ; pour tes réservations directes, c&apos;est à toi de la collecter et de la reverser.
        </span>
      </div>
    </div>
  )
}
