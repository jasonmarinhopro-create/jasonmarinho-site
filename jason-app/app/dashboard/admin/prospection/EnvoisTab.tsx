'use client'

// Onglet Envois : chaque e-mail parti (30 derniers jours), groupé par jour,
// avec les réponses obtenues, les chiffres par séquence et par e-mail de la
// séquence, et l'aperçu exact de ce que le contact a reçu.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { PaperPlaneTilt, ChatCircleText, WarningCircle, X, Eye, ChartBar } from '@phosphor-icons/react/dist/ssr'
import type { Audience } from '@/lib/outreach/engine'
import { AMBER, PINK, tint } from '../_ui/theme'
import { sentEmailPreview } from './actions'
import { ui, displayName, type ContactRow, type SendRow, type SequenceRow } from './shared'

type Preview = { to: string; subject: string; sent_at: string; html: string; text: string; edited: boolean }

const time = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
const dayKey = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })
const dayLabel = (key: string) => new Date(`${key}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })

export default function EnvoisTab({ audience, sends, contacts, sequences, dailyCap }: {
  audience: Audience; sends: SendRow[]; contacts: ContactRow[]; sequences: SequenceRow[]; dailyCap: number
}) {
  const [status, setStatus] = useState<'tous' | 'envoye' | 'erreur' | 'repondu'>('tous')
  const [open, setOpen] = useState<SendRow | null>(null)

  const contactById = useMemo(() => new Map(contacts.map(c => [c.id, c])), [contacts])
  const seqById = useMemo(() => new Map(sequences.map(s => [s.id, s])), [sequences])

  // Envois de l'audience choisie
  const mine = useMemo(() => sends.filter(s => {
    const c = s.contact_id ? contactById.get(s.contact_id) : null
    return c ? c.audience === audience : false
  }), [sends, contactById, audience])

  // Réponse attribuée au dernier e-mail envoyé avant la date de réponse
  const repliedSendIds = useMemo(() => {
    const ids = new Set<string>()
    const byContact = new Map<string, SendRow[]>()
    for (const s of mine) if (s.status === 'envoye' && s.contact_id) byContact.set(s.contact_id, [...(byContact.get(s.contact_id) ?? []), s])
    for (const [cid, list] of Array.from(byContact.entries())) {
      const replied = contactById.get(cid)?.replied_at
      if (!replied) continue
      const before = list.filter(s => s.sent_at <= replied).sort((a, b) => b.sent_at.localeCompare(a.sent_at))
      if (before[0]) ids.add(before[0].id)
    }
    return ids
  }, [mine, contactById])

  const today = dayKey(new Date().toISOString())
  const ok = mine.filter(s => s.status === 'envoye')
  const sentToday = ok.filter(s => dayKey(s.sent_at) === today).length
  const errors = mine.filter(s => s.status === 'erreur').length
  const contacted = new Set(ok.map(s => s.contact_id)).size
  const replied = new Set(ok.filter(s => repliedSendIds.has(s.id)).map(s => s.contact_id)).size

  // Chiffres par séquence puis par e-mail de la séquence
  const perStep = useMemo(() => {
    const m = new Map<string, { seq: string; step: number; subject: string; sent: number; replies: number }>()
    for (const s of ok) {
      const k = `${s.sequence_id}|${s.step_position}`
      const cur = m.get(k) ?? { seq: seqById.get(s.sequence_id ?? '')?.nom ?? 'Séquence supprimée', step: (s.step_position ?? 0) + 1, subject: s.subject.replace(/^Re:\s*/i, ''), sent: 0, replies: 0 }
      cur.sent++
      if (repliedSendIds.has(s.id)) cur.replies++
      m.set(k, cur)
    }
    return Array.from(m.values()).sort((a, b) => a.seq.localeCompare(b.seq, 'fr') || a.step - b.step)
  }, [ok, seqById, repliedSendIds])

  const filtered = mine.filter(s => status === 'tous' || (status === 'repondu' ? repliedSendIds.has(s.id) : s.status === status))
  const byDay = useMemo(() => {
    const m = new Map<string, SendRow[]>()
    for (const s of filtered) m.set(dayKey(s.sent_at), [...(m.get(dayKey(s.sent_at)) ?? []), s])
    return Array.from(m.entries())
  }, [filtered])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={s.stats}>
        <Stat label="Aujourd'hui" value={`${sentToday}`} sub={`sur ${dailyCap} par jour`} />
        <Stat label="Envoyés (30 jours)" value={`${ok.length}`} sub={`${contacted} contact${contacted > 1 ? 's' : ''}`} />
        <Stat label="Ont répondu" value={`${replied}`} sub={contacted ? `${Math.round((replied / contacted) * 100)} % des contactés` : 'pas encore d’envoi'} accent />
        <Stat label="Erreurs" value={`${errors}`} sub={errors ? 'adresse refusée ou boîte indisponible' : 'aucune'} warn={errors > 0} />
      </div>

      <div style={s.grid}>
        <section style={{ ...ui.card, padding: 0, overflow: 'hidden', minWidth: 0 }}>
          <div style={s.listHead}>
            <strong style={{ fontSize: '14px', color: 'var(--text)' }}>E-mails envoyés</strong>
            <div style={s.seg}>
              {([['tous', 'Tous'], ['repondu', 'Avec réponse'], ['envoye', 'Envoyés'], ['erreur', 'Erreurs']] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setStatus(k)} style={{ ...s.segBtn, ...(status === k ? s.segOn : {}) }}>{l}</button>
              ))}
            </div>
          </div>
          {!byDay.length && <p style={{ ...ui.sub, padding: '28px 18px', textAlign: 'center' }}>Aucun e-mail ici pour l&apos;instant.</p>}
          {byDay.map(([day, list]) => (
            <div key={day}>
              <div style={s.dayHead} suppressHydrationWarning>{dayLabel(day)} · {list.length} e-mail{list.length > 1 ? 's' : ''}</div>
              {list.map(snd => {
                const c = snd.contact_id ? contactById.get(snd.contact_id) : null
                const seq = snd.sequence_id ? seqById.get(snd.sequence_id) : null
                const rep = repliedSendIds.has(snd.id)
                return (
                  <button key={snd.id} type="button" onClick={() => setOpen(snd)} style={s.row}>
                    <span style={s.time} suppressHydrationWarning>{time(snd.sent_at)}</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: 0 }}>
                        <strong style={s.name}>{c ? displayName(c) : snd.email}</strong>
                        {c?.ville && <span style={{ fontSize: '12px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{c.ville}</span>}
                      </span>
                      <span style={s.subject}>{snd.subject}</span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{seq?.nom ?? 'Séquence supprimée'} · e-mail {(snd.step_position ?? 0) + 1}</span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      {snd.status === 'erreur'
                        ? <span style={{ ...ui.pill, color: 'var(--danger)', border: `1px solid ${tint('var(--danger)', 35)}`, background: tint('var(--danger)', 8) }} title={snd.error ?? ''}><WarningCircle size={12} weight="fill" /> Erreur</span>
                        : rep
                          ? <span style={{ ...ui.pill, color: PINK, border: `1px solid ${tint(PINK, 35)}`, background: tint(PINK, 10) }}><ChatCircleText size={12} weight="fill" /> A répondu</span>
                          : <span style={{ ...ui.pill }}><PaperPlaneTilt size={12} /> Envoyé</span>}
                      <span style={{ fontSize: '11.5px', color: 'var(--accent-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> Voir</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </section>

        <section style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={s.icon}><ChartBar size={17} weight="fill" /></span>
            <div>
              <h3 style={ui.cardTitle}>Ce qui marche</h3>
              <p style={ui.sub}>Réponses obtenues par e-mail de chaque séquence (30 jours).</p>
            </div>
          </div>
          {!perStep.length && <p style={ui.sub}>Les chiffres apparaissent après les premiers envois.</p>}
          {perStep.map(p => {
            const rate = p.sent ? Math.round((p.replies / p.sent) * 100) : 0
            return (
              <div key={`${p.seq}${p.step}`} style={s.stepRow}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--text-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.seq} · e-mail {p.step}</span>
                  <strong style={{ color: 'var(--text)', whiteSpace: 'nowrap' }}>{p.replies} / {p.sent} · {rate} %</strong>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>« {p.subject} »</span>
                <div style={s.bar}><div style={{ ...s.barFill, width: `${Math.min(100, rate * 4)}%` }} /></div>
              </div>
            )
          })}
          <p style={{ ...ui.sub, marginTop: '4px' }}>Repère : en prospection B2B, 5 à 10 % de réponses est un bon score. Une étape sous 2 % après 50 envois mérite un nouvel objet.</p>
        </section>
      </div>

      {open && <PreviewModal send={open} contact={open.contact_id ? contactById.get(open.contact_id) ?? null : null} onClose={() => setOpen(null)} />}
    </div>
  )
}

function Stat({ label, value, sub, accent, warn }: { label: string; value: string; sub: string; accent?: boolean; warn?: boolean }) {
  return (
    <div style={{ ...ui.card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '28px', lineHeight: 1, color: warn ? 'var(--danger)' : accent ? 'var(--accent-text)' : 'var(--text)' }}>{value}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{sub}</span>
    </div>
  )
}

function PreviewModal({ send, contact, onClose }: { send: SendRow; contact: ContactRow | null; onClose: () => void }) {
  const [mail, setMail] = useState<Preview | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    sentEmailPreview(send.id).then(r => { if (live) { if (r.ok) setMail(r.data!); else setErr(r.error) } })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { live = false; window.removeEventListener('keydown', onKey) }
  }, [send.id, onClose])
  if (typeof document === 'undefined') return null
  return createPortal(
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="E-mail envoyé">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={ui.cardTitle}>{send.subject}</h3>
            <p style={ui.sub} suppressHydrationWarning>
              À {contact ? `${displayName(contact)} <${send.email}>` : send.email} · {new Date(send.sent_at).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ ...ui.btnGhost, padding: '7px' }} aria-label="Fermer"><X size={16} weight="bold" /></button>
        </div>
        {send.status === 'erreur' && <div style={{ ...ui.notice, background: tint('var(--danger)', 8), borderColor: tint('var(--danger)', 30), color: 'var(--danger)' }}><WarningCircle size={16} weight="fill" /> <span>Pas parti : {send.error}</span></div>}
        {mail?.edited && <div style={ui.notice}><WarningCircle size={16} weight="fill" style={{ color: AMBER, flexShrink: 0 }} /> <span>Le texte de cet e-mail a été modifié dans la séquence depuis l&apos;envoi : l&apos;aperçu montre la version actuelle.</span></div>}
        {err && <p style={{ ...ui.sub, color: 'var(--danger)' }}>{err}</p>}
        {!mail && !err && <p style={ui.sub}>Chargement…</p>}
        {mail && (
          <iframe title="Aperçu de l'e-mail" sandbox="" srcDoc={`<!doctype html><meta charset="utf-8"><body style="margin:0;padding:18px;background:#fff">${mail.html}</body>`} style={s.frame} />
        )}
      </div>
    </div>,
    document.body,
  )
}

const s: Record<string, React.CSSProperties> = {
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '14px', alignItems: 'start' },
  listHead: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  seg: { display: 'inline-flex', flexWrap: 'wrap', padding: '3px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--surface)' },
  segBtn: { padding: '5px 10px', borderRadius: '8px', border: 'none', background: 'transparent', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' },
  segOn: { background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  dayHead: { padding: '8px 16px', fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--text-3)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' },
  row: { width: '100%', display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '11px 16px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' },
  time: { fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', width: '40px', flexShrink: 0, paddingTop: '2px' },
  name: { fontSize: '13.5px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  subject: { fontSize: '12.5px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  icon: { width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)', flexShrink: 0 },
  stepRow: { display: 'flex', flexDirection: 'column', gap: '5px', padding: '10px 0', borderTop: '1px solid var(--border)' },
  bar: { height: '6px', borderRadius: '999px', background: 'var(--border)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', background: 'var(--accent-text)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(10,20,15,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  modal: { width: 'min(760px, 100%)', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface)', borderRadius: '18px', border: '1px solid var(--border)', padding: '18px 20px', boxSizing: 'border-box' },
  frame: { width: '100%', flex: 1, minHeight: '420px', border: '1px solid var(--border)', borderRadius: '12px', background: '#fff' },
}
