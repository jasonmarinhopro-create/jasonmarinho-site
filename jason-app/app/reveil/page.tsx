// Page de réveil (30/09/2026). Le site jasonmarinho.com l'appelle quand un
// visiteur s'apprête à ouvrir son espace (survol de « Mon espace », ou dès le
// chargement pour un membre déjà venu) : la fonction serveur qui rend les
// pages est ainsi démarrée avant le clic. Sur l'offre Vercel gratuite, une
// fonction inutilisée s'endort et son premier appel coûtait jusqu'à 1 s.
// Aucune donnée, aucune requête en base.
export const dynamic = 'force-dynamic'

export default function Reveil() {
  return null
}
