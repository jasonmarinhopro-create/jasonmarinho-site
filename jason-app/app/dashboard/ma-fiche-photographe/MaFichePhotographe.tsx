'use client'

// Ma fiche photographe / vidéaste : atelier (27/10/2026, maquettes validées par
// Jason). Coquille et barre de mise en ligne : components/pros/atelier/Atelier.tsx ;
// brouillon : lib/pros/fiche-draft.ts. Les champs, leurs vérifications et ce
// qui part sur la fiche publique sont ceux d'avant (actions.ts).
import GrowText from '@/components/pros/GrowText'
import Link from 'next/link'
import ViewsTrend from '@/components/pros/ViewsTrend'
import FicheCompletude from '@/components/pros/FicheCompletude'
import FacturationTeaser from '@/components/pros/FacturationTeaser'
import type { ViewsTrend as ViewsTrendData } from '@/lib/pros/views'
import { useEffect, useMemo, useState } from 'react'
import { Images, Tag, Camera, MapPin, PencilSimpleLine, ListNumbers, LinkSimple, UserCircle, CreditCard, Warning, CheckCircle, Star, UploadSimple, Trash, Phone, Info, InstagramLogo } from '@phosphor-icons/react/dist/ssr'
import { publishFiche, saveFicheDraft, createCustomerPortalSession, resumeFichePayment, uploadPhotographerLogo, deletePhotographerLogo, prepareFichePhotos, addFichePhotos, removeFichePhoto, moveFichePhoto, publishFichePhotos } from './actions'
import PortfolioManager from '@/components/pros/PortfolioManager'
import FicheVitrineFields, { initialVitrineForm, vitrinePayload, type VitrineForm } from '@/components/pros/FicheVitrineFields'
import ShareFicheBlock from '@/components/pro/ShareFicheBlock'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import ReseauxFields, { emptyReseauxForm, type ReseauxForm } from '@/components/pros/ReseauxFields'
import VisuelFields, { type VisuelForm } from '@/components/pros/VisuelFields'
import ClientelesFields from '@/components/pros/ClientelesFields'
import { readClienteles, type Clientele } from '@/lib/pros/clienteles'
import { readMetier, readOptions, metierLabel } from '@/lib/pros/visuel'
import { DEFAULT_DEROULE, PHOTOS_MAX, isLegacyPhoto } from '@/lib/pros/fiche-vitrine'
import { changedSections, revertSections, mergeDraftState, readDraft, newerDraft, type DraftSection, type DraftTouched } from '@/lib/pros/fiche-draft'
import Atelier, { type AtelierSection, type PublishState } from '@/components/pros/atelier/Atelier'
import { useFicheDraft, readLocalDraft } from '@/components/pros/atelier/useFicheDraft'
import { atelierInput as inp, Field, Group, Toggle, ui } from '@/components/pros/atelier/ui'
import { zoneSummary, prixDes, tarifsDepuisFormules } from '@/lib/pros/atelier-resumes'
import ZoneEditor from '@/components/pros/atelier/ZoneEditor'
import { locateCommunes } from '@/app/dashboard/pros-geo-actions'

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
  telephone: string | null
  telephone_public?: boolean | null
  clienteles?: string[] | null
  tier: string; status: string
  slug: string | null
  stripe_subscription_status: string | null
  views_count: number; contacts_count: number
  created_at: string
  logo_url: string | null
  reseaux?: unknown
  portfolio_photos?: string[] | null
  formules?: unknown
  villes_couvertes?: unknown
  deroule?: unknown
  metier?: string | null
  options?: string[] | null
  video_url?: string | null
  fiche_draft?: unknown
}

interface Props {
  photographer: Photographer
  kpis: { views: number; contacts: number; clics: number; daysActive: number }
  isAdminPreview?: boolean
  viewsTrend?: ViewsTrendData
  /** Carte « Tes statistiques » (chargée à part par la page) */
  statsSlot?: React.ReactNode
  /** Retour de Stripe Checkout (?paid=1 / ?canceled=1) */
  paymentNotice?: 'paid' | 'canceled' | null
  /** Positions des communes (zone) : action serveur, remplaçable pour les essais */
  locate?: typeof locateCommunes
}

