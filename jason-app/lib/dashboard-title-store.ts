// Petit store en mémoire pour permettre aux pages dynamiques de surcharger
// le titre du Header (ex : "Marie Dupont" sur /dashboard/voyageurs/[id]).
// Les pages avec un titre statique sont gérées via le mapping pathname dans Header.

let currentTitle: string | null = null
const listeners = new Set<(t: string | null) => void>()

export function setDashboardTitle(t: string | null) {
  currentTitle = t
  listeners.forEach(l => l(t))
}

export function subscribeDashboardTitle(cb: (t: string | null) => void): () => void {
  listeners.add(cb)
  cb(currentTitle)
  return () => { listeners.delete(cb) }
}
