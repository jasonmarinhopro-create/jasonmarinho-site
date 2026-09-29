'use client'

// Pipeline des contacts en colonnes, façon CRM : on glisse une carte d'une
// étape à l'autre (souris), ou on change l'étape depuis la fiche (mobile).
// Déposer une carte dans une étape lance les séquences actives déclenchées
// par cette étape (setStage côté serveur) : l'en-tête de chaque colonne dit
// laquelle.

import { useEffect, useMemo, useState } from 'react'
import { Plus, Clock, Bell, Lightning, Rocket, Tag } from '@phosphor-icons/react/dist/ssr'
import { STAGE_LABEL, daysWithoutNews, type Stage } from '@/lib/outreach/engine'
import { AMBER, tint } from '../_ui/theme'
import { changeStage } from './actions'
import { ui, displayName, fmtDay, stagePill, STAGE_COLOR, type ContactRow, type SequenceRow } from './shared'

type Column = { key: string; label: string; hint: string; stages: Stage[]; drop: Stage; add: boolean }

const COLUMNS: Column[] = [
  { key: 'a_trouver', label: 'E-mail à trouver', hint: 'Repérés, sans adresse', stages: ['a_trouver'], drop: 'a_trouver', add: true },
  { key: 'a_contacter', label: 'À contacter', hint: 'Prêts pour un premier e-mail', stages: ['a_contacter'], drop: 'a_contacter', add: true },
  { key: 'contacte', label: 'Contactés', hint: 'Séquence en cours, pas de réponse', stages: ['contacte'], drop: 'contacte', add: true },
  { key: 'a_repondu', label: 'Ont répondu', hint: 'À toi de jouer', stages: ['a_repondu'], drop: 'a_repondu', add: true },
  { key: 'interesse', label: 'Intéressés', hint: 'Veulent en savoir plus', stages: ['interesse'], drop: 'interesse', add: true },
  { key: 'inscrit', label: 'Inscrits', hint: 'Compte créé, pas encore client', stages: ['inscrit'], drop: 'inscrit', add: true },
  { key: 'client', label: 'Clients', hint: 'Abonnés', stages: ['client'], drop: 'client', add: true },
  { key: 'sortis', label: 'Sortis', hint: 'Pas intéressés, désinscrits, adresses invalides', stages: ['pas_interesse', 'desinscrit', 'invalide'], drop: 'pas_interesse', add: false },
]

const MAX_CARDS = 60

