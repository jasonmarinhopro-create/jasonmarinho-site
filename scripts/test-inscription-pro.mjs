// Test de bout en bout de l'inscription des pros (27/10/2026) : formulaire
// (API du site) → fiche en base → photos dans le stockage → Ma fiche dans
// l'app (connexion, affichage, brouillon enregistré seul). Comptes fictifs
// (@example.com), arrêt avant le paiement, tout est supprimé à la fin.
// Journaux publics : noms des champs et OK / KO seulement.
// Lancement : workflow « Test inscription pro » (SUPABASE_URL, SERVICE_KEY).
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'

const SITE = 'https://jasonmarinho.com'
const APP = 'https://app.jasonmarinho.com'
const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SERVICE_KEY
if (!SUPA || !KEY) { console.error('Variables manquantes'); process.exit(1) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }
mkdirSync('captures', { recursive: true })

let fails = 0
const ok = (label, cond) => { console.log(`${cond ? 'OK ' : 'KO '} ${label}`); if (!cond) fails++ }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

async function jpeg(page, w, h, hue) {
  return page.evaluate(([w, h, hue]) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const x = c.getContext('2d')
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, `hsl(${hue},40%,35%)`); g.addColorStop(1, `hsl(${hue + 40},50%,70%)`)
    x.fillStyle = g; x.fillRect(0, 0, w, h)
    x.fillStyle = '#fff'; x.font = `${Math.round(h / 8)}px sans-serif`; x.fillText('Photo de test', w / 10, h / 2)
    return c.toDataURL('image/jpeg', 0.8)
  }, [w, h, hue])
}

const CAS = [
  {
    nom: 'photographe', api: '/api/photographer/signup', table: 'photographers', fiche: '/dashboard/ma-fiche-photographe',
    extra: { metier: 'photo_video', options: ['drone', 'reels'], specialite: 'Intérieurs LCD', tarifMin: '150', tarifMax: '400', portfolioUrl: '', videoUrl: 'https://youtube.com/@test-inscription' },
    attendu: r => ({ metier: r.metier === 'photo_video', options: same(r.options, ['drone', 'reels']), specialite: r.specialite === 'Intérieurs LCD', video_url: /youtube\.com/.test(r.video_url || '') }),
  },
  {
    nom: 'menage', api: '/api/cleaner/signup', table: 'cleaners', fiche: '/dashboard/ma-fiche-menage',
    extra: { pseudo: 'Équipe Test Inscription', equipeType: 'duo', delaiReservation: '24h', prestations: ['menage_standard', 'gestion_linge'], langues: ['fr', 'en'], tarifForfaitMin: '45', tarifForfaitMax: '90', tarifHeure: '25', logementsGeres: '12', siteUrl: '', siret: '', assuranceRcPro: true },
    attendu: r => ({ pseudo: r.pseudo === 'Équipe Test Inscription', equipe_type: r.equipe_type === 'duo', delai_reservation: r.delai_reservation === '24h', prestations: same(r.prestations, ['menage_standard', 'gestion_linge']), langues: same(r.langues, ['fr', 'en']), tarif_forfait_min: Number(r.tarif_forfait_min) === 45, tarif_heure: Number(r.tarif_heure) === 25, assurance_rc_pro: r.assurance_rc_pro === true }),
  },
]

