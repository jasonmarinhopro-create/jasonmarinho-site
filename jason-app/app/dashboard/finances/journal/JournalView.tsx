'use client'

// Journal : chaque revenu et chaque charge, mois par mois, avec la saisie,
// l'import CSV (Airbnb, Booking) et l'export pour le comptable.
import { CalendarInput } from '@/components/ui/CalendarInput'
import SuggestInput from '@/components/ui/SuggestInput'
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Plus, Minus, UploadSimple, DownloadSimple, MagnifyingGlass, DotsThree, X, Warning,
  Broom, Lightning, Percent, House, Receipt, ShieldCheck, HandCoins, Hammer, Couch, ArrowsClockwise,
  Calculator, Bank, Buildings, DotsThreeCircle, Repeat, CalendarCheck, Info, Check,
} from '@phosphor-icons/react/dist/ssr'
import {
  createRevenusEntry, deleteRevenusEntry, cancelSejourRevenus, cancelContractRevenus,
  setEntryADeclarer, createCharge, updateCharge, deleteCharge,
} from '@/app/dashboard/revenus/actions'
import ImportCSVModal from '@/app/dashboard/revenus/ImportCSVModal'
import { CHARGE_CATEGORIES, chargeCategory } from '@/lib/finances/categories'
import { monthLabel, buildChargeLines, echeances, type Frequence } from '@/lib/finances/engine'
import { dotationAnnuelle } from '@/lib/finances/fiscal'
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
  frequence?: Frequence | null
  /** Échéance future d'une charge récurrente */
  prevue?: boolean
  /** Première et dernière échéance de la série */
  debut?: string
  dateFin?: string | null
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
                        else if (action === 'delete-charge') { if (await ask({ message: r.frequence ? 'Supprimer cette charge récurrente ? Toutes ses échéances, passées et à venir, disparaissent du journal. Pour garder les échéances déjà payées, choisis plutôt « Arrêter à partir d’aujourd’hui ».' : 'Supprimer cette charge ?', confirmLabel: r.frequence ? 'Supprimer la série' : 'Supprimer', danger: true })) run(r.key, () => deleteCharge(r.sourceId)); else setMenu(null) }
                        else if (action === 'stop-charge') { if (await ask({ message: 'Arrêter cette charge récurrente ? Les échéances déjà passées restent dans le journal, les suivantes disparaissent.', confirmLabel: 'Arrêter', cancelLabel: 'Garder' })) run(r.key, () => updateCharge(r.sourceId, { frequence: r.frequence, date_fin: today() }), false); else setMenu(null) }
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
      <ImportCSVModal open={modal?.kind === 'import'} onClose={() => setModal(null)} onImported={() => {}} logements={logements} />
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
  if (isCharge && r.frequence) actions.push({ key: 'edit-charge', label: 'Modifier la série' }, ...(r.dateFin && r.dateFin <= today() ? [] : [{ key: 'stop-charge', label: "Arrêter à partir d'aujourd'hui" }]), { key: 'delete-charge', label: 'Supprimer toute la série', danger: true })
  else if (isCharge) actions.push({ key: 'edit-charge', label: 'Modifier' }, { key: 'delete-charge', label: 'Supprimer', danger: true })

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
          {isCharge && r.frequence && <Repeat size={13} weight="bold" style={{ color: 'var(--text-3)', flexShrink: 0 }} aria-label="Charge récurrente" />}
          {r.prevue && <span style={{ ...s.badge, background: 'var(--bg-2)', color: 'var(--text-3)', border: '1px dashed var(--border-2)' }}>Prévue</span>}
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

