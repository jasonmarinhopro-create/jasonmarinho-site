// Paiement PayPal sur la page du contrat (15/11/2026, retour d'une hôte :
// « si on choisit PayPal, rien ne s'affiche »). L'hôte enregistre son lien
// PayPal.me dans Mon compte ; le voyageur, une fois le contrat signé, a un
// bouton qui ouvre PayPal avec le montant déjà rempli. Aucune API PayPal :
// le paiement se fait directement entre le voyageur et l'hôte.

/**
 * Nom PayPal.me tiré de ce que l'hôte colle : « paypal.me/Nom »,
 * « https://www.paypal.com/paypalme/Nom/20 », « @Nom » ou « Nom ».
 * null si ce n'est pas un nom PayPal.me valable (lettres et chiffres, 20 au plus).
 */
export function parsePaypalMe(input: string | null | undefined): string | null {
  let s = String(input ?? '').trim()
  if (!s) return null
  s = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  const m = s.match(/^(?:paypal\.me|paypal\.com\/paypalme)\/@?([^/?#\s]+)/i)
  const name = m ? m[1] : s.replace(/^@/, '')
  return /^[A-Za-z0-9]{1,20}$/.test(name) ? name : null
}

/**
 * Lien PayPal.me avec le montant rempli (« https://paypal.me/Nom/123.45 »).
 * Sans code devise : PayPal prend la devise du compte de l'hôte (l'euro pour
 * un hôte en France ou au Portugal) ; un lien avec devise se comporte mal dans
 * l'application mobile PayPal d'après la communauté PayPal (vérifié le 15/11/2026).
 */
export function paypalMeUrl(name: string, amount?: number | null): string {
  const base = `https://paypal.me/${encodeURIComponent(name)}`
  if (amount == null || !(amount > 0)) return base
  const v = Math.round(amount * 100) / 100
  return `${base}/${Number.isInteger(v) ? String(v) : v.toFixed(2)}`
}

/** PayPal fait partie des moyens de paiement du contrat */
export function contractOffersPaypal(modalites: string | null | undefined): boolean {
  return /paypal/i.test(String(modalites ?? ''))
}
