-- Migration 003 : comptes (coach/abonnee), ressentis, avis, vues
-- A coller dans Supabase > SQL Editor > New query, puis "Run".
--
-- Ajoute l'authentification (table profiles liee a auth.users), un compteur
-- de vues sur les videos, les ressentis (4 emojis apres une seance) et les
-- avis libres a Justine. La securite fine (RLS par role sur videos et
-- programmes) reste a durcir plus tard, comme deja documente dans
-- schema.sql et migration_002.

-- 1. Profils utilisateurs
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  prenom text,
  role text not null default 'abonnee' check (role in ('abonnee', 'coach')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Chacun voit son profil" on profiles;
create policy "Chacun voit son profil" on profiles
  for select using (auth.uid() = id);

drop policy if exists "Chacun modifie son profil" on profiles;
create policy "Chacun modifie son profil" on profiles
  for update using (auth.uid() = id);

-- Creation automatique du profil a l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, prenom)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'prenom', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Lien seances_terminees -> vrai compte (l'ancienne colonne texte
-- "utilisateur" reste pour l'historique de demo, non utilisee desormais)
alter table seances_terminees add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 3. Compteur de vues
alter table videos add column if not exists vues int not null default 0;

create or replace function increment_vues(p_video_id uuid)
returns void as $$
  update videos set vues = vues + 1 where id = p_video_id;
$$ language sql;

-- 4. Ressentis (4 emojis apres une seance)
create table if not exists ressentis (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  valeur int not null check (valeur between 1 and 4),
  created_at timestamptz not null default now()
);

alter table ressentis enable row level security;

drop policy if exists "Lecture publique des ressentis" on ressentis;
create policy "Lecture publique des ressentis" on ressentis
  for select using (true);

drop policy if exists "Chacun ajoute son ressenti" on ressentis;
create policy "Chacun ajoute son ressenti" on ressentis
  for insert with check (auth.uid() = user_id);

-- 5. Avis libres a Justine (prive, visible cote coach uniquement)
create table if not exists avis (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table avis enable row level security;

drop policy if exists "Chacun ajoute un avis" on avis;
create policy "Chacun ajoute un avis" on avis
  for insert with check (auth.uid() = user_id);

drop policy if exists "Lecture des avis par le coach" on avis;
create policy "Lecture des avis par le coach" on avis
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'coach')
  );

-- Pour promouvoir un compte en coach une fois inscrit :
-- update profiles set role = 'coach' where email = 'ton-email@exemple.fr';
