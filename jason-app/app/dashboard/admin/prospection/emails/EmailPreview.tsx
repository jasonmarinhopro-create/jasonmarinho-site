'use client'

// Aperçu des e-mails (21/11/2026, Jason : « plus fin, rarement utilisé »,
// puis « dans l'ordre du premier au dernier, la partie de gauche plus
// visuelle ») : une ligne repliée ; ouverte, à gauche le parcours d'un public
// (hôte, voyageur, pro, toi), e-mails numérotés dans l'ordre où on les reçoit,
// étape par étape ; à droite l'e-mail comme dans une boîte de réception.
// Le serveur ne prépare que l'e-mail choisi (?apercu=<id>).
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretDown, CaretLeft, CaretRight, Desktop, DeviceMobile, EnvelopeSimpleOpen, House, Suitcase, Camera, UserCircle } from '@phosphor-icons/react/dist/ssr'
import InlineStyle from '@/components/ui/InlineStyle'

export interface PreviewJourney {
  key: 'hote' | 'voyageur' | 'pro' | 'toi'
  label: string
  etapes: Array<{ etape: string; items: Array<{ id: string; label: string; to: string }> }>
}

const ICONS = { hote: House, voyageur: Suitcase, pro: Camera, toi: UserCircle } as const

export default function EmailPreview({ journeys, current, subject, preview, html, open }: {
  journeys: PreviewJourney[]; current: string; subject: string; preview: string; html: string; open: boolean
}) {
  const router = useRouter()
  const owner = journeys.find(j => j.etapes.some(e => e.items.some(i => i.id === current))) ?? journeys[0]
  const [tab, setTab] = useState(owner.key)
  const [phone, setPhone] = useState(false)
  const [height, setHeight] = useState(640)
  const frame = useRef<HTMLIFrameElement>(null)
  useEffect(() => { setTab(owner.key) }, [owner.key])

  const flat = owner.etapes.flatMap(e => e.items)
  const pos = Math.max(0, flat.findIndex(i => i.id === current))
  const cur = flat[pos]
  const go = (id: string) => router.push(`?apercu=${encodeURIComponent(id)}#apercu`, { scroll: false })
  const shown = journeys.find(j => j.key === tab) ?? owner
  const total = journeys.reduce((t, j) => t + j.etapes.reduce((n, e) => n + e.items.length, 0), 0)

  const fit = () => {
    try {
      const h = frame.current?.contentDocument?.documentElement.scrollHeight
      if (h) setHeight(h + 2)
    } catch { /* hauteur par défaut */ }
  }
  useEffect(() => { const t = setTimeout(fit, 250); return () => clearTimeout(t) }, [phone, html])

  let n = 0
  return (
    <details id="apercu" open={open} style={s.box}>
      <InlineStyle css={CSS} />
      <summary style={s.summary}>
        <span style={s.badge}><EnvelopeSimpleOpen size={17} weight="fill" /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: '14.5px', color: 'var(--text)' }}>Voir le rendu des e-mails</strong>
          <span style={{ fontSize: '13px', color: 'var(--text-3)' }}> · {total} e-mails, du premier au dernier</span>
        </span>
        <CaretDown size={15} style={{ color: 'var(--text-3)' }} />
      </summary>

      <div style={s.body}>
        <aside style={s.aside}>
          <div role="tablist" aria-label="Public" style={s.tabs}>
            {journeys.map(j => {
              const Icon = ICONS[j.key]
              const on = j.key === tab
              return (
                <button key={j.key} type="button" role="tab" aria-selected={on} onClick={() => setTab(j.key)} style={{ ...s.tab, ...(on ? s.tabOn : {}) }}>
                  <Icon size={15} weight={on ? 'fill' : 'regular'} />{j.label}
                </button>
              )
            })}
          </div>

          <ol style={s.list}>
            {shown.etapes.map(e => (
              <li key={e.etape} style={{ listStyle: 'none' }}>
                <div style={s.etape}><span style={s.dot} />{e.etape}</div>
                <ol style={{ margin: 0, padding: 0 }}>
                  {e.items.map(it => {
                    n += 1
                    const on = it.id === current
                    return (
                      <li key={it.id} style={{ listStyle: 'none' }}>
                        <button type="button" className={`ep-item${on ? ' ep-on' : ''}`} aria-current={on ? 'true' : undefined} onClick={() => go(it.id)}>
                          <span className="ep-node">{n}</span>
                          <span className="ep-card">
                            <span className="ep-label">{it.label}</span>
                            <span className="ep-to">Pour : {it.to}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </li>
            ))}
          </ol>
        </aside>

        <div style={s.main}>
          <div style={s.toolbar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button type="button" aria-label="E-mail précédent" disabled={pos === 0} onClick={() => go(flat[pos - 1].id)} style={{ ...s.iconBtn, opacity: pos === 0 ? 0.4 : 1 }}><CaretLeft size={14} weight="bold" /></button>
              <span style={{ fontSize: '13px', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{owner.label} · {pos + 1} / {flat.length}</span>
              <button type="button" aria-label="E-mail suivant" disabled={pos === flat.length - 1} onClick={() => go(flat[pos + 1].id)} style={{ ...s.iconBtn, opacity: pos === flat.length - 1 ? 0.4 : 1 }}><CaretRight size={14} weight="bold" /></button>
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
                    <span style={{ color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pour : {cur?.to}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '2px', overflowWrap: 'anywhere' }}>{subject}</div>
                  {preview && <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</div>}
                </div>
              </div>
              <iframe ref={frame} title={`Aperçu : ${subject}`} srcDoc={html} sandbox="allow-same-origin" onLoad={fit} style={{ width: '100%', height: `${height}px`, border: 0, display: 'block', background: '#F3F6F4' }} />
            </div>
          </div>
        </div>
      </div>
    </details>
  )
}

// Frise : une ligne verticale relie les pastilles numérotées ; l'e-mail affiché
// est en vert plein avec un halo, sa carte ressort. CSS constant (InlineStyle).
const CSS = `
.ep-item { all: unset; box-sizing: border-box; cursor: pointer; display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 10px; width: 100%; position: relative; padding: 3px 0; }
.ep-item::before { content: ""; position: absolute; left: 14px; top: 0; bottom: 0; width: 2px; background: var(--border); }
li:first-child .ep-item::before { top: 50%; }
li:last-child .ep-item::before { bottom: 50%; }
li:only-child .ep-item::before { display: none; }
.ep-node { position: relative; z-index: 1; align-self: center; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; background: var(--surface); color: var(--text-3); border: 1.5px solid var(--border); transition: all .2s ease; }
.ep-card { display: flex; flex-direction: column; gap: 1px; min-width: 0; padding: 9px 12px; border-radius: 12px; border: 1px solid transparent; transition: all .2s ease; }
.ep-label { font-size: 13.5px; font-weight: 500; color: var(--text); line-height: 1.35; }
.ep-to { font-size: 12px; color: var(--text-3); }
.ep-item:hover .ep-card { background: var(--bg-2); }
.ep-item:hover .ep-node { border-color: var(--accent-text); color: var(--accent-text); }
.ep-item:focus-visible .ep-card { outline: 2px solid var(--accent-text); outline-offset: 1px; }
.ep-on .ep-node { background: var(--accent-text); border-color: var(--accent-text); color: var(--bg); box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent-text) 16%, transparent); }
.ep-on .ep-card, .ep-on:hover .ep-card { background: var(--surface); border-color: var(--border); box-shadow: var(--card-shadow); transform: translateX(3px); }
.ep-on .ep-label { font-weight: 650; color: var(--accent-text); }
@media (prefers-reduced-motion: reduce) { .ep-node, .ep-card { transition: none; } .ep-on .ep-card { transform: none; } }
`

const s: Record<string, React.CSSProperties> = {
  box: { borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' },
  summary: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', cursor: 'pointer', listStyle: 'none' },
  badge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent-bg)', color: 'var(--accent-text)', flexShrink: 0 },
  body: { borderTop: '1px solid var(--border)', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '18px', alignItems: 'flex-start' },
  aside: { flex: '1 1 300px', maxWidth: '380px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px', padding: '14px', borderRadius: '16px', background: 'linear-gradient(160deg, var(--accent-bg), transparent 70%), var(--bg)', border: '1px solid var(--border)' },
  tabs: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '4px', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)' },
  tab: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px 4px', borderRadius: '9px', border: '1px solid transparent', background: 'transparent', color: 'var(--text-2)', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  tabOn: { background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 600 },
  list: { margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' },
  etape: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 4px 2px' },
  dot: { width: '7px', height: '7px', borderRadius: '50%', background: '#FFD56B', flexShrink: 0 },
  main: { flex: '3 1 420px', minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
  toolbar: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '9px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0 },
  seg: { display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-2)' },
  segBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 11px', borderRadius: '9px', border: '1px solid transparent', background: 'transparent', color: 'var(--text-2)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  segOn: { border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontWeight: 600 },
  stage: { display: 'flex', justifyContent: 'center', padding: '18px 0', borderRadius: '14px', background: 'var(--bg-2)', overflowX: 'auto' },
  mail: { maxWidth: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--card-shadow)', transition: 'width 0.2s' },
  head: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', borderBottom: '1px solid var(--border)' },
}
