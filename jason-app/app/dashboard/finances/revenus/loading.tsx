// Cf. commentaire dans page.tsx — sans ce fichier, Next.js n'affiche AUCUN
// état de chargement pendant la navigation vers /dashboard/finances/revenus
// (le loading.tsx de /dashboard/revenus ne s'applique pas ici, routes
// différentes) : la page paraît figée le temps du fetch + rendu complet.
import Loading from '@/app/dashboard/revenus/loading'

export default Loading
