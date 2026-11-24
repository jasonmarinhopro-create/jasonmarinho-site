// Pages dont le layout calcule des chiffres (20/11/2026). Dans Next 14, un
// <Link> visible précharge sa page jusqu'au premier loading.tsx : pour « Mes
// finances », c'est le layout entier (loadFinances), recalculé par le serveur
// à chaque ouverture du dashboard sur ordinateur, juste parce que le lien du
// menu est à l'écran. Ces liens ne sont pas préchargés depuis l'extérieur de
// la section (à l'intérieur, le layout est déjà là).
const HEAVY_LAYOUTS = ['/dashboard/finances']

export function isHeavyLayoutHref(href: string): boolean {
  return HEAVY_LAYOUTS.some(p => href === p || href.startsWith(p + '/') || href.startsWith(p + '?') || href.startsWith(p + '#'))
}

// Accueil (24/11/2026, mesuré par l'audit --net et le chronomètre serveur) :
// la page est à la racine du dashboard, son squelette est au même niveau que
// le layout commun, donc le préchargement ne s'arrête pas au squelette et
// calcule l'Accueil entier (home_state, 1,5 à 6,5 s quand la base est
// chargée) à CHAQUE page ouverte, juste parce que le lien « Accueil » du menu
// est à l'écran. Pas de préchargement : au clic, le squelette s'affiche.
const ROOT_PAGES = ['/dashboard']

export function isRootPageHref(href: string): boolean {
  const path = href.split(/[?#]/)[0].replace(/\/$/, '')
  return ROOT_PAGES.includes(path)
}

/** Valeur de `prefetch` pour un <Link> au href calculé */
export function prefetchFor(href: string): false | undefined {
  return isHeavyLayoutHref(href) || isRootPageHref(href) ? false : undefined
}
