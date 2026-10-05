'use client'

// Contrats & paiements (DA sept. 2026) : HubHero vert avec les 3 étapes d'une
// réservation directe, et à droite ce qui attend une action + l'état de
// l'encaissement (Stripe / IBAN). Puis « À traiter » (seulement les cartes
// non vides) et la liste de tous les contrats.
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { PenNib, CurrencyEur, LockKey, CheckCircle, Copy, Plus, CaretDown, CaretRight, House, FileText, Warning, Eye, CreditCard } from '@phosphor-icons/react/dist/ssr'
import { contractTodos, contractTodoCount } from '@/lib/contracts/todo'
import HubHero, { HeroEm, heroCard, heroCta } from '@/components/dashboard/HubHero'
import { Card, CardHead, Notice, ui } from '../finances/_ui/ui'
import ContractsTab from './ContractsTab'
import type { ContractRow, ContractCandidate, ContratsTab } from './types'
import CautionsTab, { cautionGroup } from './CautionsTab'
import { PAYMENT_FEES_LABEL } from '@/lib/stripe/payment-fees'
import dynamic from 'next/dynamic'
import type { VoyageurOption } from '../logements/[id]/QuickSejourModal'

const QuickSejourModal = dynamic(() => import('../logements/[id]/QuickSejourModal'), { ssr: false })

const AMBER = '#B7791F'

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

