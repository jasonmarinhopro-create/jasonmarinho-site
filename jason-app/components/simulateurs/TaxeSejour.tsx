'use client'

import { useState, useMemo } from 'react'
import { Info } from '@phosphor-icons/react/dist/ssr'
import type { AccountStats } from '@/lib/lcd/account-stats'
import { s, fmtEur } from './_shared'

// Tarifs par personne / nuit (€), barème 2025 indicatif
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

export default function TaxeSejour({ accountStats }: { accountStats?: AccountStats }) {
  const defaultCityId = (() => {
    const firstVille = accountStats?.villes?.[0]
    if (!firstVille) return 'paris'
    const normalized = firstVille.toLowerCase().trim()
    const found = CITIES.find(c => c.name.toLowerCase() === normalized)
    return found?.id ?? 'paris'
  })()
  const defaultPrix = accountStats && accountStats.adrMoyen > 0 ? accountStats.adrMoyen : 120
  const [cityId, setCityId] = useState<string>(defaultCityId)
  const [classement, setClassement] = useState<Classement>('nc')
  const [adultes, setAdultes] = useState(2)
  const [nuits, setNuits] = useState(3)
  const [prixNuit, setPrixNuit] = useState(defaultPrix)

  const r = useMemo(() => {
    const city = CITIES.find(c => c.id === cityId) ?? CITIES[0]
    const cap = city.rates[classement]

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
