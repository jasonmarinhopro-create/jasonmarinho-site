'use client'

import Link from 'next/link'
import ViewsTrend from '@/components/pros/ViewsTrend'
import FacturationTeaser from '@/components/pros/FacturationTeaser'
import PortfolioManager from '@/components/pros/PortfolioManager'
import type { ViewsTrend as ViewsTrendData } from '@/lib/pros/views'
import { useState, useTransition } from 'react'
import { Camera, Images, FloppyDisk, ArrowSquareOut, CreditCard, Eye, ChatCircle, Calendar, Warning, CheckCircle, Star, UploadSimple, Trash, CursorClick } from '@phosphor-icons/react/dist/ssr'
import { updatePhotographerFiche, createCustomerPortalSession, uploadPhotographerLogo, deletePhotographerLogo, preparePortfolioUploads, addPortfolioPhotos, removePortfolioPhoto, movePortfolioPhoto } from './actions'
import ShareFicheBlock from '@/components/pro/ShareFicheBlock'
import HubHero, { HeroEm, heroCard, heroCta } from '@/components/dashboard/HubHero'
import { useConfirm } from '@/components/ui/ConfirmDialog'

const AMBER = '#B7791F'
const AMBER_DARK = '#8A5A12'

// Statuts Stripe en clair (avant : valeur brute « past_due », « incomplete »…)
const STRIPE_LABELS: Record<string, string> = {
  active: 'actif', trialing: 'période d’essai', past_due: 'paiement en retard', unpaid: 'impayé',
  canceled: 'résilié', incomplete: 'paiement à finaliser', incomplete_expired: 'paiement expiré', paused: 'en pause',
}
const stripeLabel = (st: string | null) => (st ? STRIPE_LABELS[st] ?? st : 'en attente')
const FICHE_LABELS: Record<string, string> = { hidden: 'masquée de l’annuaire', cancelled: 'résiliée', suspended: 'suspendue' }

type Photographer = {
  id: string; email: string; full_name: string; ville: string
  zone_couverte: string | null; bio: string | null; specialite: string | null
  tarif_min: number | null; tarif_max: number | null
  portfolio_url: string; instagram_handle: string | null
  portfolio_photos?: string[] | null
  telephone: string | null
  tier: string; status: string
  slug: string | null
  stripe_subscription_status: string | null
  views_count: number; contacts_count: number
  created_at: string
  logo_url: string | null
}

interface Props {
  photographer: Photographer
  kpis: { views: number; contacts: number; clics: number; daysActive: number }
  isAdminPreview?: boolean
  viewsTrend?: ViewsTrendData
  portfolioPublicBase?: string
}

