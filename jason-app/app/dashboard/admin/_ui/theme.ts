// Couleurs de l'espace admin, alignées sur la marque (DA 28/09/2026) :
// vert, ambre, rose, brun. Pas de bleu, de violet ni de vert menthe.
export const AMBER = '#B7791F'
export const PINK = '#B83A7C'
export const BROWN = '#6E5446'

/** Fond ou bordure teintés à partir d'une couleur (y compris une variable CSS) */
export const tint = (c: string, pct = 12) => `color-mix(in srgb, ${c} ${pct}%, transparent)`
