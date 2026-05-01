-- ─────────────────────────────────────────────────────────────────────
-- Migration : Chez Nous, Communauté ouverte (forum)
-- Date : 2026-04-26
-- ─────────────────────────────────────────────────────────────────────

-- ─── Profil : ajout pseudo, bio, contrôles vie privée ───
alter table public.profiles
  add column if not exists pseudo                  text,
  add column if not exists bio                     text,
  add column if not exists privacy_show_logements  boolean not null default true,
  add column if not exists privacy_show_platforms  boolean not null default true,
  add column if not exists privacy_show_city       boolean not null default true;

create unique index if not exists profiles_pseudo_unique
  on public.profiles (lower(pseudo)) where pseudo is not null;

-- ─── TABLE : posts ───
create table if not exists public.chez_nous_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users(id) on delete cascade,
  category    text not null check (category in (
                'reglementation', 'voyageurs', 'optimisation',
                'entraide', 'cas', 'autres'
              )),
  title       text not null check (char_length(title) between 3 and 200),
  body        text not null check (char_length(body) between 1 and 8000),
  pinned      boolean not null default false,
  locked      boolean not null default false,
  reply_count int not null default 0,
  last_reply_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists chez_nous_posts_recent_idx
  on public.chez_nous_posts (pinned desc, coalesce(last_reply_at, created_at) desc);

create index if not exists chez_nous_posts_category_idx
  on public.chez_nous_posts (category, created_at desc);

create index if not exists chez_nous_posts_author_idx
  on public.chez_nous_posts (author_id, created_at desc);

-- ─── TABLE : replies ───
create table if not exists public.chez_nous_replies (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.chez_nous_posts(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists chez_nous_replies_post_idx
  on public.chez_nous_replies (post_id, created_at asc);

-- ─── Trigger : maj reply_count + last_reply_at ───
create or replace function public.chez_nous_update_post_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.chez_nous_posts
       set reply_count = reply_count + 1,
           last_reply_at = new.created_at
     where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.chez_nous_posts
       set reply_count = greatest(reply_count - 1, 0),
           last_reply_at = (
             select max(created_at) from public.chez_nous_replies where post_id = old.post_id
           )
     where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists chez_nous_replies_stats_ins on public.chez_nous_replies;
create trigger chez_nous_replies_stats_ins
  after insert on public.chez_nous_replies
  for each row execute procedure public.chez_nous_update_post_stats();

drop trigger if exists chez_nous_replies_stats_del on public.chez_nous_replies;
create trigger chez_nous_replies_stats_del
  after delete on public.chez_nous_replies
  for each row execute procedure public.chez_nous_update_post_stats();

-- ─── RLS posts ───
alter table public.chez_nous_posts enable row level security;

drop policy if exists "chez_nous_posts_select_all" on public.chez_nous_posts;
create policy "chez_nous_posts_select_all"
  on public.chez_nous_posts for select
  using (auth.uid() is not null);

drop policy if exists "chez_nous_posts_insert_auth" on public.chez_nous_posts;
create policy "chez_nous_posts_insert_auth"
  on public.chez_nous_posts for insert
  with check (auth.uid() = author_id);

-- L'auteur peut éditer/supprimer son propre post ; l'admin peut tout faire
drop policy if exists "chez_nous_posts_update_owner_or_admin" on public.chez_nous_posts;
create policy "chez_nous_posts_update_owner_or_admin"
  on public.chez_nous_posts for update
  using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "chez_nous_posts_delete_owner_or_admin" on public.chez_nous_posts;
create policy "chez_nous_posts_delete_owner_or_admin"
  on public.chez_nous_posts for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─── RLS replies ───
alter table public.chez_nous_replies enable row level security;

drop policy if exists "chez_nous_replies_select_all" on public.chez_nous_replies;
create policy "chez_nous_replies_select_all"
  on public.chez_nous_replies for select
  using (auth.uid() is not null);

drop policy if exists "chez_nous_replies_insert_auth" on public.chez_nous_replies;
create policy "chez_nous_replies_insert_auth"
  on public.chez_nous_replies for insert
  with check (
    auth.uid() = author_id
    and not exists (
      select 1 from public.chez_nous_posts p
      where p.id = post_id and p.locked = true
    )
  );

drop policy if exists "chez_nous_replies_update_owner_or_admin" on public.chez_nous_replies;
create policy "chez_nous_replies_update_owner_or_admin"
  on public.chez_nous_replies for update
  using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "chez_nous_replies_delete_owner_or_admin" on public.chez_nous_replies;
create policy "chez_nous_replies_delete_owner_or_admin"
  on public.chez_nous_replies for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
