-- Alerte Supabase « Security Definer View » (31/10/2026) : public_depannage_view
-- tournait avec les droits de son créateur. Comme public_cleaners_view et
-- public_photographers_view : droits de celui qui lit (security_invoker). Le
-- build du site la lit avec la clé service, qui a ses droits sur la table
-- (migration 173). Rejouable.
alter view public.public_depannage_view set (security_invoker = true);
