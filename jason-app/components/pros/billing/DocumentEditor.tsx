'use client'

// Éditeur d'un devis ou d'une facture (04/10/2026) : formulaire à gauche,
// aperçu du document en direct à droite (au-delà de 1100 px ; bascule
// Modifier / Aperçu sur téléphone). Enregistrement automatique du brouillon.
// Une fois finalisé, le document ne se modifie plus : place au suivi
// (envoi, acceptation, paiement, relance, avoir).

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Trash, ArrowUp, ArrowDown, PaperPlaneTilt, Check, Copy, DownloadSimple,
  Receipt, FileText, Eye, PencilSimple, CopySimple, ArrowCounterClockwise, Bell, X, Sparkle,
  UserCircle, CalendarBlank, ListBullets, ChatText, CheckCircle, Clock, Gear,
} from '@phosphor-icons/react/dist/ssr'
import DocumentPaper from './DocumentPaper'
import BillingSettings from './BillingSettings'
import { statusLabel, statusStyle } from './status'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import {
  addDays, computeTotals, DOC_LABEL, displayStatus, eur, frDate, lineAmount, missingDocFields,
  missingProfileFields, PAID_METHODS, SUGGESTIONS, UNITS,
  type BillingProfile, type DocKind, type DocLine, type ProDocument, type ProKind,
} from '@/lib/pros/billing'
import {
  cancelWithCreditNote, createInvoiceFromQuote, deleteDraft, duplicateDocument, finalizeDocument,
  saveDocument, sendDocument, setDocStatus,
} from '@/lib/pros/billing-actions'

export interface EditorClient { id: string; nom: string; email: string | null; ville: string | null; logement: string | null }

interface Form {
  kind: DocKind
  client_id: string | null
  client_name: string
  client_email: string
  client_address: string
  client_is_pro: boolean
  client_siren: string
  title: string
  service_date: string
  valid_until: string
  due_date: string
  lines: DocLine[]
  vat_rate: number
  notes: string
}

const emptyLine = (): DocLine => ({ label: '', detail: null, qty: 1, unit: 'forfait', unit_price: 0 })

