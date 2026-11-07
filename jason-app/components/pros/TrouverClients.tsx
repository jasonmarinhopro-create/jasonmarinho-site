'use client'

// Page « Trouver des clients » des pros (07/11/2026, Jason : « comme avec les
// hôtes trouver des voyageurs, là c'est trouver des clients »). Même principe
// que /dashboard/communaute : groupes Facebook où sont les hôtes et les
// conciergeries (choisis dans l'admin Communauté, colonne audiences), bouton
// Rejoindre suivi (/api/groupes/ouvrir), « J'y suis » partagé avec les hôtes
// (user_community_memberships), messages prêts à publier avec le lien de la
// fiche, et recherche Facebook des groupes de la ville du pro.
import { useMemo, useState, useTransition } from 'react'
import { FacebookLogo, ArrowUpRight, Check, X, Copy, MagnifyingGlass, UsersThree, Info } from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import InlineStyle from '@/components/ui/InlineStyle'
import { setGroupMembership } from '@/app/dashboard/communaute/actions'
import { clientSearches, groupOpenUrl, proPostTemplates, type ProMetierSlug } from '@/lib/pros/groupes-clients'

export interface ProGroup {
  id: string
  name: string
  description: string
  members_count: number
  tag: string | null
}

const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k` : String(n)
const parseTags = (t: string | null) => (t ?? '').split(',').map(x => x.trim()).filter(Boolean)

const CSS = `
.tc-layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px;align-items:start}
.tc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:14px}
.tc-aside{position:sticky;top:calc(var(--header-h) + 16px);display:flex;flex-direction:column;gap:14px}
@media (max-width:1100px){.tc-layout{grid-template-columns:minmax(0,1fr)}.tc-aside{position:static;order:-1}}
`

const LABEL: Record<ProMetierSlug, { clients: string; desc: string }> = {
  photographe: { clients: 'hôtes et conciergeries', desc: 'Dans ces groupes, des propriétaires et des conciergeries cherchent un photographe pour leurs annonces. Présente-toi, partage ta fiche et réponds aux demandes.' },
  menage: { clients: 'hôtes et conciergeries', desc: 'Dans ces groupes, des propriétaires et des conciergeries cherchent une équipe de ménage pour leurs locations. Présente-toi, partage ta fiche et réponds aux demandes.' },
  depannage: { clients: 'hôtes et conciergeries', desc: 'Dans ces groupes, des propriétaires et des conciergeries cherchent des artisans fiables pour leurs logements. Présente-toi, partage ta fiche et réponds aux demandes.' },
}

export default function TrouverClients({ metier, groups, initialMemberships, prenom, ville, ficheUrl }: {
  metier: ProMetierSlug
  groups: ProGroup[]
  initialMemberships: Record<string, 'joined' | 'dismissed'>
  prenom: string | null
  ville: string | null
  ficheUrl: string | null
}) {
  const [memberships, setMemberships] = useState(initialMemberships)
  const [, startTransition] = useTransition()
  const [showHidden, setShowHidden] = useState(false)
  const templates = useMemo(() => proPostTemplates(metier, { prenom, ville, lien: ficheUrl }), [metier, prenom, ville, ficheUrl])
  const [tplKey, setTplKey] = useState(templates[0]?.key ?? '')
  const tpl = templates.find(t => t.key === tplKey) ?? templates[0]
  const [copied, setCopied] = useState(false)
  const searches = clientSearches(metier, ville)

  const visible = groups.filter(g => showHidden || memberships[g.id] !== 'dismissed')
  const hiddenCount = groups.filter(g => memberships[g.id] === 'dismissed').length
  const joined = groups.filter(g => memberships[g.id] === 'joined')
  const reach = joined.reduce((n, g) => n + (g.members_count || 0), 0)

  function setStatus(id: string, status: 'joined' | 'dismissed' | null) {
    const before = memberships
    setMemberships(prev => {
      const next = { ...prev }
      if (status) next[id] = status; else delete next[id]
      return next
    })
    startTransition(async () => {
      const r = await setGroupMembership(id, status)
      if (r && 'error' in r && r.error) setMemberships(before)
    })
  }

  async function copy() {
    if (!tpl) return
    try {
      await navigator.clipboard.writeText(tpl.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* presse-papiers refusé : le texte reste sélectionnable */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      <InlineStyle css={CSS} />
      <HubHero
        eyebrowIcon={<FacebookLogo size={14} weight="fill" />}
        eyebrow="Groupes Facebook"
        title={<>Des clients t&apos;attendent, <HeroEm>sans commission</HeroEm></>}
        desc={LABEL[metier].desc}
        steps={[
          ['Rejoins', 'les groupes d’hôtes et de conciergeries'],
          ['Copie', 'ton message prêt à publier'],
          ['Publie', 'et réponds aux demandes'],
        ]}
        aside={<>
          <div style={{ ...heroCard, minWidth: 180 }}>
            <span style={st.heroVal}>{joined.length}<span style={{ fontSize: 18, color: 'var(--text-3)' }}> / {groups.length}</span></span>
            <span style={st.heroLbl}>groupes rejoints</span>
          </div>
          {reach > 0 && (
            <div style={{ ...heroCard, minWidth: 180 }}>
              <span style={st.heroVal}>{fmtNum(reach)}</span>
              <span style={st.heroLbl}>membres dans tes groupes</span>
            </div>
          )}
        </>}
      />

      <div className="tc-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div style={st.note}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Lis le règlement de chaque groupe avant de publier : beaucoup limitent la publicité à certains jours. Répondre aux demandes des membres marche souvent mieux qu’une annonce répétée.</span>
          </div>

          {groups.length === 0 ? (
            <p style={st.empty}>Les groupes arrivent bientôt. En attendant, cherche ceux de ta ville avec les recherches à droite.</p>
          ) : (
            <div className="tc-grid">
              {visible.map(g => {
                const isJoined = memberships[g.id] === 'joined'
                const isDismissed = memberships[g.id] === 'dismissed'
                const tags = parseTags(g.tag)
                return (
                  <div key={g.id} className="glass-card" style={{ ...st.card, opacity: isDismissed ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={st.fbIco}><FacebookLogo size={18} weight="fill" color="var(--accent-text)" /></span>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={st.name}>{g.name}</h3>
                        {tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                            {tags.map(t => <span key={t} style={st.tag}>{t}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                    {g.description && <p style={st.desc}>{g.description}</p>}
                    {g.members_count > 0 && (
                      <span style={st.members}><UsersThree size={13} weight="fill" color="var(--accent-text)" /><strong>{fmtNum(g.members_count)}</strong> membres</span>
                    )}
                    <div style={st.actions}>
                      <a href={groupOpenUrl(g.id, metier)} target="_blank" rel="noopener noreferrer" style={st.join}>
                        Rejoindre <ArrowUpRight size={12} />
                      </a>
                      {isDismissed ? (
                        <button type="button" onClick={() => setStatus(g.id, null)} style={st.ghost}>Remettre</button>
                      ) : (
                        <>
                          <button type="button" onClick={() => setStatus(g.id, isJoined ? null : 'joined')} style={{ ...st.ghost, ...(isJoined ? st.on : {}) }}>
                            <Check size={12} weight={isJoined ? 'bold' : 'regular'} /> {isJoined ? 'J’y suis' : 'J’y suis ?'}
                          </button>
                          {!isJoined && (
                            <button type="button" onClick={() => setStatus(g.id, 'dismissed')} style={st.x} aria-label="Pas intéressé par ce groupe" title="Pas intéressé">
                              <X size={11} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {hiddenCount > 0 && (
            <button type="button" onClick={() => setShowHidden(v => !v)} style={{ ...st.linkBtn, alignSelf: 'flex-start' }}>
              {showHidden ? 'Cacher les groupes masqués' : `Voir les ${hiddenCount} groupe${hiddenCount > 1 ? 's' : ''} masqué${hiddenCount > 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        <aside className="tc-aside">
          <div className="glass-card" style={st.panel}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={st.fbIco}><FacebookLogo size={18} weight="fill" color="var(--accent-text)" /></span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Ton message prêt à publier</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{ficheUrl ? 'Avec le lien de ta fiche' : 'Publie ta fiche pour y mettre son lien'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {templates.map(t => (
                <button key={t.key} type="button" onClick={() => setTplKey(t.key)} style={{ ...st.chip, ...(t.key === tpl?.key ? st.chipOn : {}) }}>{t.title}</button>
              ))}
            </div>
            <textarea readOnly value={tpl?.text ?? ''} style={st.text} aria-label="Message à publier" />
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>Remplace ce qui est entre crochets avant de publier. Les visites venues de ce lien comptent dans tes statistiques.</p>
            <button type="button" onClick={copy} style={st.copy}>
              {copied ? <><Check size={15} weight="bold" /> Copié</> : <><Copy size={15} /> Copier le message</>}
            </button>
          </div>

          <div className="glass-card" style={st.panel}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              <MagnifyingGlass size={16} color="var(--accent-text)" /> Les groupes de ta ville
            </div>
            {searches.length > 0 ? (
              <>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>Ces recherches ouvrent Facebook sur les groupes de {ville} : ceux des hôtes près de chez toi.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {searches.map(sr => (
                    <a key={sr.url} href={sr.url} target="_blank" rel="noopener noreferrer" style={st.search}>
                      <span>{sr.label}</span><ArrowUpRight size={13} />
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>Indique ta ville sur ta fiche pour avoir les recherches de groupes près de chez toi.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

const st: Record<string, React.CSSProperties> = {
  heroVal: { fontFamily: 'var(--font-fraunces), serif', fontSize: 34, lineHeight: 1.1, color: 'var(--accent-text)' },
  heroLbl: { fontSize: 12.5, color: 'var(--text-2)' },
  note: { display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 },
  empty: { fontSize: 14, color: 'var(--text-3)', padding: '20px 0' },
  card: { display: 'flex', flexDirection: 'column', gap: 12, padding: 18, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0 },
  fbIco: { width: 36, height: 36, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  name: { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontSize: 16, fontWeight: 500, lineHeight: 1.3, color: 'var(--text)' },
  tag: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },
  desc: { margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' },
  members: { display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontSize: 12.5, color: 'var(--text-2)', padding: '5px 10px', borderRadius: 99, border: '1px solid var(--border)' },
  actions: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto', flexWrap: 'wrap' },
  join: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 13px', borderRadius: 10, border: '1px solid var(--border-2)', color: 'var(--text)', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  ghost: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  on: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontWeight: 600 },
  x: { width: 30, height: 30, borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  linkBtn: { background: 'none', border: 'none', padding: 0, color: 'var(--accent-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 },
  panel: { display: 'flex', flexDirection: 'column', gap: 12, padding: 18, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)' },
  chip: { padding: '6px 11px', borderRadius: 99, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  chipOn: { border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 600 },
  text: { width: '100%', minHeight: 230, resize: 'vertical', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' },
  copy: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  search: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13.5, fontWeight: 500, textDecoration: 'none' },
}
