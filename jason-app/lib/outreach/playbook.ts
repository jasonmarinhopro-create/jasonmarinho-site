// Séquences proposées, installées depuis Admin → Prospection (« Installer les
// séquences proposées », idempotent par `key`) et resynchronisées en base par
// `syncPlaybookSequences` (op `sync_playbook` de /api/outreach/ops).
//
// Réécrites le 20/11/2026 (Jason : « revoir tous les mails pour que les gens
// répondent », données des 30 jours : photographes ~6 % de réponses, hôtellerie
// 13 %, dépannage 8 %, ménage 0 sur 159 et 9 désinscriptions). Principes,
// détaillés dans docs/claude/prospection.md :
// - 3 e-mails au plus par premier contact (J0, J+3, J+8) : au-delà, les
//   désinscriptions montent et chaque contact coûte 4 envois du plafond ;
// - la première ligne parle du destinataire (c'est l'aperçu dans la boîte),
//   jamais « Je m'appelle Jason Marinho » ;
// - une raison donnée (« je te pose la question parce que… ») et un manque
//   réel (« très peu de pros à leur recommander ») ;
// - une seule petite question qui se répond par oui ou non, jamais un appel
//   ni un paiement dans le premier e-mail ; pas de lien dans le premier
//   e-mail (délivrabilité, et la réponse devient le seul moyen d'en savoir plus) ;
// - chaque relance apporte une chose nouvelle (une preuve, le prix sans
//   commission, le téléphone de Jason), la dernière ferme la porte et
//   demande un simple « oui » ;
// - ménage au vouvoiement (test validé par Jason : la moitié des adresses sont
//   des boîtes d'entreprise, contact@ / info@), tutoiement pour les autres.
// Faits vérifiés dans le site le 20/11/2026 : fiche = site vitrine sur Google,
// présente sur la page de sa ville, contact direct sans commission ; tarif
// 39,98 € TTC / an pour les 20 premiers de chaque métier ; « une dizaine de
// pros » ont déjà payé leur fiche (Jason, 20/11/2026) ; demandes d'hôtes
// envoyées aux 3 pros les plus proches. Pas de tiret cadratin ni d'emoji.
// Jamais « des hôtes de <ville> te cherchent » : il y a peu de demandes par
// ville, la phrase serait fausse.

import type { Audience, Stage } from './engine'
import { VILLES_TOTAL } from '@/lib/constants/auto-counts'

export interface PlaybookStep { delay_days: number; subject: string; body: string; same_thread?: boolean }
export interface PlaybookSequence {
  key: string
  nom: string
  audience: Audience
  description: string
  trigger: 'manuel' | 'nouveau_contact' | 'etape'
  trigger_stage?: Stage
  stop_on_reply?: boolean
  repeat_after_days?: number
  max_repeats?: number
  then_key?: string
  end_stage?: Stage
  steps: PlaybookStep[]
}

const SITE = 'https://jasonmarinho.com'
const APP = 'https://app.jasonmarinho.com'
/** Téléphone de Jason, aussi dans la signature (Réglages) */
export const OUTREACH_PHONE = '06 30 21 25 92'
const utm = (campaign: string) => `utm_source=prospection&utm_medium=email&utm_campaign=${campaign}`

