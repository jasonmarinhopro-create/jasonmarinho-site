// Adresse de site ou de portfolio d'un pro, tolérante (15/10/2026 : une
// inscription bloquée sur « l'adresse semble incorrecte » parce que le site
// était tapé sans https://). « monsite.fr » reçoit https://, « @compte »
// devient le lien Instagram. Même règle sur le site statique
// (api/photographer|cleaner/signup.js, scripts/build-inscription-pros.mjs).

export function normSiteUrl(v: unknown): string {
  let s = String(v ?? '').trim().replace(/\s+/g, '')
  if (!s) return ''
  if (/^@[\w.]{1,30}$/.test(s)) return 'https://www.instagram.com/' + s.slice(1)
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s.replace(/^\/+/, '')
  return s.slice(0, 300)
}

export function siteUrlOk(v: string): boolean {
  return /^https?:\/\/[^\s/.]+(\.[^\s/.]+)+/i.test(v)
}

export const SITE_URL_ERROR = 'ce lien ne ressemble pas à une adresse de site (exemple : monsite.fr ou instagram.com/moncompte)'
