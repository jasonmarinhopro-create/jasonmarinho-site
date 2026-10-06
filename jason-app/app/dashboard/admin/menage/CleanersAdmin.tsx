'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkle, CheckCircle, X, Clock, ArrowSquareOut, Warning, Star, ShieldCheck, EyeSlash, Eye, Trash, ChatCircle } from '@phosphor-icons/react/dist/ssr'
import { hideCleaner, unhideCleaner, deleteOrphanCleaner } from './actions'
import AdminHero from '../_ui/AdminHero'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import InlineStyle from '@/components/ui/InlineStyle'

type Cleaner = {
  id: string; email: string; full_name: string; pseudo: string | null; ville: string
  zone_couverte: string | null; bio: string | null
  tarif_forfait_min: number | null; tarif_forfait_max: number | null; tarif_heure: number | null
  prestations: string[] | null
  equipe_type: string | null; logements_geres: number | null
  delai_reservation: string | null; langues: string[] | null
  assurance_rc_pro: boolean | null; siret: string | null
  site_url: string | null; instagram_handle: string | null
  telephone: string | null; tier: string; status: string
  slug: string | null
  stripe_subscription_status: string | null
  stripe_subscription_id: string | null
  created_at: string; updated_at: string | null
  views_count: number; contacts_count: number
}

interface Props {
  active: Cleaner[]
  pendingPayment: Cleaner[]
  hidden: Cleaner[]
  cancelled: Cleaner[]
  founderActiveCount: number
  /** Fiches rattachées à un compte admin : exemples, jamais publiées ni comptées */
  demo?: Cleaner[]
  pending?: Cleaner[]
  approvedPendingPayment?: Cleaner[]
  rejected?: Cleaner[]
}

const FOUNDER_QUOTA = 20

const EQUIPE_LABELS: Record<string, string> = {
  solo: 'Solo',
  duo: 'Duo',
  equipe_3_5: 'Équipe 3-5',
  equipe_6_plus: 'Équipe 6+',
}

