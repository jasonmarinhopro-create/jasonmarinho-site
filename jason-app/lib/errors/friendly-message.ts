// Traduit une erreur technique (Supabase, Stripe, fetch, etc.) en message
// affichable à l'utilisateur. Renvoie aussi un hint d'action quand pertinent.
// Centralise la logique pour qu'un même message brut soit toujours rendu
// de la même façon dans l'UI (boundary, toast, banner).

export interface FriendlyError {
  title: string
  body: string
  // Quand on peut suggérer une action concrète au-delà du simple "Réessayer".
  hint?: string
  // Sévérité : info | warning | error. Aide le composant à choisir la couleur.
  severity: 'warning' | 'error'
  // Si true, on cache le code technique du digest (erreurs fonctionnelles
  // type "déjà existant" plutôt que vrais bugs).
  hideDigest?: boolean
}

const NETWORK_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /network request failed/i,
  /load failed/i,
  /typeerror.*fetch/i,
]

const TIMEOUT_PATTERNS = [
  /timeout/i,
  /timed out/i,
  /aborted/i,
]

const AUTH_PATTERNS = [
  /jwt expired/i,
  /not authenticated/i,
  /invalid jwt/i,
  /no api key/i,
  /unauthorized/i,
]

// Codes Postgres remontés par Supabase (PostgREST)
const PG_CODE_MAP: Record<string, FriendlyError> = {
  '23505': { title: 'Cet élément existe déjà', body: 'Un enregistrement avec ces données existe déjà. Vérifie les doublons et réessaie.', severity: 'warning', hideDigest: true },
  '23503': { title: 'Référence introuvable', body: 'L\'élément lié à cette action n\'existe plus. Rafraîchis la page et réessaie.', severity: 'warning', hideDigest: true },
  '23502': { title: 'Champ obligatoire manquant', body: 'Un champ requis n\'a pas été renseigné. Vérifie le formulaire et réessaie.', severity: 'warning', hideDigest: true },
  '42501': { title: 'Accès refusé', body: 'Tu n\'as pas les droits nécessaires pour cette action. Si c\'est inattendu, contacte le support.', severity: 'error' },
  'PGRST116': { title: 'Élément introuvable', body: 'Cet élément n\'existe pas ou a été supprimé. Rafraîchis la page.', severity: 'warning', hideDigest: true },
  'PGRST301': { title: 'Session expirée', body: 'Ta session a expiré. Reconnecte-toi pour continuer.', severity: 'warning' },
}

// Codes Stripe les plus fréquents en LCD
const STRIPE_CODE_MAP: Record<string, FriendlyError> = {
  'card_declined': { title: 'Paiement refusé', body: 'La carte du voyageur a été refusée. Demande-lui de réessayer avec une autre carte ou de contacter sa banque.', severity: 'warning', hideDigest: true },
  'expired_card': { title: 'Carte expirée', body: 'La carte utilisée est expirée. Le voyageur doit en saisir une nouvelle.', severity: 'warning', hideDigest: true },
  'incorrect_cvc': { title: 'Code CVC incorrect', body: 'Le cryptogramme saisi ne correspond pas. Le voyageur doit le vérifier au dos de sa carte.', severity: 'warning', hideDigest: true },
  'insufficient_funds': { title: 'Fonds insuffisants', body: 'Le voyageur n\'a pas assez de fonds sur sa carte. Demande-lui une autre méthode de paiement.', severity: 'warning', hideDigest: true },
  'authentication_required': { title: 'Authentification requise', body: 'La banque du voyageur exige une authentification 3D Secure. Renvoie-lui le lien de paiement.', severity: 'warning', hideDigest: true },
  'rate_limit': { title: 'Trop de tentatives', body: 'Stripe limite temporairement les appels. Patiente quelques secondes et réessaie.', severity: 'warning' },
  'account_invalid': { title: 'Compte Stripe à finaliser', body: 'Ton compte Stripe Connect n\'est pas complètement configuré. Va sur la page Profil pour le compléter.', hint: 'Profil → Stripe Connect', severity: 'error' },
}

export function toFriendlyError(err: unknown): FriendlyError {
  // Cas 1 : objet d'erreur Supabase avec code
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: unknown }).code)
    if (PG_CODE_MAP[code]) return PG_CODE_MAP[code]
    if (STRIPE_CODE_MAP[code]) return STRIPE_CODE_MAP[code]
  }

  const raw = err instanceof Error ? err.message : String(err ?? '')
  const lower = raw.toLowerCase()

  // Stripe sans code, mais reconnaissable
  if (lower.includes('stripe')) {
    if (lower.includes('account') && (lower.includes('not') || lower.includes('invalid'))) {
      return STRIPE_CODE_MAP['account_invalid']
    }
    return { title: 'Erreur de paiement', body: 'Le service de paiement Stripe a renvoyé une erreur. Réessaie dans un instant, et si le problème persiste, contacte le support.', severity: 'error' }
  }

  // Auth
  if (AUTH_PATTERNS.some(p => p.test(lower))) {
    return { title: 'Session expirée', body: 'Ta session a expiré pour des raisons de sécurité. Reconnecte-toi pour continuer.', severity: 'warning' }
  }

  // Network
  if (NETWORK_PATTERNS.some(p => p.test(lower))) {
    return { title: 'Connexion interrompue', body: 'Impossible de joindre le serveur. Vérifie ta connexion internet et réessaie.', hint: 'Vérifie ta connexion Wi-Fi ou 4G', severity: 'warning' }
  }

  // Timeout
  if (TIMEOUT_PATTERNS.some(p => p.test(lower))) {
    return { title: 'Délai dépassé', body: 'La requête a mis trop de temps à répondre. Réessaie, le serveur est peut-être chargé.', severity: 'warning' }
  }

  // Rate limit (Upstash / app-level)
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return { title: 'Trop de requêtes', body: 'Tu as fait trop d\'actions en peu de temps. Patiente une minute avant de réessayer.', severity: 'warning' }
  }

  // Erreurs explicitement traduites (server actions qui throw avec un message FR clair)
  // On les laisse passer tel quel si elles ressemblent à du français
  if (raw.length < 200 && /[éèàçùêâî]/.test(raw)) {
    return { title: 'Action impossible', body: raw, severity: 'warning' }
  }

  // Fallback : message générique
  return {
    title: 'Une erreur s\'est produite',
    body: 'Quelque chose n\'a pas marché côté serveur. Réessaie, et si le problème persiste, contacte le support en mentionnant le code ci-dessous.',
    severity: 'error',
  }
}

// Adresse mail de support (utilisée par le bouton "Contacter le support")
export const SUPPORT_EMAIL = 'contact@jasonmarinho.com'

export function buildSupportMailto(error?: Error & { digest?: string }) {
  const subject = encodeURIComponent('Bug rencontré sur l\'app')
  const digest = error?.digest ? `\n\nCode erreur : ${error.digest}` : ''
  const msg = error?.message ? `\nMessage : ${error.message.slice(0, 300)}` : ''
  const body = encodeURIComponent(
    `Bonjour Jason,\n\nJe suis tombé sur un bug. Voici ce que je faisais :\n[Décris ici ce que tu essayais de faire]${msg}${digest}\n\nNavigateur : ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}\nURL : ${typeof window !== 'undefined' ? window.location.href : ''}`
  )
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
}
