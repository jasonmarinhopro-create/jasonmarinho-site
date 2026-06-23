'use client'

import { useState, useTransition } from 'react'
import { Camera, FloppyDisk, ArrowSquareOut, CreditCard, Eye, ChatCircle, Calendar, Warning, CheckCircle, Star } from '@phosphor-icons/react/dist/ssr'
import { updatePhotographerFiche, createCustomerPortalSession } from './actions'

type Photographer = {
  id: string; email: string; full_name: string; ville: string
  zone_couverte: string | null; bio: string | null; specialite: string | null
  tarif_min: number | null; tarif_max: number | null
  portfolio_url: string; instagram_handle: string | null
  telephone: string | null
  tier: string; status: string
  slug: string | null
  stripe_subscription_status: string | null
  views_count: number; contacts_count: number
  created_at: string
}

interface Props {
  photographer: Photographer
  kpis: { views: number; contacts: number; daysActive: number }
}

export default function MaFichePhotographe({ photographer, kpis }: Props) {
  const [form, setForm] = useState({
    full_name: photographer.full_name,
    ville: photographer.ville,
    zone_couverte: photographer.zone_couverte ?? '',
    bio: photographer.bio ?? '',
    specialite: photographer.specialite ?? '',
    tarif_min: photographer.tarif_min ?? null,
    tarif_max: photographer.tarif_max ?? null,
    portfolio_url: photographer.portfolio_url,
    instagram_handle: photographer.instagram_handle ?? '',
    telephone: photographer.telephone ?? '',
  })
  const [busy, startBusy] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [portalBusy, setPortalBusy] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setOk(null)
    startBusy(async () => {
      const res = await updatePhotographerFiche({
        full_name: form.full_name,
        ville: form.ville,
        zone_couverte: form.zone_couverte || null,
        bio: form.bio || null,
        specialite: form.specialite || null,
        tarif_min: form.tarif_min,
        tarif_max: form.tarif_max,
        portfolio_url: form.portfolio_url,
        instagram_handle: form.instagram_handle || null,
        telephone: form.telephone || null,
      })
      if (res.error) setErr(res.error)
      else setOk('Fiche sauvegardée. La version publique se met à jour sous 2-3 minutes.')
    })
  }

  async function handlePortal() {
    setPortalBusy(true)
    const res = await createCustomerPortalSession()
    setPortalBusy(false)
    if (res.url) window.location.href = res.url
    else setErr(res.error ?? 'Erreur portail Stripe.')
  }

  const isActive = photographer.status === 'active'
  const isPending = photographer.status === 'pending_payment' || photographer.status === 'approved_pending_payment'
  const isFondateur = photographer.tier === 'fondateur'
  const publicUrl = photographer.slug ? `https://jasonmarinho.com/photographes/${photographer.slug}` : null

  return (
    <section style={s.wrap}>
      <header style={s.head}>
        <div>
          <h2 style={s.title}>
            <Camera size={20} weight="duotone" style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-text)' }} />
            Ma fiche photographe <em style={s.titleEm}>{isFondateur ? '· fondateur' : ''}</em>
          </h2>
          <p style={s.sub}>
            Édite ta fiche, suis tes stats, gère ton abonnement annuel.{' '}
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={s.publicLink}>
                Voir ma fiche publique <ArrowSquareOut size={11} weight="bold" />
              </a>
            )}
          </p>
        </div>
        {isFondateur && (
          <div style={s.founderBadge}>
            <Star size={12} weight="fill" /> Membre Fondateur — tarif à vie
          </div>
        )}
      </header>

      {!isActive && (
        <div style={isPending ? s.warnBanner : s.errBanner}>
          <Warning size={14} weight="fill" />
          {isPending
            ? 'Ta fiche n\'est pas encore publique. Statut Stripe : ' + (photographer.stripe_subscription_status ?? 'en attente') + '.'
            : 'Ta fiche est ' + photographer.status + '. Contacte contact@jasonmarinho.com.'}
        </div>
      )}

      <div style={s.kpiRow}>
        <Kpi v={kpis.views} l="Vues fiche" Icon={Eye} />
        <Kpi v={kpis.contacts} l="Contacts reçus" Icon={ChatCircle} />
        <Kpi v={kpis.daysActive} l="Jours d'activité" Icon={Calendar} />
      </div>

      {err && <div style={s.errBanner}><Warning size={14} weight="fill" /> {err}</div>}
      {ok && <div style={s.okBanner}><CheckCircle size={14} weight="fill" /> {ok}</div>}

      <form onSubmit={handleSave} style={s.form}>
        <h3 style={s.sectionTitle}>Identité et contact</h3>
        <div style={s.grid2}>
          <Field label="Nom complet" req>
            <input style={s.input} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
          </Field>
          <Field label="Email (non modifiable)">
            <input style={{ ...s.input, opacity: 0.55 }} value={photographer.email} disabled />
          </Field>
        </div>
        <div style={s.grid2}>
          <Field label="Ville principale" req>
            <input style={s.input} value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} required maxLength={80} />
          </Field>
          <Field label="Zone couverte">
            <input style={s.input} value={form.zone_couverte} onChange={e => setForm({ ...form, zone_couverte: e.target.value })} maxLength={200} placeholder="Lyon + 60 km" />
          </Field>
        </div>
        <div style={s.grid2}>
          <Field label="Téléphone (optionnel)">
            <input style={s.input} value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} maxLength={30} />
          </Field>
          <Field label="Instagram (sans @)">
            <input style={s.input} value={form.instagram_handle} onChange={e => setForm({ ...form, instagram_handle: e.target.value })} maxLength={50} />
          </Field>
        </div>

        <h3 style={s.sectionTitle}>Activité professionnelle</h3>
        <Field label="Lien portfolio (site ou Instagram)" req>
          <input style={s.input} type="url" value={form.portfolio_url} onChange={e => setForm({ ...form, portfolio_url: e.target.value })} required maxLength={300} />
        </Field>
        <Field label="Spécialité">
          <select style={s.input} value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })}>
            <option value="">— Choisir —</option>
            <option>Intérieurs LCD</option>
            <option>Intérieurs + drone extérieur</option>
            <option>Intérieurs + vidéo / Reels</option>
            <option>Visite virtuelle Matterport 3D</option>
            <option>Hôtels et gîtes de charme</option>
            <option>Architecture + mise en scène</option>
          </select>
        </Field>
        <div style={s.grid2}>
          <Field label="Tarif min session (€)">
            <input style={s.input} type="number" min={0} max={5000} value={form.tarif_min ?? ''} onChange={e => setForm({ ...form, tarif_min: e.target.value ? parseInt(e.target.value, 10) : null })} />
          </Field>
          <Field label="Tarif max session (€)">
            <input style={s.input} type="number" min={0} max={5000} value={form.tarif_max ?? ''} onChange={e => setForm({ ...form, tarif_max: e.target.value ? parseInt(e.target.value, 10) : null })} />
          </Field>
        </div>

        <h3 style={s.sectionTitle}>Présentation</h3>
        <Field label={`Bio (${form.bio.length}/600)`}>
          <textarea style={{ ...s.input, minHeight: 110, resize: 'vertical' as const }} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} maxLength={600} />
        </Field>

        <div style={s.actions}>
          <button type="submit" disabled={busy} style={s.btnPrimary}>
            <FloppyDisk size={14} weight="bold" /> {busy ? 'Sauvegarde…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>

      <div style={s.subscriptionCard}>
        <div>
          <h3 style={{ ...s.sectionTitle, marginTop: 0 }}>Mon abonnement</h3>
          <p style={s.subscriptionMeta}>
            {isFondateur ? '39,98 €' : '79,98 €'} TTC / an · Statut : <strong>{photographer.stripe_subscription_status ?? '—'}</strong>
          </p>
        </div>
        <button onClick={handlePortal} disabled={portalBusy} style={s.btnSecondary}>
          <CreditCard size={14} weight="bold" /> {portalBusy ? 'Chargement…' : 'Gérer mon abonnement'}
        </button>
      </div>
    </section>
  )
}

