'use client'

// Onglet Contacts : liste filtrable ou pipeline par étape, actions groupées
// (lancer une séquence, changer d'étape, chercher les e-mails, supprimer) et
// fiche d'un contact (modification, historique des envois).

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  MagnifyingGlass, Plus, X, Globe, EnvelopeSimple, Rocket, Trash, ListBullets, Kanban, ArrowSquareOut, CheckCircle,
  WarningCircle, Phone, InstagramLogo, MagicWand,
} from '@phosphor-icons/react/dist/ssr'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { STAGES, STAGE_LABEL, SOURCE_LABEL, type Audience, type Stage } from '@/lib/outreach/engine'
import { tint } from '../_ui/theme'
import { changeStage, deleteContacts, enrollInSequence, findEmails, saveContact, contactHistory, stopContacts } from './actions'
import { ui, stagePill, displayName, fmtDay, STAGE_COLOR, type ContactRow, type SequenceRow } from './shared'

const PAGE = 80

export default function ContactsTab({ audience, contacts, sequences }: { audience: Audience; contacts: ContactRow[]; sequences: SequenceRow[] }) {
  const { confirm, dialog } = useConfirm()
  const [q, setQ] = useState('')
  const [stage, setStage] = useState<Stage | 'tous'>('tous')
  const [view, setView] = useState<'liste' | 'pipeline'>('liste')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [limit, setLimit] = useState(PAGE)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok?: string; err?: string } | null>(null)
  const [open, setOpen] = useState<ContactRow | 'new' | null>(null)
  const [bulkSeq, setBulkSeq] = useState('')

  const mine = useMemo(() => contacts.filter(c => c.audience === audience), [contacts, audience])
  const counts = useMemo(() => {
    const m = new Map<Stage, number>()
    for (const c of mine) m.set(c.stage, (m.get(c.stage) ?? 0) + 1)
    return m
  }, [mine])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return mine.filter(c => (stage === 'tous' || c.stage === stage) && (!needle || [c.email, c.nom, c.prenom, c.entreprise, c.ville, c.departement].some(v => v?.toLowerCase().includes(needle))))
  }, [mine, q, stage])
  const seqs = sequences.filter(s => s.audience === audience)
  const seqName = (id: string | null) => seqs.find(s => s.id === id)?.nom ?? null

  useEffect(() => { setSelected(new Set()); setLimit(PAGE) }, [audience, stage, q])

  function flash(m: { ok?: string; err?: string }) { setMsg(m); if (m.ok) setTimeout(() => setMsg(null), 4000) }
  const toggleOne = (id: string) => setSelected(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const ids = Array.from(selected)

  async function bulkEnroll() {
    if (!bulkSeq) return
    setBusy('enroll')
    const res = await enrollInSequence(bulkSeq, ids)
    setBusy(null)
    if (!res.ok) return flash({ err: res.error })
    const n = res.data?.added ?? 0
    flash({ ok: `${n} contact${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} à « ${seqName(bulkSeq)} »${n < ids.length ? ` (${ids.length - n} ignoré${ids.length - n > 1 ? 's' : ''} : sans e-mail, déjà dedans ou étape fermée)` : ''}` })
    setSelected(new Set())
  }
  async function bulkStage(st: Stage) {
    setBusy('stage')
    const res = await changeStage(ids, st)
    setBusy(null)
    if (!res.ok) return flash({ err: res.error })
    flash({ ok: `${ids.length} contact${ids.length > 1 ? 's' : ''} en « ${STAGE_LABEL[st]} »` })
    setSelected(new Set())
  }
  async function bulkFind() {
    const target = mine.filter(c => selected.has(c.id) && !c.email && c.site_web).map(c => c.id)
    if (!target.length) return flash({ err: 'Aucun contact sélectionné sans e-mail avec un site.' })
    setBusy('find')
    const res = await findEmails(target)
    setBusy(null)
    if (!res.ok) return flash({ err: res.error })
    flash({ ok: `${res.data?.found ?? 0} e-mail${(res.data?.found ?? 0) > 1 ? 's' : ''} trouvé${(res.data?.found ?? 0) > 1 ? 's' : ''} sur ${res.data?.checked ?? 0} site${(res.data?.checked ?? 0) > 1 ? 's' : ''}${res.data?.left ? `, ${res.data.left} restant${res.data.left > 1 ? 's' : ''} : relance` : ''}` })
  }
  async function bulkStop() {
    setBusy('stop')
    const res = await stopContacts(ids)
    setBusy(null)
    flash(res.ok ? { ok: 'Séquences arrêtées pour la sélection' } : { err: res.error })
  }
  async function bulkDelete() {
    if (!(await confirm({ title: `Supprimer ${ids.length} contact${ids.length > 1 ? 's' : ''} ?`, message: 'Leur historique est supprimé. Les désinscriptions restent enregistrées : une adresse opposée ne sera jamais réimportée.', confirmLabel: 'Supprimer', danger: true }))) return
    setBusy('delete')
    const res = await deleteContacts(ids)
    setBusy(null)
    if (!res.ok) return flash({ err: res.error })
    setSelected(new Set())
  }

  const toFindCount = mine.filter(c => c.stage === 'a_trouver' && c.site_web).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {dialog}
      <div style={s.toolbar}>
        <label style={s.search}>
          <MagnifyingGlass size={15} color="var(--text-3)" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nom, e-mail, ville, département…" style={s.searchInput} />
        </label>
        <select value={stage} onChange={e => setStage(e.target.value as Stage | 'tous')} style={{ ...ui.input, width: 'auto', minWidth: '180px' }} aria-label="Étape">
          <option value="tous">Toutes les étapes ({mine.length})</option>
          {STAGES.map(st => <option key={st.key} value={st.key}>{st.label} ({counts.get(st.key) ?? 0})</option>)}
        </select>
        <div style={s.seg}>
          <button type="button" onClick={() => setView('liste')} style={{ ...s.segBtn, ...(view === 'liste' ? s.segOn : {}) }}><ListBullets size={14} weight="bold" /> Liste</button>
          <button type="button" onClick={() => setView('pipeline')} style={{ ...s.segBtn, ...(view === 'pipeline' ? s.segOn : {}) }}><Kanban size={14} weight="bold" /> Pipeline</button>
        </div>
        <span style={{ flex: 1 }} />
        {toFindCount > 0 && (
          <button type="button" onClick={async () => { setSelected(new Set(mine.filter(c => c.stage === 'a_trouver' && c.site_web).slice(0, 60).map(c => c.id))); flash({ ok: 'Contacts à compléter sélectionnés : clique « Chercher les e-mails ».' }) }} style={ui.btnGhost}>
            <MagicWand size={14} weight="bold" /> {toFindCount} e-mail{toFindCount > 1 ? 's' : ''} à chercher
          </button>
        )}
        <button type="button" onClick={() => setOpen('new')} style={ui.btn}><Plus size={14} weight="bold" /> Ajouter</button>
      </div>

      {msg && <div style={{ ...ui.notice, ...(msg.ok ? { background: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' } : { background: tint('var(--danger)', 8), borderColor: tint('var(--danger)', 30), color: 'var(--danger)' }) }}>{msg.ok ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} weight="fill" />} {msg.ok ?? msg.err}</div>}

      {selected.size > 0 && (
        <div style={s.bulk}>
          <strong style={{ fontSize: '13px' }}>{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</strong>
          <select value={bulkSeq} onChange={e => setBulkSeq(e.target.value)} style={{ ...ui.input, width: 'auto', minWidth: '200px' }} aria-label="Séquence">
            <option value="">Choisir une séquence…</option>
            {seqs.map(sq => <option key={sq.id} value={sq.id}>{sq.nom}{sq.enabled ? '' : ' (en pause)'}</option>)}
          </select>
          <button type="button" onClick={bulkEnroll} disabled={!bulkSeq || busy === 'enroll'} style={{ ...ui.btn, opacity: bulkSeq ? 1 : 0.5 }}><Rocket size={14} weight="bold" /> Lancer</button>
          <select value="" onChange={e => e.target.value && bulkStage(e.target.value as Stage)} style={{ ...ui.input, width: 'auto' }} aria-label="Changer d'étape">
            <option value="">Changer d&apos;étape…</option>
            {STAGES.map(st => <option key={st.key} value={st.key}>{st.label}</option>)}
          </select>
          <button type="button" onClick={bulkFind} disabled={busy === 'find'} style={ui.btnGhost}><Globe size={14} weight="bold" /> {busy === 'find' ? 'Recherche…' : 'Chercher les e-mails'}</button>
          <button type="button" onClick={bulkStop} disabled={busy === 'stop'} style={ui.btnGhost}>Arrêter les séquences</button>
          <button type="button" onClick={bulkDelete} style={ui.btnDanger}><Trash size={14} weight="bold" /></button>
          <button type="button" onClick={() => setSelected(new Set())} style={{ ...ui.btnGhost, padding: '8px 10px' }} aria-label="Tout désélectionner"><X size={14} weight="bold" /></button>
        </div>
      )}

      {view === 'liste' ? (
        <div style={{ ...ui.card, padding: 0, overflow: 'hidden' }}>
          <div style={s.headRow}>
            <input type="checkbox" checked={filtered.length > 0 && filtered.slice(0, limit).every(c => selected.has(c.id))} onChange={e => setSelected(e.target.checked ? new Set(filtered.slice(0, limit).map(c => c.id)) : new Set())} style={{ accentColor: 'var(--accent-text)' }} aria-label="Tout sélectionner" />
            <span style={{ flex: 1 }}>{filtered.length} contact{filtered.length > 1 ? 's' : ''}</span>
          </div>
          {!filtered.length && <p style={{ ...ui.sub, padding: '24px 18px', textAlign: 'center' }}>Aucun contact ici. Ajoute-en à la main ou depuis l&apos;onglet « Trouver des contacts ».</p>}
          {filtered.slice(0, limit).map(c => (
            <div key={c.id} style={{ ...s.row, ...(selected.has(c.id) ? { background: 'var(--accent-bg)' } : {}) }}>
              <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} style={{ accentColor: 'var(--accent-text)', marginTop: '4px' }} aria-label={`Sélectionner ${displayName(c)}`} />
              <button type="button" onClick={() => setOpen(c)} style={s.rowMain}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--text)' }}>{displayName(c)}</strong>
                  {c.entreprise && c.nom && c.nom !== c.entreprise && <span style={{ fontSize: '12.5px', color: 'var(--text-3)' }}>{c.nom}</span>}
                </span>
                <span style={s.rowMeta}>
                  {c.email ? <><EnvelopeSimple size={12} /> {c.email}</> : <span style={{ color: '#8A5A12' }}>E-mail à trouver{c.site_web ? '' : ' (pas de site)'}</span>}
                  {c.ville && <> · {c.ville}{c.departement ? ` (${c.departement})` : ''}</>}
                  {c.active_sequence_id && <> · <Rocket size={12} /> {seqName(c.active_sequence_id)}</>}
                </span>
              </button>
              <div style={s.rowSide}>
                <span style={stagePill(c.stage)}>{STAGE_LABEL[c.stage]}</span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{c.last_contacted_at ? `écrit le ${fmtDay(c.last_contacted_at)}` : SOURCE_LABEL[c.source]}</span>
              </div>
            </div>
          ))}
          {filtered.length > limit && <button type="button" onClick={() => setLimit(l => l + PAGE)} style={{ ...ui.btnGhost, margin: '12px auto', display: 'flex' }}>Voir {Math.min(PAGE, filtered.length - limit)} de plus</button>}
        </div>
      ) : (
        <div style={s.board}>
          {STAGES.map(st => {
            const col = filtered.filter(c => c.stage === st.key)
            return (
              <div key={st.key} style={s.col}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9, background: STAGE_COLOR[st.key] }} />
                  <strong style={{ fontSize: '13px', color: 'var(--text)' }}>{st.label}</strong>
                  <span style={{ ...ui.pill, padding: '1px 8px' }}>{col.length}</span>
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{st.hint}</span>
                {col.slice(0, 40).map(c => (
                  <button key={c.id} type="button" onClick={() => setOpen(c)} style={s.kCard}>
                    <strong style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName(c)}</strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{[c.ville, c.last_contacted_at ? `écrit le ${fmtDay(c.last_contacted_at)}` : null].filter(Boolean).join(' · ') || (c.email ?? 'e-mail à trouver')}</span>
                  </button>
                ))}
                {col.length > 40 && <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>et {col.length - 40} de plus</span>}
              </div>
            )
          })}
        </div>
      )}

      {open && (
        <ContactPanel
          contact={open === 'new' ? null : open}
          audience={audience}
          sequences={seqs}
          onClose={() => setOpen(null)}
          onSaved={m => { flash({ ok: m }); setOpen(null) }}
        />
      )}
    </div>
  )
}

