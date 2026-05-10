-- Permettre d'épingler des messages par LOGEMENT (et plus seulement par utilisateur).
-- Avant : un seul template par (user, timing_bucket) — donc une seule séquence pour tous les logements.
-- Après : (user, timing_bucket, logement_id) → chaque logement peut avoir sa propre séquence.
-- Les rows existantes (logement_id = NULL) restent comme "séquence par défaut" / fallback.

-- 1) PK surrogate (l'ancienne PK composite empêche d'avoir plusieurs lignes pour le même template)
ALTER TABLE public.user_pinned_templates
  ADD COLUMN IF NOT EXISTS id UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.user_pinned_templates
  DROP CONSTRAINT IF EXISTS user_pinned_templates_pkey;

ALTER TABLE public.user_pinned_templates
  ADD PRIMARY KEY (id);

-- 2) Lien optionnel vers un logement (NULL = séquence globale par défaut)
ALTER TABLE public.user_pinned_templates
  ADD COLUMN IF NOT EXISTS logement_id UUID REFERENCES public.logements(id) ON DELETE CASCADE;

-- 3) Unicité : un seul pinning par (user, bucket, template, logement)
--    NULL est traité comme un UUID sentinel pour que PostgreSQL le considère égal.
DROP INDEX IF EXISTS uq_pinned_per_logement;
CREATE UNIQUE INDEX uq_pinned_per_logement
  ON public.user_pinned_templates(
    user_id,
    timing_bucket,
    template_id,
    COALESCE(logement_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- 4) Index pour requêtes par logement (chargement de la séquence d'un logement)
CREATE INDEX IF NOT EXISTS idx_pinned_by_logement
  ON public.user_pinned_templates(user_id, logement_id, timing_bucket, position);