export default function ContratsView({ tab = 'contrats', paiements, contracts, candidates, voyageurs, logements, appUrl, today, stripeReady, hasIban }: {
  tab?: ContratsTab
  /** Contenu de l'onglet Paiements (rendu côté serveur : solde Stripe) */
  paiements?: React.ReactNode
  contracts: ContractRow[]
  candidates: ContractCandidate[]
  voyageurs: VoyageurOption[]
  logements: Array<{ id: string; nom: string }>
  appUrl: string
  /** 'YYYY-MM-DD' à Paris, calculé côté serveur */
  today: string
  stripeReady: boolean
  hasIban: boolean
}) {
  const todos = useMemo(() => contractTodos(contracts, today), [contracts, today])
  const cautionItems = useMemo(() => [...todos.cautionALiberer, ...todos.cautionExpiree], [todos])
  // Modale rendue au niveau de la page : dans l'en-tête (animé, donc
  // transformé), le position:fixed serait confiné à l'en-tête.
  const [quickOpen, setQuickOpen] = useState(false)
  const count = contractTodoCount(todos)
  const [copied, setCopied] = useState<string | null>(null)
  const todoRef = useRef<HTMLDivElement>(null)

  function copySignLink(c: ContractRow) {
    if (!c.token) return
    navigator.clipboard?.writeText(`${appUrl}/sign/${c.token}`).then(() => {
      setCopied(c.id)
      setTimeout(() => setCopied(prev => (prev === c.id ? null : prev)), 2000)
    }).catch(() => {})
  }
  const goTodo = () => todoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const cautionsADecider = useMemo(
    () => contracts.filter(c => c.statut === 'signe' && Number(c.montant_caution ?? 0) > 0 && cautionGroup(c, stripeReady) === 'decider').length,
    [contracts, stripeReady],
  )
  const tabs: Array<{ key: ContratsTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: 'contrats', label: 'Contrats', icon: <FileText size={15} weight={tab === 'contrats' ? 'fill' : 'regular'} />, badge: todos.aSigner.length || undefined },
    { key: 'paiements', label: 'Paiements', icon: <CreditCard size={15} weight={tab === 'paiements' ? 'fill' : 'regular'} />, badge: todos.loyerEnAttente.length || undefined },
    { key: 'cautions', label: 'Cautions', icon: <LockKey size={15} weight={tab === 'cautions' ? 'fill' : 'regular'} />, badge: cautionsADecider || undefined },
  ]

  const asideRows = [
    { n: todos.aSigner.length, label: todos.aSigner.length > 1 ? 'contrats à faire signer' : 'contrat à faire signer', icon: <PenNib size={15} color={AMBER} /> },
    { n: todos.loyerEnAttente.length, label: todos.loyerEnAttente.length > 1 ? 'loyers pas encore encaissés' : 'loyer pas encore encaissé', icon: <CurrencyEur size={15} color={AMBER} /> },
    { n: cautionItems.length, label: cautionItems.length > 1 ? 'cautions à traiter' : 'caution à traiter', icon: <LockKey size={15} color={AMBER} /> },
  ].filter(r => r.n > 0)

  return (
    <div style={ui.page}>
      <HubHero
        eyebrowIcon={<FileText size={14} weight="fill" />}
        eyebrow="Contrats & paiements"
        title={<>Tes réservations directes, <HeroEm>signées et payées</HeroEm></>}
        desc={`Contrat signé en ligne, loyer par lien de paiement sur ton compte, caution par empreinte bancaire. Aucune commission sur tes réservations, seulement ${PAYMENT_FEES_LABEL} de frais par paiement en ligne.`}
        steps={[
          ['Crée', 'le contrat depuis la réservation'],
          ['Envoie', 'le lien : le voyageur signe et paie'],
          ['Libère', 'la caution après le départ'],
        ]}
        aside={
          <div style={{ ...heroCard, width: '100%' }}>
            <div style={s.asideTitle}>{asideRows.length > 0 ? 'À traiter' : 'Tout est à jour'}</div>
            {asideRows.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {asideRows.map(r => (
                  <button key={r.label} type="button" onClick={goTodo} style={s.asideRow}>
                    {r.icon}
                    <strong style={s.asideNum}>{r.n}</strong>
                    <span style={{ flex: 1 }}>{r.label}</span>
                    <CaretRight size={13} color="var(--text-3)" />
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                {contracts.length > 0 ? 'Aucun contrat à relancer, aucun loyer ni caution en attente.' : 'Ton premier contrat apparaîtra ici.'}
              </p>
            )}
            <div style={s.payBox}>
              <div style={s.asideTitle}>Encaissement</div>
              {stripeReady ? (
                <span style={s.payOk}><CheckCircle size={15} weight="fill" /> Stripe connecté : loyer par lien et caution</span>
              ) : (
                <>
                  <span style={s.payWarn}><Warning size={15} weight="fill" /> Stripe pas connecté{hasIban ? ' : paiement par virement (IBAN)' : ''}</span>
                  <Link href="/dashboard/profil#stripe" style={{ ...ui.link, fontSize: 13 }}>Connecter Stripe pour le paiement en ligne et la caution</Link>
                </>
              )}
            </div>
          </div>
        }
      >
        <div style={s.ctaRow}>
          <NewContractMenu candidates={candidates} onNewReservation={() => setQuickOpen(true)} />
          <PreviewContractMenu logements={logements} />
        </div>
      </HubHero>

      <nav style={s.tabs} aria-label="Onglets Contrats & paiements">
        {tabs.map(t => {
          const on = t.key === tab
          return (
            <Link key={t.key} href={t.key === 'contrats' ? '/dashboard/contrats' : `/dashboard/contrats?onglet=${t.key}`} scroll={false}
              style={{ ...s.tab, ...(on ? s.tabOn : {}) }} aria-current={on ? 'page' : undefined}>
              {t.icon}
              <span>{t.label}</span>
              {t.badge ? <span style={s.tabBadge}>{t.badge}</span> : null}
            </Link>
          )
        })}
      </nav>

      {tab === 'paiements' && (
        <>{paiements}</>
      )}

      {tab === 'cautions' && (
        <CautionsTab contracts={contracts} stripeReady={stripeReady} appUrl={appUrl} today={today} />
      )}

      {tab === 'contrats' && contracts.length > 0 && count > 0 && (
        <div ref={todoRef} style={{ scrollMarginTop: 16 }}>
          <Card>
            <CardHead title="À traiter" sub="Ce qui attend une action de ta part, par ordre d'arrivée." />
            <div style={s.todoGrid}>
              {todos.aSigner.length > 0 && (
                <TodoCard
                  icon={<PenNib size={16} weight="fill" />}
                  title="À faire signer"
                  hint="Le locataire n'a pas encore signé. Copie le lien et renvoie-le lui."
                  items={todos.aSigner}
                  render={c => (
                    <>
                      <span style={s.itemMain}>{guestName(c)}</span>
                      <span style={s.itemSub}>arrivée {fmtShort(c.date_arrivee)}</span>
                      {c.token && (
                        <button type="button" onClick={() => copySignLink(c)} style={s.itemBtn}>
                          {copied === c.id ? <><CheckCircle size={12} weight="fill" /> Copié</> : <><Copy size={12} weight="bold" /> Copier le lien</>}
                        </button>
                      )}
                    </>
                  )}
                />
              )}
              {todos.loyerEnAttente.length > 0 && (
                <TodoCard
                  icon={<CurrencyEur size={16} weight="fill" />}
                  title="Loyer pas encore encaissé"
                  hint="Contrat signé, paiement en ligne pas encore reçu."
                  items={todos.loyerEnAttente}
                  render={c => (
                    <>
                      <span style={s.itemMain}>{guestName(c)}</span>
                      <span style={s.itemSub}>
                        {c.stripe_payment_status === 'failed' ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>paiement échoué</span> : fmtEur(c.montant_loyer)}
                      </span>
                      <Link href="/dashboard/contrats?onglet=paiements" scroll={false} style={s.itemBtn}>Relancer</Link>
                    </>
                  )}
                />
              )}
              {cautionItems.length > 0 && (
                <TodoCard
                  icon={<LockKey size={16} weight="fill" />}
                  title="Caution à traiter"
                  hint="Libère la caution, ou retiens le montant des dégâts, avant que la banque ne débloque la carte (7 jours au plus)."
                  items={cautionItems}
                  render={c => (
                    <>
                      <span style={s.itemMain}>{guestName(c)}</span>
                      <span style={s.itemSub}>
                        {c.stripe_deposit_status === 'expired'
                          ? <span style={{ color: AMBER, fontWeight: 600 }}>expirée : renvoie le lien</span>
                          : <>{fmtEur(c.montant_caution)} · {c.date_depart && c.date_depart <= today ? 'départ' : 'sur place, départ'} {fmtShort(c.date_depart)}</>}
                      </span>
                      <Link href="/dashboard/contrats?onglet=cautions" scroll={false} style={s.itemBtn}>{c.stripe_deposit_status === 'expired' ? 'Renvoyer' : 'Gérer'}</Link>
                    </>
                  )}
                />
              )}
            </div>
          </Card>
        </div>
      )}
      {tab === 'contrats' && contracts.length > 0 && count === 0 && (
        <Notice tone="ok"><strong>Rien en attente.</strong> Tous tes contrats sont signés, les loyers encaissés et les cautions traitées.</Notice>
      )}

      {tab === 'contrats' && <ContractsTab contracts={contracts} today={today} />}

      {quickOpen && (
        <QuickSejourModal voyageurs={voyageurs} logements={logements} contractOnly onClose={() => setQuickOpen(false)} />
      )}
    </div>
  )
}

// Un contrat est toujours rattaché à un séjour : le bouton liste les séjours à
// venir qui n'en ont pas et ouvre directement l'assistant sur la fiche du
// voyageur (?contract=<séjour>). Fermeture au clic extérieur par écouteur (un
// fond en position:fixed serait confiné au hero animé).
function NewContractMenu({ candidates, onNewReservation }: {
  candidates: ContractCandidate[]
  onNewReservation: () => void
}) {
  const { open, setOpen, ref } = useMenu()
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', zIndex: 20 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ ...heroCta, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} aria-expanded={open}>
        <Plus size={16} weight="bold" /> Nouveau contrat <CaretDown size={13} weight="bold" />
      </button>
      {open && (
        <div style={s.menu} role="menu">
          <div style={s.menuTitle}>Pour quelle réservation ?</div>
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
                      {fmtShort(c.dateArrivee)} au {fmtShort(c.dateDepart)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {candidates.length > 8 && <p style={s.menuMore}>+ {candidates.length - 8} autres dans Mes réservations</p>}
        </div>
      )}
    </div>
  )
}

/** Menu déroulant fermé au clic extérieur ou par Échap */
function useMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  return { open, setOpen, ref }
}