export default function PipelineBoard({ contacts, sequences, today, onOpen, onAdd, onMessage }: {
  contacts: ContactRow[]
  sequences: SequenceRow[]
  today: string
  onOpen: (c: ContactRow) => void
  onAdd: (stage: Stage) => void
  onMessage: (m: { ok?: string; err?: string }) => void
}) {
  // Étapes déplacées en attente de la réponse du serveur (affichage immédiat)
  const [moved, setMoved] = useState<Map<string, Stage>>(new Map())
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [more, setMore] = useState<Record<string, number>>({})

  // Les nouvelles données du serveur remplacent l'affichage provisoire
  useEffect(() => { setMoved(new Map()) }, [contacts])

  const stageOf = (c: ContactRow) => moved.get(c.id) ?? c.stage
  const byColumn = useMemo(() => {
    const m = new Map<string, ContactRow[]>()
    for (const col of COLUMNS) m.set(col.key, [])
    for (const c of contacts) {
      const st = moved.get(c.id) ?? c.stage
      const col = COLUMNS.find(k => k.stages.includes(st))
      if (col) m.get(col.key)!.push(c)
    }
    // Rappels dus d'abord, puis les plus anciens sans nouvelle
    for (const list of Array.from(m.values())) {
      list.sort((a, b) => {
        const da = a.next_action_on && a.next_action_on <= today ? 0 : 1
        const db = b.next_action_on && b.next_action_on <= today ? 0 : 1
        if (da !== db) return da - db
        return daysWithoutNews(b) - daysWithoutNews(a)
      })
    }
    return m
  }, [contacts, moved, today])

  // Séquences qui démarrent quand un contact arrive dans l'étape
  const triggers = (stage: Stage) => sequences.filter(s => s.trigger === 'etape' && s.trigger_stage === stage)

  async function move(id: string, target: Stage) {
    const c = contacts.find(x => x.id === id)
    if (!c || stageOf(c) === target) return
    setMoved(p => new Map(p).set(id, target))
    const res = await changeStage([id], target)
    if (!res.ok) {
      setMoved(p => { const n = new Map(p); n.delete(id); return n })
      return onMessage({ err: res.error })
    }
    const started = res.data?.started ?? []
    onMessage({ ok: `${displayName(c)} en « ${STAGE_LABEL[target]} »${started.length ? `, séquence ${started.map(n => `« ${n} »`).join(', ')} lancée` : ''}` })
  }

  const dueCount = contacts.filter(c => c.next_action_on && c.next_action_on <= today).length
  const staleCount = contacts.filter(c => ['contacte', 'a_repondu', 'interesse'].includes(stageOf(c)) && daysWithoutNews(c) >= 14).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
      <div style={s.summary} suppressHydrationWarning>
        <span><strong style={{ color: 'var(--text)' }}>{contacts.length}</strong> carte{contacts.length > 1 ? 's' : ''} ici</span>
        {dueCount > 0 && <span style={{ color: 'var(--danger)' }}><Bell size={13} weight="fill" /> {dueCount} rappel{dueCount > 1 ? 's' : ''} à faire</span>}
        {staleCount > 0 && <span><Clock size={13} weight="bold" /> {staleCount} en cours sans nouvelle depuis 14 jours ou plus</span>}
        <span style={{ marginLeft: 'auto', color: 'var(--text-3)' }}>Glisse une carte, ou ouvre-la, pour changer son étape</span>
      </div>

      <div style={s.board}>
        {COLUMNS.map(col => {
          const list = byColumn.get(col.key) ?? []
          const shown = more[col.key] ?? MAX_CARDS
          const trig = col.stages.flatMap(triggers)
          const isOver = over === col.key && dragId !== null
          return (
            <div
              key={col.key}
              style={{ ...s.col, ...(isOver ? s.colOver : {}) }}
              onDragOver={e => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (over !== col.key) setOver(col.key) } }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(o => (o === col.key ? null : o)) }}
              onDrop={e => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/plain') || dragId
                setOver(null); setDragId(null)
                if (!id) return
                const c = contacts.find(x => x.id === id)
                // Dans « Sortis », une carte déjà sortie garde son motif
                if (c && col.stages.includes(stageOf(c))) return
                move(id, col.drop)
              }}
            >
              <div style={s.colHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9, background: STAGE_COLOR[col.drop], flexShrink: 0 }} />
                  <strong style={{ fontSize: '13.5px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.label}</strong>
                  <span style={s.count}>{list.length}</span>
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{col.hint}</span>
                {trig.map(t => (
                  <span key={t.id} style={{ ...s.trigger, ...(t.enabled ? {} : { color: 'var(--text-3)', background: 'transparent' }) }} title={t.enabled ? 'Se lance quand une carte arrive ici' : 'Séquence en pause : rien ne part'}>
                    <Lightning size={11} weight="fill" /> {t.nom}{t.enabled ? '' : ' (en pause)'}
                  </span>
                ))}
              </div>

              <div style={s.cards}>
                {list.slice(0, shown).map(c => {
                  const st = stageOf(c)
                  const days = daysWithoutNews(c)
                  const due = !!c.next_action_on && c.next_action_on <= today
                  const seq = c.active_sequence_id ? sequences.find(x => x.id === c.active_sequence_id) : null
                  const sub = [c.entreprise && c.nom && c.nom !== c.entreprise ? c.nom : null, c.ville].filter(Boolean).join(' · ') || c.email || 'e-mail à trouver'
                  return (
                    <button
                      key={c.id}
                      type="button"
                      draggable
                      onDragStart={e => { e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move'; setDragId(c.id) }}
                      onDragEnd={() => { setDragId(null); setOver(null) }}
                      onClick={() => onOpen(c)}
                      style={{ ...s.card, ...(dragId === c.id ? { opacity: 0.45 } : {}), ...(moved.has(c.id) ? { border: '1px dashed var(--accent-border)' } : {}) }}
                    >
                      <strong style={s.name}>{displayName(c)}</strong>
                      <span style={s.sub}>{sub}</span>
                      {col.key === 'sortis' && <span style={{ ...stagePill(st), alignSelf: 'flex-start' }}>{STAGE_LABEL[st]}</span>}
                      {c.tags?.length > 0 && (
                        <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {c.tags.slice(0, 3).map(t => <span key={t} style={s.tag}><Tag size={10} weight="fill" /> {t}</span>)}
                          {c.tags.length > 3 && <span style={{ ...s.tag, background: 'transparent' }}>+{c.tags.length - 3}</span>}
                        </span>
                      )}
                      {seq && <span style={s.line}><Rocket size={12} color="var(--accent-text)" /> {seq.nom}</span>}
                      {c.next_action && (
                        <span style={{ ...s.line, color: due ? 'var(--danger)' : 'var(--text-2)', fontWeight: 600 }} suppressHydrationWarning>
                          <Bell size={12} weight={due ? 'fill' : 'regular'} /> {c.next_action}{c.next_action_on ? ` · ${fmtDay(`${c.next_action_on}T12:00:00Z`)}` : ''}
                        </span>
                      )}
                      <span style={{ ...s.line, color: days >= 14 && ['contacte', 'a_repondu', 'interesse'].includes(st) ? AMBER : 'var(--text-3)' }} suppressHydrationWarning>
                        <Clock size={12} /> sans nouvelle depuis {days} j
                      </span>
                    </button>
                  )
                })}
                {list.length > shown && (
                  <button type="button" onClick={() => setMore(p => ({ ...p, [col.key]: shown + MAX_CARDS }))} style={s.moreBtn}>
                    Voir {Math.min(MAX_CARDS, list.length - shown)} de plus
                  </button>
                )}
                {!list.length && <span style={s.empty}>{isOver ? 'Lâche ici' : 'Aucune carte'}</span>}
              </div>

              {col.add && (
                <button type="button" onClick={() => onAdd(col.drop)} style={s.addBtn}>
                  <Plus size={13} weight="bold" /> Ajouter une carte
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  summary: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 16px', fontSize: '13px', color: 'var(--text-2)' },
  board: { display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', alignItems: 'stretch' },
  col: {
    flex: '1 0 272px', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px',
    borderRadius: '16px', background: 'color-mix(in srgb, var(--text) 4%, var(--bg))', border: '1px solid var(--border)',
    maxHeight: 'calc(100vh - 230px)', minHeight: '320px', boxSizing: 'border-box',
  },
  colOver: { border: '1px solid var(--accent-text)', background: 'color-mix(in srgb, var(--accent-bg) 70%, var(--bg))' },
  colHead: { display: 'flex', flexDirection: 'column', gap: '5px', padding: '2px 2px 4px' },
  count: { marginLeft: 'auto', fontSize: '11.5px', fontWeight: 800, padding: '1px 8px', borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' },
  trigger: { display: 'inline-flex', alignItems: 'center', gap: '5px', alignSelf: 'flex-start', maxWidth: '100%', fontSize: '11.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'var(--accent-bg)', color: 'var(--accent-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cards: { flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' },
  card: {
    display: 'flex', flexDirection: 'column', gap: '5px', padding: '11px 13px', borderRadius: '12px', border: '1px solid var(--border)',
    background: 'var(--surface)', textAlign: 'left', cursor: 'grab', fontFamily: 'inherit', minWidth: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', flexShrink: 0,
  },
  name: { fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sub: { fontSize: '12.5px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  line: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-3)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tag: { display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px', background: tint(AMBER, 12), color: '#8A5A12', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { fontSize: '12.5px', color: 'var(--text-3)', textAlign: 'center', padding: '18px 0' },
  moreBtn: { ...ui.btnGhost, justifyContent: 'center', fontSize: '12.5px' },
  addBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
}
