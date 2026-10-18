'use client'

// Formules, villes couvertes et déroulé en 3 étapes de la fiche publique
// (photographes et équipes de ménage). Valeurs nettoyées côté serveur par
// lib/pros/fiche-vitrine.ts ; affichées sur la fiche par scripts/lib/fiche-vitrine.mjs.
import { useState } from 'react'
import { Plus, X, ArrowCounterClockwise } from '@phosphor-icons/react/dist/ssr'
import { DEFAULT_DEROULE, FORMULES_MAX, VILLES_MAX, FORMULE_DETAIL_MAX, ETAPE_TITRE_MAX, ETAPE_TEXTE_MAX, type Etape, type ProMetier } from '@/lib/pros/fiche-vitrine'
import GrowText from './GrowText'
import SuggestInput from '@/components/ui/SuggestInput'
import { CITY_OPTIONS } from '@/lib/ui/suggest'

export interface VitrineForm {
  formules: Array<{ nom: string; prix: string; detail: string }>
  villes: string[]
  deroule: Etape[]
}

export function initialVitrineForm(row: { formules?: unknown; villes_couvertes?: unknown; deroule?: unknown }, metier: ProMetier): VitrineForm {
  const formules = Array.isArray(row.formules)
    ? (row.formules as Array<Record<string, unknown>>).map(f => ({ nom: String(f?.nom ?? ''), prix: f?.prix ? String(f.prix) : '', detail: String(f?.detail ?? '') }))
    : []
  const villes = Array.isArray(row.villes_couvertes) ? (row.villes_couvertes as unknown[]).map(String) : []
  const deroule = Array.isArray(row.deroule) && row.deroule.length === 3
    ? (row.deroule as Array<Record<string, unknown>>).map(e => ({ titre: String(e?.titre ?? ''), texte: String(e?.texte ?? '') }))
    : DEFAULT_DEROULE[metier].map(e => ({ ...e }))
  return { formules, villes, deroule }
}

/** Ce qui part au serveur (prix en nombre) */
export function vitrinePayload(v: VitrineForm) {
  return {
    formules: v.formules.map(f => ({ nom: f.nom, prix: f.prix ? Number(f.prix.replace(',', '.')) : null, detail: f.detail })),
    villes_couvertes: v.villes,
    deroule: v.deroule,
  }
}

const EXEMPLES: Record<ProMetier, { nom: string; prix: string; detail: string }> = {
  photographe: { nom: 'Essentielle', prix: '350', detail: 'Studio ou T2 : 20 photos retouchées, livrées sous 5 jours.' },
  menage: { nom: 'T2, T3', prix: '95', detail: 'Linge fourni et lavé, réassort des consommables, photo de fin de ménage.' },
}

