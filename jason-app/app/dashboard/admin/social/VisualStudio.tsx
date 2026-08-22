'use client'

import { useEffect, useRef, useState } from 'react'
import { uploadSocialMedia } from './actions'

const SIZE = 1080

export interface VisualPreset {
  id: string
  label: string
  colors: [string, string]
  headline: string
  brief: string
}

// 4 sujets de départ, pensés pour les toutes premières publications :
// le site dans son ensemble, l'annuaire Driing, la LCD au sens large,
// et les formations. Chaque preset fixe une couleur de marque + une
// accroche par défaut (modifiable) + un sujet pré-rempli pour l'aide
// à la rédaction du texte, pour que visuel et texte partent du même point.
export const VISUAL_PRESETS: VisualPreset[] = [
  {
    id: 'general', label: 'Le site en général', colors: ['#63D683', '#116B3E'],
    headline: 'Tout pour réussir en location courte durée',
    brief: "Un post qui présente jasonmarinho.com dans son ensemble : formations, annuaires de pros et communauté pour les hôtes en location courte durée.",
  },
  {
    id: 'annuaires', label: 'Annuaires Driing', colors: ['#93C5FD', '#2F5FC4'],
    headline: "Driing, l'annuaire des pros de la LCD",
    brief: "Un post qui présente Driing, l'annuaire Jason Marinho qui référence les meilleurs prestataires (ménage, photographes, conciergeries) pour les hôtes en location courte durée.",
  },
  {
    id: 'lcd', label: 'Location courte durée', colors: ['#F472B6', '#B23E76'],
    headline: 'Les clés pour réussir ta LCD',
    brief: "Un conseil pratique et concret pour un hôte en location courte durée (Airbnb, Booking).",
  },
  {
    id: 'formations', label: 'Formations', colors: ['#FFD56B', '#D69A2B'],
    headline: 'Apprends à développer ton activité LCD',
    brief: "Un post qui présente le catalogue de formations Jason Marinho pour les hôtes en location courte durée.",
  },
]

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

export default function VisualStudio({ onGenerated, onPresetBrief }: {
  onGenerated: (url: string) => void
  onPresetBrief?: (brief: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [presetId, setPresetId] = useState(VISUAL_PRESETS[0].id)
  const [headline, setHeadline] = useState(VISUAL_PRESETS[0].headline)
  const [subtext, setSubtext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preset = VISUAL_PRESETS.find(p => p.id === presetId) ?? VISUAL_PRESETS[0]

  function selectPreset(id: string) {
    const p = VISUAL_PRESETS.find(v => v.id === id)
    if (!p) return
    setPresetId(id)
    setHeadline(p.headline)
    onPresetBrief?.(p.brief)
  }

  useEffect(() => {
    let cancelled = false
    async function draw() {
      const canvas = canvasRef.current
      if (!canvas) return
      await document.fonts.ready
      if (cancelled) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = SIZE
      canvas.height = SIZE

      const fraunces = getComputedStyle(document.documentElement).getPropertyValue('--font-fraunces').trim() || 'serif'
      const outfit = getComputedStyle(document.documentElement).getPropertyValue('--font-outfit').trim() || 'sans-serif'

      const gradient = ctx.createLinearGradient(0, 0, SIZE, SIZE)
      gradient.addColorStop(0, preset.colors[0])
      gradient.addColorStop(1, preset.colors[1])
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, SIZE, SIZE)

      const padding = 90
      const maxWidth = SIZE - padding * 2
      const text = headline.trim() || preset.headline

      let fontSize = 84
      ctx.font = `600 ${fontSize}px ${fraunces}`
      let lines = wrapText(ctx, text, maxWidth)
      while (lines.length > 4 && fontSize > 50) {
        fontSize -= 6
        ctx.font = `600 ${fontSize}px ${fraunces}`
        lines = wrapText(ctx, text, maxWidth)
      }
      const lineHeight = fontSize * 1.16
      const blockHeight = lines.length * lineHeight + (subtext ? 90 : 0)
      let y = (SIZE - blockHeight) / 2 + fontSize * 0.85

      ctx.fillStyle = '#0B1D0F'
      for (const line of lines) {
        ctx.fillText(line, padding, y)
        y += lineHeight
      }

      if (subtext.trim()) {
        ctx.font = `400 34px ${outfit}`
        ctx.fillStyle = 'rgba(11,29,15,0.75)'
        y += 26
        for (const line of wrapText(ctx, subtext.trim(), maxWidth).slice(0, 3)) {
          ctx.fillText(line, padding, y)
          y += 44
        }
      }

      ctx.font = `500 26px ${outfit}`
      ctx.fillStyle = 'rgba(11,29,15,0.55)'
      ctx.fillText('jasonmarinho.com', padding, SIZE - 60)
    }
    draw()
    return () => { cancelled = true }
  }, [presetId, headline, subtext, preset])

  function addToPost() {
    const canvas = canvasRef.current
    if (!canvas) return
    setError(null)
    setGenerating(true)
    canvas.toBlob(async blob => {
      if (!blob) { setError('Échec de la génération.'); setGenerating(false); return }
      const fd = new FormData()
      fd.append('file', new File([blob], 'visuel.png', { type: 'image/png' }))
      const res = await uploadSocialMedia(fd)
      if (res.ok && res.url) {
        onGenerated(res.url)
      } else {
        setError(res.error ?? "Échec de l'upload.")
      }
      setGenerating(false)
    }, 'image/png')
  }

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
        {VISUAL_PRESETS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPreset(p.id)}
            style={{
              ...s.presetChip,
              borderColor: presetId === p.id ? p.colors[0] : 'var(--border)',
              background: presetId === p.id ? `${p.colors[0]}22` : 'var(--bg-2)',
              color: presetId === p.id ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})`, display: 'inline-block' }} />
            {p.label}
          </button>
        ))}
      </div>

      <div style={s.layout}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
          <input
            type="text"
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="Accroche du visuel"
            style={s.input}
          />
          <input
            type="text"
            value={subtext}
            onChange={e => setSubtext(e.target.value)}
            placeholder="Sous-texte (optionnel)"
            style={s.input}
          />
          {error && <span style={{ fontSize: 12, color: '#EF4444' }}>{error}</span>}
          <button type="button" onClick={addToPost} disabled={generating} style={s.addBtn}>
            {generating ? 'Génération…' : 'Ajouter ce visuel au post'}
          </button>
        </div>
        <canvas ref={canvasRef} style={s.canvas} aria-label="Aperçu du visuel généré" />
      </div>
    </div>
  )
}

const s: Record<string, any> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  presetChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 11px', borderRadius: 100, fontSize: 12.5, fontWeight: 600,
    border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
  },
  layout: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  input: {
    padding: '9px 12px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: 13.5, width: '100%',
  },
  addBtn: {
    alignSelf: 'flex-start',
    padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', cursor: 'pointer',
  },
  canvas: {
    width: 130, height: 130, borderRadius: 10, border: '1px solid var(--border)',
    flexShrink: 0,
  },
}
