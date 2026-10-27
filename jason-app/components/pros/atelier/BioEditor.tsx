'use client'

// Présentation des pros avec coup de pouce (atelier, étape 3, 27/10/2026) :
// début crié en majuscules repéré et corrigé en un clic, ce qu'un hôte aime y
// lire, et ce qui s'affiche avant « Lire la suite ». Règles : lib/pros/bio-aide.ts.
import { Lightbulb, Check, Plus } from '@phosphor-icons/react/dist/ssr'
import GrowText from '@/components/pros/GrowText'
import { majusculesCriardes, adoucirMajuscules, bioReperes, apercuBio } from '@/lib/pros/bio-aide'
import { atelierInput as inp, Field } from './ui'

export default function BioEditor({ value, onChange, ville }: { value: string; onChange: (v: string) => void; ville: string }) {
  const cri = majusculesCriardes(value)
  const reperes = bioReperes(value, ville)
  const apercu = apercuBio(value)
  const n = value.trim().length
  return (
    <>
      {cri && (
        <div style={tip}>
          <Lightbulb size={18} weight="duotone" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            « {cri.length > 40 ? `${cri.slice(0, 40)}…` : cri} » est en majuscules : sur une fiche, ça donne l’impression de crier.
            <button type="button" onClick={() => onChange(adoucirMajuscules(value))} style={tipBtn}>Remettre en minuscules</button>
          </div>
        </div>
      )}
      <Field label="Ce que les hôtes lisent sur ta fiche" hint={n < 300 ? 'Entre 300 et 600 caractères, c’est idéal.' : n <= 600 ? 'Bonne longueur.' : undefined}>
        <GrowText style={{ ...inp, minHeight: 170, lineHeight: 1.6 }} value={value} onChange={onChange} max={600} oneLine={false} minRows={7} />
      </Field>
      <Field label="Ce qu’un hôte aime y trouver" group>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {reperes.map(r => (
            <span key={r.key} style={r.ok ? chipOk : chipTodo}>
              {r.ok ? <Check size={12} weight="bold" /> : <Plus size={12} weight="bold" />}{r.label}
            </span>
          ))}
        </div>
      </Field>
      {n > 0 && (
        <div style={preview}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
            {apercu.coupe ? 'Ce que l’hôte lit avant « Lire la suite »' : 'Ce que l’hôte lit'}
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{apercu.visible}</p>
        </div>
      )}
    </>
  )
}

const tip: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,213,107,.22)', color: '#5C3D0B', fontSize: 13.5, lineHeight: 1.5 }
const tipBtn: React.CSSProperties = { display: 'block', marginTop: 8, border: 'none', background: '#5C3D0B', color: '#fff', borderRadius: 9, padding: '9px 13px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40 }
const chipOk: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 999, background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 12.5, fontWeight: 600 }
const chipTodo: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 999, border: '1px dashed var(--border)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600 }
const preview: React.CSSProperties = { padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg)' }
