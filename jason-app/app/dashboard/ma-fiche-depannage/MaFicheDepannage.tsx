'use client'

// Ma fiche Dépannage et maintenance (31/10/2026) : même atelier que le ménage
// et la photo (components/pros/atelier/Atelier.tsx, brouillon
// lib/pros/fiche-draft.ts), avec les champs du métier : spécialités,
// disponibilités, délai d'intervention, prix du déplacement. Actions :
// actions.ts, branché sur le tronc commun lib/pros/fiche-core.ts.
import ClientelesFields from '@/components/pros/ClientelesFields'
import { readClienteles, type Clientele } from '@/lib/pros/clienteles'
import Link from 'next/link'
import ViewsTrend from '@/components/pros/ViewsTrend'
import FicheCompletude from '@/components/pros/FicheCompletude'
import FacturationTeaser from '@/components/pros/FacturationTeaser'
import type { ViewsTrend as ViewsTrendData } from '@/lib/pros/views'
import { useEffect, useMemo, useState } from 'react'
import { Images, Tag, Wrench, Clock, MapPin, PencilSimpleLine, ListNumbers, LinkSimple, UserCircle, CreditCard, Warning, CheckCircle, Star, UploadSimple, Trash, Phone, Check, InstagramLogo } from '@phosphor-icons/react/dist/ssr'
import { publishFiche, saveFicheDraft, createCustomerPortalSession, resumeFichePayment, uploadDepannageLogo, deleteDepannageLogo, prepareFichePhotos, addFichePhotos, removeFichePhoto, moveFichePhoto, publishFichePhotos } from './actions'
import PortfolioManager from '@/components/pros/PortfolioManager'
import FicheVitrineFields, { initialVitrineForm, vitrinePayload, type VitrineForm } from '@/components/pros/FicheVitrineFields'
import ShareFicheBlock from '@/components/pro/ShareFicheBlock'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import ReseauxFields, { emptyReseauxForm, type ReseauxForm } from '@/components/pros/ReseauxFields'
import { DEFAULT_DEROULE, PHOTOS_MAX, isLegacyPhoto } from '@/lib/pros/fiche-vitrine'
import { changedSections, revertSections, mergeDraftState, readDraft, newerDraft, type DraftSection, type DraftTouched } from '@/lib/pros/fiche-draft'
import Atelier, { type AtelierSection, type PublishState } from '@/components/pros/atelier/Atelier'
import { useFicheDraft, readLocalDraft } from '@/components/pros/atelier/useFicheDraft'
import { atelierInput as inp, Field, Group, Toggle, Segmented, ui } from '@/components/pros/atelier/ui'
import { zoneSummary, prixDes } from '@/lib/pros/atelier-resumes'
import { SPECIALITES_DEPANNAGE } from '@/lib/pros/metiers'
import { DISPONIBILITES_DEPANNAGE, DELAIS_DEPANNAGE } from '@/lib/pros/depannage'
import ZoneEditor from '@/components/pros/atelier/ZoneEditor'
import BioEditor from '@/components/pros/atelier/BioEditor'
import FichePreview from '@/components/pros/atelier/FichePreview'
import { majusculesCriardes } from '@/lib/pros/bio-aide'
import { parseZone } from '@/lib/pros/zone'
import { thumbPath, PORTFOLIO_BUCKET } from '@/lib/pros/fiche-vitrine'
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

type Pro = {
  id: string; email: string; full_name: string; pseudo: string | null; ville: string
  zone_couverte: string | null; bio: string | null
  tarif_heure: number | null; deplacement_prix: number | null
  specialites: string[] | null; disponibilites: string[] | null
  delai_intervention: string | null; langues: string[] | null
  siret: string | null
  site_url: string | null; instagram_handle: string | null
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
  fiche_draft?: unknown
}

