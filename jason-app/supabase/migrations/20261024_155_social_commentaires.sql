-- Réseaux sociaux automatiques (24/10/2026) : commentaires Facebook / Instagram
-- relevés par l'app (API + webhook) et réponses publiques écrites par la
-- routine « Community manager », puis publiées par /api/cron/social-ops.
-- Vidéos des Reels acceptées dans le bucket des médias.

create table if not exists public.social_comments (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook', 'instagram')),
  comment_id text not null,
  parent_id text,
  post_external_id text,
  author_name text,
  text text not null,
  commented_at timestamptz,
  reply_text text,
  reply_status text not null default 'nouveau' check (reply_status in ('nouveau', 'a_envoyer', 'envoye', 'ignore', 'echec')),
  reply_error text,
  reply_external_id text,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  unique (platform, comment_id)
);

create index if not exists social_comments_status_idx on public.social_comments (reply_status, created_at);

alter table public.social_comments enable row level security;

drop policy if exists "social_comments admin" on public.social_comments;
create policy "social_comments admin" on public.social_comments
  for all to authenticated using ((select is_admin())) with check ((select is_admin()));

-- Reels : vidéos MP4 jusqu'à 50 Mo (plafond d'un envoi sur l'offre gratuite)
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
       file_size_limit = 52428800
 where id = 'social-post-media';