export const PLAYBOOK: PlaybookSequence[] = [
  // ─── Photographes ─────────────────────────────────────────────────────────
  {
    // Hôtellerie (24/10/2026, Jason : « être présent sur les requêtes photographe hôtel, conciergerie haut de gamme »).
    // Déclencheur manuel : rien ne part tant que Jason n'ajoute pas lui-même des contacts à cette séquence.
    key: 'photo_hotellerie',
    nom: 'Photographes : hôtellerie et conciergeries',
    audience: 'photographe',
    description: 'Pour les photographes qui travaillent déjà pour des hôtels : la page hôtels et la case « Hôtels et résidences ». 3 e-mails, lancés à la main.',
    trigger: 'manuel',
    steps: [
      {
        delay_days: 0,
        subject: 'Photographe d’hôtel{ à ville} ?',
        body: `Bonjour {prenom},

Est-ce que tu travailles aussi pour des hôtels, des résidences ou des conciergeries haut de gamme, en photo ou en vidéo ?

Je te pose la question parce que ces établissements peuvent maintenant décrire leur besoin sur jasonmarinho.com, et la demande part aux photographes et vidéastes de leur zone, en priorité à ceux qui connaissent déjà l'hôtellerie. J'en ai encore très peu{ à ville}.

Tu veux que je t'explique comment recevoir ces demandes ?`,
      },
      {
        delay_days: 3,
        subject: 'Photographe d’hôtel{ à ville} ?',
        body: `{prenom}, pour que ce soit concret, voici la page que voient les hôtels : ${SITE}/photographe-hotel?${utm('photo_hotellerie')}

Le devis et le paiement se règlent entre toi et l'établissement : aucune commission, seulement un abonnement à 39,98 € par an pour les 20 premiers. Une dizaine de pros ont déjà leur fiche.

Je t'envoie le lien pour créer la tienne ? Si c'est plus simple, appelle-moi au ${OUTREACH_PHONE}.`,
      },
      {
        delay_days: 5,
        subject: 'Photographe d’hôtel{ à ville} ?',
        body: `Bonjour {prenom},

Je ne veux pas encombrer ta boîte, c'est mon dernier message.

Si un jour tu veux recevoir les demandes des hôtels{ de ville}, réponds simplement « oui » et je t'envoie tout.

Bonne continuation !`,
      },
    ],
  },
  {
    key: 'photo_premier_contact',
    nom: 'Photographes : premier contact',
    audience: 'photographe',
    description: 'Une question sur son activité, puis une preuve, puis un dernier message. 3 e-mails sur 8 jours, puis la relance de saison.',
    trigger: 'nouveau_contact',
    then_key: 'photo_relance_saison',
    steps: [
      {
        delay_days: 0,
        subject: 'Photographe ou vidéaste pour des locations{ à ville} ?',
        body: `Bonjour {prenom},

Est-ce que tu photographies ou filmes des locations de vacances : appartements Airbnb, gîtes, chambres d'hôtes ?

Je te pose la question parce que j'accompagne des hôtes Airbnb et Booking, et quand ils veulent refaire leurs photos, c'est souvent à moi qu'ils demandent qui appeler. J'ai encore très peu de photographes à leur recommander{ à ville}.

Si c'est ton métier, je te montre comment ils pourraient te trouver. Ça t'intéresse ?`,
      },
      {
        delay_days: 3,
        subject: 'Photographe ou vidéaste pour des locations{ à ville} ?',
        body: `{prenom}, pour que ce soit concret, voici ce que voit un hôte qui cherche un photographe : ${SITE}/annuaires/photographes/exemple-fiche?${utm('photo_premier_contact')}

Ta fiche te sert de site vitrine sur Google, avec ton portfolio et ta vidéo, et apparaît sur la page de ta ville. Les hôtes te contactent en direct : aucune commission, seulement un abonnement à 39,98 € par an pour les 20 premiers. Une dizaine de pros ont déjà leur fiche.

Je t'envoie le lien pour créer la tienne ? Si c'est plus simple, appelle-moi au ${OUTREACH_PHONE}.`,
      },
      {
        delay_days: 5,
        subject: 'Photographe ou vidéaste pour des locations{ à ville} ?',
        body: `Bonjour {prenom},

Je ne veux pas encombrer ta boîte, c'est mon dernier message.

Si un jour tu veux recevoir les demandes des hôtes{ de ville}, réponds simplement « oui » et je t'envoie tout.

Bonne continuation, et belles séances !`,
      },
    ],
  },
  {
    key: 'photo_relance_saison',
    nom: 'Photographes : relance de saison',
    audience: 'photographe',
    description: 'Un seul message, 3 mois après le premier contact resté sans réponse.',
    trigger: 'manuel',
    end_stage: 'pas_interesse',
    steps: [
      {
        delay_days: 90,
        subject: 'Photos et vidéos de locations{ à ville}',
        same_thread: false,
        body: `Bonjour {prenom},

Je t'avais écrit il y a quelques mois au sujet des photographes et vidéastes pour locations de vacances. Je reviens vers toi une seule fois.

Avant la saison, beaucoup d'hôtes refont leurs photos, et j'ai toujours peu de photographes à leur recommander{ à ville}.

Je t'envoie le lien pour créer ta fiche ? Sinon, aucun souci : tu n'auras plus de message de ma part.`,
      },
    ],
  },
  {
    key: 'photo_interesse',
    nom: 'Photographes : de l\'intérêt à la fiche',
    audience: 'photographe',
    description: 'Démarre quand tu passes un contact en « Intéressé » après lui avoir répondu. Boucle une fois après 30 jours.',
    trigger: 'etape',
    trigger_stage: 'interesse',
    repeat_after_days: 30,
    max_repeats: 1,
    steps: [
      {
        delay_days: 2,
        subject: 'Ta fiche photographe ou vidéaste, en deux minutes',
        same_thread: false,
        body: `Bonjour {prenom},

Comme promis, voici le lien pour créer ta fiche : ${SITE}/annuaires/photographes/inscription?${utm('photo_interesse')}

Un conseil pour bien démarrer : mets en avant sur ton portfolio 6 à 12 photos d'intérieur, lumineuses et variées (séjour, chambre, cuisine, salle de bain). C'est ce que les hôtes regardent en premier. Tu fais aussi de la vidéo ? Ajoute son lien (YouTube ou Vimeo) : elle s'affiche en tête de ta fiche.

Une question avant de te lancer ? Réponds simplement à ce message.`,
      },
      {
        delay_days: 6,
        subject: 'Ta fiche photographe ou vidéaste, en deux minutes',
        body: `{prenom}, le tarif de 39,98 € par an est réservé aux 20 premiers, et il en reste.

Le lien : ${SITE}/annuaires/photographes/inscription?${utm('photo_interesse')}

Si quelque chose te freine, dis-le-moi ou appelle-moi au ${OUTREACH_PHONE}, je regarde avec toi.`,
      },
    ],
  },
  {
    key: 'photo_premiers_pas',
    nom: 'Photographes : premiers pas (clients)',
    audience: 'photographe',
    description: 'Démarre quand un photographe devient client : l\'aider à recevoir ses premières demandes.',
    trigger: 'etape',
    trigger_stage: 'client',
    steps: [
      {
        delay_days: 3,
        subject: '3 réglages pour tes premières demandes',
        same_thread: false,
        body: `Bonjour {prenom},

Bienvenue dans l'annuaire ! Trois réglages font la différence pour recevoir des demandes :

- un lien vers ton portfolio, tes plus belles photos de logements en premier, et ta vidéo si tu en fais (elle s'affiche en tête de fiche) ;
- ta zone couverte, pour apparaître aux hôtes des villes autour de toi ;
- une fourchette de prix, les hôtes contactent plus facilement quand ils ont un repère.

Tout se règle ici : ${APP}/dashboard/ma-fiche-photographe

Tu as une question ? Réponds à ce message.`,
      },
      {
        delay_days: 7,
        subject: 'Fais connaître ta fiche',
        same_thread: false,
        body: `Bonjour {prenom},

Une astuce qui marche bien : partage le lien de ta fiche en bio Instagram et dans ta fiche Google. Les hôtes qui te découvrent ailleurs voient tout de suite que tu connais la location courte durée.

Le lien et les boutons de partage sont dans ton espace : ${APP}/dashboard/ma-fiche-photographe

Tu y vois aussi combien d'hôtes ont consulté ta fiche ce mois-ci.`,
      },
    ],
  },

  // ─── Équipes de ménage (vouvoiement, test du 20/11/2026) ──────────────────
  {
    key: 'menage_premier_contact',
    nom: 'Ménage : premier contact',
    audience: 'menage',
    description: 'Une question sur leur activité, puis une preuve, puis un dernier message, au vouvoiement. 3 e-mails sur 8 jours, puis la relance de saison.',
    trigger: 'nouveau_contact',
    then_key: 'menage_relance_saison',
    steps: [
      {
        delay_days: 0,
        subject: 'Ménage entre deux voyageurs{ à ville} ?',
        body: `Bonjour {prenom},

Faites-vous le ménage de locations Airbnb ou de gîtes, entre deux voyageurs ?

Je vous pose la question parce que j'accompagne des hôtes en location courte durée, et trouver une équipe de ménage fiable est leur premier casse-tête. J'en ai très peu à leur recommander{ à ville}.

Si c'est votre activité, je peux vous présenter à eux. Cela vous intéresse ?`,
      },
      {
        delay_days: 3,
        subject: 'Ménage entre deux voyageurs{ à ville} ?',
        body: `{prenom}, pour être concret, voici ce que voit un hôte qui cherche une équipe de ménage : ${SITE}/annuaires/menage/exemple-fiche?${utm('menage_premier_contact')}

Les hôtes vous contactent en direct, sans aucune commission sur vos clients. En plus, vos clients hôtes peuvent partager leur planning avec vous : leurs ménages s'affichent tout seuls, d'après leurs réservations. L'abonnement est à 39,98 € par an pour les 20 premiers, et une dizaine de pros ont déjà leur fiche.

Je vous envoie le lien pour créer la vôtre ? Si c'est plus simple, appelez-moi au ${OUTREACH_PHONE}.`,
      },
      {
        delay_days: 5,
        subject: 'Ménage entre deux voyageurs{ à ville} ?',
        body: `Bonjour {prenom},

Je ne veux pas encombrer votre boîte, c'est mon dernier message.

Si un jour vous voulez recevoir les demandes des hôtes{ de ville}, répondez simplement « oui » et je vous envoie tout.

Bonne continuation !`,
      },
    ],
  },
  {
    key: 'menage_relance_saison',
    nom: 'Ménage : relance de saison',
    audience: 'menage',
    description: 'Un seul message, 3 mois après le premier contact resté sans réponse.',
    trigger: 'manuel',
    end_stage: 'pas_interesse',
    steps: [
      {
        delay_days: 90,
        subject: 'Ménages de locations{ à ville}',
        same_thread: false,
        body: `Bonjour {prenom},

Je vous avais écrit il y a quelques mois au sujet des ménages de locations de vacances. Je reviens vers vous une seule fois.

Avant la saison, les hôtes cherchent des équipes fiables pour leurs changements de voyageurs, et j'en ai toujours peu à leur recommander{ à ville}.

Je vous envoie le lien pour créer votre fiche ? Sinon, aucun souci : vous n'aurez plus de message de ma part.`,
      },
    ],
  },
  {
    key: 'menage_interesse',
    nom: 'Ménage : de l\'intérêt à la fiche',
    audience: 'menage',
    description: 'Démarre quand tu passes un contact en « Intéressé ». Boucle une fois après 30 jours.',
    trigger: 'etape',
    trigger_stage: 'interesse',
    repeat_after_days: 30,
    max_repeats: 1,
    steps: [
      {
        delay_days: 2,
        subject: 'Votre fiche équipe de ménage, en deux minutes',
        same_thread: false,
        body: `Bonjour {prenom},

Comme promis, voici le lien pour créer votre fiche : ${SITE}/annuaires/menage/inscription?${utm('menage_interesse')}

Un conseil : cochez bien toutes vos prestations (linge, réassort, état des lieux photo…) et votre délai de réservation. Les hôtes filtrent là-dessus.

Une question avant de vous lancer ? Répondez simplement à ce message.`,
      },
      {
        delay_days: 6,
        subject: 'Votre fiche équipe de ménage, en deux minutes',
        body: `{prenom}, le tarif de 39,98 € par an est réservé aux 20 premières équipes, et il en reste.

Le lien : ${SITE}/annuaires/menage/inscription?${utm('menage_interesse')}

Si quelque chose vous freine, dites-le-moi ou appelez-moi au ${OUTREACH_PHONE}, je regarde avec vous.`,
      },
    ],
  },
  {
    key: 'menage_premiers_pas',
    nom: 'Ménage : premiers pas (clients)',
    audience: 'menage',
    description: 'Démarre quand une équipe devient cliente : brancher ses clients hôtes sur le planning.',
    trigger: 'etape',
    trigger_stage: 'client',
    steps: [
      {
        delay_days: 2,
        subject: 'Tous vos ménages au même endroit',
        same_thread: false,
        body: `Bonjour {prenom},

Bienvenue ! Le plus utile pour commencer : brancher vos clients hôtes sur votre planning.

1. Votre client hôte copie son lien de planning ménage (dans son app, Calendrier puis Ménage).
2. Vous le collez dans ${APP}/dashboard/ma-fiche-menage/planning
3. Ses ménages apparaissent tout seuls, jour par jour, calculés à partir de ses réservations.

Vous marquez chaque ménage fait, avec des photos : l'hôte est prévenu tout de suite.`,
      },
      {
        delay_days: 7,
        subject: 'Faites connaître votre fiche',
        same_thread: false,
        body: `Bonjour {prenom},

Une astuce qui marche bien : partagez le lien de votre fiche à vos clients actuels et dans votre fiche Google. Les hôtes qui vous découvrent voient tout de suite que vous connaissez la location courte durée.

Le lien et les boutons de partage sont dans votre espace : ${APP}/dashboard/ma-fiche-menage

Vous y voyez aussi combien d'hôtes ont consulté votre fiche ce mois-ci.`,
      },
    ],
  },

  // ─── Dépannage et maintenance (31/10/2026) ────────────────────────────────
  // Lancement donné le 01/11/2026 (« lance la prospection dépannage »),
  // réécrit le 20/11/2026 avec les mêmes principes que les autres métiers.
  {
    key: 'depannage_premier_contact',
    nom: 'Dépannage : premier contact',
    audience: 'depannage',
    description: 'Présente l\'annuaire dépannage aux plombiers, électriciens, serruriers et multiservices. 3 e-mails sur 8 jours.',
    trigger: 'nouveau_contact',
    then_key: 'depannage_relance_saison',
    steps: [
      {
        delay_days: 0,
        subject: 'Dépannages de locations Airbnb{ à ville}',
        body: `Bonjour {prenom},

Est-ce que tu interviens dans des locations de vacances : appartements Airbnb, gîtes, chambres d'hôtes ?

Je te pose la question parce que j'accompagne des hôtes, et leur grande angoisse, c'est la fuite ou la serrure bloquée la veille d'une arrivée, sans artisan à appeler. J'ai très peu de pros à leur recommander{ à ville}.

Si c'est ton métier, je te montre comment ils pourraient te trouver. Ça t'intéresse ?`,
      },
      {
        delay_days: 3,
        subject: 'Dépannages de locations Airbnb{ à ville}',
        body: `{prenom}, pour que ce soit concret, voici ce que voit un hôte qui cherche un dépanneur : ${SITE}/annuaires/depannage/exemple-fiche?${utm('depannage_premier_contact')}

Quand un hôte décrit sa panne, la demande part aux 3 pros les plus proches qui font cette spécialité. Il te contacte en direct : aucune commission, seulement un abonnement à 39,98 € par an pour les 20 premiers. Une dizaine de pros ont déjà leur fiche.

Je t'envoie le lien pour créer la tienne ? Si c'est plus simple, appelle-moi au ${OUTREACH_PHONE}.`,
      },
      {
        delay_days: 5,
        subject: 'Dépannages de locations Airbnb{ à ville}',
        body: `Bonjour {prenom},

Je ne veux pas encombrer ta boîte, c'est mon dernier message.

Si un jour tu veux recevoir les demandes des hôtes{ de ville}, réponds simplement « oui » et je t'envoie tout.

Bonne continuation !`,
      },
    ],
  },
  {
    key: 'depannage_relance_saison',
    nom: 'Dépannage : relance de saison',
    audience: 'depannage',
    description: 'Un seul message, 3 mois après le premier contact resté sans réponse.',
    trigger: 'manuel',
    end_stage: 'pas_interesse',
    steps: [
      {
        delay_days: 90,
        subject: 'Dépannages de locations{ à ville}',
        same_thread: false,
        body: `Bonjour {prenom},

Je t'avais écrit il y a quelques mois au sujet des dépannages en location de vacances. Je reviens vers toi une seule fois.

Avant la saison, les hôtes cherchent des artisans fiables à appeler en cas de pépin, et j'en ai toujours peu à leur recommander{ à ville}.

Je t'envoie le lien pour créer ta fiche ? Sinon, aucun souci : tu n'auras plus de message de ma part.`,
      },
    ],
  },
  {
    key: 'depannage_interesse',
    nom: 'Dépannage : de l\'intérêt à la fiche',
    audience: 'depannage',
    description: 'Démarre quand tu passes un contact du dépannage en « Intéressé ». Boucle une fois après 30 jours.',
    trigger: 'etape',
    trigger_stage: 'interesse',
    repeat_after_days: 30,
    max_repeats: 1,
    steps: [
      {
        delay_days: 2,
        subject: 'Ta fiche dépannage, en deux minutes',
        same_thread: false,
        body: `Bonjour {prenom},

Comme promis, voici le lien pour créer ta fiche : ${SITE}/annuaires/depannage/inscription?${utm('depannage_interesse')}

Un conseil : coche bien tes spécialités, ton délai d'intervention et tes disponibilités (soir, week-end, urgence). Les demandes des hôtes partent d'abord aux pros qui font la spécialité demandée.

Une question avant de te lancer ? Réponds simplement à ce message.`,
      },
      {
        delay_days: 6,
        subject: 'Ta fiche dépannage, en deux minutes',
        body: `{prenom}, le tarif de 39,98 € par an est réservé aux 20 premiers, et il en reste.

Le lien : ${SITE}/annuaires/depannage/inscription?${utm('depannage_interesse')}

Si quelque chose te freine, dis-le-moi ou appelle-moi au ${OUTREACH_PHONE}, je regarde avec toi.`,
      },
    ],
  },

  // ─── Hôtes (gîtes et chambres d'hôtes, DATAtourisme) ─────────────────────
  // En pause tant que Jason ne la lance pas. Les contrats en ligne sont dans
  // l'offre Standard : ne jamais écrire qu'ils sont gratuits.
  {
    key: 'hote_premier_contact',
    nom: 'Hôtes : premier contact',
    audience: 'hote',
    description: 'Pour les gîtes et chambres d\'hôtes trouvés sur DATAtourisme. 3 e-mails sur 8 jours.',
    trigger: 'manuel',
    end_stage: 'pas_interesse',
    steps: [
      {
        delay_days: 0,
        subject: 'Ton gîte{ à ville} et les réservations en direct',
        body: `Bonjour {prenom},

Est-ce que tu loues aussi ton gîte en direct, sans passer par Airbnb ou Booking ?

Je te pose la question parce que je suis hôte moi aussi, et j'ai construit une app pour ce qui prend le plus de temps quand on loue en direct : le contrat signé en ligne, le paiement et la caution par carte, le planning de ménage et la fiche de police des voyageurs étrangers.

Tu veux que je t'envoie le lien ?`,
      },
      {
        delay_days: 3,
        subject: 'Ton gîte{ à ville} et les réservations en direct',
        body: `{prenom}, pour que ce soit concret, voici comment se passe un contrat signé en ligne : ${SITE}/services/contrats?${utm('hote_premier_contact')}

Ton voyageur signe depuis son téléphone, paie le loyer sur ton propre compte (aucune commission sur la réservation) et laisse une empreinte de carte pour la caution.

Je t'envoie le lien pour essayer ? Si c'est plus simple, appelle-moi au ${OUTREACH_PHONE}.`,
      },
      {
        delay_days: 5,
        subject: 'Ton gîte{ à ville} et les réservations en direct',
        body: `Bonjour {prenom},

Dernier message de ma part. Si tu veux essayer, tu peux commencer gratuitement, sans carte bancaire : ${APP}/auth/register?${utm('hote_premier_contact')}

Belle saison à toi !`,
      },
    ],
  },
]

