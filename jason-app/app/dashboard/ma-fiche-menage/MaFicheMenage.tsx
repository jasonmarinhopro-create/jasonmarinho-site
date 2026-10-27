'use client'

// Ma fiche équipe de ménage : atelier (27/10/2026, maquettes validées par
// Jason). Coquille et barre de mise en ligne : components/pros/atelier/Atelier.tsx ;
// brouillon : lib/pros/fiche-draft.ts. Les champs, leurs vérifications et ce
// qui part sur la fiche publique sont ceux d'avant (actions.ts).
import ClientelesFields from '@/components/pros/ClientelesFields'
import { readClienteles, type Clientele } from '@/lib/pros/clienteles'
import GrowText from '@/components/pros/GrowText'
import Link from 'next/link'
import ViewsTrend from '@/components/pros/ViewsTrend'
import FicheCompletude from '@/components/pros/FicheCompletude'
import FacturationTeaser from '@/components/pros/FacturationTeaser'
import type { ViewsTrend as ViewsTrendData } from '@/lib/pros/views'
import { useEffect, useMemo, useState } from 'react'
import { Images, Tag, Sparkle, UsersThree, MapPin, PencilSimpleLine, ListNumbers, LinkSimple, UserCircle, CreditCard, Warning, CheckCircle, Star, ShieldCheck, UploadSimple, Trash, Phone, Check, Info, InstagramLogo } from '@phosphor-icons/react/dist/ssr'
import { publishFiche, saveFicheDraft, createCustomerPortalSession, resumeFichePayment, uploadCleanerLogo, deleteCleanerLogo, prepareFichePhotos, addFichePhotos, removeFichePhoto, moveFichePhoto, publishFichePhotos } from './actions'
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
  cleaner: Cleaner
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

const PRESTATIONS: Array<[string, string, string]> = [
  ['menage_standard', 'Ménage entre deux voyageurs', 'Le ménage complet du logement'],
  ['gestion_linge', 'Gestion du linge', 'Draps et serviettes lavés, lits faits'],
  ['repassage', 'Repassage', 'Linge repassé'],
  ['reapprovisionnement', 'Réassort des consommables', 'Papier, savon, café…'],
  ['etat_des_lieux_photo', 'État des lieux photo', 'Photos à chaque passage'],
  ['petite_maintenance', 'Petite maintenance', 'Ampoule, joint, petit meuble'],
  ['nettoyage_exterieur', 'Nettoyage extérieur', 'Terrasse, balcon'],
  ['gestion_dechets', 'Gestion des déchets', 'Poubelles et tri'],
]
const LANGUES: Array<[string, string]> = [
  ['fr', 'Français'], ['en', 'English'], ['es', 'Español'], ['it', 'Italiano'],
  ['de', 'Deutsch'], ['pt', 'Português'], ['ar', 'العربية'],
]
const EQUIPES: Array<[string, string]> = [['solo', 'Solo'], ['duo', 'Duo'], ['equipe_3_5', '3 à 5'], ['equipe_6_plus', '6 et plus']]
const DELAIS: Array<[string, string]> = [['jour_meme', 'Le jour même'], ['24h', 'Sous 24 h'], ['48h', 'Sous 48 h'], ['72h', 'Sous 72 h']]

type State = {
  form: {
    full_name: string; pseudo: string; ville: string; zone_couverte: string; bio: string
    tarif_forfait_min: number | null; tarif_forfait_max: number | null; tarif_heure: number | null
    prestations: string[]; equipe_type: string; logements_geres: number | null; delai_reservation: string; langues: string[]
    assurance_rc_pro: boolean; siret: string; site_url: string; instagram_handle: string; telephone: string; telephone_public: boolean
  }
  reseaux: ReseauxForm
  clienteles: Clientele[]
  vitrine: VitrineForm
}

