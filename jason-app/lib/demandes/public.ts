// Ce que l'hôte voit de sa demande (refonte de /trouver-un-pro, 18/10/2026) :
// les pros qui la recevront avant l'envoi (aperçu) et son suivi après.
// Règles pures, testées (public.test.ts). Rien que les fiches publiques ne
// montrent déjà : nom affiché, photo, métier, ville, lien de la fiche. Jamais
// l'e-mail ni le contenu du carnet d'un pro, seulement s'il a pris la demande
// en main (statut changé dans « Demandes reçues »).

import { thumbPath, isLegacyPhoto, PORTFOLIO_BUCKET } from '@/lib/pros/fiche-vitrine'
import { convientAuBesoin, besoinPhoto, RELANCE_APRES_H, VAGUES_MAX, type Adequation, type DemandeMetier, type ProCandidat } from './rules'

const SITE = 'https://jasonmarinho.com'
const DIR: Record<DemandeMetier, string> = { photographe: 'photographes', menage: 'menage' }

export interface ProPublic extends ProCandidat {
  slug: string
  full_name: string | null
  pseudo: string | null
  portfolio_photos?: unknown
  logo_url?: string | null
}

export interface CartePro {
  nom: string
  initiales: string
  photo: string | null
  metier: string
  ville: string
  href: string
  /** 2 = fait ce qui est demandé, 1 = en partie (photographes seulement) */
  adequation: Adequation
}

export const initiales = (nom: string) =>
  nom.split(/\s+/).filter(w => /^\p{L}/u.test(w)).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

/** Vignette publique de la première photo de la fiche (anciennes photos ignorées, comme sur le site), sinon le logo */
export function photoDuPro(p: Pick<ProPublic, 'portfolio_photos' | 'logo_url'>, supabaseUrl: string): string | null {
  const paths = Array.isArray(p.portfolio_photos) ? p.portfolio_photos.filter((x): x is string => typeof x === 'string' && !isLegacyPhoto(x)) : []
  if (paths.length && supabaseUrl) return `${supabaseUrl}/storage/v1/object/public/${PORTFOLIO_BUCKET}/${thumbPath(paths[0])}`
  const logo = typeof p.logo_url === 'string' && /^https:\/\//.test(p.logo_url) ? p.logo_url : null
  return logo
}

export function metierLabel(metier: DemandeMetier, pro: Pick<ProPublic, 'metier'>): string {
  if (metier === 'menage') return 'Équipe de ménage'
  return pro.metier === 'video' ? 'Vidéaste' : pro.metier === 'photo_video' ? 'Photographe et vidéaste' : 'Photographe'
}

export function cartePro(p: ProPublic, metier: DemandeMetier, besoin: string | null | undefined, supabaseUrl: string): CartePro {
  const nom = (p.pseudo || p.full_name || 'Pro de l’annuaire').trim()
  return {
    nom,
    initiales: initiales(nom),
    photo: photoDuPro(p, supabaseUrl),
    metier: metierLabel(metier, p),
    ville: p.ville ?? '',
    href: `${SITE}/annuaires/${DIR[metier]}/${p.slug}`,
    adequation: metier === 'photographe' ? convientAuBesoin(p, besoin) : 2,
  }
}

/** Phrase d'aperçu sous les cartes, avant l'envoi */
export function apercuPhrase(metier: DemandeMetier, n: number, ville: string, besoin: string | null | undefined): string {
  const qui = metier === 'menage'
    ? (n > 1 ? 'équipes de ménage' : 'équipe de ménage')
    : besoinPhoto(besoin)?.video && !besoinPhoto(besoin)?.photo ? (n > 1 ? 'vidéastes' : 'vidéaste') : (n > 1 ? 'photographes' : 'photographe')
  if (!n) return `Pas encore de ${qui} inscrit${metier === 'menage' ? 'e' : ''} près de ${ville}. Tu peux envoyer quand même : ta demande est gardée 30 jours et part au premier pro qui s’inscrit dans ta zone. Jason la regarde aussi lui-même.`
  return n > 1
    ? `${n} ${qui} de l’annuaire recevront ta demande.`
    : `1 ${qui} de l’annuaire recevra ta demande. Sans réponse sous 48 h, d’autres prennent le relais dès qu’il y en a.`
}

// ── Suivi ───────────────────────────────────────────────────────────

export interface SuiviRow {
  metier: DemandeMetier
  ville: string
  logement: string | null
  quand: string | null
  frequence: string | null
  budget: string | null
  nom: string
  status: 'envoyee' | 'elargie' | 'sans_pro' | 'close'
  created_at: string
  last_round_at: string | null
  host_closed_at?: string | null
  sent_to: Array<{ id: string; contact_id?: string | null; round: number; at?: string }>
}

