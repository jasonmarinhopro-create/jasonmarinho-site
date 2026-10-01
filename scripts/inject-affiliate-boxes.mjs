#!/usr/bin/env node
// Encadrés affiliés/parrainage (Hospitable, Shine, Indy, LegalPlace, Tiime, Lodgify) injectés dans les pages
// qui parlent déjà de l'outil. Idempotent : chaque encadré est entouré de
// marqueurs <!-- AFF:<id>:START/END --> et remplacé à chaque passage. À
// relancer après régénération d'un article (scripts/generate-article.mjs).
//
// Règles (cf. CLAUDE.md, Liens affiliés) : rel="sponsored noopener" sur
// chaque lien + mention visible. Le suivi des clics (nav.js) est automatique
// sur tout lien rel="sponsored".
//
// Usage : node scripts/inject-affiliate-boxes.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const HOSPITABLE_BLOG = 'https://hospitable.com/partners/refer?utm_source=affiliates&utm_medium=blog&utm_campaign=BASWTYN7'
const SHINE = 'https://app.shine.fr/register?referral=WYDP4644'
// Indy (partenariat du 30/09/2026) : lien « spécial immobilier » fourni par Indy
const INDY = 'https://urlr.me/FEqNfy'
// LegalPlace (partenariat du 30/09/2026, numéro d'affilié 1773)
const LP = 'utm_source=affilae&utm_medium=partner&utm_campaign=Jason%20Marinho&ae=1773'
const LP_SOCIETE = `https://creation.legalplace.fr/creation-entreprise-2?${LP}`
const LP_MICRO = `https://www.legalplace.fr/contrats/creation-micro-entreprise/?${LP}`
const LP_DOMICILIATION = `https://landing.legalplace.fr/domiciliation?${LP}`
// Tiime (partenariat Affilae accepté le 01/10/2026, numéro d'affilié 1127) :
// lien traqué généré dans Affilae, vers la page facturation électronique
const TIIME = 'https://lb.affilae.com/r/?p=651c0d1e40e2d575f87b3b27&af=1127&lp=https%3A%2F%2Fwww.tiime.fr%2Ffacturation-electronique-2026%3Futm_source%3Dother%26utm_medium%3Daffiliation%26utm_campaign%3DJason%2520Marinho%26ae%3D1127%26program_id%3D651c0d1e40e2d575f87b3b27%26program_name%3DTiime'

const btn = (href, label) => `<a href="${href}" target="_blank" rel="sponsored noopener" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:14px;padding:10px 16px;border-radius:9px;text-decoration:none;background:#004c3f;color:#fff">${label}</a>`
const box = (id, intro, button, mention) => `<!-- AFF:${id}:START -->
<div class="aff-${id.split('-')[0]}" style="margin:18px 0 22px;padding:16px 18px;border:1px solid rgba(0,76,63,.18);border-radius:12px;background:rgba(0,76,63,.04)">
<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#111827">${intro}</p>
<div style="display:flex;flex-wrap:wrap;gap:8px">${button}</div>
<p style="margin:10px 0 0;font-size:12.5px;line-height:1.5;color:#6B7280">${mention}</p>
</div>
<!-- AFF:${id}:END -->
`

const hospitableTu = box('hospitable-tu',
  "<strong>Tester Hospitable :</strong> essai gratuit de 14 jours sans carte bancaire, puis <strong>25 % de réduction sur tes 3 premiers mois</strong> en passant par ce lien.",
  btn(HOSPITABLE_BLOG, 'Essayer Hospitable gratuitement'),
  "Lien affilié : si tu t'abonnes via ce lien, je touche une commission, sans aucun surcoût pour toi (tu profites au contraire de la réduction). Mon avis reste indépendant. <a href=\"/hospitable-avis\" style=\"color:#004c3f\">Lire mon avis complet sur Hospitable</a>.")

const hospitableVous = box('hospitable-vous',
  "<strong>Tester Hospitable :</strong> essai gratuit de 14 jours sans carte bancaire, puis <strong>25 % de réduction sur vos 3 premiers mois</strong> en passant par ce lien.",
  btn(HOSPITABLE_BLOG, 'Essayer Hospitable gratuitement'),
  "Lien affilié : si vous vous abonnez via ce lien, je perçois une commission, sans aucun surcoût pour vous (vous profitez au contraire de la réduction). Mon avis reste indépendant. <a href=\"/hospitable-avis\" style=\"color:#004c3f\">Lire mon avis complet sur Hospitable</a>.")

const shineTu = box('shine-tu',
  "<strong>Ouvrir un compte Shine :</strong> néobanque pro française, ouverture en ligne. Avec mon lien de parrainage, tu as un mois d'abonnement offert en plus de l'essai (selon les conditions de parrainage en vigueur chez Shine).",
  btn(SHINE, 'Ouvrir mon compte Shine'),
  "Lien de parrainage : si tu ouvres un compte via ce lien, je touche une prime de parrainage, sans aucun surcoût pour toi. Je ne recommande Shine que comme une option parmi d'autres (Qonto, Blank, Finom) : compare selon tes besoins.")

