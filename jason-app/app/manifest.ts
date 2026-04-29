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
      {
        src: '/favicon-jason.webp',
        sizes: 'any',
        type: 'image/webp',
        purpose: 'maskable',
      },
    ],
  }
}
