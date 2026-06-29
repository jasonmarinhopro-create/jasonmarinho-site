'use client'

import { useState, useTransition } from 'react'
import { Sparkle, FloppyDisk, ArrowSquareOut, CreditCard, Eye, ChatCircle, Calendar, Warning, CheckCircle, Star, ShieldCheck, UploadSimple, Trash } from '@phosphor-icons/react/dist/ssr'
import { updateCleanerFiche, createCustomerPortalSession, uploadCleanerLogo, deleteCleanerLogo } from './actions'

type Cleaner = {
  id: string; email: string; full_name: string; pseudo: string | null; ville: string
  zone_couverte: string | null; bio: string | null
  tarif_forfait_min: number | null; tarif_forfait_max: number | null; tarif_heure: number | null
  prestations: string[] | null
  equipe_type: string | null; logements_geres: number | null
  delai_reservation: string | null; langues: string[] | null
  assurance_rc_pro: boolean | null; siret: string | null
  site_url: string | null; instagram_handle: string | null
  telephone: string | null
  tier: string; status: string
  slug: string | null
  stripe_subscription_status: string | null
  views_count: number; contacts_count: number
  created_at: string
  logo_url: string | null
}

interface Props {
  cleaner: Cleaner
  kpis: { views: number; contacts: number; daysActive: number }
  isAdminPreview?: boolean
}

const PRESTATIONS: Array<[string, string]> = [
  ['menage_standard', 'Ménage standard'],
  ['gestion_linge', 'Gestion du linge'],
  ['repassage', 'Repassage'],
  ['reapprovisionnement', 'Réappro consommables'],
  ['etat_des_lieux_photo', 'État des lieux photo'],
  ['petite_maintenance', 'Petite maintenance'],
  ['nettoyage_exterieur', 'Nettoyage extérieur'],
  ['gestion_dechets', 'Gestion des déchets'],
]
const LANGUES: Array<[string, string]> = [
  ['fr', 'Français'], ['en', 'English'], ['es', 'Español'], ['it', 'Italiano'],
  ['de', 'Deutsch'], ['pt', 'Português'], ['ar', 'العربية'],
]

