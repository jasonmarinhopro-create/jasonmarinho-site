// Règles pures des notifications sur le téléphone (Web Push), testées.
// Le texte d'une notification poussée doit tenir sur un écran verrouillé :
// titre et corps raccourcis, lien interne uniquement.

export interface PushPayload {
  title: string
  body: string
  /** Chemin interne ouvert au clic (jamais une URL externe) */
  url: string
  /** Même tag = la nouvelle notification remplace l'ancienne sur l'appareil */
  tag: string
}

/** Types jamais poussés : rappels répétés sans urgence */
const NO_PUSH = new Set(['stripe_incomplet'])

export function shouldPush(type: string): boolean {
  return !NO_PUSH.has(type)
}

function cut(s: string, n: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`
}

export function pushPayload(input: { title: string; body?: string | null; href?: string | null; type: string; dedupKey: string }): PushPayload {
  const url = input.href && input.href.startsWith('/') && !input.href.startsWith('//') ? input.href : '/dashboard/notifications'
  return {
    title: cut(input.title, 80),
    body: cut(input.body ?? '', 180),
    url,
    tag: cut(input.dedupKey, 64),
  }
}

/** Nom lisible de l'appareil, pour la liste « Tes appareils » */
export function deviceLabel(ua: string | null | undefined): string {
  const u = ua ?? ''
  const os = /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android'
    : /Macintosh|Mac OS X/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : /Linux/.test(u) ? 'Linux' : 'Appareil'
  const browser = /Edg\//.test(u) ? 'Edge' : /Firefox\//.test(u) ? 'Firefox' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : null
  if (os === 'iPhone' || os === 'iPad') return os
  return browser ? `${browser} sur ${os}` : os
}

/** Statut HTTP du service de push qui signifie « abonnement mort » : à supprimer */
export function isGoneStatus(status: number | undefined): boolean {
  return status === 404 || status === 410
}
