'use client'

// Photographe, vidéaste ou les deux + options (drone…) + lien vers les vidéos.
// Utilisé par Créer ma fiche et Ma fiche (photographes). Règles : lib/pros/visuel.ts.

import { Camera, VideoCamera, FilmStrip, Drone, Cube, MoonStars, Armchair, Check } from '@phosphor-icons/react/dist/ssr'
import { METIERS_VISUELS, OPTIONS_VISUELLES, faitVideo, type MetierVisuel, type OptionVisuelle } from '@/lib/pros/visuel'

export interface VisuelForm {
  metier: MetierVisuel
  options: OptionVisuelle[]
  video_url: string
}

const METIER_ICON = { photo: Camera, video: VideoCamera, photo_video: FilmStrip } as const
const OPTION_ICON = { drone: Drone, visite_3d: Cube, reels: FilmStrip, crepuscule: MoonStars, mise_en_scene: Armchair } as const

export default function VisuelFields({ value, onChange, inputStyle }: {
  value: VisuelForm
  onChange: (v: VisuelForm) => void
  inputStyle: React.CSSProperties
}) {
  const toggle = (k: OptionVisuelle) => onChange({
    ...value,
    options: value.options.includes(k) ? value.options.filter(o => o !== k) : [...value.options, k],
  })
  const video = faitVideo(value.metier)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={s.field}>
        <span style={s.lbl}>Tu proposes</span>
        <div style={s.choices} role="radiogroup" aria-label="Tu proposes">
          {METIERS_VISUELS.map(m => {
            const Icon = METIER_ICON[m.key]
            const on = value.metier === m.key
            return (
              <button key={m.key} type="button" role="radio" aria-checked={on} onClick={() => onChange({ ...value, metier: m.key })}
                style={{ ...s.choice, ...(on ? s.choiceOn : {}) }}>
                <Icon size={18} weight={on ? 'fill' : 'regular'} />{m.label}
              </button>
            )
          })}
        </div>
        <span style={s.hint}>Les hôtes filtrent l&apos;annuaire par photographe, vidéaste ou les deux.</span>
      </div>

      <div style={s.field}>
        <span style={s.lbl}>Options proposées</span>
        <div style={s.choices}>
          {OPTIONS_VISUELLES.map(o => {
            const Icon = OPTION_ICON[o.key]
            const on = value.options.includes(o.key)
            return (
              <button key={o.key} type="button" aria-pressed={on} onClick={() => toggle(o.key)} style={{ ...s.chip, ...(on ? s.choiceOn : {}) }}>
                {on ? <Check size={14} weight="bold" /> : <Icon size={15} />}{o.label}
              </button>
            )
          })}
        </div>
        <span style={s.hint}>Les hôtes qui cherchent des vues aériennes ou une visite 3D te trouvent avec ces filtres.</span>
      </div>

      <label style={s.field}>
        <span style={s.lbl}>{video ? 'Lien vers tes vidéos' : 'Lien vers une vidéo (facultatif)'}</span>
        <input style={inputStyle} type="text" inputMode="url" autoCapitalize="off" spellCheck={false} maxLength={300}
          placeholder="youtube.com/watch?v=… ou ta chaîne, Vimeo, Instagram"
          value={value.video_url} onChange={e => onChange({ ...value, video_url: e.target.value })} />
        <span style={s.hint}>Une vidéo YouTube ou Vimeo se lit directement en haut de ta fiche. Une chaîne, un compte Instagram ou TikTok : un bouton « Voir mes vidéos ».</span>
      </label>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  lbl: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  hint: { fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 },
  choices: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  choice: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  choiceOn: { border: '1px solid var(--accent-text)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
}
