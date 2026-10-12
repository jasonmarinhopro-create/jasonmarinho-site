'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  ClipboardText, MagnifyingGlass, MapPin, Tag, User, X, Plus, Copy, Check, Article, AddressBook, MapTrifold, Wrench, Warning, Info, PencilSimple, ArrowClockwise,
} from '@phosphor-icons/react/dist/ssr'
import { ALL_CITIES, PROFILE_LABEL, TOPICS, TOPIC_LABEL, type GroupProfile, type GroupOverrides, type GroupResource, type TopicKey } from '@/lib/acquisition/groupes'
import { cityLabel } from '@/lib/visibility/city-page'
import type { GroupStats } from '@/lib/acquisition/groupes-load'
import { prepareGroupReply, type GroupReplyResult } from './actions'
import { AMBER, tint } from '../_ui/theme'

// Onglet « Groupes » de Provenance (12/10/2026, sur le modèle du CRM Driing
// de Jason) : coller un message de groupe Facebook, vérifier ce que l'outil a
// compris, copier le prompt pour Claude. Règles : lib/acquisition/groupes.ts.

type Ok = Extract<GroupReplyResult, { ok: true }>
const PROFILES: GroupProfile[] = ['hote', 'pro', 'investisseur', 'voyageur']
const KIND_ICON: Record<GroupResource['kind'], typeof Article> = { article: Article, guide: MapTrifold, service: Wrench, pro: AddressBook, annuaire: AddressBook }
const KIND_LABEL: Record<GroupResource['kind'], string> = { article: 'Article', guide: 'Page de ville', service: 'Outil', pro: 'Fiche de l\'annuaire', annuaire: 'Annuaire' }

const nf = (n: number) => n.toLocaleString('fr-FR')
const dayFr = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function isTyping() {
  const el = document.activeElement as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true } catch {
    const ta = document.createElement('textarea')
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select()
    const ok = document.execCommand('copy'); ta.remove(); return ok
  }
}

