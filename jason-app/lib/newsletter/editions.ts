// Éditions de « Le Check-in » par public (11/10/2026, Jason : « attention entre
// les profils photographe, équipe de ménage, investisseur et hôte »). Chaque
// inscrit reçoit une seule édition, avec ses outils, ses offres partenaires, sa
// question du mois, et les articles et nouveautés qui le concernent. Pur et
// testé (editions.test.ts).
//
// Qui reçoit quoi (assignEditions) :
// - hôtes : inscrits à la lettre (liste Brevo n° 3) qui ne sont dans aucune
//   autre édition (exclus de la campagne par listes d'exclusion) ;
// - investisseurs : inscrits dont le compte de l'app est un compte investisseur ;
// - photographes / équipes de ménage : inscrits qui ont une fiche, plus les pros
//   clients (fiche payée) même sans inscription : prospection B2B liée à leur
//   métier, permise sans accord préalable avec désinscription en un clic
//   (CNIL), et jamais pour une adresse désinscrite de la prospection.
// Un compte avec plusieurs espaces reçoit une seule édition : photographe,
// puis ménage, puis investisseur, puis hôte.
import { TOOLS, PARTNER_OFFERS, QUESTIONS, type IssueData } from './template'

export type Edition = 'hote' | 'investisseur' | 'photographe' | 'menage' | 'depannage'
export const EDITIONS: Edition[] = ['hote', 'investisseur', 'photographe', 'menage', 'depannage']

const APP = 'https://app.jasonmarinho.com'
const SITE = 'https://jasonmarinho.com'

export interface EditionConfig {
  label: string
  tagline: string
  reason: string
  appUrl: string
  appCta: string
  tools: IssueData['tool'][]
  partners: IssueData['partner'][]
  questions: string[]
  /** Catégories d'actualités mises en avant (la une vient d'abord d'elles) */
  leadCategories: string[]
  /** P.S. de recommandation, adapté au public */
  ps: IssueData['ps']
  /** Articles et nouveautés qui parlent à ce public (sinon les plus récents) */
  articleMatch: RegExp | null
  changeMatch: RegExp | null
}

const partner = (name: string) => PARTNER_OFFERS.find(p => p.name === name)!

const PHOTO_TOOLS: IssueData['tool'][] = [
  { name: 'Tes statistiques de fiche', desc: 'Visiteurs, clics, demandes et place dans Google, mois par mois, avec la page de ta ville.', url: `${APP}/dashboard/ma-fiche-photographe/statistiques`, cta: 'Voir mes statistiques' },
  { name: 'Un devis en 2 minutes', desc: 'Un devis propre au nom de ton activité, envoyé à l\'hôte et accepté en ligne.', url: `${APP}/dashboard/ma-fiche-photographe/devis`, cta: 'Faire un devis' },
  { name: 'Tes réseaux sur ta fiche', desc: 'Fiche Google, Instagram, LinkedIn : ajoutés en pastilles discrètes sur ta fiche publique.', url: `${APP}/dashboard/ma-fiche-photographe`, cta: 'Compléter ma fiche' },
  { name: 'Tes clients en un coup d\'œil', desc: 'Demandes reçues, devis envoyés, clients gagnés : ton carnet au même endroit.', url: `${APP}/dashboard/ma-fiche-photographe/clients`, cta: 'Ouvrir mon carnet' },
]

const MENAGE_TOOLS: IssueData['tool'][] = [
  { name: 'Mes ménages', desc: 'Les ménages de tes clients hôtes, calculés depuis leurs réservations, avec les photos de fin de ménage.', url: `${APP}/dashboard/ma-fiche-menage/planning`, cta: 'Voir mon planning' },
  { name: 'Tes statistiques de fiche', desc: 'Visiteurs, clics, demandes et place dans Google, mois par mois, avec la page de ta ville.', url: `${APP}/dashboard/ma-fiche-menage/statistiques`, cta: 'Voir mes statistiques' },
  { name: 'Un devis en 2 minutes', desc: 'Un devis propre au nom de ton activité, envoyé à l\'hôte et accepté en ligne.', url: `${APP}/dashboard/ma-fiche-menage/devis`, cta: 'Faire un devis' },
  { name: 'Tes clients en un coup d\'œil', desc: 'Demandes reçues, devis envoyés, clients gagnés : ton carnet au même endroit.', url: `${APP}/dashboard/ma-fiche-menage/clients`, cta: 'Ouvrir mon carnet' },
]

