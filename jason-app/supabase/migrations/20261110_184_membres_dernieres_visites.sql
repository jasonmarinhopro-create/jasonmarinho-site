-- Page Admin → Membres (10/11/2026) : la dernière connexion de chaque membre
-- était lue auprès du serveur d'authentification (listUsers, page par page :
-- 4 à 8 s mesurés quand la base est chargée), et la dernière visite dans
-- profiles par une autre lecture. Les deux en une lecture SQL.
-- security definer : lit auth.users (dates seulement), réservé au service role.
create or replace function public.admin_members_seen(p_user_ids uuid[] default null)
returns table(id uuid, last_seen_at timestamptz, last_sign_in_at timestamptz)
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.id, p.last_seen_at, u.last_sign_in_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p_user_ids is null or p.id = any(p_user_ids)
$$;

revoke all on function public.admin_members_seen(uuid[]) from public, anon, authenticated;
grant execute on function public.admin_members_seen(uuid[]) to service_role;
