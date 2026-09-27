import VisibiliteTabBar from './VisibiliteTabBar'

// Titre du hub affiché par l'en-tête du dashboard (Header.tsx) : ici seulement
// les onglets, chaque page garde sa propre introduction.
export default function VisibiliteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <VisibiliteTabBar />
      {children}
    </div>
  )
}
