// Service worker minimal — sa SEULE raison d'être est de rendre la PWA
// installable par Chrome/Edge sur Android et desktop (l'événement
// beforeinstallprompt exige la présence d'un SW actif).
// Pas de cache offline volontaire — le site reste 100% online,
// on évite de servir du contenu obsolète aux visiteurs.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Pass-through : on ne touche pas aux requêtes.
})
