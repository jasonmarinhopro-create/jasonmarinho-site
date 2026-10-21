-- Supabase 2026-10-30: les nouvelles tables du schéma public ne sont plus
-- exposées automatiquement par la Data API. Aligne dès maintenant la base
-- et les réinitialisations locales sur ce comportement opt-in.
-- Les privilèges des objets déjà existants ne sont pas modifiés.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated, service_role;
