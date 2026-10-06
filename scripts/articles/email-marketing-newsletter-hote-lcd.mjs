export default {
  slug: 'email-marketing-newsletter-hote-lcd',
  title: 'Email marketing pour hôte LCD : newsletter qui fait revenir tes voyageurs',
  description: 'Une newsletter mensuelle bien faite génère 8-12% de retours fidèles. Voici la structure type, les outils gratuits et la conformité RGPD pour démarrer.',
  keywords: 'newsletter hôte LCD, email marketing Airbnb, fidélisation voyageurs email, Brevo MailChimp hôte',
  date: '2026-04-25',
  categorySlug: 'visibilite',
  readTime: 5,

  lead: 'Une newsletter mensuelle envoyée à tes anciens voyageurs est l\'un des leviers de fidélisation les plus rentables. Sur 100 voyageurs, 8-12 reviennent en direct s\'ils reçoivent une newsletter régulière. Voici la méthode pour démarrer en 1 heure.',

  sections: [
    {
      h2: '1. Constituer ta base email RGPD-compliant',
      content: [
        { type: 'p', text: 'Avant tout, tu dois constituer ta base email proprement. Conformité RGPD obligatoire.' },
        { type: 'ul', items: [
          'Réservations Airbnb et Booking.com : les deux plateformes interdisent d\'utiliser les coordonnées du voyageur pour du marketing (adresse masquée, risque de suspension du compte). Ces voyageurs n\'entrent pas dans ta liste',
          'Réservation directe (Driing, ton site, contrat signé en ligne) : c\'est là que se construit ta liste. Prévois une case à cocher « recevoir les disponibilités et offres », ou au minimum la possibilité de refuser dès la réservation puis dans chaque e-mail (exception « clients » de l\'article L34-5 du Code des postes et des communications électroniques, pour des séjours analogues seulement)',
          'Ne partage jamais ta liste avec un partenaire, même pour une « bonne affaire » : la CNIL l\'a déjà lourdement sanctionné chez un hôtelier',
          'Stocker dans un outil d\'e-mailing conforme au RGPD (Brevo, hébergé en Europe, MailChimp…), avec désabonnement automatique. Pas dans ton Google Sheet perso',
        ]},
      ],
    },
    {
      h2: '2. Structure de newsletter mensuelle',
      content: [
        { type: 'p', text: 'Voici la structure qui convertit le mieux, testée sur 50+ hôtes français.' },
        { type: 'ul', items: [
          'Section 1 : Petit message personnel (3-4 lignes) : "Coucou, on espère que tout va bien chez toi !". Ton chaleureux, pas vendeur',
          'Section 2 : News du quartier (2-3 actualités locales : nouveau resto, exposition, événement) : apporte de la valeur',
          'Section 3 : Calendrier dispo (si certaines dates en basse saison ne se remplissent pas) avec offre fidèle -10 %',
          'Section 4 : Photo récente du logement (saisonnière, après-petit-aménagement) avec 2-3 lignes',
          'Section 5 : CTA simple : "Réserver en direct" avec bouton',
          'Section 6 : Footer simple : ton nom, contact, lien désabonnement',
        ]},
        { type: 'tip', text: 'Évite les newsletters "promotionnelles" pure (-20 %, dernière minute). Ce sont les newsletters "valeur + nouvelles" qui convertissent le mieux car elles ne donnent pas l\'impression d\'être spammé.' },
      ],
    },
    {
      h2: '3. Outils gratuits et fréquence',
      content: [
        { type: 'ul', items: [
          'Brevo (anciennement Sendinblue, entreprise française, données hébergées en Europe) : offre gratuite à 300 e-mails par jour, contacts illimités, sans carte bancaire. C\'est l\'outil de ma propre newsletter',
          'MailChimp : offre gratuite plafonnée en contacts, interface en anglais mais très complète',
          'MailerLite : offre gratuite aussi, interface très claire',
          'Pour 0 à 200 voyageurs directs par an, une offre gratuite suffit largement : 300 e-mails par jour couvrent une newsletter mensuelle',
          'Fréquence optimale : 1 newsletter/mois. Plus, ça spam. Moins, on t\'oublie',
          'Jour optimal : mardi 10 h ou jeudi 14 h (taux d\'ouverture plus élevés)',
        ]},
      ],
    },
    {
      h2: '4. Mesurer et améliorer',
      content: [
        { type: 'p', text: 'Suis ces métriques sur 6 mois pour optimiser.' },
        { type: 'ul', items: [
          'Taux d\'ouverture : 25-35 % est très bon pour LCD. < 15 % = problème (sujet, expéditeur)',
          'Taux de clic : 5-10 % est bon. < 2 % = contenu peu pertinent',
          'Taux de désabonnement : < 0,5 % par envoi. > 2 % = trop d\'emails ou contenu non aligné',
          'Réservations directes attribuées : tracker via code promo dans la newsletter (PARTAGE10 par exemple)',
        ]},
        { type: 'cta', text: 'Tu veux développer un canal direct LCD via email + site ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'base-voyageurs-fideles-location-directe-durable',  label: 'Base voyageurs fidèles',                 categoryLabel: 'Revenus' },
    { slug: 'programme-parrainage-voyageurs-fidelisation-lcd',  label: 'Programme parrainage',                   categoryLabel: 'Visibilité' },
    { slug: 'reservation-directe-sans-commission',              label: 'Réservation directe',                   categoryLabel: 'Revenus' },
  ],
}
