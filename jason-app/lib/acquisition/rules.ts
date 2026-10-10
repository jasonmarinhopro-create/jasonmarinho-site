// Provenance des inscriptions et liens suivis (10/10/2026, demande de Jason :
// « la traçabilité des liens que j'envoie sur les groupes Facebook et d'où
// viennent les gens qui créent un compte »). Pur et testé (rules.test.ts).
//
// Chaîne : un lien court jasonmarinho.com/l/<code> (créé dans l'admin) mène à
// la page voulue avec utm_source / utm_medium / utm_campaign=<code>. nav.js
// garde le point d'entrée de la visite (sessionStorage, le temps de l'onglet)
// et l'ajoute aux liens vers l'inscription de l'app ; les formulaires pros du
// site l'envoient directement. À l'inscription, il est écrit dans
// profiles.acquisition. Seul le point d'entrée est gardé, jamais le parcours.
import { sourceOf, type SourceKind } from '@/lib/visibility/rules'

export interface Acquisition {
  /** utm_source (ou « facebook » quand Facebook ajoute fbclid) */
  source?: string
  medium?: string
  /** utm_campaign : code du lien suivi quand la visite vient d'un lien court */
  campaign?: string
  /** Site d'origine (nom de domaine seulement) */
  ref?: string
  /** Première page vue de la visite */
  landing?: string
  /** Date du premier passage (ISO) */
  at?: string
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Nettoie une provenance reçue du navigateur ; null si elle est vide */
export function cleanAcquisition(input: unknown): Acquisition | null {
  if (!input || typeof input !== 'object') return null
  const o = input as Record<string, unknown>
  const out: Acquisition = {}
  const source = str(o.source, 80).toLowerCase()
  const medium = str(o.medium, 80).toLowerCase()
  const campaign = str(o.campaign, 100)
  // Domaine seulement : jamais l'adresse complète (elle peut contenir des données)
  let ref = str(o.ref, 200).toLowerCase()
  if (ref.includes('/')) {
    try { ref = new URL(ref.includes('://') ? ref : `https://${ref}`).hostname } catch { ref = '' }
  }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(ref) || /(^|\.)jasonmarinho\.com$/.test(ref)) ref = ''
  // Chemin seulement, sans paramètres
  let landing = str(o.landing, 300)
  if (landing && !landing.startsWith('/')) landing = ''
  landing = landing.split(/[?#]/)[0]
  const at = str(o.at, 40)
  if (source) out.source = source
  if (medium) out.medium = medium
  if (campaign) out.campaign = campaign
  if (ref) out.ref = ref
  if (landing) out.landing = landing
  if (at && !Number.isNaN(Date.parse(at))) out.at = new Date(at).toISOString()
  return Object.keys(out).some(k => k !== 'at') ? out : null
}

/** Provenance lue dans les paramètres d'une adresse (acq_* posés par nav.js, ou utm_*) */
export function acquisitionFromParams(p: { get(name: string): string | null }): Acquisition | null {
  const g = (k: string) => p.get(k) ?? ''
  const fromSite = cleanAcquisition({ source: g('acq_s'), medium: g('acq_m'), campaign: g('acq_c'), ref: g('acq_r'), landing: g('acq_l'), at: g('acq_t') })
  if (fromSite) return fromSite
  return cleanAcquisition({
    source: g('utm_source') || (g('fbclid') ? 'facebook' : ''),
    medium: g('utm_medium') || (g('fbclid') ? 'social' : ''),
    campaign: g('utm_campaign'),
  })
}

// ── Liens suivis ──

export type LinkChannel =
  | 'facebook_groupe' | 'facebook_page' | 'google_fiche' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube'
  | 'whatsapp' | 'email' | 'signature' | 'prospection' | 'qr' | 'autre'

export const LINK_CHANNELS: Array<{ key: LinkChannel; label: string; source: string; medium: string }> = [
  { key: 'facebook_groupe', label: 'Groupe Facebook', source: 'facebook', medium: 'groupe' },
  { key: 'facebook_page', label: 'Page ou profil Facebook', source: 'facebook', medium: 'page' },
  { key: 'google_fiche', label: 'Fiche Google', source: 'google', medium: 'fiche' },
  { key: 'instagram', label: 'Instagram', source: 'instagram', medium: 'social' },
  { key: 'linkedin', label: 'LinkedIn', source: 'linkedin', medium: 'social' },
  { key: 'tiktok', label: 'TikTok', source: 'tiktok', medium: 'social' },
  { key: 'youtube', label: 'YouTube', source: 'youtube', medium: 'social' },
  { key: 'whatsapp', label: 'WhatsApp', source: 'whatsapp', medium: 'message' },
  { key: 'email', label: 'E-mail ou newsletter', source: 'newsletter', medium: 'email' },
  { key: 'signature', label: 'Signature e-mail', source: 'signature', medium: 'email' },
  { key: 'prospection', label: 'E-mails de prospection', source: 'prospection', medium: 'email' },
  { key: 'qr', label: 'QR code ou affiche', source: 'qr', medium: 'print' },
  { key: 'autre', label: 'Autre', source: 'lien', medium: 'autre' },
]

export const channelOf = (key: string) => LINK_CHANNELS.find(c => c.key === key) ?? LINK_CHANNELS[LINK_CHANNELS.length - 1]

/** Pages proposées comme destination d'un lien suivi */
export const LINK_DESTINATIONS: Array<{ url: string; label: string }> = [
  { url: 'https://jasonmarinho.com/', label: "Page d'accueil" },
  { url: 'https://app.jasonmarinho.com/auth/register?role=host', label: 'Inscription hôte (app)' },
  { url: 'https://jasonmarinho.com/annuaires/photographes', label: 'Annuaire des photographes' },
  { url: 'https://jasonmarinho.com/annuaires/photographes/inscription', label: 'Inscription photographe' },
  { url: 'https://jasonmarinho.com/annuaires/menage', label: 'Annuaire des équipes de ménage' },
  { url: 'https://jasonmarinho.com/annuaires/menage/inscription', label: 'Inscription équipe de ménage' },
  { url: 'https://jasonmarinho.com/tarifs', label: 'Tarifs' },
  { url: 'https://jasonmarinho.com/services/contrats', label: 'Contrats en ligne' },
  { url: 'https://jasonmarinho.com/services/simulateurs', label: 'Simulateurs' },
]

const HOME = 'https://jasonmarinho.com/'
const SITE = 'https://jasonmarinho.com'

/**
 * Liens créés d'office (10/10/2026, demande de Jason : « je vais créer des liens
 * un peu partout, si tu peux les faire »). Ajoutés à la base à l'ouverture de
 * la page Provenance s'ils manquent ; la redirection /l/<code> les connaît
 * aussi sans la base (un e-mail de prospection ne doit jamais mener nulle part).
 */
export const BUILTIN_LINKS: Array<{ code: string; label: string; channel: LinkChannel; destination: string; where?: string }> = [
  { code: 'fiche-google', label: 'Fiche Google (site web de la fiche)', channel: 'google_fiche', destination: HOME, where: 'À coller dans le champ « Site web » de ta fiche Google (Google Business Profile).' },
  { code: 'facebook-page', label: 'Page Facebook', channel: 'facebook_page', destination: HOME, where: 'Dans la section « Site web » de ta page Facebook et dans tes publications.' },
  { code: 'instagram', label: 'Bio Instagram', channel: 'instagram', destination: HOME, where: 'Dans le lien de ta bio Instagram.' },
  { code: 'linkedin', label: 'Profil LinkedIn', channel: 'linkedin', destination: HOME, where: 'Dans la section « Coordonnées » ou « Site web » de ton profil LinkedIn.' },
  { code: 'tiktok', label: 'Bio TikTok', channel: 'tiktok', destination: HOME, where: 'Dans le lien de ta bio TikTok.' },
  { code: 'youtube', label: 'Chaîne YouTube', channel: 'youtube', destination: HOME, where: 'Dans les liens de ta chaîne et la description de tes vidéos.' },
  { code: 'signature', label: 'Signature de tes e-mails', channel: 'signature', destination: HOME, where: 'Dans la signature de tes e-mails (Gmail, Outlook).' },
  { code: 'qr-code', label: 'QR code (affiches, cartes de visite)', channel: 'qr', destination: HOME, where: 'Pour un QR code sur tes affiches, flyers et cartes de visite.' },
  { code: 'photo-exemple', label: 'Prospection photographes : exemple de fiche', channel: 'prospection', destination: `${SITE}/annuaires/photographes/exemple-fiche` },
  { code: 'photo-inscription', label: 'Prospection photographes : inscription', channel: 'prospection', destination: `${SITE}/annuaires/photographes/inscription` },
  { code: 'photo-annuaire', label: 'Prospection photographes : annuaire', channel: 'prospection', destination: `${SITE}/annuaires/photographes` },
  { code: 'menage-exemple', label: 'Prospection ménage : exemple de fiche', channel: 'prospection', destination: `${SITE}/annuaires/menage/exemple-fiche` },
  { code: 'menage-inscription', label: 'Prospection ménage : inscription', channel: 'prospection', destination: `${SITE}/annuaires/menage/inscription` },
  { code: 'menage-annuaire', label: 'Prospection ménage : annuaire', channel: 'prospection', destination: `${SITE}/annuaires/menage` },
  { code: 'hote-contrats', label: 'Prospection hôtes : contrats en ligne', channel: 'prospection', destination: `${SITE}/services/contrats` },
  { code: 'hote-inscription', label: 'Prospection hôtes : inscription', channel: 'prospection', destination: 'https://app.jasonmarinho.com/auth/register?role=host' },
]

/**
 * E-mails de prospection : chaque lien vers nos pages (avec utm_source=prospection)
 * devient le lien court suivi de sa page, plus court à lire et compté
 * (« jasonmarinho.com/l/photo-inscription »). Les autres liens ne changent pas.
 */
export function shortenProspectionLinks(text: string): string {
  return text.replace(/https:\/\/(?:app\.)?jasonmarinho\.com\/[^\s<>"')]*utm_source=prospection[^\s<>"')]*/g, found => {
    // Ponctuation de fin de phrase collée au lien : on la garde hors du lien
    const tail = found.match(/[.,;:!?]+$/)?.[0] ?? ''
    const raw = tail ? found.slice(0, -tail.length) : found
    let url: URL
    try { url = new URL(raw) } catch { return found }
    const bare = `${url.origin}${url.pathname.replace(/\/$/, '')}`
    const hit = BUILTIN_LINKS.find(l => l.channel === 'prospection' && l.destination.split('?')[0].replace(/\/$/, '') === bare)
    return hit ? `${shortLinkUrl(hit.code)}${tail}` : found
  })
}

/** Destination acceptée : une page de jasonmarinho.com ou de l'app (« /blog/… » compris) */
export function normalizeDestination(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  let url: URL
  try { url = new URL(raw.startsWith('/') ? `https://jasonmarinho.com${raw}` : raw.includes('://') ? raw : `https://${raw}`) } catch { return null }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (host !== 'jasonmarinho.com' && host !== 'app.jasonmarinho.com') return null
  url.protocol = 'https:'
  url.hostname = host
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) url.searchParams.delete(k)
  return url.toString()
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/** Code du lien court : début du nom + 4 caractères aléatoires (« groupe-hotes-airbnb-k3f9 ») */
export function makeLinkCode(label: string, random: string): string {
  const base = slugify(label).slice(0, 28).replace(/-+$/, '') || 'lien'
  const tail = slugify(random).replace(/-/g, '').slice(0, 4) || 'x'
  return `${base}-${tail}`
}

/** Adresse finale d'un lien suivi : la destination + les paramètres de suivi */
export function trackedTarget(destination: string, code: string, channel: string): string {
  const c = channelOf(channel)
  const url = new URL(normalizeDestination(destination) ?? 'https://jasonmarinho.com/')
  url.searchParams.set('utm_source', c.source)
  url.searchParams.set('utm_medium', c.medium)
  url.searchParams.set('utm_campaign', code)
  return url.toString()
}

export const shortLinkUrl = (code: string) => `https://jasonmarinho.com/l/${code}`

/** Robots qui ouvrent un lien pour en faire l'aperçu (Facebook, WhatsApp…) : clic non compté */
export function isPreviewBot(ua: string): boolean {
  return /facebookexternalhit|facebot|meta-externalagent|whatsapp|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|pinterest|skypeuripreview|googlebot|bingbot|bot\b|crawler|spider|preview|headless|curl|wget|python/i.test(ua)
}

// ── Lecture de la provenance ──

export type AcqKind = SourceKind | 'lien' | 'inconnu'

export const ACQ_LABEL: Record<AcqKind, string> = {
  lien: 'Lien suivi',
  facebook: 'Facebook',
  instagram: 'Instagram',
  'autre-reseau': 'Autre réseau social',
  google: 'Google',
  'autre-moteur': 'Autre moteur de recherche',
  ia: 'Une IA',
  'e-mail': 'E-mail',
  'autre-site': 'Autre site',
  direct: 'Direct (lien partagé, favori)',
  interne: 'Direct (lien partagé, favori)',
  inconnu: 'Pas encore mesuré',
}

export interface AcqView {
  kind: AcqKind
  label: string
  /** Précision : nom du lien suivi, site d'origine, campagne */
  detail: string | null
  landing: string | null
}

/** Ce qu'on affiche pour une provenance (links : code → nom du lien suivi) */
export function describeAcquisition(acq: Acquisition | null | undefined, links: Map<string, string> = new Map()): AcqView {
  if (!acq) return { kind: 'inconnu', label: ACQ_LABEL.inconnu, detail: null, landing: null }
  const landing = acq.landing ?? null
  const linkName = acq.campaign ? links.get(acq.campaign) : undefined
  if (linkName) return { kind: 'lien', label: ACQ_LABEL.lien, detail: linkName, landing }
  const src = sourceOf({ referrer: acq.ref ? `https://${acq.ref}/` : null, utm_source: acq.source ?? null, utm_medium: acq.medium ?? null })
  const kind: AcqKind = src.kind === 'interne' ? 'direct' : src.kind
  let detail: string | null = null
  if (src.kind === 'ia') detail = src.ai
  else if (acq.source === 'prospection') detail = 'E-mail de prospection'
  else if (acq.campaign) detail = acq.campaign
  else if (src.kind === 'autre-site' || src.kind === 'autre-moteur' || src.kind === 'autre-reseau') detail = src.site
  return { kind, label: ACQ_LABEL[kind], detail, landing }
}
