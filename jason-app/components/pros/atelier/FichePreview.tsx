'use client'

// Aperçu en direct de la fiche publique (atelier, étape 3, 27/10/2026) : ce que
// l'hôte verra, au téléphone ou dans l'annuaire, pendant que le pro écrit. La
// partie modifiée est entourée. Approché de la vraie fiche (scripts/lib/fiche-v3.mjs) :
// mêmes contenus, dans le même ordre, sans prétendre au pixel près.
import { useEffect, useRef, useState } from 'react'
import { Images } from '@phosphor-icons/react/dist/ssr'
import type { Etape } from '@/lib/pros/fiche-vitrine'
import { apercuBio } from '@/lib/pros/bio-aide'

export interface PreviewData {
  name: string
  firstName: string
  sousTitre: string
  cover: string | null
  logoUrl: string | null
  des: number | null
  unite: string
  km: number | null
  zone: string
  formules: Array<{ nom: string; prix: string; detail: string; vedette?: boolean }>
  bio: string
  deroule: Etape[]
  chips: string[]
  sub: string
}

/** Partie de l'atelier → morceau de la fiche à entourer */
const FOCUS: Record<string, string> = {
  photos: 'hero', identite: 'hero', formules: 'formules', presentation: 'bio', deroule: 'deroule',
  zone: 'zone', offre: 'chips', prestations: 'chips', equipe: 'chips', contact: 'cta',
}

export default function FichePreview({ data, active }: { data: PreviewData; active: string }) {
  const [mode, setMode] = useState<'fiche' | 'annuaire'>('fiche')
  const focus = FOCUS[active] ?? ''
  const frame = useRef<HTMLDivElement>(null)
  const parts = useRef<Record<string, HTMLElement | null>>({})

  // La partie modifiée vient au milieu de l'aperçu
  useEffect(() => {
    const el = parts.current[focus]
    const box = frame.current
    if (!el || !box || mode !== 'fiche') return
    const top = focus === 'hero' ? 0 : el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 90
    box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [focus, mode])

  const ring = (k: string): React.CSSProperties => (k === focus ? { outline: '2px solid #FFD56B', outlineOffset: 3, borderRadius: 12, background: 'rgba(255,213,107,.10)', position: 'relative' } : {})
  const tag = (k: string) => (k === focus ? <span style={s.tag}>Tu modifies cette partie</span> : null)
  const formules = data.formules.filter(f => f.nom.trim())
  const bio = apercuBio(data.bio, 180)

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', minWidth: 0 }}>Ce que les hôtes voient</div>
        <div role="group" aria-label="Aperçu" style={s.switch}>
          {(['fiche', 'annuaire'] as const).map(m => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} style={{ ...s.swBtn, ...(mode === m ? s.swOn : {}) }}>
              {m === 'fiche' ? 'Ta fiche' : 'Annuaire'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'fiche' ? (
        <div style={s.phone}>
          <div ref={frame} style={s.screen}>
            <div ref={el => { parts.current.hero = el }} style={{ ...ring('hero'), margin: 0 }}>
              {tag('hero')}
              <div style={{ ...s.cover, ...(data.cover ? { backgroundImage: `url('${data.cover}')` } : {}) }}>
                {!data.cover && <span style={s.coverEmpty}><Images size={16} /> Ta photo principale ici</span>}
              </div>
              <div style={{ padding: '12px 14px 0', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ ...s.avatar, ...(data.logoUrl ? { backgroundImage: `url('${data.logoUrl}')`, color: 'transparent' } : {}) }}>{initials(data.name)}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={s.name}>{data.name || 'Ton nom'}</div>
                  <div style={s.metier}>{data.sousTitre}</div>
                </div>
              </div>
            </div>
            <div style={s.facts}>
              <div style={s.fact}><b style={s.factV}>{data.des ? `${data.des} €` : 'Sur devis'}</b><span style={s.factL}>{data.des ? `dès, ${data.unite}` : 'prix'}</span></div>
              <div ref={el => { parts.current.zone = el }} style={{ ...s.fact, ...ring('zone') }}>{tag('zone')}<b style={s.factV}>{data.km ? `${data.km} km` : 'Zone'}</b><span style={s.factL}>{data.km ? 'autour de ta ville' : data.zone || 'ta zone'}</span></div>
            </div>
            {data.chips.length > 0 && (
              <div ref={el => { parts.current.chips = el }} style={{ ...s.block, ...ring('chips') }}>
                {tag('chips')}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{data.chips.slice(0, 6).map(c => <span key={c} style={s.chip}>{c}</span>)}</div>
              </div>
            )}
            <div ref={el => { parts.current.formules = el }} style={{ ...s.block, ...ring('formules') }}>
              {tag('formules')}
              <div style={s.h}>Formules</div>
              {formules.length ? formules.map((f, i) => (
                <div key={i} style={{ ...s.fm, ...(f.vedette ? s.fmTop : {}) }}>
                  {f.vedette && <span style={s.fmTag}>La plus demandée</span>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{f.nom}</span>
                    <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 14, color: 'var(--accent-text)', whiteSpace: 'nowrap' }}>{f.prix ? `${f.prix} €` : 'Sur devis'}</span>
                  </div>
                  {f.detail && <div style={{ fontSize: 10.5, color: 'var(--text-3)', lineHeight: 1.4, marginTop: 2 }}>{f.detail}</div>}
                </div>
              )) : <div style={s.empty}>Tes formules apparaîtront ici.</div>}
            </div>
            <div ref={el => { parts.current.bio = el }} style={{ ...s.block, ...ring('bio') }}>
              {tag('bio')}
              <div style={s.h}>Présentation</div>
              {data.bio.trim() ? <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.55, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{bio.visible}{bio.coupe && <span style={{ display: 'block', color: 'var(--accent-text)', fontWeight: 600, marginTop: 4, textDecoration: 'underline' }}>Lire la suite</span>}</p> : <div style={s.empty}>Ta présentation apparaîtra ici.</div>}
            </div>
            <div ref={el => { parts.current.deroule = el }} style={{ ...s.block, ...ring('deroule') }}>
              {tag('deroule')}
              <div style={s.h}>Comment ça se passe</div>
              {data.deroule.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <span style={s.step}>{i + 1}</span>
                  <div><div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)' }}>{e.titre}</div><div style={{ fontSize: 10.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{e.texte}</div></div>
                </div>
              ))}
            </div>
            <div ref={el => { parts.current.cta = el }} style={{ ...s.cta, ...ring('cta') }}>
              {tag('cta')}
              <div style={s.ctaBtn}>Demander un devis à {data.firstName || 'toi'}</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={s.card}>
          <div style={{ ...s.cardCover, ...(data.cover ? { backgroundImage: `url('${data.cover}')` } : {}) }} />
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ ...s.avatar, width: 40, height: 40, ...(data.logoUrl ? { backgroundImage: `url('${data.logoUrl}')`, color: 'transparent' } : {}) }}>{initials(data.name)}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 17, color: 'var(--text)' }}>{data.name || 'Ton nom'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{data.sub}</div>
              </div>
            </div>
            {data.chips.length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{data.chips.slice(0, 4).map(c => <span key={c} style={s.chip}>{c}</span>)}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{data.unite.replace(/^./, c => c.toUpperCase())}</span>
              <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 18, color: 'var(--accent-text)' }}>{data.des ? `dès ${data.des} €` : 'Sur devis'}</span>
            </div>
          </div>
        </div>
      )}
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>L’aperçu suit ce que tu écris, avant même la mise en ligne.</p>
    </div>
  )
}

