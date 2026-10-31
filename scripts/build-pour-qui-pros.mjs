#!/usr/bin/env node
// Pages « Pour qui » des pros : /pour-qui/photographes, /pour-qui/menage et
// /pour-qui/depannage (31/10/2026, 3e métier de l'annuaire)
// (13/10/2026, Jason : « très vides, ajoute plus d'information, des captures
// d'écran, l'annuaire c'est bien plus que ça »). Pages statiques, pas lancé
// au build : node scripts/build-pour-qui-pros.mjs. Ne plus éditer le HTML.
// Captures : img/pour-qui/*.webp, faites par scripts/captures-pour-qui.mjs
// à partir des fiches d'exemple (fictives) et des pages du site.
// Faits repris de CLAUDE.md (offre, demandes, statistiques, devis,
// planning) : les changer ici si l'offre change.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const nbVilles = prefix => fs.readdirSync(ROOT).filter(d => d.startsWith(prefix)).length
const VILLES = nbVilles('photographe-lcd-')
const VILLES_DEP = nbVilles('depannage-lcd-')
const VILLES_MENAGE = nbVilles('menage-lcd-')

const PHOTO = {
  key: 'photographe', dir: 'photographes', k: 'photo',
  title: 'Photographe ou vidéaste Airbnb : rejoins l’annuaire',
  desc: 'Photographe ou vidéaste location courte durée ? Une fiche vue par les hôtes de ta ville : site vitrine sur Google, ta vidéo, les demandes en direct, tes statistiques. Sans commission.',
  crumb: 'Photographes et vidéastes',
  eye: 'Pour les photographes et vidéastes immobiliers et d’hébergement',
  h1: 'Les hôtes de ta ville cherchent un photographe ou un vidéaste. <em>Sois celui qu’ils trouvent.</em>',
  lead: 'Une fiche qui travaille pour toi toute l’année : tes photos, ta vidéo, tes formules, ta zone, présentés aux hôtes Airbnb et Booking qui cherchent un pro près de chez eux. Ils t’écrivent directement, tu gardes 100 % de tes séances.',
  inscription: '/annuaires/photographes/inscription',
  exemple: '/annuaires/photographes/exemple-fiche',
  annuaire: '/annuaires/photographes',
  villeEx: '/photographe-lcd-lyon',
  devenir: '/devenir-photographe-lcd',
  metierPl: 'photographes', metierUn: 'un photographe', placesKey: 'photographers',
  villes: VILLES, travail: 'séances', villePage: 'Photographe & vidéaste', villePageLcd: 'Photographe & vidéaste LCD à…',
  villeSujets: 'tarifs constatés, checklist des photos', recherche: 'photographe Airbnb', carteTrait: 'ta spécialité',
  t1: 'Tes photos, <em>en grand</em>', t2: 'Tes formules, <em>sans ambiguïté</em>', inclExtra: '',
  alts: {
    fiche: 'Fiche d’exemple de Camille Sénéchal, photographe à Lyon : bandeau, photo principale et boutons de contact',
    galerie: 'Galerie de 6 photos sur la fiche d’exemple',
    formules: 'Formules et déroulé d’une séance sur la fiche d’exemple',
    cartes: 'Cartes de photographes dans l’annuaire (fiches fictives)',
    ville: 'Page « Photographe & vidéaste LCD à Lyon » du site',
    demande: 'Formulaire « Décris ton besoin » rempli par un hôte',
    stats: 'Exemple de l’écran « Mes statistiques » d’un photographe (chiffres fictifs)',
  },
  vitrine: [
    ['ph-images', '6 photos en mosaïque', 'Une galerie qui s’agrandit au clic, en carrousel sur téléphone. Ta meilleure photo sert aussi de couverture.'],
    ['ph-link', 'Un vrai lien vers ton site', 'Le bouton « Voir le portfolio » mène à ton site ou à ton Instagram, en lien dofollow : il aide aussi ton propre site sur Google.'],
    ['ph-play-circle', 'Ta vidéo en haut de ta fiche', 'Un lien YouTube ou Vimeo se lit à côté de ton nom, une chaîne devient un bouton « Voir les vidéos ». Tes réseaux restent en pastilles en bas.'],
    ['ph-device-mobile', 'Pensée pour le téléphone', 'Une barre « Contacter » reste en bas de l’écran pendant que l’hôte regarde tes photos.'],
  ],
  formulesTxt: 'Jusqu’à 3 formules avec leur prix (ou « sur devis »), puis ta façon de travailler en 3 étapes et les villes où tu te déplaces. L’hôte sait à quoi s’attendre avant même de t’écrire : ses demandes sont plus précises, tes devis plus rapides.',
  extraFeature: {
    eye: 'Devis en ligne',
    h: 'Un devis propre <em>en 2 minutes</em>',
    p: 'Depuis une demande reçue, tu prépares ton devis : lignes, prix, validité. L’hôte le reçoit par e-mail, l’ouvre sur une page à ton nom et l’accepte en ligne. Tu es prévenu tout de suite, et tu suis tes devis envoyés, acceptés ou refusés.',
    bullets: ['Numérotation automatique et mentions de ton statut', 'Relance en un clic si l’hôte ne répond pas', 'Version PDF pour tes archives'],
    mock: 'devis',
  },
  steps: [
    ['Crée ta fiche', 'Nom, ville, zone, photo ou vidéo, site ou portfolio et prix de départ : 2 minutes.'],
    ['Paie en ligne', '39,98 € TTC par an au tarif Fondateur, par carte via Stripe. Ta fiche est en ligne dans la foulée, sans validation à attendre.'],
    ['Complète-la', 'Ajoute tes 6 photos, tes formules et tes villes depuis ton espace, puis partage le lien de ta fiche.'],
  ],
  faq: [
    ['Combien coûte la fiche ?', 'Les 20 premiers photographes paient 39,98 € TTC par an, un tarif bloqué à vie. Ensuite, ce sera 79,98 € TTC par an. Sans engagement : tu résilies quand tu veux depuis ton espace.'],
    ['Est-ce que vous prenez une commission sur mes séances ?', 'Non, jamais. L’hôte te contacte directement et le devis, la séance et le paiement se règlent entre vous. La fiche est un abonnement fixe.'],
    ['Y a-t-il une validation de mon profil ?', 'Non. Ta fiche est en ligne quelques minutes après le paiement. Tu la complètes ensuite quand tu veux depuis ton espace.'],
    ['Je suis vidéaste, est-ce pour moi ?', 'Oui. À l’inscription, tu choisis photographe, vidéaste ou les deux, et tes options (drone, visite 3D, vidéos courtes…). Les hôtes filtrent l’annuaire selon ce qu’ils cherchent, et ta vidéo se lit en haut de ta fiche.'],
    ['Comment les hôtes me trouvent-ils ?', `Par l’annuaire des photographes et vidéastes (recherche par ville, y compris les villes que tu couvres, et filtres photo, vidéo ou drone), par la page « Photographe à » ta ville (${VILLES} villes ont la leur), par Google, où ta fiche est indexée, et par les demandes « Décris ton besoin », envoyées aux 3 photographes les plus proches.`],
    ['Et si je n’ai pas encore mes photos sous la main ?', 'Pas de souci : ta fiche est en ligne dès le paiement avec tes initiales, et tu ajoutes tes photos, tes formules et tes villes ensuite depuis ton espace.'],
    ['Comment savoir si ma fiche m’apporte des clients ?', 'L’espace « Mes statistiques » montre les visiteurs de ta fiche, les clics vers ton site et ton Instagram, les demandes reçues, les recherches Google qui t’amènent et ta place moyenne. Un bilan arrive par e-mail le 1er de chaque mois.'],
    ['Le lien vers mon site compte-t-il pour Google ?', 'Oui : le lien de ta fiche vers ton site ou ton portfolio est un lien classique (dofollow), et ta fiche est déclarée à Google dans notre plan du site.'],
  ],
}

