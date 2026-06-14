// Endpoint diagnostic temporaire pour identifier pourquoi
// /securite/signalements affiche "0 signalements actifs".
// Accessible publiquement mais sans données sensibles (juste métadata
// présence env vars + count). À retirer une fois le problème résolu.

module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  const diag = {
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL
        ? { present: true, preview: SUPABASE_URL.slice(0, 40) + '...' }
        : { present: false, fix: 'Pose la var dans Vercel → projet SITE STATIQUE (jasonmarinho.com) → Settings → Environment Variables' },
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY
        ? { present: true, length: SERVICE_KEY.length }
        : { present: false, fix: 'Idem, même projet, même endroit' },
    },
    next_steps: [],
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    diag.next_steps.push(
      '1. Va dans Vercel → projet site statique (jasonmarinho.com)',
      '2. Settings → Environment Variables',
      '3. Ajoute NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (copie-les depuis le projet jason-app où elles existent déjà)',
      '4. Onglet Deployments → ⋯ → Redeploy (décoche Build Cache pour forcer)',
    )
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(diag)
  }

  // Test fetch sur la view
  try {
    const url = `${SUPABASE_URL}/rest/v1/public_signalements_view?select=slug,city,month,incident_type&order=created_at.desc&limit=5`
    const r = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: 'application/json',
      },
    })
    diag.supabase_fetch = {
      status: r.status,
      ok: r.ok,
    }
    if (!r.ok) {
      const text = await r.text()
      diag.supabase_fetch.body = text.slice(0, 500)
      diag.next_steps.push(
        'Erreur Supabase. Causes probables :',
        '- Migration 20260614_054_signalements_publics.sql pas exécutée → la view public_signalements_view n\'existe pas. Exécute-la dans Supabase Studio SQL Editor.',
        '- SUPABASE_SERVICE_ROLE_KEY invalide ou expirée → vérifie dans Supabase → Project Settings → API',
      )
    } else {
      const data = await r.json()
      diag.supabase_fetch.count = Array.isArray(data) ? data.length : 0
      diag.supabase_fetch.sample = Array.isArray(data) ? data.slice(0, 5) : null
      if (Array.isArray(data) && data.length === 0) {
        diag.next_steps.push(
          'La view est accessible mais retourne 0 ligne.',
          '→ Aucun signalement avec moderation_status=\'approved\' ET public_visible=true en DB.',
          'Va dans Supabase Studio → table reported_guests → filtre sur ton signalement et vérifie ces 2 colonnes.',
          'Si tu as cliqué "Approuver et publier" et que rien n\'a bougé, l\'action a échoué silencieusement. Recharge la page admin et regarde le badge orange sous le bouton.',
        )
      } else if (Array.isArray(data) && data.length > 0) {
        diag.next_steps.push(
          `✓ ${data.length} signalement(s) trouvé(s) dans la DB.`,
          'Le build script devrait les générer au prochain build du site statique.',
          'Si la page /securite/signalements affiche encore 0, c\'est que le build script n\'a pas tourné depuis l\'approbation.',
          'Va sur Vercel → projet site statique → Deployments → ⋯ → Redeploy (Use existing Build Cache = NON pour forcer la regen).',
        )
      }
    }
  } catch (err) {
    diag.supabase_fetch = { error: err instanceof Error ? err.message : String(err) }
    diag.next_steps.push('Erreur réseau vers Supabase. URL probablement invalide.')
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json(diag)
}
