'use client'

// QG → Demandes d'hôtes (12/10/2026, Jason : « avoir une fiche pour analyser
// le travail et potentiellement l'envoyer à des gens »). Liste à gauche,
// fiche à droite : le besoin, l'hôte, les pros sollicités et leur réaction,
// envoi à un autre pro de l'annuaire, texte à partager SANS les coordonnées de
// l'hôte (décision de Jason), note interne, « traitée ».

import { useEffect, useMemo, useState, useTransition } from 'react'
import { etablissementLabel } from '@/lib/pros/clienteles'
import {
  Camera, Sparkle, MagnifyingGlass, ArrowLeft, EnvelopeSimple, Phone, Copy, Check,
  PaperPlaneTilt, WhatsappLogo, CheckCircle, ArrowCounterClockwise, Eye, Clock, ArrowSquareOut, Note,
} from '@phosphor-icons/react/dist/ssr'
import RelativeTime from '@/components/ui/RelativeTime'
import InlineStyle from '@/components/ui/InlineStyle'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { AMBER, BROWN, PINK, tint } from '../_ui/theme'
import { ETAT_LABELS, texteAPartager, prosAProposer, proximiteLabel, type EtatAdmin, type ProChoix } from '@/lib/demandes/admin'
import { besoinPhoto, adequationLabel } from '@/lib/demandes/rules'
import type { DemandeMetier } from '@/lib/demandes/rules'
import type { DemandeQG } from './demandes-load'
import { markDemandeSeen, saveDemandeNote, setDemandeDone, sendDemandeToPro } from './demandes-actions'

type Filtre = 'a_traiter' | 'sans_pro' | 'en_cours' | 'traitees' | 'toutes'

const ETAT_COLORS: Record<EtatAdmin, string> = {
  sans_pro: PINK,
  attente: AMBER,
  repondue: 'var(--accent-text)',
  traitee: BROWN,
}
const METIER: Record<DemandeMetier, { label: string; Icon: typeof Camera; dir: string }> = {
  photographe: { label: 'Photographe', Icon: Camera, dir: 'photographes' },
  menage: { label: 'Ménage', Icon: Sparkle, dir: 'menage' },
}

const CSS = `
.dh-grid{display:grid;gap:16px;align-items:start}
@media(min-width:1100px){.dh-grid{grid-template-columns:minmax(300px,380px) minmax(0,1fr)}.dh-back{display:none!important}}
@media(max-width:1099px){.dh-grid.open .dh-list{display:none!important}.dh-grid:not(.open) .dh-detail{display:none!important}}
.dh-cols{display:grid;gap:14px;align-items:start}
@media(min-width:1500px){.dh-cols{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}}
.dh-item:hover{border-color:var(--accent-border)!important}
`

