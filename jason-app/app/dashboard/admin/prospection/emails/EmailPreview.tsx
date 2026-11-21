'use client'

// Aperçu d'un e-mail (21/11/2026, Jason : « plus fin, sans prendre de place,
// j'y vais rarement ») : une ligne repliée ; ouverte, une liste déroulante et
// l'e-mail présenté comme dans une boîte de réception (expéditeur, objet,
// texte d'aperçu), à sa vraie largeur, ordinateur ou téléphone. Le serveur ne
// prépare que l'e-mail choisi (?apercu=<id>).
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretDown, CaretLeft, CaretRight, Desktop, DeviceMobile, EnvelopeSimpleOpen } from '@phosphor-icons/react/dist/ssr'

export interface PreviewOption { id: string; group: string; label: string; to: string }

export default function EmailPreview({ options, current, subject, preview, html, open }: {
  options: PreviewOption[]; current: string; subject: string; preview: string; html: string; open: boolean
}) {
  const router = useRouter()
  const [phone, setPhone] = useState(false)
  const [height, setHeight] = useState(640)
  const frame = useRef<HTMLIFrameElement>(null)
  const groups = [...new Set(options.map(o => o.group))]
  const i = Math.max(0, options.findIndex(o => o.id === current))
  const cur = options[i]
  const go = (id: string) => router.push(`?apercu=${encodeURIComponent(id)}#apercu`, { scroll: false })

  const fit = () => {
    try {
      const h = frame.current?.contentDocument?.documentElement.scrollHeight
      if (h) setHeight(h + 2)
    } catch { /* lecture impossible : hauteur par défaut */ }
  }
  useEffect(() => { const t = setTimeout(fit, 250); return () => clearTimeout(t) }, [phone, html])

  return (
    <details id="apercu" open={open} style={s.box}>
      <summary style={s.summary}>
        <EnvelopeSimpleOpen size={18} weight="duotone" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: '14.5px', color: 'var(--text)' }}>Voir le rendu des e-mails</strong>
          <span style={s.hint}> · {options.length} e-mails, données fictives</span>
        </span>
        <CaretDown size={15} style={{ color: 'var(--text-3)' }} />
      </summary>

      <div style={s.body}>
        <div style={s.toolbar}>
          <div style={s.nav}>
            <button type="button" aria-label="E-mail précédent" onClick={() => go(options[(i - 1 + options.length) % options.length].id)} style={s.iconBtn}><CaretLeft size={14} weight="bold" /></button>
            <select aria-label="Choisir un e-mail" value={current} onChange={e => go(e.target.value)} style={s.select}>
              {groups.map(g => (
                <optgroup key={g} label={g}>
                  {options.filter(o => o.group === g).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </optgroup>
              ))}
            </select>
            <button type="button" aria-label="E-mail suivant" onClick={() => go(options[(i + 1) % options.length].id)} style={s.iconBtn}><CaretRight size={14} weight="bold" /></button>
          </div>
          <div role="group" aria-label="Écran" style={s.seg}>
            <button type="button" aria-pressed={!phone} onClick={() => setPhone(false)} style={{ ...s.segBtn, ...(!phone ? s.segOn : {}) }}><Desktop size={14} /> Ordinateur</button>
            <button type="button" aria-pressed={phone} onClick={() => setPhone(true)} style={{ ...s.segBtn, ...(phone ? s.segOn : {}) }}><DeviceMobile size={14} /> Téléphone</button>
          </div>
        </div>

        <div style={s.stage}>
          <div style={{ ...s.mail, width: phone ? '390px' : '640px' }}>
            <div style={s.head}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://jasonmarinho.com/signature-jason.jpg" alt="" width={36} height={36} style={{ borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '13px' }}>
                  <strong style={{ color: 'var(--text)' }}>Jason Marinho</strong>
                  <span style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Pour : {cur?.to}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '2px', overflowWrap: 'anywhere' }}>{subject}</div>
                {preview && <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</div>}
              </div>
            </div>
            <iframe ref={frame} title={`Aperçu : ${subject}`} srcDoc={html} sandbox="allow-same-origin" onLoad={fit} style={{ width: '100%', height: `${height}px`, border: 0, display: 'block', background: '#F3F6F4' }} />
          </div>
        </div>
      </div>
    </details>
  )
}

const s: Record<string, React.CSSProperties> = {
  box: { borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' },
  summary: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', cursor: 'pointer', listStyle: 'none' },
  hint: { fontSize: '13px', color: 'var(--text-3)' },
  body: { borderTop: '1px solid var(--border)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' },
  toolbar: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' },
  nav: { display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: '1 1 300px' },
  select: { flex: 1, minWidth: 0, maxWidth: '420px', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13.5px', fontFamily: 'inherit' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '9px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0 },
  seg: { display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-2)' },
  segBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 11px', borderRadius: '9px', border: '1px solid transparent', background: 'transparent', color: 'var(--text-2)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  segOn: { border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontWeight: 600 },
  stage: { display: 'flex', justifyContent: 'center', padding: '18px 0', borderRadius: '12px', background: 'var(--bg-2)', overflowX: 'auto' },
  mail: { maxWidth: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--card-shadow)', transition: 'width 0.2s' },
  head: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', borderBottom: '1px solid var(--border)' },
}