/**
 * Corrections à appliquer aussi aux séquences déjà installées en base
 * (op `fix_texts` de /api/outreach/ops). 05/10/2026 : la galerie de 12 photos
 * hébergée a été retirée, les e-mails ne doivent plus la promettre.
 */
export const PLAYBOOK_TEXT_FIXES: Array<[string, string]> = [
  ["avec ton portfolio (jusqu'à 12 photos), ta zone et tes tarifs", "avec le lien vers ton portfolio, ta zone et tes tarifs"],
  ["Un conseil pour bien démarrer : prépare 6 à 12 photos d'intérieur, lumineuses et variées", "Un conseil pour bien démarrer : mets en avant sur ton portfolio 6 à 12 photos d'intérieur, lumineuses et variées"],
  ["- un portfolio complet : jusqu'à 12 photos, la plus belle en premier ;", "- un lien vers ton portfolio, tes plus belles photos de logements en premier ;"],
  // 17/10/2026 : photographes ET vidéastes
  ["J'ouvre donc un annuaire de photographes spécialisés en location courte durée.", "J'ouvre donc un annuaire de photographes et vidéastes spécialisés en location courte durée."],
  ["Est-ce que tu fais ce type de shooting (intérieurs, logements de vacances) ?", "Est-ce que tu fais ce type de shooting, en photo ou en vidéo (intérieurs, logements de vacances) ?"],
  ["- une page à ton nom sur jasonmarinho.com, avec le lien vers ton portfolio, ta zone et tes tarifs ;", "- une page à ton nom sur jasonmarinho.com, avec le lien vers ton portfolio, ta vidéo en tête de fiche, ta zone et tes tarifs ;"],
  // 17/10/2026 (suite) : vidéastes dans tous les e-mails des photographes
  ["Photographe pour des locations{ à ville} ?", "Photographe ou vidéaste pour des locations{ à ville} ?"],
  ["« Tu connais un bon photographe près de chez moi ? » Des photos pro, c'est souvent ce qui fait décoller une annonce.", "« Tu connais un bon photographe près de chez moi ? » Des photos pro, et de plus en plus une vidéo, c'est souvent ce qui fait décoller une annonce."],
  ["lus par des hôtes qui cherchent un photographe.", "lus par des hôtes qui cherchent un photographe ou un vidéaste."],
  ["Les 20 premiers photographes gardent le tarif fondateur", "Les 20 premiers photographes et vidéastes gardent le tarif fondateur"],
  ["Des hôtes{ à ville} cherchent un photographe", "Photographe ou vidéaste{ à ville} : des hôtes te cherchent"],
  ["au sujet de l'annuaire des photographes pour locations de vacances.", "au sujet de l'annuaire des photographes et vidéastes pour locations de vacances."],
  ["les hôtes continuent de me demander des photographes{ à ville}, et c'est la période où beaucoup refont leurs photos.", "les hôtes continuent de me demander des photographes et des vidéastes{ à ville}, et c'est la période où beaucoup refont leurs photos et leur vidéo."],
  ["Ta fiche photographe, en deux minutes", "Ta fiche photographe ou vidéaste, en deux minutes"],
  ["C'est ce que les hôtes regardent en premier.\n\nUne question avant de te lancer", "C'est ce que les hôtes regardent en premier. Tu fais aussi de la vidéo ? Ajoute son lien (YouTube ou Vimeo) : elle s'affiche en tête de ta fiche.\n\nUne question avant de te lancer"],
  ["- un lien vers ton portfolio, tes plus belles photos de logements en premier ;", "- un lien vers ton portfolio, tes plus belles photos de logements en premier, et ta vidéo si tu en fais (elle s'affiche en tête de fiche) ;"],
]