export default function DemandesHotes({ initial, pros, initialId, suiviOk, error, onCount }: {
  initial: DemandeQG[]
  pros: Record<DemandeMetier, ProChoix[]>
  initialId: string | null
  suiviOk: boolean
  error: string | null
  /** Nombre « à traiter » pour la navigation du QG */
  onCount?: (n: number) => void
}) {
  const [items, setItems] = useState(initial)
  const counts = useMemo(() => ({
    a_traiter: items.filter(d => d.aTraiter).length,
    sans_pro: items.filter(d => d.etat === 'sans_pro').length,
    en_cours: items.filter(d => d.etat === 'attente' || d.etat === 'repondue').length,
    traitees: items.filter(d => d.etat === 'traitee').length,
    toutes: items.length,
  }), [items])
  useEffect(() => { onCount?.(counts.a_traiter) }, [counts.a_traiter, onCount])
  const [filtre, setFiltre] = useState<Filtre>(() => (initialId ? 'toutes' : counts.a_traiter > 0 ? 'a_traiter' : 'toutes'))
  const [metier, setMetier] = useState<'tous' | DemandeMetier>('tous')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialId)
  const [open, setOpen] = useState(!!initialId)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items.filter(d => {
      if (metier !== 'tous' && d.metier !== metier) return false
      if (filtre === 'a_traiter' && !d.aTraiter && d.id !== selectedId) return false
      if (filtre === 'sans_pro' && d.etat !== 'sans_pro') return false
      if (filtre === 'en_cours' && !(d.etat === 'attente' || d.etat === 'repondue')) return false
      if (filtre === 'traitees' && d.etat !== 'traitee') return false
      if (s && !`${d.ville} ${d.nom} ${d.email} ${d.logement ?? ''}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [items, filtre, metier, q, selectedId])

  const selected = items.find(d => d.id === selectedId) ?? (open ? null : list[0] ?? null)

  function patch(id: string, p: Partial<DemandeQG>) {
    setItems(prev => prev.map(d => d.id === id ? { ...d, ...p } : d))
  }

  function select(d: DemandeQG) {
    setSelectedId(d.id)
    setOpen(true)
    if (!d.admin_seen_at && suiviOk) {
      patch(d.id, { admin_seen_at: new Date().toISOString(), aTraiter: d.etat !== 'traitee' && d.aTraiterVue })
      markDemandeSeen(d.id).catch(() => {})
    }
  }

  if (error) return <div style={st.notice}>{error}</div>

  return (
    <div>
      <InlineStyle css={CSS} />
      {!suiviOk && <div style={{ ...st.notice, marginBottom: 12 }}>Le suivi (vue, note, traitée) s’activera quand la migration 133 sera passée. Le reste fonctionne déjà.</div>}

      <div style={st.toolbar}>
        <div style={st.pills} role="tablist" aria-label="Filtrer les demandes">
          {([
            ['a_traiter', 'À traiter'], ['sans_pro', 'Sans pro'], ['en_cours', 'En cours'], ['traitees', 'Traitées'], ['toutes', 'Toutes'],
          ] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={filtre === k} onClick={() => setFiltre(k)} style={{ ...st.pill, ...(filtre === k ? st.pillOn : {}) }}>
              {label}<span style={{ ...st.pillN, ...(filtre === k ? st.pillNOn : {}) }}>{counts[k]}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={st.seg}>
            {([['tous', 'Tous'], ['photographe', 'Photo'], ['menage', 'Ménage']] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setMetier(k)} style={{ ...st.segBtn, ...(metier === k ? st.segOn : {}) }}>{label}</button>
            ))}
          </div>
          <label style={st.search}>
            <MagnifyingGlass size={14} style={{ color: 'var(--text-muted)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ville, nom, e-mail…" style={st.searchInput} />
          </label>
        </div>
      </div>

      <div className={`dh-grid${open && selected ? ' open' : ''}`}>
        <div className="dh-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.length === 0 ? (
            <div style={st.empty}>
              <CheckCircle size={26} weight="duotone" style={{ color: 'var(--accent-text)' }} />
              <p style={{ margin: 0 }}>{items.length === 0 ? 'Aucune demande d’hôte pour l’instant. Elles arrivent par jasonmarinho.com/trouver-un-pro.' : 'Rien dans ce filtre.'}</p>
            </div>
          ) : list.map(d => <ListItem key={d.id} d={d} on={selected?.id === d.id} onClick={() => select(d)} />)}
        </div>
        <div className="dh-detail">
          {selected
            ? <Fiche key={selected.id} d={selected} pros={pros[selected.metier]} suiviOk={suiviOk} onBack={() => setOpen(false)} patch={p => patch(selected.id, p)} />
            : <div style={st.empty}><p style={{ margin: 0 }}>Choisis une demande pour voir sa fiche.</p></div>}
        </div>
      </div>
    </div>
  )
}

function EtatPill({ etat }: { etat: EtatAdmin }) {
  const c = ETAT_COLORS[etat]
  return <span style={{ ...st.etat, color: c, background: tint(c, 10), border: `1px solid ${tint(c, 28)}` }}>{ETAT_LABELS[etat]}</span>
}

function ListItem({ d, on, onClick }: { d: DemandeQG; on: boolean; onClick: () => void }) {
  const M = METIER[d.metier]
  const detail = [d.etablissement && d.etablissement !== 'lcd' ? etablissementLabel(d.etablissement) : null, d.logement, d.frequence ? (d.metier === 'menage' ? (d.frequence.startsWith('Des ménages réguliers') ? 'ménages réguliers' : 'ménage ponctuel') : d.frequence.toLowerCase()) : null, d.quand].filter(Boolean).join(' · ')
  return (
    <button type="button" className="dh-item" onClick={onClick} style={{ ...st.item, ...(on ? st.itemOn : {}) }}>
      <span style={st.itemIcon}><M.Icon size={16} weight="duotone" /></span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!d.admin_seen_at && <span style={st.dot} aria-label="Pas encore vue" />}
          <strong style={st.itemTitle}>{M.label} à {d.ville}</strong>
          <span style={st.itemTime}><RelativeTime iso={d.created_at} /></span>
        </span>
        {detail && <span style={st.itemSub}>{detail}</span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
          <EtatPill etat={d.etat} />
          <span style={st.itemMeta}>{d.envois.length ? `${d.envois.length} pro${d.envois.length > 1 ? 's' : ''} sollicité${d.envois.length > 1 ? 's' : ''}` : 'Aucun pro sollicité'}</span>
        </span>
      </span>
    </button>
  )
}

function Fiche({ d, pros, suiviOk, onBack, patch }: {
  d: DemandeQG; pros: ProChoix[]; suiviOk: boolean; onBack: () => void; patch: (p: Partial<DemandeQG>) => void
}) {
  const M = METIER[d.metier]
  const { confirm, dialog } = useConfirm()
  const [pending, startT] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [note, setNote] = useState(d.admin_note ?? '')
  const [noteSaved, setNoteSaved] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [tu, setTu] = useState(true)
  const [copied, setCopied] = useState(false)
  const propositions = useMemo(() => prosAProposer(pros, d, recherche).slice(0, 6), [pros, d, recherche])
  const partage = texteAPartager(d, tu)
  const faits = ([
    ['Type', d.etablissement && d.etablissement !== 'lcd' ? etablissementLabel(d.etablissement) : null], [d.etablissement === 'hotel' || d.etablissement === 'conciergerie' ? 'Taille' : 'Logement', d.logement], ['Besoin', d.frequence], ['Quand', d.quand], ['Budget', d.budget],
  ] as const).filter(([, v]) => v)

  function flash(ok: boolean, text: string) { setMsg({ ok, text }); setTimeout(() => setMsg(null), 3500) }

  function toggleDone() {
    const done = d.etat !== 'traitee'
    const before = { etat: d.etat, admin_done_at: d.admin_done_at, aTraiter: d.aTraiter }
    patch(done
      ? { etat: 'traitee', admin_done_at: new Date().toISOString(), aTraiter: false }
      : { etat: d.etatOuvert, admin_done_at: null, aTraiter: d.aTraiterVue })
    startT(async () => {
      const res = await setDemandeDone(d.id, done)
      if ('error' in res) { patch(before); flash(false, res.error) }
      else flash(true, done ? 'Demande marquée traitée' : 'Demande rouverte')
    })
  }

  function saveNote() {
    if (noteSaved) return
    startT(async () => {
      const res = await saveDemandeNote(d.id, note)
      if ('error' in res) flash(false, res.error)
      else { setNoteSaved(true); patch({ admin_note: note.trim() || null }) }
    })
  }

  async function envoyer(p: ProChoix) {
    if (!(await confirm({
      message: `Envoyer la demande à ${p.nom} ? Il la reçoit par e-mail et dans ses Demandes reçues, avec les coordonnées de l’hôte, et l’hôte est prévenu.`,
      confirmLabel: 'Envoyer',
    }))) return
    startT(async () => {
      const res = await sendDemandeToPro(d.id, p.id)
      if ('error' in res) { flash(false, res.error); return }
      const round = Math.max(1, ...d.envois.map(e => e.round))
      patch({
        envois: [...d.envois, { proId: p.id, nom: p.nom, slug: p.slug, ville: p.ville, round, at: new Date().toISOString(), manual: true, ouvert: false }],
        sent_to: [...d.sent_to, { id: p.id, round, manual: true }],
        etat: d.etat === 'sans_pro' ? 'attente' : d.etat,
        etatOuvert: d.etatOuvert === 'sans_pro' ? 'attente' : d.etatOuvert,
      })
      flash(true, `Demande envoyée à ${res.nom}`)
    })
  }

  function copier() {
    navigator.clipboard?.writeText(partage).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
  }

  const sujet = `Un hôte cherche ${d.metier === 'photographe' ? 'un photographe' : 'une équipe de ménage'} à ${d.ville}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {dialog}
      <button type="button" className="dh-back" onClick={onBack} style={st.back}><ArrowLeft size={14} /> Toutes les demandes</button>

      <section style={st.head}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div style={st.eyebrow}><M.Icon size={13} weight="duotone" /> Demande d’hôte · reçue <RelativeTime iso={d.created_at} /></div>
          <h2 style={st.h2}>{M.label === 'Ménage' ? 'Équipe de ménage' : 'Photographe'} à {d.ville}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <EtatPill etat={d.etat} />
            {d.admin_seen_at && <span style={st.muted}><Eye size={12} /> Vue</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {suiviOk && (
            <button type="button" onClick={toggleDone} disabled={pending} style={d.etat === 'traitee' ? st.btnGhost : st.btnPrimary}>
              {d.etat === 'traitee' ? <><ArrowCounterClockwise size={14} /> Rouvrir</> : <><CheckCircle size={14} weight="bold" /> Marquer traitée</>}
            </button>
          )}
        </div>
      </section>
      {msg && <div style={{ ...st.flash, color: msg.ok ? 'var(--accent-text)' : 'var(--danger-text)' }}>{msg.ok ? <Check size={14} weight="bold" /> : null}{msg.text}</div>}

      <div className="dh-cols">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section style={st.card}>
            <h3 style={st.h3}>Le besoin</h3>
            {faits.length > 0 ? (
              <dl style={st.dl}>
                {faits.map(([k, v]) => (
                  <div key={k} style={st.dlRow}><dt style={st.dt}>{k}</dt><dd style={st.dd}>{v}</dd></div>
                ))}
              </dl>
            ) : <p style={st.p}>L’hôte n’a pas précisé de détails.</p>}
            {d.message && <blockquote style={st.quote}>{d.message}</blockquote>}
          </section>

          <section style={st.card}>
            <h3 style={st.h3}>L’hôte</h3>
            <div style={st.hostName}>{d.nom}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-2)' }}>
              <span>{d.email}</span>
              {d.telephone && <span>{d.telephone}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <a href={`mailto:${d.email}?subject=${encodeURIComponent(`Ta demande à ${d.ville}`)}`} style={st.btnGhost}><EnvelopeSimple size={14} /> Écrire</a>
              {d.telephone && <a href={`tel:${d.telephone.replace(/\s/g, '')}`} style={st.btnGhost}><Phone size={14} /> Appeler</a>}
            </div>
            <div style={st.small}>Venu de : {d.provenance}{d.source ? ` · page ${d.source.replace(/^https?:\/\/(www\.)?jasonmarinho\.com/, '') || '/'}` : ''}</div>
          </section>

          <section style={st.card}>
            <h3 style={st.h3}>Pros sollicités</h3>
            {d.envois.length === 0 ? (
              <p style={st.p}>Aucun pro de l’annuaire dans la zone pour l’instant. Transmets-la à un pro ci-contre ou partage le besoin.</p>
            ) : (
              <ul style={st.ul}>
                {d.envois.map((e, i) => (
                  <li key={`${e.proId}-${i}`} style={st.li}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>
                        {e.slug
                          ? <a href={`https://jasonmarinho.com/annuaires/${M.dir}/${e.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{e.nom} <ArrowSquareOut size={11} /></a>
                          : e.nom}
                      </div>
                      <div style={st.small}>
                        {e.ville ? `${e.ville} · ` : ''}{e.manual ? 'envoyée à la main' : `envoi automatique ${e.round}`}{e.at ? <> · <RelativeTime iso={e.at} /></> : null}
                      </div>
                    </div>
                    {e.ouvert
                      ? <span style={{ ...st.etat, color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}><Check size={11} weight="bold" /> Pris en charge</span>
                      : <span style={{ ...st.etat, color: 'var(--text-3)', background: 'var(--bg-2)', border: '1px solid var(--border)' }}><Clock size={11} /> Pas de signe</span>}
                  </li>
                ))}
              </ul>
            )}
            <p style={st.small}>« Pris en charge » : le pro a cliqué « Je m’en occupe » dans l’e-mail, ou changé le statut dans ses Demandes reçues. Une réponse envoyée seulement par e-mail ne se voit pas ici. Sans signe sous 48 h, la demande part toute seule à d’autres pros (3 envois au plus).</p>
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section style={st.card}>
            <h3 style={st.h3}><PaperPlaneTilt size={15} /> Transmettre à un pro de l’annuaire</h3>
            <p style={st.p}>Le pro reçoit la demande avec les coordonnées de l’hôte, comme pour un envoi automatique, et l’hôte est prévenu.</p>
            <label style={{ ...st.search, width: '100%', marginBottom: 8 }}>
              <MagnifyingGlass size={14} style={{ color: 'var(--text-muted)' }} />
              <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Nom ou ville du pro…" style={st.searchInput} />
            </label>
            {propositions.length === 0 ? (
              <p style={st.small}>{pros.length === 0 ? 'Aucun pro en ligne pour ce métier.' : 'Aucun autre pro ne correspond.'}</p>
            ) : (
              <ul style={st.ul}>
                {propositions.map(p => (
                  <li key={p.id} style={st.li}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>{p.nom}</div>
                      <div style={st.small}>{p.ville}{p.score > 0 ? ` · ${proximiteLabel(p.score)}` : ' · autre ville'}{d.metier === 'photographe' && besoinPhoto(d.frequence) ? ` · ${adequationLabel(p.adequation)}` : ''}</div>
                    </div>
                    <button type="button" onClick={() => envoyer(p)} disabled={pending} style={st.btnSmall}>Envoyer</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={st.card}>
            <h3 style={st.h3}>Partager le besoin, sans les coordonnées</h3>
            <p style={st.p}>Pour un pro qui n’est pas encore dans l’annuaire ou un groupe de pros : ni le nom, ni l’e-mail, ni le téléphone, ni le message de l’hôte.</p>
            <div style={st.seg}>
              <button type="button" onClick={() => setTu(true)} style={{ ...st.segBtn, ...(tu ? st.segOn : {}) }}>Tutoiement</button>
              <button type="button" onClick={() => setTu(false)} style={{ ...st.segBtn, ...(!tu ? st.segOn : {}) }}>Vouvoiement</button>
            </div>
            <textarea readOnly value={partage} rows={9} style={st.textarea} onFocus={e => e.currentTarget.select()} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={copier} style={st.btnPrimary}>{copied ? <><Check size={14} weight="bold" /> Copié</> : <><Copy size={14} /> Copier</>}</button>
              <a href={`mailto:?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(partage)}`} style={st.btnGhost}><EnvelopeSimple size={14} /> E-mail</a>
              <a href={`https://wa.me/?text=${encodeURIComponent(partage)}`} target="_blank" rel="noopener noreferrer" style={st.btnGhost}><WhatsappLogo size={14} /> WhatsApp</a>
            </div>
          </section>

          {suiviOk && (
            <section style={st.card}>
              <h3 style={st.h3}><Note size={15} /> Note interne</h3>
              <textarea
                value={note}
                onChange={e => { setNote(e.target.value); setNoteSaved(false) }}
                onBlur={saveNote}
                rows={4}
                placeholder="Ce que tu as fait, à qui tu l’as envoyée, à relancer le…"
                style={{ ...st.textarea, background: 'var(--surface)' }}
              />
              <div style={st.small}>{noteSaved ? (note ? 'Enregistrée' : 'Visible par toi seul') : 'Enregistrée quand tu quittes le champ'}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
}
const st: Record<string, React.CSSProperties> = {
  notice: { padding: '12px 14px', borderRadius: 12, background: tint(AMBER, 10), border: `1px solid ${tint(AMBER, 30)}`, color: 'var(--text)', fontSize: 13 },
  toolbar: { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  pills: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' },
  pillOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  pillN: { fontSize: 11, fontWeight: 700, padding: '0 7px', borderRadius: 999, background: 'var(--bg-2)', color: 'var(--text-2)' },
  pillNOn: { background: 'var(--accent-text)', color: 'var(--bg)' },
  seg: { display: 'inline-flex', padding: 3, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)', gap: 2, alignSelf: 'flex-start' },
  segBtn: { padding: '5px 11px', borderRadius: 7, border: '1px solid transparent', background: 'transparent', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' },
  segOn: { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' },
  search: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 220 },
  searchInput: { flex: 1, border: 0, outline: 'none', background: 'transparent', color: 'var(--text)', fontSize: 13, padding: '9px 0', fontFamily: 'inherit', minWidth: 0 },
  empty: { padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, fontSize: 13.5 },

  item: { display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left', width: '100%', padding: '13px 14px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)', transition: 'border-color .15s' },
  itemOn: { border: '1px solid var(--accent-text)', background: 'var(--accent-bg)' },
  itemIcon: { width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-2)', color: 'var(--accent-text)', flexShrink: 0 },
  itemTitle: { fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemTime: { fontSize: 11.5, color: 'var(--text-3)', flexShrink: 0 },
  itemSub: { fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemMeta: { fontSize: 11.5, color: 'var(--text-3)' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: PINK, flexShrink: 0 },
  etat: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' },

  back: { ...btnBase, alignSelf: 'flex-start', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)' },
  head: { display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', padding: '20px 22px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 },
  eyebrow: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '.6px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 },
  h2: { fontFamily: 'var(--font-fraunces), serif', fontSize: 26, fontWeight: 400, margin: '0 0 10px', color: 'var(--text)', letterSpacing: '-.2px', lineHeight: 1.2 },
  muted: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)' },
  flash: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 },

  card: { padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 8 },
  h3: { display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-fraunces), serif', fontSize: 17, fontWeight: 400, margin: '0 0 4px', color: 'var(--text)' },
  p: { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, margin: 0 },
  small: { fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginTop: 4 },
  dl: { margin: 0, display: 'flex', flexDirection: 'column' },
  dlRow: { display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderTop: '1px solid var(--border)' },
  dt: { fontSize: 13, color: 'var(--text-3)' },
  dd: { margin: 0, fontSize: 13.5, color: 'var(--text)', textAlign: 'right' },
  quote: { margin: '6px 0 0', padding: '10px 14px', borderLeft: '2px solid var(--accent-border)', background: 'var(--bg)', borderRadius: '0 10px 10px 0', fontSize: 13.5, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  hostName: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, color: 'var(--text)' },
  ul: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' },
  li: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--border)' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, lineHeight: 1.55, fontFamily: 'inherit', resize: 'vertical' },

  btnPrimary: { ...btnBase, background: 'var(--accent-text)', border: '1px solid var(--accent-text)', color: 'var(--bg)' },
  btnGhost: { ...btnBase, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' },
  btnSmall: { ...btnBase, padding: '6px 12px', fontSize: 12.5, background: 'transparent', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },
}
