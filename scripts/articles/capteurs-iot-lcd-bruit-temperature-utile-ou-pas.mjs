export default {
  slug: 'capteurs-iot-lcd-bruit-temperature-utile-ou-pas',
  title: 'Capteurs IoT pour LCD : bruit, température, ouverture — utile ou gadget ?',
  description: 'Détecteurs de bruit, sondes de température, capteurs d\'ouverture : l\'IoT promet de protéger ton logement. Test terrain de ce qui marche vraiment et ce qui est marketing.',
  keywords: 'capteur bruit Airbnb, IoT location courte durée, NoiseAware Minut, monitoring logement Airbnb',
  date: '2026-04-25',
  categorySlug: 'automatisation',
  readTime: 6,

  lead: 'Les capteurs IoT (Internet of Things) sont vendus comme la solution miracle aux problèmes des hôtes LCD : bruit voyageur, dégât d\'eau, fumeur en intérieur. Sur le terrain, certains sont vraiment utiles, d\'autres sont du marketing pur. Test honnête des 4 catégories de capteurs en 2026.',

  sections: [
    {
      h2: '1. Détecteurs de bruit (NoiseAware, Minut)',
      content: [
        { type: 'p', text: 'Les détecteurs de bruit mesurent le volume sonore dans ton logement (sans enregistrer audio, conformité RGPD oblige). Quand le seuil est dépassé pendant X minutes, tu reçois une notification. Tu peux alors contacter le voyageur pour rappeler le règlement.' },
        { type: 'ul', items: [
          'Utilité : très réelle pour les logements en copropriété ou centre-ville. Réduit de 60 % les plaintes voisins',
          'Coût : 100-180 € par appareil + abonnement 5-10 €/mois (souvent obligatoire pour stocker les data)',
          'Marques fiables : NoiseAware (US, leader marché), Minut (suédois, plus pro européen)',
          'Limite : ne capte que le bruit dans le logement, pas dans la cour ou le jardin',
          'Verdict : à recommander si tu as des problèmes récurrents. Inutile si zéro plainte historique',
        ]},
      ],
    },
    {
      h2: '2. Sondes de température et humidité',
      content: [
        { type: 'p', text: 'Les sondes climat (Aqara, SensorPush) te permettent de monitorer la température et l\'humidité à distance. Utile pour détecter une fenêtre laissée ouverte en hiver ou une climatisation qui consomme trop.' },
        { type: 'ul', items: [
          'Coût : 25-60 € par sonde, pas d\'abonnement',
          'Utilité réelle pour : hôtes en montagne (gel pendant absence), hôtes en zone très chaude (clim laissée allumée), gestionnaires multi-biens',
          'Inutile pour : logements urbains avec voyageurs qui rentrent peu, présence régulière de l\'hôte',
          'Verdict : vraiment utile en cas de gestion à distance ou d\'usage saisonnier. Inutile en gestion proximité',
        ]},
        { type: 'tip', text: 'Si tu as un risque de gel hivernal, une sonde Aqara à 30 € peut éviter une casse de canalisation à 3 000 €. C\'est l\'investissement IoT le plus rentable pour les gîtes ruraux.' },
      ],
    },
    {
      h2: '3. Capteurs d\'ouverture porte/fenêtre',
      content: [
        { type: 'p', text: 'Petits capteurs magnétiques qui notifient à chaque ouverture/fermeture. Permet de tracer les arrivées/départs voyageurs et détecter une intrusion. Sont souvent utilisés en complément d\'une serrure connectée.' },
        { type: 'ul', items: [
          'Coût : 15-25 € par capteur, parfois inclus dans l\'écosystème (Aqara, Nuki)',
          'Utilité : confirmation horodatée du check-in/check-out, détection d\'effraction',
          'Friction : nécessite un hub central (gateway) pour fonctionner — coût supplémentaire 30-50 €',
          'Verdict : nice-to-have si tu as déjà l\'écosystème, gadget si tu pars de zéro',
        ]},
      ],
    },
    {
      h2: '4. Détecteurs de fumée connectés',
      content: [
        { type: 'p', text: 'Détecteur de fumée connecté qui envoie une notification à ton smartphone en cas de déclenchement. Combiné à un détecteur de fumée de cigarette (modèles spécialisés FireAngel, FumeAware), tu peux détecter et facturer les voyageurs qui fument malgré le règlement.' },
        { type: 'ul', items: [
          'DAAF connecté classique : 50-80 €, peu différent d\'un DAAF normal sauf pour la notification',
          'Détecteur cigarette : 150-250 €, valable seulement si tu as un VRAI problème de fumeurs',
          'Verdict DAAF : à privilégier sur un DAAF normal si la copropriété l\'autorise. Peu de gain réel',
          'Verdict détecteur cigarette : utile uniquement en zone à risque (locations courtes weekend, cible jeune)',
        ]},
        { type: 'p', text: 'Pour la majorité des hôtes LCD, l\'investissement IoT prioritaire est : (1) serrure connectée (déjà couvert dans nos articles dédiés), (2) sonde température si gestion à distance, (3) détecteur bruit si tensions copropriété. Le reste est rarement rentable au-delà du gadget.' },
        { type: 'cta', text: 'Tu veux un setup pro pour ta LCD sans dépenser inutilement en gadgets ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'serrure-connectee-igloohome-nuki-comparatif-2026', label: 'Serrures connectées comparées',         categoryLabel: 'Automatisation' },
    { slug: 'gerer-voyageurs-difficiles-location-courte-duree', label: 'Gérer voyageurs difficiles',            categoryLabel: 'Expérience' },
    { slug: 'outils-gerer-location-courte-duree-2025',          label: 'Outils gestion LCD',                    categoryLabel: 'Automatisation' },
  ],
}
