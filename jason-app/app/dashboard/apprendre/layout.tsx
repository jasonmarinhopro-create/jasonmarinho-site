import ApprendreTabBar from './ApprendreTabBar'

// Le titre du hub est affiché par l'en-tête du dashboard (Header.tsx) : ici
// seulement les onglets, chaque page garde sa propre introduction (avant :
// deux gros titres empilés, « Apprendre » puis « Tes formations »).
export default function ApprendreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ApprendreTabBar />
      {children}
    </div>
  )
}
