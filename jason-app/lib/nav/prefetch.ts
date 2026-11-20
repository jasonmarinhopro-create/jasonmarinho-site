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

/** Valeur de `prefetch` pour un <Link> au href calculé */
export function prefetchFor(href: string): false | undefined {
  return isHeavyLayoutHref(href) ? false : undefined
}
