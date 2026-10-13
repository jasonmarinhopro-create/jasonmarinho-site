import { loadIdees } from '@/lib/idees/load'
import type { IdeeEspace } from '@/lib/idees/rules'
import IdeesView from './IdeesView'

// Page Idées commune aux 4 espaces : chaque espace a sa route (sous le chemin
// de son menu, pour que la barre latérale de l'espace reste affichée).
export default async function IdeesPage({ espace }: { espace: IdeeEspace }) {
  const data = await loadIdees()
  return <IdeesView data={data} espace={espace} />
}
