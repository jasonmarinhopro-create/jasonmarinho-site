'use client'

// Bloc « Réseaux et fiche Google » de Ma fiche (photographe et ménage,
// 07/10/2026). Tous facultatifs ; liens vérifiés à la sortie du champ
// (lib/pros/reseaux.ts) puis côté serveur à l'enregistrement.
import { useState } from 'react'
import { GoogleLogo, FacebookLogo, LinkedinLogo, TiktokLogo, YoutubeLogo, PinterestLogo, ShareNetwork } from '@phosphor-icons/react/dist/ssr'
import { RESEAUX, normalizeReseau, type ReseauKey } from '@/lib/pros/reseaux'

const ICONS: Record<ReseauKey, typeof GoogleLogo> = {
  google: GoogleLogo, facebook: FacebookLogo, linkedin: LinkedinLogo, tiktok: TiktokLogo, youtube: YoutubeLogo, pinterest: PinterestLogo,
}

export type ReseauxForm = Record<ReseauKey, string>

export function emptyReseauxForm(saved?: unknown): ReseauxForm {
  const raw = saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {}
  return Object.fromEntries(RESEAUX.map(r => [r.key, typeof raw[r.key] === 'string' ? (raw[r.key] as string) : ''])) as ReseauxForm
}

export default function ReseauxFields({ value, onChange, inputStyle }: {
  value: ReseauxForm
  onChange: (next: ReseauxForm) => void
  inputStyle: React.CSSProperties
}) {
  const [errors, setErrors] = useState<Partial<Record<ReseauKey, string>>>({})
  const filled = RESEAUX.filter(r => value[r.key].trim()).length

  function check(key: ReseauKey) {
    const res = normalizeReseau(key, value[key])
    setErrors(e => ({ ...e, [key]: res.error }))
    if (res.url && res.url !== value[key]) onChange({ ...value, [key]: res.url })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '14px 0 0' }}>
          <ShareNetwork size={14} weight="bold" /> Réseaux et fiche Google
        </h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filled ? `${filled} renseigné${filled > 1 ? 's' : ''}` : 'Facultatif'}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.55 }}>
        Affichés en petites icônes dans tes infos, sur ta fiche publique. Ta fiche Google rassure les hôtes : ils y voient tes avis.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
        {RESEAUX.map(r => {
          const Icon = ICONS[r.key]
          const err = errors[r.key]
          return (
            <label key={r.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>
                <Icon size={15} weight="bold" color="var(--accent-text)" /> {r.label}
              </span>
              <input
                style={{ ...inputStyle, ...(err ? { border: '1px solid var(--danger, #c0392b)' } : {}) }}
                value={value[r.key]}
                onChange={e => { onChange({ ...value, [r.key]: e.target.value }); if (err) setErrors(x => ({ ...x, [r.key]: undefined })) }}
                onBlur={() => check(r.key)}
                placeholder={r.placeholder}
                maxLength={300}
                inputMode="url"
                autoComplete="off"
              />
              {err && <span style={{ fontSize: 11.5, color: 'var(--danger, #c0392b)' }}>{err}</span>}
            </label>
          )
        })}
      </div>
    </div>
  )
}