const MENAGE = {
  key: 'menage', dir: 'menage', k: 'menage',
  title: 'Ménage Airbnb : rejoins l’annuaire des hôtes LCD',
  desc: 'Équipe de ménage location courte durée ? Une fiche vue par les hôtes de ta ville, les demandes en direct, le planning de tes clients calculé depuis Airbnb et Booking. Sans commission.',
  crumb: 'Équipes de ménage',
  eye: 'Pour les équipes de ménage et de conciergerie',
  h1: 'Les hôtes de ta ville cherchent une équipe fiable. <em>Sois celle qu’ils trouvent.</em>',
  lead: 'Une fiche qui présente ton équipe aux hôtes Airbnb et Booking de ta zone : prestations, prix, capacité, assurance. Ils t’écrivent directement, et une fois clients, leurs ménages arrivent tout seuls dans ton planning.',
  inscription: '/annuaires/menage/inscription',
  exemple: '/annuaires/menage/exemple-fiche',
  annuaire: '/annuaires/menage',
  villeEx: '/menage-lcd-bordeaux',
  devenir: '/devenir-prestataire-menage-lcd',
  metierPl: 'équipes de ménage', metierUn: 'une équipe de ménage', placesKey: 'cleaners',
  villes: VILLES_MENAGE, travail: 'ménages', villePage: 'Équipe de ménage', villePageLcd: 'Équipe de ménage LCD à…',
  villeSujets: 'rythme des ménages', recherche: 'ménage Airbnb', carteTrait: 'ta taille d’équipe',
  t1: 'Ton équipe, <em>en images</em>', t2: 'Tes prestations, <em>sans ambiguïté</em>', inclExtra: ' et planning de tes clients',
  aussi: 'Et aussi : des devis en ligne, acceptés par l’hôte en un clic.',
  alts: {
    fiche: 'Fiche d’exemple d’Éclat Ménage Bordeaux : bandeau, photo principale et boutons de contact',
    galerie: 'Galerie de photos sur la fiche d’exemple',
    formules: 'Formules, prestations, capacité et déroulé sur la fiche d’exemple',
    cartes: 'Cartes d’équipes de ménage dans l’annuaire (fiches fictives)',
    ville: 'Page « Équipe de ménage LCD à Bordeaux » du site',
    demande: 'Formulaire « Décris ton besoin » rempli par un hôte',
    stats: 'Exemple de l’écran « Mes statistiques » d’une équipe de ménage (chiffres fictifs)',
  },
  vitrine: [
    ['ph-images', '6 photos en mosaïque', 'Ton équipe au travail, des logements prêts à accueillir : une galerie qui rassure, en carrousel sur téléphone.'],
    ['ph-shield-check', 'Ce qui rassure un hôte', 'Taille de l’équipe, logements entretenus, délai pour réserver, langues, SIRET et assurance responsabilité civile pro, bien en vue.'],
    ['ph-share-network', 'Ton site et tes réseaux', 'Un vrai lien (dofollow) vers ton site, et ta fiche Google, Instagram ou Facebook en petites pastilles.'],
    ['ph-device-mobile', 'Pensée pour le téléphone', 'Une barre « Contacter » reste en bas de l’écran pendant que l’hôte parcourt ta fiche.'],
  ],
  formulesTxt: 'Jusqu’à 3 formules avec leur prix, les prestations que tu proposes (linge, réassort, état des lieux en photos, petite maintenance…), ta capacité et ta façon de travailler en 3 étapes. L’hôte voit tout de suite si tu peux suivre son rythme de réservations.',
  extraFeature: {
    eye: 'Le planning de tes clients',
    h: 'Leurs ménages arrivent <em>tout seuls</em>',
    p: 'Chaque hôte client te partage le lien de son planning depuis son app. Les ménages sont calculés d’après ses réservations Airbnb, Booking et directes, jour par jour, avec l’adresse et les arrivées le jour même. Tu marques chaque ménage fait avec des photos : l’hôte est prévenu.',
    bullets: ['Sans compte partagé ni mot de passe de l’hôte', 'Arrivée le jour même signalée en un coup d’œil', 'Photos de fin de ménage envoyées à l’hôte'],
    mock: 'planning',
  },
  steps: [
    ['Crée ta fiche', 'Nom de l’équipe, ville, zone, prestations, taille et prix de départ : 2 minutes.'],
    ['Paie en ligne', '39,98 € TTC par an au tarif Fondateur, par carte via Stripe. Ta fiche est en ligne dans la foulée, sans validation à attendre.'],
    ['Complète-la', 'Ajoute tes photos, tes formules et tes villes depuis ton espace, puis connecte le planning de tes clients.'],
  ],
  faq: [
    ['Combien coûte la fiche ?', 'Les 20 premières équipes paient 39,98 € TTC par an, un tarif bloqué à vie. Ensuite, ce sera 79,98 € TTC par an. Sans engagement : tu résilies quand tu veux depuis ton espace.'],
    ['Est-ce que vous prenez une commission sur mes ménages ?', 'Non, jamais. L’hôte te contacte directement et le devis, les ménages et le paiement se règlent entre vous. La fiche est un abonnement fixe.'],
    ['Y a-t-il une validation de mon profil ?', 'Non. Ta fiche est en ligne quelques minutes après le paiement. Tu la complètes ensuite quand tu veux depuis ton espace.'],
    ['Comment les hôtes me trouvent-ils ?', `Par l’annuaire des équipes de ménage (recherche par ville, y compris les villes que tu couvres), par la page « Équipe de ménage à » ta ville (${VILLES_MENAGE} villes ont la leur), par Google, où ta fiche est indexée, et par les demandes « Décris ton besoin », envoyées aux 3 équipes les plus proches.`],
    ['Comment marche le planning de mes clients ?', 'L’hôte te partage un lien depuis son app. Tu le colles dans ton espace : ses ménages s’affichent d’après ses réservations, et tu les marques faits avec des photos. S’il change son lien, l’accès s’arrête tout seul.'],
    ['Comment savoir si ma fiche m’apporte des clients ?', 'L’espace « Mes statistiques » montre les visiteurs de ta fiche, les clics vers ton site, les demandes reçues, les recherches Google qui t’amènent et ta place moyenne. Un bilan arrive par e-mail le 1er de chaque mois.'],
    ['Faut-il un SIRET ou une assurance ?', 'Ce n’est pas obligatoire pour créer ta fiche, mais les hôtes y sont attentifs : ton SIRET et ton assurance responsabilité civile pro s’affichent sur ta fiche si tu les renseignes.'],
  ],
}

