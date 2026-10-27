'use client'

// « Où tu interviens » de l'atelier (étape 2, 27/10/2026, maquette validée) :
// ville + rayon au curseur + villes en plus, sur une seule carte. Prévient
// quand une ville citée est déjà dans le rayon, dit en une phrase ce que la
// fiche affichera, et laisse tester « un logement à … ? ». Règles : lib/pros/zone.ts.
// Positions : action serveur `locateCommunes` (geo.api.gouv.fr) ; sans réponse,
// la carte et les conseils se taisent, le reste marche.
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, Lightbulb, MagnifyingGlass, X } from '@phosphor-icons/react/dist/ssr'
import SuggestInput from '@/components/ui/SuggestInput'
import { CITY_OPTIONS } from '@/lib/ui/suggest'
import { parseZone, composeZone, zonePhrase, distanceKm, zoneVerdict, RAYONS, RAYON_MAX } from '@/lib/pros/zone'
import { VILLES_MAX } from '@/lib/pros/fiche-vitrine'
import type { CommunePos } from '@/app/dashboard/pros-geo-actions'
import { atelierInput as inp, Field, ui } from './ui'

type Locate = (ville: string, names: string[]) => Promise<{ ville: CommunePos | null; others: CommunePos[] }>

export default function ZoneEditor({ ville, zone, villes, onChange, locate }: {
  ville: string
  zone: string
  villes: string[]
  onChange: (next: { ville?: string; zone?: string; villes?: string[] }) => void
  locate: Locate
}) {
  const { km, autre } = parseZone(zone, ville)
  const [add, setAdd] = useState('')
  const [pos, setPos] = useState<{ ville: CommunePos | null; others: CommunePos[] }>({ ville: null, others: [] })
  const [test, setTest] = useState('')
  const [testRes, setTestRes] = useState<{ nom: string; d: number } | null | 'none'>(null)
  const seq = useRef(0)

  const setKm = (k: number | null) => onChange({ zone: composeZone(ville, k, autre) })
  const setAutre = (a: string) => onChange({ zone: composeZone(ville, km, a) })
  const setVille = (v: string) => onChange({ ville: v, zone: composeZone(v, km, autre) })

  function addVilles(raw: string) {
    const names = raw.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
    if (!names.length) return
    const next = [...villes]
    for (const n of names) if (next.length < VILLES_MAX && !next.some(v => v.toLowerCase() === n.toLowerCase())) next.push(n.slice(0, 40))
    onChange({ villes: next })
    setAdd('')
  }

  // Positions de la ville et des villes citées (après un court silence)
  const key = JSON.stringify([ville.trim(), villes])
  useEffect(() => {
    if (!ville.trim()) { setPos({ ville: null, others: [] }); return }
    const n = ++seq.current
    const t = setTimeout(async () => {
      try {
        const res = await locate(ville, villes)
        if (n === seq.current) setPos(res)
      } catch { /* pas de carte, le reste marche */ }
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const placed = useMemo(() => {
    if (!pos.ville) return []
    return villes.map(v => {
      const p = pos.others.find(o => o.q.toLowerCase() === v.toLowerCase())
      return p ? { name: v, p, d: distanceKm(pos.ville!, p) } : null
    }).filter((x): x is { name: string; p: CommunePos; d: number } => !!x)
  }, [pos, villes])
  const inside = km ? placed.filter(x => x.d <= km) : []

  async function runTest() {
    const q = test.trim()
    if (!q || !ville.trim()) return
    try {
      const res = await locate(ville, [q])
      const c = res.others[0]
      setTestRes(c && res.ville ? { nom: c.nom, d: distanceKm(res.ville, c) } : 'none')
    } catch { setTestRes('none') }
  }

  return (
    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Ta ville principale" req>
          <SuggestInput kind="ville" style={inp} value={ville} onChange={setVille} options={CITY_OPTIONS} required maxLength={80} ariaLabel="Ville principale" />
        </Field>

        <Field label="Jusqu’où tu te déplaces" group>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <input type="range" min={0} max={100} step={5} value={km ?? 0} onChange={e => setKm(Number(e.target.value) || null)}
              aria-label="Rayon en kilomètres" style={{ flex: 1, accentColor: 'var(--accent-text)' }} />
            <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 22, color: 'var(--accent-text)', minWidth: 72, textAlign: 'right' }}>{km ? `${km} km` : 'Ville seule'}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RAYONS.map(r => (
              <button key={r} type="button" aria-pressed={km === r} onClick={() => setKm(r)} style={{ ...pill, ...(km === r ? pillOn : {}) }}>{r} km</button>
            ))}
            {km && km > 100 && <span style={{ ...pill, ...pillOn }}>{Math.min(km, RAYON_MAX)} km</span>}
          </div>
        </Field>

        <Field label="Villes que tu veux citer en plus" hint="Celles qui ont une page sur le site deviennent un lien vers elle." group>
          {villes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {villes.map(v => (
                <span key={v} style={chip}>
                  {v}
                  <button type="button" onClick={() => onChange({ villes: villes.filter(x => x !== v) })} style={chipX} aria-label={`Retirer ${v}`}><X size={11} weight="bold" /></button>
                </span>
              ))}
            </div>
          )}
          {villes.length < VILLES_MAX && (
            <SuggestInput kind="ville" style={inp} value={add} onChange={setAdd} options={CITY_OPTIONS} maxLength={120}
              onPick={v => addVilles(v)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addVilles(add) } }}
              onBlur={() => addVilles(add)} placeholder="Ajouter une ville (Entrée pour valider)" ariaLabel="Ajouter une ville" />
          )}
        </Field>

        {inside.length > 0 && (
          <div style={tip}>
            <Lightbulb size={18} weight="duotone" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              {inside.length === 1 ? `${inside[0].name} est déjà dans tes ${km} km` : `${inside.map(x => x.name).join(', ')} sont déjà dans tes ${km} km`} : la carte de ta fiche les montre déjà. Garde plutôt des villes plus loin où tu acceptes d’aller.
              <button type="button" onClick={() => onChange({ villes: villes.filter(v => !inside.some(x => x.name === v)) })} style={tipBtn}>
                {inside.length === 1 ? 'La retirer' : 'Les retirer'}
              </button>
            </div>
          </div>
        )}

        <Field label="Autre zone (facultatif)" hint="Un département, une région ou des communes, si ce n’est pas un rayon : « Rhône », « Côte basque ».">
          <input style={inp} value={autre} onChange={e => setAutre(e.target.value)} maxLength={160} placeholder="Rhône, Ain" />
        </Field>

        <div style={phrase}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', fontWeight: 700 }}>Ta fiche dira</div>
          <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 18, lineHeight: 1.4, marginTop: 4 }}>{zonePhrase(ville, km, villes, autre)}</div>
        </div>
      </div>

      <div style={{ flex: '0 1 320px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MiniMap center={pos.ville} km={km} placed={placed} />
        <form onSubmit={e => { e.preventDefault(); runTest() }} style={{ display: 'flex', gap: 8 }}>
          <label style={{ ...inp, flex: 1, minWidth: 0, width: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
            <MagnifyingGlass size={15} color="var(--text-3)" aria-hidden="true" />
            <input value={test} onChange={e => { setTest(e.target.value); setTestRes(null) }} placeholder="Tester : un logement à…" aria-label="Tester une commune"
              style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: 0, fontFamily: 'inherit', fontSize: 14, color: 'var(--text)', minHeight: 44 }} />
          </label>
          <button type="submit" style={ui.btnGhost}>Tester</button>
        </form>
        {testRes && (
          <div role="status" style={{ fontSize: 13, fontWeight: 600, paddingLeft: 2, color: testRes === 'none' ? 'var(--text-3)' : zoneVerdict(testRes.d, km) === 'oui' ? 'var(--accent-text)' : '#8A5A12' }}>
            {testRes === 'none'
              ? 'Commune introuvable : vérifie l’orthographe.'
              : zoneVerdict(testRes.d, km) === 'oui'
                ? `${testRes.nom} : oui, c’est dans ta zone (${Math.round(testRes.d)} km).`
                : zoneVerdict(testRes.d, km) === 'proche'
                  ? `${testRes.nom} : juste à côté (${Math.round(testRes.d)} km). Ajoute-la si tu y vas.`
                  : `${testRes.nom} : hors de ta zone (${Math.round(testRes.d)} km).`}
          </div>
        )}
      </div>
    </div>
  )
}