export default function FicheVitrineFields({ value, onChange, metier, inputStyle, titleStyle }: {
  value: VitrineForm
  onChange: (v: VitrineForm) => void
  metier: ProMetier
  inputStyle: React.CSSProperties
  titleStyle: React.CSSProperties
}) {
  const [ville, setVille] = useState('')
  const ex = EXEMPLES[metier]
  const setF = (i: number, k: 'nom' | 'prix' | 'detail', v: string) =>
    onChange({ ...value, formules: value.formules.map((f, j) => (j === i ? { ...f, [k]: v } : f)) })
  const setE = (i: number, k: 'titre' | 'texte', v: string) =>
    onChange({ ...value, deroule: value.deroule.map((e, j) => (j === i ? { ...e, [k]: v } : e)) })

  function addVilles(raw: string) {
    const names = raw.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
    if (!names.length) return
    const next = [...value.villes]
    for (const n of names) if (next.length < VILLES_MAX && !next.some(v => v.toLowerCase() === n.toLowerCase())) next.push(n.slice(0, 40))
    onChange({ ...value, villes: next })
    setVille('')
  }

  return (
    <>
      <h3 style={titleStyle}>Formules (facultatif)</h3>
      <p style={hint}>Jusqu’à {FORMULES_MAX} formules avec un prix « à partir de » : plus clair qu’une fourchette, les hôtes savent tout de suite ce qu’ils auront. Laisse le prix vide pour « Sur devis ». Quelques mots suffisent : ce qui est inclus, le délai.</p>
      {value.formules.map((f, i) => (
        <div key={i} style={row}>
          <div style={rowHead}>
            <span style={rowLabel}>Formule {i + 1}</span>
            <button type="button" onClick={() => onChange({ ...value, formules: value.formules.filter((_, j) => j !== i) })} style={iconBtn} aria-label="Retirer la formule"><X size={13} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(96px, 120px)', gap: 8 }}>
            <input style={inputStyle} value={f.nom} onChange={e => setF(i, 'nom', e.target.value)} maxLength={40} autoComplete="off" placeholder={`Nom (ex. ${ex.nom})`} aria-label="Nom de la formule" />
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputStyle, paddingRight: 28 }} value={f.prix} onChange={e => setF(i, 'prix', e.target.value.replace(/[^\d,.]/g, ''))} inputMode="decimal" autoComplete="off" placeholder={ex.prix} aria-label="Prix à partir de, en euros" />
              <span style={euro} aria-hidden="true">€</span>
            </div>
          </div>
          <GrowText style={inputStyle} value={f.detail} onChange={v => setF(i, 'detail', v)} max={FORMULE_DETAIL_MAX} placeholder={`Ce qui est inclus (ex. ${ex.detail})`} aria-label="Ce qui est inclus" />
        </div>
      ))}
      {value.formules.length < FORMULES_MAX && (
        <button type="button" onClick={() => onChange({ ...value, formules: [...value.formules, { nom: '', prix: '', detail: '' }] })} style={addBtn}>
          <Plus size={13} weight="bold" /> Ajouter une formule
        </button>
      )}

      <h3 style={titleStyle}>Villes où tu interviens</h3>
      <p style={hint}>Ta ville principale est déjà affichée. Ajoute les autres villes (jusqu’à {VILLES_MAX}) : celles qui ont un guide sur le site deviennent un lien vers lui.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {value.villes.map(v => (
          <span key={v} style={chip}>
            {v}
            <button type="button" onClick={() => onChange({ ...value, villes: value.villes.filter(x => x !== v) })} style={chipX} aria-label={`Retirer ${v}`}><X size={11} /></button>
          </span>
        ))}
      </div>
      {value.villes.length < VILLES_MAX && (
        <div style={{ display: 'flex', gap: 8 }}>
          <SuggestInput kind="ville" style={inputStyle} value={ville} onChange={setVille} options={CITY_OPTIONS} maxLength={120}
            onPick={v => addVilles(v)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addVilles(ville) } }}
            onBlur={() => addVilles(ville)} placeholder="Ex. Villeurbanne, Annecy" ariaLabel="Ajouter une ville" />
          <button type="button" onClick={() => addVilles(ville)} style={addBtn}><Plus size={13} weight="bold" /> Ajouter</button>
        </div>
      )}

      <h3 style={titleStyle}>Comment ça se passe (3 étapes)</h3>
      <p style={hint}>Affiché sur ta fiche pour rassurer les hôtes. Adapte les étapes à ta façon de travailler (délais, rendez-vous, livraison).</p>
      {value.deroule.map((e, i) => (
        <div key={i} style={{ ...row, gridTemplateColumns: '28px minmax(0, 1fr)', display: 'grid', alignItems: 'start' }}>
          <span style={stepN}>{i + 1}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input style={{ ...inputStyle, fontWeight: 600 }} value={e.titre} onChange={ev => setE(i, 'titre', ev.target.value)} maxLength={ETAPE_TITRE_MAX} autoComplete="off" aria-label={`Titre de l’étape ${i + 1}`} />
            <GrowText style={inputStyle} value={e.texte} onChange={v => setE(i, 'texte', v)} max={ETAPE_TEXTE_MAX} aria-label={`Texte de l’étape ${i + 1}`} />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange({ ...value, deroule: DEFAULT_DEROULE[metier].map(e => ({ ...e })) })} style={{ ...addBtn, alignSelf: 'flex-start' }}>
        <ArrowCounterClockwise size={13} weight="bold" /> Revenir aux étapes proposées
      </button>
    </>
  )
}

const hint: React.CSSProperties = { fontSize: 12.5, color: 'var(--text-3)', margin: '-4px 0 0', lineHeight: 1.55 }
const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }
const rowHead: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }
const rowLabel: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-3)' }
const euro: React.CSSProperties = { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 14, pointerEvents: 'none' }
const addBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: '1px dashed var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start', whiteSpace: 'nowrap' }
const iconBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer' }
const chip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 6px 5px 12px', borderRadius: 999, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontSize: 13, fontWeight: 600 }
const chipX: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }
const stepN: React.CSSProperties = { width: 26, height: 26, borderRadius: '50%', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }
