// Traduit un refus de Google (Places API (New), places.googleapis.com/v1) en
// consigne claire. Avant (sept. 2026), tout 403 affichait « La clé API n'est
// pas autorisée » sans dire pourquoi, alors que Google précise la raison
// (champ ErrorInfo.reason) : API non activée, clé limitée à des sites web ou
// à des IP (appel serveur Vercel, sans référent ni IP fixe), facturation…

const ADVICE: Array<[RegExp, string]> = [
  [/SERVICE_DISABLED|has not been used in project|is disabled/i,
    "L'API « Places API (New) » n'est pas activée dans ton projet Google Cloud. Google Cloud → API et services → Bibliothèque → « Places API (New) » → Activer. (L'ancienne « Places API » ne suffit pas.)"],
  [/API_KEY_HTTP_REFERRER_BLOCKED|referer|referrer/i,
    "Ta clé Google est limitée à des sites web (référents HTTP). L'audit interroge Google depuis le serveur, sans site d'origine : Google Cloud → Identifiants → ta clé → Restrictions d'application → « Aucune » (garde la restriction d'API sur Places API (New))."],
  [/API_KEY_IP_ADDRESS_BLOCKED|IP address/i,
    "Ta clé Google est limitée à des adresses IP, or les serveurs Vercel changent d'IP : Google Cloud → Identifiants → ta clé → Restrictions d'application → « Aucune »."],
  [/API_KEY_SERVICE_BLOCKED|are blocked/i,
    "Ta clé Google est limitée à d'autres API : Google Cloud → Identifiants → ta clé → Restrictions d'API → ajoute « Places API (New) »."],
  [/BILLING_DISABLED|billing/i,
    "La facturation n'est pas activée sur ton projet Google Cloud (obligatoire pour Places API, même dans le quota gratuit) : Google Cloud → Facturation → associer un compte."],
  [/API_KEY_INVALID|API key not valid/i,
    "La clé Google est invalide : vérifie la variable GOOGLE_PLACES_API_KEY sur Vercel (projet du dashboard), puis redéploie."],
]

/** Consigne à afficher, ou null si ce n'est pas un refus d'accès de Google. */
export function placesAccessAdvice(message: string): string | null {
  for (const [re, advice] of ADVICE) if (re.test(message)) return advice
  if (/\b403\b|PERMISSION_DENIED|REQUEST_DENIED/.test(message)) {
    return "Google refuse l'accès avec cette clé. Vérifie dans Google Cloud que « Places API (New) » est activée et que la clé n'a pas de restriction de site web ou d'adresse IP."
  }
  return null
}