export default function GroupesTab({ stats, live, initial = null }: { stats: GroupStats; live: { now: number; last30: number; visitorsToday: number }; initial?: Ok | null }) {
  const [res, setRes] = useState<Ok | null>(initial)
  const [error, setError] = useState<string | null>(null)
  const [pastedAt, setPastedAt] = useState<string | null>(null)
  const [over, setOver] = useState<GroupOverrides>({})
  const [group, setGroup] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [short, setShort] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [copied, setCopied] = useState(false)
  const [prepared, setPrepared] = useState(stats.preparedToday)
  const [pending, start] = useTransition()
  const resRef = useRef<Ok | null>(null)
  resRef.current = res

  const run = useCallback((text: string, overrides: GroupOverrides, code?: string) => {
    setError(null)
    start(async () => {
      const r = await prepareGroupReply({ text, overrides, code })
      if (!r.ok) { setError(r.error); return }
      if (!code && r.saved) setPrepared(n => n + 1)
      if (r.group) setGroup(cur => cur.trim() ? cur : r.group ?? '')
      setRes(r)
    })
  }, [])

  const handleNew = useCallback((text: string) => {
    if (!text.trim()) return
    const keep = group.trim() ? { group: group.trim() } : {}
    setOver(keep); setEditing(false); setShowPrompt(false); setCopied(false)
    setPastedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    run(text, keep)
  }, [group, run])

  // Ctrl+V n'importe où sur la page ; Entrée copie le prompt
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTyping()) return
      const text = e.clipboardData?.getData('text') ?? ''
      if (text.trim()) { e.preventDefault(); handleNew(text) }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || isTyping() || e.ctrlKey || e.metaKey || e.altKey) return
      const r = resRef.current
      if (!r) return
      e.preventDefault()
      void copyText(short ? r.promptShort : r.prompt).then(ok => setCopied(ok))
    }
    document.addEventListener('paste', onPaste)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('paste', onPaste); document.removeEventListener('keydown', onKey) }
  }, [handleNew, short])

  const readClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) { handleNew(text); return }
    } catch { /* accès refusé : saisie à la main */ }
    setRes(null); setDraft(''); setEditing(true)
  }

  const correct = (patch: GroupOverrides) => {
    if (!res) return
    const next = { ...over, ...patch }
    setOver(next); setCopied(false)
    run(res.text, next, res.code)
  }

  const reading = res?.reading
  const topics = reading?.topics ?? []
  const prompt = res ? (short ? res.promptShort : res.prompt) : ''
  const recordPct = stats.record ? Math.min(100, Math.round((prepared / stats.record.count) * 100)) : 0

  return (
    <>
      {stats.missingMigration && (
        <div style={g.warn}>
          <Warning size={18} weight="fill" color={AMBER} style={{ flexShrink: 0 }} />
          <span>La migration <strong>20261012_130_group_replies.sql</strong> n&apos;est pas encore passée : l&apos;outil marche, mais les messages préparés ne sont pas comptés.</span>
        </div>
      )}
      {stats.articlesError && (
        <div style={g.warn}>
          <Warning size={18} weight="fill" color={AMBER} style={{ flexShrink: 0 }} />
          <span>Les articles du blog n&apos;ont pas pu être lus ({stats.articlesError}) : seuls les guides, outils et fiches sont proposés.</span>
        </div>
      )}

      {/* Chiffres */}
      <div style={g.stats}>
        <div style={{ ...g.stat, background: 'linear-gradient(160deg, #003329, #004C3F)', border: '1px solid #004C3F', color: '#fff' }}>
          <span style={{ ...g.statLabel, color: 'rgba(255,255,255,.85)' }}><span style={{ width: 8, height: 8, borderRadius: 99, background: live.now ? '#63D683' : 'rgba(255,255,255,.4)' }} /> En ce moment sur jasonmarinho.com</span>
          <span><strong style={{ ...g.statBig, color: '#fff' }}>{live.now}</strong> <span style={{ fontSize: 14 }}>{live.now > 1 ? 'personnes' : 'personne'}</span></span>
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.75)' }}>{live.last30} sur les 30 dernières minutes · {live.visitorsToday} visiteurs aujourd&apos;hui</span>
        </div>
        <div style={g.stat}>
          <span style={g.statLabel}>Messages préparés aujourd&apos;hui</span>
          <strong style={g.statBig}>{prepared}</strong>
          <span style={g.statSub}>{nf(stats.preparedMonth + (prepared - stats.preparedToday))} ce mois{stats.record ? ` · ton record : ${stats.record.count} le ${dayFr(stats.record.day)}` : ''}</span>
          {stats.record && <span style={g.bar}><span style={{ ...g.barFill, width: `${recordPct}%` }} /></span>}
        </div>
        <div style={g.stat}>
          <span style={g.statLabel}>Clics sur tes réponses aujourd&apos;hui</span>
          <strong style={g.statBig}>{stats.clicksToday}</strong>
          <span style={g.statSub}>{stats.clicksWeek} visiteurs sur 7 jours · {stats.signupsWeek ? `${stats.signupsWeek} inscription${stats.signupsWeek > 1 ? 's' : ''} venue${stats.signupsWeek > 1 ? 's' : ''} des groupes cette semaine` : 'aucune inscription venue des groupes cette semaine'} · <Link href="/dashboard/admin/provenance?onglet=resultats" style={g.link}>Résultats</Link></span>
        </div>
        <div style={g.stat}>
          <span style={g.statLabel}>Pages proposables</span>
          <strong style={g.statBig}>{nf(stats.articles + 60 + stats.pros)}</strong>
          <span style={g.statSub}>{stats.articles} articles · 60 guides de ville · {stats.pros} fiche{stats.pros > 1 ? 's' : ''} de l&apos;annuaire</span>
        </div>
      </div>

      <div style={g.main}>
        {/* 1. Le message */}
        <section style={{ ...g.card, flex: '1 1 340px', maxWidth: 440 }}>
          <header style={g.cardHead}>
            <span style={g.step}>1</span>
            <strong style={g.cardTitle}>Le message</strong>
            {pastedAt && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>collé à {pastedAt}</span>}
          </header>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {editing ? (
              <>
                <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} placeholder="Colle ou corrige le message ici" style={g.textarea} />
                <div style={g.row}>
                  <button type="button" onClick={() => handleNew(draft)} disabled={!draft.trim() || pending} style={g.btnPrimary}><ArrowClockwise size={16} weight="bold" /> Relire</button>
                  <button type="button" onClick={() => setEditing(false)} style={g.btn}>Annuler</button>
                </div>
              </>
            ) : !res ? (
              <button type="button" onClick={readClipboard} style={g.drop}>
                <span style={g.dropIcon}><ClipboardText size={22} weight="bold" /></span>
                <strong style={{ fontSize: 15, color: 'var(--text)' }}>{pending ? 'Lecture…' : 'Colle le message du groupe'}</strong>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}><kbd style={g.kbd}>Ctrl+V</kbd> n&apos;importe où sur la page, ou clique ici</span>
              </button>
            ) : (
              <>
                {res.author && <span style={g.author}><span style={g.avatar}>{res.author[0]}</span>{res.author}</span>}
                <div style={g.msg}>{res.text}</div>
                <div style={g.row}>
                  <button type="button" onClick={readClipboard} style={g.btnPrimary}><ClipboardText size={16} weight="bold" /> Coller le suivant</button>
                  <button type="button" onClick={() => { setDraft(res.text); setEditing(true) }} style={g.btn}><PencilSimple size={15} /> Retoucher</button>
                  <button type="button" onClick={() => { setRes(null); setOver({}); setPastedAt(null) }} style={g.linkBtn}>Vider</button>
                </div>
              </>
            )}
            {error && <span style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</span>}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: 'var(--text-3)' }}>
              Groupe où il a écrit (facultatif, gardé pour les messages suivants)
              <input
                value={group}
                onChange={e => setGroup(e.target.value)}
                onBlur={() => { if (res && (over.group ?? '') !== group.trim()) correct({ group: group.trim() }) }}
                placeholder="ex. Hôtes Airbnb France"
                style={g.input}
              />
            </label>
            <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>Le message n&apos;est jamais enregistré : seulement ce que l&apos;outil en a compris, pour les chiffres.</span>
          </div>
        </section>

        {/* 2 à 4 */}
        {!res || !reading ? (
          <section style={{ ...g.card, flex: '2 1 480px', borderStyle: 'dashed', background: 'transparent', alignItems: 'center', justifyContent: 'center', minHeight: 180, padding: 24, textAlign: 'center', gap: 6 }}>
            <strong style={{ fontSize: 15, color: 'var(--text)' }}>Ce que l&apos;outil a compris s&apos;affichera ici</strong>
            <span style={{ fontSize: 13.5, color: 'var(--text-3)' }}>Copie un message dans un groupe Facebook, reviens ici et fais <kbd style={g.kbd}>Ctrl+V</kbd>.</span>
          </section>
        ) : (
          <section style={{ ...g.card, flex: '2 1 480px', opacity: pending ? 0.6 : 1, transition: 'opacity .15s' }}>
            <header style={g.cardHead}>
              <span style={g.step}>2</span>
              <strong style={g.cardTitle}>Ce que l&apos;outil a compris</strong>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>vérifie d&apos;un coup d&apos;œil, corrige d&apos;un clic</span>
            </header>

            <div style={g.summary}>
              <span style={g.sumIcon}><MagnifyingGlass size={18} weight="bold" /></span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <strong style={{ fontSize: 15.5, color: 'var(--text)' }}>{res.title}</strong>{' '}
                <span style={reading.clear ? g.badgeOk : g.badgeWarn}>{reading.clear ? 'lecture nette' : 'à vérifier'}</span>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>{reading.usesVous ? 'Il vouvoie : la réponse le vouvoiera.' : 'Réponse au tutoiement, l\'usage des groupes d\'hôtes.'}</div>
              </div>
              <div style={g.seg}>
                {PROFILES.map(p => (
                  <button key={p} type="button" onClick={() => correct({ profile: p })} style={reading.profile === p ? g.segOn : g.segBtn}>{PROFILE_LABEL[p].split(' (')[0]}</button>
                ))}
              </div>
            </div>
            {!reading.clear && <div style={g.band}>Lecture incertaine. Vérifie qui écrit et de quoi il parle avant de répondre.</div>}
            {reading.profile === 'voyageur' && <div style={g.band}>Un voyageur qui cherche un logement : ce message se traite mieux dans le CRM Driing. Le prompt propose seulement Driing.</div>}

            <div style={g.fields}>
              <div style={g.field}>
                <span style={g.fieldLabel}><MapPin size={13} weight="bold" /> Où</span>
                <div style={g.chipsRow}>
                  {reading.city
                    ? <span style={g.chip}>{cityLabel(reading.city)}<button type="button" aria-label="Retirer la ville" onClick={() => correct({ city: null })} style={g.chipX}><X size={11} weight="bold" /></button></span>
                    : <span style={g.none}>ville non dite</span>}
                  <select value="" onChange={e => e.target.value && correct({ city: e.target.value })} style={g.addSel}>
                    <option value="">{reading.city ? 'Changer de ville' : '+ Ajouter une ville'}</option>
                    {ALL_CITIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={g.field}>
                <span style={g.fieldLabel}><Tag size={13} weight="bold" /> Sujets</span>
                <div style={g.chipsRow}>
                  {topics.length ? topics.map(k => (
                    <span key={k} style={g.chip}>{TOPIC_LABEL[k]}<button type="button" aria-label={`Retirer ${TOPIC_LABEL[k]}`} onClick={() => correct({ topics: topics.filter(t => t !== k) })} style={g.chipX}><X size={11} weight="bold" /></button></span>
                  )) : <span style={g.none}>aucun sujet net</span>}
                  {topics.length < 3 && (
                    <select value="" onChange={e => e.target.value && correct({ topics: [...topics, e.target.value as TopicKey] })} style={g.addSel}>
                      <option value="">+ Ajouter un sujet</option>
                      {TOPICS.filter(t => !topics.includes(t.key)).map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div style={g.field}>
                <span style={g.fieldLabel}><User size={13} weight="bold" /> Qui écrit</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{PROFILE_LABEL[reading.profile]}{reading.seeksPro ? ', cherche un prestataire' : ''}</span>
              </div>
            </div>

            {/* 3. Pages proposées */}
            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={g.cardHead2}>
                <span style={g.step}>3</span>
                <strong style={g.cardTitle}>Nos pages qui lui répondent</strong>
                <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{res.resources.length ? `les 2 premières vont en tête du commentaire` : ''}</span>
              </div>
              {res.resources.length ? res.resources.map((r, i) => {
                const Icon = KIND_ICON[r.kind]
                return (
                  <a key={r.url} href={r.tracked} target="_blank" rel="noopener" style={{ ...g.resRow, ...(i < 2 ? { border: '1px solid var(--accent-border)' } : {}) }}>
                    <span style={g.resIcon}><Icon size={17} weight="bold" /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', lineHeight: 1.35 }}>{r.title}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{KIND_LABEL[r.kind]} · {r.why}</span>
                    </span>
                    <span style={r.quality === 'bonne' ? g.badgeOk : g.badgeSoft}>{r.quality}</span>
                  </a>
                )
              }) : <span style={g.none}>Aucune page ne colle vraiment : le prompt demandera une réponse sans lien (ou avec le seul lien de fin).</span>}
              <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}><Info size={13} style={{ verticalAlign: '-2px' }} /> Lien de fin, si ça sert : {res.final.label}. Liens suivis avec le code <strong>{res.code}</strong>.</span>
            </div>

            {/* 4. Prompt */}
            <div style={{ padding: '16px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={g.step}>4</span>
                <button type="button" onClick={async () => setCopied(await copyText(prompt))} style={g.copyBtn}>
                  {copied ? <Check size={18} weight="bold" /> : <Copy size={18} weight="bold" />} {copied ? 'Prompt copié' : 'Copier le prompt'}
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>ou <kbd style={g.kbd}>Entrée</kbd></span>
                <div style={g.seg}>
                  <button type="button" onClick={() => { setShort(false); setCopied(false) }} style={!short ? g.segOn : g.segBtn}>Prompt complet</button>
                  <button type="button" onClick={() => { setShort(true); setCopied(false) }} style={short ? g.segOn : g.segBtn}>Bloc court</button>
                </div>
                <button type="button" onClick={() => setShowPrompt(v => !v)} style={g.linkBtn}>{showPrompt ? 'Masquer le prompt' : 'Voir le prompt'}</button>
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Colle-le dans Claude, publie sa réponse sur Facebook, puis reviens coller le message suivant. Le bloc court sert dans une conversation qui a déjà reçu le prompt complet.</span>
              {showPrompt && <pre style={g.pre}>{prompt}</pre>}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

const g: Record<string, React.CSSProperties> = {
  warn: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', borderRadius: 12, background: tint(AMBER, 10), border: `1px solid ${tint(AMBER, 30)}`, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 12 },
  stat: { display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 18px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0 },
  statLabel: { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--text-2)' },
  statBig: { fontFamily: 'var(--font-fraunces), serif', fontSize: 30, fontWeight: 500, lineHeight: 1.1, color: 'var(--text)' },
  statSub: { fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 },
  link: { color: 'var(--accent-text)', fontWeight: 600, textDecoration: 'none' },
  bar: { display: 'block', height: 5, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden', marginTop: 4 },
  barFill: { display: 'block', height: '100%', background: 'var(--accent-text)', borderRadius: 99 },
  main: { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
  cardHead: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border)' },
  cardHead2: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  cardTitle: { fontSize: 15, color: 'var(--text)' },
  step: { width: 24, height: 24, borderRadius: 99, background: 'var(--accent-text)', color: 'var(--bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, flexShrink: 0 },
  drop: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '28px 16px', borderRadius: 14, border: '1.5px dashed var(--border-2, var(--border))', background: 'var(--surface-2)', cursor: 'pointer', textAlign: 'center' },
  dropIcon: { width: 44, height: 44, borderRadius: 99, background: 'var(--accent-text)', color: 'var(--bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  kbd: { display: 'inline-block', padding: '1px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', fontFamily: 'inherit' },
  author: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  avatar: { width: 28, height: 28, borderRadius: 99, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  msg: { maxHeight: 260, overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-2)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', overflowWrap: 'anywhere' },
  textarea: { minHeight: 180, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13.5, lineHeight: 1.55, resize: 'vertical' },
  input: { padding: '8px 11px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13.5 },
  row: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' },
  linkBtn: { marginLeft: 'auto', background: 'none', border: 'none', padding: 0, color: 'var(--text-3)', fontSize: 13, textDecoration: 'underline', cursor: 'pointer' },
  summary: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 18px', background: tint('var(--accent-text)', 6) },
  sumIcon: { width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--accent-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badgeOk: { display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: tint('var(--accent-text)', 12), color: 'var(--accent-text)', fontSize: 11.5, fontWeight: 700, verticalAlign: '2px', flexShrink: 0 },
  badgeWarn: { display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: tint(AMBER, 16), color: AMBER, fontSize: 11.5, fontWeight: 700, verticalAlign: '2px' },
  badgeSoft: { display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11.5, fontWeight: 700, flexShrink: 0 },
  band: { padding: '9px 18px', background: tint(AMBER, 12), color: 'var(--text-2)', fontSize: 13, borderTop: `1px solid ${tint(AMBER, 25)}` },
  seg: { display: 'inline-flex', padding: 3, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', gap: 2, flexWrap: 'wrap' },
  segBtn: { padding: '6px 11px', borderRadius: 8, border: '1px solid transparent', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  segOn: { padding: '6px 11px', borderRadius: 8, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  fields: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', borderTop: '1px solid var(--border)' },
  field: { display: 'flex', flexDirection: 'column', gap: 7, padding: '12px 18px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: -1, minWidth: 0 },
  fieldLabel: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-3)' },
  chipsRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 11px', borderRadius: 99, border: '1px solid var(--accent-border)', background: tint('var(--accent-text)', 8), color: 'var(--accent-text)', fontSize: 13, fontWeight: 700 },
  chipX: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 99, border: 'none', background: 'transparent', color: 'var(--accent-text)', cursor: 'pointer', padding: 0 },
  addSel: { padding: '5px 10px', borderRadius: 99, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', maxWidth: 190 },
  none: { fontSize: 13.5, color: 'var(--text-3)' },
  resRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', textDecoration: 'none', minWidth: 0 },
  resIcon: { width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--accent-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  copyBtn: { display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 22px', borderRadius: 12, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 15.5, fontWeight: 700, cursor: 'pointer' },
  pre: { margin: 0, maxHeight: 360, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12.5, lineHeight: 1.55, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
}
