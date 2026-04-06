-- ============================================================
-- MIGRATION : Insérer toutes les formations + corriger RLS
-- À exécuter dans l'éditeur SQL de Supabase Dashboard
-- ============================================================

-- ── 1. Activer RLS sur la table formations (si pas déjà fait) ──
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

-- ── 2. Recréer la politique de lecture publique ──────────────
DROP POLICY IF EXISTS "Public read formations" ON public.formations;

CREATE POLICY "Public read formations"
  ON public.formations
  FOR SELECT
  USING (is_published = true);

-- Politique de lecture admin (via service role — pas de restriction)
-- Le service role bypasse toujours le RLS, pas besoin de policy supplémentaire.

-- ── 3. Insérer toutes les formations (upsert) ───────────────
-- Si une formation existe déjà avec le même slug, on met à jour son statut.
INSERT INTO public.formations (slug, title, description, duration, modules_count, lessons_count, level, is_published) VALUES
  ('google-my-business-lcd',
   'Google My Business pour la LCD',
   'Attire des voyageurs directs sans passer par Airbnb grâce à Google. Optimise ta fiche, collecte des avis et génère des réservations sans commission.',
   '2h30', 7, 11, 'debutant', true),

  ('annonce-directe',
   'Développer sa réservation directe et s''affranchir des plateformes',
   'Génère des réservations directes sans commission. Construis ton canal direct de A à Z — site, trafic qualifié, conversion et fidélisation — pour ne plus jamais dépendre d''Airbnb.',
   '4h30', 6, 14, 'debutant', true),

  ('tarification-dynamique',
   'Comprendre et utiliser la tarification dynamique',
   '45% des hôtes sous-évaluent ou surévaluent leur logement, perdant 15 à 25% de revenus. Tarif de base, prix minimum, saisonnalité, événements locaux, outils : la méthode complète pour mettre le bon prix — automatiquement.',
   '2h00', 4, 10, 'intermediaire', true),

  ('securiser-reservations-eviter-mauvais-voyageurs',
   'Sécuriser ses réservations et éviter les mauvais voyageurs',
   'Comment identifier, filtrer et gérer les voyageurs problématiques avant qu''ils arrivent — sans sacrifier ton taux de conversion.',
   '2h00', 4, 10, 'intermediaire', true),

  ('reseaux-sociaux-lcd',
   'Développer sa présence sur les réseaux sociaux pour attirer des voyageurs',
   'Instagram, Facebook, TikTok : quelles plateformes choisir, quoi publier et comment transformer tes abonnés en voyageurs.',
   '1h45', 4, 9, 'debutant', true),

  ('optimiser-annonce-airbnb',
   'Optimiser son annonce Airbnb : photos, titre, description, algorithme',
   'Ton annonce est ton argument de vente numéro 1. Voici comment l''optimiser pour apparaître en tête des résultats et convertir chaque visite en réservation.',
   '2h30', 5, 12, 'debutant', true),

  ('mettre-le-bon-prix-lcd',
   'Mettre le bon prix en location courte durée',
   'Comment fixer un prix qui remplit ton calendrier tout en maximisant tes revenus — sans outil payant, en partant de tes coûts réels.',
   '2h30', 5, 12, 'debutant', true),

  ('livret-accueil-digital',
   'Créer un livret d''accueil digital qui réduit les questions et améliore les avis',
   'Un livret d''accueil bien conçu réduit de 70% les questions des voyageurs et améliore tes notes. Voici comment le créer et l''automatiser.',
   '1h45', 4, 9, 'debutant', true),

  ('lcd-basse-saison',
   'Développer son activité LCD en basse saison',
   'La basse saison n''est pas une fatalité. Voici les stratégies concrètes pour remplir ton calendrier même quand les voyageurs sont rares.',
   '2h00', 4, 10, 'intermediaire', true),

  ('gerer-lcd-automatisation',
   'Gérer sa LCD comme un pro : automatisation et gain de temps',
   'Automatise les tâches répétitives et reprends le contrôle de ton temps. Channel manager, messages automatiques, checklist et outils : le guide complet.',
   '2h00', 4, 10, 'intermediaire', true),

  ('fiscalite-reglementation-lcd-france-2026',
   'Fiscalité et réglementation LCD en France 2026',
   'Tout ce qu''il faut savoir sur la fiscalité, les obligations légales et la réglementation en vigueur pour exercer sereinement en France en 2026.',
   '2h30', 5, 12, 'debutant', true),

  ('ecrire-avis-repondre-voyageurs',
   'Écrire des avis et répondre aux voyageurs',
   'Les avis sont le moteur de ton activité LCD. Voici comment les collecter, les écrire et y répondre pour maximiser leur impact sur ton classement et tes réservations.',
   '2h00', 4, 10, 'debutant', true),

  ('decorer-amenager-logement-lcd',
   'Décorer et aménager son logement pour maximiser les avis',
   'L''aménagement de ton logement influence directement tes notes et tes photos. Voici les règles de base pour créer un espace qui séduit sur Airbnb.',
   '2h00', 4, 10, 'debutant', true),

  ('creer-conciergerie-lcd',
   'Créer et développer sa conciergerie LCD',
   'Comment lancer, structurer et développer une activité de conciergerie rentable — de la prospection des premiers clients à la gestion d''une équipe.',
   '3h00', 6, 14, 'intermediaire', true)

ON CONFLICT (slug) DO UPDATE
  SET
    is_published = true,
    title        = EXCLUDED.title,
    description  = EXCLUDED.description,
    duration     = EXCLUDED.duration,
    modules_count = EXCLUDED.modules_count,
    lessons_count = EXCLUDED.lessons_count,
    level        = EXCLUDED.level;

-- ── 4. Publier toutes les formations existantes ─────────────
UPDATE public.formations SET is_published = true;

-- ── 5. Vérification ─────────────────────────────────────────
SELECT slug, title, is_published, level
FROM public.formations
ORDER BY created_at;