function Kpi({ v, l, Icon }: { v: number | string; l: string; Icon: any }) {
  return (
    <div style={s.kpi}>
      <Icon size={18} weight="duotone" color="var(--accent-text)" />
      <div>
        <div style={s.kpiV}>{v}</div>
        <div style={s.kpiL}>{l}</div>
      </div>
    </div>
  )
}
function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <label style={s.field}>
      <span style={s.fieldLabel}>{label}{req && <span style={{ color: '#dc2626' }}> *</span>}</span>
      {children}
    </label>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 'clamp(20px, 3vw, 44px)', width: '100%', maxWidth: 1200, margin: '0 auto' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 14, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', margin: 0 },
  titleEm: { color: '#FFD56B', fontStyle: 'italic', fontWeight: 300 },
  sub: { fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.6 },
  publicLink: { color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 },
  founderBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.35)', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#b8860b' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 22 },
  kpi: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 },
  kpiV: { fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', lineHeight: 1 },
  kpiL: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: 0.4, fontWeight: 600, marginTop: 4 },
  errBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontSize: 13, color: 'var(--danger)', marginBottom: 14 },
  warnBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, fontSize: 13, color: '#d97706', marginBottom: 14 },
  okBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, fontSize: 13, color: 'var(--success-1)', marginBottom: 14 },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 14, padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' as const, letterSpacing: 0.5, margin: '14px 0 6px' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 5 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-2)' },
  input: { padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', width: '100%' },
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  subscriptionCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 14, padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 },
  subscriptionMeta: { fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' },
}
