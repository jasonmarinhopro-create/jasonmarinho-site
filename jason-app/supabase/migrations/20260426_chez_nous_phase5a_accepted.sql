-- ─────────────────────────────────────────────────────────────────────
-- Migration : Chez Nous Phase 5a — Réponse acceptée
-- Date : 2026-04-26
-- ─────────────────────────────────────────────────────────────────────

alter table public.chez_nous_posts
  add column if not exists accepted_reply_id uuid references public.chez_nous_replies(id) on delete set null;

-- Index pour filtrer rapidement résolus / non résolus
create index if not exists chez_nous_posts_resolved_idx
  on public.chez_nous_posts (accepted_reply_id)
  where accepted_reply_id is null;
