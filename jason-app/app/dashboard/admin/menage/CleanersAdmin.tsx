'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkle, CheckCircle, X, Clock, ArrowSquareOut, Warning, Star, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { approveCleaner, rejectCleaner } from './actions'

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
  validated_at: string | null; rejection_reason: string | null
  created_at: string; views_count: number; contacts_count: number
}

interface Props {
  pending: Cleaner[]
  approvedPendingPayment: Cleaner[]
  active: Cleaner[]
  rejected: Cleaner[]
  founderActiveCount: number
}

const FOUNDER_QUOTA = 20

const PRESTATIONS_LABELS: Record<string, string> = {
  menage_standard: 'Ménage standard',
  gestion_linge: 'Gestion du linge',
  repassage: 'Repassage',
  reapprovisionnement: 'Réappro consommables',
  etat_des_lieux_photo: 'État des lieux photo',
  petite_maintenance: 'Petite maintenance',
  nettoyage_exterieur: 'Nettoyage extérieur',
  gestion_dechets: 'Gestion des déchets',
}
const EQUIPE_LABELS: Record<string, string> = {
  solo: 'Solo',
  duo: 'Duo',
  equipe_3_5: 'Équipe 3-5',
  equipe_6_plus: 'Équipe 6+',
}
const DELAI_LABELS: Record<string, string> = {
  jour_meme: 'Jour même',
  '24h': 'Sous 24h',
  '48h': 'Sous 48h',
  '72h': 'Sous 72h',
}

function fmtAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3600_000)
  if (h < 1) return 'qq minutes'
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} j`
}
function fmtEur(n: number | null): string { return n == null ? '—' : `${n} €` }

export default function CleanersAdmin({ pending, approvedPendingPayment, active, rejected, founderActiveCount }: Props) {
  const router = useRouter()
  const [busy, startBusy] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  function handleApprove(c: Cleaner) {
    setErr(null); setOk(null)
    startBusy(async () => {
      const res = await approveCleaner(c.id)
      if (res.error) setErr(res.error)
      else {
        setOk(`${c.pseudo || c.full_name} approuvé — email envoyé avec lien Stripe.`)
        router.refresh()
      }
    })
  }
  function handleReject(c: Cleaner) {
    setErr(null); setOk(null)
    const reason = window.prompt(`Motif du refus pour ${c.pseudo || c.full_name} (≥10 caractères) :`) ?? ''
    if (reason.trim().length < 10) return
    startBusy(async () => {
      const res = await rejectCleaner(c.id, reason)
      if (res.error) setErr(res.error)
      else { setOk(`${c.pseudo || c.full_name} refusé — email envoyé.`); router.refresh() }
    })
  }

  return (
    <section style={s.wrap}>
      <header style={s.head}>
        <div>
          <h2 style={s.title}>
            <Sparkle size={20} weight="duotone" style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-text)' }} />
            Annuaire ménage <em style={s.titleEm}>· admin</em>
          </h2>
          <p style={s.sub}>Validation manuelle des équipes de ménage LCD. Approuver = email Stripe (abonnement annuel). Fiche publique après débit confirmé.</p>
        </div>
        <div style={s.stats}>
          <Kpi v={pending.length} l="en attente" color="#d97706" />
          <Kpi v={approvedPendingPayment.length} l="approuvés (paiement)" color="var(--accent-text)" />
          <Kpi v={active.length} l="actifs" color="var(--success-1)" />
          <Kpi v={`${founderActiveCount}/${FOUNDER_QUOTA}`} l="fondateurs" color="#FFD56B" />
        </div>
      </header>

      {err && <div style={s.errBanner}><Warning size={14} weight="fill" /> {err}</div>}
      {ok && <div style={s.okBanner}><CheckCircle size={14} weight="fill" /> {ok}</div>}

      <h3 style={s.sectionTitle}>
        <Clock size={14} weight="fill" /> File de validation · {pending.length}
      </h3>
      {pending.length === 0 ? (
        <div style={s.empty}>Aucune candidature en attente. Tu peux respirer.</div>
      ) : (
        <div style={s.list}>
          {pending.map(c => {
            const name = c.pseudo || c.full_name
            const prestations = (c.prestations ?? []).map(p => PRESTATIONS_LABELS[p] ?? p).join(', ') || '—'
            const equipe = c.equipe_type ? EQUIPE_LABELS[c.equipe_type] : '—'
            const delai = c.delai_reservation ? DELAI_LABELS[c.delai_reservation] : '—'
            return (
              <div key={c.id} style={s.card}>
                <div style={s.cardHead}>
                  <div>
                    <div style={s.cardName}>
                      {name}
                      {c.assurance_rc_pro && <ShieldCheck size={13} weight="fill" style={{ marginLeft: 6, color: 'var(--success-1)', verticalAlign: 'middle' }} />}
                    </div>
                    <div style={s.cardMeta}>
                      {c.pseudo && c.full_name !== c.pseudo ? `${c.full_name} · ` : ''}
                      {c.ville}{c.zone_couverte ? ` · ${c.zone_couverte}` : ''} · postulé il y a {fmtAge(c.created_at)}
                    </div>
                  </div>
                  {c.site_url && (
                    <a href={c.site_url} target="_blank" rel="noopener noreferrer" style={s.linkBtn}>
                      <ArrowSquareOut size={12} weight="bold" /> Site
                    </a>
                  )}
                </div>
                <div style={s.cardGrid}>
                  <Field k="Email" v={c.email} />
                  <Field k="Équipe" v={`${equipe}${c.logements_geres ? ` · ${c.logements_geres} log.` : ''}`} />
                  <Field k="Forfait turnover" v={c.tarif_forfait_min || c.tarif_forfait_max ? `${fmtEur(c.tarif_forfait_min)} – ${fmtEur(c.tarif_forfait_max)}` : '—'} />
                  <Field k="Tarif horaire" v={c.tarif_heure ? `${c.tarif_heure} €/h` : '—'} />
                  <Field k="Délai résa" v={delai} />
                  <Field k="Langues" v={c.langues?.join(', ').toUpperCase() ?? '—'} />
                  <Field k="SIRET" v={c.siret ?? '—'} />
                  <Field k="Téléphone" v={c.telephone ?? '—'} />
                </div>
                <div style={s.prestaRow}>
                  <span style={s.fieldK}>Prestations</span>
                  <span style={s.prestaList}>{prestations}</span>
                </div>
                {c.bio && <div style={s.bio}>« {c.bio} »</div>}
                <div style={s.actions}>
                  <button onClick={() => handleReject(c)} disabled={busy} style={s.btnSecondary}>
                    <X size={13} weight="bold" /> Refuser
                  </button>
                  <button onClick={() => handleApprove(c)} disabled={busy} style={s.btnPrimary}>
                    <CheckCircle size={13} weight="fill" /> Approuver et envoyer Stripe
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {approvedPendingPayment.length > 0 && (
        <details style={s.collapseSection}>
          <summary style={s.collapseSummary}>Approuvés, paiement en attente · {approvedPendingPayment.length}</summary>
          <div style={s.list}>
            {approvedPendingPayment.map(c => (
              <div key={c.id} style={s.miniRow}>
                <span style={s.miniName}>{c.pseudo || c.full_name}</span>
                <span style={s.miniMeta}>{c.ville} · approuvé il y a {c.validated_at ? fmtAge(c.validated_at) : '?'} · tier {c.tier}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {active.length > 0 && (
        <details style={s.collapseSection}>
          <summary style={s.collapseSummary}>Actifs dans l'annuaire · {active.length}</summary>
          <div style={s.list}>
            {active.map(c => (
              <div key={c.id} style={s.miniRow}>
                <span style={s.miniName}>{c.tier === 'fondateur' && <Star size={11} weight="fill" color="#FFD56B" style={{ marginRight: '4px' }} />}{c.pseudo || c.full_name}</span>
                <span style={s.miniMeta}>
                  {c.ville} · {c.views_count} vues · {c.contacts_count} contacts
                  {c.slug && <> · <a href={`https://jasonmarinho.com/menage/${c.slug}`} target="_blank" rel="noopener" style={{ color: 'var(--accent-text)' }}>voir →</a></>}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {rejected.length > 0 && (
        <details style={s.collapseSection}>
          <summary style={s.collapseSummary}>Rejetés récents · {rejected.length}</summary>
          <div style={s.list}>
            {rejected.map(c => (
              <div key={c.id} style={s.miniRow}>
                <span style={s.miniName}>{c.pseudo || c.full_name}</span>
                <span style={s.miniMeta}>{c.ville} · {c.rejection_reason}</span>
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
function Field({ k, v }: { k: string; v: string }) {
  return (
    <div style={s.field}>
      <span style={s.fieldK}>{k}</span>
      <span style={s.fieldV}>{v}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 'clamp(20px, 3vw, 36px)', maxWidth: '1100px', margin: '0 auto' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '14px', marginBottom: '20px' },
  title: { fontSize: '22px', fontWeight: 600, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', margin: 0 },
  titleEm: { color: 'var(--accent-text)', fontStyle: 'italic', fontWeight: 300 },
  sub: { fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0', maxWidth: '620px', lineHeight: 1.6 },
  stats: { display: 'flex', gap: '14px', flexWrap: 'wrap' as const },
  kpi: { display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start' },
  kpiV: { fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', lineHeight: 1 },
  kpiL: { fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginTop: '4px' },
  errBanner: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '13px', color: 'var(--danger)', marginBottom: '14px' },
  okBanner: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', fontSize: '13px', color: 'var(--success-1)', marginBottom: '14px' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '24px 0 12px' },
  empty: { padding: '24px', textAlign: 'center' as const, background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)' },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  card: { padding: '18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const },
  cardName: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  cardMeta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' },
  linkBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--accent-text)', textDecoration: 'none' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' },
  field: { display: 'flex', flexDirection: 'column' as const },
  fieldK: { fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.4px', fontWeight: 600 },
  fieldV: { fontSize: '13.5px', color: 'var(--text)', marginTop: '2px' },
  prestaRow: { padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  prestaList: { fontSize: '13px', color: 'var(--text-2)' },
  bio: { padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.55 },
  actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  collapseSection: { marginTop: '24px' },
  collapseSummary: { cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', padding: '8px 0', userSelect: 'none' as const, listStyle: 'none' as const },
  miniRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', flexWrap: 'wrap' as const },
  miniName: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' },
  miniMeta: { fontSize: '12px', color: 'var(--text-muted)' },
}