export default function DocumentEditor({
  kind, base, doc, newKind, profile: initialProfile, profileSaved, logoUrl, clients, prefill, recent, today, sourceNumber, appUrl,
}: {
  kind: ProKind
  base: string
  doc: ProDocument | null
  newKind: DocKind
  profile: BillingProfile
  profileSaved: boolean
  logoUrl: string | null
  clients: EditorClient[]
  prefill: Partial<Form> | null
  recent: DocLine[]
  today: string
  sourceNumber: string | null
  appUrl: string
}) {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()
  const [profile, setProfile] = useState(initialProfile)
  const [saved, setSaved] = useState(profileSaved)
  const [showSettings, setShowSettings] = useState(false)
  const [id, setId] = useState<string | null>(doc?.id ?? null)
  const [view, setView] = useState<'form' | 'preview'>('form')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [pending, start] = useTransition()
  const [paying, setPaying] = useState(false)
  const [paidAt, setPaidAt] = useState(today)
  const [paidMethod, setPaidMethod] = useState<string>('Virement')
  const [copied, setCopied] = useState(false)

  const isDraft = !doc || doc.status === 'brouillon'
  const [f, setF] = useState<Form>(() => ({
    kind: doc?.kind ?? newKind,
    client_id: doc?.client_id ?? null,
    client_name: doc?.client_name ?? '',
    client_email: doc?.client_email ?? '',
    client_address: doc?.client_address ?? '',
    client_is_pro: doc?.client_is_pro ?? false,
    client_siren: doc?.client_siren ?? '',
    title: doc?.title ?? '',
    service_date: doc?.service_date ?? '',
    valid_until: doc?.valid_until ?? (newKind === 'devis' ? addDays(today, profile.quote_validity_days) : ''),
    due_date: doc?.due_date ?? (newKind === 'facture' ? addDays(today, profile.payment_days) : ''),
    lines: doc?.lines?.length ? doc.lines : [emptyLine()],
    vat_rate: doc?.vat_rate || profile.default_vat_rate,
    notes: doc?.notes ?? '',
    ...(prefill ?? {}),
  }))

  const vatMode = doc && !isDraft ? doc.vat_mode : profile.vat_mode
  const totals = useMemo(() => computeTotals(f.lines, vatMode, vatMode === 'tva' ? f.vat_rate : 0), [f.lines, f.vat_rate, vatMode])

  // ─── Enregistrement automatique du brouillon ──────────────────────
  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(f)
  latest.current = f
  const idRef = useRef(id)
  idRef.current = id

  const persist = useCallback(async (): Promise<string | null> => {
    const cur = latest.current
    const meaningful = cur.client_name.trim() || cur.lines.some(l => l.label.trim() || l.unit_price)
    if (!idRef.current && !meaningful) return null
    setSaveState('saving')
    const r = await saveDocument(kind, { ...cur, id: idRef.current })
    if (!r.ok) { setSaveState('error'); setMsg({ tone: 'err', text: r.error }); return null }
    dirty.current = false
    setSaveState('saved')
    if (!idRef.current) {
      setId(r.id)
      idRef.current = r.id
      window.history.replaceState(null, '', `${base}/${r.id}`)
    }
    return r.id
  }, [kind, base])

  const update = useCallback((patch: Partial<Form>) => {
    setF(x => ({ ...x, ...patch }))
    if (!isDraft) return
    dirty.current = true
    setSaveState('idle')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { void persist() }, 1200)
  }, [isDraft, persist])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const setLine = (i: number, patch: Partial<DocLine>) => update({ lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  const addLine = (l?: Partial<DocLine>) => {
    const blank = f.lines.length === 1 && !f.lines[0].label && !f.lines[0].unit_price
    const next = { ...emptyLine(), ...l }
    update({ lines: blank ? [next] : [...f.lines, next] })
  }
  const moveLine = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= f.lines.length) return
    const arr = [...f.lines]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    update({ lines: arr })
  }
  const removeLine = (i: number) => update({ lines: f.lines.length > 1 ? f.lines.filter((_, j) => j !== i) : [emptyLine()] })

  function pickClient(cid: string) {
    if (!cid) { update({ client_id: null }); return }
    const c = clients.find(x => x.id === cid)
    if (!c) return
    update({ client_id: c.id, client_name: c.nom, client_email: c.email ?? '', client_address: f.client_address || (c.ville ?? '') })
  }

  // ─── Actions ──────────────────────────────────────────────────────
  const flash = (tone: 'ok' | 'err', text: string) => { setMsg({ tone, text }); if (tone === 'ok') setTimeout(() => setMsg(m => (m?.text === text ? null : m)), 4000) }

  const missingP = missingProfileFields(saved ? profile : null)
  const missingD = missingDocFields({ client_name: f.client_name, lines: f.lines })
  const label = DOC_LABEL[f.kind]

  async function finalize(send: boolean) {
    if (missingP.length) { setShowSettings(true); return }
    if (missingD.length) { flash('err', `Il manque ${missingD.join(' et ')}.`); return }
    if (send && !f.client_email.trim()) { flash('err', 'Ajoute l\'e-mail du client pour lui envoyer le document.'); return }
    const ok = await confirm({
      title: send ? `Finaliser et envoyer ${f.kind === 'devis' ? 'le devis' : 'la facture'} ?` : `Finaliser ${f.kind === 'devis' ? 'le devis' : 'la facture'} ?`,
      message: f.kind === 'facture'
        ? 'La facture reçoit son numéro définitif et ne pourra plus être modifiée. En cas d\'erreur, tu pourras l\'annuler par un avoir.'
        : `Le devis reçoit son numéro.${send ? ` ${f.client_name} le reçoit par e-mail et peut l'accepter en ligne.` : ''}`,
      confirmLabel: send ? 'Finaliser et envoyer' : 'Finaliser',
    })
    if (!ok) return
    start(async () => {
      if (timer.current) clearTimeout(timer.current)
      const docId = (await persist()) ?? idRef.current
      if (!docId) { flash('err', 'Ajoute un client et une prestation.'); return }
      const r = await finalizeDocument(kind, docId, send)
      if (!r.ok) { flash('err', r.error); return }
      dirty.current = false
      router.replace(`${base}/${docId}?ok=${send && !r.emailError ? 'envoye' : 'finalise'}`)
      router.refresh()
      if (r.emailError) flash('err', `${label} ${r.number} finalisé${f.kind === 'facture' ? 'e' : ''}, mais l'e-mail n'est pas parti : ${r.emailError}`)
    })
  }

  function act(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, okText: string) {
    start(async () => {
      const r = await fn()
      if (!r.ok) { flash('err', r.error); return }
      flash('ok', okText)
      router.refresh()
    })
  }

  function go(fn: () => Promise<({ ok: true; id: string } & object) | { ok: false; error: string }>) {
    start(async () => {
      const r = await fn()
      if (!r.ok) { flash('err', r.error); return }
      router.push(`${base}/${r.id}`)
    })
  }

  async function remove() {
    if (!id) { router.push(base); return }
    if (!(await confirm({ message: `Supprimer ce ${isDraft ? 'brouillon' : 'devis'} ?`, confirmLabel: 'Supprimer', danger: true }))) return
    start(async () => {
      const r = await deleteDraft(kind, id)
      if (!r.ok) { flash('err', r.error); return }
      dirty.current = false
      router.push(base)
    })
  }

  async function creditNote() {
    if (!doc) return
    if (!(await confirm({ title: 'Annuler cette facture ?', message: `Un avoir du même montant (${eur(doc.total_ttc)}) est créé et numéroté. La facture ${doc.number} passe en « Annulée ». C'est la seule façon légale de corriger une facture émise.`, confirmLabel: 'Créer l\'avoir', danger: true }))) return
    go(() => cancelWithCreditNote(kind, doc.id))
  }

  const publicUrl = doc ? `${appUrl}/doc/${doc.public_token}` : ''
  async function copyLink() {
    try { await navigator.clipboard.writeText(publicUrl) } catch { /* navigateur ancien */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Message après finalisation (paramètre ok=)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('ok')
    if (p === 'envoye') flash('ok', `${label} envoyé${f.kind === 'facture' ? 'e' : ''} à ${f.client_email || 'ton client'}.`)
    if (p === 'finalise') flash('ok', `${label} finalisé${f.kind === 'facture' ? 'e' : ''}. Tu peux le télécharger ou copier le lien.`)
    if (p) window.history.replaceState(null, '', window.location.pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Aperçu ───────────────────────────────────────────────────────
  const paperDoc = doc && !isDraft
    ? doc
    : {
        ...f, number: null, status: 'brouillon', issue_date: null,
        vat_mode: vatMode, vat_rate: vatMode === 'tva' ? f.vat_rate : 0, ...totals,
        client_name: f.client_name || null, client_email: f.client_email || null, client_address: f.client_address || null,
        client_siren: f.client_siren || null, title: f.title || null, service_date: f.service_date || null,
        valid_until: f.kind === 'devis' ? f.valid_until || null : null, due_date: f.kind === 'facture' ? f.due_date || null : null,
        notes: f.notes || null, accepted_at: null, accepted_name: null, paid_at: null, paid_method: null,
      }
  const st = doc ? displayStatus(doc, today) : 'brouillon'
  const suggestions = [...recent.map(l => ({ ...l, recent: true })), ...SUGGESTIONS[kind].filter(sg => !recent.some(r => r.label.toLowerCase() === sg.label.toLowerCase())).map(sg => ({ ...sg, qty: 1, unit_price: 0, recent: false }))].slice(0, 9)

  return (
    <div style={s.wrap}>
      {dialog}

      <div style={s.top}>
        <Link href={base} style={s.back}><ArrowLeft size={15} weight="bold" /> Devis & factures</Link>
        <div style={s.topMain}>
          <span style={{ ...s.kindBadge, ...(f.kind === 'devis' ? {} : s.kindBadgeInv) }}>
            {f.kind === 'devis' ? <FileText size={18} weight="bold" /> : f.kind === 'avoir' ? <ArrowCounterClockwise size={18} weight="bold" /> : <Receipt size={18} weight="bold" />}
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 style={s.h1}>{doc?.number ? `${label} ${doc.number}` : `Nouveau ${f.kind === 'devis' ? 'devis' : 'brouillon de facture'}`}</h1>
            <div style={s.topSub}>
              <span style={statusStyle(st)}>{statusLabel(st)}</span>
              {isDraft && <span style={s.saveState}>{saveState === 'saving' ? 'Enregistrement…' : saveState === 'saved' ? <><Check size={12} weight="bold" /> Brouillon enregistré</> : saveState === 'error' ? 'Non enregistré' : id ? 'Enregistrement automatique' : ''}</span>}
              {doc?.client_name && !isDraft && <span style={s.topClient}>{doc.client_name} · {eur(doc.total_ttc)}</span>}
            </div>
          </div>
        </div>
        <div className="billing-viewtoggle" style={s.viewToggle}>
          <button onClick={() => setView('form')} style={{ ...s.vt, ...(view === 'form' ? s.vtOn : {}) }}><PencilSimple size={14} weight="bold" /> {isDraft ? 'Modifier' : 'Suivi'}</button>
          <button onClick={() => setView('preview')} style={{ ...s.vt, ...(view === 'preview' ? s.vtOn : {}) }}><Eye size={14} weight="bold" /> Aperçu</button>
        </div>
      </div>

      {msg && (
        <div style={{ ...s.msg, ...(msg.tone === 'err' ? s.msgErr : s.msgOk) }} role="status">
          {msg.tone === 'ok' ? <CheckCircle size={17} weight="fill" /> : <X size={16} weight="bold" />}
          <span style={{ flex: 1 }}>{msg.text}</span>
          <button onClick={() => setMsg(null)} style={s.msgClose} aria-label="Fermer"><X size={14} /></button>
        </div>
      )}

      <div className="billing-editor" data-view={view} style={s.grid}>
        <div className="billing-form" style={s.formCol}>
          {isDraft ? (
            <>
              {f.kind === 'devis' || f.kind === 'facture' ? (
                <div style={s.kindSwitch}>
                  {(['devis', 'facture'] as const).map(k => (
                    <button key={k} onClick={() => update({ kind: k, valid_until: k === 'devis' ? (f.valid_until || addDays(today, profile.quote_validity_days)) : f.valid_until, due_date: k === 'facture' ? (f.due_date || addDays(today, profile.payment_days)) : f.due_date })}
                      style={{ ...s.kindBtn, ...(f.kind === k ? s.kindBtnOn : {}) }}>
                      {k === 'devis' ? <FileText size={15} weight="bold" /> : <Receipt size={15} weight="bold" />} {k === 'devis' ? 'Devis' : 'Facture'}
                    </button>
                  ))}
                </div>
              ) : null}

              <Card icon={<UserCircle size={17} weight="bold" />} title="Client">
                {clients.length > 0 && (
                  <select className="input-field" style={s.input} value={f.client_id ?? ''} onChange={e => pickClient(e.target.value)}>
                    <option value="">Nouveau client (ou choisis dans ton carnet)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom}{c.ville ? ` · ${c.ville}` : ''}</option>)}
                  </select>
                )}
                <div style={s.grid2}>
                  <Field label="Nom du client">
                    <input className="input-field" style={s.input} value={f.client_name} onChange={e => update({ client_name: e.target.value, client_id: null })} placeholder="Prénom Nom ou société" />
                  </Field>
                  <Field label="E-mail">
                    <input className="input-field" style={s.input} type="email" value={f.client_email} onChange={e => update({ client_email: e.target.value })} placeholder="pour lui envoyer le document" />
                  </Field>
                </div>
                <Field label="Adresse">
                  <textarea className="input-field" style={{ ...s.input, resize: 'vertical' as const }} rows={2} value={f.client_address} onChange={e => update({ client_address: e.target.value })} placeholder="Adresse de facturation" />
                </Field>
                <label style={s.check}>
                  <input type="checkbox" checked={f.client_is_pro} onChange={e => update({ client_is_pro: e.target.checked })} />
                  <span>Client professionnel (conciergerie, société, autre entrepreneur)</span>
                </label>
                {f.client_is_pro && (
                  <Field label="SIREN du client" hint="Ajoute aussi automatiquement les pénalités de retard et l'indemnité de 40 € sur la facture.">
                    <input className="input-field" style={s.input} value={f.client_siren} onChange={e => update({ client_siren: e.target.value })} inputMode="numeric" placeholder="9 chiffres" />
                  </Field>
                )}
              </Card>

              <Card icon={<CalendarBlank size={17} weight="bold" />} title="Détails">
                <Field label="Objet (facultatif)">
                  <input className="input-field" style={s.input} value={f.title} onChange={e => update({ title: e.target.value })} placeholder={kind === 'photographer' ? 'Ex. Shooting photo, Villa Les Pins' : 'Ex. Ménages d\'octobre, Appartement Vieux-Port'} />
                </Field>
                <div style={s.grid2}>
                  <Field label="Date de la prestation">
                    <input className="input-field" style={s.input} type="date" value={f.service_date} onChange={e => update({ service_date: e.target.value })} />
                  </Field>
                  {f.kind === 'devis' ? (
                    <Field label="Valable jusqu'au">
                      <input className="input-field" style={s.input} type="date" value={f.valid_until} onChange={e => update({ valid_until: e.target.value })} />
                      <Chips items={[[15, '15 j'], [30, '30 j'], [60, '60 j']]} onPick={d => update({ valid_until: addDays(today, d) })} />
                    </Field>
                  ) : (
                    <Field label="À régler avant le">
                      <input className="input-field" style={s.input} type="date" value={f.due_date} onChange={e => update({ due_date: e.target.value })} />
                      <Chips items={[[0, 'À réception'], [15, '15 j'], [30, '30 j']]} onPick={d => update({ due_date: addDays(today, d) })} />
                    </Field>
                  )}
                </div>
              </Card>

              <Card icon={<ListBullets size={17} weight="bold" />} title="Prestations">
                <div style={s.sugg}>
                  <span style={s.suggLabel}><Sparkle size={13} weight="fill" /> Ajout rapide</span>
                  {suggestions.map((sg, i) => (
                    <button key={i} onClick={() => addLine({ label: sg.label, detail: sg.detail ?? null, unit: sg.unit, qty: sg.qty || 1, unit_price: sg.unit_price || 0 })} style={s.suggChip} title={sg.recent ? 'Déjà facturé' : 'Suggestion'}>
                      <Plus size={11} weight="bold" /> {sg.label}{sg.recent && sg.unit_price ? ` · ${eur(sg.unit_price)}` : ''}
                    </button>
                  ))}
                </div>
                <div style={s.lines}>
                  {f.lines.map((l, i) => (
                    <div key={i} style={s.lineCard}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <input className="input-field" style={{ ...s.input, flex: 1, fontWeight: 600 }} value={l.label} onChange={e => setLine(i, { label: e.target.value })} placeholder="Désignation de la prestation" aria-label="Désignation" />
                        <div style={s.lineTools}>
                          <button onClick={() => moveLine(i, -1)} disabled={i === 0} style={s.iconBtn} aria-label="Monter"><ArrowUp size={13} /></button>
                          <button onClick={() => moveLine(i, 1)} disabled={i === f.lines.length - 1} style={s.iconBtn} aria-label="Descendre"><ArrowDown size={13} /></button>
                          <button onClick={() => removeLine(i)} style={s.iconBtn} aria-label="Supprimer la ligne"><Trash size={13} /></button>
                        </div>
                      </div>
                      <input className="input-field" style={{ ...s.input, fontSize: 13 }} value={l.detail ?? ''} onChange={e => setLine(i, { detail: e.target.value })} placeholder="Détail (facultatif)" aria-label="Détail" />
                      <div style={s.lineNums}>
                        <label style={s.mini}><span>Quantité</span>
                          <input className="input-field" style={s.input} type="number" step="0.5" min="0" value={l.qty} onChange={e => setLine(i, { qty: Number(e.target.value) })} />
                        </label>
                        <label style={s.mini}><span>Unité</span>
                          <select className="input-field" style={s.input} value={l.unit} onChange={e => setLine(i, { unit: e.target.value })}>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </label>
                        <label style={s.mini}><span>Prix unitaire{vatMode === 'tva' ? ' HT' : ''}</span>
                          <input className="input-field" style={s.input} type="number" step="0.01" value={l.unit_price || ''} onChange={e => setLine(i, { unit_price: Number(e.target.value) })} placeholder="0,00" />
                        </label>
                        <div style={{ ...s.mini, alignItems: 'flex-end' }}><span>Montant</span><strong style={s.lineTotal}>{eur(lineAmount(l))}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => addLine()} style={s.addLine}><Plus size={14} weight="bold" /> Ajouter une ligne</button>
                <div style={s.totals}>
                  {vatMode === 'tva' ? (
                    <>
                      <div style={s.totRow}><span>Total HT</span><span>{eur(totals.total_ht)}</span></div>
                      <div style={s.totRow}>
                        <span>TVA <select value={f.vat_rate} onChange={e => update({ vat_rate: Number(e.target.value) })} style={s.vatSel}><option value={20}>20 %</option><option value={10}>10 %</option><option value={5.5}>5,5 %</option></select></span>
                        <span>{eur(totals.total_tva)}</span>
                      </div>
                    </>
                  ) : <div style={s.totNote}>TVA non applicable (franchise en base)</div>}
                  <div style={s.totBig}><span>{vatMode === 'tva' ? 'Total TTC' : 'Total'}</span><span>{eur(totals.total_ttc)}</span></div>
                </div>
              </Card>

              <Card icon={<ChatText size={17} weight="bold" />} title="Message au client (facultatif)">
                <textarea className="input-field" style={{ ...s.input, resize: 'vertical' as const }} rows={3} value={f.notes} onChange={e => update({ notes: e.target.value })} placeholder="Ex. Merci pour ta confiance ! Acompte de 30 % à la signature, le solde le jour de la prestation." />
              </Card>

              <div style={s.actionBar}>
                {missingP.length > 0 && (
                  <button onClick={() => setShowSettings(true)} style={s.warnLink}><Gear size={14} weight="bold" /> Complète tes infos de facturation ({missingP.join(', ')})</button>
                )}
                <div style={s.actionRow}>
                  <button onClick={remove} style={s.dangerGhost}><Trash size={14} weight="bold" /> {id ? 'Supprimer' : 'Annuler'}</button>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
                    <button onClick={() => finalize(false)} disabled={pending} style={s.secondary}><Check size={15} weight="bold" /> Finaliser</button>
                    <button onClick={() => finalize(true)} disabled={pending} className="btn-primary"><PaperPlaneTilt size={15} weight="bold" /> Finaliser et envoyer</button>
                  </div>
                </div>
              </div>
            </>
          ) : doc && (
            <FollowUp
              doc={doc} st={st} label={label} pending={pending} copied={copied} publicUrl={publicUrl} paying={paying} paidAt={paidAt} paidMethod={paidMethod}
              setPaying={setPaying} setPaidAt={setPaidAt} setPaidMethod={setPaidMethod} copyLink={copyLink}
              onSend={(reminder) => act(() => sendDocument(kind, doc.id, reminder), reminder ? 'Relance envoyée.' : 'Document renvoyé par e-mail.')}
              onStatus={(status, okText) => act(() => setDocStatus(kind, doc.id, status, status === 'paye' ? { paidAt, paidMethod } : {}), okText)}
              onInvoice={() => go(() => createInvoiceFromQuote(kind, doc.id))}
              onDuplicate={() => go(() => duplicateDocument(kind, doc.id))}
              onCredit={creditNote}
              onDelete={remove}
            />
          )}
        </div>

        <div className="billing-preview" style={s.previewCol}>
          <div style={s.previewHead}>
            <span>Aperçu {isDraft ? 'en direct' : 'du document envoyé'}</span>
            {doc && !isDraft && <a href={`${publicUrl}?print=1`} target="_blank" rel="noopener noreferrer" style={s.previewLink}><DownloadSimple size={14} weight="bold" /> PDF</a>}
          </div>
          <div style={s.previewScroll}>
            <DocumentPaper doc={paperDoc} seller={doc?.seller && !isDraft ? doc.seller : profile} logoUrl={logoUrl} sourceNumber={sourceNumber} today={today} />
          </div>
        </div>
      </div>

      {showSettings && (
        <BillingSettings kind={kind} initial={profile} onClose={() => setShowSettings(false)} onSaved={p => { setProfile(p); setSaved(true); flash('ok', 'Infos de facturation enregistrées.') }} />
      )}

      <style>{`
        @media (min-width: 1100px) {
          .billing-editor { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); }
          .billing-viewtoggle { display: none !important; }
        }
        @media (max-width: 1099px) {
          .billing-editor[data-view=form] .billing-preview { display: none !important; }
          .billing-editor[data-view=preview] .billing-form { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function FollowUp({ doc, st, label, pending, copied, publicUrl, paying, paidAt, paidMethod, setPaying, setPaidAt, setPaidMethod, copyLink, onSend, onStatus, onInvoice, onDuplicate, onCredit, onDelete }: {
  doc: ProDocument; st: ReturnType<typeof displayStatus>; label: string; pending: boolean; copied: boolean; publicUrl: string
  paying: boolean; paidAt: string; paidMethod: string
  setPaying: (v: boolean) => void; setPaidAt: (v: string) => void; setPaidMethod: (v: string) => void
  copyLink: () => void
  onSend: (reminder: boolean) => void
  onStatus: (status: 'accepte' | 'refuse' | 'paye' | 'envoye', okText: string) => void
  onInvoice: () => void; onDuplicate: () => void; onCredit: () => void; onDelete: () => void
}) {
  const steps: Array<{ done: boolean; text: string }> = [
    { done: true, text: `${label} finalisé${doc.kind === 'devis' ? '' : 'e'} le ${frDate(doc.issue_date)}` },
    { done: !!doc.sent_at, text: doc.sent_at ? `Envoyé par e-mail le ${frDate(doc.sent_at.slice(0, 10))}` : 'Pas encore envoyé par e-mail' },
    ...(doc.reminded_at ? [{ done: true, text: `Relancé le ${frDate(doc.reminded_at.slice(0, 10))}` }] : []),
    ...(doc.kind === 'devis' ? [{ done: !!doc.accepted_at, text: doc.accepted_at ? `Accepté le ${frDate(doc.accepted_at.slice(0, 10))}${doc.accepted_name ? ` par ${doc.accepted_name}` : ''}` : st === 'refuse' ? 'Refusé' : `En attente de réponse, valable jusqu'au ${frDate(doc.valid_until)}` }] : []),
    ...(doc.kind === 'facture' ? [{ done: doc.status === 'paye', text: doc.status === 'paye' ? `Payée le ${frDate(doc.paid_at)}${doc.paid_method ? ` (${doc.paid_method.toLowerCase()})` : ''}` : doc.status === 'annule' ? 'Annulée par un avoir' : `À régler ${doc.due_date && doc.due_date > (doc.issue_date ?? '') ? `avant le ${frDate(doc.due_date)}` : 'à réception'}` }] : []),
  ]
  const canMail = !!doc.client_email
  return (
    <>
      <Card icon={<Clock size={17} weight="bold" />} title="Où en est-il ?">
        <ol style={s.timeline}>
          {steps.map((x, i) => (
            <li key={i} style={s.tlItem}>
              <span style={{ ...s.tlDot, ...(x.done ? s.tlDotOn : {}) }}>{x.done && <Check size={10} weight="bold" />}</span>
              <span style={{ color: x.done ? 'var(--text)' : 'var(--text-muted)' }}>{x.text}</span>
            </li>
          ))}
        </ol>
      </Card>

      {doc.kind === 'devis' && st !== 'accepte' && st !== 'refuse' && (
        <Card icon={<CheckCircle size={17} weight="bold" />} title="Réponse du client">
          <p style={s.muted}>Ton client peut accepter en ligne depuis le lien. S&apos;il t&apos;a répondu autrement, note-le ici.</p>
          <div style={s.btnRow}>
            <button disabled={pending} onClick={() => onStatus('accepte', 'Devis marqué accepté.')} className="btn-primary"><Check size={15} weight="bold" /> Marquer accepté</button>
            <button disabled={pending} onClick={() => onStatus('refuse', 'Devis marqué refusé.')} style={s.secondary}>Refusé</button>
          </div>
        </Card>
      )}
      {doc.kind === 'devis' && st === 'accepte' && (
        <Card icon={<Receipt size={17} weight="bold" />} title="Prestation faite ?">
          <p style={s.muted}>Transforme ce devis en facture : client, prestations et montants sont repris, tu n&apos;as plus qu&apos;à vérifier.</p>
          <div style={s.btnRow}><button disabled={pending} onClick={onInvoice} className="btn-primary"><Receipt size={15} weight="bold" /> Créer la facture</button></div>
        </Card>
      )}
      {doc.kind === 'facture' && doc.status !== 'paye' && doc.status !== 'annule' && (
        <Card icon={<CheckCircle size={17} weight="bold" />} title="Paiement">
          {!paying ? (
            <div style={s.btnRow}>
              <button disabled={pending} onClick={() => setPaying(true)} className="btn-primary"><Check size={15} weight="bold" /> Marquer payée</button>
              {canMail && <button disabled={pending} onClick={() => onSend(true)} style={s.secondary}><Bell size={15} weight="bold" /> {st === 'en_retard' ? 'Relancer (en retard)' : 'Envoyer un rappel'}</button>}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={s.mini}><span>Payée le</span><input className="input-field" style={s.input} type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} /></label>
              <label style={s.mini}><span>Moyen</span>
                <select className="input-field" style={s.input} value={paidMethod} onChange={e => setPaidMethod(e.target.value)}>{PAID_METHODS.map(m => <option key={m}>{m}</option>)}</select>
              </label>
              <button disabled={pending} onClick={() => { onStatus('paye', 'Facture marquée payée.'); setPaying(false) }} className="btn-primary"><Check size={15} weight="bold" /> Confirmer</button>
              <button onClick={() => setPaying(false)} style={s.dangerGhost}>Annuler</button>
            </div>
          )}
        </Card>
      )}

      <Card icon={<PaperPlaneTilt size={17} weight="bold" />} title="Partager">
        <div style={s.linkBox}>
          <input readOnly value={publicUrl} style={s.linkInput} onFocus={e => e.currentTarget.select()} aria-label="Lien du document" />
          <button onClick={copyLink} style={s.secondary}>{copied ? <><Check size={14} weight="bold" /> Copié</> : <><Copy size={14} weight="bold" /> Copier</>}</button>
        </div>
        <div style={s.btnRow}>
          <a href={`${publicUrl}?print=1`} target="_blank" rel="noopener noreferrer" style={s.secondaryLink}><DownloadSimple size={15} weight="bold" /> Télécharger le PDF</a>
          {canMail && <button disabled={pending} onClick={() => onSend(false)} style={s.secondary}><PaperPlaneTilt size={15} weight="bold" /> Renvoyer par e-mail</button>}
        </div>
        {!canMail && <p style={s.muted}>Pas d&apos;e-mail client enregistré : copie le lien et envoie-le par SMS ou WhatsApp.</p>}
      </Card>

      <div style={s.actionRow}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button disabled={pending} onClick={onDuplicate} style={s.ghost}><CopySimple size={14} weight="bold" /> Dupliquer</button>
          {doc.kind === 'facture' && doc.status === 'paye' && <button disabled={pending} onClick={() => onStatus('envoye', 'Facture remise à encaisser.')} style={s.ghost}>Pas encore payée</button>}
          {doc.kind === 'devis' && (st === 'accepte' || st === 'refuse') && <button disabled={pending} onClick={() => onStatus('envoye', 'Devis remis en attente.')} style={s.ghost}>Remettre en attente</button>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {doc.kind === 'facture' && doc.status !== 'annule' && <button disabled={pending} onClick={onCredit} style={s.dangerGhost}><ArrowCounterClockwise size={14} weight="bold" /> Annuler par un avoir</button>}
          {doc.kind === 'devis' && <button disabled={pending} onClick={onDelete} style={s.dangerGhost}><Trash size={14} weight="bold" /> Supprimer</button>}
        </div>
      </div>
    </>
  )
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section style={s.card}>
      <div style={s.cardTitle}><span style={s.cardIcon}>{icon}</span>{title}</div>
      {children}
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={s.field}>
      <span style={s.label}>{label}</span>
      {children}
      {hint && <span style={s.hint}>{hint}</span>}
    </label>
  )
}

function Chips({ items, onPick }: { items: Array<[number, string]>; onPick: (d: number) => void }) {
  return (
    <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
      {items.map(([d, l]) => <button type="button" key={l} onClick={() => onPick(d)} style={s.dateChip}>{l}</button>)}
    </span>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 'clamp(16px, 3vw, 36px)', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 },
  top: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none', width: '100%' },
  topMain: { display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 300px', minWidth: 0 },
  kindBadge: { width: 44, height: 44, borderRadius: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, #B7791F 12%, transparent)', color: '#B7791F', flexShrink: 0 },
  kindBadgeInv: { background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  h1: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px, 2.6vw, 28px)', fontWeight: 500, color: 'var(--text)', margin: 0, lineHeight: 1.15 },
  topSub: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 },
  saveState: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' },
  topClient: { fontSize: 13, color: 'var(--text-2)', fontWeight: 600 },
  viewToggle: { display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' },
  vt: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' },
  vtOn: { background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  msg: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, fontSize: 13.5, fontWeight: 600 },
  msgOk: { background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' },
  msgErr: { background: 'color-mix(in srgb, #B4462F 10%, var(--surface))', color: '#B4462F', border: '1px solid color-mix(in srgb, #B4462F 30%, transparent)' },
  msgClose: { background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2 },
  grid: { display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'start' },
  formCol: { display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 },
  previewCol: { position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, width: '100%' },
  previewHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  previewLink: { display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--accent-text)', textDecoration: 'none', textTransform: 'none', letterSpacing: 0, fontSize: 13 },
  previewScroll: { maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', padding: '6px 4px 18px', borderRadius: 16, background: 'color-mix(in srgb, var(--accent-text) 6%, var(--bg))' },
  kindSwitch: { display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', alignSelf: 'flex-start' },
  kindBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: 'none', background: 'transparent', fontSize: 13.5, fontWeight: 700, color: 'var(--text-2)', cursor: 'pointer' },
  kindBtnOn: { background: 'var(--accent-text)', color: 'var(--bg)' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 700, color: 'var(--text)' },
  cardIcon: { width: 30, height: 30, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 },
  label: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' },
  hint: { fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 },
  input: { width: '100%', fontSize: 14 },
  check: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' },
  dateChip: { padding: '3px 9px', borderRadius: 99, border: '1px solid var(--border)', background: 'transparent', fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' },
  sugg: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  suggLabel: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#B7791F', marginRight: 2 },
  suggChip: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 99, border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  lines: { display: 'flex', flexDirection: 'column', gap: 10 },
  lineCard: { display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' },
  lineTools: { display: 'flex', gap: 4, flexShrink: 0 },
  iconBtn: { width: 30, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' },
  lineNums: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 },
  mini: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', minWidth: 0 },
  lineTotal: { fontSize: 15, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', padding: '8px 0' },
  addLine: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, border: '1.5px dashed var(--accent-border)', background: 'transparent', color: 'var(--accent-text)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  totals: { display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 'auto', width: 'min(100%, 300px)' },
  totRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' },
  totNote: { fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' },
  totBig: { display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' },
  vatSel: { marginLeft: 6, fontSize: 12.5, padding: '2px 4px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' },
  actionBar: { position: 'sticky', bottom: 0, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 -8px 24px rgba(0,30,20,.06)' },
  actionRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  warnLink: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, fontSize: 12.5, fontWeight: 600, color: '#B7791F', cursor: 'pointer', textAlign: 'left' },
  secondary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'var(--surface)', color: 'var(--accent-text)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  secondaryLink: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'var(--surface)', color: 'var(--accent-text)', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' },
  ghost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  dangerGhost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', color: '#B4462F', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  muted: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 },
  linkBox: { display: 'flex', gap: 8 },
  linkInput: { flex: 1, minWidth: 0, fontSize: 12.5, padding: '9px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)' },
  timeline: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 },
  tlItem: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 },
  tlDot: { width: 18, height: 18, borderRadius: 99, border: '2px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tlDotOn: { background: 'var(--accent-text)', border: '2px solid var(--accent-text)', color: 'var(--bg)' },
}
