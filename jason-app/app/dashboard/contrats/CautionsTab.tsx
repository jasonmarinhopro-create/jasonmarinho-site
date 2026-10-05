'use client'

// Onglet « Cautions » de Contrats & paiements (05/10/2026, demande de Jason :
// « des boutons qui permettent de relâcher la caution, de dire à Stripe je ne
// capture pas »). Toutes les cautions au même endroit, rangées par ce qu'il
// reste à faire, avec Libérer et Retenir une somme directement sur la ligne
// (avant : une fiche voyageur à ouvrir par caution).
import { useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  LockKey, LockKeyOpen, ShieldCheck, Hourglass, CheckCircle, Copy, Warning, House, ArrowSquareOut, Info,
} from '@phosphor-icons/react/dist/ssr'
import { depositActBefore, depositOpensOn } from '@/lib/stripe/deposit-window'
import { cautionGroup, type CautionGroup } from '@/lib/contracts/caution-group'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Card, CardHead, ui } from '../finances/_ui/ui'
import type { ContractRow } from './types'

const DepositModal = dynamic(() => import('../voyageurs/[id]/DepositModal'), { ssr: false })

const AMBER = '#B7791F'

const fmtDay = (iso: string | null) => iso
  ? new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  : '-'
const fmtEur = (n: number | null) => `${Number(n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`
const guest = (c: ContractRow) => `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Locataire'

type Group = CautionGroup

const STATUS_TEXT: Record<string, string> = {
  captured: 'Somme retenue',
  released: 'Libérée, rien prélevé',
  expired: 'Blocage terminé, rien prélevé',
}

export default function CautionsTab({ contracts, stripeReady, appUrl, today }: {
  contracts: ContractRow[]
  stripeReady: boolean
  appUrl: string
  today: string
}) {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()
  const [modal, setModal] = useState<ContractRow | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({})

  const rows = useMemo(() => contracts
    .filter(c => c.statut === 'signe' && Number(c.montant_caution ?? 0) > 0)
    .map(c => ({ ...c, stripe_deposit_status: localStatus[c.id] ?? c.stripe_deposit_status })),
  [contracts, localStatus])

  const groups = useMemo(() => {
    const g: Record<Group, ContractRow[]> = { decider: [], attente: [], expiree: [], terminee: [], horsligne: [] }
    for (const c of rows) g[cautionGroup(c, stripeReady)].push(c)
    g.decider.sort((a, b) => String(a.date_arrivee).localeCompare(String(b.date_arrivee)))
    g.attente.sort((a, b) => String(a.date_arrivee).localeCompare(String(b.date_arrivee)))
    g.horsligne.sort((a, b) => String(b.date_arrivee).localeCompare(String(a.date_arrivee)))
    g.terminee.sort((a, b) => String(b.date_depart).localeCompare(String(a.date_depart)))
    return g
  }, [rows, stripeReady])

  const blocked = groups.decider.reduce((n, c) => n + Number(c.montant_caution ?? 0), 0)

  async function release(c: ContractRow) {
    setError(null)
    const ok = await confirm({
      title: `Libérer la caution de ${guest(c)} ?`,
      message: `Le blocage de ${fmtEur(c.montant_caution)} est levé tout de suite et ${c.locataire_prenom ?? 'le voyageur'} reçoit un e-mail : rien n'est prélevé. Tu ne pourras plus rien retenir ensuite.`,
      confirmLabel: 'Libérer la caution',
    })
    if (!ok) return
    setBusy(c.id)
    try {
      const res = await fetch('/api/stripe/deposit/release', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contract_id: c.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'La libération n\'a pas abouti. Réessaie.'); return }
      setLocalStatus(prev => ({ ...prev, [c.id]: 'released' }))
      router.refresh()
    } catch {
      setError('Erreur réseau. Réessaie.')
    } finally {
      setBusy(null)
    }
  }

  function copyLink(c: ContractRow) {
    if (!c.token) return
    navigator.clipboard?.writeText(`${appUrl}/api/stripe/deposit/redirect?token=${c.token}`).then(() => {
      setCopied(c.id)
      setTimeout(() => setCopied(p => (p === c.id ? null : p)), 2000)
    }).catch(() => {})
  }

  const total = rows.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      {dialog}

      {/* Rappel du fonctionnement, en une ligne lisible */}
      <div style={s.explain}>
        <ShieldCheck size={20} weight="fill" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <strong>Une caution par carte n&apos;est jamais débitée sans toi.</strong>{' '}
          La banque du voyageur bloque la somme, 7 jours au plus. Après le départ, tu la <strong>libères</strong> (rien n&apos;est prélevé)
          ou tu <strong>retiens</strong> seulement le montant des dégâts, avec un motif. Sans action de ta part, le blocage tombe tout seul.
        </div>
      </div>

      {error && <div style={s.error} role="alert"><Warning size={15} weight="fill" /> {error}</div>}

      {total === 0 ? (
        <Card>
          <div style={s.empty}>
            <LockKey size={28} weight="duotone" color="var(--accent-text)" />
            <h3 style={s.emptyTitle}>Aucune caution pour l&apos;instant</h3>
            <p style={s.emptyText}>
              Ajoute un dépôt de garantie dans la carte « Contrat » de ta fiche logement : il sera repris dans chaque nouveau contrat,
              et le lien de caution partira tout seul au voyageur 2 jours avant son arrivée.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div style={s.stats}>
            <Stat label="À décider" value={String(groups.decider.length)} sub={groups.decider.length ? `${fmtEur(blocked)} bloqués` : 'rien en cours'} tone={groups.decider.length ? 'amber' : undefined} />
            <Stat label="En attente du voyageur" value={String(groups.attente.length + groups.expiree.length)} sub="lien à valider" />
            <Stat label="Terminées" value={String(groups.terminee.length)} sub="libérées ou retenues" />
          </div>

          {groups.decider.length > 0 && (
            <Card>
              <CardHead title="À décider" sub="La carte est bloquée. Après l'état des lieux de sortie, libère la caution ou retiens une somme, avant la date indiquée." />
              <ul style={s.list}>
                {groups.decider.map(c => {
                  const limit = c.date_arrivee ? depositActBefore(c.date_arrivee) : null
                  const late = !!limit && limit <= today
                  const pending = c.stripe_deposit_status === 'capturing' || c.stripe_deposit_status === 'releasing'
                  return (
                    <li key={c.id} style={s.row}>
                      <Who c={c} />
                      <div style={s.amountCol}>
                        <span style={s.amount}>{fmtEur(c.montant_caution)}</span>
                        <span style={{ ...s.badge, ...s.badgeHeld }}><LockKey size={11} weight="fill" /> Carte bloquée</span>
                      </div>
                      <div style={s.when}>
                        <span style={{ color: late ? AMBER : 'var(--text-2)', fontWeight: late ? 700 : 500 }}>
                          {late ? 'À faire aujourd\'hui' : `Décide avant le ${fmtDay(limit)}`}
                        </span>
                        <span style={s.whenSub}>départ {fmtDay(c.date_depart)}</span>
                      </div>
                      <div style={s.actions}>
                        {pending ? (
                          <span style={s.whenSub}>En cours chez Stripe…</span>
                        ) : (
                          <>
                            <button type="button" onClick={() => release(c)} disabled={busy === c.id} style={s.btnRelease}>
                              <LockKeyOpen size={15} weight="bold" /> {busy === c.id ? 'Libération…' : 'Libérer'}
                            </button>
                            <button type="button" onClick={() => setModal(c)} disabled={busy === c.id} style={s.btnKeep}>
                              Retenir une somme
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}

          {(groups.attente.length > 0 || groups.expiree.length > 0) && (
            <Card>
              <CardHead title="En attente du voyageur" sub="Le lien part tout seul par e-mail 2 jours avant l'arrivée. Tu peux aussi le copier et l'envoyer toi-même." />
              <ul style={s.list}>
                {[...groups.expiree, ...groups.attente].map(c => {
                  const expired = c.stripe_deposit_status === 'expired'
                  const opens = c.date_arrivee ? depositOpensOn(c.date_arrivee) : null
                  const open = !!opens && opens <= today
                  return (
                    <li key={c.id} style={s.row}>
                      <Who c={c} />
                      <div style={s.amountCol}>
                        <span style={s.amount}>{fmtEur(c.montant_caution)}</span>
                        <span style={{ ...s.badge, ...(expired ? s.badgeWarn : s.badgeWait) }}>
                          {expired ? <><Warning size={11} weight="fill" /> Blocage tombé</> : <><Hourglass size={11} weight="fill" /> {open ? 'Lien envoyé' : 'Pas encore envoyé'}</>}
                        </span>
                      </div>
                      <div style={s.when}>
                        <span style={{ color: 'var(--text-2)' }}>
                          {expired ? 'Séjour en cours : renvoie le lien' : open ? 'Le voyageur n\'a pas encore validé' : `Lien envoyé le ${fmtDay(opens)}`}
                        </span>
                        <span style={s.whenSub}>arrivée {fmtDay(c.date_arrivee)}</span>
                      </div>
                      <div style={s.actions}>
                        {(open || expired) && c.token && (
                          <button type="button" onClick={() => copyLink(c)} style={s.btnGhost}>
                            {copied === c.id ? <><CheckCircle size={14} weight="fill" /> Copié</> : <><Copy size={14} weight="bold" /> Copier le lien</>}
                          </button>
                        )}
                        <button type="button" onClick={() => setModal(c)} style={s.btnGhost}>Détails</button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}

          {groups.horsligne.length > 0 && (
            <Card>
              <CardHead title="Cautions à gérer toi-même" sub="Stripe n'est pas connecté : la caution se règle hors de l'app (espèces, virement). Tu la rends au départ, à suivre de ton côté." />
              <ul style={s.list}>
                {groups.horsligne.map(c => (
                  <li key={c.id} style={s.row}>
                    <Who c={c} />
                    <div style={s.amountCol}><span style={s.amount}>{fmtEur(c.montant_caution)}</span></div>
                    <div style={s.when}><span style={s.whenSub}>départ {fmtDay(c.date_depart)}</span></div>
                    <div style={s.actions}>
                      <Link href="/dashboard/profil#stripe" style={{ ...ui.link, fontSize: 13 }}>Connecter Stripe</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {groups.terminee.length > 0 && (
            <Card>
              <CardHead title="Terminées" sub="Libérées, retenues, ou blocage tombé après le départ." />
              <ul style={s.list}>
                {groups.terminee.slice(0, 30).map(c => {
                  const st = c.stripe_deposit_status ?? ''
                  return (
                    <li key={c.id} style={{ ...s.row, ...s.rowDone }}>
                      <Who c={c} />
                      <div style={s.amountCol}>
                        <span style={{ ...s.amount, fontSize: 16 }}>{fmtEur(c.montant_caution)}</span>
                        <span style={{ ...s.badge, ...(st === 'captured' ? s.badgeWarn : s.badgeOk) }}>
                          {st === 'captured' ? <Info size={11} weight="fill" /> : <CheckCircle size={11} weight="fill" />}
                          {STATUS_TEXT[st] ?? 'Pas validée par le voyageur'}
                        </span>
                      </div>
                      <div style={s.when}><span style={s.whenSub}>départ {fmtDay(c.date_depart)}</span></div>
                      <div style={s.actions} />
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </>
      )}

      <p style={s.foot}>
        <Info size={13} /> Durée d&apos;un blocage : 7 jours au plus pour un paiement en ligne (Visa, Mastercard, American Express). C&apos;est pourquoi le lien ne s&apos;ouvre que 2 jours avant l&apos;arrivée.{' '}
        <Link href="/dashboard/aide/contrats-paiements/encaisser-loyer-caution" style={ui.link}>En savoir plus</Link>
      </p>

      {modal && (
        <DepositModal
          contract={{
            id: modal.id, token: modal.token ?? '', statut: modal.statut,
            locataire_prenom: modal.locataire_prenom ?? '', locataire_nom: modal.locataire_nom ?? '',
            montant_loyer: modal.montant_loyer, montant_caution: modal.montant_caution,
            modalites_paiement: modal.modalites_paiement ?? null,
            stripe_payment_enabled: !!modal.stripe_payment_enabled,
            stripe_payment_status: (modal.stripe_payment_status ?? null) as 'pending' | 'paid' | 'refunded' | 'failed' | null,
            stripe_deposit_status: (modal.stripe_deposit_status ?? null) as 'pending' | 'held' | 'captured' | 'released' | 'expired' | 'failed' | null,
            date_arrivee: modal.date_arrivee ?? '', date_depart: modal.date_depart ?? '',
          }}
          hostIban={null}
          hostBic={null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function Who({ c }: { c: ContractRow }) {
  const name = guest(c)
  return (
    <div style={s.who}>
      <span style={s.avatar}>{name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
      <div style={{ minWidth: 0 }}>
        {c.voyageur_id ? (
          <Link href={`/dashboard/voyageurs/${c.voyageur_id}`} style={s.name}>{name} <ArrowSquareOut size={12} /></Link>
        ) : <span style={s.name}>{name}</span>}
        <span style={s.sub}>
          {c.logement_nom && <><House size={11} weight="fill" /> {c.logement_nom} · </>}
          {fmtDay(c.date_arrivee)} au {fmtDay(c.date_depart)}
        </span>
      </div>
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'amber' }) {
  return (
    <div style={s.stat}>
      <span style={s.statLabel}>{label}</span>
      <span style={{ ...s.statValue, color: tone === 'amber' ? AMBER : 'var(--text)' }}>{value}</span>
      <span style={s.statSub}>{sub}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  explain: {
    display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14,
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
    fontSize: 13.5, lineHeight: 1.6,
  },
  error: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, fontSize: 13.5,
    color: 'var(--danger)', background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
    border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
  },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 },
  stat: {
    display: 'flex', flexDirection: 'column', gap: 2, padding: '14px 16px', borderRadius: 14,
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  statLabel: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-3)' },
  statValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: 28, lineHeight: 1.2 },
  statSub: { fontSize: 12.5, color: 'var(--text-3)' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px',
    padding: '12px 14px', borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)',
  },
  rowDone: { padding: '10px 14px' },
  who: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '2 1 250px' },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)',
    color: 'var(--accent-text)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  name: {
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 600, color: 'var(--text)',
    textDecoration: 'none', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  sub: {
    display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', marginTop: 2,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  amountCol: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, flex: '0 0 150px' },
  amount: { fontFamily: 'var(--font-fraunces), serif', fontSize: 19, color: 'var(--text)' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999,
    fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap',
  },
  badgeHeld: { color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  badgeWait: { color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border)' },
  badgeWarn: { color: '#8A5A12', background: 'rgba(255,213,107,0.16)', border: '1px solid rgba(183,121,31,0.3)' },
  badgeOk: { color: 'var(--accent-text)', background: 'transparent', border: '1px solid var(--accent-border)' },
  when: { display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13, minWidth: 0, flex: '1 1 180px' },
  whenSub: { fontSize: 12, color: 'var(--text-3)' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', flex: '1 1 auto' },
  btnRelease: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
    background: 'var(--accent-text)', color: 'var(--bg)', border: '1px solid var(--accent-text)',
    fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnKeep: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
    background: 'var(--surface)', color: '#8A5A12', border: '1px solid rgba(183,121,31,0.35)',
    fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10,
    background: 'var(--surface)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, padding: '24px 12px' },
  emptyTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 20, fontWeight: 400, margin: 0, color: 'var(--text)' },
  emptyText: { fontSize: 13.5, color: 'var(--text-2)', maxWidth: 520, lineHeight: 1.6, margin: 0 },
  foot: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, fontSize: 12.5, color: 'var(--text-3)', margin: 0 },
}
