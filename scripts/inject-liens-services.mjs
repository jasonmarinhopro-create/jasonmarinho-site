#!/usr/bin/env node
// Liens vers les pages services peu reliées, depuis les articles du même sujet
// (24/11/2026, audit SEO point 4 : pages à 1 ou 2 liens internes). Une ligne
// « Pour aller plus loin » avant le 2e intertitre, marqueurs LIEN-SERVICE.
// Lancé au build (scripts/build-site.sh). Idempotent.
//   node scripts/inject-liens-services.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')

// article → [page, texte du lien]
const LIENS = {
  'tva-location-courte-duree-2026': ['/services/simulateurs/franchise-tva-lcd', 'vérifie ta franchise de TVA avec le simulateur'],
  'tva-petit-dejeuner-lcd-seuil-37500-2026-detail': ['/services/simulateurs/franchise-tva-lcd', 'le simulateur de franchise de TVA'],
  'video-annonce-airbnb-6-regles-tour-video-conversion-2026': ['/comparatif-matterport-cubicasa', 'visite virtuelle : Matterport ou CubiCasa'],
  'photographe-airbnb-tarifs-comment-choisir': ['/comparatif-matterport-cubicasa', 'ajouter une visite virtuelle : Matterport ou CubiCasa'],
  'conciergerie-airbnb-faire-appel-choisir': ['/comparatif-welkeys-guestready', 'Welkeys ou GuestReady, la comparaison'],
  'acheter-appartement-lcd-7-criteres-rentabilite-avant-signer': ['/investir-lcd', 'investir en location courte durée : estimer un bien avant d\'acheter'],
  'point-mort-lcd-calcul-rentabilite-hote': ['/investir-lcd', 'investir en location courte durée : les outils pour chiffrer un projet'],
  'annulation-derniere-minute-lcd-7-actions-relouer-48h-sans-brader': ['/sos-hote/annulation-last-minute', 'la marche à suivre pas à pas face à une annulation de dernière minute'],
  'politique-annulation-location-directe-hote': ['/sos-hote/annulation-last-minute', 'que faire après une annulation de dernière minute'],
  'premieres-reservations-directes-sans-audience-site-web': ['/services/acquisition-voyageurs', 'attirer des voyageurs en direct : la formation Acquisition voyageurs'],
  'base-voyageurs-fideles-location-directe-durable': ['/services/acquisition-voyageurs', 'la formation Acquisition voyageurs'],
}

let ecrites = 0
const ecarts = []
for (const [slug, [href, texte]] of Object.entries(LIENS)) {
  const file = path.join(ROOT, 'blog', slug, 'index.html')
  // Article ou page supprimés depuis : signalé, jamais bloquant au build (--check échoue)
  if (!fs.existsSync(file) || !fs.existsSync(path.join(ROOT, href.slice(1), 'index.html'))) {
    console.error(`Lien service ignoré (article ou page introuvable) : ${slug} → ${href}`)
    if (CHECK) process.exitCode = 1
    continue
  }
  const avant = fs.readFileSync(file, 'utf8')
  let html = avant.replace(/<!-- LIEN-SERVICE:START -->[\s\S]*?<!-- LIEN-SERVICE:END -->\n/, '')
  if (!html.includes(`href="${href}"`)) {
    const h2 = [...html.matchAll(/<h2 class="art-h2"/g)]
    const at = (h2[1] ?? h2[0])?.index
    if (at !== undefined) {
      const ligne = `<!-- LIEN-SERVICE:START -->\n<p class="art-p" style="border-left:3px solid var(--g);padding-left:14px"><strong>Pour aller plus loin :</strong> <a href="${href}" style="color:var(--g);font-weight:500">${texte}</a>.</p>\n<!-- LIEN-SERVICE:END -->\n`
      html = html.slice(0, at) + ligne + html.slice(at)
    }
  }
  if (html === avant) continue
  if (CHECK) ecarts.push(slug)
  else { fs.writeFileSync(file, html); ecrites++ }
}
if (CHECK) {
  if (ecarts.length) { console.error(`Liens services à mettre à jour : ${ecarts.join(', ')}`); process.exit(1) }
  console.log('Liens services : à jour')
} else console.log(`Liens services : ${ecrites} articles écrits`)
