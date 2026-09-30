// Service worker de l'app (30/09/2026) : uniquement les notifications sur le
// téléphone (Web Push). Pas de cache ni d'interception des requêtes : le
// chargement des pages reste exactement le même qu'avant.
self.addEventListener('install', function () { self.skipWaiting() })
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()) })

self.addEventListener('push', function (event) {
  var data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) { data = { body: event.data ? event.data.text() : '' } }
  var title = data.title || 'Jason Marinho'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || undefined,
    lang: 'fr',
    data: { url: data.url || '/dashboard/notifications' },
  }))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  var path = (event.notification.data && event.notification.data.url) || '/dashboard/notifications'
  var url = new URL(path, self.location.origin).href
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i]
      if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
        return c.focus().then(function (w) { return w && 'navigate' in w ? w.navigate(url) : null })
      }
    }
    return self.clients.openWindow(url)
  }))
})
