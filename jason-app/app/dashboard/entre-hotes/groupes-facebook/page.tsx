import { redirect } from 'next/navigation'

// Les groupes Facebook servent à trouver des voyageurs : déplacés dans le hub
// « Trouver des voyageurs » (sept. 2026). Ancienne URL conservée.
export default function GroupesFacebookRedirect() {
  redirect('/dashboard/visibilite/facebook')
}
