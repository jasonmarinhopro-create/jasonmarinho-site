-- ============================================================
-- MIGRATION : Corriger l'état des données
-- À exécuter dans l'éditeur SQL de Supabase Dashboard
-- ============================================================

-- ── 1. PARTENAIRES ──────────────────────────────────────────
-- Les 5 anciens partenaires seed (Swikly, Hospitable, PriceLabs, MAIF, Smily)
-- ne sont pas de vraies offres négociées → désactiver.
-- Driing est géré en dur dans le code (lib/constants/partners.ts).
-- Pour ajouter un VRAI nouveau partenaire : insérer une ligne avec is_active = true.

UPDATE public.partners
SET is_active = false
WHERE slug IN ('swikly', 'hospitable', 'pricelabs', 'maif', 'smily');

-- ── 2. FORMATIONS ───────────────────────────────────────────
-- Seules 2 formations sont disponibles — les autres sont en construction.
-- Décommenter et ajuster les slugs selon vos formations réelles.
--
-- Exemple : dépublier les formations en construction
-- UPDATE public.formations SET is_published = false WHERE slug = 'tarification-dynamique';
-- UPDATE public.formations SET is_published = false WHERE slug = 'messages-automatiques';
--
-- Pour republier :
-- UPDATE public.formations SET is_published = true WHERE slug = 'google-my-business-lcd';
--
-- ⚠️ Ajustez les slugs selon vos formations réelles dans la DB.
-- Vous pouvez gérer cela directement depuis /dashboard/admin/formations

-- ── 3. VÉRIFICATION ─────────────────────────────────────────
-- Après exécution, vérifier :
SELECT 'formations publiées' AS info, COUNT(*) FROM public.formations WHERE is_published = true
UNION ALL
SELECT 'partenaires actifs', COUNT(*) FROM public.partners WHERE is_active = true;
