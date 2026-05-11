import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jason Marinho',
    short_name: 'Jason Marinho',
    description: "Formations, outils et communauté pour développer ton activité LCD.",
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#004C3F',
    theme_color: '#004C3F',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
