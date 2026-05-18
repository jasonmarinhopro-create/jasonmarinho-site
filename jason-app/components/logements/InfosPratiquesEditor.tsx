'use client'

// Éditeur de la section « Auto-fill gabarits » sur la fiche logement.
//
// Toutes les valeurs saisies ici alimentent automatiquement les variables
// des gabarits voyageur (poubelles, restos, transports, urgences…). L'hôte
// remplit UNE FOIS son logement → tous ses messages se copient sans rien
// retaper.
//
// Structure stockée en JSONB (colonne infos_pratiques de logements).

import { useState } from 'react'
import { Plus, Trash, MapPin, ForkKnife, Train, Phone, Note, Recycle, Car } from '@phosphor-icons/react/dist/ssr'
import type { InfosPratiques, RestaurantReco } from '@/lib/logements/infos-pratiques'
import { countFilled } from '@/lib/logements/infos-pratiques'

interface Props {
  value: InfosPratiques
  onChange: (next: InfosPratiques) => void
}

export default function InfosPratiquesEditor({ value, onChange }: Props) {
  const filled = countFilled(value)

  function patch<K extends keyof InfosPratiques>(key: K, v: InfosPratiques[K]) {
    onChange({ ...value, [key]: v })
  }

  // ── Restaurants ──
  const restaurants = value.restaurants ?? []
  function patchResto(idx: number, r: Partial<RestaurantReco>) {
    const next = [...restaurants]
    next[idx] = { ...(next[idx] ?? { nom: '' }), ...r }
    onChange({ ...value, restaurants: next })
  }
  function addResto() {
    if (restaurants.length >= 3) return
    onChange({ ...value, restaurants: [...restaurants, { nom: '' }] })
  }
  function removeResto(idx: number) {
    const next = restaurants.filter((_, i) => i !== idx)
    onChange({ ...value, restaurants: next })
  }

  return (
    <div style={s.wrap}>
      <div style={s.intro}>
        <div style={s.introBadge}>
          <span aria-hidden="true">✨</span>
          AUTO-FILL GABARITS
        </div>
        <p style={s.introText}>
          Tout ce que tu saisis ici est <strong style={s.strong}>réutilisé automatiquement</strong> dans tes messages voyageur.
          Plus jamais de re-saisie à chaque copie. {filled > 0 && (
            <span style={s.filledTag}>{filled} champ{filled > 1 ? 's' : ''} rempli{filled > 1 ? 's' : ''}</span>
          )}
        </p>
      </div>

      {/* ── Accès détaillé ── */}
      <Field
        label="Instructions d'accès détaillées"
        icon={<MapPin size={13} weight="fill" />}
        hint="Plus complet que le code seul : où trouver la boîte à clés, comment entrer, étage, porte"
        value={value.acces_instructions ?? ''}
        onChange={v => patch('acces_instructions', v)}
        placeholder="Sonne au 1er nom sur l'interphone, puis monte au 3e à gauche. Le tapis est en juin."
        multiline
      />

      {/* ── Pratique ── */}
      <div style={s.row2}>
        <Field
          label="Localisation des poubelles"
          icon={<Recycle size={13} weight="fill" />}
          value={value.poubelles_localisation ?? ''}
          onChange={v => patch('poubelles_localisation', v)}
          placeholder="Local poubelles au RDC à droite, tri sélectif obligatoire"
        />
        <Field
          label="Parking / stationnement"
          icon={<Car size={13} weight="fill" />}
          value={value.parking_info ?? ''}
          onChange={v => patch('parking_info', v)}
          placeholder="Parking gratuit dans la rue, zone bleue après 19h"
        />
      </div>

      {/* ── Transports + supermarché ── */}
      <div style={s.row2}>
        <Field
          label="Transports en commun / accès"
          icon={<Train size={13} weight="fill" />}
          value={value.transports ?? ''}
          onChange={v => patch('transports', v)}
          placeholder="Métro Marquês 5 min à pied, Uber 7€ depuis l'aéroport"
        />
        <Field
          label="Supermarché le plus proche"
          icon={<MapPin size={13} weight="fill" />}
          value={value.supermarche ?? ''}
          onChange={v => patch('supermarche', v)}
          placeholder="Pingo Doce à 3 min, ouvert 7j/7 jusqu'à 22h"
        />
      </div>

      {/* ── Restaurants ── */}
      <div style={s.group}>
        <div style={s.groupHead}>
          <span style={s.groupTitle}>
            <ForkKnife size={13} weight="fill" style={{ color: '#FCD34D' }} />
            Restaurants recommandés ({restaurants.length}/3)
          </span>
          {restaurants.length < 3 && (
            <button type="button" onClick={addResto} style={s.addBtn}>
              <Plus size={12} weight="bold" /> Ajouter
            </button>
          )}
        </div>
        {restaurants.length === 0 ? (
          <div style={s.empty}>
            Aucun restaurant. Ajoute tes 3 préférés pour les recommander automatiquement.
          </div>
        ) : (
          restaurants.map((r, idx) => (
            <div key={idx} style={s.restoRow}>
              <div style={s.restoFields}>
                <input
                  style={{ ...s.input, flex: '2 1 200px' }}
                  value={r.nom ?? ''}
                  onChange={e => patchResto(idx, { nom: e.target.value })}
                  placeholder={`Nom restaurant ${idx + 1}`}
                />
                <input
                  style={{ ...s.input, flex: '1 1 120px' }}
                  value={r.type ?? ''}
                  onChange={e => patchResto(idx, { type: e.target.value })}
                  placeholder="Cuisine (ex: Portugais)"
                />
                <input
                  style={{ ...s.input, flex: '0 1 70px' }}
                  value={r.prix ?? ''}
                  onChange={e => patchResto(idx, { prix: e.target.value })}
                  placeholder="€€"
                />
                <input
                  style={{ ...s.input, flex: '1 1 120px' }}
                  value={r.distance ?? ''}
                  onChange={e => patchResto(idx, { distance: e.target.value })}
                  placeholder="5 min à pied"
                />
              </div>
              <button type="button" onClick={() => removeResto(idx)} style={s.removeBtn} aria-label="Retirer ce restaurant">
                <Trash size={13} weight="bold" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Urgences + notes ── */}
      <Field
        label="Numéros d'urgence / mon contact"
        icon={<Phone size={13} weight="fill" />}
        hint="Pour qu'ils sachent qui appeler en cas de problème"
        value={value.urgences ?? ''}
        onChange={v => patch('urgences', v)}
        placeholder="Moi : +33 6 12 34 56 78. Pompiers : 112. Hôpital São José à 10 min."
      />
      <Field
        label="Notes additionnelles (libres)"
        icon={<Note size={13} weight="fill" />}
        hint="Tout ce qui ne rentre pas ailleurs et que tu écris souvent dans tes messages"
        value={value.notes ?? ''}
        onChange={v => patch('notes', v)}
        placeholder="Lave-vaisselle pastilles dans tiroir gauche. Climatisation = télécommande sur le frigo."
        multiline
      />
    </div>
  )
}

// ─── Composants internes ─────────────────────────────────────────────
interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: React.ReactNode
  hint?: string
  placeholder?: string
  multiline?: boolean
}

function Field({ label, value, onChange, icon, hint, placeholder, multiline }: FieldProps) {
  return (
    <div style={s.field}>
      <label style={s.label}>
        {icon && <span aria-hidden="true" style={s.labelIcon}>{icon}</span>}
        {label}
      </label>
      {hint && <p style={s.hint}>{hint}</p>}
      {multiline ? (
        <textarea
          style={{ ...s.input, minHeight: '70px', resize: 'vertical' as const, fontFamily: 'inherit' }}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          style={s.input}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex', flexDirection: 'column' as const, gap: '14px',
    padding: '16px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.04) 0%, var(--bg-2) 100%)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '12px',
  },
  intro: { display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '4px' },
  introBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    alignSelf: 'flex-start',
    padding: '3px 10px', borderRadius: '999px',
    background: 'rgba(255,213,107,0.10)', color: 'var(--accent-text)',
    border: '1px solid rgba(255,213,107,0.22)',
    fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.6px',
  },
  introText: { fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 },
  strong: { color: 'var(--text)' },
  filledTag: {
    display: 'inline-block', marginLeft: '6px',
    padding: '2px 8px', borderRadius: '999px',
    background: 'var(--success-bg, rgba(16,185,129,0.10))', color: 'var(--success-1)',
    fontSize: '10.5px', fontWeight: 700,
  },

  row2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },

  field: { display: 'flex', flexDirection: 'column' as const, gap: '5px' },
  label: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--text)' },
  labelIcon: { display: 'inline-flex', color: 'var(--text-3)' },
  hint: { fontSize: '11px', color: 'var(--text-3)', margin: '0 0 2px', lineHeight: 1.4 },
  input: {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
  },

  group: {
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
    padding: '12px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  groupHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px' },
  groupTitle: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text)' },
  addBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '5px 10px', borderRadius: '7px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
    fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  empty: { padding: '12px', textAlign: 'center' as const, fontSize: '12px', color: 'var(--text-3)' },
  restoRow: { display: 'flex', alignItems: 'flex-start', gap: '8px' },
  restoFields: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px', flex: 1, minWidth: 0 },
  removeBtn: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'transparent', color: 'var(--text-3)',
    border: '1px solid var(--border)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
}
