-- Posts Facebook personnalisés sauvegardés par l'utilisateur.
-- Chaque hôte peut sauvegarder un post pour la page Communauté, soit
-- générique (logement_id NULL), soit attaché à un logement spécifique.
-- Contrainte d'unicité : 1 post par couple (user, logement).

CREATE TABLE IF NOT EXISTS public.user_facebook_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logement_id  uuid REFERENCES public.logements(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT 'Mon post',
  content      TEXT NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Index unique : un seul post par (user, logement).
-- Pour le cas logement_id NULL on remplace par un UUID magique pour rester unique.
CREATE UNIQUE INDEX IF NOT EXISTS user_facebook_posts_user_logement_unique
  ON public.user_facebook_posts (
    user_id,
    COALESCE(logement_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

ALTER TABLE public.user_facebook_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own FB posts"
  ON public.user_facebook_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FB posts"
  ON public.user_facebook_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FB posts"
  ON public.user_facebook_posts FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FB posts"
  ON public.user_facebook_posts FOR DELETE
  USING (auth.uid() = user_id);
