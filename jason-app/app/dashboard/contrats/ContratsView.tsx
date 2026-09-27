'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PenNib, CurrencyEur, LockKey, CheckCircle, Copy, Plus, CaretDown, House } from '@phosphor-icons/react/dist/ssr'
import { contractTodos, contractTodoCount } from '@/lib/contracts/todo'
import ContractsTab from './ContractsTab'
import type { ContractRow, ContractCandidate } from './types'
import dynamic from 'next/dynamic'
import type { VoyageurOption } from '../logements/[id]/QuickSejourModal'

const QuickSejourModal = dynamic(() => import('../logements/[id]/QuickSejourModal'), { ssr: false })

function fmtShort(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
function fmtEur(n: number | null): string {
  if (n == null || !isFinite(n)) return '-'
  return Math.round(n).toLocaleString('fr-FR') + ' €'
}
function guestName(c: ContractRow): string {
  return `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Locataire'
}
function ficheHref(c: ContractRow): string {
  return c.voyageur_id ? `/dashboard/voyageurs/${c.voyageur_id}` : '/dashboard/voyageurs'
}

export default function ContratsView({ contracts, candidates, voyageurs, logements, appUrl, today }: {
  contracts: ContractRow[]
  candidates: ContractCandidate[]
  voyageurs: VoyageurOption[]
  logements: Array<{ id: string; nom: string }>
  appUrl: string
  /** 'YYYY-MM-DD' à Paris, calculé côté serveur */
  today: string
}) {
  const todos = useMemo(() => contractTodos(contracts, today), [contracts, today])
  const cautionItems = useMemo(() => [...todos.cautionALiberer, ...todos.cautionExpiree], [todos])
  // Modale « Nouvelle réservation directe » rendue au niveau de la page : dans
  // l'en-tête (animé, donc transformé), le position:fixed serait confiné à l'en-tête.
  const [quickOpen, setQuickOpen] = useState(false)
  const count = contractTodoCount(todos)
  const [copied, setCopied] = useState<string | null>(null)

  function copySignLink(c: ContractRow) {
    if (!c.token) return
    navigator.clipboard?.writeText(`${appUrl}/sign/${c.token}`).then(() => {
      setCopied(c.id)
      setTimeout(() => setCopied(prev => (prev === c.id ? null : prev)), 2000)
    }).catch(() => {})
  }

  return (
    <div style={s.page}>
      <div style={s.head} className="fade-up">
        <div>
          <h1 style={s.title}>Contrats &amp; paiements</h1>
          <p style={s.desc}>
            Contrats signés en ligne, loyer et caution pour tes réservations directes. En haut, ce qui attend une action. En dessous, tous tes contrats.
          </p>
        </div>
        <NewContractMenu candidates={candidates} onNewReservation={() => setQuickOpen(true)} />
      </div>

      {contracts.length > 0 && (
        <section style={s.todoWrap} className="fade-up" aria-label="À traiter">
          <div style={s.todoHead}>
            <span style={s.todoTitle}>À traiter</span>
            {count === 0 && (
              <span style={s.allGood}><CheckCircle size={14} weight="fill" /> Rien en attente, tout est à jour</span>
            )}
          </div>

          {count > 0 && (
            <div style={s.todoGrid} className="ctr-todo-grid">
              <TodoCard
                icon={<PenNib size={16} weight="fill" />}
                color="#d97706"
                title="À faire signer"
                hint="Le locataire n'a pas encore signé. Renvoie-lui le lien."
                items={todos.aSigner}
                render={c => (
                  <>
                    <span style={s.itemMain}>{guestName(c)}</span>
                    <span style={s.itemSub}>arrivée {fmtShort(c.date_arrivee)}</span>
                    {c.token && (
                      <button type="button" onClick={() => copySignLink(c)} style={s.itemBtn}>
                        {copied === c.id ? <><CheckCircle size={12} weight="fill" /> Copié</> : <><Copy size={12} weight="bold" /> Lien</>}
                      </button>
                    )}
                  </>
                )}
              />
              <TodoCard
                icon={<CurrencyEur size={16} weight="fill" />}
                color="#B7791F"
                title="Loyer pas encore encaissé"
                hint="Contrat signé, paiement en ligne pas encore reçu."
                items={todos.loyerEnAttente}
                render={c => (
                  <>
                    <span style={s.itemMain}>{guestName(c)}</span>
                    <span style={s.itemSub}>
                      {c.stripe_payment_status === 'failed' ? 'paiement échoué' : fmtEur(c.montant_loyer)}
                    </span>
                    <Link href={ficheHref(c)} style={s.itemBtn}>Relancer</Link>
                  </>
                )}
              />
              <TodoCard
                icon={<LockKey size={16} weight="fill" />}
                color="var(--accent-text)"
                title="Caution à traiter"
                hint="Libère la caution ou encaisse-la en cas de dégâts, avant que Stripe ne débloque la carte (environ 7 jours)."
                items={cautionItems}
                render={c => (
                  <>
                    <span style={s.itemMain}>{guestName(c)}</span>
                    <span style={s.itemSub}>
                      {c.stripe_deposit_status === 'expired'
                        ? <span style={{ color: '#b45309', fontWeight: 600 }}>expirée : renvoie le lien</span>
                        : <>{fmtEur(c.montant_caution)} · {c.date_depart && c.date_depart <= today ? 'départ' : 'sur place, départ'} {fmtShort(c.date_depart)}</>}
                    </span>
                    <Link href={ficheHref(c)} style={s.itemBtn}>{c.stripe_deposit_status === 'expired' ? 'Renvoyer' : 'Gérer'}</Link>
                  </>
                )}
              />
            </div>
          )}
        </section>
      )}

      <ContractsTab contracts={contracts} today={today} />

      {quickOpen && (
        <QuickSejourModal voyageurs={voyageurs} logements={logements} contractOnly onClose={() => setQuickOpen(false)} />
      )}

      <style>{`
        @media (max-width: 900px) { .ctr-todo-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .ctr-menu { left: 0 !important; right: auto !important; } }
      `}</style>
    </div>
  )
}

// Un contrat est toujours rattaché à un séjour : le bouton liste les séjours à
// venir qui n'en ont pas et ouvre directement l'assistant (5 étapes) sur la
// fiche du voyageur (?contract=<séjour>).
function NewContractMenu({ candidates, onNewReservation }: {
  candidates: ContractCandidate[]
  onNewReservation: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', marginTop: 6 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={s.newBtn} aria-expanded={open}>
        <Plus size={14} weight="bold" /> Nouveau contrat <CaretDown size={12} weight="bold" />
      </button>
      {open && (
        <>
          <div style={s.menuBackdrop} onClick={() => setOpen(false)} aria-hidden />
          <div style={s.menu} className="ctr-menu" role="menu">
            <div style={s.menuTitle}>Pour quelle réservation ?</div>
            {/* Réservation pas encore saisie : voyageur + dates en une fois,
                puis l'assistant de contrat s'ouvre directement. */}
            <button type="button" onClick={() => { setOpen(false); onNewReservation() }} style={s.menuNew}>
              <Plus size={13} weight="bold" /> Nouvelle réservation directe
            </button>
            {candidates.length === 0 ? (
              <p style={s.menuEmpty}>Aucun séjour à venir sans contrat.</p>
            ) : (
              <ul style={s.menuList}>
                {candidates.slice(0, 8).map(c => (
                  <li key={c.sejourId}>
                    <Link href={`/dashboard/voyageurs/${c.voyageurId}?contract=${c.sejourId}`} style={s.menuItem} role="menuitem">
                      <span style={s.menuGuest}>{c.guest}</span>
                      <span style={s.menuSub}>
                        {c.logement && <><House size={11} weight="fill" /> {c.logement} · </>}
                        {fmtShort(c.dateArrivee)} → {fmtShort(c.dateDepart)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {candidates.length > 8 && <p style={s.menuMore}>+ {candidates.length - 8} autres dans Mes voyageurs</p>}
          </div>
        </>
      )}
    </div>
  )
}

function TodoCard({ icon, color, title, hint, items, render }: {
  icon: React.ReactNode
  color: string
  title: string
  hint: string
  items: ContractRow[]
  render: (c: ContractRow) => React.ReactNode
}) {
  const shown = items.slice(0, 4)
  return (
    <div style={{ ...s.card, opacity: items.length === 0 ? 0.6 : 1 }}>
      <div style={s.cardHead}>
        <span style={{ ...s.cardIcon, color, background: `${color}1f` }}>{icon}</span>
        <span style={s.cardTitle}>{title}</span>
        <span style={{ ...s.cardCount, color }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p style={s.cardEmpty}>Rien pour l&apos;instant.</p>
      ) : (
        <>
          <p style={s.cardHint}>{hint}</p>
          <ul style={s.items}>
            {shown.map(c => <li key={c.id} style={s.item}>{render(c)}</li>)}
          </ul>
          {items.length > shown.length && (
            <p style={s.more}>+ {items.length - shown.length} autre{items.length - shown.length > 1 ? 's' : ''} dans la liste ci-dessous</p>
          )}
        </>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  head: {
    position: 'relative', zIndex: 5,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '16px', flexWrap: 'wrap', marginBottom: '24px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', margin: '0 0 4px',
  },
  desc: { fontSize: '14px', color: 'var(--text-3)', margin: 0, maxWidth: '640px', lineHeight: 1.6 },
  newBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '13.5px', fontWeight: 700,
  },
  menuBackdrop: { position: 'fixed', inset: 0, zIndex: 40 },
  menu: {
    position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 41, width: 'min(360px, calc(100vw - 32px))',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.14)', padding: '10px',
  },
  menuTitle: { fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-2)', padding: '4px 6px 8px' },
  menuList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  menuItem: { display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 10px', borderRadius: '8px', textDecoration: 'none' },
  menuGuest: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' },
  menuSub: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-3)' },
  menuNew: {
    display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '9px 10px', marginBottom: '6px',
    borderRadius: '8px', border: '1px dashed var(--accent-border)', background: 'var(--accent-bg)',
    color: 'var(--accent-text)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  menuEmpty: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5, margin: '0 6px 6px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' },
  menuLink: { color: 'var(--accent-text)', fontWeight: 600 },
  menuMore: { fontSize: '12px', color: 'var(--text-muted)', margin: '6px 10px 2px' },
  todoWrap: { marginBottom: '22px' },
  todoHead: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' },
  todoTitle: {
    fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase', color: 'var(--text-2)',
  },
  allGood: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', color: 'var(--success-1)', fontWeight: 600,
  },
  todoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' },
  card: {
    padding: '14px 16px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '14px',
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: '10px' },
  cardIcon: {
    width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  cardCount: { fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif' },
  cardHint: { fontSize: '12.5px', color: 'var(--text-3)', margin: '8px 0 6px', lineHeight: 1.5 },
  cardEmpty: { fontSize: '12.5px', color: 'var(--text-muted)', margin: '8px 0 0' },
  items: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  item: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '7px 0', borderTop: '1px solid var(--border)', fontSize: '13px',
  },
  itemMain: { fontWeight: 600, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemSub: { flex: 1, color: 'var(--text-3)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0,
    padding: '4px 9px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent-text)',
    textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },
  more: { fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0' },
}