// Dépannage et maintenance (31/10/2026). Faits vérifiés dans le code : demande
// triée d'abord par spécialité (lib/demandes/rules.ts, convientAuBesoin), urgence
// demandée à l'hôte (QUAND_DEPANNAGE), devis et statistiques communs aux 3 métiers,
// pas de planning ni d'assurance dans la fiche dépannage.
const DEPANNAGE = {
  key: 'depannage', dir: 'depannage', k: 'depannage',
  title: 'Dépannage Airbnb : rejoins l’annuaire des hôtes LCD',
  desc: 'Plombier, électricien, serrurier ou multiservice ? Une fiche vue par les hôtes Airbnb de ta ville, leurs demandes par spécialité, même urgentes. Sans commission.',
  crumb: 'Dépannage et maintenance',
  eye: 'Pour les artisans du dépannage et de la maintenance',
  h1: 'Une fuite, une panne, une serrure bloquée entre deux voyageurs. <em>Sois le pro qu’ils appellent.</em>',
  lead: 'Une fiche qui présente tes spécialités, ton délai d’intervention et ta zone aux hôtes Airbnb et Booking de ta ville. Ils t’écrivent directement, souvent quand ça presse, et tu gardes 100 % de tes interventions.',
  inscription: '/annuaires/depannage/inscription',
  exemple: '/annuaires/depannage/exemple-fiche',
  annuaire: '/annuaires/depannage',
  villeEx: '/depannage-lcd-nantes',
  devenir: '/annuaires/depannage',
  devenirLabel: 'Voir l’annuaire',
  metierPl: 'pros du dépannage', metierUn: 'un pro du dépannage', placesKey: 'depannage',
  villes: VILLES_DEP, travail: 'interventions', villePage: 'Dépannage', villePageLcd: 'Dépannage et maintenance LCD à…',
  villeSujets: 'pannes fréquentes entre deux séjours, questions à poser', recherche: 'plombier Airbnb', carteTrait: 'tes spécialités',
  t1: 'Ton travail, <em>en images</em>', t2: 'Tes spécialités et tes prix, <em>sans ambiguïté</em>', inclExtra: '',
  alts: {
    fiche: 'Fiche d’exemple d’Atelier Martin, dépannage à Nantes : bandeau, photo principale et boutons de contact',
    galerie: 'Galerie de photos sur la fiche d’exemple',
    formules: 'Formules, tarif horaire et spécialités sur la fiche d’exemple',
    cartes: 'Cartes de pros du dépannage dans l’annuaire (fiches fictives)',
    ville: 'Page « Dépannage et maintenance LCD à Nantes » du site',
    demande: 'Formulaire « Décris ton besoin » rempli par un hôte',
    stats: 'Exemple de l’écran « Mes statistiques » d’un pro du dépannage (chiffres fictifs)',
  },
  vitrine: [
    ['ph-wrench', 'Tes spécialités en clair', 'Plomberie, électricité, chauffage, serrurerie, multiservice, montage, vitrerie, électroménager, extérieur : l’hôte voit tout de suite si tu fais ce qu’il cherche.'],
    ['ph-clock', 'Ton délai et tes disponibilités', 'Le jour même, sous 24 h, 48 h ou dans la semaine, en semaine, le soir, le week-end ou en urgence : ce qui compte le plus pour un hôte qui attend un voyageur.'],
    ['ph-images', '6 photos de tes chantiers', 'Avant et après, ton véhicule, ton atelier : une galerie qui rassure, en carrousel sur téléphone.'],
    ['ph-device-mobile', 'Pensée pour le téléphone', 'Une barre « Contacter » reste en bas de l’écran : un hôte pressé t’écrit en quelques secondes.'],
  ],
  formulesTxt: 'Jusqu’à 3 formules avec leur prix, ton tarif horaire et tes frais de déplacement, puis les villes où tu interviens. L’hôte sait à quoi s’attendre avant de t’écrire : moins d’allers-retours, des demandes plus précises.',
  extraFeature: {
    eye: 'Devis en ligne',
    h: 'Ton devis envoyé <em>avant le prochain voyageur</em>',
    p: 'Depuis une demande reçue, tu prépares ton devis : lignes, prix, validité. L’hôte le reçoit par e-mail, l’ouvre sur une page à ton nom et l’accepte en ligne. Tu es prévenu tout de suite, et tu suis tes devis envoyés, acceptés ou refusés.',
    bullets: ['Numérotation automatique et mentions de ton statut', 'Relance en un clic si l’hôte ne répond pas', 'Version PDF pour tes archives'],
    mock: 'devis-depannage',
  },
  steps: [
    ['Crée ta fiche', 'Nom, ville, zone, spécialités, délai d’intervention et prix de départ : 2 minutes.'],
    ['Paie en ligne', '39,98 € TTC par an au tarif Fondateur, par carte via Stripe. Ta fiche est en ligne dans la foulée, sans validation à attendre.'],
    ['Complète-la', 'Ajoute tes photos, tes formules et tes villes depuis ton espace, puis partage le lien de ta fiche.'],
  ],
  faq: [
    ['Combien coûte la fiche ?', 'Les 20 premiers pros du dépannage paient 39,98 € TTC par an, un tarif bloqué à vie. Ensuite, ce sera 79,98 € TTC par an. Sans engagement : tu résilies quand tu veux depuis ton espace.'],
    ['Est-ce que vous prenez une commission sur mes interventions ?', 'Non, jamais. L’hôte te contacte directement et le devis, l’intervention et le paiement se règlent entre vous. La fiche est un abonnement fixe.'],
    ['Y a-t-il une validation de mon profil ?', 'Non. Ta fiche est en ligne quelques minutes après le paiement. Tu la complètes ensuite quand tu veux depuis ton espace.'],
    ['Je fais un peu de tout, est-ce pour moi ?', 'Oui. Coche « Multiservice et petits travaux » en plus de tes spécialités : quand un hôte demande une spécialité que personne ne couvre près de chez lui, les multiservices passent juste après les spécialistes.'],
    ['Comment les hôtes me trouvent-ils ?', `Par l’annuaire du dépannage (recherche par ville, y compris les villes que tu couvres), par la page « Dépannage à » ta ville (${VILLES_DEP} villes ont la leur), par Google, où ta fiche est indexée, et par les demandes « Décris ton besoin », envoyées aux 3 pros les plus proches qui font la spécialité demandée.`],
    ['Les demandes précisent-elles l’urgence ?', 'Oui : l’hôte indique la spécialité, sa ville et quand il a besoin de toi (en urgence, dans la semaine, dans le mois). Tu sais tout de suite si tu peux répondre.'],
    ['Comment savoir si ma fiche m’apporte des clients ?', 'L’espace « Mes statistiques » montre les visiteurs de ta fiche, les clics vers ton site, les demandes reçues, les recherches Google qui t’amènent et ta place moyenne. Un bilan arrive par e-mail le 1er de chaque mois.'],
  ],
}

