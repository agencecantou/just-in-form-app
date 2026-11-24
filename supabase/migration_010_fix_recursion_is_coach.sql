-- Corrige la migration_008 : la policy "Le coach voit tous les profils"
-- se referencait elle-meme (sous-requete sur profiles a l'interieur d'une
-- policy sur profiles), ce qui declenchait une erreur Postgres
-- "infinite recursion detected in policy for relation profiles" des qu'un
-- utilisateur authentifie (pas le compte postgres du SQL Editor) essayait
-- de lire son propre profil. C'est ce qui cassait le middleware /admin et
-- le bouton "Espace coach" : la requete profiles plantait silencieusement,
-- profile finissait a null, donc role !== 'coach'.
--
-- Fix standard recommande par Supabase : passer par une fonction
-- SECURITY DEFINER, qui contourne RLS en interne et casse la recursion.
create or replace function public.is_coach()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'coach'
  );
$$;

drop policy if exists "Le coach voit tous les profils" on public.profiles;
create policy "Le coach voit tous les profils" on public.profiles
  for select using (public.is_coach());
