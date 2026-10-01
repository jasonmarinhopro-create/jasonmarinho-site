'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Copy, Check, MagnifyingGlass, PencilSimple, X,
  CalendarCheck, House, SunHorizon, ArrowRight,
  CaretDown, CaretUp, PushPin, Sparkle, DotsThreeVertical, DotsSixVertical,
  Translate, CheckCircle, Circle, ArrowBendDownRight, ChatCircleText, Trash, Lightbulb, ListNumbers,
} from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import type { Template, UserTemplateCustomization, UserPinnedTemplate } from '@/types'
import type { LogementOption, NextContractInfo } from './page'
import { infosPratiquesToFillMap } from '@/lib/logements/infos-pratiques'
import { markStepIfNotYet } from '@/lib/onboarding/client'
import { useConfirm } from '@/components/ui/ConfirmDialog'

// ── Mapping catégorie → moment d'envoi ─────────────────────────────────────
type TimingBucket = 'avant-arrivee' | 'pendant-sejour' | 'apres-depart'

const CATEGORY_TO_TIMING: Record<string, TimingBucket> = {
  confirmation: 'avant-arrivee',
  checkin:      'avant-arrivee',
  bienvenue:    'avant-arrivee',
  securite:     'avant-arrivee',
  upsell:       'avant-arrivee',
  probleme:     'pendant-sejour',
  extra:        'pendant-sejour',
  conciergerie: 'pendant-sejour',
  checkout:     'apres-depart',
  avis:         'apres-depart',
}

const TIMING_LABELS: Record<TimingBucket, string> = {
  'avant-arrivee':  "Avant l'arrivée",
  'pendant-sejour': 'Pendant le séjour',
  'apres-depart':   'Après le départ',
}

// Moments précis proposés sous « Quand l'envoyer ? » (texte libre à côté)
const TIMING_SHORTCUTS = ['À la réservation', 'J-3', 'J-1', "Jour d'arrivée", 'Pendant le séjour', 'Veille du départ', 'J+1 après le départ']

// ── Langues des messages (01/10/2026, demande de Jason) ─────────────────────
// Français : ma version ou le modèle. Anglais : ma version, sinon la
// traduction du modèle. Portugais : seulement si l'hôte l'a écrite.
type Lang = 'fr' | 'en' | 'pt'
const LANG_LABEL: Record<Lang, string> = { fr: 'FR', en: 'EN', pt: 'PT' }
const LANG_NAME: Record<Lang, string> = { fr: 'Français', en: 'Anglais', pt: 'Portugais' }

function contentFor(t: Template, c: UserTemplateCustomization | undefined, lang: Lang): string | null {
  if (lang === 'en') return c?.content_en?.trim() || t.corps_en || null
  if (lang === 'pt') return c?.content_pt?.trim() || null
  return c?.content ?? t.content
}

function langsOf(t: Template, c: UserTemplateCustomization | undefined): Lang[] {
  return (['fr', 'en', 'pt'] as Lang[]).filter(l => !!contentFor(t, c, l))
}

const CATEGORY_LABELS: Record<string, string> = {
  confirmation: 'Confirmation',
  checkin:      'Check-in',
  checkout:     'Check-out',
  avis:         "Demande d'avis",
  bienvenue:    'Bienvenue',
  probleme:     'Problème',
  extra:        'Extra',
  upsell:       'Upsell',
  securite:     'Sécurité',
  conciergerie: 'Conciergerie',
  saisonnier:   'Saisonnier',
  airbnb:       'Airbnb',
  facebook:     'Posts & annonces',
  autre:        'Autre',
}


