-- Phase 1 : categories gerables, description + image par video,
-- programme de lancement, banque d'images.
-- Meme logique de securite que le reste de l'appli pour l'instant (RLS
-- permissive, durcissement prevu en phase 2).

-- 1. Categories gerables depuis l'admin
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_select_public"
  on public.categories for select
  using (true);

create policy "categories_write_public"
  on public.categories for all
  using (true)
  with check (true);

insert into public.categories (nom, ordre) values
  ('Echauffement', 0),
  ('HIIT', 1),
  ('Pilates', 2),
  ('Animal Flow', 3),
  ('Piloxing', 4),
  ('Yoga', 5),
  ('Mix', 6)
on conflict (nom) do nothing;

-- 2. Description et image par video
alter table public.videos add column if not exists description text;
alter table public.videos add column if not exists image_url text;

-- 3. Programme de lancement (un seul a la fois, gere cote appli)
alter table public.programmes add column if not exists est_lancement boolean not null default false;

-- 4. Banque d'images pour les admins (bucket storage public)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "images_select_public"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "images_write_public"
  on storage.objects for all
  using (bucket_id = 'images')
  with check (bucket_id = 'images');
