create table if not exists affiches (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logement_id uuid references logements(id) on delete set null,
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table affiches enable row level security;

create policy "Users manage own affiches"
  on affiches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index affiches_user_id_idx on affiches(user_id);
create index affiches_logement_id_idx on affiches(logement_id);
