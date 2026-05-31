create extension if not exists pgcrypto;

create table if not exists public.immerselog_entities (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (
    entity_type in ('languages', 'goals', 'works', 'sessions', 'vocabulary', 'achievements', 'settings')
  ),
  payload jsonb not null,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, entity_type, id)
);

create index if not exists immerselog_entities_user_updated_idx
  on public.immerselog_entities(user_id, updated_at desc);

create index if not exists immerselog_entities_payload_gin_idx
  on public.immerselog_entities using gin(payload);

alter table public.immerselog_entities enable row level security;

create policy "Users can read their ImmerseLog entities"
  on public.immerselog_entities
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their ImmerseLog entities"
  on public.immerselog_entities
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their ImmerseLog entities"
  on public.immerselog_entities
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their ImmerseLog entities"
  on public.immerselog_entities
  for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('immerselog-covers', 'immerselog-covers', true)
on conflict (id) do nothing;

create policy "Users can upload their covers"
  on storage.objects
  for insert
  with check (
    bucket_id = 'immerselog-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their covers"
  on storage.objects
  for update
  using (
    bucket_id = 'immerselog-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Covers are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'immerselog-covers');