/**
 * Nombre de villes écrit dans les e-mails (19/10/2026, Jason : « mets aussi à
 * jour les séquences déjà installées ») : remplacé par VILLES_TOTAL, compté
 * au build. Motifs précis, rejouables, quel que soit l'ancien nombre.
 */
const CITY_COUNT_PATTERNS = [
  /(guides (?:photo |ménage )?de )(?:plus de )?\d{2,3}( villes)/g,
  /(guides (?:locaux )?pour )\d{2,3}( villes)/g,
]

/** Toutes les corrections d'un objet ou d'un texte d'e-mail déjà enregistré. */
export function applyPlaybookFixes(text: string, villes = VILLES_TOTAL): string {
  let t = PLAYBOOK_TEXT_FIXES.reduce((acc, [a, b]) => acc.split(a).join(b), text)
  if (villes > 0) for (const re of CITY_COUNT_PATTERNS) t = t.replace(re, (_m, a, b) => `${a}${villes}${b}`)
  return t
}

/** Applique les corrections aux séquences en base ; nombre d'e-mails modifiés. */
export async function fixInstalledTexts(db: {
  from: (t: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}): Promise<{ lus: number; corriges: number }> {
  const { data: steps } = await db.from('outreach_steps').select('id, subject, body')
  let corriges = 0
  for (const st of (steps ?? []) as Array<{ id: string; subject: string | null; body: string | null }>) {
    const subject = applyPlaybookFixes(String(st.subject ?? '')), body = applyPlaybookFixes(String(st.body ?? ''))
    if (subject !== (st.subject ?? '') || body !== (st.body ?? '')) {
      const { error } = await db.from('outreach_steps').update({ subject, body }).eq('id', st.id)
      if (!error) corriges++
    }
  }
  return { lus: (steps ?? []).length, corriges }
}