// Couleurs de la marque (DA 01/10/2026) : vert, ambre, brun. Plus de bleu
// ni de rose saumon.
const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`
const AMBER = '#B7791F'
const BROWN = '#8B6D5E'
const SECTION_CONFIG: Record<TimingBucket, { label: string; hint: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  'avant-arrivee':  { label: "Avant l'arrivée",  hint: 'Confirmation, instructions, accès',       color: 'var(--accent-text)', bg: 'var(--accent-bg)', border: 'var(--accent-border)', icon: CalendarCheck },
  'pendant-sejour': { label: 'Pendant le séjour', hint: 'Bienvenue, petits soucis, extras',        color: AMBER, bg: tint(AMBER, 12), border: tint(AMBER, 32), icon: House },
  'apres-depart':   { label: 'Après le départ',   hint: 'Merci, avis, objets oubliés',              color: BROWN, bg: tint(BROWN, 12), border: tint(BROWN, 32), icon: SunHorizon },
}

const TIMING_ORDER: TimingBucket[] = ['avant-arrivee', 'pendant-sejour', 'apres-depart']
const INITIAL_SHOW = 6

function getTimingBucket(template: Template): TimingBucket | null {
  return CATEGORY_TO_TIMING[template.category] ?? null
}

function guessTimingBucket(label: string): TimingBucket | null {
  const t = label.toLowerCase()
  if (t.includes('avant') || t.includes('arrivée') || t.includes('confirmation') || t.includes('check-in') || t.includes('checkin')) return 'avant-arrivee'
  if (t.includes('pendant') || t.includes('séjour') || t.includes('durant')) return 'pendant-sejour'
  if (t.includes('après') || t.includes('départ') || t.includes('checkout') || t.includes('avis')) return 'apres-depart'
  return null
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\[[^\]]+\]/g) ?? []
  return [...new Set(matches)]
}

// Catégorisation des variables pour structurer le formulaire de remplissage.
// Aide l'hôte à voir d'un coup d'œil ce qu'il doit fournir.
type FillCategory = 'logement' | 'acces' | 'reseaux' | 'voyageur' | 'sejour' | 'pratique' | 'reco' | 'autre'

function categorizeVariable(v: string): FillCategory {
  const k = v.toLowerCase()
  if (/wifi|réseau|reseau|mot de passe|password|ssid/.test(k)) return 'reseaux'
  if (/code|lockbox|clé|cle|porte|serrure|acc[èe]s|access|arriv[ée]e tard/.test(k)) return 'acces'
  if (/logement|adresse|address|ville|city|étage|etage/.test(k)) return 'logement'
  if (/pr[ée]nom|nom\b|first name|name|voyageur|guest/.test(k)) return 'voyageur'
  if (/date|nuit|durée|duree|arriv[ée]e|départ|depart|check-?in|check-?out|nombre.*adultes?/.test(k)) return 'sejour'
  if (/poubelle|recyclage|parking|stationnement|chauffage|climatisation|électricité|ascenseur/.test(k)) return 'pratique'
  if (/restaurant|caf[ée]|bar|activité|activite|transport|gare|aéroport|aeroport|métro|supermarché/.test(k)) return 'reco'
  return 'autre'
}

const CATEGORY_META: Record<FillCategory, { label: string; color: string }> = {
  logement: { label: 'Logement',         color: 'var(--accent-text)' },
  acces:    { label: 'Accès',            color: AMBER },
  reseaux:  { label: 'Wi-Fi',            color: 'var(--accent-text)' },
  voyageur: { label: 'Voyageur',         color: BROWN },
  sejour:   { label: 'Dates du séjour',  color: AMBER },
  pratique: { label: 'Infos pratiques',  color: BROWN },
  reco:     { label: 'Recommandations',  color: 'var(--accent-text)' },
  autre:    { label: 'Autre',            color: 'var(--text-2)' },
}

// Auto-fill : matche un nom de variable normalisé contre les données
// du logement sélectionné. Évite à l'hôte de re-saisir adresse/nom/ville à
// chaque copie de gabarit. Les variables non auto-fillables (ex : description
// libre, montants) restent à remplir dans le modal.
function extractCityFromAdresse(adresse: string | null | undefined): string | null {
  if (!adresse) return null
  // Pattern le plus simple : dernière partie après une virgule, ou avant un code postal
  const m = adresse.match(/(?:^|,\s*)([A-Za-zÀ-ÿ\s'-]+?)(?:\s+\d{4,5}|$)/)
  if (m) return m[1].trim()
  // Fallback : prend les derniers mots non-numériques
  const tokens = adresse.split(/[,\s]+/).filter(Boolean)
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (!/^\d+$/.test(tokens[i])) return tokens[i]
  }
  return null
}

function fmtDateFr(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return null }
}

function nightsBetween(arr: string | null | undefined, dep: string | null | undefined): number | null {
  if (!arr || !dep) return null
  const a = new Date(arr + 'T12:00:00').getTime()
  const d = new Date(dep + 'T12:00:00').getTime()
  if (!isFinite(a) || !isFinite(d)) return null
  return Math.max(0, Math.round((d - a) / 86400000))
}

function buildAutoFillMap(
  logement: LogementOption | null,
  nextContract: NextContractInfo | null,
  hostFullName: string | null,
): Record<string, string> {
  const out: Record<string, string> = {}
  const ville = extractCityFromAdresse(logement?.adresse)

  // ── Variables logement ──
  if (logement?.nom) {
    out['[nom du logement]'] = logement.nom
    out['[nom logement]'] = logement.nom
    out['[location]'] = logement.nom
    out['[property name]'] = logement.nom
    out['[location name]'] = logement.nom
    out['[nom de la chambre]'] = logement.nom
  }
  if (logement?.adresse) {
    out['[adresse]'] = logement.adresse
    out['[adresse complète]'] = logement.adresse
    out['[address]'] = logement.adresse
    out['[full address]'] = logement.adresse
    out['[localisation]'] = logement.adresse
    out['[location description]'] = logement.adresse
  }
  if (ville) {
    out['[ville]'] = ville
    out['[city]'] = ville
  }

  // ── Variables prochain voyageur (next contract) ──
  if (nextContract?.locataire_prenom) {
    out['[prénom]'] = nextContract.locataire_prenom
    out['[first name]'] = nextContract.locataire_prenom
    out['[name]'] = nextContract.locataire_prenom
  }
  const arr = fmtDateFr(nextContract?.date_arrivee)
  const dep = fmtDateFr(nextContract?.date_depart)
  if (arr) {
    out['[date arrivée]'] = arr
    out['[date début]'] = arr
    out['[date]'] = arr
  }
  if (dep) {
    out['[date départ]'] = dep
    out['[date de départ]'] = dep
    out['[date fin]'] = dep
    out['[checkout date]'] = dep
  }
  const nuits = nightsBetween(nextContract?.date_arrivee, nextContract?.date_depart)
  if (nuits !== null && nuits > 0) {
    out['[x nuits]'] = `${nuits} nuit${nuits > 1 ? 's' : ''}`
    out['[nombre nuits]'] = String(nuits)
    out['[durée]'] = `${nuits} nuit${nuits > 1 ? 's' : ''}`
  }

  // ── Variables hôte (profile) ──
  if (hostFullName) {
    const firstName = hostFullName.split(/\s+/)[0] ?? hostFullName
    out['[prénom propriétaire]'] = firstName
    out['[host name]'] = hostFullName
  }

  // ── Colonnes pratiques DIRECTES déjà saisies sur la fiche logement
  //    (heures, WiFi, code accès). Source de vérité prioritaire.
  if (logement?.wifi_nom) {
    out['[nom réseau]']    = logement.wifi_nom
    out['[nom du réseau]'] = logement.wifi_nom
    out['[wifi]']          = logement.wifi_nom
    out['[wifi name]']     = logement.wifi_nom
    out['[ssid]']          = logement.wifi_nom
  }
  if (logement?.wifi_mdp) {
    out['[mot de passe]']      = logement.wifi_mdp
    out['[mot de passe wifi]'] = logement.wifi_mdp
    out['[password]']          = logement.wifi_mdp
    out['[wifi password]']     = logement.wifi_mdp
  }
  if (logement?.code_acces) {
    out['[code]']        = logement.code_acces
    out['[code accès]']  = logement.code_acces
    out['[code acces]']  = logement.code_acces
    out['[code porte]']  = logement.code_acces
    out['[door code]']   = logement.code_acces
  }
  if (logement?.heure_arrivee) {
    out['[heure arrivée]']   = logement.heure_arrivee
    out['[heure arrivee]']   = logement.heure_arrivee
    out['[check-in time]']   = logement.heure_arrivee
    out['[checkin time]']    = logement.heure_arrivee
  }
  if (logement?.heure_depart) {
    out['[heure départ]']     = logement.heure_depart
    out['[heure depart]']     = logement.heure_depart
    out['[check-out time]']   = logement.heure_depart
    out['[checkout time]']    = logement.heure_depart
  }

  // ── Infos pratiques ÉTENDUES (JSONB) : poubelles, restos, transports,
  //    urgences, etc. Saisies dans la section "Infos pratiques" de la fiche.
  if (logement?.infos_pratiques) {
    Object.assign(out, infosPratiquesToFillMap(logement.infos_pratiques))
  }

  return out
}

// Applique l'auto-fill sur un texte, retourne le texte modifié + la liste des
// variables qui n'ont PAS pu être auto-remplies (restent à remplir manuellement).
function applyAutoFill(text: string, fillMap: Record<string, string>): {
  filled: string
  remaining: string[]
} {
  let filled = text
  const allVars = extractVariables(text)
  for (const v of allVars) {
    const key = v.toLowerCase()
    if (fillMap[key]) {
      filled = filled.split(v).join(fillMap[key])
    }
  }
  const remaining = extractVariables(filled)
  return { filled, remaining }
}

type FilterKey = 'mes-messages' | 'all' | 'favorites' | TimingBucket

// ── Props ─────────────────────────────────────────────────────────────────────
interface GabaritsClientProps {
  templates:              Template[]
  initialFavorites:       string[]
  initialCustomizations:  UserTemplateCustomization[]
  initialPinned:          UserPinnedTemplate[]
  logements:              LogementOption[]
  nextContractByLogement: Record<string, NextContractInfo>
  hostFullName:           string | null
  userId:                 string | null
}

const DEFAULT_KEY = 'default' as const
const EMPTY_BUCKETS = (): Record<TimingBucket, string[]> => ({
  'avant-arrivee': [], 'pendant-sejour': [], 'apres-depart': [],
})

// ── Composant principal ───────────────────────────────────────────────────────
export default function GabaritsClient({
  templates,
  initialFavorites,
  initialCustomizations,
  initialPinned,
  logements,
  nextContractByLogement,
  hostFullName,
  userId,
}: GabaritsClientProps) {
  const { confirm: ask, dialog } = useConfirm()

  const [favorites, setFavorites]           = useState<Set<string>>(new Set(initialFavorites))
  const [customizations, setCustomizations] = useState<Record<string, UserTemplateCustomization>>(
    () => Object.fromEntries(initialCustomizations.map(c => [c.template_id, c]))
  )
  // Tous les pins, keyés par logement_id (ou 'default' pour la séquence globale).
  const [allPinned, setAllPinned] = useState<Record<string, Record<TimingBucket, string[]>>>(() => {
    const map: Record<string, Record<TimingBucket, string[]>> = {}
    const sorted = [...initialPinned].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    for (const p of sorted) {
      const key = p.logement_id ?? DEFAULT_KEY
      if (!map[key]) map[key] = EMPTY_BUCKETS()
      map[key][p.timing_bucket].push(p.template_id)
    }
    return map
  })
  // Par défaut sur "✨ Par défaut" (aucun logement) SAUF si l'hôte n'a qu'un
  // seul logement : dans ce cas il n'y a aucune ambiguïté à lever, et le
  // laisser sur "Par défaut" désactivait tout l'auto-fill (WiFi, code
  // d'accès, adresse, heures...) tant qu'il ne cliquait pas explicitement
  // sur son propre logement — obligeant à ressaisir des infos fixes à
  // chaque copie de gabarit alors qu'elles ne changent jamais.
  const [selectedLogementId, setSelectedLogementId] = useState<string | null>(
    () => (logements.length === 1 ? logements[0].id : null)
  )

  // Séquence affichée = celle du logement sélectionné (ou défaut si NULL).
  const pinned = useMemo<Record<TimingBucket, string[]>>(() => {
    const key = selectedLogementId ?? DEFAULT_KEY
    return allPinned[key] ?? EMPTY_BUCKETS()
  }, [allPinned, selectedLogementId])

  function updatePinnedBucket(bucket: TimingBucket, ids: string[]) {
    const key = selectedLogementId ?? DEFAULT_KEY
    setAllPinned(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? EMPTY_BUCKETS()),
        [bucket]: ids,
      },
    }))
  }
  const [expandedBuckets, setExpandedBuckets] = useState<Set<TimingBucket>>(new Set())
  const [expandedHeroCards, setExpandedHeroCards] = useState<Set<string>>(new Set())
  // État drag-and-drop pour réordonner les messages épinglés d'un bucket
  const [drag, setDrag] = useState<{ bucket: TimingBucket; fromIdx: number } | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<{ bucket: TimingBucket; idx: number } | null>(null)

  function toggleHeroExpand(templateId: string) {
    setExpandedHeroCards(prev => {
      const next = new Set(prev)
      if (next.has(templateId)) next.delete(templateId); else next.add(templateId)
      return next
    })
  }

  const [search, setSearch]             = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('mes-messages')
  const [copied, setCopied]             = useState<string | null>(null)
  const [toast, setToast]               = useState<string | null>(null)

  // ── ?cat= (rappels du calendrier, Outils & calculs) : ouvre TA séquence
  // sur la phase concernée (avant l'arrivée, pendant, après), pas la liste
  // de tous les exemples. Avant (01/10/2026, remarqué par Jason) : le rappel
  // « Instructions non envoyées » menait aux gabarits de bienvenue au lieu
  // des messages préparés pour le logement.
  const searchParams = useSearchParams()
  const [focusBucket, setFocusBucket] = useState<TimingBucket | null>(null)
  useEffect(() => {
    const cat = searchParams?.get('cat')
    if (!cat) return
    const bucket = CATEGORY_TO_TIMING[cat]
    setActiveFilter('mes-messages')
    setFocusBucket(bucket ?? null)
  }, [searchParams])
  useEffect(() => {
    if (!focusBucket) return
    const t1 = window.setTimeout(() => {
      document.getElementById(`phase-${focusBucket}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    const t2 = window.setTimeout(() => setFocusBucket(null), 2600)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [focusBucket])

  // ── Pré-sélection du logement depuis ?logement=<id> (raccourci fiche logement)
  useEffect(() => {
    const lid = searchParams?.get('logement')
    if (!lid) return
    if (logements.some(l => l.id === lid)) setSelectedLogementId(lid)
  }, [searchParams, logements])

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [modalTitle, setModalTitle]           = useState('')
  const [modalContent, setModalContent]       = useState('')
  const [modalNotes, setModalNotes]           = useState('')
  const [modalTiming, setModalTiming]         = useState<string>('')
  const [modalContentEn, setModalContentEn]   = useState('')
  const [modalContentPt, setModalContentPt]   = useState('')
  // Contenu à l'ouverture : sert à savoir s'il y a des modifications à perdre
  const [modalSnapshot, setModalSnapshot]     = useState('')
  const [savingModal, setSavingModal]         = useState(false)
  const [deletingCustom, setDeletingCustom]   = useState(false)

  // ── Remplissage variables ─────────────────────────────────────────────────
  const [fillTemplate, setFillTemplate]       = useState<{ t: Template; lang: Lang; prefilled?: string; autoFilledCount?: number; autoFilledVars?: string[]; logementId?: string | null; logementNom?: string | null } | null>(null)
  const [fillValues, setFillValues]           = useState<Record<string, string>>({})

  // ── Pinned (liste ordonnée de messages par phase, par logement) ──────────
  // L'index unique sur (user, bucket, template, COALESCE(logement_id, sentinel))
  // ne supporte pas les expressions dans onConflict, donc on fait DELETE+INSERT.
  async function persistPinnedOrder(bucket: TimingBucket, ids: string[]) {
    if (!userId) return
    const supabase = createClient()
    const lid = selectedLogementId
    let delQ = supabase.from('user_pinned_templates').delete()
      .eq('user_id', userId).eq('timing_bucket', bucket)
    delQ = lid ? delQ.eq('logement_id', lid) : delQ.is('logement_id', null)
    await delQ
    if (ids.length === 0) return
    const rows = ids.map((template_id, position) => ({
      user_id: userId, timing_bucket: bucket, template_id,
      logement_id: lid, position, updated_at: new Date().toISOString(),
    }))
    await supabase.from('user_pinned_templates').insert(rows)
  }

  async function addPin(templateId: string, bucket: TimingBucket) {
    if (!userId) return
    if (pinned[bucket].includes(templateId)) return
    const next = [...pinned[bucket], templateId]
    updatePinnedBucket(bucket, next)
    const supabase = createClient()
    await supabase.from('user_pinned_templates').insert({
      user_id: userId, timing_bucket: bucket, template_id: templateId,
      logement_id: selectedLogementId, position: next.length - 1,
      updated_at: new Date().toISOString(),
    })
    showToast(`Ajouté à ta séquence (message ${next.length})`)
    void markStepIfNotYet('gabarit')
  }

  async function removePin(templateId: string, bucket: TimingBucket) {
    if (!userId) return
    // Confirmation pour éviter les fat-finger taps sur mobile (la croix est
    // à côté du caret expand → un mauvais tap supprimait silencieusement).
    if (!(await ask({ message: 'Retirer ce message de ta séquence ?', confirmLabel: 'Retirer' }))) return
    const next = pinned[bucket].filter(id => id !== templateId)
    updatePinnedBucket(bucket, next)
    // persistPinnedOrder fait un DELETE + INSERT complet de la bucket
    await persistPinnedOrder(bucket, next)
    showToast('Retiré de tes messages')
  }

  async function movePin(bucket: TimingBucket, templateId: string, dir: -1 | 1) {
    const list = pinned[bucket]
    const idx = list.indexOf(templateId)
    if (idx < 0) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= list.length) return
    const next = [...list]
    const [removed] = next.splice(idx, 1)
    next.splice(newIdx, 0, removed)
    updatePinnedBucket(bucket, next)
    await persistPinnedOrder(bucket, next)
  }

  // Drag-and-drop : place un message épinglé à une nouvelle position absolue
  // dans son bucket. Persistance via persistPinnedOrder (UPDATE position en
  // batch). Pas de re-render pessimiste : on update tout de suite côté state.
  async function moveToPosition(bucket: TimingBucket, fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return
    const list = pinned[bucket]
    if (fromIdx < 0 || fromIdx >= list.length) return
    if (toIdx < 0 || toIdx > list.length) return
    const next = [...list]
    const [moved] = next.splice(fromIdx, 1)
    // Si on déplace vers le bas, l'index cible se décale de -1 après splice
    const adjusted = toIdx > fromIdx ? toIdx - 1 : toIdx
    next.splice(adjusted, 0, moved)
    updatePinnedBucket(bucket, next)
    await persistPinnedOrder(bucket, next)
  }

  // Changer un message de phase (ex. un message d'arrivée rangé par erreur
  // dans « Pendant le séjour »)
  async function moveToBucket(templateId: string, from: TimingBucket, to: TimingBucket) {
    if (from === to) return
    const fromList = pinned[from].filter(id => id !== templateId)
    const toList = pinned[to].includes(templateId) ? pinned[to] : [...pinned[to], templateId]
    const key = selectedLogementId ?? DEFAULT_KEY
    setAllPinned(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? EMPTY_BUCKETS()), [from]: fromList, [to]: toList },
    }))
    await persistPinnedOrder(from, fromList)
    await persistPinnedOrder(to, toList)
    showToast(`Déplacé dans « ${SECTION_CONFIG[to].label} »`)
  }

  // Cloner la séquence par défaut vers le logement sélectionné
  async function cloneDefaultToLogement() {
    if (!userId || !selectedLogementId) return
    const defaultPinned = allPinned[DEFAULT_KEY]
    if (!defaultPinned) return
    const supabase = createClient()
    const allRows: Array<{
      user_id: string; timing_bucket: TimingBucket; template_id: string;
      logement_id: string; position: number; updated_at: string;
    }> = []
    for (const bucket of TIMING_ORDER) {
      const ids = defaultPinned[bucket] ?? []
      ids.forEach((template_id, position) => {
        allRows.push({
          user_id: userId, timing_bucket: bucket, template_id,
          logement_id: selectedLogementId, position,
          updated_at: new Date().toISOString(),
        })
      })
    }
    if (allRows.length === 0) {
      showToast('Aucune séquence par défaut à copier')
      return
    }
    await supabase.from('user_pinned_templates').delete()
      .eq('user_id', userId).eq('logement_id', selectedLogementId)
    await supabase.from('user_pinned_templates').insert(allRows)
    setAllPinned(prev => ({
      ...prev,
      [selectedLogementId]: {
        'avant-arrivee':  [...(defaultPinned['avant-arrivee']  ?? [])],
        'pendant-sejour': [...(defaultPinned['pendant-sejour'] ?? [])],
        'apres-depart':   [...(defaultPinned['apres-depart']   ?? [])],
      },
    }))
    showToast('Séquence par défaut copiée pour ce logement')
  }

  function toggleExpanded(bucket: TimingBucket) {
    setExpandedBuckets(prev => {
      const next = new Set(prev)
      if (next.has(bucket)) next.delete(bucket)
      else next.add(bucket)
      return next
    })
  }

  // Templates par phase, triés (popularité décroissante) — utilisé pour le fallback default + la liste d'inspirations
  const templatesByBucketSorted = useMemo(() => {
    const map: Record<TimingBucket, Template[]> = {
      'avant-arrivee': [], 'pendant-sejour': [], 'apres-depart': [],
    }
    for (const t of templates) {
      const b = getTimingBucket(t)
      if (b) map[b].push(t)
    }
    for (const b of TIMING_ORDER) {
      map[b].sort((a, b2) => (b2.copy_count ?? 0) - (a.copy_count ?? 0))
    }
    return map
  }, [templates])

  // Pour chaque phase : liste ordonnée des templates épinglés (résolus)
  function getPinnedTemplates(bucket: TimingBucket): Template[] {
    return pinned[bucket]
      .map(id => templates.find(x => x.id === id))
      .filter((t): t is Template => !!t)
  }

  // Fallback quand l'utilisateur n'a rien épinglé : la suggestion la plus populaire
  function getFallbackTemplate(bucket: TimingBucket): Template | null {
    return templatesByBucketSorted[bucket][0] ?? null
  }

  // ── Favoris ───────────────────────────────────────────────────────────────
  async function toggleFavorite(templateId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!userId) return
    const supabase = createClient()
    const isFav = favorites.has(templateId)
    setFavorites(prev => {
      const next = new Set(prev)
      isFav ? next.delete(templateId) : next.add(templateId)
      return next
    })
    if (isFav) {
      await supabase.from('user_template_favorites').delete().eq('user_id', userId).eq('template_id', templateId)
    } else {
      await supabase.from('user_template_favorites').insert({ user_id: userId, template_id: templateId })
    }
    showToast(isFav ? 'Retiré des favoris' : 'Ajouté aux favoris')
  }

  // ── Copier ────────────────────────────────────────────────────────────────
  async function copyTemplate(t: Template, e: React.MouseEvent, lang: Lang = 'fr') {
    e.stopPropagation()
    const raw = contentFor(t, customizations[t.id], lang) ?? (customizations[t.id]?.content ?? t.content)

    // Auto-fill avec les infos du logement + prochaine résa + profile hôte.
    // Évite à l'hôte de saisir ces vars à chaque copie.
    const currentLogement = selectedLogementId
      ? (logements.find(l => l.id === selectedLogementId) ?? null)
      : null
    const nextContract = currentLogement
      ? (nextContractByLogement[currentLogement.nom] ?? null)
      : null
    const fillMap = buildAutoFillMap(currentLogement, nextContract, hostFullName)
    const initialVars = extractVariables(raw)
    const { filled, remaining } = applyAutoFill(raw, fillMap)
    const autoFilledVars = initialVars
      .filter(v => !remaining.includes(v))
      .map(v => v) // garde la forme originale [Adresse]

    if (remaining.length > 0) {
      // Reste des vars à remplir → modal allégé (seulement les non-remplies)
      // On pré-remplit depuis localStorage si l'hôte a déjà rempli ces vars
      // pour ce logement par le passé : « plus jamais re-saisir le wifi du
      // Casa Do Peidreiro ».
      const memoryKey = currentLogement ? `gabarit-memory-${currentLogement.id}` : null
      const memory: Record<string, string> = (() => {
        if (!memoryKey) return {}
        try { return JSON.parse(localStorage.getItem(memoryKey) ?? '{}') } catch { return {} }
      })()
      setFillTemplate({
        t, lang,
        prefilled: filled,
        autoFilledCount: autoFilledVars.length,
        autoFilledVars,
        logementId: currentLogement?.id ?? null,
        logementNom: currentLogement?.nom ?? null,
      })
      setFillValues(Object.fromEntries(remaining.map(v => [v, memory[v] ?? ''])))
      return
    }
    await doCopy(t.id, filled, lang)
    if (autoFilledVars.length > 0) {
      showToast(`Copié · ${autoFilledVars.length} variable${autoFilledVars.length > 1 ? 's' : ''} pré-remplie${autoFilledVars.length > 1 ? 's' : ''}`)
    }
  }

  async function doCopy(id: string, content: string, lang: Lang) {
    await navigator.clipboard.writeText(content)
    setCopied(id + lang)
    setTimeout(() => setCopied(null), 2000)
    showToast('Copié dans le presse-papier !')
    const supabase = createClient()
    try { await supabase.rpc('increment_copy_count', { template_id: id }) } catch {}

  }

  async function copyWithFill() {
    if (!fillTemplate) return
    const { t, lang, prefilled, logementId } = fillTemplate
    // Si prefilled est défini (auto-fill déjà appliqué), on part de là
    // pour éviter d'écraser les substitutions déjà faites.
    const base = prefilled ?? (contentFor(t, customizations[t.id], lang) ?? t.content)
    let filled = base
    for (const [variable, value] of Object.entries(fillValues)) {
      filled = filled.split(variable).join(value || variable)
    }

    // Mémorise les valeurs renseignées pour CE logement → prochaine copie de
    // gabarit pour le même logement, les vars seront pré-remplies. Économise
    // 10 minutes par semaine sur des champs fixes (WiFi, code accès, etc.).
    if (logementId) {
      try {
        const memoryKey = `gabarit-memory-${logementId}`
        const existing = JSON.parse(localStorage.getItem(memoryKey) ?? '{}')
        const updated = { ...existing }
        let savedCount = 0
        for (const [v, value] of Object.entries(fillValues)) {
          if (value.trim()) {
            updated[v] = value.trim()
            if (!existing[v]) savedCount++
          }
        }
        localStorage.setItem(memoryKey, JSON.stringify(updated))
        if (savedCount > 0) {
          // Toast après le toast "Copié" pour ne pas le masquer
          setTimeout(() => showToast(`${savedCount} info${savedCount > 1 ? 's' : ''} mémorisée${savedCount > 1 ? 's' : ''} pour ce logement`), 1500)
        }
      } catch {}
    }

    await doCopy(t.id, filled, lang)
    setFillTemplate(null)
    setFillValues({})
  }

  // ── Modal personnalisation ────────────────────────────────────────────────
  function openCustomize(t: Template) {
    const existing = customizations[t.id]
    const bucket = getTimingBucket(t)
    const defaultTiming = existing?.timing_label ?? (bucket ? TIMING_LABELS[bucket] : '') ?? ''
    const title = existing?.title ?? t.title
    const content = existing?.content ?? t.content
    const en = existing?.content_en ?? t.corps_en ?? ''
    const pt = existing?.content_pt ?? ''
    const notes = existing?.notes ?? ''
    setEditingTemplate(t)
    setModalTitle(title)
    setModalContent(content)
    setModalContentEn(en)
    setModalContentPt(pt)
    setModalNotes(notes)
    setModalTiming(defaultTiming)
    setModalSnapshot(JSON.stringify([title, content, en, pt, notes, defaultTiming]))
  }

  // Fermer la fenêtre : jamais au clic à côté (Jason perdait sa saisie),
  // et confirmation si des modifications ne sont pas enregistrées.
  async function requestCloseModal() {
    const now = JSON.stringify([modalTitle, modalContent, modalContentEn, modalContentPt, modalNotes, modalTiming])
    if (now !== modalSnapshot && !(await ask({ message: 'Tes modifications ne sont pas enregistrées. Fermer quand même ?', confirmLabel: 'Fermer sans enregistrer' }))) return
    setEditingTemplate(null)
  }

  async function saveCustomization() {
    if (!editingTemplate || !userId) return
    setSavingModal(true)
    const supabase = createClient()
    // Anglais identique à la traduction du modèle : rien à stocker
    const en = modalContentEn.trim()
    const pt = modalContentPt.trim()
    const fields = {
      title: modalTitle.trim() || editingTemplate.title,
      content: modalContent.trim() || editingTemplate.content,
      notes: modalNotes.trim() || null,
      timing_label: modalTiming || null,
    }
    const langs = {
      content_en: en && en !== (editingTemplate.corps_en ?? '').trim() ? en : null,
      content_pt: pt || null,
    }
    const existing = customizations[editingTemplate.id]
    const write = (withLangs: boolean) => {
      const values = withLangs ? { ...fields, ...langs } : fields
      return existing
        ? supabase.from('user_template_customizations').update(values).eq('id', existing.id).select().single()
        : supabase.from('user_template_customizations').insert({ user_id: userId, template_id: editingTemplate.id, ...values }).select().single()
    }
    let result = await write(true)
    // Migration 121 pas encore appliquée : on enregistre au moins le français
    if (result.error?.code === '42703' || result.error?.code === 'PGRST204') {
      result = await write(false)
      if (result.data && (langs.content_en || langs.content_pt)) {
        setTimeout(() => showToast('Versions anglaise et portugaise pas encore disponibles : mise à jour de la base à faire'), 1800)
      }
    }
    if (result.data) {
      setCustomizations(prev => ({ ...prev, [editingTemplate.id]: result.data as UserTemplateCustomization }))
      if (!favorites.has(editingTemplate.id)) {
        setFavorites(prev => new Set([...prev, editingTemplate.id]))
        await supabase.from('user_template_favorites').insert({ user_id: userId, template_id: editingTemplate.id })
      }
      showToast('Ta version est enregistrée')
      void markStepIfNotYet('gabarit')
    }
    setSavingModal(false)
    setEditingTemplate(null)
  }

  async function deleteCustomization() {
    if (!editingTemplate || !userId) return
    const existing = customizations[editingTemplate.id]
    if (!existing) return setEditingTemplate(null)
    setDeletingCustom(true)
    const supabase = createClient()
    await supabase.from('user_template_customizations').delete().eq('id', existing.id)
    setCustomizations(prev => { const next = { ...prev }; delete next[editingTemplate.id]; return next })
    showToast('Version personnalisée supprimée')
    setDeletingCustom(false)
    setEditingTemplate(null)
  }

  function resetModal() {
    if (!editingTemplate) return
    setModalTitle(editingTemplate.title)
    setModalContent(editingTemplate.content)
    setModalContentEn(editingTemplate.corps_en ?? '')
    setModalContentPt('')
    setModalNotes('')
    const b = getTimingBucket(editingTemplate)
    setModalTiming(b ? TIMING_LABELS[b] : '')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = templates.filter(t => {
    const q = search.toLowerCase()
    const matchesSearch = !search || t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q)
    if (activeFilter === 'favorites')      return favorites.has(t.id) && matchesSearch
    if (activeFilter === 'avant-arrivee')  return getTimingBucket(t) === 'avant-arrivee' && matchesSearch
    if (activeFilter === 'pendant-sejour') return getTimingBucket(t) === 'pendant-sejour' && matchesSearch
    if (activeFilter === 'apres-depart')   return getTimingBucket(t) === 'apres-depart' && matchesSearch
    return matchesSearch
  })

  const templatesByBucket = TIMING_ORDER.reduce((acc, bucket) => {
    acc[bucket] = filtered.filter(t => getTimingBucket(t) === bucket)
    return acc
  }, {} as Record<TimingBucket, Template[]>)


  const currentLogement = selectedLogementId ? (logements.find(l => l.id === selectedLogementId) ?? null) : null
  const nextContract = currentLogement ? (nextContractByLogement[currentLogement.nom] ?? null) : null
  const fillStatus: Array<[string, boolean]> = currentLogement ? [
    ['Adresse', !!currentLogement.adresse],
    ['Wi-Fi (réseau et mot de passe)', !!(currentLogement.wifi_nom && currentLogement.wifi_mdp)],
    ["Code d'accès", !!currentLogement.code_acces],
    ["Heures d'arrivée et de départ", !!(currentLogement.heure_arrivee && currentLogement.heure_depart)],
    ['Prochain voyageur (prénom, dates)', !!nextContract],
  ] : []

  const isMesMessagesView = activeFilter === 'mes-messages'
  const isSingleSection   = !['mes-messages', 'all', 'favorites'].includes(activeFilter)

  return (
    <>
      {dialog}
      <style dangerouslySetInnerHTML={{ __html: GAB_CSS }} />
      {toast && (
        <div style={s.toast} role="status">
          <Check size={13} color="#63D683" weight="bold" />
          {toast}
        </div>
      )}

      <div style={s.page}>

        <HubHero
          eyebrowIcon={<ChatCircleText size={14} weight="bold" />}
          eyebrow="Mes messages"
          title={<>Tes messages voyageurs, <HeroEm>prêts à copier</HeroEm></>}
          desc={<>Une séquence par logement : ce que tu envoies avant l&apos;arrivée, pendant le séjour et après le départ. L&apos;adresse, le Wi-Fi et le code d&apos;accès se remplissent tout seuls depuis ta fiche logement.</>}
          steps={[['Choisis', 'ton logement'], ['Range', 'tes messages par moment'], ['Copie', 'et colle dans Airbnb, Booking ou WhatsApp']]}
          aside={
            <div style={{ ...heroCard, minWidth: 'min(100%, 280px)' }}>
              <div style={s.asideLabel}>Ta séquence</div>
              <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '19px', color: 'var(--text)', lineHeight: 1.25 }}>
                {currentLogement?.nom ?? 'Tous tes logements'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                {TIMING_ORDER.map(b => {
                  const cfg = SECTION_CONFIG[b]
                  const n = pinned[b].length
                  return (
                    <button key={b} type="button" onClick={() => { setActiveFilter('mes-messages'); setFocusBucket(b) }} style={s.asideRow}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: cfg.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, textAlign: 'left' }}>{cfg.label}</span>
                      <strong style={{ color: n ? 'var(--text)' : 'var(--text-muted)' }}>{n ? `${n} message${n > 1 ? 's' : ''}` : 'suggestion'}</strong>
                    </button>
                  )
                })}
              </div>
              {nextContract && (
                <div style={s.asideNext}>
                  Prochaine arrivée : <strong style={{ color: 'var(--text)' }}>{nextContract.locataire_prenom ?? 'ton voyageur'}</strong>, le {fmtDateFr(nextContract.date_arrivee)}
                </div>
              )}
            </div>
          }
        />

        <div className="gab-layout">
        <div className="gab-main">

        {/* Barre : logement + vue */}
        <div style={s.toolbar} className="fade-up d1">
          {logements.length > 1 && (
            <div style={s.logementChips} role="group" aria-label="Logement">
              <button
                type="button"
                onClick={() => setSelectedLogementId(null)}
                style={{ ...s.logementChip, ...(selectedLogementId === null ? s.logementChipActive : {}) }}
              >
                Par défaut
              </button>
              {logements.map(l => (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => setSelectedLogementId(l.id)}
                  style={{ ...s.logementChip, ...(selectedLogementId === l.id ? s.logementChipActive : {}) }}
                  title={l.nom}
                >
                  {l.nom}
                </button>
              ))}
            </div>
          )}
          <div style={s.segmented} role="tablist" aria-label="Affichage">
            {([
              { key: 'mes-messages', label: 'Ma séquence', Icon: ListNumbers },
              { key: 'all',          label: 'Exemples',    Icon: Lightbulb },
            ] as { key: FilterKey; label: string; Icon: React.ElementType }[]).map(f => {
              const on = activeFilter === f.key || (f.key === 'all' && isSingleSection)
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => { setActiveFilter(f.key); setSearch('') }}
                  style={{ ...s.segBtn, ...(on ? s.segBtnOn : {}) }}
                >
                  <f.Icon size={14} weight={on ? 'bold' : 'regular'} /> {f.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Recherche : seulement dans les exemples */}
        {!isMesMessagesView && (
          <div style={s.searchWrap} className="fade-up d2">
            <MagnifyingGlass size={15} color="var(--text-3)" />
            <input
              type="text"
              placeholder="Chercher un exemple (Wi-Fi, avis, départ…)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={s.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={s.clearSearch} aria-label="Effacer"><X size={14} /></button>
            )}
          </div>
        )}

        {/* Bandeau "Reprendre la séquence par défaut" si on est sur un logement vide
            mais qu'une séquence par défaut existe */}
        {isMesMessagesView && selectedLogementId !== null && (() => {
          const currentLogementHasPins = TIMING_ORDER.some(b => pinned[b].length > 0)
          const defBuckets = allPinned[DEFAULT_KEY]
          const defaultHasPins = !!defBuckets && TIMING_ORDER.some(b => (defBuckets[b] ?? []).length > 0)
          if (currentLogementHasPins || !defaultHasPins) return null
          const logementName = logements.find(l => l.id === selectedLogementId)?.nom ?? 'ce logement'
          return (
            <div style={s.cloneBanner} className="fade-up d2">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                  Aucune séquence pour {logementName}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '2px' }}>
                  Tu peux repartir de ta séquence par défaut et l&apos;ajuster pour ce logement.
                </div>
              </div>
              <button onClick={cloneDefaultToLogement} style={s.cloneBtn}>
                Copier la séquence par défaut
              </button>
            </div>
          )
        })()}

        {/* Vue Mes 3 messages — hero + inspirations repliables */}
        {isMesMessagesView && (
          <div className="fade-up d1" style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {TIMING_ORDER.map(bucket => {
              const cfg = SECTION_CONFIG[bucket]
              const Icon = cfg.icon
              const pinnedList = getPinnedTemplates(bucket)
              const hasPins = pinnedList.length > 0
              const fallback = !hasPins ? getFallbackTemplate(bucket) : null
              const heroes = hasPins ? pinnedList : (fallback ? [fallback] : [])
              const pinnedIdsSet = new Set(pinned[bucket])
              const inspirations = templatesByBucketSorted[bucket].filter(t => !pinnedIdsSet.has(t.id) && t.id !== fallback?.id)
              const isExpanded = expandedBuckets.has(bucket)

              if (heroes.length === 0) return (
                <div key={bucket} style={{ padding: '20px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '14px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Aucun gabarit pour cette phase pour l&apos;instant.</p>
                </div>
              )

              return (
                <div
                  key={bucket}
                  id={`phase-${bucket}`}
                  style={{
                    scrollMarginTop: 80,
                    borderRadius: 16,
                    transition: 'box-shadow .4s, background .4s',
                    ...(focusBucket === bucket ? { boxShadow: `0 0 0 3px ${cfg.border}`, background: cfg.bg, padding: 12, margin: -12 } : {}),
                  }}
                >
                  {/* Header phase compact */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} color={cfg.color} weight="fill" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                        {cfg.label}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {hasPins
                          ? `${pinnedList.length} message${pinnedList.length > 1 ? 's' : ''} · glisse pour changer l'ordre`
                          : `${cfg.hint} · une suggestion en attendant tes messages`}
                      </div>
                    </div>
                  </div>

                  {/* Liste de hero cards compactes (1, 2, 3...) — drag-and-drop
                      activé seulement sur les épinglés (pas sur les suggestions). */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {heroes.map((t, idx) => {
                      const isDragging = drag?.bucket === bucket && drag?.fromIdx === idx
                      const isDragOver = dragOverIdx?.bucket === bucket && dragOverIdx?.idx === idx && drag?.bucket === bucket && drag?.fromIdx !== idx
                      return (
                        <div
                          key={t.id}
                          draggable={hasPins}
                          onDragStart={hasPins ? (e) => {
                            setDrag({ bucket, fromIdx: idx })
                            e.dataTransfer.effectAllowed = 'move'
                            // Image fantôme par défaut OK ; rien à customiser ici
                          } : undefined}
                          onDragEnd={() => { setDrag(null); setDragOverIdx(null) }}
                          onDragOver={hasPins ? (e) => {
                            if (!drag || drag.bucket !== bucket) return
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            if (dragOverIdx?.bucket !== bucket || dragOverIdx?.idx !== idx) {
                              setDragOverIdx({ bucket, idx })
                            }
                          } : undefined}
                          onDrop={hasPins ? (e) => {
                            e.preventDefault()
                            if (!drag || drag.bucket !== bucket) return
                            const toIdx = idx > drag.fromIdx ? idx + 1 : idx
                            moveToPosition(bucket, drag.fromIdx, toIdx)
                            setDrag(null)
                            setDragOverIdx(null)
                          } : undefined}
                          style={{
                            opacity: isDragging ? 0.4 : 1,
                            transition: 'opacity .15s, transform .15s',
                            // Visuel de drop : trait coloré au-dessus de la card cible
                            borderTop: isDragOver ? `2px solid ${cfg.color}` : '2px solid transparent',
                            paddingTop: isDragOver ? '4px' : 0,
                          }}
                        >
                          <CompactHeroCard
                            template={t}
                            bucket={bucket}
                            isPinned={hasPins}
                            position={hasPins ? idx + 1 : null}
                            totalPinned={hasPins ? pinnedList.length : 0}
                            customization={customizations[t.id]}
                            copied={copied}
                            onCopy={copyTemplate}
                            onCustomize={openCustomize}
                            onAdd={!hasPins ? () => addPin(t.id, bucket) : undefined}
                            onRemove={hasPins ? () => removePin(t.id, bucket) : undefined}
                            onMoveUp={hasPins && idx > 0 ? () => movePin(bucket, t.id, -1) : undefined}
                            onMoveDown={hasPins && idx < pinnedList.length - 1 ? () => movePin(bucket, t.id, 1) : undefined}
                            onMoveTo={hasPins ? (to) => moveToBucket(t.id, bucket, to) : undefined}
                            isExpanded={expandedHeroCards.has(t.id)}
                            onToggleExpand={() => toggleHeroExpand(t.id)}
                            isDraggable={hasPins}
                          />
                        </div>
                      )
                    })}
                  </div>

                  {/* Inspirations repliable */}
                  {inspirations.length > 0 && (
                    <>
                      <button
                        onClick={() => toggleExpanded(bucket)}
                        style={{
                          ...s.seeMoreBtn,
                          marginTop: '14px',
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          background: isExpanded ? cfg.bg : 'transparent',
                        }}
                      >
                        {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                        <span>
                          {isExpanded
                            ? 'Masquer les exemples'
                            : `${hasPins ? 'Ajouter un autre message' : 'Voir d\'autres exemples'} (${inspirations.length})`}
                        </span>
                      </button>

                      {isExpanded && (
                        <div style={{ ...s.grid, marginTop: '14px' }}>
                          {inspirations.map(t => (
                            <TemplateCard
                              key={t.id} template={t}
                              customization={customizations[t.id]}
                              copied={copied} bucket={bucket}
                              isPinned={false}
                              onCopy={copyTemplate} onCustomize={openCustomize}
                              onPin={() => addPin(t.id, bucket)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Vue section unique (depuis ?cat= URL) */}
        {isSingleSection && (
          <div className="fade-up d1">
            {filtered.length === 0 ? (
              <div style={s.empty}>
                <MagnifyingGlass size={36} color="var(--text-muted)" />
                <p style={s.emptyText}>Aucun gabarit pour &ldquo;{search}&rdquo;.</p>
              </div>
            ) : (
              <div style={s.grid}>
                {filtered.map(t => (
                  <TemplateCard
                    key={t.id} template={t}
                    customization={customizations[t.id]}
                    copied={copied} bucket={getTimingBucket(t)}
                    onCopy={copyTemplate} onCustomize={openCustomize}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vue Inspirations (tous les gabarits) */}
        {activeFilter === 'all' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }} className="fade-up d1">
            {TIMING_ORDER.map(bucket => {
              const items = templatesByBucket[bucket]
              if (!items.length) return null
              const cfg = SECTION_CONFIG[bucket]
              const Icon = cfg.icon
              const shown = items.slice(0, INITIAL_SHOW)
              const remaining = items.length - INITIAL_SHOW
              return (
                <div key={bucket}>
                  <SectionHeader Icon={Icon} label={cfg.label} color={cfg.color} count={items.length} />
                  <div style={s.grid}>
                    {shown.map(t => (
                      <TemplateCard key={t.id} template={t} customization={customizations[t.id]} copied={copied} bucket={bucket} onCopy={copyTemplate} onCustomize={openCustomize} />
                    ))}
                  </div>
                  {remaining > 0 && (
                    <button onClick={() => setActiveFilter(bucket)} style={s.seeMoreBtn}>
                      <ArrowRight size={14} color={cfg.color} />
                      <span>Voir les {remaining} autres gabarits &ldquo;{cfg.label}&rdquo;</span>
                    </button>
                  )}
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div style={s.empty}>
                <MagnifyingGlass size={36} color="var(--text-muted)" />
                <p style={s.emptyText}>Aucun gabarit pour &ldquo;{search}&rdquo;.</p>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Colonne de droite : ce qui se remplit tout seul + conseils */}
        <aside className="gab-side">
          <div style={s.sideCard}>
            <div style={s.sideTitle}><Sparkle size={15} weight="fill" color="var(--accent-text)" /> Rempli tout seul</div>
            {currentLogement ? (
              <>
                <p style={s.sideText}>Au moment de copier, ces infos de <strong style={{ color: 'var(--text)' }}>{currentLogement.nom}</strong> remplacent les mots entre crochets.</p>
                <ul style={s.checkList}>
                  {fillStatus.map(([label, ok]) => (
                    <li key={label} style={s.checkItem}>
                      {ok
                        ? <CheckCircle size={16} weight="fill" color="var(--accent-text)" />
                        : <Circle size={16} color="var(--text-muted)" />}
                      <span style={{ color: ok ? 'var(--text)' : 'var(--text-muted)' }}>{label}</span>
                    </li>
                  ))}
                </ul>
                {fillStatus.some(([, ok]) => !ok) && (
                  <Link href={`/dashboard/logements/${currentLogement.id}#modifier-accueil`} style={s.sideLink}>
                    Compléter ma fiche logement <ArrowRight size={13} />
                  </Link>
                )}
              </>
            ) : (
              <p style={s.sideText}>Choisis un logement au-dessus : son adresse, son Wi-Fi, son code d&apos;accès et ses horaires se mettront tout seuls dans tes messages.</p>
            )}
          </div>
          <div style={s.sideCard}>
            <div style={s.sideTitle}><Lightbulb size={15} weight="fill" color={AMBER} /> Bon à savoir</div>
            <ul style={s.tipList}>
              <li>Les mots entre crochets, comme [Prénom], sont à compléter : l&apos;app te les demande quand tu copies.</li>
              <li>Ton message existe en anglais ou en portugais ? Ouvre « Personnaliser » puis les onglets de langue.</li>
              <li>Un message mal rangé ? Menu « ⋮ » puis « Déplacer vers ».</li>
              <li>Ce que tu complètes à la main est gardé pour ce logement, sur cet appareil.</li>
            </ul>
          </div>
        </aside>
        </div>
      </div>

      {/* Modal remplissage variables */}
      {fillTemplate && (
        <div style={s.overlay} role="dialog" aria-modal="true">
          <div style={{ ...s.modal, maxWidth: '520px' }}>
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>Plus que {Object.keys(fillValues).length} info{Object.keys(fillValues).length > 1 ? 's' : ''} à compléter</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Personnalise ce message avant de le copier
                </p>
              </div>
              <button onClick={() => setFillTemplate(null)} style={s.closeBtn}><X size={18} /></button>
            </div>

            {/* Indicateur "X variables déjà pré-remplies depuis ton dashboard" */}
            {(() => {
              const filled = fillTemplate.autoFilledCount ?? 0
              if (filled <= 0) return null
              const vars = fillTemplate.autoFilledVars ?? []
              return (
              <div style={{
                margin: '0 24px 4px',
                padding: '10px 12px',
                background: 'linear-gradient(135deg, rgba(99,214,131,0.08) 0%, rgba(99,214,131,0.02) 100%)',
                border: '1px solid rgba(99,214,131,0.22)',
                borderRadius: '10px',
                fontSize: '12px',
                color: 'var(--text-2)',
                lineHeight: 1.5,
                display: 'flex',
                gap: '9px',
                alignItems: 'flex-start',
              }}>
                <Sparkle size={13} weight="fill" style={{ color: '#5DC077', flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong style={{ color: 'var(--text)' }}>{filled} variable{filled > 1 ? 's' : ''} pré-remplie{filled > 1 ? 's' : ''}</strong> depuis ton logement et ta prochaine réservation
                  {vars.length > 0 && (
                    <span style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      {vars.slice(0, 4).join(' · ')}
                      {vars.length > 4 && ` · +${vars.length - 4}`}
                    </span>
                  )}
                </span>
              </div>
              )
            })()}

            <div style={{ ...s.modalBody, gap: '14px' }}>
              {(() => {
                // Groupe les variables par catégorie pour structurer le formulaire.
                // Ordre fixe pour cohérence visuelle entre les copies de gabarits.
                const ordered: FillCategory[] = ['logement', 'acces', 'reseaux', 'voyageur', 'sejour', 'pratique', 'reco', 'autre']
                const groups: Record<string, string[]> = {}
                for (const v of Object.keys(fillValues)) {
                  const cat = categorizeVariable(v)
                  if (!groups[cat]) groups[cat] = []
                  groups[cat].push(v)
                }
                const allVars = Object.keys(fillValues)
                const firstVar = allVars[0]
                return ordered
                  .filter(cat => groups[cat] && groups[cat].length > 0)
                  .map(cat => {
                    const meta = CATEGORY_META[cat]
                    return (
                      <div key={cat} style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                          textTransform: 'uppercase' as const, color: meta.color,
                          padding: '4px 0',
                        }}>
                          {meta.label}
                          <span style={{
                            fontSize: '10px', fontWeight: 700,
                            padding: '1px 6px', borderRadius: '999px',
                            background: tint(meta.color, 14),
                          }}>{groups[cat].length}</span>
                        </div>
                        {groups[cat].map(variable => (
                          <div key={variable} style={s.fieldGroup}>
                            <label style={s.label}>{variable}</label>
                            <input
                              value={fillValues[variable]}
                              onChange={e => setFillValues(prev => ({ ...prev, [variable]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  const idx = allVars.indexOf(variable)
                                  const next = allVars[idx + 1]
                                  if (next) {
                                    const el = document.querySelector<HTMLInputElement>(`input[data-fillvar="${CSS.escape(next)}"]`)
                                    el?.focus()
                                  } else {
                                    copyWithFill()
                                  }
                                }
                              }}
                              data-fillvar={variable}
                              placeholder={`Remplace ${variable}`}
                              style={s.input}
                              autoFocus={firstVar === variable}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  })
              })()}

              {fillTemplate.logementNom && (
                <div style={{
                  padding: '10px 12px', marginTop: '4px',
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '11.5px', color: 'var(--text-3)', lineHeight: 1.5,
                }}>
                  Tes infos seront <strong style={{ color: 'var(--text-2)' }}>mémorisées pour {fillTemplate.logementNom}</strong> : la prochaine copie pré-remplit automatiquement.
                </div>
              )}
            </div>
            <div style={s.modalFooter}>
              <button onClick={() => setFillTemplate(null)} style={s.ghostBtn}>Annuler</button>
              <button onClick={copyWithFill} className="btn-primary" style={{ fontSize: '13px', padding: '10px 20px' }}>
                <Copy size={14} /> Copier le message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal personnalisation */}
      {editingTemplate && (
        <CustomizeModal
          template={editingTemplate} existing={customizations[editingTemplate.id]}
          title={modalTitle} content={modalContent} contentEn={modalContentEn} contentPt={modalContentPt}
          notes={modalNotes} timing={modalTiming}
          saving={savingModal} deleting={deletingCustom}
          onTitleChange={setModalTitle} onContentChange={setModalContent}
          onContentEnChange={setModalContentEn} onContentPtChange={setModalContentPt}
          onNotesChange={setModalNotes} onTimingChange={setModalTiming}
          onSave={saveCustomization} onDelete={deleteCustomization}
          onReset={resetModal} onClose={requestCloseModal}
        />
      )}
    </>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ Icon, label, color, bg, border, count }: {
  Icon: React.ElementType; label: string; color: string; bg?: string; border?: string; count: number
}) {
  const iconBg  = bg     ?? tint(color, 12)
  const iconBdr = border ?? tint(color, 30)
  const cntBg   = bg     ?? tint(color, 10)
  const cntBdr  = border ?? tint(color, 25)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
        background: iconBg, border: `1px solid ${iconBdr}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={color} weight="fill" />
      </div>
      <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 400, color: 'var(--text)' }}>
        {label}
      </span>
      <span style={{
        fontSize: '11px', fontWeight: 600, color, background: cntBg,
        border: `1px solid ${cntBdr}`, borderRadius: '100px', padding: '2px 10px', marginLeft: '2px',
      }}>
        {count}
      </span>
    </div>
  )
}

// ── Compact hero card (message principal, collapsible) ───────────────────────

interface HeroCardProps {
  template:      Template
  bucket:        TimingBucket
  isPinned:      boolean
  position?:     number | null
  totalPinned?:  number
  customization: UserTemplateCustomization | undefined
  copied:        string | null
  onCopy:        (t: Template, e: React.MouseEvent, lang: Lang) => void
  onCustomize:   (t: Template) => void
  onAdd?:        () => void
  onRemove?:     () => void
  onMoveUp?:     () => void
  onMoveDown?:   () => void
  onMoveTo?:     (to: TimingBucket) => void
  isExpanded:    boolean
  onToggleExpand: () => void
  // Affiche la poignée de drag (≡) — pour le drag-and-drop activé sur les épinglés
  isDraggable?:  boolean
}

function CompactHeroCard({
  template: t, bucket, isPinned, position, totalPinned, customization, copied,
  onCopy, onCustomize, onAdd, onRemove, onMoveUp, onMoveDown, onMoveTo, isExpanded, onToggleExpand,
  isDraggable,
}: HeroCardProps) {
  const [lang, setLang] = useState<Lang>('fr')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const langs = langsOf(t, customization)
  const cfg = SECTION_CONFIG[bucket]
  const copiedKey = t.id + lang
  const isCopied = copied === copiedKey

  const displayContent = contentFor(t, customization, lang) ?? (customization?.content ?? t.content)
  const displayTitle = customization?.title ?? t.title
  const variables = extractVariables(displayContent)

  // Aperçu : les premières lignes à la suite (avant : seulement « Bonjour, »)
  const previewText = (() => {
    const flat = displayContent.split('\n').map(l => l.trim()).filter(Boolean).join(' ')
    return flat.length > 220 ? flat.slice(0, 220) + '…' : flat
  })()

  // Fermer le menu si clic à l'extérieur
  useEffect(() => {
    if (!menuOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  const hasMenuActions = !!(onMoveUp || onMoveDown || onRemove || onMoveTo)

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${cfg.border}`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: '12px',
      // overflow: visible — sinon le menu déroulant des "⋮" est clippé par
      // les bords de la carte et passe derrière les cartes du dessous. Pas
      // de risque sur les coins : la carte porte elle-même son background
      // arrondi, aucun enfant n'a un bg qui atteint les bords.
      overflow: 'visible',
      // position + z-index : quand le menu est ouvert, on monte la carte
      // au-dessus des cartes suivantes (sinon le dropdown reste piégé en
      // stacking-order document, masqué par le card d'après).
      position: 'relative' as const,
      zIndex: menuOpen ? 40 : undefined,
      transition: 'border-color .15s',
    }}>
      {/* Header compact 1 ligne : type-icon + titre + Épingler/Copier + ⋮ + caret */}
      <div
        onClick={onToggleExpand}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px',
          cursor: 'pointer', userSelect: 'none' as const,
          borderBottom: isExpanded ? `1px solid ${cfg.border}` : 'none',
          minHeight: '48px',
        }}
      >
        {/* Poignée de drag — visible seulement pour les messages épinglés
            (draggables). Curseur grab pour signaler l'interaction. */}
        {isDraggable && (
          <span
            aria-hidden="true"
            title="Glisser pour réordonner"
            style={{
              color: 'var(--text-muted)',
              cursor: 'grab',
              display: 'flex', alignItems: 'center',
              flexShrink: 0,
              padding: '0 2px',
              marginLeft: '-4px',
            }}
          >
            <DotsSixVertical size={16} weight="bold" />
          </span>
        )}

        {/* Numéro de position si épinglé, sinon petite icône type */}
        {isPinned && position ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            fontSize: '11px', fontWeight: 700, color: cfg.color,
            fontFamily: 'var(--font-fraunces), serif',
          }}>{position}</span>
        ) : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px', borderRadius: '7px', flexShrink: 0,
            background: cfg.bg, color: cfg.color,
          }}>
            {isPinned
              ? <PushPin size={12} weight="fill" />
              : <Sparkle size={12} weight="fill" />}
          </span>
        )}

        {/* Titre + petite pill "perso" si personnalisé */}
        <span style={{
          flex: 1, minWidth: 0,
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '14px', fontWeight: 600, color: 'var(--text)',
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, minWidth: 0 }}>
            {displayTitle}
          </span>
          {customization && (
            <span title="Ta version personnalisée" style={s.persoChip}>Ma version</span>
          )}
          {langs.length > 1 && (
            <span title={langs.map(l => LANG_NAME[l]).join(', ')} style={s.langCount}>
              <Translate size={11} /> {langs.map(l => LANG_LABEL[l]).join(' · ')}
            </span>
          )}
        </span>

        {/* Actions inline droite */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {/* Épingler : visible seulement pour les suggestions à ajouter */}
          {onAdd && (
            <button
              onClick={onAdd}
              style={{
                ...s.heroPinBtn,
                fontSize: '12px',
              }}
              aria-label="Épingler à ma séquence"
              title="Épingler à ma séquence"
            >
              <PushPin size={11} /> <span className="gab-md-text">Épingler</span>
            </button>
          )}

          {/* Copier — action primaire */}
          <button
            onClick={e => { e.stopPropagation(); onCopy(t, e, lang) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '7px 12px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '12.5px', fontWeight: 700, flexShrink: 0,
              fontFamily: 'var(--font-outfit), sans-serif',
              transition: 'all 0.15s',
              ...(isCopied
                ? { background: 'var(--accent-text)', border: '1px solid var(--accent-text)', color: 'var(--bg)' }
                : { background: 'var(--accent-bg-2)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' }
              ),
            }}
            aria-label="Copier le message"
            title={isCopied ? 'Copié' : 'Copier'}
          >
            {isCopied
              ? <><Check size={12} weight="bold" /> <span className="gab-md-text">Copié</span></>
              : <><Copy size={12} weight="bold" /> <span className="gab-md-text">Copier</span></>}
          </button>

          {/* Kebab menu : actions secondaires (déplacer, retirer) */}
          {hasMenuActions && (
            <div ref={menuRef} style={{ position: 'relative' as const }}>
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
                style={s.heroIconBtn}
                aria-label="Plus d'actions"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title="Plus d'actions"
              >
                <DotsThreeVertical size={14} weight="bold" />
              </button>
              {menuOpen && (
                <div role="menu" style={{
                  position: 'absolute' as const, top: 'calc(100% + 6px)', right: 0, zIndex: 30,
                  minWidth: '190px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '10px', boxShadow: '0 16px 32px rgba(0,0,0,.35)',
                  padding: '4px', display: 'flex', flexDirection: 'column' as const, gap: '1px',
                }}>
                  {onMoveUp && (
                    <button role="menuitem" onClick={() => { onMoveUp(); setMenuOpen(false) }} style={s.menuItem}>
                      <CaretUp size={13} weight="bold" /> Remonter
                    </button>
                  )}
                  {onMoveDown && (
                    <button role="menuitem" onClick={() => { onMoveDown(); setMenuOpen(false) }} style={s.menuItem}>
                      <CaretDown size={13} weight="bold" /> Descendre
                    </button>
                  )}
                  <button role="menuitem" onClick={() => { onCustomize(t); setMenuOpen(false) }} style={s.menuItem}>
                    <PencilSimple size={13} /> {customization ? 'Modifier ma version' : 'Personnaliser'}
                  </button>
                  {onMoveTo && (
                    <>
                      <div style={s.menuSep}>Déplacer vers</div>
                      {TIMING_ORDER.filter(b => b !== bucket).map(b => (
                        <button key={b} role="menuitem" onClick={() => { onMoveTo(b); setMenuOpen(false) }} style={s.menuItem}>
                          <ArrowBendDownRight size={13} /> {SECTION_CONFIG[b].label}
                        </button>
                      ))}
                    </>
                  )}
                  {onRemove && (
                    <button role="menuitem" onClick={() => { onRemove(); setMenuOpen(false) }} style={{ ...s.menuItem, color: 'var(--danger)', borderTop: '1px solid var(--border)', borderRadius: 0, marginTop: 2 }}>
                      <Trash size={13} /> Retirer de ma séquence
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caret expand — bouton dédié EN DEHORS du conteneur stopPropagation
            pour que le clic dessus (et autour) déclenche bien le toggle.
            Avant : le caret était dans le wrapper actions et nécessitait un
            tir précis à droite. */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleExpand() }}
          aria-label={isExpanded ? 'Réduire le message' : 'Voir le message'}
          aria-expanded={isExpanded}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0,
            transition: 'transform 0.2s, background 0.15s',
            transform: isExpanded ? 'rotate(180deg)' : 'none',
          }}
        >
          <CaretDown size={13} weight="bold" />
        </button>
      </div>

      {/* Collapsed : preview compact 2 lignes sous le titre (sans Copier dupliqué) */}
      {!isExpanded && (
        <div style={{ padding: '0 14px 11px 46px' }}>
          <span style={{
            fontSize: '12.5px', fontWeight: 300,
            color: 'var(--text-muted)', fontFamily: 'var(--font-outfit), sans-serif',
            display: '-webkit-box',
            WebkitLineClamp: 2 as unknown as number,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden', lineHeight: 1.55,
          }}>{previewText}</span>
        </div>
      )}

      {/* Expanded: full content + actions */}
      {isExpanded && (
        <div style={{ padding: '14px 16px 16px' }}>
          {variables.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
              {variables.map(v => <span key={v} style={s.varChip}>{v}</span>)}
            </div>
          )}
          <pre style={{ ...s.heroContent, marginBottom: '12px' }}>{displayContent}</pre>
          {(customization?.notes || customization?.timing_label) && (
            <div style={{ ...s.notePreview, marginBottom: '12px' }}>
              {customization?.timing_label && <span style={s.timingTag}>{customization.timing_label}</span>}
              {customization?.notes && <span style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>{customization.notes}</span>}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
            {langs.length > 1 && (
              <div style={s.langToggle} role="group" aria-label="Langue du message">
                {langs.map(l => (
                  <button key={l} type="button" onClick={() => setLang(l)} title={LANG_NAME[l]} style={{ ...s.langBtn, ...(lang === l ? s.langBtnActive : {}) }}>{LANG_LABEL[l]}</button>
                ))}
              </div>
            )}
            <button onClick={() => onCustomize(t)} style={s.heroEditBtn}>
              <PencilSimple size={13} /> {customization ? 'Modifier ma version' : 'Personnaliser'}
            </button>
            <button
              onClick={e => onCopy(t, e, lang)}
              style={{
                ...s.heroCopyBtn,
                ...(isCopied ? s.copyBtnDone : { background: 'var(--accent-bg-2)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' }),
              }}
            >
              {isCopied
                ? <><Check size={15} weight="bold" /> Copié !</>
                : <><Copy size={15} weight="bold" /> {lang === 'fr' ? 'Copier mon message' : `Copier en ${LANG_NAME[lang].toLowerCase()}`}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Template card (Inspirations) ──────────────────────────────────────────────

interface TemplateCardProps {
  template:      Template
  customization: UserTemplateCustomization | undefined
  copied:        string | null
  bucket:        TimingBucket | null
  isPinned?:     boolean
  onCopy:        (t: Template, e: React.MouseEvent, lang: Lang) => void
  onCustomize:   (t: Template) => void
  onPin?:        () => void
}

function TemplateCard({ template: t, customization, copied, bucket, isPinned, onCopy, onCustomize, onPin }: TemplateCardProps) {
  const [lang, setLang] = useState<Lang>('fr')
  const langs = langsOf(t, customization)
  const hasEN = langs.length > 1
  const cfg         = bucket ? SECTION_CONFIG[bucket] : null
  const accentColor = cfg ? cfg.color : 'var(--text-muted)'
  const accentBg    = cfg ? cfg.bg    : 'var(--surface-2)'
  const accentBdr   = cfg ? cfg.border : 'var(--border)'
  const copiedKey = t.id + lang
  const isCopied = copied === copiedKey

  const displayContent = contentFor(t, customization, lang) ?? (customization?.content ?? t.content)
  const displayTitle = customization?.title ?? t.title
  const categoryLabel = CATEGORY_LABELS[t.category] ?? t.category

  return (
    <div style={{ ...s.card, borderLeftColor: accentColor }}>
      {/* Header */}
      <div style={s.cardHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}>
          <span style={{ ...s.catChip, background: accentBg, color: accentColor, border: `1px solid ${accentBdr}` }}>
            {categoryLabel}
          </span>
          {customization && (
            <span style={s.persoChip}>Ma version</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {onPin && bucket && (
            <button
              onClick={onPin}
              style={{ ...s.iconBtn, ...(isPinned ? s.iconBtnPinActive : {}) }}
              title={isPinned ? 'Déjà dans ta séquence' : 'Ajouter à ta séquence de messages'}
            >
              <PushPin size={14} weight={isPinned ? 'fill' : 'regular'} color={isPinned ? 'var(--accent-text)' : undefined} />
            </button>
          )}
          <button
            onClick={() => onCustomize(t)}
            style={{ ...s.iconBtn, ...(customization ? s.iconBtnCustomActive : {}) }}
            title="Personnaliser"
          >
            <PencilSimple size={14} weight={customization ? 'fill' : 'regular'} />
          </button>
        </div>
      </div>

      {/* Titre */}
      <div style={s.cardTitle}>{displayTitle}</div>

      {/* Contenu */}
      <div style={s.contentWrap}>
        <pre style={s.content}>{displayContent}</pre>
        <div style={s.contentFade} />
      </div>

      {/* Note privée */}
      {customization?.notes && (
        <div style={s.notePreview}>
          <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{customization.notes}</span>
        </div>
      )}

      {/* Footer : copier */}
      <div style={s.cardFooter}>
        {hasEN && (
          <div style={s.langToggle} role="group" aria-label="Langue du message">
            {langs.map(l => (
              <button key={l} type="button" onClick={() => setLang(l)} title={LANG_NAME[l]} style={{ ...s.langBtn, ...(lang === l ? s.langBtnActive : {}) }}>{LANG_LABEL[l]}</button>
            ))}
          </div>
        )}
        <button
          onClick={e => onCopy(t, e, lang)}
          style={{
            ...s.copyBtn,
            ...(isCopied ? s.copyBtnDone : { border: `1px solid ${accentBdr}`, color: accentColor }),
            flex: hasEN ? undefined : 1,
          }}
        >
          {isCopied
            ? <><Check size={14} weight="bold" /> Copié !</>
            : <><Copy size={14} /> {lang === 'fr' ? 'Copier le message' : `Copier en ${LANG_NAME[lang].toLowerCase()}`}</>
          }
        </button>
      </div>
    </div>
  )
}

// ── Modal personnalisation (DA 01/10/2026) ────────────────────────────────────
// Ne se ferme plus au clic à côté (Jason perdait sa saisie) : croix, Annuler
// ou Échap, avec confirmation s'il reste des modifications. Onglets FR / EN /
// PT pour écrire le même message dans plusieurs langues.

interface CustomizeModalProps {
  template: Template; existing?: UserTemplateCustomization
  title: string; content: string; contentEn: string; contentPt: string; notes: string; timing: string
  saving: boolean; deleting: boolean
  onTitleChange: (v: string) => void; onContentChange: (v: string) => void
  onContentEnChange: (v: string) => void; onContentPtChange: (v: string) => void
  onNotesChange: (v: string) => void; onTimingChange: (v: string) => void
  onSave: () => void; onDelete: () => void; onReset: () => void; onClose: () => void
}

function CustomizeModal({
  template, existing, title, content, contentEn, contentPt, notes, timing,
  saving, deleting,
  onTitleChange, onContentChange, onContentEnChange, onContentPtChange, onNotesChange, onTimingChange,
  onSave, onDelete, onReset, onClose,
}: CustomizeModalProps) {
  const [tab, setTab] = useState<Lang>('fr')
  const bucket = getTimingBucket(template)
  const cfg = bucket ? SECTION_CONFIG[bucket] : SECTION_CONFIG['avant-arrivee']
  const categoryLabel = CATEGORY_LABELS[template.category] ?? template.category
  const values: Record<Lang, string> = { fr: content, en: contentEn, pt: contentPt }
  const setters: Record<Lang, (v: string) => void> = { fr: onContentChange, en: onContentEnChange, pt: onContentPtChange }
  const current = values[tab]
  const variables = extractVariables(current)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Différé : sinon la même touche Échap referme aussitôt la confirmation
      // et rien si la confirmation est déjà ouverte (elle gère Échap elle-même)
      if (e.key === 'Escape') {
        if (document.querySelector('[role="presentation"] [role="dialog"]')) return
        e.preventDefault(); setTimeout(onClose, 0)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); onSave() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, onSave])

  return (
    <div style={s.overlay} role="dialog" aria-modal="true" aria-labelledby="gab-modal-title">
      <div style={{ ...s.modal, maxWidth: '760px' }}>
        <div style={s.modalHeaderNew}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <span style={{ ...s.modalIcon, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
              <PencilSimple size={18} weight="bold" />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {cfg.label} · {categoryLabel}
              </div>
              <h3 id="gab-modal-title" style={s.modalTitle}>{existing ? 'Modifier ma version' : 'Personnaliser ce message'}</h3>
            </div>
          </div>
          <button onClick={onClose} style={s.closeBtn} aria-label="Fermer"><X size={18} /></button>
        </div>

        <div style={s.modalBody}>
          <div style={s.fieldRow}>
            <div style={{ ...s.fieldGroup, flex: '1 1 260px' }}>
              <label style={s.label} htmlFor="gab-title">Nom du message</label>
              <input id="gab-title" className="gab-input" value={title} onChange={e => onTitleChange(e.target.value)} placeholder={template.title} style={s.input} />
            </div>
            <div style={{ ...s.fieldGroup, flex: '1 1 220px' }}>
              <label style={s.label} htmlFor="gab-when">Quand l&apos;envoyer ?</label>
              <input id="gab-when" className="gab-input" value={timing} onChange={e => onTimingChange(e.target.value)} placeholder="Ex. J-2 à 18 h" style={s.input} />
            </div>
          </div>
          <div style={s.timingBtns}>
            {TIMING_SHORTCUTS.map(sc => (
              <button key={sc} type="button" onClick={() => onTimingChange(sc)}
                style={{ ...s.timingBtn, ...(timing === sc ? s.timingBtnActive : {}) }}>{sc}</button>
            ))}
          </div>

          <div style={s.fieldGroup}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <span style={s.label}>Mon message</span>
              <div style={s.langTabs} role="tablist" aria-label="Langue">
                {(['fr', 'en', 'pt'] as Lang[]).map(l => {
                  const filled = !!values[l].trim()
                  return (
                    <button key={l} type="button" role="tab" aria-selected={tab === l} onClick={() => setTab(l)}
                      style={{ ...s.langTab, ...(tab === l ? s.langTabOn : {}) }}>
                      {LANG_NAME[l]}
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: filled ? 'var(--accent-text)' : 'var(--border)' }} aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </div>
            {tab !== 'fr' && !current.trim() && (
              <div style={s.langEmpty}>
                <Translate size={16} color="var(--accent-text)" />
                <span style={{ flex: 1 }}>
                  Pas encore de version {tab === 'en' ? 'anglaise' : 'portugaise'}. Écris-la ou colle ta traduction ici : elle se copiera quand tu choisis {LANG_LABEL[tab]} sur le message.
                </span>
                <button type="button" style={s.ghostBtn} onClick={() => setters[tab](content)}>Partir du français</button>
              </div>
            )}
            <textarea
              key={tab}
              className="gab-input"
              value={current}
              onChange={e => setters[tab](e.target.value)}
              style={s.textarea}
              rows={12}
              placeholder={tab === 'fr' ? 'Ton message…' : tab === 'en' ? 'Your message in English…' : 'A tua mensagem em português…'}
            />
            {variables.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>À compléter au moment de copier :</span>
                {variables.map(v => <span key={v} style={s.varChip}>{v}</span>)}
              </div>
            )}
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label} htmlFor="gab-notes">Note pour moi <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(facultatif, jamais envoyée)</span></label>
            <textarea id="gab-notes" className="gab-input" value={notes} onChange={e => onNotesChange(e.target.value)} placeholder="Ex. À envoyer dans la messagerie Airbnb, pas par SMS" style={{ ...s.textarea, minHeight: '64px' }} rows={2} />
          </div>
        </div>

        <div style={s.modalFooter}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {existing && (
              <button type="button" onClick={onDelete} style={s.deleteBtnSmall} disabled={deleting}>
                <Trash size={13} /> {deleting ? 'Suppression…' : 'Supprimer ma version'}
              </button>
            )}
            <button type="button" onClick={onReset} style={s.ghostBtn}>Revenir au modèle</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Annuler</button>
            <button type="button" onClick={onSave} style={s.saveBtn} disabled={saving}>
              <Check size={14} weight="bold" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Colonnes au-delà de 1200 px (séquence à gauche, aide à droite), champs
// avec contour vert au focus. CSS constant, sans apostrophe ni guillemet.
const GAB_CSS = `
.gab-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: start; }
.gab-side { display: flex; flex-direction: column; gap: 16px; }
@media (min-width: 1200px) {
  .gab-layout { grid-template-columns: minmax(0, 1fr) 320px; gap: 32px; }
  .gab-side { position: sticky; top: 84px; }
}
.gab-md-text { display: inline; }
@media (max-width: 480px) { .gab-md-text { display: none; } }
[role=menuitem]:hover { background: var(--surface-2) !important; }
.gab-input:focus { border-color: var(--accent-text) !important; box-shadow: 0 0 0 3px var(--accent-bg); }
`

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:      { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro:     { marginBottom: 'clamp(18px, 2.5vw, 24px)' },
  pageTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 400, color: 'var(--text)', marginBottom: '6px', letterSpacing: '-0.01em', lineHeight: 1.15 },
  pageDesc:  { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '600px', lineHeight: 1.6, margin: 0 },

  logementSelector: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
    marginBottom: 'clamp(16px, 2.5vw, 22px)',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--border)',
  },
  logementSelectorLabel: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.7px',
  },
  logementChips: { display: 'flex', flexWrap: 'wrap', gap: '6px', flex: '1 1 auto' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' },
  segmented: { display: 'inline-flex', padding: '4px', gap: '4px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', flexShrink: 0 },
  segBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '9px', cursor: 'pointer',
    background: 'transparent', border: '1px solid transparent', color: 'var(--text-2)', fontSize: '13.5px', fontWeight: 600,
  },
  segBtnOn: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },
  asideLabel: { fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  asideRow: {
    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', borderRadius: '9px', cursor: 'pointer',
    background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-2)',
  },
  asideNext: { fontSize: '12.5px', color: 'var(--text-2)', marginTop: '4px', paddingTop: '10px', borderTop: '1px solid var(--border)' },
  sideCard: { padding: '18px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' },
  sideTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', color: 'var(--text)' },
  sideText: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 },
  checkList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '7px' },
  checkItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  sideLink: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none', marginTop: '2px' },
  tipList: { margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 },
  persoChip: {
    flexShrink: 0, fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', whiteSpace: 'nowrap',
  },
  langCount: {
    flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700,
    padding: '2px 8px', borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', whiteSpace: 'nowrap',
  },
  menuSep: { fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 12px 2px' },
  timingTag: {
    display: 'inline-block', marginRight: '8px', fontSize: '11.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
    background: tint(AMBER, 12), border: `1px solid ${tint(AMBER, 30)}`, color: AMBER,
  },
  modalHeaderNew: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
    padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0,
  },
  modalIcon: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fieldRow: { display: 'flex', flexWrap: 'wrap', gap: '14px' },
  langTabs: { display: 'inline-flex', padding: '3px', gap: '3px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' },
  langTab: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
    background: 'transparent', border: '1px solid transparent', color: 'var(--text-2)', fontSize: '12.5px', fontWeight: 600,
  },
  langTabOn: { background: 'var(--surface)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },
  langEmpty: {
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '10px 12px', borderRadius: '10px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5,
  },
  logementChip: {
    fontSize: '12px', fontWeight: 500, padding: '6px 12px',
    borderRadius: '100px', cursor: 'pointer',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  logementChipActive: {
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)', fontWeight: 600,
  },

  cloneBanner: {
    display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
    padding: '14px 18px', marginBottom: '24px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    borderRadius: '12px',
  },
  cloneBtn: {
    fontSize: '13px', fontWeight: 600, padding: '10px 18px',
    borderRadius: '100px', cursor: 'pointer',
    background: 'var(--accent-text)', border: 'none', color: 'var(--bg)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'transform 0.15s',
  },

  nav: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' },
  navBtn: {
    fontSize: '13px', fontWeight: 500, padding: '8px 16px',
    borderRadius: '100px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: '6px',
    whiteSpace: 'nowrap',
  },
  navCount: { fontSize: '10px', fontWeight: 700, borderRadius: '100px', padding: '1px 7px' },

  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '11px 16px',
    maxWidth: '520px', width: '100%', marginBottom: '24px',
  },
  searchInput: {
    background: 'none', border: 'none', outline: 'none',
    fontFamily: 'var(--font-outfit), sans-serif', fontSize: '14px', color: 'var(--text)', width: '100%',
  },
  clearSearch: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: '2px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '16px' },

  card: {
    display: 'flex', flexDirection: 'column', gap: '14px',
    padding: '22px 22px 18px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderLeft: '3px solid', borderRadius: '16px',
    transition: 'box-shadow 0.18s',
  },
  cardHead:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  catChip:   { fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.2px' },
  customChip: {
    fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)',
  },
  cardTitle: { fontSize: '16px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 },

  iconBtn: {
    width: '28px', height: '28px', borderRadius: '7px',
    background: 'transparent', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-3)', transition: 'all 0.15s', flexShrink: 0,
  },
  iconBtnFavActive:    { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },
  iconBtnCustomActive: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },
  iconBtnPinActive:    { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },

  contentWrap: { position: 'relative' },
  content: {
    fontFamily: 'var(--font-outfit), sans-serif', fontSize: '13px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.75,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    maxHeight: '200px', overflowY: 'auto',
    margin: 0, paddingRight: '4px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--border) transparent',
  },
  contentFade: { display: 'none' },
  notePreview: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px',
    padding: '8px 12px', borderRadius: '8px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
  },

  cardFooter: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' },
  langToggle: {
    display: 'flex', borderRadius: '8px', overflow: 'hidden',
    border: '1px solid var(--border)', flexShrink: 0,
  },
  langBtn: {
    fontSize: '11px', fontWeight: 700, padding: '0 10px', height: '32px',
    background: 'var(--surface)', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', fontFamily: 'var(--font-outfit), sans-serif',
    letterSpacing: '0.4px', transition: 'all 0.15s',
  },
  langBtnActive:   { background: 'var(--accent-bg-2)', color: 'var(--accent-text)' },

  copyBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
    background: 'transparent', border: '1px solid',
    fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.18s',
  },
  copyBtnDone: {
    background: 'var(--accent-text)', border: '1px solid var(--accent-text)', color: 'var(--bg)',
  },

  seeMoreBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginTop: '14px', padding: '10px 18px',
    background: 'transparent', border: '1px solid var(--border)',
    borderRadius: '10px', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, color: 'var(--text-2)',
    fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },

  empty:     { textAlign: 'center', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  emptyText: { fontSize: '14px', color: 'var(--text-3)', margin: 0 },

  toast: {
    position: 'fixed' as const, bottom: 'var(--s-6)', left: '50%', transform: 'translateX(-50%)',
    // Background opaque sombre indépendant du thème + halo success vert
    background: 'rgba(0,30,20,0.96)',
    border: '1px solid rgba(99,214,131,0.6)',
    borderRadius: 'var(--r-md)',
    padding: '12px 20px',
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
    // Couleur blanche fixe : le fond est toujours sombre dans les deux modes
    fontSize: 'var(--t-sm)', fontWeight: 600, color: '#fff',
    zIndex: 1000,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    // Shadow + glow vert pour effet 2026
    boxShadow: '0 12px 32px rgba(0,0,0,0.45), 0 0 0 4px rgba(52,211,153,0.10)',
    animation: 'fadeUp var(--d-slow) var(--ease-out)',
    whiteSpace: 'nowrap' as const,
  },

  overlay: {
    position: 'fixed' as const, inset: 0, zIndex: 900,
    background: 'rgba(0, 30, 22, 0.55)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', width: '100%', maxWidth: '640px',
    maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0, 30, 22, 0.28)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '22px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
  },
  modalTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '21px', fontWeight: 400, color: 'var(--text)', margin: '2px 0 0', lineHeight: 1.2 },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0,
  },
  modalBody:   { padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' },
  modalFooter: {
    padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: '8px',
  },

  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '11px 14px',
    fontFamily: 'var(--font-outfit), sans-serif', fontSize: '14px', color: 'var(--text)', outline: 'none', width: '100%',
    transition: 'border-color .15s, box-shadow .15s',
  },
  textarea: {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '14px 16px',
    fontFamily: 'var(--font-outfit), sans-serif', fontSize: '14px', color: 'var(--text)',
    outline: 'none', width: '100%', resize: 'vertical', minHeight: '260px', lineHeight: 1.7,
    transition: 'border-color .15s, box-shadow .15s',
  },

  timingBtns: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  timingBtn: {
    fontSize: '12px', fontWeight: 500, padding: '6px 13px', borderRadius: '100px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },
  timingBtnActive: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },

  varChip: {
    fontSize: '11.5px', fontWeight: 600, padding: '3px 9px', borderRadius: '6px',
    background: tint(AMBER, 10), border: `1px solid ${tint(AMBER, 28)}`, color: AMBER,
  },

  saveBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13.5px', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
    background: 'var(--accent-text)', border: '1px solid var(--accent-text)',
    color: 'var(--bg)', fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },
  cancelBtn: {
    fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', fontFamily: 'var(--font-outfit), sans-serif',
  },
  ghostBtn: {
    fontSize: '12px', fontWeight: 500, padding: '7px 13px', borderRadius: '8px', cursor: 'pointer',
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', fontFamily: 'var(--font-outfit), sans-serif',
  },
  deleteBtnSmall: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12.5px', fontWeight: 600, padding: '8px 13px', borderRadius: '8px', cursor: 'pointer',
    background: 'transparent', border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)',
    color: 'var(--danger)', fontFamily: 'var(--font-outfit), sans-serif',
  },

  // ── Hero card (message principal) ───────────────────────────────────────
  heroCard: {
    padding: '24px 26px 22px',
    border: '1px solid', borderRadius: '18px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 500,
    color: 'var(--text)', lineHeight: 1.25, marginBottom: '12px',
  },
  heroContent: {
    fontFamily: 'var(--font-outfit), sans-serif', fontSize: '14px', fontWeight: 300,
    color: 'var(--text)', lineHeight: 1.75,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    margin: '0 0 16px', padding: '14px 16px',
    background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px',
    maxHeight: '300px', overflowY: 'auto',
  },
  heroFooter: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const,
  },
  heroIconBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', borderRadius: '7px', cursor: 'pointer',
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)',
    fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s', flexShrink: 0,
  },
  heroPinBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11.5px', fontWeight: 600, padding: '5px 11px', borderRadius: '8px', cursor: 'pointer',
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)',
    fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },
  heroPinBtnActive: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11.5px', fontWeight: 600, padding: '5px 11px', borderRadius: '8px', cursor: 'pointer',
    background: 'var(--accent-bg-2)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
    fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },
  menuItem: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '9px 12px', borderRadius: '7px', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text)', background: 'transparent', border: 'none',
    fontFamily: 'var(--font-outfit), sans-serif', textAlign: 'left' as const,
    transition: 'background .15s',
  },
  heroEditBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500, padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)',
    fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },
  heroCopyBtn: {
    flex: 1, minWidth: '180px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontSize: '14px', fontWeight: 700, padding: '12px 20px', borderRadius: '11px', cursor: 'pointer',
    border: '1px solid', fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.18s',
  },
}
