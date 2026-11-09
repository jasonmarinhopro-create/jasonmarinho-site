// Villes hors de France qui ont des pages (17/10/2026). Depuis le 09/11/2026,
// lues dans le registre géographique unique (scripts/data/registre-geo.mjs) :
// pour en ajouter une, l'y déclarer avec son pays et ses pages.
// Québec : photographes et vidéastes seulement (demandes répétées depuis
// /chiffres ; Jason : « juste la page photographe / vidéaste Québec »).
import { VILLES, PAYS } from './registre-geo.mjs'

const PREFIX = { photographe: 'photographe-lcd', menage: 'menage-lcd', depannage: 'depannage-lcd', hote: 'devenir-hote-airbnb' }

export const VILLES_INTERNATIONAL = Object.fromEntries(
  VILLES.filter(v => !v.insee && v.pages.length)
    .map(v => [v.slug, { name: v.nom, pays: PAYS[v.pays], pages: v.pages.map(k => PREFIX[k]) }]),
)
