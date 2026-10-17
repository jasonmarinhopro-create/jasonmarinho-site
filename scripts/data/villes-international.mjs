// Villes hors de France (17/10/2026). Elles n'entrent pas dans CITIES
// (footer.js), qui suppose les règles françaises et 3 pages par ville : ici,
// seulement les pages listées, au contenu propre au pays.
// Québec : photographes et vidéastes seulement (demandes répétées depuis
// /chiffres ; Jason : « juste la page photographe / vidéaste Québec »).
export const VILLES_INTERNATIONAL = {
  quebec: { name: 'Québec', pays: 'Canada', pages: ['photographe-lcd'] },
}
