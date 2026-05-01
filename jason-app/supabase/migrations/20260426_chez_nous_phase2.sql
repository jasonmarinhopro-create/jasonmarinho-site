-- ─────────────────────────────────────────────────────────────────────
-- Migration : Chez Nous Phase 2, votes + édition
-- Date : 2026-04-26
-- ─────────────────────────────────────────────────────────────────────

-- ─── Édition : tracker les modifications ───
alter table public.chez_nous_posts
  add column if not exists edited_at timestamptz;

alter table public.chez_nous_replies
  add column if not exists edited_at timestamptz;

-- ─── TABLE : votes sur les posts ───
create table if not exists public.chez_nous_post_votes (
  post_id    uuid not null references public.chez_nous_posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists chez_nous_post_votes_post_idx
  on public.chez_nous_post_votes (post_id);

create index if not exists chez_nous_post_votes_user_idx
  on public.chez_nous_post_votes (user_id);

-- Compteur dénormalisé sur le post
alter table public.chez_nous_posts
  add column if not exists vote_count int not null default 0;

create or replace function public.chez_nous_update_post_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.chez_nous_posts set vote_count = vote_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.chez_nous_posts set vote_count = greatest(vote_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists chez_nous_post_votes_count_ins on public.chez_nous_post_votes;
create trigger chez_nous_post_votes_count_ins
  after insert on public.chez_nous_post_votes
  for each row execute procedure public.chez_nous_update_post_votes();

drop trigger if exists chez_nous_post_votes_count_del on public.chez_nous_post_votes;
create trigger chez_nous_post_votes_count_del
  after delete on public.chez_nous_post_votes
  for each row execute procedure public.chez_nous_update_post_votes();

-- ─── RLS votes ───
alter table public.chez_nous_post_votes enable row level security;

drop policy if exists "chez_nous_post_votes_select_all" on public.chez_nous_post_votes;
create policy "chez_nous_post_votes_select_all"
  on public.chez_nous_post_votes for select
  using (auth.uid() is not null);

drop policy if exists "chez_nous_post_votes_insert_own" on public.chez_nous_post_votes;
create policy "chez_nous_post_votes_insert_own"
  on public.chez_nous_post_votes for insert
  with check (auth.uid() = user_id);

drop policy if exists "chez_nous_post_votes_delete_own" on public.chez_nous_post_votes;
create policy "chez_nous_post_votes_delete_own"
  on public.chez_nous_post_votes for delete
  using (auth.uid() = user_id);