interface Props {
  pro: Pro
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

// Un mot sous chaque spécialité : ce que l'hôte imagine derrière
const SOUS: Record<string, string> = {
  electricite: 'Prise, disjoncteur, éclairage', plomberie: 'Fuite, WC, chasse d’eau, ballon',
  chauffage: 'Chaudière, radiateur, clim', serrurerie: 'Porte claquée, serrure, boîte à clés',
  multiservice: 'Petites réparations du quotidien', montage: 'Lit, rangement, mobilier',
  vitrerie: 'Vitre cassée, double vitrage', electromenager: 'Lave-linge, four, frigo',
  exterieur: 'Jardin, piscine, terrasse',
}
const SPECIALITES: Array<[string, string, string]> = SPECIALITES_DEPANNAGE.map(sp => [sp.id, sp.label, SOUS[sp.id] ?? ''])
const LANGUES: Array<[string, string]> = [
  ['fr', 'Français'], ['en', 'English'], ['es', 'Español'], ['it', 'Italiano'],
  ['de', 'Deutsch'], ['pt', 'Português'], ['ar', 'العربية'],
]
const DISPOS: Array<[string, string]> = DISPONIBILITES_DEPANNAGE.map(d => [d.id, d.label])
const DELAIS: Array<[string, string]> = DELAIS_DEPANNAGE.map(d => [d.id, d.label])

type State = {
  form: {
    full_name: string; pseudo: string; ville: string; zone_couverte: string; bio: string
    tarif_heure: number | null; deplacement_prix: number | null
    specialites: string[]; disponibilites: string[]; delai_intervention: string; langues: string[]
    siret: string; site_url: string; instagram_handle: string; telephone: string; telephone_public: boolean
  }
  reseaux: ReseauxForm
  clienteles: Clientele[]
  vitrine: VitrineForm
}

function stateFrom(c: Pro): State {
  return {
    form: {
      full_name: c.full_name, pseudo: c.pseudo ?? '', ville: c.ville, zone_couverte: c.zone_couverte ?? '', bio: c.bio ?? '',
      tarif_heure: c.tarif_heure ?? null, deplacement_prix: c.deplacement_prix ?? null,
      specialites: c.specialites ?? [], disponibilites: c.disponibilites ?? [],
      delai_intervention: c.delai_intervention ?? '', langues: c.langues?.length ? c.langues : ['fr'],
      siret: c.siret ?? '', site_url: c.site_url ?? '', instagram_handle: c.instagram_handle ?? '',
      telephone: c.telephone ?? '', telephone_public: !!c.telephone_public,
    },
    reseaux: emptyReseauxForm(c.reseaux),
    clienteles: readClienteles(c.clienteles),
    vitrine: initialVitrineForm(c, 'depannage'),
  }
}

const SECTIONS: DraftSection[] = [
  { id: 'photos', paths: [], touched: 'photos' },
  { id: 'formules', paths: ['vitrine.formules', 'form.tarif_heure', 'form.deplacement_prix'] },
  { id: 'prestations', paths: ['form.specialites', 'clienteles'] },
  { id: 'equipe', paths: ['form.disponibilites', 'form.delai_intervention', 'form.langues'] },
  { id: 'zone', paths: ['form.ville', 'form.zone_couverte', 'vitrine.villes'] },
  { id: 'presentation', paths: ['form.bio'] },
  { id: 'deroule', paths: ['vitrine.deroule'] },
  { id: 'contact', paths: ['form.telephone', 'form.telephone_public', 'form.site_url', 'form.instagram_handle', 'reseaux'] },
  { id: 'identite', paths: ['form.full_name', 'form.pseudo', 'form.siret'], touched: 'logo' },
]

const ANCHORS: Record<string, string> = {
  'mes-photos': 'photos', formules: 'formules', tarifs: 'formules', prestations: 'prestations', capacite: 'equipe',
  villes: 'zone', presentation: 'presentation', deroule: 'deroule', logo: 'identite',
}

function sectionOfError(msg: string): string | undefined {
  if (/siret/i.test(msg)) return 'identite'
  if (/délai/i.test(msg)) return 'equipe'
  if (/site|lien|google|facebook|linkedin|tiktok|youtube|pinterest/i.test(msg)) return 'contact'
  if (/nom et ville/i.test(msg)) return 'identite'
  return undefined
}

export default function MaFicheDepannage({ pro, kpis, isAdminPreview = false, viewsTrend, statsSlot, paymentNotice = null, locate = locateCommunes }: Props) {
  const serverDraft = readDraft<State>(pro.fiche_draft)
  const [baseline, setBaseline] = useState<State>(() => stateFrom(pro))
  const [st, setSt] = useState<State>(() => mergeDraftState(stateFrom(pro), serverDraft?.state ?? null))
  const [touched, setTouched] = useState<DraftTouched>(() => serverDraft?.touched ?? {})
  const [active, setActive] = useState('photos')
  const [photos, setPhotos] = useState<string[]>(pro.portfolio_photos ?? [])
  const [publish, setPublish] = useState<PublishState>({ kind: 'idle' })
  const [err, setErr] = useState<string | null>(null)
  const [portalBusy, setPortalBusy] = useState(false)
  const [payBusy, setPayBusy] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(pro.logo_url)
  const [logoBusy, setLogoBusy] = useState(false)
  const { confirm, dialog } = useConfirm()
  const targetId = isAdminPreview ? pro.id : undefined
  const storageKey = `jm-atelier-depannage-${pro.id}`

  const pending = useMemo(() => changedSections(SECTIONS, st, baseline, touched), [st, baseline, touched])
  const draft = useFicheDraft({ state: st, touched, hasChanges: pending.length > 0, storageKey, save: d => saveFicheDraft(d, targetId) })

  useEffect(() => {
    const local = readLocalDraft<State>(storageKey)
    if (local && newerDraft(serverDraft, local) === local) {
      setSt(mergeDraftState(stateFrom(pro), local.state))
      setTouched(local.touched)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Une nouvelle modification après une mise en ligne : la barre repasse en « à mettre en ligne »
  useEffect(() => {
    if (pending.length && (publish.kind === 'done' || publish.kind === 'error')) setPublish({ kind: 'idle' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.length, st])

  const setForm = (patch: Partial<State['form']>) => setSt(s => ({ ...s, form: { ...s.form, ...patch } }))
  const f = st.form
  const toggleIn = (key: 'specialites' | 'disponibilites' | 'langues', v: string) =>
    setForm({ [key]: f[key].includes(v) ? f[key].filter(x => x !== v) : [...f[key], v] } as Partial<State['form']>)


  async function handlePublish() {
    setPublish({ kind: 'publishing' }); setErr(null)
    const res = await publishFiche({
      targetId,
      full_name: f.full_name, pseudo: f.pseudo || null, ville: f.ville, zone_couverte: f.zone_couverte || null, bio: f.bio || null,
      tarif_heure: f.tarif_heure, deplacement_prix: f.deplacement_prix,
      specialites: f.specialites, disponibilites: f.disponibilites,
      delai_intervention: f.delai_intervention || null, langues: f.langues,
      siret: f.siret || null, site_url: f.site_url || null,
      instagram_handle: f.instagram_handle || null, telephone: f.telephone || null,
      telephone_public: f.telephone_public && !!f.telephone.trim(),
      clienteles: st.clienteles, reseaux: st.reseaux,
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
    const res = await uploadDepannageLogo(fd)
    setLogoBusy(false)
    if (res.error) setErr(res.error)
    else if (res.url) { setLogoUrl(res.url); setTouched(t => ({ ...t, logo: true })) }
    e.target.value = ''
  }

  async function handleLogoDelete() {
    if (!(await confirm({ message: 'Supprimer le logo de ta fiche ?', confirmLabel: 'Supprimer', danger: true }))) return
    setErr(null); setLogoBusy(true)
    const res = await deleteDepannageLogo(targetId)
    setLogoBusy(false)
    if (res.error) setErr(res.error)
    else { setLogoUrl(null); setTouched(t => ({ ...t, logo: true })) }
  }

  async function handlePay() {
    setErr(null); setPayBusy(true)
    const res = await resumeFichePayment()
    if (res.checkoutUrl) { window.location.href = res.checkoutUrl; return }
    setPayBusy(false)
    if (res.error || res.info) setErr(res.error ?? res.info ?? null)
  }

  async function handlePreviewPay() {
    const okGo = await confirm({
      message: `Tu vas voir la page de paiement Stripe que verrait ${displayName}. Ne paie pas : le paiement serait pris sur ta carte et activerait sa fiche.`,
      confirmLabel: 'Ouvrir la page',
    })
    if (!okGo) return
    setErr(null); setPayBusy(true)
    const res = await resumeFichePayment(pro.id)
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

  const isActive = pro.status === 'active'
  const isPending = pro.status === 'pending_payment' || pro.status === 'approved_pending_payment'
  const subRunning = ['active', 'trialing', 'past_due'].includes(pro.stripe_subscription_status ?? '')
  const canPay = isPending && !isAdminPreview && !subRunning && paymentNotice !== 'paid'
  const isFondateur = pro.tier === 'fondateur'
  const publicUrl = pro.slug ? `https://jasonmarinho.com/annuaires/depannage/${pro.slug}` : null
  const displayName = f.pseudo || f.full_name || pro.pseudo || pro.full_name

  // ── Résumés d'une ligne ────────────────────────────────────────────
  const nPhotos = photos.filter(p => !isLegacyPhoto(p)).length
  const firstPhoto = photos.find(p => !isLegacyPhoto(p))
  const coverUrl = firstPhoto ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PORTFOLIO_BUCKET}/${thumbPath(firstPhoto)}` : null
  const des = prixDes(st.vitrine.formules, f.tarif_heure)
  const nFormules = st.vitrine.formules.filter(x => x.nom.trim()).length
  const derouleDefault = st.vitrine.deroule.every((e, i) => e.titre === DEFAULT_DEROULE.depannage[i]?.titre && e.texte === DEFAULT_DEROULE.depannage[i]?.texte)
  const nReseaux = Object.values(st.reseaux).filter(v => v.trim()).length
  const contactBits = [f.site_url && 'site', f.instagram_handle && 'Instagram', f.telephone && 'téléphone', nReseaux && `${nReseaux} réseau${nReseaux > 1 ? 'x' : ''}`].filter(Boolean) as string[]
  const dispoLabels = DISPOS.filter(([k]) => f.disponibilites.includes(k)).map(([, l]) => l)
  const delaiLabel = DELAIS.find(([k]) => k === f.delai_intervention)?.[1]

  const sections: AtelierSection[] = [
    {
      id: 'photos', group: 'Ta vitrine', label: 'Photos', icon: <Images size={17} weight="duotone" />, noRevert: true,
      summary: nPhotos ? `${nPhotos} sur ${PHOTOS_MAX}, la première en couverture` : 'Aucune photo pour l’instant',
      attention: nPhotos < 3 ? (nPhotos ? 'Ajoute un avant / après' : 'Ajoute tes premières photos') : null,
      done: nPhotos >= 3,
      title: <>Tes <em style={em}>photos</em></>,
      desc: 'Un tableau électrique propre, une salle de bain réparée, un avant / après : c’est ce qui convainc un hôte. La première photo est ta couverture.',
      content: (
        <PortfolioManager
          initial={pro.portfolio_photos ?? []}
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
      desc: 'Une intervention type avec ce qui est compris (déplacement, première heure, petites fournitures) : l’hôte sait tout de suite à quoi s’attendre.',
      content: (
        <>
          <FicheVitrineFields part="formules" value={st.vitrine} onChange={v => setSt(s => ({ ...s, vitrine: v }))} metier="depannage" inputStyle={inp} titleStyle={{}} />
          <Group title="Tes tarifs de base">
            <div style={ui.grid2}>
              <Field label="Tarif horaire (facultatif)">
                <input style={inp} type="number" min={0} max={500} value={f.tarif_heure ?? ''} onChange={e => setForm({ tarif_heure: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="€ de l’heure" />
              </Field>
              <Field label="Déplacement (facultatif)" hint="0 si le déplacement est offert.">
                <input style={inp} type="number" min={0} max={500} value={f.deplacement_prix ?? ''} onChange={e => setForm({ deplacement_prix: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="€" />
              </Field>
            </div>
          </Group>
        </>
      ),
    },
    {
      id: 'prestations', group: 'Ton offre', label: 'Spécialités', icon: <Wrench size={17} weight="duotone" />,
      summary: f.specialites.length ? `${f.specialites.length} spécialité${f.specialites.length > 1 ? 's' : ''}` : 'Aucune cochée',
      attention: !f.specialites.length ? 'Coche ce que tu fais' : null,
      done: f.specialites.length >= 1,
      title: <>Tes <em style={em}>spécialités</em></>,
      desc: 'Les hôtes filtrent l’annuaire avec ces réponses : chaque case cochée te fait apparaître dans une recherche de plus.',
      content: (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
            {SPECIALITES.map(([k, label, sub]) => {
              const on = f.specialites.includes(k)
              return (
                <button key={k} type="button" aria-pressed={on} onClick={() => toggleIn('specialites', k)} style={{ ...tile, ...(on ? tileOn : {}) }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{label}</span>
                    {on && <Check size={16} weight="bold" color="var(--accent-text)" style={{ flexShrink: 0 }} />}
                  </span>
                  <span style={{ fontSize: 12, color: on ? 'var(--accent-text)' : 'var(--text-3)', lineHeight: 1.4 }}>{sub}</span>
                </button>
              )
            })}
          </div>
          <ClientelesFields value={st.clienteles} onChange={v => setSt(s => ({ ...s, clienteles: v }))} />
        </>
      ),
    },
    {
      id: 'equipe', group: 'Ton offre', label: 'Disponibilités', icon: <Clock size={17} weight="duotone" />,
      summary: [delaiLabel, ...dispoLabels].filter(Boolean).join(', ') || 'À renseigner',
      attention: !f.delai_intervention && !f.disponibilites.length ? 'Dis à l’hôte quand tu peux venir' : null,
      done: !!(f.delai_intervention || f.disponibilites.length),
      title: <>Tes <em style={em}>disponibilités</em></>,
      desc: 'Une fuite un samedi, une serrure bloquée le soir d’une arrivée : l’hôte veut savoir tout de suite si tu peux venir.',
      content: (
        <>
          <Field label="Tu peux intervenir" group><Segmented label="Délai d’intervention" value={f.delai_intervention} onChange={v => setForm({ delai_intervention: v })} options={DELAIS} /></Field>
          <Field label="Quand tu travailles" group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DISPOS.map(([k, label]) => {
                const on = f.disponibilites.includes(k)
                return <button key={k} type="button" aria-pressed={on} onClick={() => toggleIn('disponibilites', k)} style={{ ...chip, ...(on ? chipOn : {}) }}>{on && <Check size={13} weight="bold" />}{label}</button>
              })}
            </div>
          </Field>
          <Field label="Langues parlées avec les voyageurs" group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LANGUES.map(([k, label]) => {
                const on = f.langues.includes(k)
                return <button key={k} type="button" aria-pressed={on} onClick={() => toggleIn('langues', k)} style={{ ...chip, ...(on ? chipOn : {}) }}>{on && <Check size={13} weight="bold" />}{label}</button>
              })}
            </div>
          </Field>
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
      attention: f.bio.trim().length < 80 ? 'À écrire : quelques phrases suffisent' : majusculesCriardes(f.bio) ? 'À retoucher : passage en majuscules' : null,
      done: f.bio.trim().length >= 80 && !majusculesCriardes(f.bio),
      title: <>Ta <em style={em}>présentation</em></>,
      desc: 'Qui tu es, depuis quand, ce que tu répares le plus souvent. Les premières lignes s’affichent sur ta fiche, la suite derrière « Lire la suite ».',
      content: (
        <>
          <BioEditor value={f.bio} onChange={v => setForm({ bio: v })} ville={f.ville} />
        </>
      ),
    },
    {
      id: 'deroule', group: 'Ton histoire', label: 'Comment ça se passe', icon: <ListNumbers size={17} weight="duotone" />,
      summary: derouleDefault ? '3 étapes proposées par défaut' : 'Tes 3 étapes',
      done: !derouleDefault,
      title: <>Comment ça se <em style={em}>passe</em></>,
      desc: 'Trois étapes pour rassurer l’hôte : la demande, l’intervention, le compte rendu.',
      content: <FicheVitrineFields part="deroule" value={st.vitrine} onChange={v => setSt(s => ({ ...s, vitrine: v }))} metier="depannage" inputStyle={inp} titleStyle={{}} />,
    },
    {
      id: 'contact', group: 'Contact', label: 'Téléphone et liens', icon: <LinkSimple size={17} weight="duotone" />,
      summary: contactBits.length ? contactBits.join(', ') : 'Aucun lien pour l’instant',
      done: contactBits.length >= 2,
      title: <>Téléphone et <em style={em}>liens</em></>,
      desc: 'Les hôtes t’écrivent depuis ta fiche. Ton site, ton Instagram et ta fiche Google leur montrent le reste de ton travail.',
      content: (
        <>
          <Field label="Téléphone">
            <input style={inp} type="tel" value={f.telephone} onChange={e => setForm({ telephone: e.target.value })} maxLength={30} autoComplete="tel" />
          </Field>
          {f.telephone.trim() && (
            <Toggle checked={f.telephone_public} onChange={v => setForm({ telephone_public: v })} icon={<Phone size={18} weight="bold" />}
              label="Afficher mon numéro sur ma fiche" sub="Un bouton « Appeler » apparaît à côté de « Demander un devis »." />
          )}
          <Field label="Site web">
            <input style={inp} type="text" inputMode="url" autoCapitalize="off" spellCheck={false} value={f.site_url} onChange={e => setForm({ site_url: e.target.value })} maxLength={300} placeholder="monsite.fr" />
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
      id: 'identite', group: 'Rarement modifié', label: 'Identité et SIRET', icon: <UserCircle size={17} weight="duotone" />,
      summary: [displayName, f.siret ? 'SIRET' : null].filter(Boolean).join(', '),
      done: !!logoUrl,
      title: <>Ton <em style={em}>identité</em></>,
      desc: 'Ton nom et ton logo : ils rassurent l’hôte qui te confie ses clés.',
      content: (
        <>
          <div style={logoRow}>
            <div style={{ ...logoPreview, background: logoUrl ? `url('${logoUrl}') center/cover` : 'var(--accent-bg)' }}>
              {!logoUrl && <span style={logoInitials}>{(displayName || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '0 0 10px', lineHeight: 1.55 }}>Ton logo ou ta photo, carré de préférence. JPEG, PNG ou WebP, 500 Ko au plus.</p>
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
            <Field label="Ton nom" req>
              <input style={inp} value={f.full_name} onChange={e => setForm({ full_name: e.target.value })} required maxLength={100} />
            </Field>
            <Field label="Nom commercial ou marque" hint="Affiché à la place de ton nom s’il est rempli.">
              <input style={inp} value={f.pseudo} onChange={e => setForm({ pseudo: e.target.value })} maxLength={100} />
            </Field>
            <Field label="SIRET (facultatif)">
              <input style={inp} value={f.siret} onChange={e => setForm({ siret: e.target.value })} maxLength={14} inputMode="numeric" placeholder="14 chiffres" />
            </Field>
            <Field label="E-mail du compte" hint="Pour le changer, écris à contact@jasonmarinho.com.">
              <input style={{ ...inp, opacity: 0.6 }} value={pro.email} disabled />
            </Field>
          </div>
        </>
      ),
    },
    {
      id: 'abonnement', group: 'Rarement modifié', label: 'Abonnement', icon: <CreditCard size={17} weight="duotone" />,
      summary: `${isFondateur ? '39,98 €' : '79,98 €'} par an, ${stripeLabel(pro.stripe_subscription_status)}`,
      title: <>Ton <em style={em}>abonnement</em></>,
      content: (
        <>
          <div style={subCard}>
            <div>
              <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 22 }}>{isFondateur ? '39,98 €' : '79,98 €'} <span style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'inherit' }}>TTC par an</span></div>
              <div style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 4 }}>Abonnement {stripeLabel(pro.stripe_subscription_status)}</div>
            </div>
            {canPay ? (
              <button type="button" onClick={handlePay} disabled={payBusy} style={ui.btnGhost}>{payBusy ? 'Ouverture…' : 'Finaliser mon paiement'}</button>
            ) : (
              <button type="button" onClick={handlePortal} disabled={portalBusy} style={ui.btnGhost}>{portalBusy ? 'Chargement…' : 'Gérer mon abonnement'}</button>
            )}
          </div>
          {!isAdminPreview && <FacturationTeaser href="/dashboard/ma-fiche-depannage/devis" />}
        </>
      ),
    },
  ]

  const statusLabel = isActive ? 'En ligne' : isPending ? 'Pas encore publique' : (FICHE_LABELS[pro.status] ?? pro.status)

  const banners = (
    <>
      {isAdminPreview && (
        <div style={adminBanner}>
          <Star size={14} weight="fill" />
          <span><strong>Mode admin :</strong> tu modifies la fiche de <strong>{displayName}</strong>. « Mettre en ligne » et le portail Stripe agissent au nom du pro. Ses demandes reçues et ses clients restent privés.</span>
          <Link href="/dashboard/admin/depannage" style={{ color: AMBER_DARK, textDecoration: 'underline', marginLeft: 'auto' }}>Retour à l’admin</Link>
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
              : `Ta fiche n’est pas encore publique (abonnement : ${stripeLabel(pro.stripe_subscription_status)}). Elle apparaît dans l’annuaire dès que l’abonnement est actif.`)
            : `Ta fiche est ${FICHE_LABELS[pro.status] ?? pro.status}. Écris à contact@jasonmarinho.com pour la réactiver.`}
        </div>
      )}
      {err && <div style={errBanner}><Warning size={14} weight="fill" /> {err}</div>}
    </>
  )

  return (
    <>
      {dialog}
      <Atelier
        eyebrow="Espace dépannage"
        displayName={displayName}
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
          <FichePreview active={active} data={{
            name: displayName, firstName: (f.pseudo ? f.pseudo : f.full_name.split(' ')[0]) ?? '',
            sousTitre: `Dépannage et maintenance pour locations courte durée${f.ville ? ` à ${f.ville}` : ''}`,
            cover: coverUrl, logoUrl, des, unite: f.tarif_heure && des === f.tarif_heure ? 'de l’heure' : 'l’intervention', km: parseZone(f.zone_couverte, f.ville).km, zone: f.zone_couverte,
            formules: st.vitrine.formules, bio: f.bio, deroule: st.vitrine.deroule,
            chips: [delaiLabel, ...SPECIALITES.filter(([k]) => f.specialites.includes(k)).map(([, l]) => l), ...dispoLabels].filter(Boolean) as string[],
            sub: zoneSummary(f.ville, f.zone_couverte, 0),
          }} />
          <FicheCompletude metier="depannage" onGo={a => setActive(ANCHORS[a] ?? 'photos')} input={{
            photos, bio: f.bio, formules: st.vitrine.formules, prixMin: f.tarif_heure,
            deroule: st.vitrine.deroule, villes: st.vitrine.villes, zone: f.zone_couverte, logo: !!logoUrl,
            prestations: f.specialites.length, capacite: !!(f.delai_intervention || f.disponibilites.length),
          }} />
          {isActive && publicUrl && <ShareFicheBlock url={publicUrl} displayName={displayName} />}
          {statsSlot}
          {viewsTrend && <ViewsTrend trend={viewsTrend} metier="dépannage" style={{ margin: 0 }} />}
        </>}
      />
    </>
  )
}

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
const tile: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 14, minHeight: 84, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }
const tileOn: React.CSSProperties = { border: '2px solid var(--accent-text)', background: 'var(--accent-bg)', padding: 13 }
const chip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 40 }
const chipOn: React.CSSProperties = { border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: '#fff' }
