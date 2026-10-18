// « Ta fiche est complète à X % » (18/10/2026, choix de Jason) : ce qui rend une
// fiche de pro belle et utile à l'hôte, avec l'action suivante la plus utile.
// Chaque point mène à la partie de Ma fiche qui le règle (ancre).
import { DEFAULT_DEROULE, isLegacyPhoto, type Etape, type ProMetier } from './fiche-vitrine'

export interface CompletudeInput {
  photos: string[]
  bio: string
  formules: Array<{ nom: string; prix: string | number | null }>
  prixMin: number | null
  deroule: Etape[]
  villes: string[]
  zone: string
  logo: boolean
  /** Photographes : options cochées ou métier qui inclut la vidéo */
  options?: number
  metierVideo?: boolean
  /** Ménage */
  prestations?: number
  capacite?: boolean
}

export interface CompletudePoint { key: string; label: string; done: boolean; weight: number; anchor: string; hint: string }

export const PHOTOS_CONSEILLEES = 3
export const BIO_MIN = 80

function derouleChanged(d: Etape[], metier: ProMetier): boolean {
  const def = DEFAULT_DEROULE[metier]
  return d.length === 3 && d.some((e, i) => e.titre.trim() !== def[i].titre || e.texte.trim() !== def[i].texte)
}

export function completude(f: CompletudeInput, metier: ProMetier): { pct: number; points: CompletudePoint[]; next: CompletudePoint | null } {
  const photos = f.photos.filter(p => !isLegacyPhoto(p)).length
  const prix = f.prixMin != null && f.prixMin > 0 || f.formules.some(x => Number(x.prix) > 0)
  const photo = metier === 'photographe'
  const points: CompletudePoint[] = [
    { key: 'photos', label: `Au moins ${PHOTOS_CONSEILLEES} photos`, done: photos >= PHOTOS_CONSEILLEES, weight: photo ? 30 : 25, anchor: 'mes-photos',
      hint: photos ? `Encore ${PHOTOS_CONSEILLEES - photos} photo${PHOTOS_CONSEILLEES - photos > 1 ? 's' : ''} : c’est ce que l’hôte regarde en premier.` : 'C’est ce que l’hôte regarde en premier. Sans photo, ta fiche reste un texte.' },
    { key: 'bio', label: 'Une présentation', done: f.bio.trim().length >= BIO_MIN, weight: 15, anchor: 'presentation',
      hint: 'Quelques phrases sur ta façon de travailler : la première est mise en avant sur ta fiche.' },
    { key: 'formules', label: 'Une formule', done: f.formules.some(x => x.nom.trim()), weight: 15, anchor: 'formules',
      hint: 'Une formule avec ce qui est inclus aide l’hôte à se projeter et à t’écrire.' },
    { key: 'prix', label: 'Un prix de départ', done: prix, weight: 10, anchor: 'tarifs',
      hint: 'Le « dès … € » s’affiche en tête de ta fiche. Sans prix, beaucoup d’hôtes passent leur chemin.' },
    photo
      ? { key: 'options', label: 'Ce que tu proposes', done: (f.options ?? 0) > 0 || !!f.metierVideo, weight: 10, anchor: 'activite',
          hint: 'Drone, visite 3D, vidéos courtes… : coche-les, l’hôte peut ensuite les demander dans le formulaire.' }
      : { key: 'prestations', label: 'Tes prestations', done: (f.prestations ?? 0) >= 3, weight: 10, anchor: 'prestations',
          hint: 'Linge, réassort, photo de fin de ménage… : coche tout ce que tu fais.' },
    ...(!photo ? [{ key: 'capacite', label: 'Ta capacité', done: !!f.capacite, weight: 5, anchor: 'capacite',
      hint: 'Taille de l’équipe et délai de réservation : l’hôte sait si tu peux suivre son rythme.' }] : []),
    { key: 'deroule', label: 'Ton déroulé en 3 étapes', done: derouleChanged(f.deroule, metier), weight: 10, anchor: 'deroule',
      hint: 'Le texte par défaut est le même sur toutes les fiches : écris le tien.' },
    { key: 'zone', label: 'Ta zone', done: f.villes.length > 0 || /\d\s?km/i.test(f.zone), weight: 5, anchor: 'villes',
      hint: 'Un rayon (« + 30 km ») ou des villes : ils s’affichent sur la carte de ta fiche.' },
    { key: 'logo', label: 'Ton logo ou ta photo', done: f.logo, weight: 5, anchor: 'logo',
      hint: 'Remplace les initiales par ton logo ou ton portrait.' },
  ]
  const total = points.reduce((n, p) => n + p.weight, 0)
  const pct = Math.round(points.filter(p => p.done).reduce((n, p) => n + p.weight, 0) * 100 / total)
  const next = points.filter(p => !p.done).sort((a, b) => b.weight - a.weight)[0] ?? null
  return { pct, points, next }
}
