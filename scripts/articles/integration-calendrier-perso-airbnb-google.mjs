export default {
  slug: 'integration-calendrier-perso-airbnb-google',
  title: 'Intégrer ton calendrier Airbnb dans Google Calendar perso : 5 minutes',
  description: 'Avoir tes réservations Airbnb visibles dans ton Google Calendar perso évite les conflits et te fait gagner 1h/semaine. Voici comment l\'intégrer en 5 min.',
  keywords: 'calendrier Airbnb Google, synchroniser Airbnb Calendar, iCal Google Calendar, calendrier perso hôte LCD',
  date: '2026-04-25',
  categorySlug: 'automatisation',
  readTime: 4,

  lead: 'Tes réservations Airbnb dans une app, ton agenda perso ailleurs : tu te retrouves à louper des chevauchements, à oublier des check-in, à doubler-réserver tes propres déplacements. La solution : intégrer ton calendrier Airbnb dans Google Calendar en 5 minutes.',

  sections: [
    {
      h2: '1. Pourquoi intégrer dans Google Calendar',
      content: [
        { type: 'p', text: 'Avoir tout dans un seul calendrier change la vie quand tu es hôte LCD.' },
        { type: 'ul', items: [
          'Vue 360° : tes réservations + ton emploi perso dans une seule vue',
          'Notifications : Google Calendar te notifie 24 h avant chaque check-in/check-out',
          'Partage : ton équipe ménage peut voir le calendrier en lecture seule (très utile)',
          'Mobile : Google Calendar app sur ton téléphone = consultation rapide partout',
          'Intégration : autres apps (Slack, Trello, Notion) peuvent lire Google Calendar pour automatiser',
        ]},
      ],
    },
    {
      h2: '2. Étapes d\'intégration',
      content: [
        { type: 'ul', items: [
          'Étape 1 — Sur Airbnb : Calendrier → Synchronisation calendriers → Exporter calendrier. Copier le lien iCal',
          'Étape 2 — Sur Google Calendar : Autres calendriers → "+" → À partir de l\'URL → coller le lien iCal Airbnb',
          'Étape 3 — Renommer le calendrier importé en "Airbnb [nom logement]"',
          'Étape 4 — Choisir une couleur (rouge pour Airbnb, bleu pour perso) pour distinguer visuellement',
          'Étape 5 — Vérifier 5 min plus tard que les réservations apparaissent. Mise à jour toutes les 24 h',
        ]},
        { type: 'tip', text: 'Si tu as plusieurs logements, fais ça pour chacun avec une couleur différente. Tu vois en un coup d\'œil tous tes biens dans une seule timeline.' },
      ],
    },
    {
      h2: '3. Faire pareil avec Booking.com',
      content: [
        { type: 'p', text: 'Booking permet aussi l\'export iCal. Procédure similaire.' },
        { type: 'ul', items: [
          'Sur Booking : Calendrier → Synchroniser → Synchronisation calendrier → copier le lien iCal',
          'Sur Google Calendar : ajouter un autre calendrier avec ce lien',
          'Couleur différente d\'Airbnb pour distinguer les sources',
          'Tu vois maintenant Airbnb + Booking + perso dans une seule vue',
        ]},
      ],
    },
    {
      h2: '4. Aller plus loin avec les automations',
      content: [
        { type: 'p', text: 'Une fois Google Calendar consolidé, tu peux automatiser des tâches.' },
        { type: 'ul', items: [
          'Auto-add tâche ménage : à chaque check-out, créer automatiquement une tâche dans Trello/Asana via Zapier',
          'Auto-message équipe : 24 h avant chaque check-in, envoyer un message Slack à ton équipe avec les infos voyageur',
          'Auto-rappel personnel : 2 h avant chaque check-in, notification mobile pour vérifier état du logement',
          'Auto-bloquer perso : si Google Calendar perso a un événement personnel, bloquer automatiquement ce jour sur Airbnb (via Make/Zapier)',
        ]},
        { type: 'cta', text: 'Tu veux automatiser ta gestion LCD pour gagner 5-10 h/semaine ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'gerer-lcd-automatisation',                         label: 'Automatiser sa LCD',                    categoryLabel: 'Automatisation' },
    { slug: 'make-zapier-workflow-airbnb-no-code-debutant',     label: 'Make/Zapier no-code',                   categoryLabel: 'Automatisation' },
    { slug: 'messagerie-unifiee-3-plateformes-tester',          label: 'Messagerie unifiée',                    categoryLabel: 'Automatisation' },
  ],
}