function stateFrom(c: Cleaner): State {
  return {
    form: {
      full_name: c.full_name, pseudo: c.pseudo ?? '', ville: c.ville, zone_couverte: c.zone_couverte ?? '', bio: c.bio ?? '',
      tarif_forfait_min: c.tarif_forfait_min ?? null, tarif_forfait_max: c.tarif_forfait_max ?? null, tarif_heure: c.tarif_heure ?? null,
      prestations: c.prestations ?? [], equipe_type: c.equipe_type ?? '', logements_geres: c.logements_geres ?? null,
      delai_reservation: c.delai_reservation ?? '', langues: c.langues ?? ['fr'],
      assurance_rc_pro: !!c.assurance_rc_pro, siret: c.siret ?? '', site_url: c.site_url ?? '', instagram_handle: c.instagram_handle ?? '',
      telephone: c.telephone ?? '', telephone_public: !!c.telephone_public,
    },
    reseaux: emptyReseauxForm(c.reseaux),
    clienteles: readClienteles(c.clienteles),
    vitrine: initialVitrineForm(c, 'menage'),
  }
}

const SECTIONS: DraftSection[] = [
  { id: 'photos', paths: [], touched: 'photos' },
  { id: 'formules', paths: ['vitrine.formules', 'form.tarif_forfait_min', 'form.tarif_forfait_max', 'form.tarif_heure'] },
  { id: 'prestations', paths: ['form.prestations', 'clienteles'] },
  { id: 'equipe', paths: ['form.equipe_type', 'form.delai_reservation', 'form.logements_geres', 'form.langues'] },
  { id: 'zone', paths: ['form.ville', 'form.zone_couverte', 'vitrine.villes'] },
  { id: 'presentation', paths: ['form.bio'] },
  { id: 'deroule', paths: ['vitrine.deroule'] },
  { id: 'contact', paths: ['form.telephone', 'form.telephone_public', 'form.site_url', 'form.instagram_handle', 'reseaux'] },
  { id: 'identite', paths: ['form.full_name', 'form.pseudo', 'form.siret', 'form.assurance_rc_pro'], touched: 'logo' },
]

const ANCHORS: Record<string, string> = {
  'mes-photos': 'photos', formules: 'formules', tarifs: 'formules', prestations: 'prestations', capacite: 'equipe',
  villes: 'zone', presentation: 'presentation', deroule: 'deroule', logo: 'identite',
}

function sectionOfError(msg: string): string | undefined {
  if (/siret/i.test(msg)) return 'identite'
  if (/équipe|délai/i.test(msg)) return 'equipe'
  if (/site|lien|google|facebook|linkedin|tiktok|youtube|pinterest/i.test(msg)) return 'contact'
  if (/nom et ville/i.test(msg)) return 'identite'
  return undefined
}

