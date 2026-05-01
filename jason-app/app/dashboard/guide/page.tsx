import GuideUI from './GuideUI'
import GuideCards from './GuideCards'

export const metadata = { title: 'Guide LCD, Jason Marinho' }

export default function GuidePage() {
  // GuideCards est rendu server-side (icônes + données via /dist/ssr) puis injecté
  // comme React node dans GuideUI (client). Économise ~30 icônes Phosphor + 700 lignes
  // de JSX dans le bundle client.
  return <GuideUI guideCards={<GuideCards />} />
}
