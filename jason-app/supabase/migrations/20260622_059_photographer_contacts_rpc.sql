-- ════════════════════════════════════════════════════════════════════
-- RPC: increment_photographer_contacts
-- Incrémente atomiquement contacts_count quand un hôte envoie une demande
-- depuis la fiche publique d'un photographe.
-- Appelée par /api/photographer/contact (service_role only).
-- ════════════════════════════════════════════════════════════════════

create or replace function public.increment_photographer_contacts(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.photographers
     set contacts_count = contacts_count + 1
   where id = p_id;
$$;

revoke all on function public.increment_photographer_contacts(uuid) from public;
revoke all on function public.increment_photographer_contacts(uuid) from anon;
revoke all on function public.increment_photographer_contacts(uuid) from authenticated;
-- service_role bypass : utilisé exclusivement par les serverless functions.

-- Pareil pour les vues (compteur views_count, utilisé plus tard si on
-- veut tracker les visites côté serveur).
create or replace function public.increment_photographer_views(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.photographers
     set views_count = views_count + 1
   where id = p_id;
$$;

revoke all on function public.increment_photographer_views(uuid) from public;
revoke all on function public.increment_photographer_views(uuid) from anon;
revoke all on function public.increment_photographer_views(uuid) from authenticated;
