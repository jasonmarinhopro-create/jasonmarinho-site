'use client'

// Journal : chaque revenu et chaque charge, mois par mois, avec la saisie,
// l'import CSV (Airbnb, Booking) et l'export pour le comptable.
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Plus, Minus, UploadSimple, DownloadSimple, MagnifyingGlass, DotsThree, X, Warning,
} from '@phosphor-icons/react/dist/ssr'
import {
  createRevenusEntry, deleteRevenusEntry, cancelSejourRevenus, cancelContractRevenus,
  setEntryADeclarer, createCharge, updateCharge, deleteCharge,
} from '@/app/dashboard/revenus/actions'
import ImportCSVModal from '@/app/dashboard/revenus/ImportCSVModal'
import { CHARGE_CATEGORIES, chargeCategory } from '@/lib/finances/categories'
import { monthLabel } from '@/lib/finances/engine'
import { Card, COLORS, dateCourte, eur, eurPrecis, ui } from '../_ui/ui'
import { useConfirm } from '@/components/ui/ConfirmDialog'

export interface JournalRow {
  key: string
  type: 'revenu' | 'charge'
  kind: 'sejour' | 'contrat' | 'saisie' | 'charge'
  sourceId: string
  date: string
  label: string
  detail: string | null
  logementNom: string
  montant: number
  // revenus
  canal?: string
  commission?: number | null
  statut?: 'encaisse' | 'a_encaisser' | 'a_venir'
  horsRevenus?: boolean
  aDeclarer?: boolean
  voyageurId?: string | null
  // charges
  categorie?: string
  deductible?: boolean
  dureeAmortissement?: number | null
}

type Filter = 'tout' | 'revenus' | 'charges' | 'a_encaisser' | 'a_venir'
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'tout', label: 'Tout' },
  { key: 'revenus', label: 'Revenus' },
  { key: 'charges', label: 'Charges' },
  { key: 'a_encaisser', label: 'À encaisser' },
  { key: 'a_venir', label: 'Réservé' },
]
const PAGE = 50

interface Props {
  rows: JournalRow[]
  today: string
  logementNoms: string[]
  logements: Array<{ id: string; nom: string }>
  defaultLogement: string
  showLogement: boolean
  periodLabel: string
}