export interface SuiviPro extends Omit<CartePro, 'adequation'> {
  vague: number
  recue: string | null
  /** Le pro a changé le statut de la demande dans « Demandes reçues » */
  priseEnMain: boolean
}

export interface SuiviVue {
  prenom: string
  metier: DemandeMetier
  ville: string
  creee: string
  besoin: Array<[string, string]>
  etat: 'envoyee' | 'prise_en_main' | 'sans_pro' | 'fermee' | 'terminee'
  titre: string
  texte: string
  /** Date du prochain relais possible (ISO), si personne n'a pris la demande en main */
  relais: string | null
  pros: SuiviPro[]
}

/** Vue de suivi, à partir de la demande, des statuts des lignes « Demandes reçues » et des fiches encore en ligne */
export function suiviVue(r: SuiviRow, statuts: Map<string, string>, fiches: Map<string, Omit<CartePro, 'adequation'>>, now: Date): SuiviVue {
  const pros: SuiviPro[] = r.sent_to.map(s => {
    const f = fiches.get(s.id) ?? { nom: 'Pro de l’annuaire', initiales: '?', photo: null, metier: r.metier === 'menage' ? 'Équipe de ménage' : 'Photographe', ville: '', href: `${SITE}/annuaires/${DIR[r.metier]}` }
    const st = s.contact_id ? statuts.get(s.contact_id) ?? 'nouvelle' : 'nouvelle'
    return { ...f, vague: s.round, recue: s.at ?? null, priseEnMain: st !== 'nouvelle' }
  })
  const vagues = Math.max(0, ...r.sent_to.map(s => s.round))
  const derniers = pros.filter(p => p.vague === vagues)
  const priseEnMain = pros.some(p => p.priseEnMain)
  const ageJours = (now.getTime() - new Date(r.created_at).getTime()) / 86_400_000
  let relais: string | null = null
  if ((r.status === 'envoyee' || r.status === 'elargie') && vagues < VAGUES_MAX && !derniers.some(p => p.priseEnMain) && r.last_round_at) {
    relais = new Date(new Date(r.last_round_at).getTime() + RELANCE_APRES_H * 3_600_000).toISOString()
  }
  const qui = r.metier === 'menage' ? 'équipe' : 'pro'
  let etat: SuiviVue['etat'], titre: string, texte: string
  if (r.status === 'close') {
    etat = 'fermee'; titre = 'Demande fermée'
    texte = r.host_closed_at ? 'Tu as indiqué avoir trouvé ton pro : plus aucun autre pro ne la recevra.' : 'Cette demande est close : plus aucun autre pro ne la recevra.'
  } else if (r.status === 'sans_pro' && !pros.length) {
    etat = ageJours > 30 ? 'terminee' : 'sans_pro'
    titre = ageJours > 30 ? 'Pas de pro dans ta zone pour l’instant' : `En attente d’un ${qui} dans ta zone`
    texte = ageJours > 30
      ? `Aucun ${qui} ne s’est inscrit près de ${r.ville} dans les 30 jours. Tu peux refaire une demande plus tard, ou écrire à Jason.`
      : `Aucun ${qui} de l’annuaire ne travaille encore près de ${r.ville}. Ta demande part toute seule au premier qui s’inscrit dans les 30 jours, et Jason la regarde aussi.`
  } else if (priseEnMain) {
    etat = 'prise_en_main'; titre = 'Un pro s’en occupe'
    texte = 'Au moins un pro a pris ta demande en main. Surveille ta boîte e-mail (et les indésirables) : il te répond directement.'
  } else {
    etat = 'envoyee'; titre = pros.length > 1 ? `Envoyée à ${pros.length} pros` : 'Envoyée'
    texte = relais
      ? 'Les pros ont reçu ta demande par e-mail. Si aucun ne la prend en main d’ici la date ci-dessous, d’autres pros de ta zone la reçoivent, sans rien à refaire.'
      : 'Les pros ont reçu ta demande par e-mail. Ils te répondent directement.'
  }
  const besoin: Array<[string, string]> = ([
    ['Ville', r.ville], ['Logement', r.logement], [r.metier === 'menage' ? 'Besoin' : 'Prestation', r.frequence], ['Quand', r.quand], ['Budget', r.budget],
  ] as Array<[string, string | null]>).filter((x): x is [string, string] => !!x[1])
  return { prenom: r.nom.split(' ')[0], metier: r.metier, ville: r.ville, creee: r.created_at, besoin, etat, titre, texte, relais, pros }
}

/** Jeton du lien de suivi : 32 caractères hexadécimaux */
export const isSuiviToken = (t: unknown): t is string => typeof t === 'string' && /^[a-f0-9]{32}$/.test(t)
