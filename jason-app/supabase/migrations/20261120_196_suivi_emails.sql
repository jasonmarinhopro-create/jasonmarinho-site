-- Suivi des e-mails de la plateforme (20/11/2026, demande de Jason : voir si
-- les e-mails partent bien et ce qui est cliqué, « en faisant bien les choses »).
--
-- 1. email_events : un événement Resend par ligne (envoyé, remis, rejeté,
--    signalé comme spam, retardé), reçu par le webhook /api/webhooks/resend.
--    La catégorie vient du tag posé à l'envoi. Adresse du destinataire gardée
--    SEULEMENT pour un rejet ou un signalement (il faut savoir quelle adresse
--    corriger), jamais pour un voyageur ni un client d'un pro (catégories
--    « voyageur » et « devis » : adresse masquée). Ni objet ni contenu.
--    Ni ouverture ni pixel (recommandation CNIL du 12/03/2026 : consentement
--    requis ; la mesure de la délivrabilité en est dispensée). Purgé à 13 mois.
-- 2. email_clicks : compteur anonyme par jour, catégorie et bouton, via la
--    redirection /api/e/c (aucun identifiant de personne).
-- Écrit et lu au service role seulement. Rejouable.

create table if not exists public.email_events (
  id text primary key,                 -- identifiant du message webhook (svix-id) : un événement rejoué n'est pas recompté
  created_at timestamptz not null default now(),
  email_id text,
  type text not null,                  -- sent, delivered, bounced, complained, delivery_delayed, failed
  categorie text not null default 'autre',
  destinataire text,                   -- rejets et signalements seulement, sinon null
  raison text
);

create index if not exists email_events_created_at_idx on public.email_events (created_at desc);

alter table public.email_events enable row level security;
grant select, insert, update, delete on public.email_events to service_role;

create table if not exists public.email_clicks (
  jour date not null,
  categorie text not null,
  bouton text not null,
  clics integer not null default 0,
  primary key (jour, categorie, bouton)
);

alter table public.email_clicks enable row level security;
grant select, insert, update, delete on public.email_clicks to service_role;

create or replace function public.email_click_count(p_jour date, p_categorie text, p_bouton text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.email_clicks (jour, categorie, bouton, clics)
  values (p_jour, left(p_categorie, 40), left(p_bouton, 60), 1)
  on conflict (jour, categorie, bouton) do update set clics = public.email_clicks.clics + 1
$$;

revoke all on function public.email_click_count(date, text, text) from public, anon, authenticated;
grant execute on function public.email_click_count(date, text, text) to service_role;

-- Les chiffres de la page E-mails en une lecture, sur les N derniers jours
create or replace function public.email_stats(p_jours integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ev as (
    select * from public.email_events where created_at > now() - make_interval(days => p_jours)
  )
  select jsonb_build_object(
    'par_categorie', coalesce((
      select jsonb_agg(jsonb_build_object(
        'categorie', categorie,
        'envoyes', count(*) filter (where type = 'sent'),
        'remis', count(*) filter (where type = 'delivered'),
        'rejetes', count(*) filter (where type in ('bounced', 'failed')),
        'spam', count(*) filter (where type = 'complained'),
        'retardes', count(*) filter (where type = 'delivery_delayed')
      ) order by count(*) filter (where type = 'sent') desc)
      from ev group by categorie
    ), '[]'::jsonb),
    'par_jour', coalesce((
      select jsonb_agg(jsonb_build_object('jour', jour, 'envoyes', n) order by jour)
      from (select (created_at at time zone 'Europe/Paris')::date as jour, count(*) as n from ev where type = 'sent' group by 1) j
    ), '[]'::jsonb),
    'rejets', coalesce((
      select jsonb_agg(jsonb_build_object('le', created_at, 'categorie', categorie, 'type', type, 'destinataire', destinataire, 'raison', raison) order by created_at desc)
      from (select * from ev where type in ('bounced', 'failed', 'complained') order by created_at desc limit 50) r
    ), '[]'::jsonb),
    'clics', coalesce((
      select jsonb_agg(jsonb_build_object('categorie', categorie, 'bouton', bouton, 'clics', n) order by n desc)
      from (select categorie, bouton, sum(clics) as n from public.email_clicks where jour > (now() at time zone 'Europe/Paris')::date - p_jours group by 1, 2) c
    ), '[]'::jsonb),
    'dernier_evenement', (select max(created_at) from public.email_events)
  )
$$;

revoke all on function public.email_stats(integer) from public, anon, authenticated;
grant execute on function public.email_stats(integer) to service_role;
