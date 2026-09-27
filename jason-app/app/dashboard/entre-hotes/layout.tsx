import EntreHotesTabBar from './EntreHotesTabBar'

// Le titre du hub est affiché par l'en-tête du dashboard (Header.tsx) : ici
// seulement les onglets, chaque page garde sa propre introduction (avant :
// deux gros titres empilés, « Apprendre » puis « Tes formations »).
export default function EntreHotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <EntreHotesTabBar />
      {children}
    </div>
  )
}
