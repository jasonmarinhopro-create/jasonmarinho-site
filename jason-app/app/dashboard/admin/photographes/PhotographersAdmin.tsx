'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle, X, Clock, ArrowSquareOut, Warning, Star } from '@phosphor-icons/react/dist/ssr'
import { approvePhotographer, rejectPhotographer } from './actions'

type Photographer = {
  id: string; email: string; full_name: string; ville: string
  zone_couverte: string | null; bio: string | null; specialite: string | null
  tarif_min: number | null; tarif_max: number | null
  portfolio_url: string; instagram_handle: string | null
  telephone: string | null; tier: string; status: string
  slug: string | null
  validated_at: string | null; rejection_reason: string | null
  created_at: string; views_count: number; contacts_count: number
}

interface Props {
  pending: Photographer[]
  approvedPendingPayment: Photographer[]
  active: Photographer[]
  rejected: Photographer[]
  founderActiveCount: number
}

const FOUNDER_QUOTA = 20

function fmtAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3600_000)
  if (h < 1) return 'qq minutes'
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} j`
}
function fmtEur(n: number | null): string { return n == null ? '—' : `${n} €` }

export default function PhotographersAdmin({ pending, approvedPendingPayment, active, rejected, founderActiveCount }: Props) {
  const router = useRouter()
  const [busy, startBusy] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  function handleApprove(p: Photographer) {
    setErr(null); setOk(null)
    startBusy(async () => {
      const res = await approvePhotographer(p.id)
      if (res.error) setErr(res.error)
      else {
        setOk(`${p.full_name} approuvé — email envoyé avec lien Stripe.`)
        router.refresh()
      }
    })
  }
  function handleReject(p: Photographer) {
    setErr(null); setOk(null)
    const reason = window.prompt(`Motif du refus pour ${p.full_name} (≥10 caractères) :`) ?? ''
    if (reason.trim().length < 10) return
    startBusy(async () => {
      const res = await rejectPhotographer(p.id, reason)
      if (res.error) setErr(res.error)
      else { setOk(`${p.full_name} refusé — email envoyé.`); router.refresh() }
    })
  }

  return (
    <section style={s.wrap}>
      <header style={s.head}>
        <div>
          <h2 style={s.title}>
            <Camera size={20} weight="duotone" style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-text)' }} />
            Annuaire photographes <em style={s.titleEm}>· admin</em>
          </h2>
          <p style={s.sub}>Validation manuelle des candidatures. Approuver = email Stripe au photographe (paiement annuel). Le profil devient public après débit confirmé.</p>
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

      {/* En attente */}
      <h3 style={s.sectionTitle}>
        <Clock size={14} weight="fill" /> File de validation · {pending.length}
      </h3>
      {pending.length === 0 ? (
        <div style={s.empty}>Aucune candidature en attente. Tu peux respirer.</div>
      ) : (
        <div style={s.list}>
          {pending.map(p => (
            <div key={p.id} style={s.card}>
              <div style={s.cardHead}>
                <div>
                  <div style={s.cardName}>{p.full_name}</div>
                  <div style={s.cardMeta}>
                    {p.ville}{p.zone_couverte ? ` · ${p.zone_couverte}` : ''} · postulé il y a {fmtAge(p.created_at)}
                  </div>
                </div>
                <a href={p.portfolio_url} target="_blank" rel="noopener noreferrer" style={s.linkBtn}>
                  <ArrowSquareOut size={12} weight="bold" /> Portfolio
                </a>
              </div>
              <div style={s.cardGrid}>
                <Field k="Email" v={p.email} />
                <Field k="Spécialité" v={p.specialite ?? '—'} />
                <Field k="Tarifs" v={p.tarif_min || p.tarif_max ? `${fmtEur(p.tarif_min)} – ${fmtEur(p.tarif_max)}` : '—'} />
                <Field k="Instagram" v={p.instagram_handle ?? '—'} />
                <Field k="Téléphone" v={p.telephone ?? '—'} />
              </div>
              {p.bio && <div style={s.bio}>« {p.bio} »</div>}
              <div style={s.actions}>
                <button onClick={() => handleReject(p)} disabled={busy} style={s.btnSecondary}>
                  <X size={13} weight="bold" /> Refuser
                </button>
                <button onClick={() => handleApprove(p)} disabled={busy} style={s.btnPrimary}>
                  <CheckCircle size={13} weight="fill" /> Approuver et envoyer Stripe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approuvés en attente paiement */}
      {approvedPendingPayment.length > 0 && (
        <details style={s.collapseSection}>
          <summary style={s.collapseSummary}>Approuvés, paiement en attente · {approvedPendingPayment.length}</summary>
          <div style={s.list}>
            {approvedPendingPayment.map(p => (
              <div key={p.id} style={s.miniRow}>
                <span style={s.miniName}>{p.full_name}</span>
                <span style={s.miniMeta}>{p.ville} · approuvé il y a {p.validated_at ? fmtAge(p.validated_at) : '?'} · tier {p.tier}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Actifs */}
      {active.length > 0 && (
        <details style={s.collapseSection}>
          <summary style={s.collapseSummary}>Actifs dans l'annuaire · {active.length}</summary>
          <div style={s.list}>
            {active.map(p => (
              <div key={p.id} style={s.miniRow}>
                <span style={s.miniName}>{p.tier === 'fondateur' && <Star size={11} weight="fill" color="#FFD56B" style={{ marginRight: '4px' }} />}{p.full_name}</span>
                <span style={s.miniMeta}>
                  {p.ville} · {p.views_count} vues · {p.contacts_count} contacts
                  {p.slug && <> · <a href={`https://jasonmarinho.com/photographes/${p.slug}`} target="_blank" rel="noopener" style={{ color: 'var(--accent-text)' }}>voir →</a></>}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Rejetés */}
      {rejected.length > 0 && (
        <details style={s.collapseSection}>
          <summary style={s.collapseSummary}>Rejetés récents · {rejected.length}</summary>
          <div style={s.list}>
            {rejected.map(p => (
              <div key={p.id} style={s.miniRow}>
                <span style={s.miniName}>{p.full_name}</span>
                <span style={s.miniMeta}>{p.ville} · {p.rejection_reason}</span>
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
  wrap: { padding: 'clamp(20px, 3vw, 44px)', width: '100%', maxWidth: '1600px', margin: '0 auto' },
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
