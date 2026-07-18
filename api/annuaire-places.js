// Vercel serverless — places « fondateur » restantes sur les annuaires.
// Consommé par les pages annuaires/inscription pour afficher un compteur
// en direct (« Plus que X places à 39,98 € »). Quota partagé avec la
// logique de tier des signups (FOUNDER_QUOTA = 20 par annuaire).

const FOUNDER_QUOTA = 20
const STATUSES = 'in.(active,pending_payment,approved_pending_payment)'

async function countFounders({ supabaseUrl, serviceKey, table }) {
  const url = `${supabaseUrl}/rest/v1/${table}?tier=eq.fondateur&status=${STATUSES}&select=id`
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  })
  if (!res.ok) return null
  // content-range: "0-0/7" → total après le slash
  const range = res.headers.get('content-range') || ''
  const total = parseInt(range.split('/')[1] || '', 10)
  if (Number.isNaN(total)) {
    const rows = await res.json().catch(() => null)
    return Array.isArray(rows) ? rows.length : null
  }
  return total
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Service indisponible' })
  }

  const [photographers, cleaners] = await Promise.all([
    countFounders({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, table: 'photographers' }),
    countFounders({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, table: 'cleaners' }),
  ])

  // Cache CDN 5 min : le compteur n'a pas besoin d'être à la seconde,
  // et ça évite de marteler Supabase si le post fait du trafic.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  return res.status(200).json({
    quota: FOUNDER_QUOTA,
    photographers: photographers == null ? null : Math.max(0, FOUNDER_QUOTA - photographers),
    cleaners: cleaners == null ? null : Math.max(0, FOUNDER_QUOTA - cleaners),
  })
}