function Modal({ title, onClose, children, width }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div style={s.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div style={{ ...s.modal, ...(width ? { maxWidth: width } : null) }} onClick={e => e.stopPropagation()}>
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
    const m = Number(montant.replace(/\s/g, '').replace(',', '.'))
    if (!(m > 0)) { setError('Indique le montant reçu.'); return }
    if (!logement.trim()) { setError('Indique le logement concerné.'); return }
    if (!date) { setError('Indique la date du paiement.'); return }
    start(async () => {
      const res = await createRevenusEntry({ logement_nom: logement.trim(), montant: m, date_paiement: date, type_paiement: type, mode_paiement: mode, description: description.trim() || null })
      if (res?.error) setError(res.error)
      else onClose()
    })
  }

  const TYPES = [
    { key: 'loyer', label: 'Loyer', Icon: House },
    { key: 'frais_menage', label: 'Frais de ménage', Icon: Broom },
    { key: 'caution', label: 'Caution', Icon: ShieldCheck },
    { key: 'autre', label: 'Autre', Icon: DotsThreeCircle },
  ]
  const MODES = [
    { key: 'virement', label: 'Virement' },
    { key: 'especes', label: 'Espèces' },
    { key: 'cheque', label: 'Chèque' },
    { key: 'autre', label: 'Autre' },
  ]

  return (
    <Modal title="Nouveau revenu" onClose={onClose} width={500}>
      <div style={s.form}>
        <div style={cm.amountBox} className="amount-box">
          <span style={cm.amountLabel}>Montant reçu</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <input inputMode="decimal" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0" aria-label="Montant reçu en euros" className="amount-input no-ring" style={cm.amountInput} autoFocus />
            <span style={cm.amountEuro}>€</span>
          </div>
        </div>
        <div style={cm.block}>
          <span style={cm.label}>Type</span>
          <div style={cm.cats} className="grid-4" role="radiogroup" aria-label="Type">
            {TYPES.map(t => {
              const on = type === t.key
              return (
                <button key={t.key} type="button" role="radio" aria-checked={on} onClick={() => setType(t.key)}
                  style={{ ...cm.cat, ...(on ? { border: '1.5px solid var(--accent-border-2)', background: 'var(--accent-bg)', color: 'var(--text)' } : null) }}>
                  <span style={{ ...cm.catIcon, background: on ? 'var(--accent-text)' : 'var(--accent-bg)', color: on ? 'var(--bg)' : 'var(--accent-text)' }}><t.Icon size={15} weight={on ? 'fill' : 'regular'} /></span>
                  {t.label}
                </button>
              )
            })}
          </div>
          {type === 'caution' && <p style={cm.hint}><Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />Une caution n'est jamais un revenu : elle apparaît dans le journal sans compter dans ton chiffre d'affaires ni dans la fiscalité.</p>}
        </div>
        <div style={s.formRow}>
          <Field label="Date du paiement"><CalendarInput value={date} onChange={setDate} ariaLabel="Date du paiement" /></Field>
          <Field label="Logement">
            <SuggestInput value={logement} onChange={setLogement} options={logementNoms} ariaLabel="Logement" style={s.input} />
          </Field>
        </div>
        <div style={cm.block}>
          <span style={cm.label}>Reçu par</span>
          <div style={cm.segment} className="grid-4" role="radiogroup" aria-label="Moyen de paiement">
            {MODES.map(x => (
              <button key={x.key} type="button" role="radio" aria-checked={mode === x.key} onClick={() => setMode(x.key)} style={{ ...cm.segBtn, ...(mode === x.key ? cm.segOn : null) }}>{x.label}</button>
            ))}
          </div>
        </div>
        <Field label="Note (facultatif)"><input value={description} onChange={e => setDescription(e.target.value)} placeholder="ex. Réservation directe famille Martin" style={s.input} /></Field>
        {error && <p style={{ margin: 0, fontSize: 12.5, color: COLORS.charges, display: 'flex', gap: 6, alignItems: 'center' }}><Warning size={14} weight="fill" />{error}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap-reverse' }}>
          <button type="button" onClick={onClose} style={{ ...ui.btn, flex: '1 1 120px', justifyContent: 'center', background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>Annuler</button>
          <button type="button" onClick={save} disabled={pending} style={{ ...ui.btn, flex: '2 1 180px', justifyContent: 'center', opacity: pending ? 0.7 : 1 }}>
            <Check size={15} weight="bold" />{pending ? 'Enregistrement…' : 'Ajouter le revenu'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

const CAT_ICON: Record<string, typeof Broom> = {
  menage: Broom, energie: Lightning, commissions_plateforme: Percent, taxe_fonciere: House, taxe_sejour: Receipt,
  assurance: ShieldCheck, credit: HandCoins, travaux: Hammer, equipement: Couch, abonnement: ArrowsClockwise,
  comptabilite: Calculator, banque: Bank, amortissement: Buildings, autre: DotsThreeCircle,
}

const FREQS: Array<{ key: '' | Frequence; label: string; short: string }> = [
  { key: '', label: 'Une fois', short: '' },
  { key: 'mensuelle', label: 'Chaque mois', short: 'par mois' },
  { key: 'trimestrielle', label: 'Chaque trimestre', short: 'par trimestre' },
  { key: 'annuelle', label: 'Chaque année', short: 'par an' },
]

/** Catégories qui se répètent d'habitude : la fréquence est proposée d'office */
const FREQ_SUGGEREE: Record<string, Frequence> = { assurance: 'mensuelle', credit: 'mensuelle', abonnement: 'mensuelle', energie: 'mensuelle', banque: 'mensuelle', taxe_fonciere: 'annuelle', comptabilite: 'annuelle' }

const DUREES = [
  { ans: 7, label: 'Mobilier' },
  { ans: 10, label: 'Travaux' },
  { ans: 15, label: 'Gros travaux' },
  { ans: 25, label: 'Achat du bien' },
]

const CAT_HINT: Record<string, string> = {
  credit: "Seuls les intérêts et l'assurance de l'emprunt se déduisent au régime réel, pas le capital remboursé : indique ici la part d'intérêts et d'assurance de ta mensualité.",
  taxe_fonciere: "Saisis-la une fois avec « Chaque année » : elle revient toute seule chaque automne.",
  travaux: "Petites réparations et entretien. Pour de gros travaux qui durent des années, choisis plutôt « Investissement amorti ».",
}

function dateLongue(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
}

function ChargeModal({ logementNoms, logements, defaultLogement, row, onClose }: {
  logementNoms: string[]; logements: Array<{ id: string; nom: string }>; defaultLogement: string; row?: JournalRow; onClose: () => void
}) {
  const [logement, setLogement] = useState(row?.logementNom ?? defaultLogement)
  const [montant, setMontant] = useState(row ? String(row.montant).replace('.', ',') : '')
  const [date, setDate] = useState(row?.debut ?? row?.date ?? today())
  const [categorie, setCategorie] = useState(row?.categorie ?? '')
  const [description, setDescription] = useState(row?.label ?? '')
  const [deductible, setDeductible] = useState(row?.deductible ?? true)
  const [duree, setDuree] = useState(row?.dureeAmortissement ? String(row.dureeAmortissement) : '')
  const [frequence, setFrequence] = useState<'' | Frequence>(row?.frequence ?? '')
  const [freqTouched, setFreqTouched] = useState(!!row)
  const [dateFin, setDateFin] = useState(row?.dateFin ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const amort = categorie === 'amortissement'
  const m = Number(montant.replace(/\s/g, '').replace(',', '.'))
  const d = Number(duree)
  const freq = amort ? '' : frequence

  function pickCategorie(slug: string) {
    setCategorie(slug)
    setError(null)
    if (!freqTouched) setFrequence(FREQ_SUGGEREE[slug] ?? '')
  }

  // Aperçu : combien la charge pèse d'ici la fin de l'année, ou la dotation annuelle d'un investissement
  const apercu = useMemo(() => {
    if (!(m > 0) || !date) return null
    if (amort) {
      if (!(d >= 1 && d <= 50)) return null
      const line = buildChargeLines([{ id: 'apercu', logement_nom: '', montant: m, date_charge: date, categorie: 'amortissement', duree_amortissement_annees: d }])[0]
      const an = Number(date.slice(0, 4))
      const premiere = dotationAnnuelle(line, an)
      return { amort: true as const, annuite: m / d, premiere, an }
    }
    if (!freq) return null
    const fin = `${today().slice(0, 4)}-12-31`
    const dates = echeances(date, freq, fin, dateFin || null)
    const futures = dates.filter(x => x > today()).length
    return { amort: false as const, n: dates.length, total: dates.length * m, futures, fin: fin.slice(0, 4) }
  }, [m, d, date, amort, freq, dateFin])

  function save() {
    if (!categorie) { setError('Choisis une catégorie.'); return }
    if (!(m > 0)) { setError('Indique un montant.'); return }
    if (!logement.trim()) { setError('Indique le logement concerné.'); return }
    if (!date) { setError('Indique une date.'); return }
    if (amort && !(d >= 1 && d <= 50)) { setError("Indique sur combien d'années l'amortir (entre 1 et 50)."); return }
    if (freq && dateFin && dateFin < date) { setError('La dernière échéance doit venir après la première.'); return }
    const input = {
      logement_nom: logement.trim(),
      logement_id: logements.find(l => l.nom.trim().toLowerCase() === logement.trim().toLowerCase())?.id ?? null,
      montant: m, date_charge: date, categorie, description: description.trim() || null, deductible,
      duree_amortissement_annees: amort ? d : null,
      frequence: freq || null,
      date_fin: freq ? (dateFin || null) : null,
    }
    start(async () => {
      const res = row ? await updateCharge(row.sourceId, input) : await createCharge(input)
      if (res?.error) setError(res.error)
      else onClose()
    })
  }

  const dateLabel = amort ? 'Mise en service' : freq ? 'Première échéance' : 'Date'
  const freqLabel = FREQS.find(f => f.key === freq)

  return (
    <Modal title={row ? (row.frequence ? 'Modifier la charge récurrente' : 'Modifier la charge') : 'Nouvelle charge'} onClose={onClose} width={540}>
      <div style={s.form}>
        {/* Montant */}
        <div style={cm.amountBox} className="amount-box">
          <span style={cm.amountLabel}>{amort ? 'Montant total payé' : 'Montant'}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <input
              inputMode="decimal" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0" aria-label="Montant en euros"
              className="amount-input no-ring" style={cm.amountInput} autoFocus={!row}
            />
            <span style={cm.amountEuro}>€</span>
            {freqLabel?.short && <span style={{ fontSize: 14, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{freqLabel.short}</span>}
          </div>
        </div>

        {/* Catégorie */}
        <div style={cm.block}>
          <span style={cm.label}>Catégorie</span>
          <div style={cm.cats} role="radiogroup" aria-label="Catégorie">
            {CHARGE_CATEGORIES.filter(c => c.slug !== 'commissions_plateforme' || categorie === 'commissions_plateforme').map(c => {
              const Icon = CAT_ICON[c.slug] ?? DotsThreeCircle
              const on = categorie === c.slug
              return (
                <button
                  key={c.slug} type="button" role="radio" aria-checked={on} onClick={() => pickCategorie(c.slug)}
                  style={{ ...cm.cat, ...(on ? { border: `1.5px solid ${c.color}`, background: `${c.color}1A`, color: 'var(--text)' } : null) }}
                >
                  <span style={{ ...cm.catIcon, background: on ? c.color : `${c.color}1F`, color: on ? '#fff' : c.color }}><Icon size={15} weight={on ? 'fill' : 'regular'} /></span>
                  <span>{c.label}</span>
                </button>
              )
            })}
          </div>
          {CAT_HINT[categorie] && <p style={cm.hint}><Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />{CAT_HINT[categorie]}</p>}
        </div>

        {/* Fréquence */}
        {categorie && !amort && (
          <div style={cm.block}>
            <span style={cm.label}>Elle revient</span>
            <div style={cm.segment} className="grid-4" role="radiogroup" aria-label="Fréquence">
              {FREQS.map(f => (
                <button
                  key={f.key || 'once'} type="button" role="radio" aria-checked={frequence === f.key}
                  onClick={() => { setFrequence(f.key); setFreqTouched(true) }}
                  style={{ ...cm.segBtn, ...(frequence === f.key ? cm.segOn : null) }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Investissement amorti */}
        {amort && (
          <div style={cm.amortBox}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }}>
              Saisis <strong>le montant total</strong> (toutes factures réunies) à la date où les travaux sont <strong>terminés</strong> et le logement de nouveau louable, ou à la date d'achat du mobilier. L'amortissement démarre à cette date.
            </p>
            <span style={cm.label}>Amorti sur</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DUREES.map(x => (
                <button key={x.ans} type="button" onClick={() => setDuree(String(x.ans))} style={{ ...cm.pill, ...(d === x.ans ? cm.pillOn : null) }}>
                  {x.label} <span style={{ opacity: 0.7 }}>{x.ans} ans</span>
                </button>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input inputMode="numeric" value={duree} onChange={e => setDuree(e.target.value.replace(/\D/g, ''))} aria-label="Durée en années" style={{ ...s.input, width: 64, textAlign: 'center', padding: '7px 8px' }} />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>ans</span>
              </div>
            </div>
          </div>
        )}

        {/* Date(s) et logement */}
        <div style={s.formRow}>
          <Field label={dateLabel}><CalendarInput value={date} onChange={setDate} ariaLabel={dateLabel} /></Field>
          {freq ? (
            <Field label="Dernière échéance" hint="Facultatif : laisse vide si elle continue.">
              <CalendarInput value={dateFin} onChange={setDateFin} ariaLabel="Dernière échéance" min={date} placeholder="Sans fin" />
            </Field>
          ) : (
            <Field label="Logement">
              <SuggestInput value={logement} onChange={setLogement} options={logementNoms} ariaLabel="Logement" style={s.input} />
            </Field>
          )}
        </div>
        {freq && (
          <Field label="Logement">
            <SuggestInput value={logement} onChange={setLogement} options={logementNoms} ariaLabel="Logement" style={s.input} />
          </Field>
        )}

        {apercu && (
          <div style={cm.apercu}>
            {apercu.amort ? (
              <>
                <CalendarCheck size={18} weight="duotone" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <span>
                  Soit <strong>{eur(apercu.annuite)} par an</strong> pendant {d} an{d > 1 ? 's' : ''}.
                  {apercu.premiere < apercu.annuite - 0.5 && <> En {apercu.an}, année de mise en service, seulement <strong>{eur(apercu.premiere)}</strong> (au prorata à partir du {dateLongue(date)}).</>}
                </span>
              </>
            ) : (
              <>
                <Repeat size={18} weight="bold" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <span>
                  Tu la saisis une seule fois : <strong>{apercu.n} échéance{apercu.n > 1 ? 's' : ''}</strong> en {apercu.fin} pour l'instant, soit <strong>{eur(apercu.total)}</strong>
                  {apercu.futures > 0 && <>, dont {apercu.futures} à venir marquée{apercu.futures > 1 ? 's' : ''} « Prévue »</>}. Les années suivantes s'ajoutent toutes seules.
                </span>
              </>
            )}
          </div>
        )}

        <Field label="Note (facultatif)">
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder={amort ? 'ex. Rénovation salle de bain' : freq ? 'ex. Assurance PNO Hiscox' : 'ex. Facture du plombier'} style={s.input} />
        </Field>

        <button type="button" role="switch" aria-checked={deductible} onClick={() => setDeductible(v => !v)} style={cm.toggleRow}>
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Déductible au régime réel</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Compte dans la comparaison micro-BIC et réel de l'onglet Fiscalité</span>
          </span>
          <span style={{ ...cm.switch, background: deductible ? 'var(--accent-text)' : 'var(--border-2)' }}>
            <span style={{ ...cm.knob, transform: deductible ? 'translateX(18px)' : 'translateX(0)' }} />
          </span>
        </button>

        {error && <p style={{ margin: 0, fontSize: 12.5, color: COLORS.charges, display: 'flex', gap: 6, alignItems: 'center' }}><Warning size={14} weight="fill" />{error}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap-reverse' }}>
          <button type="button" onClick={onClose} style={{ ...ui.btn, flex: '1 1 120px', justifyContent: 'center', background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>Annuler</button>
          <button type="button" onClick={save} disabled={pending} style={{ ...ui.btn, flex: '2 1 180px', justifyContent: 'center', opacity: pending ? 0.7 : 1 }}>
            <Check size={15} weight="bold" />{pending ? 'Enregistrement…' : row ? 'Enregistrer' : freq ? 'Ajouter la charge récurrente' : amort ? "Ajouter l'investissement" : 'Ajouter la charge'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

const cm: Record<string, React.CSSProperties> = {
  amountBox: { display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 16px', borderRadius: 14, background: 'var(--bg-2)', border: '1px solid var(--border)' },
  amountLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.4 },
  amountInput: { flex: 1, minWidth: 0, border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent', color: 'var(--text)', fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-fraunces), Georgia, serif', padding: 0 },
  amountEuro: { fontSize: 24, fontWeight: 600, color: 'var(--text-3)' },
  block: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' },
  cats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 6 },
  cat: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 11, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', lineHeight: 1.2, minHeight: 42, minWidth: 0, transition: 'background 0.15s, border 0.15s' },
  catIcon: { width: 26, height: 26, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' },
  hint: { margin: 0, display: 'flex', gap: 7, fontSize: 12.5, lineHeight: 1.45, color: 'var(--text-3)', padding: '8px 10px', borderRadius: 10, background: 'var(--bg-2)' },
  segment: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 4, padding: 4, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' },
  segBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 6px', borderRadius: 9, border: '1px solid transparent', background: 'transparent', color: 'var(--text-3)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  segOn: { background: 'var(--surface)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  amortBox: { display: 'flex', flexDirection: 'column', gap: 9, padding: 14, borderRadius: 14, background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.45)' },
  pill: { padding: '7px 11px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  pillOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  apercu: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 13px', borderRadius: 12, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 13px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', width: '100%' },
  switch: { position: 'relative', width: 40, height: 22, borderRadius: 999, flexShrink: 0, transition: 'background 0.15s' },
  knob: { position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'transform 0.15s' },
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
  modal: { width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', background: 'var(--floating-surface)', border: '1px solid var(--floating-border)', borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-xl)' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  input: { padding: '9px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', fontWeight: 400, width: '100%', boxSizing: 'border-box' },
}
