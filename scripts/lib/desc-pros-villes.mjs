// Descriptions (balise meta) des pages pros de ville : photographe-lcd-,
// menage-lcd-, depannage-lcd- (audit SEO du 18/11/2026).
// Avant : le générateur coupait à 160 caractères (`desc.slice(0, 160)`), donc
// les 189 descriptions finissaient en plein mot (« …gestion du linge, qu »).
// Ici : une phrase complète de 155 caractères au plus, avec les repères propres
// à la ville déjà affichés sur la page (annonces, prix de la nuit, tarifs du
// métier selon le marché). Aucun chiffre qui ne soit pas sur la page.
// Utilisé par build-pages-pros-villes.mjs et inject-desc-villes.mjs
// (`--check` vérifie les 189 pages).

export const DESC_MAX = 155

// Marché « premium » (même règle que build-pages-pros-villes.mjs : isPremium)
const premium = v => v.adrMin >= 95

// Première variante qui tient dans DESC_MAX (la plus riche d'abord)
export function fit(variantes) {
  const v = variantes.find(t => t.length <= DESC_MAX)
  if (!v) throw new Error(`Aucune description sous ${DESC_MAX} caractères : ${variantes.at(-1)}`)
  return v
}

// v : { pre: 'à Lyon', annonces: '6 200', adrMin: 70, adrMax: 140 }
export function descPhoto(v) {
  const des = premium(v) ? '200' : '150'
  return fit([
    `Photographe et vidéaste Airbnb ${v.pre} : séance dès ${des} €, amortie en quelques nuits face à ~${v.annonces} annonces. Photos qui font cliquer et annuaire.`,
    `Photographe et vidéaste Airbnb ${v.pre} : séance dès ${des} €, ~${v.annonces} annonces en face. Les photos qui font cliquer et l'annuaire.`,
    `Photographe Airbnb ${v.pre} : séance dès ${des} €, ~${v.annonces} annonces en face. Les photos qui font cliquer et l'annuaire.`,
  ])
}

export function descMenage(v) {
  const m = premium(v) ? '50 à 70 €' : '40 à 60 €'
  return fit([
    `Ménage Airbnb ${v.pre} : turnover de ${m} pour un studio, linge, checklist et questions à poser avant de choisir ton équipe de ménage LCD.`,
    `Ménage Airbnb ${v.pre} : turnover de ${m} pour un studio, linge, checklist et questions à poser avant de choisir ton équipe.`,
    `Ménage Airbnb ${v.pre} : turnover de ${m} pour un studio, linge, checklist et questions à poser.`,
  ])
}

export function descDepannage(v) {
  return fit([
    `Dépannage Airbnb ${v.pre} : plombier, électricien, serrurier. Les pannes fréquentes, les questions à poser et les pros qui interviennent vite, sans commission.`,
    `Dépannage Airbnb ${v.pre} : plombier, électricien, serrurier. Pannes fréquentes, questions à poser et pros qui interviennent vite.`,
    `Dépannage Airbnb ${v.pre} : plombier, électricien, serrurier qui interviennent vite entre deux voyageurs.`,
  ])
}
