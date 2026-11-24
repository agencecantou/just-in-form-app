-- Migration 011 : refonte "jeu" de la plateforme (novembre 2026)
-- A coller dans Supabase > SQL Editor > New query, puis "Run".
-- Script rejouable : on peut le lancer plusieurs fois sans casse.
--
-- Contenu :
--   0. Rattrapage des migrations 006 (filtres) et 010 (recursion is_coach)
--   1. Profil : objectif de la semaine, profil sante, pause, accueil guide
--   2. Videos : intensite, objectifs, alerte sante
--   3. Recompenses debloquees avec les gouttes (reglables par le coach)
--   4. Defis et missions du mois
--   5. Contenus nutrition (astuces, conseils, recettes, cours, e-books)
--      + suivi des lectures
--   6. Contenus de depart issus des documents de Justine

-- 0. Rattrapages ---------------------------------------------------------
alter table public.videos add column if not exists avec_materiel boolean not null default false;
alter table public.videos add column if not exists zones_corps text[] not null default '{}'::text[];

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

-- 1. Profil ----------------------------------------------------------------
alter table public.profiles add column if not exists objectif_hebdo int not null default 2;
alter table public.profiles add column if not exists profil_sante jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists onboarding_fait boolean not null default false;
alter table public.profiles add column if not exists pause_depuis date;
alter table public.profiles add column if not exists pause_jusqu_au date;

-- Les comptes deja existants ne repassent pas par l'accueil guide.
update public.profiles set onboarding_fait = true
where onboarding_fait = false and created_at < now() - interval '1 hour';

-- 2. Videos ----------------------------------------------------------------
-- intensite : 1 douce, 2 moderee, 3 intense
alter table public.videos add column if not exists intensite smallint not null default 2;
alter table public.videos add column if not exists objectifs text[] not null default '{}'::text[];
alter table public.videos add column if not exists alerte_sante text;