type State = {
  form: {
    full_name: string; ville: string; zone_couverte: string; bio: string; specialite: string
    tarif_min: number | null; tarif_max: number | null
    portfolio_url: string; instagram_handle: string; telephone: string; telephone_public: boolean
  }
  reseaux: ReseauxForm
  clienteles: Clientele[]
  visuel: VisuelForm
  vitrine: VitrineForm
}

function stateFrom(p: Photographer): State {
  return {
    form: {
      full_name: p.full_name, ville: p.ville, zone_couverte: p.zone_couverte ?? '', bio: p.bio ?? '', specialite: p.specialite ?? '',
      tarif_min: p.tarif_min ?? null, tarif_max: p.tarif_max ?? null,
      portfolio_url: p.portfolio_url ?? '', instagram_handle: p.instagram_handle ?? '', telephone: p.telephone ?? '', telephone_public: !!p.telephone_public,
    },
    reseaux: emptyReseauxForm(p.reseaux),
    clienteles: readClienteles(p.clienteles),
    visuel: { metier: readMetier(p.metier), options: readOptions(p.options), video_url: p.video_url ?? '' },
    vitrine: initialVitrineForm(p, 'photographe'),
  }
}

/** Ce que chaque partie modifie (pour « 3 modifications : formules, zone… » et « Annuler ») */
const SECTIONS: DraftSection[] = [
  { id: 'photos', paths: [], touched: 'photos' },
  { id: 'formules', paths: ['vitrine.formules', 'form.tarif_min', 'form.tarif_max'] },
  { id: 'offre', paths: ['visuel', 'form.specialite', 'clienteles'] },
  { id: 'zone', paths: ['form.ville', 'form.zone_couverte', 'vitrine.villes'] },
  { id: 'presentation', paths: ['form.bio'] },
  { id: 'deroule', paths: ['vitrine.deroule'] },
  { id: 'contact', paths: ['form.telephone', 'form.telephone_public', 'form.portfolio_url', 'form.instagram_handle', 'reseaux'] },
  { id: 'identite', paths: ['form.full_name'], touched: 'logo' },
]

/** Ancres de la jauge de complétude → partie de l'atelier */
const ANCHORS: Record<string, string> = {
  'mes-photos': 'photos', formules: 'formules', tarifs: 'formules', activite: 'offre', villes: 'zone',
  presentation: 'presentation', deroule: 'deroule', logo: 'identite',
}

/** Message d'erreur du serveur → partie à ouvrir */
function sectionOfError(msg: string): string | undefined {
  if (/vidéo/i.test(msg)) return 'offre'
  if (/site|portfolio|lien|google|facebook|linkedin|tiktok|youtube|pinterest/i.test(msg)) return 'contact'
  if (/nom et ville/i.test(msg)) return 'identite'
  return undefined
}

const SPECIALITES = ['Intérieurs LCD', 'Intérieurs + drone extérieur', 'Intérieurs + vidéo / Reels', 'Vidéo de visite du logement', 'Visite virtuelle Matterport 3D', 'Hôtels et gîtes de charme', 'Architecture + mise en scène']

