/**
 * Script de mise à jour des dates de publication dans les frontmatters
 * Usage : node scripts/update-dates.mjs
 * Met à jour le champ `date:` de chaque .md selon le calendrier SEO
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const ARTICLES_DIR = resolve(ROOT, 'blog/articles')

// ── Calendrier SEO ────────────────────────────────────────────────────────────
const CALENDAR = {
  'article-1-airbnb-vs-booking.md':                              '2026-04-07',
  'article-2-prix-minimum-airbnb.md':                            '2026-04-09',
  'article-3-pms-debutant-lcd.md':                               '2026-04-11',
  'article-4-checklist-menage-lcd.md':                           '2026-04-14',
  'article-5-amenager-logement-lcd-budget.md':                   '2026-04-16',
  'article-6-booking-com-guide-hotes-lcd.md':                    '2026-04-18',
  'article-7-check-in-lcd-boite-cles-serrure-connectee.md':      '2026-04-22',
  'article-8-assurance-location-courte-duree.md':                '2026-04-24',
  'article-9-basse-saison-lcd-strategies.md':                    '2026-04-25',
  'article-10-photographier-logement-lcd-smartphone.md':         '2026-04-28',
  'article-11-teletravail-nomade-digital-lcd.md':                '2026-04-30',
  'article-12-gerer-mauvais-avis-airbnb.md':                     '2026-05-02',
  'article-13-declarer-activite-lcd-france-demarches.md':        '2026-05-05',
  'article-14-gerer-voyageurs-difficiles-lcd.md':                '2026-05-07',
  'article-15-site-reservation-directe-lcd.md':                  '2026-05-09',
  'article-16-conciergerie-airbnb-faire-appel-choisir.md':       '2026-05-12',
  'article-17-titre-annonce-airbnb-optimiser.md':                '2026-05-14',
  'article-18-tarification-dynamique-pricelabs-wheelhouse-bey.md': '2026-05-16',
  'article-19-livret-accueil-digital-lcd.md':                    '2026-05-19',
  'article-20-erreurs-debutant-lcd-premier-logement.md':         '2026-05-21',
  'article-21-location-directe-pourquoi-saffranchir-plateformes.md': '2026-05-23',
  'article-22-premieres-reservations-directes.md':               '2026-05-26',
  'article-23-base-voyageurs-fideles-location-directe.md':       '2026-05-28',
  'article-24-fixer-prix-reservation-directe.md':                '2026-05-30',
  'article-25-securiser-paiement-reservation-directe.md':        '2026-06-02',
  'article-26-instagram-hotes-lcd-reservations-directes.md':     '2026-06-04',
  'article-27-politique-annulation-location-directe.md':         '2026-06-06',
  'article-28-description-logement-reservation-directe.md':      '2026-06-09',
  'article-29-google-my-business-reservations-directes-lcd.md':  '2026-06-11',
  'article-30-mesurer-performance-reservation-directe.md':       '2026-06-13',
  'article-31-verification-voyageurs-lcd.md':                    '2026-06-16',
  'article-32-gabarits-messages-lcd.md':                         '2026-06-18',
  'article-33-communaute-lcd-groupes-hotes.md':                  '2026-06-20',
  'article-34-partenaires-lcd-outils-valides.md':                '2026-06-23',
  'article-35-formation-google-my-business-lcd.md':              '2026-06-25',
  'article-36-chambres-hotes-plateforme-jason-marinho.md':       '2026-06-27',
  'article-37-conciergeries-lcd-ressources-plateforme.md':       '2026-06-30',
  'article-38-formations-lcd-catalogue-plateforme.md':           '2026-07-02',
  'article-39-pourquoi-creer-compte-plateforme.md':              '2026-07-04',
  'article-40-appel-decouverte-jason-marinho.md':                '2026-07-07',
}

// ── Main ──────────────────────────────────────────────────────────────────────
let updated = 0
let skipped = 0

console.log('\n📅 Mise à jour des dates de publication...\n')

for (const [filename, date] of Object.entries(CALENDAR)) {
  const filepath = resolve(ARTICLES_DIR, filename)

  let content
  try {
    content = readFileSync(filepath, 'utf8')
  } catch {
    console.warn(`⚠️  Fichier introuvable : ${filename}`)
    skipped++
    continue
  }

  // Remplacer le champ date dans le frontmatter
  const updated_content = content.replace(
    /^(date:\s*")[^"]*(")/m,
    `$1${date}$2`
  )

  if (updated_content === content) {
    // Essayer sans guillemets
    const updated_content2 = content.replace(
      /^(date:\s*)\S+/m,
      `$1"${date}"`
    )
    if (updated_content2 === content) {
      console.warn(`⚠️  Champ date introuvable dans : ${filename}`)
      skipped++
      continue
    }
    writeFileSync(filepath, updated_content2, 'utf8')
  } else {
    writeFileSync(filepath, updated_content, 'utf8')
  }

  console.log(`  ✓ ${date}  ${filename}`)
  updated++
}

console.log(`\n✅ ${updated} fichiers mis à jour`)
if (skipped > 0) console.log(`⚠️  ${skipped} fichiers ignorés`)
console.log('\nTerminé 🎉\n')
