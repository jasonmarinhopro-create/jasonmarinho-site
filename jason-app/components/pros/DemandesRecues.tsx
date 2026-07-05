'use client'

import { useState, useTransition } from 'react'
import { Envelope, Tray, CaretDown, CaretUp, NotePencil, Check, Copy } from '@phosphor-icons/react/dist/ssr'

export interface ProContact {
  id: string
  contact_name: string | null
  contact_email: string
  message: string | null
  status: 'nouvelle' | 'repondue' | 'devis_envoye' | 'gagnee' | 'perdue' | string
  pro_notes: string | null
  created_at: string
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  nouvelle:     { label: 'Nouvelle',      color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.30)' },
  repondue:     { label: 'Répondue',      color: '#FFD56B', bg: 'rgba(255,213,107,0.10)', border: 'rgba(255,213,107,0.30)' },
  devis_envoye: { label: 'Devis envoyé',  color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.30)' },
  gagnee:       { label: 'Gagnée 🎉',     color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)' },
  perdue:       { label: 'Perdue',        color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.30)' },
}
const STATUS_ORDER = ['nouvelle', 'repondue', 'devis_envoye', 'gagnee', 'perdue'] as const

interface Props {
  contacts: ProContact[]
  /** Server actions injectées par l'espace (photographe ou ménage) */
  onUpdateStatus: (contactId: string, status: string) => Promise<{ error?: string }>
  onUpdateNotes: (contactId: string, notes: string) => Promise<{ error?: string }>
  /** "photographe" | "équipe" — pour les libellés */
  metier: string
  /** true = page dédiée (titre plein format, pas de marge haute) */
  standalone?: boolean
}

