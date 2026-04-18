-- Migration: table pour suivre les groupes rejoints/masqués par utilisateur
CREATE TABLE IF NOT EXISTS public.user_community_memberships (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id   UUID        NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  status     TEXT        NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, group_id)
);

ALTER TABLE public.user_community_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own memberships"
  ON public.user_community_memberships
  FOR ALL
  USING (auth.uid() = user_id);