const CSS = `
:root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#6B7D68;--bd:rgba(0,76,63,.10)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Outfit',sans-serif;background:var(--w);color:var(--td);padding-top:64px}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
img{max-width:100%;height:auto;display:block}
a{color:inherit}
.s-in{max-width:1180px;margin:0 auto;padding:0 clamp(16px,5vw,40px)}
.hero{background:radial-gradient(ellipse 60% 70% at 85% 10%,rgba(255,213,107,.10),transparent 70%),linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);color:#fff;padding:clamp(40px,6vw,72px) 0 clamp(48px,7vw,84px);overflow:hidden}
.hero-grid{display:grid;gap:40px;align-items:center}
.hero-grid>*{min-width:0}
@media(min-width:980px){.hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr)}}
.brd{font-size:13px;color:rgba(255,255,255,.45);margin-bottom:18px}.brd a{color:rgba(255,255,255,.65);text-decoration:none}
.eye{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,213,107,.85);margin-bottom:14px}
h1{font-family:'Fraunces',serif;font-size:clamp(30px,4.3vw,50px);font-weight:400;line-height:1.08;letter-spacing:-.6px}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.lead{font-size:16.5px;color:rgba(255,255,255,.75);line-height:1.7;margin-top:18px;max-width:560px}
.ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 22px;border-radius:11px;font-weight:600;font-size:15px;text-decoration:none;transition:transform .15s,background .15s}
.btn-y{background:var(--y);color:var(--gd)}.btn-y:hover{background:#ffe08f;transform:translateY(-1px)}
.btn-o{border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.85)}.btn-o:hover{border-color:rgba(255,255,255,.5);color:#fff}
.btn-g{background:var(--g);color:#fff}.btn-g:hover{background:#00382e}.btn-g i{color:var(--y)}
.btn-l{border:1px solid rgba(0,76,63,.2);color:var(--g)}.btn-l:hover{border-color:var(--g)}
.ticks{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:20px;font-size:14px;color:rgba(255,255,255,.82)}
.ticks span{display:inline-flex;align-items:center;gap:7px}.ticks i{color:var(--y)}
.frame{border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.12)}
.frame-bar{display:flex;align-items:center;gap:6px;padding:9px 12px;background:#EDEAE2}
.frame-bar span{width:9px;height:9px;border-radius:50%;background:rgba(0,0,0,.14)}
.frame-bar em{margin-left:10px;flex:1;font-style:normal;font-size:11.5px;color:#6B7D68;background:#fff;border-radius:6px;padding:4px 10px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cap{font-size:12.5px;color:var(--tl);margin-top:10px;line-height:1.5}
.hero .cap{color:rgba(255,255,255,.5)}
.facts{background:#fff;border-bottom:1px solid var(--bd)}
.facts-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0}
@media(min-width:860px){.facts-grid{grid-template-columns:repeat(4,1fr)}}
.fact{padding:22px 16px;text-align:center;border-right:1px solid var(--bd)}
.fact:last-child{border-right:none}
.fact b{display:block;font-family:'Fraunces',serif;font-weight:400;font-size:30px;color:var(--g);line-height:1.1}
.fact span{display:block;font-size:13px;color:var(--tm);margin-top:4px;line-height:1.4}
.sec{padding:clamp(56px,8vw,96px) 0}
.sec.cr{background:var(--cr)}
.sec-head{max-width:720px;margin:0 auto 40px;text-align:center}
.lbl{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--g);margin-bottom:12px}
h2{font-family:'Fraunces',serif;font-size:clamp(26px,3.2vw,38px);font-weight:400;line-height:1.15;letter-spacing:-.4px}
h2 em{color:var(--g);font-style:italic;font-weight:300}
.sec-head p{font-size:16px;color:var(--tm);line-height:1.7;margin-top:12px}
.row{display:grid;gap:32px;align-items:center;margin-bottom:clamp(56px,7vw,88px)}
.row:last-child{margin-bottom:0}
@media(min-width:940px){.row{grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:56px}.row.rev .row-txt{order:2}}
.row-txt p{font-size:15.5px;color:var(--tm);line-height:1.75;margin-top:12px}
.num{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;border:1px solid rgba(0,76,63,.25);color:var(--g);font-family:'Fraunces',serif;font-size:15px;margin-bottom:14px}
.ul{list-style:none;display:flex;flex-direction:column;gap:12px;margin-top:20px}
.ul li{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;color:var(--tm);line-height:1.55}
.ul li i{flex-shrink:0;width:30px;height:30px;border-radius:9px;background:rgba(0,76,63,.07);color:var(--g);display:flex;align-items:center;justify-content:center;font-size:15px;margin-top:1px}
.ul li b{color:var(--td);font-weight:600;display:block}
.chk{list-style:none;display:flex;flex-direction:column;gap:9px;margin-top:18px}
.chk li{display:flex;gap:9px;font-size:14.5px;color:var(--tm);line-height:1.5}
.chk i{color:var(--g);margin-top:3px}
.shot{border-radius:14px;overflow:hidden;border:1px solid var(--bd);box-shadow:0 22px 60px rgba(0,30,20,.12);background:#fff;position:relative}
.shot.fade::after{content:'';position:absolute;left:0;right:0;bottom:0;height:90px;background:linear-gradient(rgba(255,255,255,0),#fff)}
.more{display:inline-flex;align-items:center;gap:6px;margin-top:18px;color:var(--g);font-weight:600;font-size:14.5px;text-decoration:none}
.more:hover{text-decoration:underline;text-underline-offset:4px}
.wide{margin-top:8px}
.how{display:grid;gap:14px}
@media(min-width:820px){.how{grid-template-columns:repeat(3,1fr)}}
.how-c{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:22px}
.how-c .num{margin-bottom:12px}
.how-c h3{font-family:'Fraunces',serif;font-size:19px;font-weight:400;margin-bottom:6px}
.how-c p{font-size:14px;color:var(--tm);line-height:1.6}
.mock{background:#fff;border:1px solid var(--bd);border-radius:16px;box-shadow:0 22px 60px rgba(0,30,20,.12);overflow:hidden;font-size:13.5px}
.mock-h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;background:linear-gradient(160deg,#001a11,#00463a);color:#fff}
.mock-h b{font-family:'Fraunces',serif;font-weight:400;font-size:17px}
.mock-h small{font-size:11px;color:rgba(255,255,255,.6);display:block}
.pill{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:999px;background:rgba(255,213,107,.18);color:var(--y);white-space:nowrap}
.pill.ok{background:rgba(99,214,131,.16);color:#7AE89A}
.mock-b{padding:6px 18px 16px}
.ln{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--bd);color:var(--tm)}
.ln b{color:var(--td);font-weight:600;white-space:nowrap}
.tot{display:flex;justify-content:space-between;padding:12px 0 4px;font-weight:700;font-size:15px}
.mock-f{padding:12px 18px;background:var(--cr);font-size:12.5px;color:var(--tm);display:flex;align-items:center;gap:8px}
.mock-f i{color:var(--g)}
.day{padding:10px 0 4px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--tl)}
.slot{display:flex;gap:12px;align-items:flex-start;padding:11px 12px;border:1px solid var(--bd);border-radius:12px;margin-bottom:8px}
.slot i.ic{width:32px;height:32px;border-radius:9px;background:rgba(0,76,63,.07);color:var(--g);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px}
.slot b{display:block;color:var(--td);font-weight:600}
.slot span{display:block;color:var(--tl);font-size:12.5px;margin-top:2px}
.slot .tag{margin-left:auto;align-self:center;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;white-space:nowrap}
.tag.done{background:rgba(0,76,63,.1);color:var(--g)}
.tag.rush{background:rgba(255,213,107,.3);color:#7a5a00}
.price-wrap{display:grid;gap:22px;align-items:stretch}
@media(min-width:900px){.price-wrap{grid-template-columns:380px minmax(0,1fr)}}
.price{background:linear-gradient(160deg,#001a11,var(--gd) 55%,#00463a);color:#fff;border-radius:20px;padding:28px}
.price-eye{font-size:10.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.55)}
.price-n{font-family:'Fraunces',serif;font-size:50px;font-weight:300;line-height:1;margin:12px 0 6px}
.price-n small{font-family:'Outfit',sans-serif;font-size:15px;color:rgba(255,255,255,.6);margin-left:4px}
.price-sub{font-size:14px;color:rgba(255,255,255,.72);line-height:1.6}
.places{display:none;align-items:center;gap:7px;margin-top:14px;padding:7px 12px;border-radius:999px;background:rgba(255,213,107,.14);color:var(--y);font-size:12.5px;font-weight:600}
.price .btn{margin-top:22px;width:100%;justify-content:center}
.price-foot{margin-top:14px;font-size:12px;color:rgba(255,255,255,.5);line-height:1.5}
.incl{background:#fff;border:1px solid var(--bd);border-radius:20px;padding:28px}
.incl h3{font-family:'Fraunces',serif;font-weight:400;font-size:21px;margin-bottom:6px}
.incl-grid{display:grid;gap:10px 22px;margin-top:14px}
@media(min-width:620px){.incl-grid{grid-template-columns:1fr 1fr}}
.incl-grid div{display:flex;gap:9px;font-size:14.5px;color:var(--tm);line-height:1.5}
.incl-grid i{color:var(--g);margin-top:3px}
.faq-grid{display:grid;gap:12px;max-width:980px;margin:0 auto}
@media(min-width:760px){.faq-grid{grid-template-columns:1fr 1fr}}
.faq-item{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px 20px}
.faq-item h3{font-size:15.5px;font-weight:600;color:var(--td);margin-bottom:6px;line-height:1.4}
.faq-item p{font-size:14px;color:var(--tm);line-height:1.65}
.end{background:linear-gradient(160deg,#001a11,var(--gd) 55%,#00463a);color:#fff;border-radius:22px;padding:clamp(28px,5vw,52px);text-align:center}
.end h2{color:#fff}.end h2 em{color:var(--y)}
.end p{color:rgba(255,255,255,.72);font-size:16px;line-height:1.7;max-width:600px;margin:12px auto 0}
.end .ctas{justify-content:center}
.other{font-size:14px;color:var(--tm);text-align:center;margin-top:22px}
.other a{color:var(--g);font-weight:600}
`

