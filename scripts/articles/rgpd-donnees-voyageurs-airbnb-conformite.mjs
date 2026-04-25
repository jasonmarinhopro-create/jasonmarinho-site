export default {
  slug: 'rgpd-donnees-voyageurs-airbnb-conformite',
  title: 'RGPD et données voyageurs : conformité hôte LCD en 2026',
  description: 'En tant qu\'hôte LCD, tu collectes des données personnelles (nom, email, fiche police). Voici tes obligations RGPD et comment t\'y conformer simplement.',
  keywords: 'RGPD Airbnb, données personnelles hôte LCD, conformité RGPD location courte durée, registre traitement',
  date: '2026-04-25',
  categorySlug: 'reglementation',
  readTime: 5,

  lead: 'Tu collectes des données voyageurs (nom, email, téléphone, pièce d\'identité pour fiche de police). Tu es donc concerné par le RGPD. La majorité des hôtes ignore cette obligation jusqu\'au contrôle CNIL. Voici comment être en règle simplement.',

  sections: [
    {
      h2: '1. Quelles données tu collectes (et où)',
      content: [
        { type: 'p', text: 'Inventorie d\'abord ce que tu collectes pour pouvoir prouver ta conformité.' },
        { type: 'ul', items: [
          'Données voyageurs (nom, email, téléphone, dates) : via Airbnb, Booking, ton site direct, fiche de police',
          'Photos d\'identité : pour fiche de police étrangers (obligatoire)',
          'Données de paiement : via SwikLy, Stripe, virements (mais tu ne stockes PAS toi-même les CB)',
          'Avis voyageurs : nom + commentaires sur tes plateformes',
          'Communication : SMS, emails, WhatsApp avec voyageurs',
          'Tracking site (si tu en as un) : Google Analytics, cookies, etc.',
        ]},
      ],
    },
    {
      h2: '2. Tes 4 obligations RGPD',
      content: [
        { type: 'p', text: 'Le RGPD impose 4 grandes obligations pour les responsables de traitement (ce que tu es).' },
        { type: 'ul', items: [
          'Information : informer les voyageurs sur ce que tu collectes et pourquoi (politique de confidentialité)',
          'Sécurité : sécuriser les données (mot de passe, sauvegarde, pas de stockage sur clé USB perdue)',
          'Conservation limitée : ne pas garder les données plus longtemps que nécessaire (fiche police 6 mois, comptabilité 10 ans, marketing 3 ans)',
          'Droits voyageurs : permettre aux voyageurs d\'accéder, modifier, supprimer leurs données sur demande',
        ]},
      ],
    },
    {
      h2: '3. La conformité en 4 étapes',
      content: [
        { type: 'p', text: 'Voici comment se mettre en règle en 2-3 heures.' },
        { type: 'ul', items: [
          'Étape 1 : Tenir un registre de traitement (template gratuit sur cnil.fr) — liste des données collectées + finalité + durée',
          'Étape 2 : Rédiger une politique de confidentialité simple à publier sur ton site direct + dans ton livret d\'accueil',
          'Étape 3 : Sécuriser le stockage (password manager, sauvegarde cloud, accès limité)',
          'Étape 4 : Préparer une procédure pour répondre aux demandes des voyageurs (typiquement 1-2 par an)',
        ]},
        { type: 'tip', text: 'La CNIL propose un modèle gratuit de registre de traitement pour TPE-PME. Le remplir prend 30 minutes. C\'est exactement ce qu\'on demanderait en cas de contrôle.' },
      ],
    },
    {
      h2: '4. Risques en cas de non-conformité',
      content: [
        { type: 'p', text: 'Le risque RGPD est réel mais raisonnable pour les petits hôtes.' },
        { type: 'ul', items: [
          'Sanctions CNIL : amendes possibles, mais pour les TPE elles sont rares et progressives (rappel à l\'ordre, mise en demeure, puis amende)',
          'Plainte voyageur : un voyageur qui te demande l\'accès à ses données et tu ne réponds pas peut porter plainte. Risque amende 1 000-10 000 € selon le cas',
          'Atteinte aux données (vol, fuite) : obligation de notifier la CNIL dans les 72 h. Sanctions possibles si pas de mesures de sécurité prises',
          'En réalité, en étant raisonnablement conforme (registre + politique + sécurité basique), le risque est minime',
        ]},
        { type: 'cta', text: 'Tu veux toutes les obligations légales LCD résumées et applicables ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'formulaire-fiche-police-lcd-obligatoire',          label: 'Fiche de police LCD',                    categoryLabel: 'Ressources' },
    { slug: 'reglementation-lcd-france-2026',                   label: 'Réglementation LCD 2026',               categoryLabel: 'Réglementation' },
    { slug: 'declarer-activite-location-courte-duree-france-demarches', label: 'Déclarer son activité LCD',     categoryLabel: 'Réglementation' },
  ],
}