export default function MaFicheMenage({ cleaner, kpis, isAdminPreview = false }: Props) {
  const [form, setForm] = useState({
    full_name: cleaner.full_name,
    pseudo: cleaner.pseudo ?? '',
    ville: cleaner.ville,
    zone_couverte: cleaner.zone_couverte ?? '',
    bio: cleaner.bio ?? '',
    tarif_forfait_min: cleaner.tarif_forfait_min ?? null,
    tarif_forfait_max: cleaner.tarif_forfait_max ?? null,
    tarif_heure: cleaner.tarif_heure ?? null,
    prestations: new Set(cleaner.prestations ?? []),
    equipe_type: cleaner.equipe_type ?? '',
    logements_geres: cleaner.logements_geres ?? null,
    delai_reservation: cleaner.delai_reservation ?? '',
    langues: new Set(cleaner.langues ?? ['fr']),
    assurance_rc_pro: !!cleaner.assurance_rc_pro,
    siret: cleaner.siret ?? '',
    site_url: cleaner.site_url ?? '',
    instagram_handle: cleaner.instagram_handle ?? '',
    telephone: cleaner.telephone ?? '',
  })
  const [busy, startBusy] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [portalBusy, setPortalBusy] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(cleaner.logo_url)
  const [logoBusy, setLogoBusy] = useState(false)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(null); setOk(null); setLogoBusy(true)
    const fd = new FormData()
    fd.append('logo', file)
    if (isAdminPreview) fd.append('targetId', cleaner.id)
    const res = await uploadCleanerLogo(fd)
    setLogoBusy(false)
    if (res.error) setErr(res.error)
    else if (res.url) { setLogoUrl(res.url); setOk('Logo mis à jour.') }
    e.target.value = ''
  }

  async function handleLogoDelete() {
    if (!window.confirm('Supprimer le logo ?')) return
    setErr(null); setOk(null); setLogoBusy(true)
    const res = await deleteCleanerLogo(isAdminPreview ? cleaner.id : undefined)
    setLogoBusy(false)
    if (res.error) setErr(res.error)
    else { setLogoUrl(null); setOk('Logo supprimé.') }
  }

  function toggle(setName: 'prestations' | 'langues', key: string) {
    const next = new Set(form[setName])
    if (next.has(key)) next.delete(key); else next.add(key)
    setForm({ ...form, [setName]: next })
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setOk(null)
    startBusy(async () => {
      const res = await updateCleanerFiche({
        targetId: isAdminPreview ? cleaner.id : undefined,
        full_name: form.full_name,
        pseudo: form.pseudo || null,
        ville: form.ville,
        zone_couverte: form.zone_couverte || null,
        bio: form.bio || null,
        tarif_forfait_min: form.tarif_forfait_min,
        tarif_forfait_max: form.tarif_forfait_max,
        tarif_heure: form.tarif_heure,
        prestations: Array.from(form.prestations),
        equipe_type: form.equipe_type || null,
        logements_geres: form.logements_geres,
        delai_reservation: form.delai_reservation || null,
        langues: Array.from(form.langues),
        assurance_rc_pro: form.assurance_rc_pro,
        siret: form.siret || null,
        site_url: form.site_url || null,
        instagram_handle: form.instagram_handle || null,
        telephone: form.telephone || null,
      })
      if (res.error) setErr(res.error)
      else setOk(res.adminEdit
        ? `Fiche de ${cleaner.pseudo || cleaner.full_name} modifiée par admin. La version publique se met à jour sous 2-3 minutes.`
        : 'Fiche sauvegardée. La version publique se met à jour sous 2-3 minutes.')
    })
  }

  async function handlePortal() {
    setPortalBusy(true)
    const res = await createCustomerPortalSession(isAdminPreview ? cleaner.id : undefined)
    setPortalBusy(false)
    if (res.url) window.location.href = res.url
    else setErr(res.error ?? 'Erreur portail Stripe.')
  }

  const isActive = cleaner.status === 'active'
  const isPending = cleaner.status === 'pending_payment' || cleaner.status === 'approved_pending_payment'
  const isFondateur = cleaner.tier === 'fondateur'
  const publicUrl = cleaner.slug ? `https://jasonmarinho.com/annuaires/menage/${cleaner.slug}` : null

  return (
    <section style={s.wrap}>
      {isAdminPreview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(255,213,107,0.10)', border: '1px solid rgba(255,213,107,0.35)', borderRadius: 10, fontSize: 13, color: '#b8860b', marginBottom: 18 }}>
          <Star size={14} weight="fill" />
          <strong>Mode admin :</strong> tu édites la fiche de <strong>{cleaner.pseudo || cleaner.full_name}</strong> pour son compte. Les modifications « Enregistrer » et l'ouverture du portail Stripe agissent au nom de l'équipe.{' '}
          <a href="/dashboard/admin/menage" style={{ color: '#b8860b', textDecoration: 'underline', marginLeft: 'auto' }}>← Retour admin</a>
        </div>
      )}
      <header style={s.head}>
        <div>
          <h2 style={s.title}>
            <Sparkle size={20} weight="duotone" style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-text)' }} />
            Ma fiche équipe ménage <em style={s.titleEm}>{isFondateur ? '· fondatrice' : ''}</em>
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
            <Star size={12} weight="fill" /> Équipe Fondatrice — tarif à vie
          </div>
        )}
      </header>

      {!isActive && (
        <div style={isPending ? s.warnBanner : s.errBanner}>
          <Warning size={14} weight="fill" />
          {isPending
            ? 'Ta fiche n\'est pas encore publique. Statut Stripe : ' + (cleaner.stripe_subscription_status ?? 'en attente') + '.'
            : 'Ta fiche est ' + cleaner.status + '. Contacte contact@jasonmarinho.com.'}
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
        <h3 style={s.sectionTitle}>Logo de l'équipe</h3>
        <div style={s.logoRow}>
          <div style={{ ...s.logoPreview, background: logoUrl ? `url('${logoUrl}') center/cover` : 'rgba(0,76,63,0.08)' }}>
            {!logoUrl && <span style={s.logoInitials}>{(cleaner.pseudo || cleaner.full_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={s.logoHint}>Format carré recommandé. JPEG, PNG ou WebP. Max 500 KB. Apparaît sur ta fiche publique et dans la liste de l'annuaire.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              <label style={{ ...s.btnSecondary, cursor: logoBusy ? 'wait' : 'pointer', opacity: logoBusy ? 0.5 : 1 }}>
                <UploadSimple size={13} weight="bold" /> {logoUrl ? 'Remplacer' : 'Uploader'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoUpload} disabled={logoBusy} style={{ display: 'none' }} />
              </label>
              {logoUrl && (
                <button type="button" onClick={handleLogoDelete} disabled={logoBusy} style={{ ...s.btnSecondary, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
                  <Trash size={13} weight="bold" /> Supprimer
                </button>
              )}
            </div>
          </div>
        </div>

        <h3 style={s.sectionTitle}>Identité</h3>
        <div style={s.grid2}>
          <Field label="Nom du gérant·e" req>
            <input style={s.input} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
          </Field>
          <Field label="Nom commercial / marque">
            <input style={s.input} value={form.pseudo} onChange={e => setForm({ ...form, pseudo: e.target.value })} maxLength={100} />
          </Field>
        </div>
        <div style={s.grid2}>
          <Field label="Email (non modifiable)">
            <input style={{ ...s.input, opacity: 0.55 }} value={cleaner.email} disabled />
          </Field>
          <Field label="Téléphone">
            <input style={s.input} value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} maxLength={30} />
          </Field>
        </div>
        <div style={s.grid2}>
          <Field label="Ville principale" req>
            <input style={s.input} value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} required maxLength={80} />
          </Field>
          <Field label="Zone couverte">
            <input style={s.input} value={form.zone_couverte} onChange={e => setForm({ ...form, zone_couverte: e.target.value })} maxLength={200} />
          </Field>
        </div>
        <div style={s.grid2}>
          <Field label="Site web">
            <input style={s.input} type="url" value={form.site_url} onChange={e => setForm({ ...form, site_url: e.target.value })} maxLength={300} placeholder="https://..." />
          </Field>
          <Field label="Instagram (sans @)">
            <input style={s.input} value={form.instagram_handle} onChange={e => setForm({ ...form, instagram_handle: e.target.value })} maxLength={50} />
          </Field>
        </div>

        <h3 style={s.sectionTitle}>Prestations</h3>
        <div style={s.chipGrid}>
          {PRESTATIONS.map(([k, label]) => (
            <label key={k} style={{ ...s.chip, ...(form.prestations.has(k) ? s.chipOn : {}) }}>
              <input type="checkbox" checked={form.prestations.has(k)} onChange={() => toggle('prestations', k)} style={{ accentColor: 'var(--accent-text)' }} />
              {label}
            </label>
          ))}
        </div>

        <h3 style={s.sectionTitle}>Capacité & disponibilité</h3>
        <div style={s.grid2}>
          <Field label="Taille de l'équipe">
            <select style={s.input} value={form.equipe_type} onChange={e => setForm({ ...form, equipe_type: e.target.value })}>
              <option value="">— Choisir —</option>
              <option value="solo">Solo</option>
              <option value="duo">Duo</option>
              <option value="equipe_3_5">Équipe 3-5</option>
              <option value="equipe_6_plus">Équipe 6+</option>
            </select>
          </Field>
          <Field label="Logements LCD gérés actuellement">
            <input style={s.input} type="number" min={0} max={999} value={form.logements_geres ?? ''} onChange={e => setForm({ ...form, logements_geres: e.target.value ? parseInt(e.target.value, 10) : null })} />
          </Field>
        </div>
        <Field label="Délai de réservation minimum">
          <select style={s.input} value={form.delai_reservation} onChange={e => setForm({ ...form, delai_reservation: e.target.value })}>
            <option value="">— Choisir —</option>
            <option value="jour_meme">Disponible jour même</option>
            <option value="24h">Sous 24h</option>
            <option value="48h">Sous 48h</option>
            <option value="72h">Sous 72h</option>
          </select>
        </Field>
        <Field label="Langues parlées">
          <div style={s.chipGrid}>
            {LANGUES.map(([k, label]) => (
              <label key={k} style={{ ...s.chip, ...(form.langues.has(k) ? s.chipOn : {}) }}>
                <input type="checkbox" checked={form.langues.has(k)} onChange={() => toggle('langues', k)} style={{ accentColor: 'var(--accent-text)' }} />
                {label}
              </label>
            ))}
          </div>
        </Field>

        <h3 style={s.sectionTitle}>Tarifs</h3>
        <div style={s.grid2}>
          <Field label="Forfait turnover min (€)">
            <input style={s.input} type="number" min={0} max={999} value={form.tarif_forfait_min ?? ''} onChange={e => setForm({ ...form, tarif_forfait_min: e.target.value ? parseInt(e.target.value, 10) : null })} />
          </Field>
          <Field label="Forfait turnover max (€)">
            <input style={s.input} type="number" min={0} max={999} value={form.tarif_forfait_max ?? ''} onChange={e => setForm({ ...form, tarif_forfait_max: e.target.value ? parseInt(e.target.value, 10) : null })} />
          </Field>
        </div>
        <Field label="Tarif horaire (optionnel)">
          <input style={s.input} type="number" min={0} max={200} value={form.tarif_heure ?? ''} onChange={e => setForm({ ...form, tarif_heure: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="€/h" />
        </Field>

        <h3 style={s.sectionTitle}>Garanties professionnelles</h3>
        <label style={s.rcRow}>
          <input type="checkbox" checked={form.assurance_rc_pro} onChange={e => setForm({ ...form, assurance_rc_pro: e.target.checked })} style={{ accentColor: 'var(--accent-text)', width: 18, height: 18 }} />
          <ShieldCheck size={16} weight="fill" color="var(--success-1)" />
          <span>Mon équipe est couverte par une assurance Responsabilité Civile Professionnelle</span>
        </label>
        <Field label="SIRET (optionnel, 14 chiffres)">
          <input style={s.input} value={form.siret} onChange={e => setForm({ ...form, siret: e.target.value })} maxLength={14} placeholder="14 chiffres sans espaces" />
        </Field>

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
            {isFondateur ? '39,98 €' : '79,98 €'} TTC / an · Statut : <strong>{cleaner.stripe_subscription_status ?? '—'}</strong>
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
  wrap: { padding: 'clamp(20px, 3vw, 44px)', width: '100%' },
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
  chipGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, padding: 10, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, background: 'transparent', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer' },
  chipOn: { background: 'rgba(99,214,131,0.10)', borderColor: 'rgba(99,214,131,0.45)', color: 'var(--success-1)', fontWeight: 600 },
  rcRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13.5, color: 'var(--text)', cursor: 'pointer' },
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  subscriptionCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 14, padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 },
  subscriptionMeta: { fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' },
  logoRow: { display: 'flex', gap: 18, padding: 14, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, flexWrap: 'wrap' as const, alignItems: 'center' },
  logoPreview: { width: 100, height: 100, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' as const, border: '1px solid var(--border)' },
  logoInitials: { fontSize: 32, fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, color: 'var(--accent-text)' },
  logoHint: { fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.6 },
}
