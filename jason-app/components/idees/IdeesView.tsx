'use client'

// Page « Idées & feuille de route » (13/10/2026), commune aux 4 espaces :
// hôte, photographe, équipe de ménage, investisseur. Avant : espace payant
// « Contributeurs » (badge, « siège à la table »), retiré avec /soutenir.

import { useMemo, useRef, useState, useTransition } from 'react'
import {
  Lightbulb, ArrowFatUp, ChatCircle, Plus, Trash, Star, ShareNetwork, CheckCircle,
  Rocket, Clock, Sparkle, PaperPlaneTilt, ChatCircleText, ArrowRight,
  House, Camera, Broom, Wrench, ChartLineUp, UsersThree,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import HubHero, { HeroEm, heroCard, heroCta } from '@/components/dashboard/HubHero'
import RelativeTime from '@/components/ui/RelativeTime'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import {
  COMMENT_MAX, DESC_MAX, ESPACES, ESPACE_LABEL, ESPACE_POUR, REPONSE_MAX, STATUS_META, STATUS_ORDER, TITLE_MAX,
  pourQui,
  concerns, countByStatus, lastDelivered, sortIdeas,
  type IdeeEspace, type IdeeStatus, type IdeeTri,
} from '@/lib/idees/rules'
import type { IdeeComment, IdeeItem, IdeesData } from '@/lib/idees/load'
import {
  addComment, deleteComment, deleteIdea, proposeIdea, toggleVote, updateIdea,
} from '@/app/dashboard/idees/actions'

const STATUS_ICON: Record<IdeeStatus, React.ElementType> = {
  suggestion: Lightbulb, planned: Clock, in_progress: Rocket, done: CheckCircle,
}

const INTRO: Record<IdeeEspace, { quoi: string; exemple: string }> = {
  hote: { quoi: 'ton quotidien d\'hôte', exemple: 'Ex. : exporter mes voyageurs en tableur' },
  photographe: { quoi: 'ta fiche et tes demandes de photographe', exemple: 'Ex. : montrer mes prix par nombre de photos' },
  menage: { quoi: 'ton planning et ta fiche d\'équipe de ménage', exemple: 'Ex. : imprimer le planning de la semaine' },
  depannage: { quoi: 'ta fiche et tes demandes de dépannage', exemple: 'Ex. : recevoir les urgences par SMS' },
  investisseur: { quoi: 'tes analyses avant d\'acheter', exemple: 'Ex. : comparer deux biens côte à côte' },
}

const ESPACE_ICON: Record<IdeeEspace, React.ElementType> = {
  hote: House, photographe: Camera, menage: Broom, depannage: Wrench, investisseur: ChartLineUp,
}

/** « Pour toi » selon l'espace d'où la page est ouverte */
const POUR_TOI: Record<IdeeEspace, string> = {
  hote: 'Pour toi, hôte',
  photographe: 'Pour toi, photographe',
  menage: 'Pour ton équipe de ménage',
  depannage: 'Pour toi, pro du dépannage',
  investisseur: 'Pour toi, investisseur',
}

const tint = (c: string, pct = 12) => `color-mix(in srgb, ${c} ${pct}%, transparent)`

export default function IdeesView({ data, espace }: { data: IdeesData; espace: IdeeEspace }) {
  const [items, setItems] = useState<IdeeItem[]>(data.items)
  const [comments, setComments] = useState<IdeeComment[]>(data.comments)
  const [votes, setVotes] = useState<Record<string, number>>(data.votes)
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set(data.myVotes))
  const [status, setStatus] = useState<IdeeStatus | 'toutes'>('toutes')
  // Par défaut : les idées de son espace + les idées communes. L'admin voit tout pour classer.
  const [scope, setScope] = useState<IdeeEspace | 'tous'>(data.isAdmin ? 'tous' : espace)
  const [pourTous, setPourTous] = useState(false)
  const [tri, setTri] = useState<IdeeTri>('populaires')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [formOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()
  const { confirm, dialog } = useConfirm()
  const formRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const inScope = useMemo(() => items.filter(i => concerns(i, scope)), [items, scope])
  const counts = useMemo(() => countByStatus(inScope), [inScope])
  const shown = useMemo(
    () => sortIdeas(status === 'toutes' ? inScope : inScope.filter(i => i.status === status), votes, tri),
    [inScope, status, votes, tri],
  )
  const delivered = useMemo(() => lastDelivered(inScope), [inScope])
  const intro = INTRO[espace]

  function openForm() {
    setFormOpen(true); setSent(false)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  function pickStatus(st: IdeeStatus | 'toutes') {
    setStatus(st)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setFormError(null)
    const res = await proposeIdea(title, desc, espace, pourTous)
    setBusy(false)
    if ('error' in res) { setFormError(res.error); return }
    setItems(prev => [res.data, ...prev])
    setVotes(prev => ({ ...prev, [res.data.id]: 0 }))
    setTitle(''); setDesc(''); setPourTous(false); setSent(true); setFormOpen(false)
    setStatus('toutes'); setTri('recentes')
  }

  function vote(id: string) {
    const had = myVotes.has(id)
    setMyVotes(prev => { const n = new Set(prev); if (had) n.delete(id); else n.add(id); return n })
    setVotes(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (had ? -1 : 1)) }))
    startTransition(async () => {
      const r = await toggleVote(id)
      if (!r.ok) {
        setMyVotes(prev => { const n = new Set(prev); if (had) n.add(id); else n.delete(id); return n })
        setVotes(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (had ? 1 : -1)) }))
      }
    })
  }

  function toggleComments(id: string) {
    setOpen(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  async function sendComment(id: string) {
    const content = (drafts[id] ?? '').trim()
    if (!content) return
    const r = await addComment(id, content)
    if ('data' in r) {
      setComments(prev => [...prev, r.data])
      setDrafts(prev => ({ ...prev, [id]: '' }))
    }
  }

  async function removeIdea(item: IdeeItem) {
    const ok = await confirm({
      message: item.mine ? 'Retirer ton idée ? Ses votes et commentaires partent avec.' : `Supprimer l'idée « ${item.title} » ?`,
      confirmLabel: item.mine ? 'Retirer' : 'Supprimer', danger: true,
    })
    if (!ok) return
    const before = items
    setItems(prev => prev.filter(i => i.id !== item.id))
    const r = await deleteIdea(item.id)
    if (!r.ok) setItems(before)
  }

  async function removeComment(c: IdeeComment) {
    if (!(await confirm({ message: 'Retirer ce commentaire ?', confirmLabel: 'Retirer', danger: true }))) return
    const before = comments
    setComments(prev => prev.filter(x => x.id !== c.id))
    const r = await deleteComment(c.id)
    if (!r.ok) setComments(before)
  }

  async function adminStatus(item: IdeeItem, st: IdeeStatus) {
    const before = items
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: st, status_changed_at: new Date().toISOString() } : i))
    const r = await updateIdea(item.id, { status: st })
    if (!r.ok) setItems(before)
  }

  async function adminEspace(item: IdeeItem, value: IdeeEspace | 'tous') {
    const before = items
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, espace: value === 'tous' ? null : value } : i))
    const r = await updateIdea(item.id, { espace: value })
    if (!r.ok) setItems(before)
  }

  async function adminReponse(item: IdeeItem, reponse: string) {
    if ((item.reponse ?? '') === reponse.trim()) return
    const before = items
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, reponse: reponse.trim() || null } : i))
    const r = await updateIdea(item.id, { reponse })
    if (!r.ok) setItems(before)
  }

  return (
    <div style={s.page}>
      {dialog}
      <HubHero
        eyebrowIcon={<Lightbulb size={14} weight="fill" />}
        eyebrow="Idées & feuille de route"
        title={<>Propose, vote, <HeroEm>vois ce qui arrive</HeroEm></>}
        desc={<>Une idée pour faciliter {intro.quoi} ? Propose-la ici. Les membres votent pour celles qui les aideraient, je lis tout et je te dis ce que j&apos;en fais.</>}
        steps={[['Propose', 'ton idée en une phrase'], ['Vote', 'pour celles qui t\'aideraient'], ['Suis', 'ce qui est prévu et livré']]}
        aside={
          <div style={{ ...heroCard, minWidth: 260 }}>
            <div style={s.asideTitle}>Où en est la feuille de route</div>
            {STATUS_ORDER.map(st => {
              const Icon = STATUS_ICON[st]
              return (
                <button key={st} type="button" onClick={() => pickStatus(st)} style={s.asideRow}>
                  <span style={{ ...s.asideIco, color: STATUS_META[st].color, background: tint(STATUS_META[st].color) }}>
                    <Icon size={14} weight="fill" />
                  </span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{STATUS_META[st].short}</span>
                  <strong style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 500 }}>{counts[st]}</strong>
                </button>
              )
            })}
            <div style={s.asideNote}>{scope === 'tous' ? 'Tous les espaces' : `Espace ${ESPACE_LABEL[scope].toLowerCase()} et idées communes`}</div>
          </div>
        }
      >
        <button type="button" onClick={openForm} style={{ ...heroCta, border: 'none', cursor: 'pointer' }}>
          <Plus size={16} weight="bold" /> Proposer une idée
        </button>
      </HubHero>

      <div style={s.cols}>
        <div style={s.main}>
          {(formOpen || sent) && (
            <div ref={formRef} style={s.card}>
              {sent && !formOpen ? (
                <div style={s.sent}>
                  <CheckCircle size={22} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: 'var(--text)' }}>Merci, ton idée est en ligne.</strong>
                    <div style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 2 }}>Je la lis et je la classe. Tu seras prévenu si elle passe en « Prévue », « En cours » ou « Livrée ».</div>
                  </div>
                  <button type="button" onClick={openForm} style={s.ghostBtn}>Une autre idée</button>
                </div>
              ) : (
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={s.cardTitle}><PaperPlaneTilt size={18} weight="fill" style={{ color: 'var(--accent-text)' }} /> Ton idée</div>
                  <input
                    value={title} onChange={e => setTitle(e.target.value)} maxLength={TITLE_MAX} autoFocus
                    placeholder={intro.exemple} style={s.input} aria-label="Ton idée en une phrase"
                  />
                  <textarea
                    value={desc} onChange={e => setDesc(e.target.value)} maxLength={DESC_MAX} rows={3}
                    placeholder="Pourquoi ça t'aiderait ? Dans quelle situation ? (facultatif)" style={{ ...s.input, resize: 'vertical', minHeight: 80 }}
                    aria-label="Détails"
                  />
                  <div style={s.forWho} role="radiogroup" aria-label="Pour qui ?">
                    <span style={s.forWhoLabel}>Pour qui ?</span>
                    {[false, true].map(all => {
                      const on = pourTous === all
                      return (
                        <button key={String(all)} type="button" role="radio" aria-checked={on} onClick={() => setPourTous(all)}
                          style={{ ...s.chip, ...(on ? s.chipOn : {}) }}>
                          {all ? <UsersThree size={14} weight="bold" /> : (() => { const I = ESPACE_ICON[espace]; return <I size={14} weight="bold" /> })()}
                          {all ? 'Tout le monde' : ESPACE_LABEL[espace]}
                        </button>
                      )
                    })}
                  </div>
                  <div style={s.formFoot}>
                    <span style={s.hint}>Visible par les membres, avec ton prénom et l&apos;initiale de ton nom.</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => { setFormOpen(false); setFormError(null) }} style={s.ghostBtn}>Annuler</button>
                      <button type="submit" disabled={busy || title.trim().length < 5} style={{ ...s.primaryBtn, opacity: busy || title.trim().length < 5 ? 0.55 : 1 }}>
                        {busy ? 'Envoi…' : 'Proposer'}
                      </button>
                    </div>
                  </div>
                  {formError && <div style={s.error}>{formError}</div>}
                </form>
              )}
            </div>
          )}

          <div style={s.roleBar}>
            <div style={s.roleChips} role="tablist" aria-label="Pour qui">
              {(data.isAdmin ? [...ESPACES, 'tous' as const] : [espace, 'tous' as const]).map(sc => {
                const on = scope === sc
                const Icon = sc === 'tous' ? UsersThree : ESPACE_ICON[sc]
                const label = sc === 'tous' ? 'Toutes les idées' : data.isAdmin ? ESPACE_LABEL[sc] : POUR_TOI[sc]
                const n = items.filter(i => concerns(i, sc)).length
                return (
                  <button key={sc} type="button" role="tab" aria-selected={on} onClick={() => setScope(sc)}
                    style={{ ...s.roleChip, ...(on ? s.roleChipOn : {}) }}>
                    <Icon size={16} weight={on ? 'fill' : 'regular'} /> {label}
                    <span style={{ ...s.tabCount, ...(on ? s.tabCountOn : {}) }}>{n}</span>
                  </button>
                )
              })}
            </div>
            <p style={s.roleHint}>
              {scope === 'tous'
                ? 'Toutes les idées, de tous les espaces.'
                : `Les idées proposées ${scope === 'hote' ? 'par les hôtes' : scope === 'photographe' ? 'par les photographes' : scope === 'menage' ? 'par les équipes de ménage' : 'par les investisseurs'}, et celles qui concernent tout le monde.`}
            </p>
          </div>

          <div ref={listRef} style={s.toolbar}>
            <div style={s.tabs} role="tablist" aria-label="Statut">
              {(['toutes', ...STATUS_ORDER] as const).map(st => {
                const on = status === st
                const n = st === 'toutes' ? inScope.length : counts[st]
                return (
                  <button key={st} type="button" role="tab" aria-selected={on} onClick={() => setStatus(st)}
                    style={{ ...s.tab, ...(on ? s.tabOn : {}) }}>
                    {st === 'toutes' ? 'Toutes' : STATUS_META[st].short}
                    <span style={{ ...s.tabCount, ...(on ? s.tabCountOn : {}) }}>{n}</span>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={tri} onChange={e => setTri(e.target.value as IdeeTri)} style={s.select} aria-label="Tri">
                <option value="populaires">Les plus votées</option>
                <option value="recentes">Les plus récentes</option>
              </select>
            </div>
          </div>

          {shown.length === 0 ? (
            <div style={s.empty}>
              <Lightbulb size={30} weight="duotone" style={{ color: 'var(--accent-text)' }} />
              <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 20, color: 'var(--text)' }}>
                {status === 'toutes' ? 'Aucune idée pour l\'instant' : `Aucune idée « ${STATUS_META[status].label.toLowerCase()} » ici`}
              </div>
              <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 14 }}>
                {status === 'toutes' ? 'La première proposition sera lue avec attention.' : 'Regarde les autres statuts, ou propose la tienne.'}
              </p>
              <button type="button" onClick={openForm} style={s.primaryBtn}><Plus size={14} weight="bold" /> Proposer une idée</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {shown.map(item => {
                const meta = STATUS_META[item.status]
                const Icon = STATUS_ICON[item.status]
                const n = votes[item.id] ?? 0
                const voted = myVotes.has(item.id)
                const list = comments.filter(c => c.item_id === item.id)
                const isOpen = open.has(item.id)
                return (
                  <article key={item.id} style={s.idea}>
                    <div style={s.ideaRow}>
                      <button type="button" onClick={() => vote(item.id)} aria-pressed={voted}
                        title={voted ? 'Retirer mon vote' : 'Voter pour cette idée'}
                        style={{ ...s.vote, ...(voted ? s.voteOn : {}) }}>
                        <ArrowFatUp size={18} weight={voted ? 'fill' : 'bold'} />
                        <strong style={{ fontSize: 16, lineHeight: 1 }}>{n}</strong>
                        <span style={{ fontSize: 10.5, fontWeight: 600 }}>{voted ? 'Voté' : 'Voter'}</span>
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.pills}>
                          <span style={{ ...s.pill, color: meta.color, background: tint(meta.color), border: `1px solid ${tint(meta.color, 28)}` }}>
                            <Icon size={11} weight="fill" /> {meta.label}
                          </span>
                          {(scope === 'tous' || item.espace !== scope) && (
                            <span style={s.pillSoft}>{pourQui(item.espace)}</span>
                          )}
                          {item.mine && <span style={s.pillSoft}>Ton idée</span>}
                        </div>
                        <h3 style={s.ideaTitle}>{item.title}</h3>
                        {item.description && <p style={s.ideaDesc}>{item.description}</p>}

                        {item.reponse && !data.isAdmin && (
                          <div style={s.reponse}>
                            <ChatCircleText size={15} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: 2 }} />
                            <span><strong style={{ color: 'var(--text)' }}>Jason :</strong> {item.reponse}</span>
                          </div>
                        )}

                        {data.isAdmin && (
                          <div style={s.adminBox}>
                            <select value={item.status} onChange={e => adminStatus(item, e.target.value as IdeeStatus)} style={s.select} aria-label="Statut">
                              {STATUS_ORDER.map(st => <option key={st} value={st}>{STATUS_META[st].label}</option>)}
                            </select>
                            <select value={item.espace ?? 'tous'} onChange={e => adminEspace(item, e.target.value as IdeeEspace | 'tous')} style={s.select} aria-label="Pour qui">
                              {ESPACES.map(es => <option key={es} value={es}>{ESPACE_POUR[es]}</option>)}
                              <option value="tous">Pour tout le monde</option>
                            </select>
                            <input
                              defaultValue={item.reponse ?? ''} maxLength={REPONSE_MAX}
                              placeholder="Ta réponse visible sous l'idée (ex. Prévu pour novembre)"
                              onBlur={e => adminReponse(item, e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                              style={{ ...s.input, flex: 1, minWidth: 200, padding: '7px 10px', fontSize: 13 }}
                              aria-label="Réponse de Jason"
                            />
                          </div>
                        )}

                        <div style={s.ideaFoot}>
                          <span>{item.author} · <RelativeTime iso={item.created_at} /></span>
                          <button type="button" onClick={() => toggleComments(item.id)} style={s.linkBtn} aria-expanded={isOpen}>
                            <ChatCircle size={14} weight={isOpen ? 'fill' : 'regular'} />
                            {list.length ? `${list.length} commentaire${list.length > 1 ? 's' : ''}` : 'Commenter'}
                          </button>
                          {(item.mine || data.isAdmin) && (
                            <button type="button" onClick={() => removeIdea(item)} style={s.linkBtn}>
                              <Trash size={13} /> {item.mine ? 'Retirer' : 'Supprimer'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={s.comments}>
                        {list.map(c => (
                          <div key={c.id} style={s.comment}>
                            <span style={{ ...s.avatar, ...(c.isJason ? s.avatarJason : {}) }}>{c.author.charAt(0)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={s.commentMeta}>
                                <strong style={{ color: 'var(--text)' }}>{c.author}</strong>
                                {c.isJason && <span style={s.jasonTag}>Créateur de l&apos;app</span>}
                                <span><RelativeTime iso={c.created_at} /></span>
                                {(c.mine || data.isAdmin) && (
                                  <button type="button" onClick={() => removeComment(c)} style={{ ...s.linkBtn, marginLeft: 'auto' }} aria-label="Retirer le commentaire">
                                    <Trash size={12} />
                                  </button>
                                )}
                              </div>
                              <p style={s.commentText}>{c.content}</p>
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={drafts[item.id] ?? ''} maxLength={COMMENT_MAX}
                            onChange={e => setDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendComment(item.id) } }}
                            placeholder="Ajoute un cas concret, une précision…" style={{ ...s.input, flex: 1 }}
                            aria-label="Ton commentaire"
                          />
                          <button type="button" onClick={() => sendComment(item.id)} disabled={!(drafts[item.id] ?? '').trim()}
                            style={{ ...s.primaryBtn, opacity: (drafts[item.id] ?? '').trim() ? 1 : 0.55 }}>
                            Envoyer
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <aside style={s.side}>
          <section style={s.card}>
            <div style={s.cardTitle}><Sparkle size={18} weight="fill" style={{ color: '#2F7D52' }} /> Récemment livré</div>
            {delivered.length === 0 ? (
              <p style={s.sideText}>Les idées livrées apparaîtront ici.</p>
            ) : (
              <ul style={s.doneList}>
                {delivered.map(d => (
                  <li key={d.id} style={s.doneItem}>
                    <CheckCircle size={15} weight="fill" style={{ color: '#2F7D52', flexShrink: 0, marginTop: 2 }} />
                    <span>{d.title}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/nouveautes" style={s.sideLink}>Toutes les nouveautés de l&apos;app <ArrowRight size={12} weight="bold" /></Link>
          </section>

          <section style={s.card}>
            <div style={s.cardTitle}><Lightbulb size={18} weight="fill" style={{ color: '#B7791F' }} /> Comment je choisis</div>
            <p style={s.sideText}>Je lis chaque idée. Je construis d&apos;abord ce qui sert au plus grand nombre et ce qui reste simple à utiliser. Les votes et tes exemples concrets m&apos;aident beaucoup à trancher.</p>
            <p style={s.sideText}>Une idée peut rester un moment en « Proposée » : ça ne veut pas dire qu&apos;elle est oubliée.</p>
          </section>

          <section style={{ ...s.card, background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
            <div style={s.cardTitle}><Star size={18} weight="fill" style={{ color: 'var(--accent-text)' }} /> L&apos;app t&apos;aide ?</div>
            <p style={s.sideText}>Le meilleur coup de pouce ne coûte rien : un avis Google sincère, ou en parler à {espace === 'hote' || espace === 'investisseur' ? 'un autre hôte' : 'un hôte ou un collègue'}.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <a href="https://g.page/r/CcLzE7IbhS5_EAE/review" target="_blank" rel="noopener noreferrer" style={s.primaryBtn}>
                <Star size={14} weight="fill" /> Laisser un avis
              </a>
              <ShareButton />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

/** Partage du site (partage natif du téléphone, sinon copie du lien) */
function ShareButton() {
  const [copied, setCopied] = useState(false)
  async function share() {
    const url = 'https://jasonmarinho.com'
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Jason Marinho', text: 'L\'app que j\'utilise pour ma location courte durée', url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { /* partage annulé */ }
  }
  return (
    <button type="button" onClick={share} style={s.ghostBtn}>
      <ShareNetwork size={14} weight="bold" /> {copied ? 'Lien copié' : 'Recommander'}
    </button>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(16px,3vw,40px)', width: '100%' },
  cols: { display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' },
  main: { flex: '1 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 },
  side: { flex: '1 1 300px', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 },

  asideTitle: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-3)', marginBottom: 2 },
  asideRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', background: 'none', border: 'none',
    cursor: 'pointer', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', borderRadius: 8,
  },
  asideIco: { width: 26, height: 26, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  asideNote: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },

  card: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
    padding: 'clamp(16px,2vw,22px)', display: 'flex', flexDirection: 'column', gap: 10,
  },
  cardTitle: {
    display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-fraunces), serif',
    fontSize: 18, fontWeight: 400, color: 'var(--text)',
  },
  sent: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 10, fontSize: 14.5,
    border: '1px solid var(--border)', background: 'var(--surface-2, var(--surface))', color: 'var(--text)',
    fontFamily: 'inherit',
  },
  formFoot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  hint: { fontSize: 12.5, color: 'var(--text-muted)' },
  error: { fontSize: 13, color: 'var(--danger)' },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
    background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', fontSize: 13.5, fontWeight: 700,
    cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
    background: 'transparent', color: 'var(--accent-text)', border: '1px solid var(--accent-border)',
    fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },

  roleBar: { display: 'flex', flexDirection: 'column', gap: 6 },
  roleChips: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  roleChip: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
    border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)',
    fontSize: 14, fontWeight: 650, cursor: 'pointer', fontFamily: 'inherit',
  },
  roleChipOn: { border: '1px solid var(--accent-text)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  roleHint: { margin: 0, fontSize: 13, color: 'var(--text-3)' },
  forWho: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  forWhoLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginRight: 2 },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999,
    border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  chipOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', scrollMarginTop: 80 },
  tabs: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999,
    border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  tabOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  tabCount: { fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'var(--border)', color: 'var(--text-3)' },
  tabCountOn: { background: 'var(--accent-text)', color: 'var(--bg)' },
  select: {
    padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
  },

  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
    padding: '40px 20px', border: '1px dashed var(--border)', borderRadius: 16, background: 'var(--surface)',
  },

  idea: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' },
  ideaRow: { display: 'flex', gap: 14, padding: '16px 18px' },
  vote: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 58, flexShrink: 0,
    padding: '10px 0', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start',
  },
  voteOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  pills: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999 },
  pillSoft: { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: 'var(--border)', color: 'var(--text-2)' },
  ideaTitle: { margin: '0 0 4px', fontSize: 16, fontWeight: 650, color: 'var(--text)', lineHeight: 1.4 },
  ideaDesc: { margin: '0 0 8px', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-line' },
  reponse: {
    display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55, margin: '4px 0 8px',
    padding: '9px 12px', borderRadius: 10, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
  },
  adminBox: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '6px 0 8px', padding: 10, borderRadius: 10, border: '1px dashed var(--accent-border)' },
  ideaFoot: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 },
  linkBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0,
    color: 'var(--text-3)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },

  comments: { borderTop: '1px solid var(--border)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg)' },
  comment: { display: 'flex', gap: 10 },
  avatar: {
    width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, background: 'var(--border)', color: 'var(--text-2)',
  },
  avatarJason: { background: 'var(--accent-text)', color: 'var(--bg)' },
  commentMeta: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 2 },
  jasonTag: { fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  commentText: { margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55 },

  sideText: { margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 },
  sideLink: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none' },
  doneList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  doneItem: { display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--text)', lineHeight: 1.45 },
}