function ContactPanel({ contact, audience, sequences, onClose, onSaved }: {
  contact: ContactRow | null; audience: Audience; sequences: SequenceRow[]; onClose: () => void; onSaved: (msg: string) => void
}) {
  const [f, setF] = useState({
    email: contact?.email ?? '', prenom: contact?.prenom ?? '', nom: contact?.nom ?? '', entreprise: contact?.entreprise ?? '',
    ville: contact?.ville ?? '', departement: contact?.departement ?? '', site_web: contact?.site_web ?? '', telephone: contact?.telephone ?? '',
    instagram: contact?.instagram ?? '', notes: contact?.notes ?? '',
  })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<Awaited<ReturnType<typeof contactHistory>> | null>(null)
  const [stageBusy, setStageBusy] = useState(false)

  useEffect(() => {
    if (contact) contactHistory(contact.id).then(setHistory)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [contact, onClose])

  async function submit() {
    setBusy(true); setErr(null)
    const res = await saveContact({ id: contact?.id, audience, ...f })
    setBusy(false)
    if (!res.ok) return setErr(res.error)
    onSaved(contact ? 'Contact enregistré' : 'Contact ajouté')
  }
  async function moveTo(st: Stage) {
    if (!contact) return
    setStageBusy(true)
    const res = await changeStage([contact.id], st)
    setStageBusy(false)
    if (!res.ok) return setErr(res.error)
    onSaved(`Contact passé en « ${STAGE_LABEL[st]} »`)
  }

  const field = (key: keyof typeof f, label: string, type = 'text', wide = false) => (
    <label style={{ ...ui.label, ...(wide ? { gridColumn: '1 / -1' } : {}) }}>
      {label}
      <input type={type} value={f[key]} onChange={e => setF(p => ({ ...p, [key]: e.target.value }))} style={ui.input} />
    </label>
  )

  const seqName = (id: string | null) => sequences.find(s => s.id === id)?.nom ?? 'Séquence supprimée'
  const googleQuery = contact ? `https://www.google.com/search?q=${encodeURIComponent([contact.entreprise || contact.nom, contact.ville, audience === 'photographe' ? 'photographe' : audience === 'menage' ? 'ménage' : ''].filter(Boolean).join(' '))}` : ''

  if (typeof document === 'undefined') return null
  return createPortal(
    <div style={s.overlay} onClick={onClose}>
      <div style={s.panel} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={contact ? displayName(contact) : 'Nouveau contact'}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={ui.cardTitle}>{contact ? displayName(contact) : 'Nouveau contact'}</h3>
            {contact && <p style={ui.sub}>{SOURCE_LABEL[contact.source]}{contact.source_detail ? ` : ${contact.source_detail}` : ''}</p>}
          </div>
          <button type="button" onClick={onClose} style={{ ...ui.btnGhost, padding: '7px' }} aria-label="Fermer"><X size={16} weight="bold" /></button>
        </div>

        {contact && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={stagePill(contact.stage)}>{STAGE_LABEL[contact.stage]}</span>
            <select value="" onChange={e => e.target.value && moveTo(e.target.value as Stage)} disabled={stageBusy} style={{ ...ui.input, width: 'auto', padding: '6px 10px', fontSize: '13px' }} aria-label="Changer d'étape">
              <option value="">Changer d&apos;étape…</option>
              {STAGES.filter(st => st.key !== contact.stage).map(st => <option key={st.key} value={st.key}>{st.label}</option>)}
            </select>
            {contact.site_web && <a href={contact.site_web} target="_blank" rel="noopener noreferrer" style={ui.btnGhost}><Globe size={13} /> Site <ArrowSquareOut size={11} /></a>}
            {!contact.email && <a href={googleQuery} target="_blank" rel="noopener noreferrer" style={ui.btnGhost}><MagnifyingGlass size={13} /> Chercher sur Google</a>}
            {contact.telephone && <a href={`tel:${contact.telephone.replace(/\s/g, '')}`} style={ui.btnGhost}><Phone size={13} /> Appeler</a>}
            {contact.instagram && <a href={`https://instagram.com/${contact.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" style={ui.btnGhost}><InstagramLogo size={13} /> Instagram</a>}
          </div>
        )}

        <div style={s.formGrid}>
          {field('email', 'E-mail', 'email', true)}
          {field('prenom', 'Prénom')}
          {field('nom', 'Nom')}
          {field('entreprise', 'Entreprise / marque', 'text', true)}
          {field('ville', 'Ville')}
          {field('departement', 'Département')}
          {field('site_web', 'Site web', 'url', true)}
          {field('telephone', 'Téléphone')}
          {field('instagram', 'Instagram')}
          <label style={{ ...ui.label, gridColumn: '1 / -1' }}>
            Notes
            <textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} rows={3} style={ui.textarea} />
          </label>
        </div>
        {err && <div style={{ ...ui.notice, background: tint('var(--danger)', 8), borderColor: tint('var(--danger)', 30), color: 'var(--danger)' }}><WarningCircle size={16} weight="fill" /> {err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={ui.btnGhost}>Fermer</button>
          <button type="button" onClick={submit} disabled={busy} style={ui.btn}>{busy ? 'Enregistrement…' : contact ? 'Enregistrer' : 'Ajouter le contact'}</button>
        </div>

        {contact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <strong style={{ fontSize: '13px', color: 'var(--text)' }}>Historique</strong>
            {!history ? <span style={ui.sub}>Chargement…</span> : !history.ok ? <span style={ui.sub}>{history.error}</span> : (
              <>
                {history.data!.enrollments.map((e, i) => (
                  <div key={i} style={s.histRow}>
                    <Rocket size={13} color="var(--accent-text)" />
                    <span style={{ flex: 1 }}>{seqName(e.sequence_id)}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {e.status === 'en_cours' ? `e-mail ${e.next_step + 1}${e.next_send_on ? ` le ${fmtDay(`${e.next_send_on}T12:00:00Z`)}` : ''}` : e.status === 'terminee' ? 'terminée' : `arrêtée${e.stop_reason ? ` (${STOP_LABEL[e.stop_reason] ?? e.stop_reason})` : ''}`}
                    </span>
                  </div>
                ))}
                {history.data!.sends.map((snd, i) => (
                  <div key={`s${i}`} style={s.histRow}>
                    <EnvelopeSimple size={13} color={snd.status === 'erreur' ? 'var(--danger)' : 'var(--text-3)'} />
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snd.subject}</span>
                    <span style={{ fontSize: '12px', color: snd.status === 'erreur' ? 'var(--danger)' : 'var(--text-3)' }} title={snd.error ?? ''}>{snd.status === 'erreur' ? 'erreur' : fmtDay(snd.sent_at)}</span>
                  </div>
                ))}
                {!history.data!.enrollments.length && !history.data!.sends.length && <span style={ui.sub}>Aucun e-mail pour l&apos;instant.</span>}
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

const STOP_LABEL: Record<string, string> = {
  reponse: 'réponse', desinscrit: 'désinscription', invalide: 'adresse invalide', rebond: 'rebond', manuel: 'à la main',
  interesse: 'intéressé', inscrit: 'inscrit', client: 'client', pas_interesse: 'pas intéressé', contact: 'contact fermé',
}

const s: Record<string, React.CSSProperties> = {
  toolbar: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' },
  search: { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--surface)', flex: '1 1 240px', minWidth: 0 },
  searchInput: { border: 'none', background: 'transparent', padding: '10px 0', fontSize: '14px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', width: '100%' },
  seg: { display: 'inline-flex', padding: '3px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--surface)' },
  segBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 11px', borderRadius: '8px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' },
  segOn: { background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  bulk: { position: 'sticky', top: '8px', zIndex: 4, display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', padding: '10px 12px', borderRadius: '14px', background: 'var(--surface)', border: '1px solid var(--accent-border)', boxShadow: '0 6px 20px rgba(0,0,0,0.08)' },
  headRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-3)' },
  row: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  rowMain: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' },
  rowMeta: { display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--text-2)', minWidth: 0, overflowWrap: 'anywhere' },
  rowSide: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 },
  board: { display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', alignItems: 'flex-start' },
  col: { flex: '0 0 230px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)' },
  kCard: { display: 'flex', flexDirection: 'column', gap: '3px', padding: '9px 11px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--bg)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', minWidth: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(10,20,15,0.35)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' },
  panel: { width: 'min(560px, 100%)', height: '100%', overflowY: 'auto', background: 'var(--surface)', borderLeft: '1px solid var(--border)', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' },
  histRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-2)', padding: '6px 0', borderBottom: '1px dashed var(--border)' },
}