/** Carte simple : la ville au centre, le rayon, les villes citées (vertes dans le rayon, ambre au-delà) */
function MiniMap({ center, km, placed }: { center: CommunePos | null; km: number | null; placed: Array<{ name: string; p: CommunePos; d: number }> }) {
  const W = 320, H = 280, cx = W / 2, cy = H / 2
  // Le rayon remplit presque la carte ; une ville plus loin est posée au bord, dans sa direction
  const far = Math.max((km ?? 10) * 1.18, 12)
  const scale = (Math.min(W, H) / 2 - 16) / far // px par km
  const list = [...placed].sort((a, b) => a.d - b.d)
  // Villes numérotées (les noms se chevauchaient sur la carte quand elles sont proches) ;
  // pastilles écartées entre elles et du centre pour rester lisibles
  const pts = list.map(x => {
    if (!center) return { x: cx, y: cy }
    const dx = (x.p.lon - center.lon) * 111.32 * Math.cos((center.lat * Math.PI) / 180)
    const dy = (x.p.lat - center.lat) * 110.57
    const d = Math.hypot(dx, dy) || 1
    const k = Math.min(1, far / d)
    return { x: cx + dx * k * scale, y: cy - dy * k * scale }
  })
  const GAP = 22
  for (let pass = 0; pass < 30; pass++) {
    pts.forEach((a, i) => {
      const fromC = Math.hypot(a.x - cx, a.y - cy)
      if (fromC < GAP) {
        const ang = fromC ? Math.atan2(a.y - cy, a.x - cx) : (i * 2 * Math.PI) / Math.max(1, pts.length)
        a.x = cx + Math.cos(ang) * GAP; a.y = cy + Math.sin(ang) * GAP
      }
      pts.forEach((b, j) => {
        if (j <= i) return
        const dist = Math.hypot(b.x - a.x, b.y - a.y)
        if (dist < GAP) {
          const ang = dist ? Math.atan2(b.y - a.y, b.x - a.x) : (j * 2.4)
          const push = (GAP - dist) / 2
          a.x -= Math.cos(ang) * push; a.y -= Math.sin(ang) * push
          b.x += Math.cos(ang) * push; b.y += Math.sin(ang) * push
        }
      })
      a.x = Math.min(W - 12, Math.max(12, a.x)); a.y = Math.min(H - 12, Math.max(12, a.y))
    })
  }
  return (
    <div style={map}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={center ? `Carte de ta zone autour de ${center.nom}` : 'Carte de ta zone'}>
        <defs>
          <pattern id="zone-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="rgba(0,76,63,.07)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#zone-grid)" />
        {center && km && <circle cx={cx} cy={cy} r={km * scale} fill="rgba(0,76,63,.07)" stroke="var(--accent-text)" strokeWidth="1.5" strokeDasharray="6 6" />}
        {center && km && <text x={cx} y={cy - km * scale - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--accent-text)" style={{ fontFamily: 'inherit' }}>{km} km</text>}
        {center && (
          <g>
            <circle cx={cx} cy={cy} r="8" fill="var(--accent-text)" stroke="#fff" strokeWidth="2" />
            <text x={cx} y={cy + 24} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--text)" stroke="var(--bg)" strokeWidth="3" paintOrder="stroke" style={{ fontFamily: 'inherit' }}>{center.nom}</text>
          </g>
        )}
        {list.map((x, i) => {
          const q = pts[i]
          const inside = km ? x.d <= km : false
          return (
            <g key={x.name}>
              <circle cx={q.x} cy={q.y} r="9.5" fill={inside ? '#1F8A5B' : '#fff'} stroke={inside ? '#fff' : '#B7791F'} strokeWidth="2" />
              <text x={q.x} y={q.y + 3.8} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={inside ? '#fff' : '#8A5A12'} style={{ fontFamily: 'inherit' }}>{i + 1}</text>
            </g>
          )
        })}
      </svg>
      {center && list.length > 0 && (
        <ol style={legend}>
          {list.map((x, i) => {
            const inside = km ? x.d <= km : false
            return (
              <li key={x.name} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ ...num, ...(inside ? {} : numOut) }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{x.name}</span>
                <span style={{ color: inside ? 'var(--text-3)' : '#8A5A12', whiteSpace: 'nowrap' }}>{Math.round(x.d)} km</span>
              </li>
            )
          })}
        </ol>
      )}
      {!center && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13 }}>
          <MapPin size={16} /> La carte apparaît avec ta ville
        </div>
      )}
    </div>
  )
}

