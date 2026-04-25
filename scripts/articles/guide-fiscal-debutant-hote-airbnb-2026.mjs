export default {
  slug: 'guide-fiscal-debutant-hote-airbnb-2026',
  title: 'Guide fiscal débutant 2026 : déclarer ses revenus Airbnb sans erreur',
  description: 'Tu débutes en LCD et la fiscalité te fait peur ? Voici le guide pas à pas pour déclarer tes revenus Airbnb en 2026, sans erreur ni complexité inutile.',
  keywords: 'déclarer revenus Airbnb 2026, fiscalité débutant LCD, micro-BIC première déclaration, impôts location courte durée',
  date: '2026-04-25',
  categorySlug: 'ressources',
  readTime: 6,

  lead: 'Quand tu démarres en LCD, la fiscalité est le sujet qui fait peur. Régime micro-BIC, LMNP, déclaration 2042, abattement 50 % : trop de termes pour un débutant. Voici le guide simple, pas à pas, pour déclarer tes premiers revenus Airbnb correctement en 2026.',

  sections: [
    {
      h2: '1. Identifier ton régime fiscal en 5 questions',
      content: [
        { type: 'p', text: 'Avant de déclarer, identifie ton régime. 5 questions suffisent à le définir.' },
        { type: 'ul', items: [
          'Question 1 — Tes revenus Airbnb dépassent 23 000 €/an ? Si NON → LMNP automatique. Si OUI → tu peux basculer en LMP selon le ratio',
          'Question 2 — Tes recettes Airbnb dépassent 50 % des revenus de ton foyer fiscal ? Si NON → reste en LMNP. Si OUI → potentiellement LMP',
          'Question 3 — Tu as un emprunt sur le logement ? Si OUI → régime réel BIC plus avantageux. Si NON → micro-BIC suffit',
          'Question 4 — Tu loues ta résidence principale ou un meublé dédié ? Résidence principale = plafond 120 jours/an. Meublé dédié = pas de plafond',
          'Question 5 — Tu as fait des travaux > 5 000 € dans le logement ? Si OUI → régime réel pour amortir. Si NON → micro-BIC si CA modeste',
        ]},
        { type: 'tip', text: 'Pour 80 % des hôtes débutants : LMNP au régime micro-BIC. Simple, abattement 50 %, déclaration via 2042-C-PRO. Pas besoin d\'expert-comptable la première année.' },
      ],
    },
    {
      h2: '2. Les démarches obligatoires en amont',
      content: [
        { type: 'p', text: 'Avant la déclaration, tu dois faire ces 4 démarches.' },
        { type: 'ul', items: [
          'Obtenir un SIRET (gratuit, en ligne sur formalites.entreprises.gouv.fr) — formalité, ~10 min, te donne ton numéro pro',
          'Déclarer ton activité en mairie via formulaire Cerfa 14004 (résidence principale partielle) ou Cerfa 13404 (meublé dédié)',
          'Souscrire une assurance LCD (RC pro + multirisque LCD) auprès d\'un assureur spécialisé',
          'Obtenir le numéro d\'enregistrement national LCD (obligatoire dès le 20 mai 2026)',
        ]},
      ],
    },
    {
      h2: '3. La déclaration micro-BIC : pas à pas',
      content: [
        { type: 'p', text: 'En LMNP au micro-BIC, tu fais ta déclaration via le formulaire 2042-C-PRO, en mai chaque année (revenus de l\'année précédente).' },
        { type: 'ul', items: [
          'Étape 1 : récupérer ton chiffre d\'affaires brut total (Airbnb + Booking + direct) — Airbnb te fournit l\'attestation annuelle dans ton tableau de bord',
          'Étape 2 : sur la déclaration 2042-C-PRO, dans la rubrique "Revenus d\'activité non salariée", indique ton CA brut',
          'Étape 3 : précise "Régime micro-BIC" dans la case dédiée',
          'Étape 4 : l\'administration applique automatiquement l\'abattement (50 % en 2026 pour locations classées, 30 % pour non classées)',
          'Étape 5 : le solde est ajouté à tes revenus globaux et taxé selon ton TMI (tranche marginale d\'imposition)',
          'Étape 6 : la CSG/CRDS (17,2 %) est calculée séparément sur le bénéfice',
        ]},
      ],
    },
    {
      h2: '4. Les pièges fréquents en 1ère année',
      content: [
        { type: 'p', text: 'Voici les 5 erreurs les plus fréquentes des hôtes débutants en 1ère déclaration.' },
        { type: 'ul', items: [
          'Oublier de déclarer ses revenus Airbnb : depuis 2020 (DAC 7), Airbnb transmet automatiquement à l\'administration. Tes revenus sont déjà connus du fisc, ne pas déclarer = redressement automatique',
          'Confondre CA brut et CA net : tu déclares le CA BRUT (avant commission Airbnb). Pas le montant que tu touches après commission',
          'Mélanger résidence principale et meublé dédié : si tu loues ta résidence principale, plafond 120 jours et déclaration différente du meublé dédié',
          'Ne pas tenir un livret de recettes : recommandé pour le micro-BIC, obligatoire pour le réel. Note chaque entrée d\'argent (date, voyageur, montant)',
          'Sous-estimer la CSG/CRDS : 17,2 % sur ton bénéfice imposable. C\'est 17,2 % de 50 % du CA = 8,6 % du CA. Pour un CA de 20 000 €, c\'est 1 720 € de cotisations sociales',
        ]},
        { type: 'cta', text: 'Tu veux maîtriser toute la fiscalité LCD pour démarrer sereinement ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'location-courte-duree-impots-france',              label: 'LCD et impôts en France',               categoryLabel: 'Fiscalité' },
    { slug: 'lmnp-vs-lmp-changement-2026-impact',               label: 'LMNP ou LMP en 2026',                    categoryLabel: 'Fiscalité' },
    { slug: 'declarer-activite-location-courte-duree-france-demarches', label: 'Déclarer son activité LCD',     categoryLabel: 'Réglementation' },
  ],
}
