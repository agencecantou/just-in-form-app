-- Migration 002 : categories multiples + videos mises en avant + programmes
-- A coller dans Supabase > SQL Editor > New query, puis "Run".
-- Sans danger pour les videos deja ajoutees : la categorie existante est
-- recuperee automatiquement dans le nouveau champ "categories".

-- 1. Categories multiples (tableau) a la place d'une seule categorie
alter table videos add column if not exists categories text[];

update videos
set categories = array[categorie]
where categories is null and categorie is not null;

alter table videos alter column categories set default '{}';
alter table videos alter column categories set not null;

alter table videos drop column if exists categorie;

-- 2. Videos mises en avant / recommandees
alter table videos add column if not exists est_vedette boolean not null default false;

-- 3. Programmes (plans guides sur plusieurs semaines)
create table if not exists programmes (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null default '',
  statut text not null default 'brouillon' check (statut in ('publie', 'brouillon')),
  created_at timestamptz not null default now()
);

create table if not exists programme_videos (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programmes(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  ordre int not null default 0
);

alter table programmes enable row level security;
alter table programme_videos enable row level security;

-- Demo : lecture publique, ecriture ouverte (meme logique que "videos",
-- a durcir plus tard avec un role coach)
create policy "Lecture publique des programmes" on programmes
  for select using (true);

create policy "Ecriture demo des programmes" on programmes
  for insert with check (true);

create policy "Modification demo des programmes" on programmes
  for update using (true);

create policy "Suppression demo des programmes" on programmes
  for delete using (true);

create policy "Lecture publique des programme_videos" on programme_videos
  for select using (true);

create policy "Ecriture demo des programme_videos" on programme_videos
  for insert with check (true);

create policy "Modification demo des programme_videos" on programme_videos
  for update using (true);

create policy "Suppression demo des programme_videos" on programme_videos
  for delete using (true);
