-- Espace « équipe de ménage » : planning de la semaine, bouton « terminé »
-- et photos, sans compte partagé avec l'hôte.
--
-- Principe : l'hôte partage déjà son lien de planning ménage (flux iCal
-- /api/calendar/menage-feed?token=…, token = profiles.ical_token). L'équipe
-- colle ce lien dans son espace (/dashboard/ma-fiche-menage/planning) :
-- on crée un menage_link. Si l'hôte régénère son token, host_token ne
-- correspond plus et l'accès de l'équipe expire automatiquement.
--
-- Quand l'équipe marque un ménage « terminé » : une ligne menage_completions
-- (+ photos dans le bucket privé menage-photos), l'événement ménage de l'hôte
-- est marqué [FAIT] (même mécanisme que dans son Calendrier) et l'hôte reçoit
-- une notification avec lien vers les photos.

CREATE TABLE IF NOT EXISTS public.menage_links (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_token       text NOT NULL,
  label            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cleaner_user_id, host_user_id)
);
ALTER TABLE public.menage_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menage_links_select_own" ON public.menage_links;
CREATE POLICY "menage_links_select_own" ON public.menage_links
  FOR SELECT USING (auth.uid() = cleaner_user_id);
DROP POLICY IF EXISTS "menage_links_delete_own" ON public.menage_links;
CREATE POLICY "menage_links_delete_own" ON public.menage_links
  FOR DELETE USING (auth.uid() = cleaner_user_id);
-- Insertion uniquement côté serveur (vérification du token), pas de policy INSERT.

CREATE TABLE IF NOT EXISTS public.menage_completions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cleaner_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  logement_nom     text NOT NULL,
  date             date NOT NULL,
  note             text,
  photos           text[] NOT NULL DEFAULT '{}',
  done_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (host_user_id, logement_nom, date)
);
CREATE INDEX IF NOT EXISTS menage_completions_cleaner_idx ON public.menage_completions (cleaner_user_id, date);
ALTER TABLE public.menage_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menage_completions_select_parties" ON public.menage_completions;
CREATE POLICY "menage_completions_select_parties" ON public.menage_completions
  FOR SELECT USING (auth.uid() = host_user_id OR auth.uid() = cleaner_user_id);
-- Écritures uniquement côté serveur (contrôle du lien + du créneau).

-- Photos : bucket PRIVÉ, lues via URL signées côté serveur (hôte et équipe).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menage-photos', 'menage-photos', false, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
