#!/usr/bin/env node
// Liens choisis à la main vers les pages peu reliées (24/11/2026, audit SEO
// point 4, puis « go pour relier les 28 pages encore peu reliées »).
// - Article du blog : une ligne « Pour aller plus loin » avant le 2e
//   intertitre (un ou plusieurs liens), marqueurs LIEN-SERVICE.
// - Étude de revenus d'une ville : une ligne « Voir aussi » sous le tableau
//   des villes proches, mêmes marqueurs.
// Texte du lien : celui donné, sinon le titre de l'article visé.
// Lancé au build (scripts/build-site.sh) et contrôlé en CI. Une page
// supprimée depuis est signalée, jamais bloquante au build.
//   node scripts/inject-liens-services.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const { articles } = await import(pathToFileURL(path.join(ROOT, 'blog/articles-data.mjs')).href)
const titres = new Map(articles.map(a => [`/blog/${a.slug}`, a.title]))
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// page hôte → liens [adresse, texte facultatif]
const LIENS = {
  // Pages services (24/11/2026, premier passage)
  'blog/tva-location-courte-duree-2026': [['/services/simulateurs/franchise-tva-lcd', 'vérifie ta franchise de TVA avec le simulateur']],
  'blog/tva-petit-dejeuner-lcd-seuil-37500-2026-detail': [['/services/simulateurs/franchise-tva-lcd', 'le simulateur de franchise de TVA']],
  'blog/cloture-comptable-lcd-2026-7-actions-avant-31-decembre': [['/services/simulateurs/franchise-tva-lcd', 'vérifie ta franchise de TVA avec le simulateur']],
  'blog/video-annonce-airbnb-6-regles-tour-video-conversion-2026': [['/comparatif-matterport-cubicasa', 'visite virtuelle : Matterport ou CubiCasa'], ['/blog/videaste-lcd-6-regles-vendre-visite-video-hotes-airbnb']],
  'blog/photographe-airbnb-tarifs-comment-choisir': [['/comparatif-matterport-cubicasa', 'ajouter une visite virtuelle : Matterport ou CubiCasa'], ['/blog/videaste-lcd-6-regles-vendre-visite-video-hotes-airbnb']],
  'blog/photos-avant-apres-home-staging-lcd': [['/comparatif-matterport-cubicasa', 'visite virtuelle : Matterport ou CubiCasa']],
  'blog/conciergerie-airbnb-faire-appel-choisir': [['/comparatif-welkeys-guestready', 'Welkeys ou GuestReady, la comparaison']],
  'blog/creer-conciergerie-airbnb-2025': [['/comparatif-welkeys-guestready', 'Welkeys ou GuestReady : comment se positionnent les conciergeries clés en main']],
  'blog/acheter-appartement-lcd-7-criteres-rentabilite-avant-signer': [['/investir-lcd', 'investir en location courte durée : estimer un bien avant d\'acheter']],
  'blog/point-mort-lcd-calcul-rentabilite-hote': [['/investir-lcd', 'investir en location courte durée : les outils pour chiffrer un projet']],
  'blog/annulation-derniere-minute-lcd-7-actions-relouer-48h-sans-brader': [['/sos-hote/annulation-last-minute', 'la marche à suivre pas à pas face à une annulation de dernière minute']],
  'blog/politique-annulation-location-directe-hote': [['/sos-hote/annulation-last-minute', 'que faire après une annulation de dernière minute']],
  'blog/premieres-reservations-directes-sans-audience-site-web': [['/services/acquisition-voyageurs', 'attirer des voyageurs en direct : la formation Acquisition voyageurs']],
  'blog/base-voyageurs-fideles-location-directe-durable': [['/services/acquisition-voyageurs', 'la formation Acquisition voyageurs']],
  // Articles peu reliés (24/11/2026, second passage)
  'blog/cheque-cadeau-lcd-6-regles-vendre-bons-sejour-noel-tresorerie-basse-saison': [['/blog/cheques-vacances-ancv-lcd-accepter-2026']],
  'blog/basse-saison-location-courte-duree-strategies-reservations': [['/blog/cheques-vacances-ancv-lcd-accepter-2026'], ['/blog/lave-linge-seche-linge-lcd-6-criteres-equiper-debloquer-sejours-longs']],
  'blog/evenements-locaux-lcd-6-actions-tarifs-festivals': [['/blog/cyclotourisme-lcd-7-actions-attirer-voyageurs-velo']],
  'blog/partenariats-locaux-hotes-lcd-restaurants-activites': [['/blog/cyclotourisme-lcd-7-actions-attirer-voyageurs-velo']],
  'blog/sejours-longs-lcd-strategie-revenus-basse-saison': [['/blog/lave-linge-seche-linge-lcd-6-criteres-equiper-debloquer-sejours-longs']],
  'blog/checklist-menage-professionnelle-location-courte-duree': [['/blog/odeurs-lcd-6-regles-ambiance-olfactive-argument-avis-5-etoiles'], ['/blog/objets-oublies-voyageurs-lcd-7-regles-gerer-retours']],
  'blog/linge-de-maison-lcd-7-regles-draps-impeccables-budget': [['/blog/odeurs-lcd-6-regles-ambiance-olfactive-argument-avis-5-etoiles']],
  'blog/obtenir-avis-5-etoiles-airbnb': [['/blog/profil-hote-airbnb-bio-photo-confiance'], ['/blog/repondre-avis-5-etoiles-airbnb-transformer-reservations']],
  'blog/optimiser-annonce-airbnb': [['/blog/profil-hote-airbnb-bio-photo-confiance']],
  'blog/turnover-j0-lcd-7-regles-enchainer-checkout-checkin-meme-jour': [['/blog/robot-aspirateur-lcd-6-criteres-choisir-modele-entre-sejours']],
  'blog/trouver-equipe-menage-airbnb-fiable': [['/blog/robot-aspirateur-lcd-6-criteres-choisir-modele-entre-sejours'], ['/blog/prestataire-menage-lcd-basse-saison-garder-hotes-revenu-stable']],
  'blog/droits-voisins-lcd-copropriete-litiges': [['/blog/stationnement-voyageurs-lcd-6-solutions-eviter-conflits-voisins']],
  'blog/accueillir-groupe-lcd-7-regles-preserver-logement-voisins': [['/blog/stationnement-voyageurs-lcd-6-solutions-eviter-conflits-voisins'], ['/blog/voyageurs-surnumeraires-lcd-6-actions-personnes-en-plus-non-declarees']],
  'blog/accueillir-famille-enfants-airbnb-equipement': [['/blog/accepter-animaux-lcd-7-regles-pet-friendly'], ['/blog/voyageurs-mobilite-reduite-lcd-6-amenagements-accessibilite-pmr']],
  'blog/recherches-voyageurs-airbnb-tendances-emergentes-2026': [['/blog/accepter-animaux-lcd-7-regles-pet-friendly'], ['/blog/voyageurs-vehicule-electrique-lcd-7-actions-accueillir']],
  'blog/kit-hivernal-lcd-7-essentiels-avant-novembre-avis-5-etoiles': [['/blog/logement-lcd-ski-7-regles-saison-2026-2027-fideliser-voyageurs']],
  'blog/vacances-scolaires-2026-2027-lcd-6-regles-tirer-maximum': [['/blog/logement-lcd-ski-7-regles-saison-2026-2027-fideliser-voyageurs']],
  'blog/equipement-cuisine-lcd-8-regles-seduire-voyageurs-budget': [['/blog/machine-a-cafe-lcd-6-modeles-ravir-voyageurs-sans-exploser-budget']],
  'blog/petit-dejeuner-lcd-6-formules-voyageurs-budget': [['/blog/machine-a-cafe-lcd-6-modeles-ravir-voyageurs-sans-exploser-budget']],
  'blog/inventaire-logement-airbnb-modele-photos': [['/blog/objets-oublies-voyageurs-lcd-7-regles-gerer-retours']],
  'blog/outils-gerer-location-courte-duree-2025': [['/blog/outils-gratuits-indispensables-demarrer-lcd-2026']],
  'blog/erreurs-debutant-location-courte-duree-premier-logement': [['/blog/outils-gratuits-indispensables-demarrer-lcd-2026'], ['/blog/top-7-erreurs-nouveaux-hotes-lcd-eviter']],
  'blog/devenir-prestataire-menage-airbnb-se-lancer': [['/blog/prestataire-menage-lcd-basse-saison-garder-hotes-revenu-stable']],
  'blog/accueillir-voyageur-business-lcd-essentiels': [['/blog/reception-colis-voyageurs-lcd-6-regles-livraisons-sejour'], ['/blog/voyageurs-vehicule-electrique-lcd-7-actions-accueillir']],
  'blog/livret-accueil-digital-creer-location-courte-duree': [['/blog/reception-colis-voyageurs-lcd-6-regles-livraisons-sejour']],
  'blog/gerer-mauvais-avis-airbnb-reponse-hote': [['/blog/repondre-avis-5-etoiles-airbnb-transformer-reservations']],
  'blog/wifi-location-courte-duree-debit-equipement-avis': [['/blog/reseau-wifi-invite-lcd-6-etapes-isoler-securiser']],
  'blog/rgpd-donnees-voyageurs-airbnb-conformite': [['/blog/reseau-wifi-invite-lcd-6-etapes-isoler-securiser']],
  'blog/checklist-preparation-logement-avant-1ere-reservation': [['/blog/top-7-erreurs-nouveaux-hotes-lcd-eviter']],
  'blog/voyageurs-seniors-lcd-6-actions-capter-fideliser-60-plus': [['/blog/voyageurs-mobilite-reduite-lcd-6-amenagements-accessibilite-pmr']],
  'blog/gerer-voyageurs-difficiles-location-courte-duree': [['/blog/voyageurs-surnumeraires-lcd-6-actions-personnes-en-plus-non-declarees']],
  'blog/guide-fiscal-debutant-hote-airbnb-2026': [['/services/simulateurs/franchise-tva-lcd', 'le simulateur de franchise de TVA']],
  // Études de revenus des villes étrangères
  'services/simulateurs/revenus-lcd/lisbonne': [['/services/simulateurs/revenus-lcd/funchal', 'Funchal (Madère)']],
  'services/simulateurs/revenus-lcd/porto': [['/services/simulateurs/revenus-lcd/funchal', 'Funchal (Madère)']],
  'services/simulateurs/revenus-lcd/firenze': [['/services/simulateurs/revenus-lcd/rome', 'Rome']],
  'services/simulateurs/revenus-lcd/amsterdam': [['/services/simulateurs/revenus-lcd/berlin', 'Berlin']],
  'services/simulateurs/revenus-lcd/munich': [['/services/simulateurs/revenus-lcd/rome', 'Rome']],
  'services/simulateurs/revenus-lcd/barcelona': [['/services/simulateurs/revenus-lcd/rome', 'Rome']],
}