const indyTu = box('indy-tu',
  "<strong>Ta compta LMNP avec Indy :</strong> offre gratuite (suivi, facture électronique en plateforme agréée), puis offre LMNP avec amortissements et liasse 2031 télétransmise. <strong>Premier mois offert</strong>, sans engagement, avec ce lien.",
  btn(INDY, 'Essayer Indy gratuitement'),
  "Lien affilié : si tu t'inscris via ce lien, Indy me verse une commission, sans aucun surcoût pour toi (tu as au contraire ton premier mois offert). <a href=\"/blog/indy-lmnp-location-courte-duree-avis-2026\" style=\"color:#004c3f\">Lire mon avis complet sur Indy, limites comprises</a>.")

const indyVous = box('indy-vous',
  "<strong>Essayer Indy :</strong> offre gratuite à vie, puis offre LMNP avec amortissements et liasse 2031 télétransmise. <strong>Premier mois offert</strong>, sans engagement, avec ce lien.",
  btn(INDY, 'Essayer Indy gratuitement'),
  "Lien affilié : si vous vous inscrivez via ce lien, Indy me verse une commission, sans aucun surcoût pour vous (vous avez au contraire votre premier mois offert). Mon avis reste indépendant. <a href=\"/blog/indy-lmnp-location-courte-duree-avis-2026\" style=\"color:#004c3f\">Lire mon avis complet sur Indy</a>.")

const LP_MENTION = "Lien affilié : si tu passes par ce lien, LegalPlace me verse une commission, sans aucun surcoût pour toi. Si tu es à l'aise avec les formalités, tu peux aussi tout faire toi-même sur le guichet unique de l'INPI (gratuit pour une micro-entreprise)."
const legalplaceConciergerie = box('legalplace-conciergerie',
  "<strong>Créer ta structure en ligne :</strong> LegalPlace rédige et dépose les statuts de ta SASU ou SARL, ou crée ta micro-entreprise, et propose aussi la domiciliation si tu ne veux pas mettre ton adresse perso.",
  btn(LP_SOCIETE, 'Créer ma société') + ' ' + btn(LP_MICRO, 'Créer ma micro-entreprise') + ' ' + btn(LP_DOMICILIATION, 'Domicilier mon entreprise'),
  LP_MENTION)
const legalplaceMenage = box('legalplace-menage',
  "<strong>Démarrer en micro-entreprise :</strong> LegalPlace s'occupe de la déclaration en ligne si tu préfères être guidé.",
  btn(LP_MICRO, 'Créer ma micro-entreprise'),
  LP_MENTION)

const tiimeTu = box('tiime-tu',
  "<strong>Facturer simplement avec Tiime :</strong> devis et factures illimités, factures électroniques conformes à la réforme (Tiime est plateforme agréée), le tout dans l'offre gratuite, sans carte bancaire. Le compte pro et les notes de frais sont dans les offres payantes.",
  btn(TIIME, 'Créer mon compte Tiime gratuit'),
  "Lien affilié : si tu t'inscris via ce lien, Tiime me verse une commission, sans aucun surcoût pour toi. Indy et Henrri sont d'autres options gratuites : <a href=\"/comparatif-indy-tiime-henrri\" style=\"color:#004c3f\">voir le comparatif</a>.")
const tiimeVous = box('tiime-vous',
  "<strong>Essayer Tiime :</strong> l'offre gratuite couvre les devis, les factures illimitées et la facture électronique (émission et réception), sans carte bancaire.",
  btn(TIIME, 'Créer un compte Tiime gratuit'),
  "Lien affilié : si vous vous inscrivez via ce lien, Tiime me verse une commission, sans aucun surcoût pour vous. Pour un LMNP au régime réel, Tiime ne suffit pas : voyez Indy ci-dessus.")

// Lodgify (code JASON15 du 01/10/2026) : articles sur la réservation directe
// qui n'avaient pas encore d'encadré (ceux qui en ont un : classe .aff-lodgify
// écrite à la main, ligne du code ajoutée dedans)
const LODGIFY_TRIAL = 'https://app.lodgify.com/signup/fr/?afmc=ui1'
const lodgifyTu = box('lodgify-tu',
  "<strong>Ton site de réservation directe avec Lodgify :</strong> un site à ton nom, relié à Airbnb, Booking.com et Vrbo, avec le paiement en ligne. Essai gratuit de 7 jours, puis <strong>-15 % avec le code JASON15</strong> en paiement annuel ou tous les 2 ans (formules Professional et Ultimate, jusqu'au 1er octobre 2027).",
  btn(LODGIFY_TRIAL, 'Essai gratuit 7 jours') + ' <a href="/partenaires/lodgify" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:14px;padding:10px 16px;border-radius:9px;text-decoration:none;border:1px solid rgba(0,76,63,.3);color:#004c3f;background:#fff">Voir l\'offre partenaire</a>',
  "Lien affilié : si tu t'abonnes via ce lien, Lodgify me verse une commission, sans aucun surcoût pour toi (tu gardes la réduction). <a href=\"/code-promo-lodgify\" style=\"color:#004c3f\">Conditions du code JASON15</a>.")