function initials(name: string): string {
  return (name || '?').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 },
  switch: { display: 'inline-flex', padding: 3, borderRadius: 10, background: 'var(--accent-bg)' },
  swBtn: { border: 'none', whiteSpace: 'nowrap', padding: '6px 10px', borderRadius: 8, background: 'transparent', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', cursor: 'pointer' },
  swOn: { background: 'var(--surface)', color: 'var(--accent-text)' },
  phone: { borderRadius: 30, background: '#0F1A0D', padding: 8, boxShadow: '0 20px 50px rgba(0,26,17,.2)' },
  screen: { borderRadius: 23, overflow: 'auto', background: '#FDFCF9', height: 560, scrollbarWidth: 'none' },
  cover: { height: 150, background: 'linear-gradient(160deg, #9AA59A, #6F7C6E)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end', padding: 10 },
  coverEmpty: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.9)', borderRadius: 999, padding: '4px 10px', fontSize: 10.5, fontWeight: 600, color: '#0F1A0D' },
  avatar: { width: 36, height: 36, borderRadius: 11, background: '#004C3F', color: '#FFD56B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-fraunces), serif', fontSize: 14, flexShrink: 0, backgroundSize: 'cover', backgroundPosition: 'center' },
  name: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, color: '#0F1A0D', lineHeight: 1.2 },
  metier: { fontSize: 11, color: '#004C3F', fontWeight: 600, marginTop: 2 },
  facts: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, padding: '12px 14px 0' },
  fact: { background: '#F3F1EA', borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column' },
  factV: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 15, color: '#004C3F' },
  factL: { fontSize: 10, color: '#5A6B57', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  block: { margin: '14px 10px 0', padding: '8px 6px' },
  h: { fontFamily: 'var(--font-fraunces), serif', fontSize: 14.5, color: '#0F1A0D', marginBottom: 6 },
  chip: { fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: 'rgba(0,76,63,.07)', color: '#004C3F', fontWeight: 600 },
  fm: { background: '#fff', border: '1px solid rgba(0,76,63,.10)', borderRadius: 10, padding: '7px 9px', marginTop: 5 },
  fmTop: { border: '1.5px solid #004C3F' },
  fmTag: { display: 'inline-block', fontSize: 9, background: '#FFD56B', color: '#003329', padding: '1px 6px', borderRadius: 999, fontWeight: 700, marginBottom: 3 },
  empty: { fontSize: 11, color: '#5A6B57', fontStyle: 'italic' },
  step: { width: 18, height: 18, borderRadius: '50%', background: '#004C3F', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cta: { margin: '16px 10px 14px', padding: 4 },
  ctaBtn: { background: '#FFD56B', color: '#003329', textAlign: 'center', borderRadius: 10, padding: 10, fontSize: 12.5, fontWeight: 700 },
  tag: { position: 'absolute', top: -9, right: 8, zIndex: 2, background: '#FFD56B', color: '#003329', fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999 },
  card: { background: '#fff', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,26,17,.10)' },
  cardCover: { height: 140, background: 'linear-gradient(160deg, #C9CFC2, #9DA898)', backgroundSize: 'cover', backgroundPosition: 'center' },
}
