// Photographes ET vidéastes (17/10/2026, retours de pros relayés par Jason).
// Colonnes de `photographers` (migration 20261017_136) : `metier` (photo,
// video, photo_video), `options` (vues aériennes, visite 3D…), `video_url`.
// Même liste côté site : scripts/lib/pro-visuel.mjs (test de synchro).
// Pur et testé : visuel.test.ts.

export type MetierVisuel = 'photo' | 'video' | 'photo_video'
export type OptionVisuelle = 'drone' | 'visite_3d' | 'reels' | 'crepuscule' | 'mise_en_scene'

export const METIERS_VISUELS: { key: MetierVisuel; label: string; court: string; icon: string }[] = [
  { key: 'photo', label: 'Photographe', court: 'Photo', icon: 'camera' },
  { key: 'video', label: 'Vidéaste', court: 'Vidéo', icon: 'video-camera' },
  { key: 'photo_video', label: 'Photographe et vidéaste', court: 'Photo + vidéo', icon: 'film-strip' },
]

export const OPTIONS_VISUELLES: { key: OptionVisuelle; label: string; icon: string }[] = [
  { key: 'drone', label: 'Vues aériennes (drone)', icon: 'drone' },
  { key: 'visite_3d', label: 'Visite virtuelle 3D', icon: 'cube' },
  { key: 'reels', label: 'Vidéos courtes pour les réseaux', icon: 'film-strip' },
  { key: 'crepuscule', label: 'Photos au crépuscule', icon: 'moon-stars' },
  { key: 'mise_en_scene', label: 'Mise en scène du logement', icon: 'armchair' },
]

export function readMetier(v: unknown): MetierVisuel {
  return METIERS_VISUELS.some(m => m.key === v) ? (v as MetierVisuel) : 'photo'
}

export function metierLabel(v: unknown): string {
  return METIERS_VISUELS.find(m => m.key === readMetier(v))!.label
}

export const faitVideo = (v: unknown) => readMetier(v) !== 'photo'

export function readOptions(raw: unknown): OptionVisuelle[] {
  const list = Array.isArray(raw) ? raw : []
  return OPTIONS_VISUELLES.map(o => o.key).filter(k => list.includes(k))
}

/**
 * Lien vers les vidéos du pro (YouTube, Vimeo, Instagram, TikTok, son site…).
 * Vide = null. https ajouté s'il manque ; un lien illisible donne une erreur.
 */
export function normalizeVideoUrl(raw: unknown): { url: string | null; error?: string } {
  let v = String(raw ?? '').trim()
  if (!v) return { url: null }
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`
  let u: URL
  try { u = new URL(v) } catch { return { url: null, error: 'Lien vidéo : ce lien ne ressemble pas à une adresse de site' } }
  if (!/\.[a-z]{2,}$/i.test(u.hostname)) return { url: null, error: 'Lien vidéo : ce lien ne ressemble pas à une adresse de site' }
  u.protocol = 'https:'
  const out = u.toString()
  if (out.length > 300) return { url: null, error: 'Lien vidéo : lien trop long' }
  return { url: out }
}

/** Vidéo YouTube ou Vimeo lisible directement sur la fiche, sinon null */
export function videoEmbed(url: string | null | undefined): { kind: 'youtube' | 'vimeo' | 'file'; id: string } | null {
  let u: URL
  try { u = new URL(String(url || '')) } catch { return null }
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '')
  let id: string | null = null
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0]
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v')
    else id = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1] ?? null
  }
  if (id && /^[\w-]{6,20}$/.test(id)) return { kind: 'youtube', id }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/)
    if (m) return { kind: 'vimeo', id: m[1] }
  }
  // Fichier vidéo hébergé sur notre site (fiche d'exemple)
  if (host === 'jasonmarinho.com' && /\.mp4$/i.test(u.pathname)) return { kind: 'file', id: u.pathname }
  return null
}