export default function MaFichePhotographe({ photographer, kpis, isAdminPreview = false, viewsTrend, portfolioPublicBase }: Props) {
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
  const [logoUrl, setLogoUrl] = useState<string | null>(photographer.logo_url)
  const [logoBusy, setLogoBusy] = useState(false)
  const { confirm, dialog } = useConfirm()

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(null); setOk(null); setLogoBusy(true)
    const fd = new FormData()
    fd.append('logo', file)
    if (isAdminPreview) fd.append('targetId', photographer.id)
    const res = await uploadPhotographerLogo(fd)
    setLogoBusy(false)
    if (res.error) setErr(res.error)
    else if (res.url) { setLogoUrl(res.url); setOk('Logo mis à jour.') }
    e.target.value = ''
  }

  async function handleLogoDelete() {
    if (!(await confirm({ message: 'Supprimer le logo de ta fiche ?', confirmLabel: 'Supprimer', danger: true }))) return
    setErr(null); setOk(null); setLogoBusy(true)
    const res = await deletePhotographerLogo(isAdminPreview ? photographer.id : undefined)
    setLogoBusy(false)
    if (res.error) setErr(res.error)
    else { setLogoUrl(null); setOk('Logo supprimé.') }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setOk(null)
    startBusy(async () => {
      const res = await updatePhotographerFiche({
        targetId: isAdminPreview ? photographer.id : undefined,
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
      else setOk(res.adminEdit
        ? `Fiche de ${photographer.full_name} modifiée par l’admin. La version publique se met à jour sous 2 à 3 minutes.`
        : 'Fiche enregistrée. La version publique se met à jour sous 2 à 3 minutes.')
    })
  }

  async function handlePortal() {
    setPortalBusy(true)
    const res = await createCustomerPortalSession(isAdminPreview ? photographer.id : undefined)
    setPortalBusy(false)
    if (res.url) window.location.href = res.url
    else setErr(res.error ?? 'Erreur portail Stripe.')
  }

  const isActive = photographer.status === 'active'
  const isPending = photographer.status === 'pending_payment' || photographer.status === 'approved_pending_payment'
  const isFondateur = photographer.tier === 'fondateur'
  const publicUrl = photographer.slug ? `https://jasonmarinho.com/annuaires/photographes/${photographer.slug}` : null

  const displayName = photographer.full_name
  const stats: Array<[number, string, typeof Eye]> = [
    [kpis.views, 'vues de ta fiche', Eye],
    [kpis.clics, 'clics portfolio ou Instagram', CursorClick],
    [kpis.contacts, 'demandes reçues', ChatCircle],
    [kpis.daysActive, 'jours dans l’annuaire', Calendar],
  ]

  return (
    <section style={s.wrap}>
      {dialog}
      {isAdminPreview && (
        <div style={s.adminBanner}>
          <Star size={14} weight="fill" />
          <span><strong>Mode admin :</strong> tu modifies la fiche de <strong>{displayName}</strong>. « Enregistrer » et le portail Stripe agissent au nom du photographe. Ses demandes reçues et ses clients restent privés.</span>
          <Link href="/dashboard/admin/photographes" style={{ color: AMBER_DARK, textDecoration: 'underline', marginLeft: 'auto' }}>Retour à l’admin</Link>
        </div>
      )}
      <HubHero
        eyebrowIcon={<Camera size={14} weight="fill" />}
        eyebrow={isFondateur ? 'Ma fiche photographe · Membre fondateur' : 'Ma fiche photographe'}
        title={<>Ton travail, <HeroEm>vu par les hôtes</HeroEm>{photographer.ville ? ` de ${photographer.ville}` : ''}</>}
        desc="Les hôtes choisissent leur photographe dans l’annuaire de Jason Marinho en regardant d’abord les photos. Un portfolio bien rempli et des tarifs clairs t’apportent plus de demandes : elles arrivent dans Demandes reçues et par email."
        aside={
          <div style={{ ...heroCard, flex: '1 1 100%', minWidth: 0 }}>
            <div style={s.asideTitle}>{isActive ? 'Ta fiche est en ligne' : isPending ? 'Ta fiche n’est pas encore publique' : `Ta fiche est ${FICHE_LABELS[photographer.status] ?? photographer.status}`}</div>
            <div style={s.statGrid}>
              {stats.map(([v, l, Icon]) => (
                <div key={l} style={s.statCell}>
                  <Icon size={15} weight="duotone" color="var(--accent-text)" />
                  <span style={s.statV}>{v}</span>
                  <span style={s.statL}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px' }}>
          {isActive && publicUrl && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={heroCta}>
              Voir ma fiche publique <ArrowSquareOut size={15} weight="bold" />
            </a>
          )}
          {isFondateur && (
            <span style={s.founderBadge}><Star size={12} weight="fill" /> Membre fondateur, tarif à vie</span>
          )}
        </div>
      </HubHero>

      {!isActive && (
        <div style={isPending ? s.warnBanner : s.errBanner}>
          <Warning size={14} weight="fill" />
          {isPending
            ? `Ta fiche n’est pas encore publique (abonnement : ${stripeLabel(photographer.stripe_subscription_status)}). Elle apparaît dans l’annuaire dès que l’abonnement est actif.`
            : `Ta fiche est ${FICHE_LABELS[photographer.status] ?? photographer.status}. Écris à contact@jasonmarinho.com pour la réactiver.`}
        </div>
      )}

      {err && <div style={s.errBanner}><Warning size={14} weight="fill" /> {err}</div>}
      {ok && <div style={s.okBanner}><CheckCircle size={14} weight="fill" /> {ok}</div>}

      <div style={s.cols}>
      <div style={s.colMain}>
      {portfolioPublicBase && (
        <section style={s.portfolioCard}>
          <h3 style={{ ...s.cardTitle }}><Images size={17} weight="duotone" color="var(--accent-text)" /> Mon portfolio</h3>
          <PortfolioManager
            initial={photographer.portfolio_photos ?? []}
            publicBase={portfolioPublicBase}
            targetId={isAdminPreview ? photographer.id : undefined}
            onPrepare={preparePortfolioUploads}
            onAdd={addPortfolioPhotos}
            onRemove={removePortfolioPhoto}
            onMove={movePortfolioPhoto}
          />
        </section>
      )}

      <form onSubmit={handleSave} style={s.form}>
        <h3 style={s.sectionTitle}>Logo / avatar</h3>
        <div style={s.logoRow}>
          <div style={{ ...s.logoPreview, background: logoUrl ? `url('${logoUrl}') center/cover` : 'var(--accent-bg)' }}>
            {!logoUrl && <span style={s.logoInitials}>{(photographer.full_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={s.logoHint}>Format carré recommandé. JPEG, PNG ou WebP. Max 500 KB. Apparaît sur ta fiche publique et dans la liste de l'annuaire.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              <label style={{ ...s.btnSecondary, cursor: logoBusy ? 'wait' : 'pointer', opacity: logoBusy ? 0.5 : 1 }}>
                <UploadSimple size={13} weight="bold" /> {logoUrl ? 'Remplacer' : 'Ajouter un logo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoUpload} disabled={logoBusy} style={{ display: 'none' }} />
              </label>
              {logoUrl && (
                <button type="button" onClick={handleLogoDelete} disabled={logoBusy} style={{ ...s.btnSecondary, color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}>
                  <Trash size={13} weight="bold" /> Supprimer
                </button>
              )}
            </div>
          </div>
        </div>

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
            <option value="">Choisir</option>
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

      </div>
      <aside style={s.colSide}>
        {isActive && publicUrl && (
          <ShareFicheBlock url={publicUrl} displayName={displayName} />
        )}
        {viewsTrend && <ViewsTrend trend={viewsTrend} metier="photographe" style={{ margin: 0 }} />}
        {!isAdminPreview && <FacturationTeaser href="/dashboard/ma-fiche-photographe/devis" />}
        <div style={s.subscriptionCard}>
          <div>
            <h3 style={{ ...s.sectionTitle, marginTop: 0 }}><CreditCard size={15} weight="duotone" color="var(--accent-text)" /> Mon abonnement</h3>
            <p style={s.subscriptionMeta}>
              {isFondateur ? '39,98 €' : '79,98 €'} TTC par an · {stripeLabel(photographer.stripe_subscription_status)}
            </p>
          </div>
          <button onClick={handlePortal} disabled={portalBusy} style={s.btnSecondary}>
            {portalBusy ? 'Chargement…' : 'Gérer mon abonnement'}
          </button>
        </div>
      </aside>
      </div>
    </section>
  )
}

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <label style={s.field}>
      <span style={s.fieldLabel}>{label}{req && <span style={{ color: 'var(--danger-text)' }}> *</span>}</span>
      {children}
    </label>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 'clamp(20px, 3vw, 44px)', width: '100%' },
  adminBanner: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: 10, padding: '10px 16px', background: 'rgba(255,213,107,0.14)', border: `1px solid ${AMBER}55`, borderRadius: 12, fontSize: 13, color: AMBER_DARK, marginBottom: 18 },
  founderBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,213,107,0.22)', border: `1px solid ${AMBER}55`, borderRadius: 999, fontSize: 12.5, fontWeight: 700, color: AMBER_DARK },
  asideTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, color: 'var(--text)' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 4 },
  statCell: { display: 'flex', flexDirection: 'column' as const, gap: 2, padding: '10px 12px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' },
  statV: { fontFamily: 'var(--font-fraunces), serif', fontSize: 22, color: 'var(--text)', lineHeight: 1.1 },
  statL: { fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.3 },
  // 2 colonnes au-delà de ~1200 px : portfolio + formulaire à gauche, partage / vues / abonnement à droite
  cols: { display: 'flex', flexWrap: 'wrap' as const, gap: 20, alignItems: 'flex-start' },
  colMain: { flex: '999 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: 20 },
  colSide: { flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: 16 },
  portfolioCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 400, color: 'var(--text)', margin: '0 0 8px' },
  errBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10, fontSize: 13, color: 'var(--danger-text)', marginBottom: 14 },
  warnBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,213,107,0.18)', border: `1px solid ${AMBER}55`, borderRadius: 10, fontSize: 13, color: AMBER_DARK, marginBottom: 14 },
  okBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 10, fontSize: 13, color: 'var(--accent-text)', marginBottom: 14 },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 14, padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' as const, letterSpacing: 0.5, margin: '14px 0 6px' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 5 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-2)' },
  input: { padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', width: '100%' },
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  subscriptionCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 14, padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 },
  subscriptionMeta: { fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' },
  logoRow: { display: 'flex', gap: 18, padding: 14, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, flexWrap: 'wrap' as const, alignItems: 'center' },
  logoPreview: { width: 100, height: 100, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' as const, border: '1px solid var(--border)' },
  logoInitials: { fontSize: 32, fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, color: 'var(--accent-text)' },
  logoHint: { fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.6 },
}