const frame = (src, url, alt, w, h, eager) => `<div class="frame"><div class="frame-bar"><span></span><span></span><span></span><em>${esc(url)}</em></div><img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></div>`
const shot = (src, alt, w, h, cls = '') => `<div class="shot${cls ? ' ' + cls : ''}"><img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async"></div>`

// Taille réelle des captures (pour width/height, sans saut de mise en page)
function dims(file) {
  const b = fs.readFileSync(path.join(ROOT, 'img', 'pour-qui', file))
  // WebP VP8 / VP8L / VP8X
  const fmt = b.toString('ascii', 12, 16)
  if (fmt === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]
  if (fmt === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)] }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]
}
const img = (cfg, name) => { const f = `${cfg.k}-${name}.webp`; const [w, h] = dims(f); return { src: `/img/pour-qui/${f}`, w, h } }

function mockHtml(cfg) {
  if (cfg.extraFeature.mock === 'devis-depannage') return `<div class="mock" role="img" aria-label="Illustration d’un devis de dépannage accepté en ligne">
  <div class="mock-h"><div><small>Devis D2026-031</small><b>Fuite sous l’évier, appartement T2</b></div><span class="pill ok"><i class="ph-bold ph-check"></i>Accepté en ligne</span></div>
  <div class="mock-b">
    <div class="ln"><span>Déplacement</span><b>30 €</b></div>
    <div class="ln"><span>Remplacement du siphon et des joints, 1 h</span><b>45 €</b></div>
    <div class="ln"><span>Fournitures</span><b>18 €</b></div>
    <div class="tot"><span>Total TTC</span><span>93 €</span></div>
  </div>
  <div class="mock-f"><i class="ph-bold ph-signature"></i>Accepté par Julie M. avant l’arrivée de ses voyageurs · Illustration</div>
</div>`
  if (cfg.extraFeature.mock === 'devis') return `<div class="mock" role="img" aria-label="Illustration d’un devis accepté en ligne">
  <div class="mock-h"><div><small>Devis D2026-014</small><b>Séance photo, appartement T3</b></div><span class="pill ok"><i class="ph-bold ph-check"></i>Accepté en ligne</span></div>
  <div class="mock-b">
    <div class="ln"><span>Séance intérieurs, 35 photos retouchées</span><b>480 €</b></div>
    <div class="ln"><span>Carré 1:1 pour la photo de couverture Airbnb</span><b>inclus</b></div>
    <div class="ln"><span>Vidéo courte pour Instagram</span><b>40 €</b></div>
    <div class="tot"><span>Total TTC</span><span>520 €</span></div>
  </div>
  <div class="mock-f"><i class="ph-bold ph-signature"></i>Accepté par Julie M. le 14 octobre · Illustration</div>
</div>`
  return `<div class="mock" role="img" aria-label="Illustration du planning des ménages d’une équipe">
  <div class="mock-h"><div><small>Mes ménages</small><b>Tes ménages, planifiés tout seuls</b></div><span class="pill">3 clients connectés</span></div>
  <div class="mock-b">
    <div class="day">Samedi 18 octobre</div>
    <div class="slot"><i class="ph ph-broom ic"></i><div><b>Appartement Chartrons</b><span>Départ 11 h · arrivée 16 h · Airbnb</span></div><span class="tag rush">Arrivée le jour même</span></div>
    <div class="slot"><i class="ph ph-broom ic"></i><div><b>Maison Caudéran</b><span>Départ 10 h · Booking</span></div><span class="tag done">Fait · 5 photos</span></div>
    <div class="day">Dimanche 19 octobre</div>
    <div class="slot"><i class="ph ph-broom ic"></i><div><b>Studio Saint-Michel</b><span>Départ 12 h · réservation directe</span></div></div>
  </div>
  <div class="mock-f"><i class="ph-bold ph-bell"></i>L’hôte est prévenu dès que tu marques un ménage fait · Illustration</div>
</div>`
}

