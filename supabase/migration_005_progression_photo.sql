-- Migration 005 : photo de profil + suivi de progression video (reprise a
-- la bonne position, liste des videos non terminees, marquage automatique).
-- A coller dans Supabase > SQL Editor > New query, puis "Run".

-- 1. Photo de profil (stockee dans le bucket "images" deja cree en phase 1)
-- et preferences de notification (petit objet json, pas besoin d'une table).
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;

-- 2. Progression par video : derniere position atteinte, mise a jour en
-- continu pendant la lecture. Une ligne par (utilisateur, video). Supprimee
-- quand la seance est marquee terminee (plus besoin de reprise).
create table if not exists public.progression_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  position_secondes int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, video_id)
);

alter table public.progression_videos enable row level security;

drop policy if exists "Chacun voit sa progression" on public.progression_videos;
create policy "Chacun voit sa progression" on public.progression_videos
  for select using (auth.uid() = user_id);

drop policy if exists "Chacun ecrit sa progression" on public.progression_videos;
create policy "Chacun ecrit sa progression" on public.progression_videos
  for insert with check (auth.uid() = user_id);

drop policy if exists "Chacun met a jour sa progression" on public.progression_videos;
create policy "Chacun met a jour sa progression" on public.progression_videos
  for update using (auth.uid() = user_id);

drop policy if exists "Chacun supprime sa progression" on public.progression_videos;
create policy "Chacun supprime sa progression" on public.progression_videos
  for delete using (auth.uid() = user_id);