// Dépannage et maintenance (31/10/2026) : pas de planning, demandes par spécialité
const DEPANNAGE_TOOLS: IssueData['tool'][] = [
  { name: 'Tes demandes reçues', desc: 'Les demandes des hôtes de ta zone, avec la spécialité et l\'urgence, au même endroit.', url: `${APP}/dashboard/ma-fiche-depannage/demandes`, cta: 'Voir mes demandes' },
  { name: 'Tes statistiques de fiche', desc: 'Visiteurs, clics, demandes et place dans Google, mois par mois, avec la page de ta ville.', url: `${APP}/dashboard/ma-fiche-depannage/statistiques`, cta: 'Voir mes statistiques' },
  { name: 'Un devis en 2 minutes', desc: 'Un devis propre au nom de ton activité, envoyé à l\'hôte et accepté en ligne.', url: `${APP}/dashboard/ma-fiche-depannage/devis`, cta: 'Faire un devis' },
  { name: 'Tes clients en un coup d\'œil', desc: 'Demandes reçues, devis envoyés, clients gagnés : ton carnet au même endroit.', url: `${APP}/dashboard/ma-fiche-depannage/clients`, cta: 'Ouvrir mon carnet' },
]

const INVESTOR_TOOLS: IssueData['tool'][] = [
  { name: 'Estimateur de revenus', desc: 'Revenus, occupation et prix moyen estimés ville par ville, avant de faire une offre.', url: `${SITE}/calculateurs/revenus-lcd`, cta: 'Estimer un bien' },
  { name: 'Comparateur de villes', desc: 'Deux villes côte à côte : prix, occupation, revenus et règles locales.', url: `${SITE}/calculateurs/comparer-villes`, cta: 'Comparer des villes' },
  { name: 'Simulateur de rentabilité', desc: 'Revenus, charges, crédit et cash-flow mois par mois.', url: `${SITE}/services/simulateurs/rentabilite-location-courte-duree`, cta: 'Lancer la simulation' },
  { name: 'EI ou SASU ?', desc: 'Le statut le plus adapté selon tes revenus et ce que tu veux en faire.', url: `${SITE}/services/simulateurs/choisir-statut-ei-sasu`, cta: 'Comparer les statuts' },
  { name: 'Simulateur micro-BIC', desc: 'Micro-BIC ou réel : ce que tu paies vraiment avec les plafonds 2026.', url: `${SITE}/services/simulateurs/fiscalite-micro-bic`, cta: 'Simuler mon impôt' },
]

const PRO_PARTNERS: IssueData['partner'][] = [
  { name: 'Shine', offer: 'Compte pro dès 0 €', desc: 'Un compte pour ton activité, et Shine Facture pour tes devis et factures gratuits.', url: `${SITE}/partenaires/shine` },
  { name: 'LegalPlace', offer: 'Réduction avec JASON15', desc: 'Statut, immatriculation et domiciliation, sans te déplacer.', url: `${SITE}/partenaires/legalplace` },
  { name: 'Indy', offer: 'Premier mois offert', desc: 'Facturation, suivi et facture électronique, prête pour 2027.', url: `${SITE}/partenaires/indy` },
  { name: 'Brevo', offer: '300 e-mails par jour gratuits', desc: 'Une lettre à tes clients hôtes pour remplir ton planning en basse saison.', url: `${SITE}/partenaires/brevo` },
]

export const EDITION_CONFIG: Record<Edition, EditionConfig> = {
  hote: {
    label: 'Hôtes',
    tagline: 'La lettre des hôtes, par Jason Marinho',
    reason: 'parce que tu t\'es inscrit à la lettre des hôtes sur jasonmarinho.com ou dans l\'app',
    appUrl: `${APP}/dashboard`, appCta: 'Ouvrir l\'app',
    tools: TOOLS, partners: PARTNER_OFFERS, questions: QUESTIONS,
    ps: { text: 'Un hôte autour de toi gagnerait à lire ça ? Transfère-lui cette lettre : il peut s\'inscrire en bas de', label: 'la page du blog', url: `${SITE}/blog` },
    leadCategories: [], articleMatch: null, changeMatch: null,
  },
  investisseur: {
    label: 'Investisseurs',
    tagline: 'La lettre des investisseurs en location courte durée',
    reason: 'parce que tu t\'es inscrit à la lettre sur jasonmarinho.com ou dans l\'app',
    appUrl: `${APP}/dashboard/investir`, appCta: 'Ouvrir mon espace investisseur',
    tools: INVESTOR_TOOLS,
    ps: { text: 'Un investisseur autour de toi gagnerait à lire ça ? Transfère-lui cette lettre : il peut s\'inscrire en bas de', label: 'la page du blog', url: `${SITE}/blog` },
    partners: [partner('AirDNA'), partner('Indy'), partner('Shine'), partner('LegalPlace')],
    questions: [
      'Dans quelle ville cherches-tu à investir, et pourquoi ?',
      'Quel rendement net vises-tu pour un achat en courte durée ?',
      'La réglementation d\'une ville t\'a-t-elle déjà fait renoncer à un achat ?',
      'Nom propre, SCI ou société : qu\'as-tu choisi pour investir ?',
      'Qu\'est-ce qui te manque pour te lancer sur ton prochain bien ?',
      'Comment estimes-tu les revenus d\'un bien avant de l\'acheter ?',
    ],
    leadCategories: ['reglementation', 'fiscalite', 'marche', 'communes', 'juridique'],
    articleMatch: /investi|achat|achet|rentab|lmnp|fiscal|march|ville|r[ée]glement|prix/i,
    changeMatch: /investi|estimat|rentab|projet|simulat|fiscal|comparat/i,
  },
  photographe: {
    label: 'Photographes',
    tagline: 'La lettre des photographes de la location courte durée',
    reason: 'parce que tu as une fiche dans l\'annuaire des photographes de jasonmarinho.com ou que tu t\'es inscrit à la lettre',
    appUrl: `${APP}/dashboard/ma-fiche-photographe`, appCta: 'Ouvrir mon espace pro',
    tools: PHOTO_TOOLS, partners: PRO_PARTNERS,
    ps: { text: 'Tu connais un photographe qui cherche des clients hôtes ? Les places Fondateur de l\'annuaire sont limitées :', label: 'il peut créer sa fiche ici', url: `${SITE}/annuaires/photographes/inscription` },
    questions: [
      'Comment tes clients hôtes te trouvent-ils aujourd\'hui ?',
      'Quel tarif pratiques-tu pour un shooting d\'annonce ?',
      'Qu\'est-ce qui convainc un hôte de te choisir ?',
      'Que manque-t-il à ta fiche pour décrocher plus de demandes ?',
      'Combien de temps passes-tu à retoucher un logement ?',
      'Quelle ville aimerais-tu voir dans l\'annuaire ?',
    ],
    leadCategories: ['plateformes', 'marche', 'conciergerie', 'reglementation'],
    articleMatch: /photo|annonce|visuel|image|shooting|conciergerie|prestataire|annuaire|vitrine/i,
    changeMatch: /photographe|annuaire|devis|espace pro|fiche (pro|photographe)|\bpros?\b/i,
  },
  menage: {
    label: 'Équipes de ménage',
    tagline: 'La lettre des équipes de ménage de la location courte durée',
    reason: 'parce que tu as une fiche dans l\'annuaire des équipes de ménage de jasonmarinho.com ou que tu t\'es inscrit à la lettre',
    appUrl: `${APP}/dashboard/ma-fiche-menage`, appCta: 'Ouvrir mon espace pro',
    tools: MENAGE_TOOLS, partners: PRO_PARTNERS,
    ps: { text: 'Tu connais une équipe de ménage qui cherche des clients hôtes ? Les places Fondateur de l\'annuaire sont limitées :', label: 'elle peut créer sa fiche ici', url: `${SITE}/annuaires/menage/inscription` },
    questions: [
      'Comment trouves-tu tes nouveaux clients hôtes ?',
      'Combien de temps prévois-tu pour un ménage entre deux voyageurs ?',
      'Ta plus grosse difficulté avec les arrivées le jour même ?',
      'Factures-tu au forfait ou à l\'heure ?',
      'Qu\'est-ce qui fait qu\'un hôte te garde d\'une saison à l\'autre ?',
      'Quel outil t\'aiderait le plus au quotidien ?',
    ],
    leadCategories: ['plateformes', 'marche', 'conciergerie', 'reglementation'],
    articleMatch: /m[ée]nage|linge|turnover|conciergerie|prestataire|check-out|propret|annuaire/i,
    changeMatch: /m[ée]nage|annuaire|devis|espace pro|fiche (pro|m[ée]nage)|\bpros?\b/i,
  },
  depannage: {
    label: 'Dépannage et maintenance',
    tagline: 'La lettre des pros du dépannage de la location courte durée',
    reason: 'parce que tu as une fiche dans l\'annuaire du dépannage de jasonmarinho.com ou que tu t\'es inscrit à la lettre',
    appUrl: `${APP}/dashboard/ma-fiche-depannage`, appCta: 'Ouvrir mon espace pro',
    tools: DEPANNAGE_TOOLS, partners: PRO_PARTNERS,
    ps: { text: 'Tu connais un artisan qui cherche des clients hôtes ? Les places Fondateur de l\'annuaire sont limitées :', label: 'il peut créer sa fiche ici', url: `${SITE}/annuaires/depannage/inscription` },
    questions: [
      'Comment tes clients hôtes te trouvent-ils aujourd\'hui ?',
      'Quelle panne revient le plus souvent entre deux voyageurs ?',
      'Interviens-tu le jour même quand un hôte t\'appelle en urgence ?',
      'Factures-tu au forfait ou à l\'heure, déplacement compris ?',
      'Qu\'est-ce qui fait qu\'un hôte te rappelle la fois suivante ?',
      'Quelle ville aimerais-tu voir dans l\'annuaire ?',
    ],
    leadCategories: ['plateformes', 'marche', 'conciergerie', 'reglementation'],
    articleMatch: /d[ée]pann|maintenance|panne|plomb|[ée]lectri|serrur|chauffage|travaux|[ée]quipement|prestataire|annuaire/i,
    changeMatch: /d[ée]pann|maintenance|annuaire|devis|espace pro|fiche (pro|d[ée]pannage)|\bpros?\b/i,
  },
}

