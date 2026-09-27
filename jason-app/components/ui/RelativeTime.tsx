import { formatRelative } from '@/lib/chez-nous/display'

// « il y a 3 min » calculé au rendu serveur puis recalculé dans le navigateur
// quelques secondes ou minutes plus tard : le texte peut légitimement différer
// (et toLocaleDateString dépend du fuseau). Sans suppressHydrationWarning, React
// lève l'erreur #425 (texte serveur ≠ texte client), vue en prod sur le forum
// (sept. 2026). Le navigateur garde sa valeur, plus fraîche.
export default function RelativeTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {formatRelative(iso)}
    </time>
  )
}