export default function DemandesRecues({ contacts: initial, onUpdateStatus, onUpdateNotes, metier, standalone = false }: Props) {
  const [contacts, setContacts] = useState(initial)
  const [openId, setOpenId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [notesSaved, setNotesSaved] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const nouvelles = contacts.filter(c => c.status === 'nouvelle').length

  function changeStatus(id: string, status: string) {
    const prev = contacts
    setContacts(cs => cs.map(c => (c.id === id ? { ...c, status } : c)))
    startTransition(async () => {
      const res = await onUpdateStatus(id, status)
      if (res?.error) setContacts(prev)
    })
  }

  function saveNotes(id: string) {
    const notes = notesDraft[id] ?? ''
    setContacts(cs => cs.map(c => (c.id === id ? { ...c, pro_notes: notes } : c)))
    startTransition(async () => {
      const res = await onUpdateNotes(id, notes)
      if (!res?.error) {
        setNotesSaved(id)
        setTimeout(() => setNotesSaved(s => (s === id ? null : s)), 2000)
      }
    })
  }

  return (
    <section style={{ ...s.wrap, ...(standalone ? { marginTop: 0 } : {}) }}>
      <div style={s.head}>
        <div>
          <h2 style={{ ...s.title, ...(standalone ? { fontSize: 'clamp(24px,3vw,32px)' } : {}) }}>
            Demandes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>reçues</em>
          </h2>
          <p style={s.sub}>
            Les hôtes qui te contactent via ta fiche arrivent ici (et par email). Suis chaque demande jusqu&apos;au devis&nbsp;: réponds par email, note où tu en es, marque le résultat.
          </p>
        </div>
        {nouvelles > 0 && (
          <span style={s.newPill}>{nouvelles} nouvelle{nouvelles > 1 ? 's' : ''}</span>
        )}
      </div>

      {contacts.length === 0 ? (
        <div style={s.empty}>
          <Tray size={30} color="var(--text-muted)" />
          <p style={s.emptyTitle}>Aucune demande pour le moment</p>
          <p style={s.emptyDesc}>
            Quand un hôte t&apos;écrira depuis ta fiche publique, sa demande apparaîtra ici avec son email et son message — en plus de la notification que tu reçois par email.
          </p>
        </div>
      ) : (
        <div style={s.list}>
          {contacts.map(c => {
            const meta = STATUS_META[c.status] ?? STATUS_META.nouvelle
            const open = openId === c.id
            const date = new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <div key={c.id} style={{ ...s.row, borderColor: c.status === 'nouvelle' ? 'rgba(96,165,250,0.35)' : 'var(--border)' }}>
                <button onClick={() => setOpenId(open ? null : c.id)} style={s.rowHead}>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' as const }}>
                    <div style={s.rowName}>
                      {c.contact_name || 'Hôte'}
                      <span style={{ ...s.statusPill, color: meta.color, background: meta.bg, borderColor: meta.border }}>{meta.label}</span>
                    </div>
                    <div style={s.rowMeta}>{c.contact_email} · {date}</div>
                  </div>
                  {open ? <CaretUp size={15} color="var(--text-muted)" /> : <CaretDown size={15} color="var(--text-muted)" />}
                </button>

                {open && (
                  <div style={s.rowBody}>
                    {c.message && <div style={s.message}>{c.message}</div>}

                    <div style={s.actionsRow}>
                      <a
                        href={`mailto:${c.contact_email}?subject=${encodeURIComponent('Re : ta demande via l\'annuaire Jason Marinho')}`}
                        style={s.replyBtn}
                        onClick={() => { if (c.status === 'nouvelle') changeStatus(c.id, 'repondue') }}
                      >
                        <Envelope size={14} weight="bold" />
                        Répondre par email
                      </a>
                      {/* mailto: dépend d'un client mail configuré sur l'appareil —
                          sur un poste sans app mail il ne se passe RIEN. Le bouton
                          copier garantit qu'on peut toujours répondre (webmail). */}
                      <button
                        onClick={async () => {
                          try { await navigator.clipboard.writeText(c.contact_email) } catch { /* http/vieux navigateurs */ }
                          setCopiedId(c.id)
                          setTimeout(() => setCopiedId(id => (id === c.id ? null : id)), 2000)
                          if (c.status === 'nouvelle') changeStatus(c.id, 'repondue')
                        }}
                        style={s.copyBtn}
                      >
                        {copiedId === c.id ? <><Check size={14} weight="bold" /> Adresse copiée !</> : <><Copy size={14} weight="bold" /> Copier l&apos;adresse</>}
                      </button>
                      <div style={s.statusGroup}>
                        {STATUS_ORDER.map(st => {
                          const m = STATUS_META[st]
                          const active = c.status === st
                          return (
                            <button
                              key={st}
                              onClick={() => changeStatus(c.id, st)}
                              style={{
                                ...s.statusBtn,
                                ...(active ? { color: m.color, background: m.bg, borderColor: m.border, fontWeight: 700 } : {}),
                              }}
                            >
                              {m.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div style={s.notesWrap}>
                      <label style={s.notesLabel}>
                        <NotePencil size={13} weight="bold" />
                        Notes privées (devis, montant, relance…)
                      </label>
                      <textarea
                        value={notesDraft[c.id] ?? c.pro_notes ?? ''}
                        onChange={e => setNotesDraft(d => ({ ...d, [c.id]: e.target.value }))}
                        placeholder={`Ex : devis 450 € envoyé le 12/07, relancer ${metier === 'équipe' ? 'l\'hôte' : 'l\'hôte'} lundi…`}
                        rows={2}
                        style={s.notesInput}
                      />
                      <button onClick={() => saveNotes(c.id)} style={s.notesSave}>
                        {notesSaved === c.id ? <><Check size={13} weight="bold" /> Enregistré</> : 'Enregistrer la note'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { marginTop: 28 },
  head: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 14, flexWrap: 'wrap' as const, marginBottom: 16,
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(20px,2.2vw,26px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: 4,
  },
  sub: { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 560 },
  newPill: {
    display: 'inline-flex', alignItems: 'center',
    padding: '5px 12px', borderRadius: 999, flexShrink: 0,
    background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.30)',
    color: '#60a5fa', fontSize: 12, fontWeight: 700,
  },
  empty: {
    padding: '36px 24px', textAlign: 'center' as const,
    background: 'var(--surface)', border: '1px dashed var(--border-2)',
    borderRadius: 14, display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 14.5, fontWeight: 600, color: 'var(--text-2)' },
  emptyDesc: { fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.65, maxWidth: 440 },
  list: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
  row: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 13, overflow: 'hidden',
  },
  rowHead: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', background: 'transparent', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  rowName: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const,
    fontSize: 14, fontWeight: 600, color: 'var(--text)',
  },
  statusPill: {
    padding: '2px 9px', borderRadius: 999, border: '1px solid',
    fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3,
  },
  rowMeta: { fontSize: 12, color: 'var(--text-3)', marginTop: 3 },
  rowBody: {
    padding: '0 16px 16px',
    display: 'flex', flexDirection: 'column' as const, gap: 12,
  },
  message: {
    padding: '12px 14px', background: 'var(--bg-2)',
    border: '1px solid var(--border)', borderRadius: 10,
    fontSize: 13.5, lineHeight: 1.7, color: 'var(--text-2)',
    whiteSpace: 'pre-wrap' as const,
  },
  actionsRow: { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' },
  replyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 14px', borderRadius: 9,
    background: 'var(--accent-text)', color: 'var(--bg)',
    fontSize: 12.5, fontWeight: 700, textDecoration: 'none',
  },
  copyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 14px', borderRadius: 9,
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    color: 'var(--text)', fontSize: 12.5, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  statusGroup: {
    display: 'inline-flex', flexWrap: 'wrap' as const, gap: 4,
    padding: 4, background: 'var(--bg-2)',
    border: '1px solid var(--border)', borderRadius: 10,
  },
  statusBtn: {
    padding: '5px 10px', borderRadius: 7,
    background: 'transparent', border: '1px solid transparent',
    color: 'var(--text-3)', fontSize: 11.5, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  notesWrap: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  notesLabel: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)',
  },
  notesInput: {
    width: '100%', padding: '9px 12px', borderRadius: 9,
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
    resize: 'vertical' as const, boxSizing: 'border-box' as const,
  },
  notesSave: {
    alignSelf: 'flex-start',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 12px', borderRadius: 8,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