function page(cfg) {
  const url = `https://jasonmarinho.com/pour-qui/${cfg.dir}`
  const I = n => img(cfg, n)
  const fiche = I('fiche'), galerie = I('galerie'), formules = I('formules'), cartes = I('cartes'), ville = I('ville'), demande = I('demande'), stats = I('stats')
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: cfg.title, description: cfg.desc, url, inLanguage: 'fr-FR', isPartOf: { '@type': 'WebSite', name: 'Jason Marinho', url: 'https://jasonmarinho.com' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
      { '@type': 'ListItem', position: 2, name: 'Pour qui', item: 'https://jasonmarinho.com/pour-qui' },
      { '@type': 'ListItem', position: 3, name: cfg.crumb, item: url },
    ] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: cfg.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ]
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(cfg.title)}</title>
<meta name="description" content="${esc(cfg.desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(cfg.title)}">
<meta property="og:description" content="${esc(cfg.desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:site_name" content="Jason Marinho">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
<link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png?v=2026-06">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026-06">
<link rel="manifest" href="/manifest.json?v=2026-06">
<meta name="theme-color" content="#004C3F">
<link rel="stylesheet" href="/fonts/site-fonts.css?v=ce727d0a60">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css?v=29999e9550">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-regular-subset.css?v=868073a0d4">
<style>${CSS}</style>
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in hero-grid">
    <div>
      <div class="brd"><a href="/">Accueil</a> · <a href="/pour-qui">Pour qui</a> · <span>${esc(cfg.crumb)}</span></div>
      <span class="eye">${esc(cfg.eye)}</span>
      <h1>${cfg.h1}</h1>
      <p class="lead">${esc(cfg.lead)}</p>
      <div class="ctas">
        <a class="btn btn-y" href="${cfg.inscription}">Créer ma fiche <i class="ph-bold ph-arrow-right"></i></a>
        <a class="btn btn-o" href="${cfg.exemple}"><i class="ph-bold ph-eye"></i>Voir un exemple de fiche</a>
      </div>
      <div class="ticks">
        <span><i class="ph-bold ph-check"></i>Aucune commission</span>
        <span><i class="ph-bold ph-check"></i>En ligne en quelques minutes</span>
        <span><i class="ph-bold ph-check"></i>Résiliable à tout moment</span>
      </div>
    </div>
    <div>
      ${frame(fiche.src, `jasonmarinho.com${cfg.exemple}`, cfg.alts.fiche, fiche.w, fiche.h, true)}
      <p class="cap">La fiche d’exemple, en ligne sur le site. Les noms et les photos sont fictifs.</p>
    </div>
  </div>