export default function JournalView({ rows, logementNoms, logements, defaultLogement, showLogement, periodLabel }: Props) {
  const [filter, setFilter] = useState<Filter>('tout')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const { confirm: ask, dialog } = useConfirm()
  const [menu, setMenu] = useState<string | null>(null)
  const [modal, setModal] = useState<null | { kind: 'revenu' } | { kind: 'charge'; row?: JournalRow } | { kind: 'import' }>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter(r => {
      if (hidden.has(r.key)) return false
      // Les séjours pas encore arrivés ont leur filtre « Réservé » : sans ça, ils
      // passaient en tête du journal (dates futures) et cachaient le passé
      if (filter !== 'a_venir' && r.statut === 'a_venir') return false
      if (filter === 'revenus' && r.type !== 'revenu') return false
      if (filter === 'charges' && r.type !== 'charge') return false
      if (filter === 'a_encaisser' && r.statut !== 'a_encaisser') return false
      if (filter === 'a_venir' && r.statut !== 'a_venir') return false
      if (!needle) return true
      const cat = r.categorie ? chargeCategory(r.categorie).label : ''
      return `${r.label} ${r.detail ?? ''} ${r.logementNom} ${r.canal ?? ''} ${cat}`.toLowerCase().includes(needle)
    })
  }, [rows, filter, q, hidden])

  const counts = useMemo(() => ({
    aVenir: rows.filter(r => r.statut === 'a_venir' && !hidden.has(r.key)).length,
    aEncaisser: rows.filter(r => r.statut === 'a_encaisser' && !hidden.has(r.key)).length,
  }), [rows, hidden])

  const shown = filtered.slice(0, limit)
  const groups = useMemo(() => {
    const map = new Map<string, JournalRow[]>()
    for (const r of shown) {
      const k = r.date.slice(0, 7)
      map.set(k, [...(map.get(k) ?? []), r])
    }
    return [...map.entries()]
  }, [shown])

  // Sous-totaux par mois sur toutes les lignes filtrées (pas seulement affichées)
  const monthTotals = useMemo(() => {
    const m = new Map<string, { rev: number; ch: number }>()
    for (const r of filtered) {
      const k = r.date.slice(0, 7)
      const t = m.get(k) ?? { rev: 0, ch: 0 }
      if (r.type === 'revenu' && !r.horsRevenus) t.rev += r.montant
      if (r.type === 'charge') t.ch += r.montant
      m.set(k, t)
    }
    return m
  }, [filtered])

  function run(key: string, fn: () => Promise<{ error?: string } | undefined | void>, hide = true) {
    setMenu(null)
    setError(null)
    if (hide) setHidden(h => new Set(h).add(key))
    start(async () => {
      const res = await fn()
      if (res && 'error' in res && res.error) {
        setError(res.error)
        if (hide) setHidden(h => { const n = new Set(h); n.delete(key); return n })
      }
    })
  }

  function exportCsv() {
    const head = ['Date', 'Type', 'Logement', 'Libellé', 'Canal ou catégorie', 'Montant', 'Commission', 'Statut', 'À déclarer']
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const lines = filtered.map(r => [
      r.date,
      r.type === 'charge' ? 'Charge' : r.horsRevenus ? 'Caution' : 'Revenu',
      r.logementNom,
      r.type === 'charge' ? (r.label || chargeCategory(r.categorie).label) : r.label,
      r.type === 'charge' ? chargeCategory(r.categorie).label : (r.canal ?? ''),
      (r.type === 'charge' ? -r.montant : r.montant).toFixed(2).replace('.', ','),
      r.commission != null ? r.commission.toFixed(2).replace('.', ',') : '',
      r.statut === 'a_venir' ? 'Réservé' : r.statut === 'a_encaisser' ? 'À encaisser' : r.type === 'revenu' ? 'Encaissé' : '',
      r.type === 'revenu' ? (r.aDeclarer === false ? 'non' : 'oui') : (r.deductible === false ? 'non déductible' : 'déductible'),
    ].map(v => esc(String(v))).join(';'))
    const blob = new Blob([`﻿${[head.join(';'), ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `journal-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {dialog}
      <Card style={{ padding: 0 }}>
        <div style={s.toolbar}>
          <div style={s.filters} role="tablist" aria-label="Filtrer le journal">
            {FILTERS.map(f => {
              const count = f.key === 'a_venir' ? counts.aVenir : f.key === 'a_encaisser' ? counts.aEncaisser : 0
              if ((f.key === 'a_venir' || f.key === 'a_encaisser') && count === 0 && filter !== f.key) return null
              return (
                <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} onClick={() => { setFilter(f.key); setLimit(PAGE) }}
                  style={{ ...s.filter, ...(filter === f.key ? s.filterActive : {}) }}>
                  {f.label}{count > 0 ? ` (${count})` : ''}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={ui.btn} onClick={() => setModal({ kind: 'revenu' })}><Plus size={14} weight="bold" /> Revenu</button>
            <button type="button" style={{ ...ui.btn, background: 'var(--surface)', color: COLORS.charges, border: '1px solid var(--border)' }} onClick={() => setModal({ kind: 'charge' })}><Minus size={14} weight="bold" /> Charge</button>
            <button type="button" style={ui.btnGhost} onClick={() => setModal({ kind: 'import' })}><UploadSimple size={14} /> Importer</button>
            <button type="button" style={ui.btnGhost} onClick={exportCsv} disabled={filtered.length === 0}><DownloadSimple size={14} /> Exporter</button>
          </div>
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <label style={s.search}>
            <MagnifyingGlass size={15} color="var(--text-3)" />
            <input value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE) }} placeholder="Chercher un voyageur, une catégorie, un logement…" style={s.searchInput} aria-label="Chercher dans le journal" />
          </label>
        </div>

        {error && <div style={{ margin: '0 16px 12px', fontSize: 13, color: COLORS.charges }}><Warning size={14} weight="fill" /> {error}</div>}

        {filtered.length === 0 ? (
          <p style={{ padding: '8px 16px 24px', margin: 0, fontSize: 13.5, color: 'var(--text-3)' }}>
            Rien {periodLabel}{filter !== 'tout' || q ? ' avec ces filtres' : ''}.
          </p>
        ) : (
          <div>
            {groups.map(([ym, list]) => {
              const t = monthTotals.get(ym)
              return (
                <div key={ym}>
                  <div style={s.monthHead}>
                    <span style={{ textTransform: 'capitalize' }}>{monthLabel(ym)}</span>
                    <span style={{ fontWeight: 500 }}>
                      {t && t.rev > 0 && <span style={{ color: COLORS.revenus }}>+ {eur(t.rev)}</span>}
                      {t && t.rev > 0 && t.ch > 0 && ' · '}
                      {t && t.ch > 0 && <span style={{ color: COLORS.charges }}>− {eur(t.ch)}</span>}
                    </span>
                  </div>
                  {list.map(r => (
                    <Row key={r.key} r={r} showLogement={showLogement} menuOpen={menu === r.key}
                      onMenu={() => setMenu(menu === r.key ? null : r.key)}
                      onAction={async (action) => {
                        if (action === 'delete-entry') run(r.key, () => deleteRevenusEntry(r.sourceId))
                        else if (action === 'cancel-sejour') { if (await ask({ message: "Annuler ce séjour ? Il disparaît des revenus, du calendrier et du planning ménage. Tu peux le restaurer depuis la fiche voyageur.", confirmLabel: 'Annuler le séjour', cancelLabel: 'Garder', danger: true })) run(r.key, () => cancelSejourRevenus(r.sourceId)); else setMenu(null) }
                        else if (action === 'cancel-contract') { if (await ask({ message: 'Annuler ce contrat ? Il pourra être réactivé depuis Contrats & paiements.', confirmLabel: 'Annuler le contrat', cancelLabel: 'Garder', danger: true })) run(r.key, () => cancelContractRevenus(r.sourceId)); else setMenu(null) }
                        else if (action === 'toggle-declarer') run(r.key, () => setEntryADeclarer(r.sourceId, r.kind === 'sejour' ? 'sejour' : 'entry', r.aDeclarer === false), false)
                        else if (action === 'edit-charge') { setMenu(null); setModal({ kind: 'charge', row: r }) }
                        else if (action === 'delete-charge') { if (await ask({ message: 'Supprimer cette charge ?', confirmLabel: 'Supprimer', danger: true })) run(r.key, () => deleteCharge(r.sourceId)); else setMenu(null) }
                      }}
                    />
                  ))}
                </div>
              )
            })}
            {filtered.length > limit && (
              <div style={{ padding: 16, textAlign: 'center' }}>
                <button type="button" style={ui.btnGhost} onClick={() => setLimit(l => l + PAGE)}>
                  Afficher {Math.min(PAGE, filtered.length - limit)} de plus ({filtered.length - limit} restantes)
                </button>
              </div>
            )}
          </div>
        )}
        {pending && <div style={{ padding: '0 16px 12px', fontSize: 12.5, color: 'var(--text-3)' }}>Enregistrement…</div>}
      </Card>

      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Les séjours et les contrats signés arrivent ici tout seuls (Mes réservations, Contrats & paiements). Saisis à la main ce qui n&apos;y est pas : un virement, une taxe, une facture de ménage.
        Une réservation se crée plutôt dans <Link href="/dashboard/reservations" style={ui.link}>Mes réservations</Link> : elle compte aussi dans l&apos;occupation.
      </p>

      {modal?.kind === 'revenu' && (
        <RevenuModal logementNoms={logementNoms} defaultLogement={defaultLogement} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'charge' && (
        <ChargeModal logementNoms={logementNoms} logements={logements} defaultLogement={defaultLogement} row={modal.row} onClose={() => setModal(null)} />
      )}
      <ImportCSVModal open={modal?.kind === 'import'} onClose={() => setModal(null)} onImported={() => setModal(null)} />
    </>
  )
}

function Row({ r, showLogement, menuOpen, onMenu, onAction }: {
  r: JournalRow; showLogement: boolean; menuOpen: boolean; onMenu: () => void; onAction: (a: string) => void
}) {
  const isCharge = r.type === 'charge'
  const cat = isCharge ? chargeCategory(r.categorie) : null
  const title = isCharge ? cat!.label : r.label
  const sub = [
    showLogement && r.logementNom ? r.logementNom : null,
    isCharge ? (r.label || null) : r.canal,
    r.detail,
  ].filter(Boolean).join(' · ')

  const actions: Array<{ key: string; label: string; danger?: boolean }> = []
  if (r.kind === 'saisie') actions.push({ key: 'toggle-declarer', label: r.aDeclarer === false ? 'Compter dans la fiscalité' : 'Ne pas compter dans la fiscalité' }, { key: 'delete-entry', label: 'Supprimer', danger: true })
  if (r.kind === 'sejour') actions.push({ key: 'toggle-declarer', label: r.aDeclarer === false ? 'Compter dans la fiscalité' : 'Ne pas compter dans la fiscalité' }, { key: 'cancel-sejour', label: 'Annuler le séjour', danger: true })
  if (r.kind === 'contrat') actions.push({ key: 'cancel-contract', label: 'Annuler le contrat', danger: true })
  if (isCharge) actions.push({ key: 'edit-charge', label: 'Modifier' }, { key: 'delete-charge', label: 'Supprimer', danger: true })

  return (
    <div style={s.row}>
      <div style={s.date}>{dateCourte(r.date)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.title}>
          {isCharge && <i style={{ ...s.dot, background: cat!.color }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          {r.statut === 'a_venir' && <span style={{ ...s.badge, background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>Réservé</span>}
          {r.statut === 'a_encaisser' && <span style={{ ...s.badge, background: 'rgba(255,213,107,0.2)', color: COLORS.commissions }}>À encaisser</span>}
          {r.aDeclarer === false && <span style={{ ...s.badge, background: 'var(--bg-2)', color: 'var(--text-3)' }}>Hors fiscalité</span>}
        </div>
        {sub && <div style={s.sub}>{sub}</div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', color: isCharge ? COLORS.charges : r.horsRevenus ? 'var(--text-3)' : 'var(--text)' }}>
          {isCharge ? '− ' : r.horsRevenus ? '' : '+ '}{eurPrecis(r.montant)}
        </div>
        {!isCharge && r.commission != null && r.commission > 0 && <div style={{ fontSize: 11.5, color: COLORS.commissions }}>− {eurPrecis(r.commission)} commission</div>}
        {!isCharge && r.commission == null && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>commission ?</div>}
        {r.horsRevenus && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>caution, hors revenus</div>}
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {actions.length > 0 && (
          <button type="button" onClick={onMenu} style={s.more} aria-label="Actions" aria-expanded={menuOpen}>
            <DotsThree size={18} weight="bold" />
          </button>
        )}
        {menuOpen && (
          <div style={s.menu} role="menu">
            {r.voyageurId && <Link href={`/dashboard/voyageurs/${r.voyageurId}`} style={s.menuItem} role="menuitem">Fiche voyageur</Link>}
            {r.kind === 'contrat' && <Link href="/dashboard/contrats" style={s.menuItem} role="menuitem">Contrats & paiements</Link>}
            {actions.map(a => (
              <button key={a.key} type="button" role="menuitem" onClick={() => onAction(a.key)} style={{ ...s.menuItem, color: a.danger ? COLORS.charges : 'var(--text-2)' }}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Saisie ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={s.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ ...ui.cardTitle, fontSize: 19 }}>{title}</h2>
          <button type="button" onClick={onClose} style={s.more} aria-label="Fermer"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>
      {label}
      {children}
      {hint && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>{hint}</span>}
    </label>
  )
}

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())
}

function RevenuModal({ logementNoms, defaultLogement, onClose }: { logementNoms: string[]; defaultLogement: string; onClose: () => void }) {
  const [logement, setLogement] = useState(defaultLogement)
  const [montant, setMontant] = useState('')
  const [date, setDate] = useState(today())
  const [type, setType] = useState('loyer')
  const [mode, setMode] = useState('virement')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function save() {
    const m = Number(montant.replace(',', '.'))
    if (!logement.trim() || !(m > 0) || !date) { setError('Logement, montant et date sont obligatoires.'); return }
    start(async () => {
      const res = await createRevenusEntry({ logement_nom: logement.trim(), montant: m, date_paiement: date, type_paiement: type, mode_paiement: mode, description: description.trim() || null })
      if (res?.error) setError(res.error)
      else onClose()
    })
  }

  return (
    <Modal title="Saisir un revenu" onClose={onClose}>
      <div style={s.form}>
        <Field label="Logement">
          <input list="fin-logements" value={logement} onChange={e => setLogement(e.target.value)} style={s.input} />
        </Field>
        <div style={s.formRow}>
          <Field label="Montant reçu (€)"><input inputMode="decimal" value={montant} onChange={e => setMontant(e.target.value)} style={s.input} /></Field>
          <Field label="Date du paiement"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
        </div>
        <div style={s.formRow}>
          <Field label="Type">
            <select value={type} onChange={e => setType(e.target.value)} style={s.input}>
              <option value="loyer">Loyer</option>
              <option value="frais_menage">Frais de ménage</option>
              <option value="caution">Caution (hors revenus)</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="Moyen de paiement">
            <select value={mode} onChange={e => setMode(e.target.value)} style={s.input}>
              <option value="virement">Virement</option>
              <option value="especes">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
        </div>
        <Field label="Description (facultatif)"><input value={description} onChange={e => setDescription(e.target.value)} placeholder="ex. Réservation directe famille Martin" style={s.input} /></Field>
        {error && <p style={{ margin: 0, fontSize: 12.5, color: COLORS.charges }}>{error}</p>}
        <button type="button" onClick={save} disabled={pending} style={{ ...ui.btn, justifyContent: 'center' }}>{pending ? 'Enregistrement…' : 'Enregistrer le revenu'}</button>
      </div>
      <datalist id="fin-logements">{logementNoms.map(n => <option key={n} value={n} />)}</datalist>
    </Modal>
  )
}

function ChargeModal({ logementNoms, logements, defaultLogement, row, onClose }: {
  logementNoms: string[]; logements: Array<{ id: string; nom: string }>; defaultLogement: string; row?: JournalRow; onClose: () => void
}) {
  const [logement, setLogement] = useState(row?.logementNom ?? defaultLogement)
  const [montant, setMontant] = useState(row ? String(row.montant).replace('.', ',') : '')
  const [date, setDate] = useState(row?.date ?? today())
  const [categorie, setCategorie] = useState(row?.categorie ?? 'menage')
  const [description, setDescription] = useState(row?.label ?? '')
  const [deductible, setDeductible] = useState(row?.deductible ?? true)
  const [duree, setDuree] = useState(row?.dureeAmortissement ? String(row.dureeAmortissement) : '')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const amort = categorie === 'amortissement'

  function save() {
    const m = Number(montant.replace(',', '.'))
    const d = Number(duree)
    if (!logement.trim() || !(m > 0) || !date) { setError('Logement, montant et date sont obligatoires.'); return }
    if (amort && !(d >= 1 && d <= 50)) { setError("Indique sur combien d'années l'amortir (entre 1 et 50)."); return }
    const input = {
      logement_nom: logement.trim(),
      logement_id: logements.find(l => l.nom.trim().toLowerCase() === logement.trim().toLowerCase())?.id ?? null,
      montant: m, date_charge: date, categorie, description: description.trim() || null, deductible,
      duree_amortissement_annees: amort ? d : null,
    }
    start(async () => {
      const res = row ? await updateCharge(row.sourceId, input) : await createCharge(input)
      if (res?.error) setError(res.error)
      else onClose()
    })
  }

  return (
    <Modal title={row ? 'Modifier la charge' : 'Saisir une charge'} onClose={onClose}>
      <div style={s.form}>
        <Field label="Logement">
          <input list="fin-logements-c" value={logement} onChange={e => setLogement(e.target.value)} style={s.input} />
        </Field>
        <div style={s.formRow}>
          <Field label="Montant (€)"><input inputMode="decimal" value={montant} onChange={e => setMontant(e.target.value)} style={s.input} /></Field>
          <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
        </div>
        <Field label="Catégorie">
          <select value={categorie} onChange={e => setCategorie(e.target.value)} style={s.input}>
            {CHARGE_CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </Field>
        {amort && (
          <Field label="Amorti sur (années)" hint="Achat du bien hors terrain : 25 à 30 ans. Mobilier : 5 à 10 ans. Gros travaux : 10 à 15 ans. Sert à comparer le micro-BIC et le régime réel dans l'onglet Fiscalité.">
            <input inputMode="numeric" value={duree} onChange={e => setDuree(e.target.value)} style={s.input} />
          </Field>
        )}
        <Field label="Description (facultatif)"><input value={description} onChange={e => setDescription(e.target.value)} style={s.input} /></Field>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-2)' }}>
          <input type="checkbox" checked={deductible} onChange={e => setDeductible(e.target.checked)} /> Déductible au régime réel
        </label>
        {error && <p style={{ margin: 0, fontSize: 12.5, color: COLORS.charges }}>{error}</p>}
        <button type="button" onClick={save} disabled={pending} style={{ ...ui.btn, justifyContent: 'center' }}>{pending ? 'Enregistrement…' : row ? 'Enregistrer' : 'Enregistrer la charge'}</button>
      </div>
      <datalist id="fin-logements-c">{logementNoms.map(n => <option key={n} value={n} />)}</datalist>
    </Modal>
  )
}

const s: Record<string, React.CSSProperties> = {
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: 16 },
  filters: { display: 'flex', gap: 4, overflowX: 'auto', maxWidth: '100%' },
  filter: { padding: '6px 12px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  filterActive: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontWeight: 600 },
  search: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)' },
  searchInput: { flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontSize: 13.5, fontFamily: 'inherit', minWidth: 0 },
  monthHead: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '10px 16px', background: 'var(--bg-2)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border)' },
  date: { width: 52, flexShrink: 0, fontSize: 12.5, color: 'var(--text-3)' },
  title: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text)', minWidth: 0 },
  sub: { fontSize: 12, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dot: { width: 8, height: 8, borderRadius: 999, flexShrink: 0, display: 'inline-block' },
  badge: { fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 },
  more: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' },
  menu: { position: 'absolute', right: 0, top: 34, zIndex: 20, minWidth: 220, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 6, display: 'flex', flexDirection: 'column' },
  menuItem: { textAlign: 'left', padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' },
  overlay: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-xl)' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  input: { padding: '9px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', fontWeight: 400, width: '100%', boxSizing: 'border-box' },
}
