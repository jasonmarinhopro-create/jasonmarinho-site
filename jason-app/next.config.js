/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  compress: true,
  poweredByHeader: false,

  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },

  async redirects() {
    return [
      { source: '/cgv', destination: 'https://jasonmarinho.com/cgvu', permanent: true },
      { source: '/mentions-legales', destination: 'https://jasonmarinho.com/mentions-legales', permanent: true },
      { source: '/politique-de-confidentialite', destination: 'https://jasonmarinho.com/politique-de-confidentialite', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        // Dashboard et pages authentifiées : sécurité maximale
        source: '/dashboard/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        // Page de signature contrat (accessible sans auth) — no-store obligatoire
        source: '/sign/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        // API routes : no-sniff + cache control
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        // Global fallback
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'xwucstjxoehyjnlrzrky.supabase.co' },
    ],
  },
}

module.exports = withBundleAnalyzer(nextConfig)
