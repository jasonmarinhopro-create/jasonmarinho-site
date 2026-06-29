// ────────────────────────────────────────────────────────────────────
// Seed 2 fiches demo (1 photographe + 1 ménage) rattachées au compte
// admin djason.marinho@gmail.com — bypass complet du flow Stripe pour
// initialiser l'annuaire avec du contenu publié.
//
// Usage :
//   cd jason-app
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/seed-pro-demo-fiches.mjs
//
// Idempotent : si une fiche existe déjà pour ce user_id, on skip
// (pas de doublon). Le slug est généré comme le webhook Stripe le ferait.
// ────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'djason.marinho@gmail.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK_URL

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variables manquantes : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const H = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function getAdminUserId() {
  // Liste les users (pagination 1 page suffit, admin connu)
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })
  if (!res.ok) throw new Error(`auth users list failed: ${res.status} ${await res.text()}`)
  const json = await res.json()
  const users = json.users || []
  const u = users.find(x => (x.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase())
  if (!u) throw new Error(`compte ${ADMIN_EMAIL} introuvable dans auth.users`)
  return u.id
}

async function uniqueSlug(table, base) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?slug=eq.${encodeURIComponent(base)}&select=id`, { headers: H })
  const rows = res.ok ? await res.json() : []
  if (!Array.isArray(rows) || rows.length === 0) return base
  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}

async function alreadyHasFiche(table, userId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}&select=id,slug,status&limit=1`, { headers: H })
  if (!res.ok) return null
  const rows = await res.json()
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}

async function insertRow(table, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...H, Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`insert ${table} failed: ${res.status} ${text}`)
  const arr = JSON.parse(text)
  return Array.isArray(arr) ? arr[0] : arr
}

async function seedPhotographer(userId) {
  const existing = await alreadyHasFiche('photographers', userId)
  if (existing) {
    console.log(`✓ photographer déjà présent (${existing.id}, status=${existing.status}), skip`)
    return existing
  }
  const fullName = 'Camille Sénéchal'
  const ville = 'Lyon'
  const slug = await uniqueSlug('photographers', slugify(`${fullName}-${ville}`))
  const row = await insertRow('photographers', {
    user_id: userId,
    email: ADMIN_EMAIL,
    full_name: fullName,
    ville,
    zone_couverte: 'Lyon + 60 km · Région Auvergne-Rhône-Alpes',
    bio: 'Photographe spécialisée en intérieurs LCD depuis 7 ans. Lumière naturelle, mise en scène discrète, angles pensés pour l\'algorithme Airbnb. J\'accompagne des hôtes du studio cosy au gîte de charme. Livraison sous 5 jours, format adapté à toutes les plateformes (Airbnb, Booking, site direct).',
    specialite: 'Intérieurs LCD + drone extérieur',
    tarif_min: 350,
    tarif_max: 800,
    portfolio_url: 'https://www.instagram.com/camille.lcd.photo',
    instagram_handle: 'camille.lcd.photo',
    telephone: null,
    slug,
    tier: 'fondateur',
    status: 'active',
    is_public: true,
    validated_at: new Date().toISOString(),
  })
  console.log(`✅ photographer créée : ${fullName} (${ville}) — slug=${slug}`)
  return row
}

async function seedCleaner(userId) {
  const existing = await alreadyHasFiche('cleaners', userId)
  if (existing) {
    console.log(`✓ cleaner déjà présent (${existing.id}, status=${existing.status}), skip`)
    return existing
  }
  const pseudo = 'Éclat Ménage Bordeaux'
  const ville = 'Bordeaux'
  const slug = await uniqueSlug('cleaners', slugify(`${pseudo}-${ville}`))
  const row = await insertRow('cleaners', {
    user_id: userId,
    email: ADMIN_EMAIL,
    full_name: 'Sophie Martin',
    pseudo,
    ville,
    zone_couverte: 'Bordeaux + 30 km · Bordeaux Métropole, Bassin d\'Arcachon',
    bio: 'Équipe de 4 personnes spécialisée turnover Airbnb depuis 5 ans. Délai express jour-même possible, gestion complète du linge, photo état des lieux à chaque passage. Couverte RC pro, SIRET vérifiable. On s\'occupe de tout : ménage, linge, réapprovisionnement, alerte si problème.',
    telephone: null,
    site_url: null,
    instagram_handle: 'eclat.menage.bordeaux',
    tarif_forfait_min: 65,
    tarif_forfait_max: 180,
    tarif_heure: 24,
    prestations: ['menage_standard', 'gestion_linge', 'repassage', 'reapprovisionnement', 'etat_des_lieux_photo'],
    equipe_type: 'equipe_3_5',
    logements_geres: 18,
    delai_reservation: 'jour_meme',
    langues: ['fr', 'en', 'es'],
    assurance_rc_pro: true,
    siret: null,
    slug,
    tier: 'fondateur',
    status: 'active',
    is_public: true,
    validated_at: new Date().toISOString(),
  })
  console.log(`✅ cleaner créée : ${pseudo} (${ville}) — slug=${slug}`)
  return row
}

async function main() {
  console.log(`→ Lookup user_id pour ${ADMIN_EMAIL}…`)
  const userId = await getAdminUserId()
  console.log(`  user_id = ${userId}`)

  await seedPhotographer(userId)
  await seedCleaner(userId)

  if (DEPLOY_HOOK) {
    console.log('→ Trigger Vercel deploy hook…')
    const r = await fetch(DEPLOY_HOOK, { method: 'POST' })
    console.log(`  hook status = ${r.status}`)
  } else {
    console.log('ℹ️ VERCEL_DEPLOY_HOOK_URL non défini — déclenche un redeploy manuel pour générer les pages publiques.')
  }

  console.log('\n✨ Terminé. Les fiches seront visibles après le prochain build du site statique.')
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
