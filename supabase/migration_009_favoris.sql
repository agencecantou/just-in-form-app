-- Favoris (coeur) sur les videos, pour le nouveau lecteur video custom.
create table if not exists public.favoris (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);

alter table public.favoris enable row level security;

drop policy if exists "Chacun voit ses favoris" on public.favoris;
create policy "Chacun voit ses favoris" on public.favoris
  for select using (auth.uid() = user_id);

drop policy if exists "Chacun ajoute ses favoris" on public.favoris;
create policy "Chacun ajoute ses favoris" on public.favoris
  for insert with check (auth.uid() = user_id);

drop policy if exists "Chacun retire ses favoris" on public.favoris;
create policy "Chacun retire ses favoris" on public.favoris
  for delete using (auth.uid() = user_id);
