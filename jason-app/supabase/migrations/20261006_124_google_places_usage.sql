-- Compteur mensuel des appels à Google Places API (New) (06/10/2026, Jason :
-- « je ne veux pas payer, ne dépasse jamais les options gratuites »).
-- Chaque appel réserve d'abord sa place ici (google_places_take) ; au-delà du
-- plafond fixé dans lib/google/places-budget-rules.ts, l'appel n'est pas fait.
-- Service role uniquement.

create table if not exists public.google_places_usage (
  month text not null,          -- AAAA-MM, heure du Pacifique (mois de facturation Google)
  sku text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (month, sku)
);

alter table public.google_places_usage enable row level security;

-- Réserve un appel : true si le compteur du mois était sous le plafond (et
-- l'incrémente), false sinon. Atomique : deux appels simultanés ne peuvent
-- pas dépasser le plafond.
create or replace function public.google_places_take(p_month text, p_sku text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  taken boolean;
begin
  insert into public.google_places_usage as u (month, sku, count, updated_at)
  values (p_month, p_sku, 1, now())
  on conflict (month, sku) do update
    set count = u.count + 1, updated_at = now()
    where u.count < p_limit
  returning true into taken;
  return coalesce(taken, false) and p_limit > 0;
end;
$$;

revoke all on function public.google_places_take(text, text, integer) from public, anon, authenticated;
grant execute on function public.google_places_take(text, text, integer) to service_role;
