/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/cgv', destination: 'https://jasonmarinho.com/cgvu', permanent: true },
      { source: '/mentions-legales', destination: 'https://jasonmarinho.com/mentions-legales', permanent: true },
      { source: '/politique-de-confidentialite', destination: 'https://jasonmarinho.com/politique-de-confidentialite', permanent: true },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'xwucstjxoehyjnlrzrky.supabase.co' },
    ],
  },
}

module.exports = nextConfig
