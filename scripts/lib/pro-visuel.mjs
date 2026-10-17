// Photographes ET vidéastes (17/10/2026, retours de pros relayés par Jason :
// « en plus de photographe, avoir vidéaste », filtre de l'annuaire Photographe /
// Vidéaste / Photographe et vidéaste, filtre des options comme les vues
// aériennes, et un lien vers les vidéos du pro sur sa fiche).
// Colonnes de `photographers` (migration 20261017_136) : `metier` (photo,
// video, photo_video), `options` (liste de clés ci-dessous), `video_url`.
// Même liste dans l'app : jason-app/lib/pros/visuel.ts (test de synchro).
// Icônes écrites en entier pour le découpage des polices (build-phosphor-subset) :
// ph-camera ph-video-camera ph-film-strip ph-drone ph-cube ph-moon-stars ph-armchair ph-play-circle

export const METIERS_VISUELS = [
  { key: 'photo', label: 'Photographe', court: 'Photo', icon: 'camera' },
  { key: 'video', label: 'Vidéaste', court: 'Vidéo', icon: 'video-camera' },
  { key: 'photo_video', label: 'Photographe et vidéaste', court: 'Photo + vidéo', icon: 'film-strip' },
]

export const OPTIONS_VISUELLES = [
  { key: 'drone', label: 'Vues aériennes (drone)', icon: 'drone' },
  { key: 'visite_3d', label: 'Visite virtuelle 3D', icon: 'cube' },
  { key: 'reels', label: 'Vidéos courtes pour les réseaux', icon: 'film-strip' },
  { key: 'crepuscule', label: 'Photos au crépuscule', icon: 'moon-stars' },
  { key: 'mise_en_scene', label: 'Mise en scène du logement', icon: 'armchair' },
]

export function readMetier(v) {
  return METIERS_VISUELS.some(m => m.key === v) ? v : 'photo'
}

export function metierLabel(v) {
  return METIERS_VISUELS.find(m => m.key === readMetier(v)).label
}

/** Le pro fait-il de la photo / de la vidéo ? */
export const faitPhoto = v => readMetier(v) !== 'video'
export const faitVideo = v => readMetier(v) !== 'photo'

export function readOptions(raw) {
  const list = Array.isArray(raw) ? raw : []
  return OPTIONS_VISUELLES.map(o => o.key).filter(k => list.includes(k))
}

/**
 * Lien vidéo → lecteur intégrable quand c'est une vidéo YouTube ou Vimeo,
 * sinon null (chaîne, Instagram, TikTok… : simple lien).
 * YouTube passe par youtube-nocookie.com, et la fiche n'affiche le lecteur
 * qu'au clic (rien n'est chargé chez YouTube avant).
 */
export function videoEmbed(url) {
  let u
  try { u = new URL(String(url || '')) } catch { return null }
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '')
  let id = null
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0]
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v')
    else {
      const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)
      if (m) id = m[1]
    }
  }
  if (id && /^[\w-]{6,20}$/.test(id)) {
    return { kind: 'youtube', id, src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/)
    if (m) return { kind: 'vimeo', id: m[1], src: `https://player.vimeo.com/video/${m[1]}?autoplay=1&dnt=1`, thumb: null }
  }
  return null
}

/** Nom du site d'un lien vidéo, pour le bouton « Voir mes vidéos sur … » */
export function videoHostLabel(url) {
  let host = ''
  try { host = new URL(String(url || '')).hostname.toLowerCase().replace(/^(www\.|m\.)/, '') } catch { return null }
  if (/(^|\.)youtube(-nocookie)?\.com$|^youtu\.be$/.test(host)) return 'YouTube'
  if (/(^|\.)vimeo\.com$/.test(host)) return 'Vimeo'
  if (/(^|\.)instagram\.com$/.test(host)) return 'Instagram'
  if (/(^|\.)tiktok\.com$/.test(host)) return 'TikTok'
  if (/(^|\.)facebook\.com$|^fb\.watch$/.test(host)) return 'Facebook'
  return null
}