export default function MaFicheMenage({ cleaner, kpis, isAdminPreview = false, viewsTrend, statsSlot, paymentNotice = null, locate = locateCommunes }: Props) {
  const serverDraft = readDraft<State>(cleaner.fiche_draft)
  const [baseline, setBaseline] = useState<State>(() => stateFrom(cleaner))
  const [st, setSt] = useState<State>(() => mergeDraftState(stateFrom(cleaner), serverDraft?.state ?? null))
  const [touched, setTouched] = useState<DraftTouched>(() => serverDraft?.touched ?? {})
  const [active, setActive] = useState('photos')
  const [photos, setPhotos] = useState<string[]>(cleaner.portfolio_photos ?? [])
  const [publish, setPublish] = useState<PublishState>({ kind: 'idle' })
  const [err, setErr] = useState<string | null>(null)
  const [portalBusy, setPortalBusy] = useState(false)
  const [payBusy, setPayBusy] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(cleaner.logo_url)
  const [logoBusy, setLogoBusy] = useState(false)
  const { confirm, dialog } = useConfirm()
  const targetId = isAdminPreview ? cleaner.id : undefined
  const storageKey = `jm-atelier-menage-${cleaner.id}`

  const pending = useMemo(() => changedSections(SECTIONS, st, baseline, touched), [st, baseline, touched])
  const draft = useFicheDraft({ state: st, touched, hasChanges: pending.length > 0, storageKey, save: d => saveFicheDraft(d, targetId) })

  useEffect(() => {
    const local = readLocalDraft<State>(storageKey)
    if (local && newerDraft(serverDraft, local) === local) {
      setSt(mergeDraftState(stateFrom(cleaner), local.state))
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
  const toggleIn = (key: 'prestations' | 'langues', v: string) =>
    setForm({ [key]: f[key].includes(v) ? f[key].filter(x => x !== v) : [...f[key], v] } as Partial<State['form']>)

  // Fourchette de l'annuaire tirée des formules chiffrées (étape 2)
  const tarifs = tarifsDepuisFormules(st.vitrine.formules, f.tarif_forfait_min, f.tarif_forfait_max)

  async function handlePublish() {
    setPublish({ kind: 'publishing' }); setErr(null)
    const res = await publishFiche({
      targetId,
      full_name: f.full_name, pseudo: f.pseudo || null, ville: f.ville, zone_couverte: f.zone_couverte || null, bio: f.bio || null,
      tarif_forfait_min: tarifs.min, tarif_forfait_max: tarifs.max, tarif_heure: f.tarif_heure,
      prestations: f.prestations, equipe_type: f.equipe_type || null, logements_geres: f.logements_geres,
      delai_reservation: f.delai_reservation || null, langues: f.langues,
      assurance_rc_pro: f.assurance_rc_pro, siret: f.siret || null, site_url: f.site_url || null,
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
    const res = await uploadCleanerLogo(fd)
    setLogoBusy(false)
    if (res.error) setErr(res.error)
    else if (res.url) { setLogoUrl(res.url); setTouched(t => ({ ...t, logo: true })) }
    e.target.value = ''
  }

  async function handleLogoDelete() {
    if (!(await confirm({ message: 'Supprimer le logo de ta fiche ?', confirmLabel: 'Supprimer', danger: true }))) return
    setErr(null); setLogoBusy(true)
    const res = await deleteCleanerLogo(targetId)
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
    const res = await resumeFichePayment(cleaner.id)
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

  const isActive = cleaner.status === 'active'
  const isPending = cleaner.status === 'pending_payment' || cleaner.status === 'approved_pending_payment'
  const subRunning = ['active', 'trialing', 'past_due'].includes(cleaner.stripe_subscription_status ?? '')
  const canPay = isPending && !isAdminPreview && !subRunning && paymentNotice !== 'paid'
  const isFondateur = cleaner.tier === 'fondateur'
  const publicUrl = cleaner.slug ? `https://jasonmarinho.com/annuaires/menage/${cleaner.slug}` : null
  const displayName = f.pseudo || f.full_name || cleaner.pseudo || cleaner.full_name

  // ── Résumés d'une ligne ────────────────────────────────────────────
  const nPhotos = photos.filter(p => !isLegacyPhoto(p)).length
  const des = prixDes(st.vitrine.formules, f.tarif_forfait_min)
  const nFormules = st.vitrine.formules.filter(x => x.nom.trim()).length
  const derouleDefault = st.vitrine.deroule.every((e, i) => e.titre === DEFAULT_DEROULE.menage[i]?.titre && e.texte === DEFAULT_DEROULE.menage[i]?.texte)
  const nReseaux = Object.values(st.reseaux).filter(v => v.trim()).length
  const contactBits = [f.site_url && 'site', f.instagram_handle && 'Instagram', f.telephone && 'téléphone', nReseaux && `${nReseaux} réseau${nReseaux > 1 ? 'x' : ''}`].filter(Boolean) as string[]
  const equipeLabel = EQUIPES.find(([k]) => k === f.equipe_type)?.[1]
  const delaiLabel = DELAIS.find(([k]) => k === f.delai_reservation)?.[1]

  const sections: AtelierSection[] = [
    {
      id: 'photos', group: 'Ta vitrine', label: 'Photos', icon: <Images size={17} weight="duotone" />, noRevert: true,
      summary: nPhotos ? `${nPhotos} sur ${PHOTOS_MAX}, la première en couverture` : 'Aucune photo pour l’instant',
      attention: nPhotos < 3 ? (nPhotos ? 'Ajoute un avant / après' : 'Ajoute tes premières photos') : null,
      done: nPhotos >= 3,
      title: <>Tes <em style={em}>photos</em></>,
      desc: 'Un logement impeccable, un lit bien fait, un avant / après : c’est ce qui convainc un hôte. La première photo est ta couverture.',
      content: (
        <PortfolioManager
          initial={cleaner.portfolio_photos ?? []}
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
      desc: 'Un prix par taille de logement, avec ce qui est compris (linge, réassort) : l’hôte sait tout de suite à quoi s’attendre.',
      content: (
        <>
          <FicheVitrineFields part="formules" value={st.vitrine} onChange={v => setSt(s => ({ ...s, vitrine: v }))} metier="menage" inputStyle={inp} titleStyle={{}} />
          {tarifs.auto && (
            <div style={infoLine}>
              <Info size={18} weight="duotone" color="var(--accent-text)" style={{ flexShrink: 0 }} />
              <span>Ton prix d’appel <strong style={{ color: 'var(--text)' }}>« dès {tarifs.min} € »</strong>{tarifs.max ? <> et ta fourchette jusqu’à {tarifs.max} €</> : null} sont calculés depuis tes formules.</span>
            </div>
          )}
          <Group title={tarifs.auto ? 'Tarif horaire' : 'Sans formule chiffrée : tes prix'}>
            <div style={ui.grid2}>
              {!tarifs.auto && <>
                <Field label="Ménage dès (€)">
                  <input style={inp} type="number" min={0} max={999} value={f.tarif_forfait_min ?? ''} onChange={e => setForm({ tarif_forfait_min: e.target.value ? parseInt(e.target.value, 10) : null })} />
                </Field>
                <Field label="Jusqu’à (€)">
                  <input style={inp} type="number" min={0} max={999} value={f.tarif_forfait_max ?? ''} onChange={e => setForm({ tarif_forfait_max: e.target.value ? parseInt(e.target.value, 10) : null })} />
                </Field>
              </>}
              <Field label="Tarif horaire (facultatif)">
                <input style={inp} type="number" min={0} max={200} value={f.tarif_heure ?? ''} onChange={e => setForm({ tarif_heure: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="€ de l’heure" />
              </Field>
            </div>
          </Group>
        </>
      ),
    },
    {
      id: 'prestations', group: 'Ton offre', label: 'Prestations', icon: <Sparkle size={17} weight="duotone" />,
      summary: f.prestations.length ? `${f.prestations.length} prestation${f.prestations.length > 1 ? 's' : ''}` : 'Aucune cochée',
      attention: f.prestations.length < 3 ? 'Coche tout ce que tu fais' : null,
      done: f.prestations.length >= 3,
      title: <>Tes <em style={em}>prestations</em></>,
      desc: 'Les hôtes filtrent l’annuaire avec ces réponses : chaque case cochée te fait apparaître dans une recherche de plus.',
      content: (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
            {PRESTATIONS.map(([k, label, sub]) => {
              const on = f.prestations.includes(k)
              return (
                <button key={k} type="button" aria-pressed={on} onClick={() => toggleIn('prestations', k)} style={{ ...tile, ...(on ? tileOn : {}) }}>
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
      id: 'equipe', group: 'Ton offre', label: 'Équipe et disponibilité', icon: <UsersThree size={17} weight="duotone" />,
      summary: [equipeLabel, delaiLabel, f.logements_geres ? `${f.logements_geres} logements` : null].filter(Boolean).join(', ') || 'À renseigner',
      attention: !f.equipe_type && !f.delai_reservation ? 'Dis à l’hôte si tu peux suivre son rythme' : null,
      done: !!(f.equipe_type || f.delai_reservation),
      title: <>Équipe et <em style={em}>disponibilité</em></>,
      desc: 'Taille de l’équipe, délai pour venir, langues parlées : l’hôte sait en un coup d’œil si tu peux suivre ses réservations.',
      content: (
        <>
          <div style={ui.grid2}>
            <Field label="Taille de ton équipe" group><Segmented label="Taille de ton équipe" value={f.equipe_type} onChange={v => setForm({ equipe_type: v })} options={EQUIPES} /></Field>
            <Field label="Tu peux venir" group><Segmented label="Délai de réservation" value={f.delai_reservation} onChange={v => setForm({ delai_reservation: v })} options={DELAIS} /></Field>
          </div>
          <Field label="Logements suivis aujourd’hui" hint="Affiché sur ta fiche." group>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" aria-label="Un de moins" onClick={() => setForm({ logements_geres: Math.max(0, (f.logements_geres ?? 0) - 1) || null })} style={stepBtn}>−</button>
              <input aria-label="Logements suivis" style={{ ...inp, width: 90, textAlign: 'center', fontFamily: 'var(--font-fraunces), serif', fontSize: 20 }} type="number" min={0} max={999} value={f.logements_geres ?? ''} onChange={e => setForm({ logements_geres: e.target.value ? parseInt(e.target.value, 10) : null })} />
              <button type="button" aria-label="Un de plus" onClick={() => setForm({ logements_geres: Math.min(999, (f.logements_geres ?? 0) + 1) })} style={stepBtn}>+</button>
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
      attention: f.bio.trim().length < 80 ? 'À écrire : quelques phrases suffisent' : null,
      done: f.bio.trim().length >= 80,
      title: <>Ta <em style={em}>présentation</em></>,
      desc: 'Qui vous êtes, depuis quand, ce qui rend vos ménages fiables. La première phrase est mise en avant sur ta fiche et dans Google.',
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
      desc: 'Trois étapes pour rassurer l’hôte : la demande, le premier passage, les ménages entre deux voyageurs.',
      content: <FicheVitrineFields part="deroule" value={st.vitrine} onChange={v => setSt(s => ({ ...s, vitrine: v }))} metier="menage" inputStyle={inp} titleStyle={{}} />,
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
      id: 'identite', group: 'Rarement modifié', label: 'Identité, SIRET, assurance', icon: <UserCircle size={17} weight="duotone" />,
      summary: [displayName, f.assurance_rc_pro ? 'RC pro' : null, f.siret ? 'SIRET' : null].filter(Boolean).join(', '),
      done: !!logoUrl,
      title: <>Identité et <em style={em}>garanties</em></>,
      desc: 'Ton nom, ton logo et tes garanties : ils rassurent l’hôte qui confie ses clés.',
      content: (
        <>
          <div style={logoRow}>
            <div style={{ ...logoPreview, background: logoUrl ? `url('${logoUrl}') center/cover` : 'var(--accent-bg)' }}>
              {!logoUrl && <span style={logoInitials}>{(displayName || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '0 0 10px', lineHeight: 1.55 }}>Logo de l’équipe, carré de préférence. JPEG, PNG ou WebP, 500 Ko au plus.</p>
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
            <Field label="Nom du ou de la gérante" req>
              <input style={inp} value={f.full_name} onChange={e => setForm({ full_name: e.target.value })} required maxLength={100} />
            </Field>
            <Field label="Nom commercial ou marque" hint="Affiché à la place de ton nom s’il est rempli.">
              <input style={inp} value={f.pseudo} onChange={e => setForm({ pseudo: e.target.value })} maxLength={100} />
            </Field>
            <Field label="SIRET (facultatif)">
              <input style={inp} value={f.siret} onChange={e => setForm({ siret: e.target.value })} maxLength={14} inputMode="numeric" placeholder="14 chiffres" />
            </Field>
            <Field label="E-mail du compte" hint="Pour le changer, écris à contact@jasonmarinho.com.">
              <input style={{ ...inp, opacity: 0.6 }} value={cleaner.email} disabled />
            </Field>
          </div>
          <Toggle checked={f.assurance_rc_pro} onChange={v => setForm({ assurance_rc_pro: v })} icon={<ShieldCheck size={19} weight="bold" />}
            label="Mon équipe est assurée en responsabilité civile pro" sub="Les hôtes peuvent filtrer l’annuaire sur ce point." />
        </>
      ),
    },
    {
      id: 'abonnement', group: 'Rarement modifié', label: 'Abonnement', icon: <CreditCard size={17} weight="duotone" />,
      summary: `${isFondateur ? '39,98 €' : '79,98 €'} par an, ${stripeLabel(cleaner.stripe_subscription_status)}`,
      title: <>Ton <em style={em}>abonnement</em></>,
      content: (
        <>
          <div style={subCard}>
            <div>
              <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 22 }}>{isFondateur ? '39,98 €' : '79,98 €'} <span style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'inherit' }}>TTC par an</span></div>
              <div style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 4 }}>Abonnement {stripeLabel(cleaner.stripe_subscription_status)}</div>
            </div>
            {canPay ? (
              <button type="button" onClick={handlePay} disabled={payBusy} style={ui.btnGhost}>{payBusy ? 'Ouverture…' : 'Finaliser mon paiement'}</button>
            ) : (
              <button type="button" onClick={handlePortal} disabled={portalBusy} style={ui.btnGhost}>{portalBusy ? 'Chargement…' : 'Gérer mon abonnement'}</button>
            )}
          </div>
          {!isAdminPreview && <FacturationTeaser href="/dashboard/ma-fiche-menage/devis" />}
        </>
      ),
    },
  ]

  const statusLabel = isActive ? 'En ligne' : isPending ? 'Pas encore publique' : (FICHE_LABELS[cleaner.status] ?? cleaner.status)

  const banners = (
    <>
      {isAdminPreview && (
        <div style={adminBanner}>
          <Star size={14} weight="fill" />
          <span><strong>Mode admin :</strong> tu modifies la fiche de <strong>{displayName}</strong>. « Mettre en ligne » et le portail Stripe agissent au nom de l’équipe. Ses demandes reçues et ses clients restent privés.</span>
          <Link href="/dashboard/admin/menage" style={{ color: AMBER_DARK, textDecoration: 'underline', marginLeft: 'auto' }}>Retour à l’admin</Link>
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
              : `Ta fiche n’est pas encore publique (abonnement : ${stripeLabel(cleaner.stripe_subscription_status)}). Elle apparaît dans l’annuaire dès que l’abonnement est actif.`)
            : `Ta fiche est ${FICHE_LABELS[cleaner.status] ?? cleaner.status}. Écris à contact@jasonmarinho.com pour la réactiver.`}
        </div>
      )}
      {err && <div style={errBanner}><Warning size={14} weight="fill" /> {err}</div>}
    </>
  )

  return (
    <>
      {dialog}
      <Atelier
        eyebrow="Espace équipe de ménage"
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
          <FicheCompletude metier="menage" onGo={a => setActive(ANCHORS[a] ?? 'photos')} input={{
            photos, bio: f.bio, formules: st.vitrine.formules, prixMin: f.tarif_forfait_min,
            deroule: st.vitrine.deroule, villes: st.vitrine.villes, zone: f.zone_couverte, logo: !!logoUrl,
            prestations: f.prestations.length, capacite: !!(f.equipe_type || f.delai_reservation),
          }} />
          {isActive && publicUrl && <ShareFicheBlock url={publicUrl} displayName={displayName} />}
          {statsSlot}
          {viewsTrend && <ViewsTrend trend={viewsTrend} metier="ménage" style={{ margin: 0 }} />}
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
const tile: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 14, minHeight: 84, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }
const tileOn: React.CSSProperties = { border: '2px solid var(--accent-text)', background: 'var(--accent-bg)', padding: 13 }
const chip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 40 }
const chipOn: React.CSSProperties = { border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: '#fff' }
const stepBtn: React.CSSProperties = { width: 46, height: 46, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 20, color: 'var(--accent-text)', cursor: 'pointer', fontFamily: 'inherit' }
