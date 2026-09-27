// Vercel serverless function : photos du portfolio hébergé d'un photographe.
// GET /api/photographer/portfolio?slug=xxx → { photos: [url, …] }
//
// Appelée par la fiche publique /annuaires/photographes/[slug] pour afficher
// la galerie en direct : les fiches sont des pages statiques générées au
// déploiement, les photos ajoutées depuis l'espace pro apparaissent donc sans
// attendre un nouveau build. Seules les fiches actives et publiques répondent.
// Photos dans le bucket public `pro-portfolio` (migration 20260927_110).

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const slug = String((req.query && req.query.slug) || '').trim().slice(0, 100)
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) return res.status(400).json({ photos: [] })

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(200).json({ photos: [] })

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/photographers?slug=eq.${encodeURIComponent(slug)}&status=eq.active&is_public=eq.true&select=portfolio_photos&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    )
    const rows = r.ok ? await r.json() : []
    const paths = Array.isArray(rows) && rows[0] && Array.isArray(rows[0].portfolio_photos) ? rows[0].portfolio_photos : []
    const photos = paths
      .filter(p => typeof p === 'string' && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/i.test(p))
      .slice(0, 12)
      .map(p => `${SUPABASE_URL}/storage/v1/object/public/pro-portfolio/${p}`)
    // Cache CDN 5 min : une photo ajoutée apparaît vite sans surcharger Supabase.
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.status(200).json({ photos })
  } catch (err) {
    console.warn('[photographer/portfolio]', err)
    return res.status(200).json({ photos: [] })
  }
}