// Aperçu du contrat (demande de Jason, 29/09/2026) : le contrat d'exemple d'un
// logement, tel que le voyageur le verra, sans rien envoyer. Un seul logement :
// lien direct ; plusieurs : choix du logement.
function PreviewContractMenu({ logements }: { logements: Array<{ id: string; nom: string }> }) {
  const { open, setOpen, ref } = useMenu()
  if (logements.length === 0) return null
  const label = <><Eye size={16} weight="bold" /> Voir mon contrat</>
  if (logements.length === 1) {
    return <Link href={`/apercu-contrat/${logements[0].id}`} style={s.ctaGhost}>{label}</Link>
  }
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', zIndex: 19 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={s.ctaGhost} aria-expanded={open}>
        {label} <CaretDown size={13} weight="bold" />
      </button>
      {open && (
        <div style={s.menu} role="menu">
          <div style={s.menuTitle}>Le contrat de quel logement ?</div>
          <p style={s.menuHint}>Un exemple rempli avec ta fiche logement, tel que ton voyageur le recevra. Rien n'est envoyé.</p>
          <ul style={s.menuList}>
            {logements.map(l => (
              <li key={l.id}>
                <Link href={`/apercu-contrat/${l.id}`} style={{ ...s.menuItem, flexDirection: 'row', alignItems: 'center', gap: 8 }} role="menuitem">
                  <House size={13} weight="fill" color="var(--accent-text)" />
                  <span style={s.menuGuest}>{l.nom}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function TodoCard({ icon, title, hint, items, render }: {
  icon: React.ReactNode
  title: string
  hint: string
  items: ContractRow[]
  render: (c: ContractRow) => React.ReactNode
}) {
  const shown = items.slice(0, 5)
  return (
    <div style={s.card}>
      <div style={s.cardHead}>
        <span style={s.cardIcon}>{icon}</span>
        <span style={s.cardTitle}>{title}</span>
        <span style={s.cardCount}>{items.length}</span>
      </div>
      <p style={s.cardHint}>{hint}</p>
      <ul style={s.items}>
        {shown.map(c => <li key={c.id} style={s.item}>{render(c)}</li>)}
      </ul>
      {items.length > shown.length && (
        <p style={s.more}>+ {items.length - shown.length} autre{items.length - shown.length > 1 ? 's' : ''} dans la liste ci-dessous</p>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  asideTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  asideRow: {
    display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', background: 'none', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text-2)', textAlign: 'left',
  },
  asideNum: { fontFamily: 'var(--font-fraunces), serif', fontSize: 19, color: 'var(--text)', minWidth: 18 },
  payBox: { display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--border)' },
  payOk: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent-text)' },
  payWarn: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: AMBER },
  menu: {
    position: 'absolute', left: 0, top: 'calc(100% + 6px)', zIndex: 41, width: 'min(360px, 78vw)',
    background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '12px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.18)', padding: '10px',
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
  ctaRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' },
  ctaGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 18px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
    fontSize: '14.5px', fontWeight: 700, textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },
  menuHint: { fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.5, margin: '0 6px 8px' },
  menuEmpty: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5, margin: '0 6px 6px' },
  menuMore: { fontSize: '12px', color: 'var(--text-3)', margin: '6px 10px 2px' },
  todoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '12px' },
  card: { padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', minWidth: 0 },
  cardHead: { display: 'flex', alignItems: 'center', gap: '10px' },
  cardIcon: {
    width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, color: AMBER, background: 'rgba(255,213,107,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: '14.5px', fontWeight: 600, color: 'var(--text)' },
  cardCount: { fontSize: '20px', fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)' },
  cardHint: { fontSize: '12.5px', color: 'var(--text-3)', margin: '8px 0 6px', lineHeight: 1.5 },
  items: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' },
  item: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderTop: '1px solid var(--border)', fontSize: '13px', minWidth: 0 },
  itemMain: { fontWeight: 600, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemSub: { flex: 1, color: 'var(--text-3)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 },
  itemBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0,
    padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
    background: 'var(--surface)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
    textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  more: { fontSize: '12px', color: 'var(--text-3)', margin: '6px 0 0' },
  tabs: {
    display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', overflowX: 'auto',
    WebkitOverflowScrolling: 'touch', margin: '0 0 var(--s-2)',
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 14px', whiteSpace: 'nowrap',
    fontSize: 14, fontWeight: 600, color: 'var(--text-3)', textDecoration: 'none',
    borderBottom: '2px solid transparent', marginBottom: -1,
  },
  tabOn: { color: 'var(--accent-text)', borderBottom: '2px solid var(--accent-text)' },
  tabBadge: {
    minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: 'rgba(255,213,107,0.3)', color: '#8A5A12',
    fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
}