const browser = await chromium.launch()
for (const cas of CAS) {
  console.log(`\n=== ${cas.nom} ===`)
  const stamp = Date.now()
  const email = `test-inscription-${cas.nom}-${stamp}@example.com`
  const password = `Test-${stamp}-x9`
  const bio = `Bio de test pour vérifier que le texte de l'inscription arrive bien dans Ma fiche (${cas.nom}).`
  const formules = [{ nom: 'Formule Essentielle', prix: 120, detail: 'Détail de la formule de test' }, { nom: 'Formule Complète', prix: 250, detail: '' }]
  const body = {
    t: Date.now() - 120000, website: '', acq: null,
    fullName: `Test Inscription ${cas.nom}`, email, password, telephone: '06 00 00 00 00', telephonePublic: true,
    ville: 'Lyon', zoneCouverte: 'Lyon + 20 km', villesCouvertes: ['Villeurbanne', 'Bron'], instagramHandle: '@test_inscription', bio,
    formules, clienteles: ['lcd', 'hotel'], photoCount: 2, ...cas.extra,
  }
  let fiche = null, userId = null
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  try {
    // 1. Envoi du formulaire
    const r = await fetch(SITE + cas.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const b = await r.json().catch(() => ({}))
    ok(`inscription acceptée (HTTP ${r.status})`, r.ok)
    ok('lien de paiement Stripe préparé', /^https:\/\/checkout\.stripe\.com\//.test(b.checkoutUrl || ''))
    ok('autorisation d’envoi des photos remise', !!(b.ficheId && b.photoSig))

    // 2. Photos, comme le formulaire (une par une)
    await page.goto('about:blank')
    for (let i = 0; i < 2 && b.ficheId; i++) {
      const full = await jpeg(page, 1200, 800, 120 + i * 60), thumb = await jpeg(page, 480, 320, 120 + i * 60)
      const p = await fetch(SITE + cas.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'photo', ficheId: b.ficheId, sig: b.photoSig, full, thumb }) })
      ok(`photo ${i + 1} envoyée (HTTP ${p.status})`, p.ok)
    }

    // 3. La fiche en base
    const q = await fetch(`${SUPA}/rest/v1/${cas.table}?email=eq.${encodeURIComponent(email)}&select=*`, { headers: H })
    fiche = (await q.json())[0] || null
    ok('fiche créée', !!fiche)
    if (!fiche) continue
    userId = fiche.user_id
    const checks = {
      statut_en_attente_de_paiement: fiche.status === 'pending_payment',
      compte_lie: !!fiche.user_id, nom: fiche.full_name === body.fullName, ville: fiche.ville === 'Lyon',
      zone: fiche.zone_couverte === 'Lyon + 20 km', villes_couvertes: same(fiche.villes_couvertes, ['Villeurbanne', 'Bron']),
      formules: same((fiche.formules || []).map(f => [f.nom, f.prix]), [['Formule Essentielle', 120], ['Formule Complète', 250]]),
      clienteles: same(fiche.clienteles, ['lcd', 'hotel']), telephone: !!fiche.telephone, telephone_public: fiche.telephone_public === true,
      instagram: fiche.instagram_handle === 'test_inscription', bio: fiche.bio === bio,
      photos: Array.isArray(fiche.portfolio_photos) && fiche.portfolio_photos.length === 2,
      ...cas.attendu(fiche),
    }
    for (const [k, v] of Object.entries(checks)) ok(`base : ${k}`, v)
    for (const path of fiche.portfolio_photos || []) {
      for (const p of [path, path.replace(/\.jpg$/, '-t.jpg')]) {
        const s = await fetch(`${SUPA}/storage/v1/object/pro-portfolio/${p}`, { headers: H })
        ok(`stockage : ${p.endsWith('-t.jpg') ? 'vignette' : 'grande image'} présente`, s.ok)
      }
    }

    // 4. Ma fiche dans l'app
    await page.goto(`${APP}/auth/login`, { waitUntil: 'domcontentloaded' })
    await page.fill('#login-email', email)
    await page.fill('#login-password', password)
    await page.click('button[type="submit"]')
    await page.waitForURL(u => !/\/auth\/login/.test(String(u)), { timeout: 30000 }).catch(() => {})
    ok('connexion à l’app', !/\/auth\/login/.test(page.url()))
    await page.goto(APP + cas.fiche, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(2000)
    const txt = await page.evaluate(() => document.body.innerText)
    ok('Ma fiche s’ouvre', page.url().includes(cas.fiche) && !/erreur inattendue|application error/i.test(txt))
    ok('Ma fiche : nom affiché', txt.includes(cas.nom === 'menage' ? 'Équipe Test Inscription' : body.fullName))
    ok('Ma fiche : ville affichée', txt.includes('Lyon'))
    ok('Ma fiche : paiement à finaliser signalé', /paiement/i.test(txt))
    const imgs = await page.evaluate(() => [...document.images].filter(i => i.src.includes('pro-portfolio') && i.complete && i.naturalWidth > 0).length)
    ok(`Ma fiche : photos affichées (${imgs})`, imgs >= 2)
    await page.screenshot({ path: `captures/${cas.nom}-1-ma-fiche.png`, fullPage: false })

    // Chaque partie ouverte : on cherche les valeurs de l'inscription dans les champs
    const valeurs = async () => page.evaluate(() => [...document.querySelectorAll('input,textarea')].map(e => e.value).join('\n') + '\n' + document.body.innerText)
    const parties = await page.$$('button, [role="button"]')
    let vues = ''
    for (const el of parties) {
      const t = ((await el.innerText().catch(() => '')) || '').trim()
      if (!/^(Présentation|Formules|Zone|Contact|Ton offre|Ton activité|Photos)/i.test(t)) continue
      await el.click().catch(() => {}); await page.waitForTimeout(600)
      vues += await valeurs()
    }
    ok('Ma fiche : formules retrouvées', vues.includes('Formule Essentielle') && vues.includes('Formule Complète'))
    ok('Ma fiche : présentation retrouvée', vues.includes(bio))
    ok('Ma fiche : zone retrouvée (rayon 20 km)', /20 km/.test(vues))
    ok('Ma fiche : villes retrouvées', vues.includes('Villeurbanne') && vues.includes('Bron'))

    // 5. Brouillon enregistré seul : on modifie la présentation
    const ta = await page.$(`textarea >> nth=0`)
    let brouillon = false
    if (ta) {
      const sel = await page.evaluateHandle(b => [...document.querySelectorAll('textarea')].find(t => t.value === b) || null, bio)
      const el = sel.asElement()
      if (el) {
        await el.click(); await page.keyboard.press('End'); await page.keyboard.type(' Modifié.')
        await page.waitForTimeout(3500)
        const d = await (await fetch(`${SUPA}/rest/v1/${cas.table}?id=eq.${fiche.id}&select=fiche_draft,bio`, { headers: H })).json()
        brouillon = !!d[0]?.fiche_draft && JSON.stringify(d[0].fiche_draft).includes('Modifié.') && d[0].bio === bio
      }
    }
    ok('Ma fiche : modification gardée en brouillon, fiche en ligne inchangée', brouillon)
    await page.screenshot({ path: `captures/${cas.nom}-2-apres-modif.png`, fullPage: false })
  } catch (e) {
    ok(`déroulé sans erreur (${String(e && e.message || e).slice(0, 120)})`, false)
  } finally {
    await page.close()
    // 6. Nettoyage : photos, fiche, compte
    if (fiche) {
      const paths = (fiche.portfolio_photos || []).flatMap(p => [p, p.replace(/\.jpg$/, '-t.jpg')])
      const ls = await fetch(`${SUPA}/storage/v1/object/list/pro-portfolio`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: `${fiche.id}/`, limit: 100 }) })
      const extra = ls.ok ? (await ls.json()).map(o => `${fiche.id}/${o.name}`) : []
      const all = [...new Set([...paths, ...extra])]
      if (all.length) await fetch(`${SUPA}/storage/v1/object/pro-portfolio`, { method: 'DELETE', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: all }) })
      const d = await fetch(`${SUPA}/rest/v1/${cas.table}?id=eq.${fiche.id}`, { method: 'DELETE', headers: H })
      ok('nettoyage : fiche supprimée', d.ok)
    } else {
      const q = await fetch(`${SUPA}/rest/v1/${cas.table}?email=eq.${encodeURIComponent(email)}&select=id,user_id`, { headers: H }).then(r => r.json()).catch(() => [])
      for (const row of q) { userId = row.user_id; await fetch(`${SUPA}/rest/v1/${cas.table}?id=eq.${row.id}`, { method: 'DELETE', headers: H }) }
    }
    if (userId) {
      const u = await fetch(`${SUPA}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: H })
      ok('nettoyage : compte supprimé', u.ok)
      writeFileSync(`captures/${cas.nom}-compte.txt`, userId)
    }
  }
}
await browser.close()
console.log(`\n${fails ? `${fails} point(s) KO` : 'Tout est OK'}`)
process.exit(fails ? 1 : 0)
