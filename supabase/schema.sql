-- Just In Form, schema de demo (sans auth reelle pour l'instant)
-- A coller dans Supabase > SQL Editor > New query, puis "Run".
--
-- IMPORTANT : les policies ci-dessous sont volontairement permissives
-- (n'importe qui avec la cle anon peut lire/ecrire) pour permettre la demo
-- de demain sans authentification. A durcir avant d'ouvrir aux vraies
-- abonnees de Justine : restreindre l'insert/update sur "videos" au role
-- coach, et "seances_terminees" a l'utilisateur connecte (auth.uid()).

create extension if not exists "pgcrypto";

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  categorie text not null,
  duree_min int not null,
  niveau text not null default 'Tous niveaux',
  vimeo_id text not null,
  statut text not null default 'brouillon' check (statut in ('publie', 'brouillon')),
  created_at timestamptz not null default now()
);

create table if not exists seances_terminees (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  utilisateur text not null default 'demo',
  termine_le timestamptz not null default now()
);

alter table videos enable row level security;
alter table seances_terminees enable row level security;

-- Lecture publique du catalogue (necessaire pour la vitrine/app sans auth)
create policy "Lecture publique des videos" on videos
  for select using (true);

-- Ecriture ouverte pour la demo (formulaire admin sans auth)
-- TODO : remplacer par une policy qui verifie un role "coach" une fois l'auth branchee
create policy "Ecriture demo des videos" on videos
  for insert with check (true);

create policy "Modification demo des videos" on videos
  for update using (true);

create policy "Suppression demo des videos" on videos
  for delete using (true);

-- Progres : lecture et ecriture ouvertes pour la demo
-- TODO : restreindre a auth.uid() = utilisateur une fois l'auth branchee
create policy "Lecture demo des seances" on seances_terminees
  for select using (true);

create policy "Ecriture demo des seances" on seances_terminees
  for insert with check (true);

-- Pas de donnees de depart : ajoute 1 ou 2 vraies videos de Justine
-- directement depuis /admin une fois l'app connectee, pour tester avec
-- un vrai identifiant Vimeo plutot qu'un placeholder qui risque de ne
-- pas s'afficher.