const lien = (href, t) => `<a href="${href}" style="color:var(--g);font-weight:500">${esc(t)}</a>`
let ecrites = 0
const ecarts = []
for (const [hote, liste] of Object.entries(LIENS)) {
  const file = path.join(ROOT, hote, 'index.html')
  const ok = liste.filter(([href]) => fs.existsSync(path.join(ROOT, href.slice(1), 'index.html')))
  if (!fs.existsSync(file) || ok.length !== liste.length) {
    console.error(`Lien ignoré (page introuvable) : ${hote}`)
    if (CHECK) process.exitCode = 1
    if (!fs.existsSync(file)) continue
  }
  const avant = fs.readFileSync(file, 'utf8')
  let html = avant.replace(/<!-- LIEN-SERVICE:START -->[\s\S]*?<!-- LIEN-SERVICE:END -->\n/, '')
  const nouveaux = ok.filter(([href]) => !html.includes(`href="${href}"`))
  if (nouveaux.length) {
    const liens = nouveaux.map(([href, t]) => lien(href, t || titres.get(href) || href)).join(' ; ')
    if (hote.startsWith('blog/')) {
      const h2 = [...html.matchAll(/<h2 class="art-h2"/g)]
      const at = (h2[1] ?? h2[0])?.index
      if (at !== undefined) html = html.slice(0, at) + `<!-- LIEN-SERVICE:START -->\n<p class="art-p" style="border-left:3px solid var(--g);padding-left:14px"><strong>Pour aller plus loin :</strong> ${liens}.</p>\n<!-- LIEN-SERVICE:END -->\n` + html.slice(at)
    } else {
      const ancre = 'dans le comparateur de villes.</p>\n'
      const at = html.indexOf(ancre)
      if (at >= 0) html = html.slice(0, at + ancre.length) + `<!-- LIEN-SERVICE:START -->\n    <p class="src">Voir aussi : ${liens}.</p>\n<!-- LIEN-SERVICE:END -->\n` + html.slice(at + ancre.length)
    }
  }
  if (html === avant) continue
  if (CHECK) ecarts.push(hote)
  else { fs.writeFileSync(file, html); ecrites++ }
}
if (CHECK) {
  if (ecarts.length) { console.error(`Liens à mettre à jour : ${ecarts.join(', ')}`); process.exit(1) }
  console.log('Liens choisis : à jour')
} else console.log(`Liens choisis : ${ecrites} pages écrites`)