-- 3. Recompenses ---------------------------------------------------------
create table if not exists public.recompenses (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null default '',
  seuil_gouttes int not null default 25,
  lien_url text,
  image_url text,
  actif boolean not null default true,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.recompenses enable row level security;
drop policy if exists "recompenses_lecture" on public.recompenses;
create policy "recompenses_lecture" on public.recompenses
  for select using (auth.role() = 'authenticated');
drop policy if exists "recompenses_coach" on public.recompenses;
create policy "recompenses_coach" on public.recompenses
  for all using (public.is_coach()) with check (public.is_coach());

-- 4. Defis et missions du mois ---------------------------------------------
-- type "mission" : X seances (d'une discipline ou toutes) dans le mois,
-- validee automatiquement. type "defi" : objectif perso (ex. tenir la
-- planche 2 min), valide par l'abonnee elle-meme.
create table if not exists public.defis (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'mission' check (type in ('mission', 'defi')),
  titre text not null,
  description text not null default '',
  mois date not null,
  categorie text,
  nombre int not null default 4,
  gouttes int not null default 5,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.defis enable row level security;
drop policy if exists "defis_lecture" on public.defis;
create policy "defis_lecture" on public.defis
  for select using (auth.role() = 'authenticated');
drop policy if exists "defis_coach" on public.defis;
create policy "defis_coach" on public.defis
  for all using (public.is_coach()) with check (public.is_coach());

create table if not exists public.defis_valides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  defi_id uuid not null references public.defis(id) on delete cascade,
  valide_le timestamptz not null default now(),
  unique (user_id, defi_id)
);
alter table public.defis_valides enable row level security;
drop policy if exists "defis_valides_soi" on public.defis_valides;
create policy "defis_valides_soi" on public.defis_valides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "defis_valides_coach" on public.defis_valides;
create policy "defis_valides_coach" on public.defis_valides
  for select using (public.is_coach());

-- 5. Nutrition -------------------------------------------------------------
create table if not exists public.contenus_nutrition (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('astuce', 'citation', 'conseil', 'recette', 'cours', 'ebook')),
  titre text not null,
  resume text not null default '',
  contenu text not null default '',
  image_url text,
  lien_url text,
  duree_min int,
  tags text[] not null default '{}'::text[],
  prix_public numeric(6,2),
  prix_abonnee numeric(6,2),
  inclus boolean not null default false,
  ordre int not null default 0,
  statut text not null default 'publie' check (statut in ('publie', 'brouillon')),
  created_at timestamptz not null default now()
);
alter table public.contenus_nutrition enable row level security;
drop policy if exists "nutrition_lecture" on public.contenus_nutrition;
create policy "nutrition_lecture" on public.contenus_nutrition
  for select using (statut = 'publie' or public.is_coach());
drop policy if exists "nutrition_coach" on public.contenus_nutrition;
create policy "nutrition_coach" on public.contenus_nutrition
  for all using (public.is_coach()) with check (public.is_coach());

create table if not exists public.contenus_lus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contenu_id uuid not null references public.contenus_nutrition(id) on delete cascade,
  lu_le timestamptz not null default now(),
  unique (user_id, contenu_id)
);
alter table public.contenus_lus enable row level security;
drop policy if exists "contenus_lus_soi" on public.contenus_lus;
create policy "contenus_lus_soi" on public.contenus_lus
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. Contenus de depart ----------------------------------------------------
-- Inseres une seule fois (si la table est vide). Tires des documents de
-- Justine : "Nutri conseils", plan des cours de nutrition, e-books.
do $$
begin
  if not exists (select 1 from public.contenus_nutrition) then

    insert into public.contenus_nutrition (type, titre, ordre) values
      ('citation', 'Que ton alimentation soit ta première médecine (Hippocrate)', 1),
      ('citation', 'Chaque réussite commence avec la volonté d''essayer', 2),
      ('citation', 'Dis-moi ce que tu manges et je te dirai qui tu es (Brillat-Savarin)', 3),
      ('citation', 'Tout est possible à qui rêve, ose, travaille et n''abandonne jamais (Xavier Dolan)', 4),
      ('citation', 'Un esprit sain dans un corps sain (Juvénal)', 5),
      ('citation', 'Ce n''est pas la force mais la persévérance qui fait les grandes œuvres (Samuel Johnson)', 6),
      ('citation', 'Change tes pensées et tu changeras ton monde (Norman Vincent Peale)', 7),
      ('citation', 'Regarde la distance déjà parcourue, pas la longueur du chemin qui reste', 8),
      ('citation', 'Tout changement est difficile au début, compliqué au milieu, et magnifique à la fin (Robin Sharma)', 9),
      ('citation', 'Ce qui compte, ce n''est pas ce que tu manges entre Noël et le Nouvel An, mais entre le Nouvel An et Noël', 10);

    insert into public.contenus_nutrition (type, titre, resume, ordre) values
      ('astuce', 'Plus la liste d''ingrédients est longue, moins le produit est qualitatif.', 'Les ingrédients sont classés du plus présent au moins présent : méfie-toi des listes qui commencent par sucre, beurre, huile ou graisses hydrogénées.', 1),
      ('astuce', 'Ne te fie pas au pourcentage de la valeur quotidienne.', 'Il est calculé sur les besoins d''un homme de 1,80 m et 75 kg : tes besoins sont différents.', 2),
      ('astuce', 'Pour comparer deux produits, regarde les valeurs pour 100 g.', 'C''est la seule base commune entre deux emballages de tailles différentes.', 3),
      ('astuce', 'Fuis les acides gras trans.', 'Ils signent un produit ultra-transformé.', 4),
      ('astuce', 'Limite les produits avec plus de 12 % d''acides gras saturés.', 'Au-delà, ils deviennent un risque pour la santé cardio-vasculaire.', 5),
      ('astuce', '50 g de sucre par jour maximum pour un adulte.', 'Une canette de soda en contient déjà 35 g. Sur l''étiquette, vise moins de 15 g de sucres pour 100 g.', 6),
      ('astuce', 'Pas plus de 6 g de sel par jour.', 'Sur l''étiquette, le sel est souvent indiqué en sodium : 1 g de sodium = 2,5 g de sel.', 7),
      ('astuce', 'Change une seule habitude à la fois.', 'Vouloir tout changer d''un coup fait perdre la motivation. Les petits pas sont la clé des habitudes qui durent.', 8);

    insert into public.contenus_nutrition (type, titre, resume, contenu, duree_min, ordre, statut) values
      ('cours', 'Comprendre une étiquette alimentaire', 'Les 7 réflexes pour décrypter un emballage en 30 secondes.',
'Il est souvent difficile de décrypter une étiquette : ça peut vite être un vrai casse-tête ! Voici quelques conseils.

1. Plus la liste des ingrédients est longue, moins le produit sera qualitatif. Les ingrédients sont classés par ordre décroissant : évite ceux dont la liste commence par « sucre », « beurre », « huile » ou « graisses hydrogénées », et ceux qui contiennent des noms difficilement compréhensibles (additifs, conservateurs…).

2. Ne te fie jamais au pourcentage de la valeur quotidienne : tout le monde a des besoins différents, et il se base sur ceux d''un homme de 1,80 m et 75 kg.

3. Regarde plutôt les valeurs pour 100 g si tu veux comparer plusieurs produits.

4. Fuis les aliments contenant des acides gras TRANS : ils sont ultra-transformés.

5. Limite les produits contenant plus de 12 % d''acides gras saturés du total énergétique : ils peuvent devenir un risque pour la santé cardio-vasculaire.

6. Limite au maximum les produits riches en sucres (saccharose, glucose, fructose… mention « dont sucres »). Qu''il soit d''origine naturelle ou non, la recommandation pour un adulte est de 50 g de sucre maximum par jour. Dans une canette de soda, il y en a déjà 35 g ! Vise moins de 15 g de sucres pour 100 g.

7. Le sel est souvent indiqué par la teneur en sodium : 2,5 g de sel = 1 g de sodium. Ne dépasse pas 6 g de sel par jour (2,4 g de sodium), les besoins physiologiques étant estimés à 2 g par jour.', 5, 9, 'publie');

    insert into public.contenus_nutrition (type, titre, ordre, statut) values
      ('cours', 'Les 8 groupes d''aliments', 1, 'brouillon'),
      ('cours', 'L''équilibre alimentaire et la pyramide', 2, 'brouillon'),
      ('cours', 'Les légumes', 3, 'brouillon'),
      ('cours', 'Le poisson et les fruits de mer', 4, 'brouillon'),
      ('cours', 'Les matières grasses : « bon » ou « mauvais » gras', 5, 'brouillon'),
      ('cours', 'Fruits, oléagineux et fruits secs', 6, 'brouillon'),
      ('cours', 'La viande : pour et contre', 7, 'brouillon'),
      ('cours', 'L''hydratation et les boissons idéales', 8, 'brouillon'),
      ('cours', 'Les légumes secs', 10, 'brouillon'),
      ('cours', 'Les féculents', 11, 'brouillon'),
      ('cours', 'La complémentarité des protéines', 12, 'brouillon'),
      ('cours', 'Les modes de cuisson', 13, 'brouillon'),
      ('cours', 'Les vitamines', 14, 'brouillon'),
      ('cours', 'Les minéraux', 15, 'brouillon'),
      ('cours', 'Décoder les allégations nutritionnelles', 16, 'brouillon'),
      ('cours', 'Les meilleurs antioxydants', 17, 'brouillon'),
      ('cours', 'Végétalisme et végétarisme', 18, 'brouillon'),
      ('cours', 'Les intolérances alimentaires', 19, 'brouillon'),
      ('cours', 'Le métabolisme de l''énergie', 20, 'brouillon'),
      ('cours', 'La cuisine placard', 21, 'brouillon'),
      ('cours', 'Les équivalences alimentaires', 22, 'brouillon'),
      ('cours', 'Les aliments transformés', 23, 'brouillon'),
      ('cours', 'Faim physiologique ou psychologique ?', 24, 'brouillon'),
      ('cours', 'Les épices', 25, 'brouillon'),
      ('cours', 'L''effet yoyo', 26, 'brouillon');

    insert into public.contenus_nutrition (type, titre, resume, prix_public, prix_abonnee, inclus, ordre, statut) values
      ('ebook', 'Nutrition & Sport', 'Les bases pour manger juste autour de tes séances.', 20, null, false, 1, 'publie'),
      ('ebook', 'Fitness grossesse', 'Garder la forme en douceur pendant la grossesse.', null, null, true, 2, 'brouillon'),
      ('ebook', 'Reprendre le sport après bébé', 'Le guide postnatal pour revenir pas à pas.', null, null, true, 3, 'brouillon'),
      ('ebook', 'Recettes estivales', '13 recettes fraîches et légères.', null, null, true, 4, 'brouillon');
  end if;

  if not exists (select 1 from public.recompenses) then
    insert into public.recompenses (titre, description, seuil_gouttes, ordre) values
      ('E-book Nutrition & Sport offert', 'Ta régularité vaut bien un cadeau : l''e-book de Justine (valeur 20 €).', 25, 1),
      ('Séance secrète de Justine', 'Une séance bonus réservée aux plus régulières.', 60, 2);
  end if;

  if not exists (select 1 from public.defis) then
    insert into public.defis (type, titre, description, mois, categorie, nombre, gouttes) values
      ('mission', '4 séances de mobilité', 'Prends soin de ton dos et de tes articulations ce mois-ci.', date_trunc('month', now())::date, 'Mobilité & Stretching', 4, 5),
      ('defi', 'Tenir la planche 2 minutes', 'Entraîne-toi avec le défi planche, puis valide quand tu y arrives.', date_trunc('month', now())::date, null, 1, 5);
  end if;
end $$;