const legend: React.CSSProperties = { listStyle: 'none', margin: 0, padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'grid', gap: 6, fontSize: 12.5, background: 'var(--surface)' }
const num: React.CSSProperties = { width: 20, height: 20, borderRadius: '50%', background: '#1F8A5B', color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const numOut: React.CSSProperties = { background: '#fff', color: '#8A5A12', border: '2px solid #B7791F', width: 16, height: 16 }
const pill: React.CSSProperties = { border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 999, padding: '7px 13px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }
const pillOn: React.CSSProperties = { border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: '#fff' }
const chip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 6px 6px 12px', borderRadius: 999, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontSize: 13, fontWeight: 600 }
const chipX: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }
const tip: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,213,107,.2)', color: '#5C3D0B', fontSize: 13, lineHeight: 1.5 }
const tipBtn: React.CSSProperties = { display: 'block', marginTop: 8, border: 'none', background: '#5C3D0B', color: '#fff', borderRadius: 9, padding: '8px 12px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }
const phrase: React.CSSProperties = { padding: '14px 16px', borderRadius: 14, background: '#004C3F', color: '#fff' }
const map: React.CSSProperties = { position: 'relative', borderRadius: 18, border: '1px solid var(--border)', background: 'var(--bg)', overflow: 'hidden' }
