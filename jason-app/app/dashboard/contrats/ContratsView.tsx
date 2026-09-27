'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PenNib, CurrencyEur, LockKey, CheckCircle, Copy, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { contractTodos, contractTodoCount } from '@/lib/contracts/todo'
import ContractsTab from './ContractsTab'
import type { ContractRow } from './types'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtShort(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
function fmtEur(n: number | null): string {
  if (n == null || !isFinite(n)) return '—'
  return Math.round(n).toLocaleString('fr-FR') + ' €'
}
function guestName(c: ContractRow): string {
  return `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Locataire'
}
function ficheHref(c: ContractRow): string {
  return c.voyageur_id ? `/dashboard/voyageurs/${c.voyageur_id}` : '/dashboard/voyageurs'
}

export default function ContratsView({ contracts, appUrl }: { contracts: ContractRow[]; appUrl: string }) {
  const todos = useMemo(() => contractTodos(contracts, todayISO()), [contracts])
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
            Contrats signés en ligne, loyer et caution pour tes réservations directes.
          </p>
        </div>
        <Link href="/dashboard/voyageurs" style={s.newBtn} title="Un contrat se crée depuis la fiche du voyageur, sur son séjour">
          Créer depuis un voyageur <ArrowRight size={14} weight="bold" />
        </Link>
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
                color="#2563eb"
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
                color="#10b981"
                title="Caution à libérer"
                hint="Séjour terminé : libère la caution ou encaisse-la en cas de dégâts."
                items={todos.cautionALiberer}
                render={c => (
                  <>
                    <span style={s.itemMain}>{guestName(c)}</span>
                    <span style={s.itemSub}>{fmtEur(c.montant_caution)} · départ {fmtShort(c.date_depart)}</span>
                    <Link href={ficheHref(c)} style={s.itemBtn}>Gérer</Link>
                  </>
                )}
              />
            </div>
          )}
        </section>
      )}

      <ContractsTab contracts={contracts} />

      <style>{`@media (max-width: 900px) { .ctr-todo-grid { grid-template-columns: 1fr !important; } }`}</style>
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
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '16px', flexWrap: 'wrap', marginBottom: '24px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', margin: '0 0 4px',
  },
  desc: { fontSize: '14px', color: 'var(--text-3)', margin: 0 },
  newBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px',
    padding: '10px 16px', borderRadius: '10px', textDecoration: 'none',
    background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '13.5px', fontWeight: 700,
  },
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