// ── Qui reçoit quelle édition ──

export interface AccountRow { email: string; isInvestor: boolean; isAdmin: boolean; photographer: boolean; cleaner: boolean; depannage?: boolean }
export interface ProClientRow { email: string; metier: 'photographe' | 'menage' | 'depannage' }

/** Édition d'un compte de l'app : photographe, puis ménage, puis dépannage, puis investisseur, puis hôte */
export function editionOfAccount(a: Omit<AccountRow, 'email' | 'isAdmin'>): Edition {
  if (a.photographer) return 'photographe'
  if (a.cleaner) return 'menage'
  if (a.depannage) return 'depannage'
  if (a.isInvestor) return 'investisseur'
  return 'hote'
}

const norm = (e: string) => e.trim().toLowerCase()
const PRIORITY: Record<Edition, number> = { photographe: 5, menage: 4, depannage: 3, investisseur: 2, hote: 1 }

/**
 * Destinataires de chaque édition. `subscribers` : inscrits à la lettre
 * (liste Brevo, désinscrits déjà retirés). `proClients` : pros à fiche payée.
 * `suppressed` : adresses désinscrites de la prospection.
 */
export function assignEditions(input: { subscribers: string[]; accounts: AccountRow[]; proClients: ProClientRow[]; suppressed: Set<string> }): Record<Edition, string[]> {
  const byEmail = new Map<string, Edition>()
  for (const a of input.accounts) {
    if (a.isAdmin || !a.email) continue
    const e = norm(a.email)
    const ed = editionOfAccount(a)
    const prev = byEmail.get(e)
    if (!prev || PRIORITY[ed] > PRIORITY[prev]) byEmail.set(e, ed)
  }
  const out: Record<Edition, Set<string>> = { hote: new Set(), investisseur: new Set(), photographe: new Set(), menage: new Set(), depannage: new Set() }
  const suppressed = new Set([...input.suppressed].map(norm))
  for (const s of input.subscribers) {
    const e = norm(s)
    if (!e || suppressed.has(e)) continue
    out[byEmail.get(e) ?? 'hote'].add(e)
  }
  for (const p of input.proClients) {
    const e = norm(p.email)
    if (!e || suppressed.has(e) || out.photographe.has(e)) continue
    // Un photographe qui a aussi une fiche ménage reçoit l'édition photographe
    // Priorité : photographe, puis ménage, puis dépannage
    const target: Edition = p.metier
    const current = (['photographe', 'menage', 'depannage', 'investisseur', 'hote'] as Edition[]).find(ed => out[ed].has(e))
    if (current && PRIORITY[current] > PRIORITY[target]) continue
    for (const ed of EDITIONS) out[ed].delete(e)
    out[target].add(e)
  }
  return { hote: [...out.hote], investisseur: [...out.investisseur], photographe: [...out.photographe], menage: [...out.menage], depannage: [...out.depannage] }
}
