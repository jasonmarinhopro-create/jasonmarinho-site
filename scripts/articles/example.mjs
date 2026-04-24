// Template de référence pour créer un nouvel article.
// Copie ce fichier, renomme-le avec le slug de l'article, remplis les champs,
// puis lance : node scripts/generate-article.mjs scripts/articles/mon-article.mjs

export default {
  // ── Identifiant ─────────────────────────────────────────────────────────────
  slug: 'mon-article-exemple',          // URL : jasonmarinho.com/blog/mon-article-exemple

  // ── SEO ──────────────────────────────────────────────────────────────────────
  title: 'Titre complet pour le H1 et la balise <title>',
  // cardTitle: 'Titre court pour la carte (optionnel)',  // si omis = title
  description: 'Meta description 150-160 caractères. Résume le bénéfice principal de l\'article pour inciter au clic depuis Google.',
  keywords: 'mot-clé principal, mot-clé secondaire, location courte durée, jason marinho',
  date: '2026-04-24',                   // YYYY-MM-DD

  // ── Catégorie ────────────────────────────────────────────────────────────────
  // revenus | visibilite | experience | ressources | automatisation | reglementation | conciergerie | fiscalite | driing
  categorySlug: 'revenus',

  // ── Contenu ──────────────────────────────────────────────────────────────────
  readTime: 7,                          // minutes (compte ~200 mots/min)

  lead: 'Paragraphe d\'accroche qui pose le problème et annonce la promesse de l\'article. Court, percutant, visible dès l\'ouverture.',

  sections: [
    {
      h2: '1. Premier sous-titre (contient idéalement un mot-clé)',
      content: [
        { type: 'p', text: 'Paragraphe explicatif. Utilise "tu" et écris de façon directe et actionnable.' },
        { type: 'ul', items: [
          'Point concret numéro 1',
          'Point concret numéro 2',
          'Point concret numéro 3',
        ]},
        { type: 'tip', text: 'Conseil pratique à retenir, une astuce ou une mise en garde importante.' },
      ],
    },
    {
      h2: '2. Deuxième sous-titre',
      content: [
        { type: 'p', text: 'Nouveau paragraphe...' },
        { type: 'p', text: 'On peut enchaîner plusieurs paragraphes.' },
      ],
    },
    {
      h2: '3. Troisième sous-titre',
      content: [
        { type: 'p', text: 'Dernier développement...' },
        { type: 'cta', text: 'Tu veux aller plus loin et appliquer tout ça concrètement ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  // ── Articles liés (3 obligatoires) ───────────────────────────────────────────
  related: [
    { slug: 'optimiser-annonce-airbnb',        label: 'Optimiser son annonce Airbnb',       categoryLabel: 'Visibilité'     },
    { slug: 'tarification-dynamique-lcd',      label: 'Tarification dynamique : par où commencer', categoryLabel: 'Revenus' },
    { slug: 'messages-airbnb-automatiser',     label: 'Les 5 messages à automatiser',       categoryLabel: 'Automatisation' },
  ],
}
