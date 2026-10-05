// Séquences proposées (29/09/2026), installées depuis Admin → Prospection
// (« Installer les séquences proposées », idempotent par `key`). Toutes
// arrivent EN PAUSE : Jason les relit et les active lui-même.
//
// Principes : e-mails courts, en texte simple (pas d'image ni de pixel de
// suivi), une seule question par message pour obtenir une réponse (une
// réponse arrête la séquence), relances dans le même fil, dernier message
// qui ferme la porte poliment. Faits vérifiés dans le site le 29/09/2026 :
// tarif fondateur 39,98 € TTC / an à vie pour les 20 premiers, puis
// 79,98 € / an ; portfolio jusqu'à 12 photos ; guides « photographe » et
// « ménage » de 60 villes qui renvoient vers chaque annuaire ; contact direct
// sans commission. Pas de tiret cadratin, tutoiement comme le reste de la marque.

import type { Audience, Stage } from './engine'

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
const utm = (campaign: string) => `utm_source=prospection&utm_medium=email&utm_campaign=${campaign}`

export const PLAYBOOK: PlaybookSequence[] = [
  // ─── Photographes ─────────────────────────────────────────────────────────
  {
    key: 'photo_premier_contact',
    nom: 'Photographes : premier contact',
    audience: 'photographe',
    description: 'Présente l\'annuaire et pose une seule question. 4 e-mails sur 2 semaines, puis la relance de saison.',
    trigger: 'nouveau_contact',
    then_key: 'photo_relance_saison',
    steps: [
      {
        delay_days: 0,
        subject: 'Photographe pour des locations{ à ville} ?',
        body: `Bonjour {prenom},

Je m'appelle Jason Marinho. J'accompagne des hôtes Airbnb et Booking (gîtes, appartements, chambres d'hôtes) et je leur ai construit une app pour gérer leur location.

Une question revient sans arrêt : « Tu connais un bon photographe près de chez moi ? » Des photos pro, c'est souvent ce qui fait décoller une annonce.

J'ouvre donc un annuaire de photographes spécialisés en location courte durée. Les hôtes te contactent directement depuis ta fiche : pas de commission, pas d'intermédiaire, le devis et le paiement se font entre vous.

Voici à quoi ressemble une fiche : ${SITE}/annuaires/photographes/exemple-fiche?${utm('photo_premier_contact')}

Est-ce que tu fais ce type de shooting (intérieurs, logements de vacances) ?`,
      },
      {
        delay_days: 3,
        subject: 'Photographe pour des locations{ à ville} ?',
        body: `Bonjour {prenom},

Je remonte mon message avec du concret. Une fiche dans l'annuaire, c'est :

- une page à ton nom sur jasonmarinho.com, avec ton portfolio (jusqu'à 12 photos), ta zone et tes tarifs ;
- les demandes des hôtes directement chez toi, sans commission ;
- l'annuaire mis en avant sur nos guides photo de 60 villes, lus par des hôtes qui cherchent un photographe.

Les 20 premiers photographes gardent le tarif fondateur : 39,98 € par an, à vie.

Tu veux que je t'en dise plus ?`,
      },
      {
        delay_days: 4,
        subject: 'Photographe pour des locations{ à ville} ?',
        body: `{prenom}, une dernière question : je te garde une des places fondatrices ?

L'inscription prend deux minutes : ${SITE}/annuaires/photographes/inscription?${utm('photo_premier_contact')}

Si ce n'est pas pour toi, un simple « non merci » me suffit, je ne te relancerai pas.`,
      },
      {
        delay_days: 7,
        subject: 'Photographe pour des locations{ à ville} ?',
        body: `Bonjour {prenom},

Je ne veux pas encombrer ta boîte, c'est mon dernier message.

Si un jour tu veux recevoir des demandes d'hôtes{ à ville}, la porte reste ouverte : ${SITE}/annuaires/photographes?${utm('photo_premier_contact')}

Bonne continuation !`,
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
        subject: 'Des hôtes{ à ville} cherchent un photographe',
        same_thread: false,
        body: `Bonjour {prenom},

Je t'avais écrit il y a quelques mois au sujet de l'annuaire des photographes pour locations de vacances.

Je reviens vers toi une seule fois : les hôtes continuent de me demander des photographes{ à ville}, et c'est la période où beaucoup refont leurs photos.

La fiche se crée en deux minutes, contact direct et sans commission : ${SITE}/annuaires/photographes/inscription?${utm('photo_relance_saison')}

Sinon, aucun souci, tu n'auras plus de message de ma part.`,
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
        subject: 'Ta fiche photographe, en deux minutes',
        same_thread: false,
        body: `Bonjour {prenom},

Comme promis, voici le lien pour créer ta fiche : ${SITE}/annuaires/photographes/inscription?${utm('photo_interesse')}

Un conseil pour bien démarrer : prépare 6 à 12 photos d'intérieur, lumineuses et variées (séjour, chambre, cuisine, salle de bain). C'est ce que les hôtes regardent en premier.

Une question avant de te lancer ? Réponds simplement à ce message.`,
      },
      {
        delay_days: 6,
        subject: 'Ta fiche photographe, en deux minutes',
        body: `{prenom}, ta place au tarif fondateur (39,98 € par an, à vie) t'attend toujours.

Le lien : ${SITE}/annuaires/photographes/inscription?${utm('photo_interesse')}

Si quelque chose te freine, dis-le-moi, je regarde avec toi.`,
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

- un portfolio complet : jusqu'à 12 photos, la plus belle en premier ;
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

  // ─── Équipes de ménage ────────────────────────────────────────────────────
  {
    key: 'menage_premier_contact',
    nom: 'Ménage : premier contact',
    audience: 'menage',
    description: 'Présente l\'annuaire et le planning partagé. 4 e-mails sur 2 semaines, puis la relance de saison.',
    trigger: 'nouveau_contact',
    then_key: 'menage_relance_saison',
    steps: [
      {
        delay_days: 0,
        subject: 'Ménages de locations Airbnb{ à ville}',
        body: `Bonjour {prenom},

Je m'appelle Jason Marinho. J'accompagne des hôtes Airbnb et Booking et je leur ai construit une app pour gérer leur location.

Leur casse-tête numéro un, c'est le ménage entre deux voyageurs : trouver une équipe fiable, puis la prévenir à chaque nouvelle réservation.

J'ai prévu deux choses pour les équipes de ménage :

- un annuaire spécialisé location courte durée, où les hôtes te contactent directement, sans commission ;
- un planning partagé : tes clients hôtes t'envoient un lien et tu vois tous leurs ménages, calculés tout seuls à partir de leurs réservations Airbnb et Booking. Tu marques le ménage fait, photos à l'appui.

Est-ce que tu fais déjà des ménages de locations de vacances ?`,
      },
      {
        delay_days: 3,
        subject: 'Ménages de locations Airbnb{ à ville}',
        body: `Bonjour {prenom},

Je remonte mon message avec du concret. Une fiche dans l'annuaire, c'est :

- une page à ton nom sur jasonmarinho.com : prestations, zone, tarifs, langues parlées ;
- les demandes des hôtes directement chez toi, sans commission ;
- l'annuaire mis en avant sur nos guides ménage de 60 villes.

Exemple de fiche : ${SITE}/annuaires/menage/exemple-fiche?${utm('menage_premier_contact')}

Les 20 premières équipes gardent le tarif fondateur : 39,98 € par an, à vie.

Tu veux que je t'en dise plus ?`,
      },
      {
        delay_days: 4,
        subject: 'Ménages de locations Airbnb{ à ville}',
        body: `{prenom}, une dernière question : je te garde une des places fondatrices ?

L'inscription prend deux minutes : ${SITE}/annuaires/menage/inscription?${utm('menage_premier_contact')}

Si ce n'est pas pour toi, un simple « non merci » me suffit, je ne te relancerai pas.`,
      },
      {
        delay_days: 7,
        subject: 'Ménages de locations Airbnb{ à ville}',
        body: `Bonjour {prenom},

C'est mon dernier message, promis.

Si un jour tu veux des clients hôtes{ à ville}, la porte reste ouverte : ${SITE}/annuaires/menage?${utm('menage_premier_contact')}

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
        subject: 'Des hôtes{ à ville} cherchent une équipe de ménage',
        same_thread: false,
        body: `Bonjour {prenom},

Je t'avais écrit il y a quelques mois au sujet de l'annuaire des équipes de ménage pour locations de vacances.

Je reviens vers toi une seule fois : les hôtes continuent de me demander des équipes fiables{ à ville}.

La fiche se crée en deux minutes, contact direct et sans commission : ${SITE}/annuaires/menage/inscription?${utm('menage_relance_saison')}

Sinon, aucun souci, tu n'auras plus de message de ma part.`,
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
        subject: 'Ta fiche équipe de ménage, en deux minutes',
        same_thread: false,
        body: `Bonjour {prenom},

Comme promis, voici le lien pour créer ta fiche : ${SITE}/annuaires/menage/inscription?${utm('menage_interesse')}

Un conseil : coche bien toutes tes prestations (linge, réassort, état des lieux photo…) et ton délai de réservation. Les hôtes filtrent là-dessus.

Une question avant de te lancer ? Réponds simplement à ce message.`,
      },
      {
        delay_days: 6,
        subject: 'Ta fiche équipe de ménage, en deux minutes',
        body: `{prenom}, ta place au tarif fondateur (39,98 € par an, à vie) t'attend toujours.

Le lien : ${SITE}/annuaires/menage/inscription?${utm('menage_interesse')}

Si quelque chose te freine, dis-le-moi, je regarde avec toi.`,
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
        subject: 'Tous tes ménages au même endroit',
        same_thread: false,
        body: `Bonjour {prenom},

Bienvenue ! Le plus utile pour commencer : brancher tes clients hôtes sur ton planning.

1. Ton client hôte copie son lien de planning ménage (dans son app, Calendrier puis Ménage).
2. Tu le colles dans ${APP}/dashboard/ma-fiche-menage/planning
3. Ses ménages apparaissent tout seuls, jour par jour, calculés à partir de ses réservations.

Tu marques chaque ménage fait, avec des photos : l'hôte est prévenu tout de suite.`,
      },
      {
        delay_days: 7,
        subject: 'Fais connaître ta fiche',
        same_thread: false,
        body: `Bonjour {prenom},

Une astuce qui marche bien : partage le lien de ta fiche à tes clients actuels et dans ta fiche Google. Les hôtes qui te découvrent voient tout de suite que tu connais la location courte durée.

Le lien et les boutons de partage sont dans ton espace : ${APP}/dashboard/ma-fiche-menage

Tu y vois aussi combien d'hôtes ont consulté ta fiche ce mois-ci.`,
      },
    ],
  },

  // ─── Hôtes (gîtes et chambres d'hôtes, DATAtourisme) ─────────────────────
  {
    key: 'hote_premier_contact',
    nom: 'Hôtes : premier contact',
    audience: 'hote',
    description: 'Pour les gîtes et chambres d\'hôtes trouvés sur DATAtourisme. 3 e-mails sur 10 jours.',
    trigger: 'manuel',
    end_stage: 'pas_interesse',
    steps: [
      {
        delay_days: 0,
        subject: 'Ton gîte{ à ville} et les réservations en direct',
        body: `Bonjour {prenom},

Je m'appelle Jason Marinho, hôte moi aussi. J'ai construit une app pour les propriétaires de gîtes et de locations de vacances qui louent en direct et sur Airbnb ou Booking.

Elle s'occupe de ce qui prend du temps :

- le contrat de location signé en ligne, avec le paiement et la caution par carte ;
- le planning de ménage, calculé à partir de tes réservations ;
- la fiche de police des voyageurs étrangers.

On commence gratuitement. Tu veux que je t'envoie le lien ?`,
      },
      {
        delay_days: 4,
        subject: 'Ton gîte{ à ville} et les réservations en direct',
        body: `Bonjour {prenom},

Pour te donner une idée, voici comment se passe un contrat signé en ligne : ${SITE}/services/contrats?${utm('hote_premier_contact')}

Ton voyageur signe depuis son téléphone, paie le loyer sur ton propre compte (aucune commission sur la réservation) et laisse une empreinte de carte pour la caution.

Est-ce que tu loues déjà en direct, sans plateforme ?`,
      },
      {
        delay_days: 6,
        subject: 'Ton gîte{ à ville} et les réservations en direct',
        body: `Bonjour {prenom},

Dernier message de ma part. Si tu veux essayer, la formule de départ est gratuite : ${APP}/auth/register?${utm('hote_premier_contact')}

Belle saison à toi !`,
      },
    ],
  },
]