function fmtAge(iso: string | null): string {
  if (!iso) return '-'
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3600_000)
  if (h < 1) return 'qq min'
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} j`
}
function fmtTarif(c: Cleaner): string {
  if (c.tarif_forfait_min && c.tarif_forfait_max) return `${c.tarif_forfait_min}–${c.tarif_forfait_max} €`
  if (c.tarif_heure) return `${c.tarif_heure} €/h`
  return '-'
}

export default function CleanersAdmin({ active, pendingPayment, hidden, cancelled, founderActiveCount, demo = [] }: Props) {
  const router = useRouter()
  const [busy, startBusy] = useTransition()
  const { confirm, dialog } = useConfirm()
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  function name(c: Cleaner) { return c.pseudo || c.full_name }

  async function handleHide(c: Cleaner) {
    if (!(await confirm({ message: `Masquer ${name(c)} de l'annuaire public ? L'abonnement Stripe reste actif.`, confirmLabel: 'Masquer', danger: true }))) return
    setErr(null); setOk(null)
    startBusy(async () => {
      const res = await hideCleaner(c.id)
      if (res.error) setErr(res.error)
      else { setOk(`${name(c)} masqué.`); router.refresh() }
    })
  }
  function handleUnhide(c: Cleaner) {
    setErr(null); setOk(null)
    startBusy(async () => {
      const res = await unhideCleaner(c.id)
      if (res.error) setErr(res.error)
      else { setOk(`${name(c)} réactivé.`); router.refresh() }
    })
  }
  async function handleDeleteOrphan(c: Cleaner) {
    if (!(await confirm({ message: `Supprimer définitivement ${name(c)} (orphelin sans paiement Stripe) ? Le compte Supabase Auth est aussi supprimé.`, confirmLabel: 'Supprimer', danger: true }))) return
    setErr(null); setOk(null)
    startBusy(async () => {
      const res = await deleteOrphanCleaner(c.id)
      if (res.error) setErr(res.error)
      else { setOk(`${name(c)} supprimé.`); router.refresh() }
    })
  }

  return (
    <section style={s.wrap}>
      {/* Téléphone et tablette : chaque ligne devient une carte (le tableau à
          5 colonnes débordait et coupait les boutons, remarqué par Jason) */}
      <InlineStyle css={`
        .adm-row > * { min-width: 0; overflow-wrap: anywhere }
        @media (max-width: 900px) {
          .adm-thead { display: none !important }
          .adm-row { grid-template-columns: 1fr !important; gap: 6px !important }
          .adm-row > :last-child { justify-content: flex-start !important; margin-top: 4px }
        }
      `} />
      {dialog}
      <AdminHero
        section="Annuaire ménage"
        title="Les équipes de ménage"
        em="de l'annuaire"
        desc="Inscription en libre-service, sans validation : tu interviens seulement pour masquer ou réactiver une fiche, ou supprimer un compte resté sans paiement."
      />
      <header style={s.head}>
        <div style={s.stats}>
          <Kpi v={active.length} l="actifs" color="var(--accent-text)" />
          <Kpi v={`${founderActiveCount}/${FOUNDER_QUOTA}`} l="fondateurs" color="#B7791F" />
          <Kpi v={pendingPayment.length} l="paiement en cours" color="#B7791F" />
          <Kpi v={hidden.length} l="masqués" color="var(--text-muted)" />
        </div>
      </header>

      {err && <div style={s.errBanner}><Warning size={14} weight="fill" /> {err}</div>}
      {ok && <div style={s.okBanner}><CheckCircle size={14} weight="fill" /> {ok}</div>}

      <h3 style={s.sectionTitle}>
        <CheckCircle size={14} weight="fill" /> Équipes actives dans l'annuaire · {active.length}
      </h3>
      {active.length === 0 ? (
        <div style={s.empty}>Aucune équipe active. Les premiers paiements activeront automatiquement les fiches.</div>
      ) : (
        <div style={s.table}>
          <div style={s.theadGrid} className="adm-thead">
            <span>Équipe</span>
            <span>Ville</span>
            <span>Équipe / Tarif</span>
            <span>Stats</span>
            <span style={{ textAlign: 'right' as const }}>Actions</span>
          </div>
          {active.map(c => (
            <div key={c.id} style={s.row} className="adm-row">
              <div>
                <div style={s.cellName}>
                  {c.tier === 'fondateur' && <Star size={11} weight="fill" color="#B7791F" style={{ marginRight: 4 }} />}
                  {name(c)}
                  {c.assurance_rc_pro && <ShieldCheck size={11} weight="fill" color="var(--accent-text)" style={{ marginLeft: 4 }} />}
                </div>
                <div style={s.cellSub}>{c.email}</div>
              </div>
              <div style={s.cellMid}>{c.ville}{c.zone_couverte ? <span style={s.cellSub}> · {c.zone_couverte}</span> : null}</div>
              <div style={s.cellMid}>
                {c.equipe_type ? EQUIPE_LABELS[c.equipe_type] : '-'}{c.logements_geres ? ` · ${c.logements_geres} log.` : ''}
                <br/><span style={s.cellSub}>{fmtTarif(c)}</span>
              </div>
              <div style={s.cellMid}>
                <Eye size={11} weight="bold" /> {c.views_count} · <ChatCircle size={11} weight="bold" /> {c.contacts_count}
                <br/><span style={s.cellSub}>actif depuis {fmtAge(c.created_at)}</span>
              </div>
              <div style={s.actions}>
                <Link href={`/dashboard/ma-fiche-menage?id=${c.id}`} style={s.linkBtn} title="Voir le dashboard exact de l'équipe">
                  <Sparkle size={11} weight="bold" /> Dashboard
                </Link>
                {c.slug && (
                  <a href={`https://jasonmarinho.com/annuaires/menage/${c.slug}`} target="_blank" rel="noopener noreferrer" style={s.linkBtn}>
                    <ArrowSquareOut size={11} weight="bold" /> Fiche pub
                  </a>
                )}
                <button onClick={() => handleHide(c)} disabled={busy} style={s.btnSecondary}>
                  <EyeSlash size={11} weight="bold" /> Masquer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingPayment.length > 0 && (
        <details style={s.collapseSection} open>
          <summary style={s.collapseSummary}>
            <Clock size={12} weight="fill" style={{ marginRight: 4 }} />
            Paiement en cours ou orphelins · {pendingPayment.length}
          </summary>
          <p style={s.helpText}>Inscriptions qui ont créé un compte mais sans paiement Stripe finalisé. Auto-nettoyés au prochain signup avec le même email (rollback intégré).</p>
          <div style={s.table}>
            <div style={s.theadGrid} className="adm-thead">
              <span>Équipe</span>
              <span>Ville</span>
              <span>Email</span>
              <span>Âge</span>
              <span style={{ textAlign: 'right' as const }}>Action</span>
            </div>
            {pendingPayment.map(c => (
              <div key={c.id} style={s.row} className="adm-row">
                <div style={s.cellName}>{name(c)}</div>
                <div style={s.cellMid}>{c.ville}</div>
                <div style={s.cellMid}>{c.email}</div>
                <div style={s.cellMid}>il y a {fmtAge(c.created_at)}</div>
                <div style={s.actions}>
                  <button onClick={() => handleDeleteOrphan(c)} disabled={busy} style={s.btnDanger}>
                    <Trash size={11} weight="bold" /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {demo.length > 0 && (
        <details style={s.collapseSection}>
          <summary style={s.collapseSummary}>
            <Sparkle size={12} weight="fill" style={{ marginRight: 4 }} />
            Fiches d&apos;exemple · {demo.length}
          </summary>
          <p style={s.helpText}>Rattachées à ton compte admin : jamais publiées sur le site ni comptées (chiffres, places Fondateur, Visibilité). Elles servent à tester l&apos;espace pro.</p>
          <div style={s.table}>
            {demo.map(c => (
              <div key={c.id} style={s.row} className="adm-row">
                <div style={s.cellName}>{name(c)}</div>
                <div style={s.cellMid}>{c.ville}</div>
                <div style={s.cellMid}>Exemple</div>
                <div style={s.cellMid}>créée il y a {fmtAge(c.created_at)}</div>
                <div style={s.actions}>
                  <Link href={`/dashboard/ma-fiche-menage?id=${c.id}`} style={s.linkBtn} title="Ouvrir l'espace pro de cet exemple">
                    <Sparkle size={11} weight="bold" /> Dashboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {hidden.length > 0 && (
        <details style={s.collapseSection}>
          <summary style={s.collapseSummary}>
            <EyeSlash size={12} weight="fill" style={{ marginRight: 4 }} />
            Équipes masquées · {hidden.length}
          </summary>
          <p style={s.helpText}>Retirées de l'annuaire par toi (abonnement Stripe toujours actif).</p>
          <div style={s.table}>
            {hidden.map(c => (
              <div key={c.id} style={s.row} className="adm-row">
                <div style={s.cellName}>{name(c)}</div>
                <div style={s.cellMid}>{c.ville}</div>
                <div style={s.cellMid}>{c.email}</div>
                <div style={s.cellMid}>masqué il y a {fmtAge(c.updated_at)}</div>
                <div style={s.actions}>
                  <button onClick={() => handleUnhide(c)} disabled={busy} style={s.btnPrimary}>
                    <Eye size={11} weight="fill" /> Réactiver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {cancelled.length > 0 && (
        <details style={s.collapseSection}>
          <summary style={s.collapseSummary}>
            <X size={12} weight="bold" style={{ marginRight: 4 }} />
            Abonnements résiliés · {cancelled.length}
          </summary>
          <p style={s.helpText}>Abonnement Stripe arrêté. La fiche n'est plus visible.</p>
          <div style={s.table}>
            {cancelled.map(c => (
              <div key={c.id} style={s.row} className="adm-row">
                <div style={s.cellName}>{name(c)}</div>
                <div style={s.cellMid}>{c.ville}</div>
                <div style={s.cellMid}>{c.email}</div>
                <div style={s.cellMid}>résilié il y a {fmtAge(c.updated_at)}</div>
                <div style={s.actions}>
                  <span style={s.cellSub}>Stripe : {c.stripe_subscription_status ?? '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}

function Kpi({ v, l, color }: { v: number | string; l: string; color: string }) {
  return (
    <div style={s.kpi}>
      <span style={{ ...s.kpiV, color }}>{v}</span>
      <span style={s.kpiL}>{l}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 'clamp(20px, 3vw, 44px)', width: '100%', maxWidth: '100%', margin: 0 },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '14px', marginBottom: '20px' },
  title: { fontSize: '22px', fontWeight: 600, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', margin: 0 },
  titleEm: { color: 'var(--accent-text)', fontStyle: 'italic', fontWeight: 300 },
  sub: { fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0', maxWidth: '720px', lineHeight: 1.6 },
  stats: { display: 'flex', gap: '14px', flexWrap: 'wrap' as const },
  kpi: { display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start' },
  kpiV: { fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', lineHeight: 1 },
  kpiL: { fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginTop: '4px' },
  errBanner: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)', borderRadius: '8px', fontSize: '13px', color: 'var(--danger)', marginBottom: '14px' },
  okBanner: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'color-mix(in srgb, var(--accent-text) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-text) 25%, transparent)', borderRadius: '8px', fontSize: '13px', color: 'var(--accent-text)', marginBottom: '14px' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '24px 0 12px' },
  empty: { padding: '24px', textAlign: 'center' as const, background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)' },
  table: { display: 'flex', flexDirection: 'column' as const, gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 8 },
  theadGrid: { display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,2fr) minmax(0,1.5fr) minmax(0,1.5fr)', gap: 12, padding: '10px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  row: { display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,2fr) minmax(0,1.5fr) minmax(0,1.5fr)', gap: 12, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, alignItems: 'center' },
  cellName: { fontSize: 13.5, fontWeight: 600, color: 'var(--text)' },
  cellMid: { fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 },
  cellSub: { fontSize: 11.5, color: 'var(--text-muted)' },
  actions: { display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' as const },
  linkBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11.5, fontWeight: 500, color: 'var(--accent-text)', textDecoration: 'none' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'transparent', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', borderRadius: 7, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  collapseSection: { marginTop: 24 },
  collapseSummary: { cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' as const, letterSpacing: 0.5, padding: '8px 0', userSelect: 'none' as const, listStyle: 'none' as const, display: 'inline-flex', alignItems: 'center' },
  helpText: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: '4px 0 10px', maxWidth: 720 },
}
