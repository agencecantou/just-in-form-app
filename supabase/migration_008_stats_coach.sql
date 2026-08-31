-- Permet au coach de voir tous les profils (nombre d'abonnees, etc.) pour
-- la nouvelle section Statistiques de l'espace coach. Jusqu'ici, la policy
-- "Chacun voit son profil" ne laissait chacun voir que sa propre ligne.
-- Les policies SELECT sont cumulatives (OR) : celle-ci s'ajoute, elle ne
-- remplace rien.
drop policy if exists "Le coach voit tous les profils" on public.profiles;
create policy "Le coach voit tous les profils" on public.profiles
  for select using (
    exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'coach')
  );