export default function MaFichePhotographe({ photographer, kpis, isAdminPreview = false, viewsTrend, statsSlot, paymentNotice = null, locate = locateCommunes }: Props) {
  const serverDraft = readDraft<State>(photographer.fiche_draft)
  const [baseline, setBaseline] = useState<State>(() => stateFrom(photographer))
  const [st, setSt] = useState<State>(() => mergeDraftState(stateFrom(photographer), serverDraft?.state ?? null))
  const [touched, setTouched] = useState<DraftTouched>(() => serverDraft?.touched ?? {})
  const [active, setActive] = useState('photos')
  const [photos, setPhotos] = useState<string[]>(photographer.portfolio_photos ?? [])
  const [publish, setPublish] = useState<PublishState>({ kind: 'idle' })
  const [err, setErr] = useState<string | null>(null)
  const [portalBusy, setPortalBusy] = useState(false)
  const [payBusy, setPayBusy] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(photographer.logo_url)
  const [logoBusy, setLogoBusy] = useState(false)
  const { confirm, dialog } = useConfirm()
  const targetId = isAdminPreview ? photographer.id : undefined
  const storageKey = `jm-atelier-photographe-${photographer.id}`

  const pending = useMemo(() => changedSections(SECTIONS, st, baseline, touched), [st, baseline, touched])
  const draft = useFicheDraft({ state: st, touched, hasChanges: pending.length > 0, storageKey, save: d => saveFicheDraft(d, targetId) })

  // Brouillon gardé dans ce navigateur (réseau coupé) plus récent que celui du serveur : repris
  useEffect(() => {
    const local = readLocalDraft<State>(storageKey)
    if (local && newerDraft(serverDraft, local) === local) {
      setSt(mergeDraftState(stateFrom(photographer), local.state))
      setTouched(local.touched)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setForm = (patch: Partial<State['form']>) => setSt(s => ({ ...s, form: { ...s.form, ...patch } }))
  const f = st.form
  // Une nouvelle modification après une mise en ligne : la barre repasse en « à mettre en ligne »
  useEffect(() => {
    if (pending.length && (publish.kind === 'done' || publish.kind === 'error')) setPublish({ kind: 'idle' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.length, st])

  // Fourchette de l'annuaire tirée des formules chiffrées (étape 2)
  const tarifs = tarifsDepuisFormules(st.vitrine.formules, f.tarif_min, f.tarif_max)

  async function handlePublish() {
    setPublish({ kind: 'publishing' }); setErr(null)
    const res = await publishFiche({
      targetId,
      full_name: f.full_name, ville: f.ville, zone_couverte: f.zone_couverte || null, bio: f.bio || null,
      specialite: f.specialite || null, tarif_min: tarifs.min, tarif_max: tarifs.max,
      portfolio_url: f.portfolio_url, instagram_handle: f.instagram_handle || null,
      telephone: f.telephone || null, telephone_public: f.telephone_public && !!f.telephone.trim(),
      clienteles: st.clienteles, reseaux: st.reseaux,
      metier: st.visuel.metier, options: st.visuel.options, video_url: st.visuel.video_url || null,
      ...vitrinePayload(st.vitrine),
    })
    if (res.error) { setPublish({ kind: 'error', message: res.error, section: sectionOfError(res.error) }); return }
    setBaseline(st); setTouched({})
    setPublish({ kind: 'done', live: !!res.live, warning: res.warning, rebuildFailed: res.rebuildFailed })
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(null); setLogoBusy(true)
    const fd = new FormData()
    fd.append('logo', file)
    if (targetId) fd.append('targetId', targetId)
    const res = await uploadPhotographerLogo(fd)
    setLogoBusy(false)
    if (res.error) setErr(res.error)
    else if (res.url) { setLogoUrl(res.url); setTouched(t => ({ ...t, logo: true })) }
    e.target.value = ''
  }

  async function handleLogoDelete() {
    if (!(await confirm({ message: 'Supprimer le logo de ta fiche ?', confirmLabel: 'Supprimer', danger: true }))) return
    setErr(null); setLogoBusy(true)
    const res = await deletePhotographerLogo(targetId)
    setLogoBusy(false)
    if (res.error) setErr(res.error)
    else { setLogoUrl(null); setTouched(t => ({ ...t, logo: true })) }
  }

  // Paiement abandonné : rouvre Stripe Checkout sans refaire le formulaire
  async function handlePay() {
    setErr(null); setPayBusy(true)
    const res = await resumeFichePayment()
    if (res.checkoutUrl) { window.location.href = res.checkoutUrl; return }
    setPayBusy(false)
    if (res.error) setErr(res.error)
    else if (res.info) setErr(res.info)
  }

  // Aperçu admin : la page Stripe que le pro verrait, sans rien changer à sa fiche
  async function handlePreviewPay() {
    const okGo = await confirm({
      message: `Tu vas voir la page de paiement Stripe que verrait ${photographer.full_name}. Ne paie pas : le paiement serait pris sur ta carte et activerait sa fiche.`,
      confirmLabel: 'Ouvrir la page',
    })
    if (!okGo) return
    setErr(null); setPayBusy(true)
    const res = await resumeFichePayment(photographer.id)
    if (res.checkoutUrl) { window.location.href = res.checkoutUrl; return }
    setPayBusy(false)
    if (res.error || res.info) setErr(res.error ?? res.info ?? null)
  }

  async function handlePortal() {
    setPortalBusy(true)
    const res = await createCustomerPortalSession(targetId)
    setPortalBusy(false)
    if (res.url) window.location.href = res.url
    else setErr(res.error ?? 'Erreur portail Stripe.')
  }

  const isActive = photographer.status === 'active'
  const isPending = photographer.status === 'pending_payment' || photographer.status === 'approved_pending_payment'
  const subRunning = ['active', 'trialing', 'past_due'].includes(photographer.stripe_subscription_status ?? '')
  const canPay = isPending && !isAdminPreview && !subRunning && paymentNotice !== 'paid'
  const isFondateur = photographer.tier === 'fondateur'
  const publicUrl = photographer.slug ? `https://jasonmarinho.com/annuaires/photographes/${photographer.slug}` : null

  // ── Résumés d'une ligne ────────────────────────────────────────────
  const nPhotos = photos.filter(p => !isLegacyPhoto(p)).length
  const des = prixDes(st.vitrine.formules, f.tarif_min)
  const nFormules = st.vitrine.formules.filter(x => x.nom.trim()).length
  const derouleDefault = st.vitrine.deroule.every((e, i) => e.titre === DEFAULT_DEROULE.photographe[i]?.titre && e.texte === DEFAULT_DEROULE.photographe[i]?.texte)
  const nReseaux = Object.values(st.reseaux).filter(v => v.trim()).length
  const contactBits = [f.portfolio_url && 'site', f.instagram_handle && 'Instagram', f.telephone && 'téléphone', nReseaux && `${nReseaux} réseau${nReseaux > 1 ? 'x' : ''}`].filter(Boolean) as string[]

  const sections: AtelierSection[] = [
    {
      id: 'photos', group: 'Ta vitrine', label: 'Photos', icon: <Images size={17} weight="duotone" />, noRevert: true,
      summary: nPhotos ? `${nPhotos} sur ${PHOTOS_MAX}, la première en couverture` : 'Aucune photo pour l’instant',
      attention: nPhotos < 3 ? (nPhotos ? `Encore ${3 - nPhotos} photo${3 - nPhotos > 1 ? 's' : ''} conseillée${3 - nPhotos > 1 ? 's' : ''}` : 'Ajoute tes premières photos') : null,
      done: nPhotos >= 3,
      title: <>Tes <em style={em}>photos</em></>,
      desc: 'C’est ce que les hôtes regardent en premier. La première photo est ta couverture, dans l’annuaire et en haut de ta fiche.',
      content: (
        <PortfolioManager
          initial={photographer.portfolio_photos ?? []}
          targetId={targetId}
          ficheUrl={isActive ? publicUrl : null}
          onPrepare={prepareFichePhotos} onAdd={addFichePhotos} onRemove={removeFichePhoto} onMove={moveFichePhoto} onPublish={publishFichePhotos}
          onChanged={list => { setPhotos(list); setTouched(t => ({ ...t, photos: true })) }}
        />
      ),
    },
    {
      id: 'formules', group: 'Ta vitrine', label: 'Formules et prix', icon: <Tag size={17} weight="duotone" />,
      summary: nFormules ? `${nFormules} formule${nFormules > 1 ? 's' : ''}${des ? `, dès ${des} €` : ''}` : des ? `Dès ${des} €` : 'Pas encore de prix',
      attention: !nFormules && !des ? 'Ajoute un prix de départ' : null,
      done: nFormules > 0 && !!des,
      title: <>Formules et <em style={em}>prix</em></>,
      desc: 'C’est ce que les hôtes comparent en premier. Trois formules claires, avec ce qui est compris, rassurent plus qu’une fourchette.',
      content: (
        <>
          <FicheVitrineFields part="formules" value={st.vitrine} onChange={v => setSt(s => ({ ...s, vitrine: v }))} metier="photographe" inputStyle={inp} titleStyle={{}} />
          {tarifs.auto ? (
            <div style={infoLine}>
              <Info size={18} weight="duotone" color="var(--accent-text)" style={{ flexShrink: 0 }} />
              <span>Ton prix d’appel <strong style={{ color: 'var(--text)' }}>« dès {tarifs.min} € »</strong>{tarifs.max ? <> et ta fourchette jusqu’à {tarifs.max} €</> : null} sont calculés depuis tes formules. Plus rien à remplir à part.</span>
            </div>
          ) : (
          <Group title="Sans formule chiffrée : ta fourchette de prix">
            <div style={ui.grid2}>
              <Field label="À partir de (€)">
                <input style={inp} type="number" min={0} max={5000} value={f.tarif_min ?? ''} onChange={e => setForm({ tarif_min: e.target.value ? parseInt(e.target.value, 10) : null })} />
              </Field>
              <Field label="Jusqu’à (€)">
                <input style={inp} type="number" min={0} max={5000} value={f.tarif_max ?? ''} onChange={e => setForm({ tarif_max: e.target.value ? parseInt(e.target.value, 10) : null })} />
              </Field>
            </div>
          </Group>
          )}
        </>
      ),
    },
    {
      id: 'offre', group: 'Ton offre', label: 'Ce que tu proposes', icon: <Camera size={17} weight="duotone" />,
      summary: [metierLabel(st.visuel.metier), st.visuel.options.length ? `${st.visuel.options.length} option${st.visuel.options.length > 1 ? 's' : ''}` : null].filter(Boolean).join(', '),
      done: st.visuel.options.length > 0 || st.visuel.metier !== 'photo',
      title: <>Ce que tu <em style={em}>proposes</em></>,
      desc: 'Les hôtes filtrent l’annuaire avec ces réponses : chaque option cochée te fait apparaître dans une recherche de plus.',
      content: (
        <>
          <VisuelFields value={st.visuel} onChange={v => setSt(s => ({ ...s, visuel: v }))} inputStyle={inp} />
          <Field label="Ta spécialité" hint="Une ligne sous ton nom dans l’annuaire.">
            <select style={inp} value={f.specialite} onChange={e => setForm({ specialite: e.target.value })}>
              <option value="">Choisir</option>
              {SPECIALITES.map(x => <option key={x}>{x}</option>)}
              {f.specialite && !SPECIALITES.includes(f.specialite) && <option>{f.specialite}</option>}
            </select>
          </Field>
          <ClientelesFields value={st.clienteles} onChange={v => setSt(s => ({ ...s, clienteles: v }))} />
        </>
      ),
    },
    {
      id: 'zone', group: 'Ton offre', label: 'Où tu interviens', icon: <MapPin size={17} weight="duotone" />,
      summary: zoneSummary(f.ville, f.zone_couverte, st.vitrine.villes.length),
      done: !!f.ville && (st.vitrine.villes.length > 0 || /\d\s?km/i.test(f.zone_couverte)),
      title: <>Où tu <em style={em}>interviens</em></>,
      desc: 'Ta ville, un rayon et quelques villes en plus : ta fiche dessine la carte toute seule, et les hôtes vérifient en un clic si leur logement est dans ta zone.',
      content: (
        <>
          <ZoneEditor ville={f.ville} zone={f.zone_couverte} villes={st.vitrine.villes} locate={locate}
            onChange={n => setSt(s => ({ ...s, form: { ...s.form, ...(n.ville !== undefined ? { ville: n.ville } : {}), ...(n.zone !== undefined ? { zone_couverte: n.zone } : {}) }, vitrine: n.villes ? { ...s.vitrine, villes: n.villes } : s.vitrine }))} />
        </>
      ),
    },
    {
      id: 'presentation', group: 'Ton histoire', label: 'Présentation', icon: <PencilSimpleLine size={17} weight="duotone" />,
      summary: f.bio.trim() ? `${f.bio.trim().length} caractères` : 'Pas encore écrite',
      attention: f.bio.trim().length < 80 ? 'À écrire : quelques phrases suffisent' : null,
      done: f.bio.trim().length >= 80,
      title: <>Ta <em style={em}>présentation</em></>,
      desc: 'Quelques phrases sur ta façon de travailler. La première est mise en avant sur ta fiche et dans Google.',
      content: (
        <Field label="Ce que les hôtes lisent sur ta fiche">
          <GrowText style={{ ...inp, minHeight: 160 }} value={f.bio} onChange={v => setForm({ bio: v })} max={600} oneLine={false} minRows={6} />
        </Field>
      ),
    },
    {
      id: 'deroule', group: 'Ton histoire', label: 'Comment ça se passe', icon: <ListNumbers size={17} weight="duotone" />,
      summary: derouleDefault ? '3 étapes proposées par défaut' : 'Tes 3 étapes',
      done: !derouleDefault,
      title: <>Comment ça se <em style={em}>passe</em></>,
      desc: 'Trois étapes pour rassurer l’hôte : la demande, le jour J, la livraison. Écris les tiennes, le texte proposé est le même sur toutes les fiches.',
      content: <FicheVitrineFields part="deroule" value={st.vitrine} onChange={v => setSt(s => ({ ...s, vitrine: v }))} metier="photographe" inputStyle={inp} titleStyle={{}} />,
    },
    {
      id: 'contact', group: 'Contact', label: 'Téléphone et liens', icon: <LinkSimple size={17} weight="duotone" />,
      summary: contactBits.length ? contactBits.join(', ') : 'Aucun lien pour l’instant',
      done: contactBits.length >= 2,
      title: <>Téléphone et <em style={em}>liens</em></>,
      desc: 'Les hôtes t’écrivent depuis ta fiche. Ton site, ton Instagram et ta fiche Google leur montrent le reste de ton travail.',
      content: (
        <>
          <Field label="Téléphone (facultatif)">
            <input style={inp} type="tel" value={f.telephone} onChange={e => setForm({ telephone: e.target.value })} maxLength={30} autoComplete="tel" />
          </Field>
          {f.telephone.trim() && (
            <Toggle checked={f.telephone_public} onChange={v => setForm({ telephone_public: v })} icon={<Phone size={18} weight="bold" />}
              label="Afficher mon numéro sur ma fiche" sub="Un bouton « Appeler » apparaît à côté de « Demander un devis »." />
          )}
          <Field label="Ton site ou portfolio">
            <input style={inp} type="text" inputMode="url" autoCapitalize="off" spellCheck={false} placeholder="monsite.fr" value={f.portfolio_url} onChange={e => setForm({ portfolio_url: e.target.value })} maxLength={300} />
          </Field>
          <ReseauxFields value={st.reseaux} onChange={v => setSt(s => ({ ...s, reseaux: v }))} inputStyle={inp} before={
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}><InstagramLogo size={15} weight="bold" color="var(--accent-text)" /> Instagram</span>
              <input style={inp} value={f.instagram_handle} onChange={e => setForm({ instagram_handle: e.target.value.replace(/^@/, '') })} maxLength={50} autoCapitalize="off" spellCheck={false} placeholder="toncompte" />
            </label>
          } />
        </>
      ),
    },
    {
      id: 'identite', group: 'Rarement modifié', label: 'Identité et logo', icon: <UserCircle size={17} weight="duotone" />,
      summary: [f.full_name, logoUrl ? 'logo' : null].filter(Boolean).join(', '),
      done: !!logoUrl,
      title: <>Identité et <em style={em}>logo</em></>,
      desc: 'Ton nom et ton logo apparaissent sur ta fiche et dans l’annuaire. Le logo remplace tes initiales.',
      content: (
        <>
          <div style={logoRow}>
            <div style={{ ...logoPreview, background: logoUrl ? `url('${logoUrl}') center/cover` : 'var(--accent-bg)' }}>
              {!logoUrl && <span style={logoInitials}>{(f.full_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '0 0 10px', lineHeight: 1.55 }}>Carré de préférence. JPEG, PNG ou WebP, 500 Ko au plus.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <label style={{ ...ui.btnGhost, cursor: logoBusy ? 'wait' : 'pointer', opacity: logoBusy ? 0.5 : 1 }}>
                  <UploadSimple size={14} weight="bold" /> {logoUrl ? 'Remplacer' : 'Ajouter un logo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoUpload} disabled={logoBusy} style={{ display: 'none' }} />
                </label>
                {logoUrl && (
                  <button type="button" onClick={handleLogoDelete} disabled={logoBusy} style={{ ...ui.btnGhost, color: 'var(--danger-text)', border: '1px solid var(--danger-border)' }}>
                    <Trash size={14} weight="bold" /> Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
          <div style={ui.grid2}>
            <Field label="Nom affiché" req>
              <input style={inp} value={f.full_name} onChange={e => setForm({ full_name: e.target.value })} required maxLength={100} />
            </Field>
            <Field label="E-mail du compte" hint="Pour le changer, écris à contact@jasonmarinho.com.">
              <input style={{ ...inp, opacity: 0.6 }} value={photographer.email} disabled />
            </Field>
          </div>
        </>
      ),
    },
    {
      id: 'abonnement', group: 'Rarement modifié', label: 'Abonnement', icon: <CreditCard size={17} weight="duotone" />,
      summary: `${isFondateur ? '39,98 €' : '79,98 €'} par an, ${stripeLabel(photographer.stripe_subscription_status)}`,
      title: <>Ton <em style={em}>abonnement</em></>,
      content: (
        <>
          <div style={subCard}>
            <div>
              <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 22 }}>{isFondateur ? '39,98 €' : '79,98 €'} <span style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'inherit' }}>TTC par an</span></div>
              <div style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 4 }}>Abonnement {stripeLabel(photographer.stripe_subscription_status)}</div>
            </div>
            {canPay ? (
              <button type="button" onClick={handlePay} disabled={payBusy} style={ui.btnGhost}>{payBusy ? 'Ouverture…' : 'Finaliser mon paiement'}</button>
            ) : (
              <button type="button" onClick={handlePortal} disabled={portalBusy} style={ui.btnGhost}>{portalBusy ? 'Chargement…' : 'Gérer mon abonnement'}</button>
            )}
          </div>
          {!isAdminPreview && <FacturationTeaser href="/dashboard/ma-fiche-photographe/devis" />}
        </>
      ),
    },
  ]

  const statusLabel = isActive ? 'En ligne' : isPending ? 'Pas encore publique' : (FICHE_LABELS[photographer.status] ?? photographer.status)

  const banners = (
    <>
      {isAdminPreview && (
        <div style={adminBanner}>
          <Star size={14} weight="fill" />
          <span><strong>Mode admin :</strong> tu modifies la fiche de <strong>{photographer.full_name}</strong>. « Mettre en ligne » et le portail Stripe agissent au nom du photographe. Ses demandes reçues et ses clients restent privés.</span>
          <Link href="/dashboard/admin/photographes" style={{ color: AMBER_DARK, textDecoration: 'underline', marginLeft: 'auto' }}>Retour à l’admin</Link>
        </div>
      )}
      {isPending && paymentNotice === 'paid' && (
        <div style={okBanner}><CheckCircle size={14} weight="fill" /> Paiement reçu, merci. Ta fiche passe en ligne dans quelques minutes, le temps que Stripe nous le confirme.</div>
      )}
      {!isActive && !(isPending && paymentNotice === 'paid') && (
        <div style={isPending ? warnBanner : errBanner}>
          <Warning size={14} weight="fill" />
          {isPending
            ? (canPay
              ? (paymentNotice === 'canceled'
                ? 'Paiement annulé, rien n’a été débité. Ta fiche est gardée : clique sur « Finaliser mon paiement » quand tu veux, sans refaire le formulaire.'
                : 'Ta fiche est enregistrée mais pas encore en ligne : le paiement n’a pas été finalisé. Clique sur « Finaliser mon paiement », tu retrouves Stripe sans refaire le formulaire.')
              : `Ta fiche n’est pas encore publique (abonnement : ${stripeLabel(photographer.stripe_subscription_status)}). Elle apparaît dans l’annuaire dès que l’abonnement est actif.`)
            : `Ta fiche est ${FICHE_LABELS[photographer.status] ?? photographer.status}. Écris à contact@jasonmarinho.com pour la réactiver.`}
        </div>
      )}
      {err && <div style={errBanner}><Warning size={14} weight="fill" /> {err}</div>}
    </>
  )

  return (
    <>
      {dialog}
      <Atelier
        eyebrow={`Espace ${metierLabel(st.visuel.metier).toLowerCase()}`}
        displayName={f.full_name || photographer.full_name}
        logoUrl={logoUrl}
        statusLabel={statusLabel}
        isActive={isActive}
        publicUrl={publicUrl}
        stats={[[kpis.views, 'vues'], [kpis.contacts, 'demandes'], [kpis.clics, 'clics']]}
        headerActions={<>
          {isAdminPreview && isPending && !subRunning && (
            <button type="button" onClick={handlePreviewPay} disabled={payBusy} style={payBtn}><CreditCard size={15} weight="bold" /> {payBusy ? 'Ouverture…' : 'Voir sa page de paiement'}</button>
          )}
          {canPay && (
            <button type="button" onClick={handlePay} disabled={payBusy} style={payBtn}><CreditCard size={15} weight="bold" /> {payBusy ? 'Ouverture du paiement…' : 'Finaliser mon paiement'}</button>
          )}
        </>}
        banners={banners}
        sections={sections}
        active={active}
        onActive={setActive}
        pending={pending}
        saveStatus={draft.status}
        saveError={draft.error}
        publish={publish}
        onPublish={handlePublish}
        onRevert={ids => setSt(s => revertSections(SECTIONS, ids, s, baseline))}
        side={<>
          <FicheCompletude metier="photographe" onGo={a => setActive(ANCHORS[a] ?? 'photos')} input={{
            photos, bio: f.bio, formules: st.vitrine.formules, prixMin: f.tarif_min,
            deroule: st.vitrine.deroule, villes: st.vitrine.villes, zone: f.zone_couverte, logo: !!logoUrl,
            options: st.visuel.options.length, metierVideo: st.visuel.metier !== 'photo',
          }} />
          {isActive && publicUrl && <ShareFicheBlock url={publicUrl} displayName={f.full_name || photographer.full_name} />}
          {statsSlot}
          {viewsTrend && <ViewsTrend trend={viewsTrend} metier="photographe" style={{ margin: 0 }} />}
        </>}
      />
    </>
  )
}

const infoLine: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', padding: '14px 16px', borderRadius: 14, background: 'var(--accent-bg)', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 }
const em: React.CSSProperties = { fontStyle: 'italic', color: 'var(--accent-text)', fontWeight: 300 }
const adminBanner: React.CSSProperties = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '10px 16px', background: 'rgba(255,213,107,0.14)', border: `1px solid ${AMBER}55`, borderRadius: 12, fontSize: 13, color: AMBER_DARK, marginBottom: 14 }
const errBanner: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 12, fontSize: 13, color: 'var(--danger-text)', marginBottom: 14 }
const warnBanner: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,213,107,0.18)', border: `1px solid ${AMBER}55`, borderRadius: 12, fontSize: 13, color: AMBER_DARK, marginBottom: 14 }
const okBanner: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 12, fontSize: 13, color: 'var(--accent-text)', marginBottom: 14 }
const payBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, border: 'none', background: '#FFD56B', color: '#003329', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 }
const subCard: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, padding: '18px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16 }
const logoRow: React.CSSProperties = { display: 'flex', gap: 18, padding: 16, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, flexWrap: 'wrap', alignItems: 'center' }
const logoPreview: React.CSSProperties = { width: 88, height: 88, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--border)' }
const logoInitials: React.CSSProperties = { fontSize: 30, fontFamily: 'var(--font-fraunces), serif', color: 'var(--accent-text)' }
