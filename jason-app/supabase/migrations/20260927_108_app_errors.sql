-- Suivi des erreurs de l'app en production (alternative maison à Sentry,
-- sans compte ni service externe). Écrit par /api/errors (erreurs navigateur :
-- écrans d'erreur, exceptions JS non gérées) et par lib/logger.ts (log.error
-- côté serveur). Lu par la Vue d'ensemble admin (carte « Erreurs · 7 jours »).
--
-- RGPD : ni IP ni user-agent complet ; user_id seulement si connecté (pour
-- pouvoir recontacter la personne touchée). Purge opportuniste > 30 jours.

CREATE TABLE IF NOT EXISTS public.app_errors (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  source      text NOT NULL CHECK (source IN ('client', 'server')),
  message     text NOT NULL,
  digest      text,
  path        text,
  route       text,
  stack       text,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS app_errors_created_at_idx ON public.app_errors (created_at DESC);

-- Service role uniquement (aucune policy) : jamais lisible depuis le navigateur.
ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;
