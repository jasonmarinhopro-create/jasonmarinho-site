// Liste(s) Brevo de la newsletter, partagées par l'inscription et l'envoi mensuel.
/** Liste Brevo de la newsletter : n° 3 (formulaire du site et case cochée à l'inscription de l'app ; la n° 2 n'existe pas, vérifié le 11/10/2026) */
export const NEWSLETTER_LISTS = (process.env.BREVO_NEWSLETTER_LISTS ?? '3').split(',').map(n => Number(n.trim())).filter(n => n > 0)