// [fichier, id, texte avant lequel insérer l'encadré, contenu]
const PLACEMENTS = [
  ['comparatif-smoobu-hospitable/index.html', 'hospitable-vous', '</section>\n\n<section id="verdict">', hospitableVous],
  ['blog/messagerie-unifiee-3-plateformes-tester/index.html', 'hospitable-tu', '<h2 class="art-h2">2. Smoobu : l\'option européenne complète</h2>', hospitableTu],
  ['blog/logiciels-conciergerie-comparatif-2026/index.html', 'hospitable-tu', '<h2 class="art-h2">2. Smoobu : l\'option européenne tout-en-un</h2>', hospitableTu],
  ['blog/hospitable-tarification-dynamique-incluse-pms-fin-outils-seuls/index.html', 'hospitable-tu', '<h2 class="art-h2">4. L\'automatisation au-delà du pricing', hospitableTu],
  ['blog/creer-conciergerie-airbnb-2025/index.html', 'legalplace-conciergerie', '<h2 class="art-h2">Étape 2 : Trouver ses premiers clients', legalplaceConciergerie],
  ['blog/devenir-prestataire-menage-airbnb-se-lancer/index.html', 'legalplace-menage', '<h2 class="art-h2">Fixer tes tarifs sans te brader', legalplaceMenage],
  ['comparatif-indy-tiime-henrri/index.html', 'indy-vous', '</section>\n\n<section id="tiime">', indyVous],
  ['comparatif-indy-tiime-henrri/index.html', 'tiime-vous', '</section>\n\n<section id="henrri">', tiimeVous],
  ['blog/devenir-prestataire-menage-airbnb-se-lancer/index.html', 'tiime-tu', '<h2 class="art-h2">Trouver tes premiers clients hôtes</h2>', tiimeTu],
  ['blog/creer-conciergerie-airbnb-2025/index.html', 'tiime-tu', '<h2 class="art-h2">Étape 5 : Le contrat de gestion</h2>', tiimeTu],
  ['blog/declarer-lmnp-sans-expert-comptable-decla-fr/index.html', 'indy-tu', '<h2 class="art-h2">5. Les limites : quand ce n\'est pas fait pour toi', indyTu],
  ['blog/regime-reel-vs-micro-bic-decision-2026/index.html', 'indy-tu', '<h2 class="art-h2">4. Comment basculer en régime réel', indyTu],
  ['blog/lmnp-vs-lmp-changement-2026-impact/index.html', 'indy-tu', '<h2 class="art-h2">4. Optimiser sa fiscalité LCD en 2026', indyTu],
  ['blog/location-directe-pourquoi-saffranchir-plateformes/index.html', 'lodgify-tu', '<h2 class="art-h2">Ce que la location directe ne remplace pas (encore)</h2>', lodgifyTu],
  ['blog/fixer-prix-reservation-directe-location-courte-duree/index.html', 'lodgify-tu', '<h2 class="art-h2">Et pour les séjours longs en direct ?</h2>', lodgifyTu],
  ['blog/outils-gerer-location-courte-duree-2025/index.html', 'lodgify-tu', '<h2 class="art-h2">2. Channel Manager, Synchronisation multi-plateformes</h2>', lodgifyTu],
  ['blog/stripe-paiement-direct-lcd-mise-en-place/index.html', 'lodgify-tu', '<h2 class="art-h2">3. Paramétrage avancé</h2>', lodgifyTu],
  ['blog/compte-bancaire-pro-hote-lcd-6-raisons-choisir-2026/index.html', 'shine-tu', '<ul class="art-ul"><li>Ouverture 100 % en ligne recommandée', shineTu],
]

let n = 0
for (const [rel, id, anchor, html] of PLACEMENTS) {
  const file = path.join(ROOT, rel)
  let src = fs.readFileSync(file, 'utf8')
  src = src.replace(new RegExp(`<!-- AFF:${id}:START -->[\\s\\S]*?<!-- AFF:${id}:END -->\\n?`), '')
  const i = src.indexOf(anchor)
  if (i === -1) throw new Error(`Ancre introuvable dans ${rel} : ${anchor}`)
  src = src.slice(0, i) + html + src.slice(i)
  fs.writeFileSync(file, src)
  n++
}
console.log(`[inject-affiliate-boxes] ${n} encadrés injectés`)