</header>

<section class="facts" aria-label="L’annuaire en bref">
  <div class="s-in facts-grid">
    <div class="fact"><b>0 %</b><span>de commission sur tes ${cfg.travail}</span></div>
    <div class="fact"><b>${cfg.villes}</b><span>villes avec leur page « ${cfg.villePage} à… »</span></div>
    <div class="fact"><b>3</b><span>${cfg.metierPl} les plus proches reçoivent chaque demande d’hôte</span></div>
    <div class="fact"><b>1</b><span>bilan de tes statistiques chaque mois</span></div>
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <div class="sec-head">
      <span class="lbl">Ta fiche</span>
      <h2>Bien plus qu’une ligne dans un annuaire : <em>ton site vitrine</em></h2>
      <p>Chaque fiche est une vraie page, indexée sur Google, avec ton adresse à toi. Tu peux la mettre sur tes devis, ta signature et tes réseaux.</p>
    </div>
    <div class="row">
      <div class="row-txt">
        <span class="num">1</span>
        <h2>${cfg.t1}</h2>
        <ul class="ul">
          ${cfg.vitrine.map(([ic, t, d]) => `<li><i class="ph-bold ${ic}"></i><div><b>${esc(t)}</b>${esc(d)}</div></li>`).join('\n          ')}
        </ul>
      </div>
      <div>${shot(galerie.src, cfg.alts.galerie, galerie.w, galerie.h)}</div>
    </div>
    <div class="row rev">
      <div class="row-txt">
        <span class="num">2</span>
        <h2>${cfg.t2}</h2>
        <p>${esc(cfg.formulesTxt)}</p>
        <a class="more" href="${cfg.exemple}">Voir la fiche d’exemple en entier <i class="ph-bold ph-arrow-right"></i></a>
      </div>
      <div>${shot(formules.src, cfg.alts.formules, formules.w, formules.h)}</div>
    </div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <div class="sec-head">
      <span class="lbl">Être trouvé</span>
      <h2>Là où les hôtes <em>cherchent vraiment</em></h2>
      <p>Les hôtes ne cherchent pas « annuaire ». Ils tapent « ${cfg.recherche} » et le nom de leur ville, ou ils n’ont pas le temps de chercher. Ta fiche est présente dans les deux cas.</p>
    </div>
    <div class="row">
      <div class="row-txt">
        <span class="num">3</span>
        <h2>Dans l’annuaire, <em>par ville</em></h2>
        <p>L’annuaire des ${cfg.metierPl} se parcourt par ville : un hôte qui tape la sienne te trouve aussi quand elle fait partie des villes que tu couvres, pas seulement ta ville principale. Ta carte montre ta photo, ta zone, ${cfg.carteTrait} et ton prix de départ.</p>
        <a class="more" href="${cfg.annuaire}">Voir l’annuaire des ${cfg.metierPl} <i class="ph-bold ph-arrow-right"></i></a>
      </div>
      <div>${shot(cartes.src, cfg.alts.cartes, cartes.w, cartes.h)}<p class="cap">Illustration avec des fiches fictives.</p></div>
    </div>
    <div class="row rev">
      <div class="row-txt">
        <span class="num">4</span>
        <h2>Sur la page <em>de ta ville</em></h2>
        <p>${cfg.villes} villes ont leur page « ${cfg.villePageLcd} » : ${cfg.key === 'depannage' ? 'les pannes qui reviennent le plus, ce qui fait gagner du temps entre deux séjours, les questions à poser' : `réglementation locale, taxe de séjour, ${cfg.villeSujets}, questions à poser`}. Elles sont faites pour Google, et les ${cfg.metierPl} de la ville y sont présentés.</p>
        <a class="more" href="${cfg.villeEx}">Voir un exemple de page de ville <i class="ph-bold ph-arrow-right"></i></a>
        <a class="more" href="/chiffres#villes" style="margin-left:18px">Les pages de ville dans Google, en chiffres réels <i class="ph-bold ph-arrow-right"></i></a>
      </div>
      <div>${shot(ville.src, cfg.alts.ville, ville.w, ville.h)}</div>
    </div>
    <div class="row">
      <div class="row-txt">
        <span class="num">5</span>
        <h2>Les demandes <em>viennent à toi</em></h2>
        <p>${cfg.key === 'depannage' ? 'Un hôte pressé décrit son besoin en une minute : la spécialité, sa ville, l’urgence. Sa demande part aux 3 pros les plus proches qui font cette spécialité,' : `Un hôte pressé décrit son besoin en une minute : ville, logement, date, budget. Sa demande part aux 3 ${cfg.metierPl} les plus proches de son logement,`} avec ses coordonnées pour que tu lui répondes directement. Si personne n’a répondu sous 48 h, 3 autres prennent le relais.</p>
        <ul class="chk">
          <li><i class="ph-bold ph-check-circle"></i>Le formulaire « Contacter » de ta fiche t’envoie aussi les demandes par e-mail</li>
          <li><i class="ph-bold ph-check-circle"></i>Toutes tes demandes au même endroit, dans « Demandes reçues », avec leur suivi</li>
          <li><i class="ph-bold ph-check-circle"></i>Tes clients rangés dans « Mes clients », ton carnet à toi</li>
        </ul>
      </div>
      <div>${shot(demande.src, cfg.alts.demande, demande.w, demande.h, 'fade')}</div>
    </div>
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <div class="sec-head">
      <span class="lbl">Mes statistiques</span>
      <h2>Tu vois ce que ta fiche <em>te rapporte</em></h2>
      <p>Pas de promesse dans le vide : ton espace te montre jour par jour qui voit ta fiche, d’où viennent ces visiteurs, sur quelles recherches Google tu apparais et ce que t’envoie la page de ta ville. Un bilan arrive par e-mail le 1er de chaque mois.</p>
    </div>
    <div class="wide">${shot(stats.src, cfg.alts.stats, stats.w, stats.h)}<p class="cap" style="text-align:center">L’écran « Mes statistiques » de ton espace, avec des chiffres fictifs. Les vrais chiffres du site : <a href="/chiffres" style="color:var(--g);font-weight:600">la visibilité en chiffres</a>.</p></div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <div class="row">
      <div class="row-txt">
        <span class="lbl">${esc(cfg.extraFeature.eye)}</span>
        <h2>${cfg.extraFeature.h}</h2>
        <p>${esc(cfg.extraFeature.p)}</p>
        <ul class="chk">
          ${cfg.extraFeature.bullets.map(b => `<li><i class="ph-bold ph-check-circle"></i>${esc(b)}</li>`).join('\n          ')}
        </ul>
        ${cfg.aussi ? `<p style="margin-top:16px">${esc(cfg.aussi)}</p>` : ''}
      </div>
      <div>${mockHtml(cfg)}</div>
    </div>
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <div class="sec-head">
      <span class="lbl">Comment ça marche</span>
      <h2>En ligne <em>aujourd’hui</em></h2>
    </div>
    <div class="how">
      ${cfg.steps.map(([t, d], i) => `<div class="how-c"><span class="num">${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="sec cr" id="prix">
  <div class="s-in price-wrap">
    <div class="price">
      <div class="price-eye">Tarif Fondateur</div>
      <div class="price-n">39,98 €<small>TTC / an</small></div>
      <p class="price-sub">À vie pour les 20 premiers inscrits, appliqué tout seul. Ensuite 79,98 € TTC par an.</p>
      <div class="places" id="places"><i class="ph-bold ph-hourglass-medium"></i><span></span></div>
      <a class="btn btn-y" href="${cfg.inscription}">Créer ma fiche <i class="ph-bold ph-arrow-right"></i></a>
      <p class="price-foot">Soit moins de 3,50 € par mois. Sans engagement, sans commission. TVA non applicable, art. 293 B du CGI.</p>
    </div>
    <div class="incl">
      <h3>Tout est compris</h3>
      <p style="font-size:14.5px;color:var(--tm);line-height:1.6">Une seule formule, pas d’option payante en plus.</p>
      <div class="incl-grid">
        <div><i class="ph-bold ph-check-circle"></i>Ta fiche site vitrine, indexée sur Google</div>
        <div><i class="ph-bold ph-check-circle"></i>6 photos, 3 formules, ${cfg.key === 'depannage' ? 'tes spécialités' : 'ton déroulé'}, tes villes</div>
        <div><i class="ph-bold ph-check-circle"></i>Lien dofollow vers ton site ou ton portfolio</div>
        <div><i class="ph-bold ph-check-circle"></i>Présence sur l’annuaire et la page de ta ville</div>
        <div><i class="ph-bold ph-check-circle"></i>Les demandes d’hôtes de ta zone</div>
        <div><i class="ph-bold ph-check-circle"></i>Demandes reçues et carnet « Mes clients »</div>
        <div><i class="ph-bold ph-check-circle"></i>Mes statistiques et bilan mensuel</div>
        <div><i class="ph-bold ph-check-circle"></i>Devis en ligne${cfg.inclExtra}</div>
      </div>
    </div>
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <div class="sec-head">
      <span class="lbl">Questions fréquentes</span>
      <h2>Ce qu’on nous demande <em>souvent</em></h2>
    </div>
    <div class="faq-grid">
      ${cfg.faq.map(([q, a]) => `<div class="faq-item"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="sec" style="padding-top:0">
  <div class="s-in">
    <div class="end">
      <h2>Prêt à recevoir <em>tes premiers hôtes</em> ?</h2>
      <p>Crée ta fiche en 2 minutes, paie en ligne, et elle est visible dans la foulée. Tu la complètes ensuite à ton rythme.</p>
      <div class="ctas">
        <a class="btn btn-y" href="${cfg.inscription}">Créer ma fiche <i class="ph-bold ph-arrow-right"></i></a>
        <a class="btn btn-o" href="${cfg.devenir}">${cfg.devenirLabel ?? 'Tout sur l’annuaire'}</a>
      </div>
    </div>
    <p class="other">${[
      cfg.key !== 'photographe' && '<a href="/pour-qui/photographes">Photographes et vidéastes</a>',
      cfg.key !== 'menage' && '<a href="/pour-qui/menage">Équipes de ménage</a>',
      cfg.key !== 'depannage' && '<a href="/pour-qui/depannage">Dépannage et maintenance</a>',
    ].filter(Boolean).join(' · ')} · <a href="/pour-qui">Tous les profils</a></p>
  </div>
</section>

<script>
fetch('/api/annuaire-places').then(function (r) { return r.ok ? r.json() : null }).then(function (d) {
  var n = d && d.${cfg.placesKey}
  if (typeof n !== 'number') return
  if (n <= 0) {
    document.querySelector('.price-eye').textContent = 'Tarif annuel'
    document.querySelector('.price-n').innerHTML = '79,98 €<small>TTC / an</small>'
    document.querySelector('.price-sub').textContent = 'Les 20 places Fondateur sont prises. Tout est compris, sans commission.'
    document.querySelector('.price-foot').textContent = 'Soit moins de 6,70 € par mois. Sans engagement. TVA non applicable, art. 293 B du CGI.'
    return
  }
  var el = document.getElementById('places')
  el.querySelector('span').textContent = 'Plus que ' + n + ' place' + (n > 1 ? 's' : '') + ' à ce prix'
  el.style.display = 'inline-flex'
}).catch(function () {})
</script>
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

for (const cfg of [PHOTO, MENAGE, DEPANNAGE]) {
  if (cfg.title.length > 60) throw new Error(`Titre trop long (${cfg.title.length}) : ${cfg.title}`)
  const html = page(cfg)
  if (html.includes('—')) throw new Error('Tiret cadratin dans la page ' + cfg.key)
  fs.mkdirSync(path.join(ROOT, 'pour-qui', cfg.dir), { recursive: true })
  fs.writeFileSync(path.join(ROOT, 'pour-qui', cfg.dir, 'index.html'), html, 'utf8')
  console.log(`[pour-qui-pros] pour-qui/${cfg.dir} (${Math.round(html.length / 1024)} Ko)`)
}
