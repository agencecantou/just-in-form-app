-- Migration 012 : import des videos de just-in-form.fr (Methode CRAME et sous-pages).
-- A lancer APRES la migration 011. Rejouable : une video deja presente (meme
-- identifiant Vimeo) n'est pas ajoutee une deuxieme fois.
-- Les LIVE Pilates non repertories sur Vimeo arrivent en brouillon : il faut
-- coller leur lien prive complet dans l'espace coach (Modifier) avant de les publier.

begin;

-- Categories manquantes
insert into public.categories (nom, ordre) values ('Echauffement', 100) on conflict (nom) do nothing;
insert into public.categories (nom, ordre) values ('Pilates', 101) on conflict (nom) do nothing;
insert into public.categories (nom, ordre) values ('Animal Flow', 102) on conflict (nom) do nothing;
insert into public.categories (nom, ordre) values ('Renforcement', 103) on conflict (nom) do nothing;
insert into public.categories (nom, ordre) values ('Mix', 104) on conflict (nom) do nothing;
insert into public.categories (nom, ordre) values ('Piloxing', 105) on conflict (nom) do nothing;
insert into public.categories (nom, ordre) values ('HIIT', 106) on conflict (nom) do nothing;
insert into public.categories (nom, ordre) values ('Mobilité & Stretching', 107) on conflict (nom) do nothing;
insert into public.categories (nom, ordre) values ('Challenge', 108) on conflict (nom) do nothing;
insert into public.categories (nom, ordre) values ('Tutos & conseils', 109) on conflict (nom) do nothing;

-- Videos
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Échauffement 3', array['Echauffement']::text[], 'Tous niveaux', 5, '466356234', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '466356234');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Échauffement 4', array['Echauffement']::text[], 'Tous niveaux', 5, '466364383', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '466364383');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Échauffement 5 Full body', array['Echauffement']::text[], 'Tous niveaux', 6, '513107072', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '513107072');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Échauffement Haut du corps', array['Echauffement']::text[], 'Tous niveaux', 4, '474427003', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '474427003');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Échauffement Pilates avec Swissball', array['Echauffement','Pilates']::text[], 'Tous niveaux', 16, '476465324', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '476465324');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Animal Flow #1', array['Animal Flow']::text[], 'Tous niveaux', 17, '1131486406', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '1131486406');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Séance de démarrage en Pilates', array['Pilates']::text[], 'Debutant', 48, '757115408', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '757115408');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Initiation Pilates #1', array['Pilates']::text[], 'Debutant', 18, '469744704', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '469744704');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pilates #2', array['Pilates']::text[], 'Tous niveaux', 22, '465488696', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '465488696');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pilates #3', array['Pilates']::text[], 'Tous niveaux', 17, '470076089', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '470076089');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pilates #4', array['Pilates']::text[], 'Tous niveaux', 21, '469205970', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '469205970');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pilates #5', array['Pilates']::text[], 'Tous niveaux', 15, '469285271', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '469285271');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pilates #6', array['Pilates']::text[], 'Tous niveaux', 18, '471763756', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '471763756');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pilates avec Swissball #1', array['Pilates']::text[], 'Tous niveaux', 17, '476484506', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '476484506');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Abdos avec Swissball', array['Pilates','Renforcement']::text[], 'Tous niveaux', 15, '504555141', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '504555141');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #1', array['Pilates']::text[], 'Tous niveaux', 41, '478235003', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '478235003');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #2', array['Pilates']::text[], 'Tous niveaux', 36, '476776446', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '476776446');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #3', array['Pilates']::text[], 'Tous niveaux', 48, '481599141', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '481599141');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #4', array['Pilates']::text[], 'Tous niveaux', 54, '484228882', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '484228882');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #5', array['Pilates']::text[], 'Tous niveaux', 53, '486709308', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '486709308');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #6', array['Pilates']::text[], 'Tous niveaux', 53, '489932470', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '489932470');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #7', array['Pilates']::text[], 'Tous niveaux', 55, '491784947', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '491784947');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #8', array['Pilates']::text[], 'Tous niveaux', 59, '498125619', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '498125619');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #9', array['Pilates']::text[], 'Tous niveaux', 47, '501023816', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '501023816');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #10', array['Pilates']::text[], 'Tous niveaux', 58, '503068924', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '503068924');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #11', array['Pilates']::text[], 'Tous niveaux', 58, '505859914', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '505859914');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #12', array['Pilates']::text[], 'Tous niveaux', 60, '508949790', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '508949790');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #13', array['Pilates']::text[], 'Tous niveaux', 57, '511278636', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '511278636');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #14', array['Pilates']::text[], 'Tous niveaux', 44, '516859211', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '516859211');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #15', array['Pilates']::text[], 'Tous niveaux', 40, '520401205', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '520401205');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #16', array['Pilates']::text[], 'Tous niveaux', 58, '522851739', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '522851739');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #17', array['Pilates']::text[], 'Tous niveaux', 59, '526681037', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '526681037');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #19', array['Pilates']::text[], 'Tous niveaux', 47, '531977191', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '531977191');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #20', array['Pilates']::text[], 'Tous niveaux', 54, '537475682', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '537475682');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #21', array['Pilates']::text[], 'Tous niveaux', 48, '540823404', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '540823404');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #22', array['Pilates']::text[], 'Tous niveaux', 54, '543605625', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '543605625');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #24', array['Pilates']::text[], 'Tous niveaux', 48, '553506750', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '553506750');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #25', array['Pilates']::text[], 'Tous niveaux', 55, '556416481', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '556416481');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Pilates #26', array['Pilates']::text[], 'Tous niveaux', 56, '559702264', 'brouillon', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '559702264');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pilates avec accessoire : le rouleau #1', array['Pilates']::text[], 'Tous niveaux', 25, '644266106', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '644266106');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pilates avec accessoire : le petit ballon #1', array['Pilates']::text[], 'Tous niveaux', 32, '664247464', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '664247464');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Initiation au Postural Ball avec Gaëlle', array['Pilates']::text[], 'Debutant', 44, '540959427', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '540959427');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Renforcement haut du corps #1', array['Renforcement']::text[], 'Tous niveaux', 15, '474448130', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '474448130');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Renforcement bas du corps #1 (cuisses, abdos, fessiers)', array['Renforcement']::text[], 'Tous niveaux', 15, '476014353', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '476014353');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Renforcement bas du corps #1', array['Renforcement']::text[], 'Tous niveaux', 34, '476693730', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '476693730');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Gainage #1', array['Renforcement']::text[], 'Tous niveaux', 34, '480014133', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '480014133');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE EMOM Full body #1', array['Renforcement','Mix']::text[], 'Tous niveaux', 24, '498129263', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '498129263');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'LIVE Renforcement haut du corps #1', array['Renforcement']::text[], 'Tous niveaux', 30, '498138994', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '498138994');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'PowerSculpt by Piloxing', array['Piloxing','Renforcement']::text[], 'Tous niveaux', 14, '467467572', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '467467572');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Renforcement des bras', array['Renforcement']::text[], 'Tous niveaux', 11, '536852696', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '536852696');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Renforcement sur chaise', array['Renforcement','Pilates']::text[], 'Tous niveaux', 35, '546686660', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '546686660');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Renforcement bas du corps #2', array['Renforcement']::text[], 'Tous niveaux', 43, '718037747', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '718037747');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'H.I.I.T #1', array['HIIT']::text[], 'Tous niveaux', 19, '465019958', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '465019958');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'H.I.I.T #2', array['HIIT']::text[], 'Tous niveaux', 15, '469566294', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '469566294');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'H.I.I.T #3 avec Marina', array['HIIT']::text[], 'Tous niveaux', 23, '490492928', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '490492928');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'TABATA #1 avec Gaëlle', array['HIIT']::text[], 'Tous niveaux', 31, '488018204', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '488018204');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'TABATA #2', array['HIIT']::text[], 'Tous niveaux', 24, '504552800', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '504552800');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pyramidal #1', array['HIIT']::text[], 'Tous niveaux', 28, '467924322', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '467924322');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pyramidal #2 avec Gaëlle', array['HIIT']::text[], 'Tous niveaux', 35, '493101367', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '493101367');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Pyramidal #3', array['HIIT']::text[], 'Tous niveaux', 26, '513109018', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '513109018');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Zumba Christmas Party', array['Mix']::text[], 'Tous niveaux', 42, '494414492', 'publie', 2, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '494414492');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Piloxing #6', array['Piloxing']::text[], 'Tous niveaux', 20, '468852931', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '468852931');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Piloxing KO avec Marina', array['Piloxing']::text[], 'Tous niveaux', 27, '488604589', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '488604589');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Mobilité & Stretching #1', array['Mobilité & Stretching']::text[], 'Tous niveaux', 14, '465946283', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '465946283');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Stretching #2', array['Mobilité & Stretching']::text[], 'Tous niveaux', 5, '467101462', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '467101462');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Stretching #3', array['Mobilité & Stretching']::text[], 'Tous niveaux', 5, '467079400', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '467079400');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Stretching du dos #4', array['Mobilité & Stretching']::text[], 'Tous niveaux', 23, '498873659', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '498873659');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Mobilité du bassin et des épaules #5', array['Mobilité & Stretching']::text[], 'Tous niveaux', 40, '529785882', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '529785882');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Étirements des lombaires #6', array['Mobilité & Stretching']::text[], 'Tous niveaux', 11, '572098445', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '572098445');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Vaincre la raideur du bassin', array['Mobilité & Stretching']::text[], 'Tous niveaux', 11, '572146745', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '572146745');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Stretch du dos avec le gros ballon', array['Mobilité & Stretching']::text[], 'Tous niveaux', 14, '705281649', 'publie', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '705281649');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Challenge #1 : Planche', array['Challenge']::text[], 'Tous niveaux', 4, '469552146', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '469552146');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Challenge #2 : en duo', array['Challenge']::text[], 'Tous niveaux', 9, '476910200', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '476910200');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Challenge #3 : en duo', array['Challenge']::text[], 'Tous niveaux', 6, '479364866', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '479364866');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Challenge #4 : Danse', array['Challenge']::text[], 'Tous niveaux', 24, '501143265', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '501143265');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Challenge #5 : Défi planche', array['Challenge']::text[], 'Tous niveaux', 1, '516862334', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '516862334');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Challenge #6 : Abdos en feu', array['Challenge']::text[], 'Tous niveaux', 11, '685459397', 'publie', 3, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '685459397');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Parlons sport, parlons santé', array['Tutos & conseils']::text[], 'Tous niveaux', 13, '488218270', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '488218270');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Que faire pour perdre du poids ?', array['Tutos & conseils']::text[], 'Tous niveaux', 18, '490494035', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '490494035');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Le sport à la maison', array['Tutos & conseils']::text[], 'Tous niveaux', 13, '493124863', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '493124863');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : les pompes (push up)', array['Tutos & conseils']::text[], 'Tous niveaux', 1, '467703580', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '467703580');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : la chandelle (roll over)', array['Tutos & conseils']::text[], 'Tous niveaux', 2, '467411359', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '467411359');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : le grimpeur (mountain climber)', array['Tutos & conseils']::text[], 'Tous niveaux', 1, '467179071', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '467179071');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : le grimpeur (mountain climber) en détail', array['Tutos & conseils']::text[], 'Tous niveaux', 10, '488607086', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '488607086');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : le pont (shoulder bridge)', array['Tutos & conseils']::text[], 'Tous niveaux', 9, '486309896', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '486309896');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : le jumping jack', array['Tutos & conseils']::text[], 'Tous niveaux', 9, '486300405', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '486300405');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : l''oiseau (butterfly)', array['Tutos & conseils']::text[], 'Tous niveaux', 8, '486590329', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '486590329');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : le crunch', array['Tutos & conseils']::text[], 'Tous niveaux', 10, '487017550', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '487017550');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : la planche (plank)', array['Tutos & conseils']::text[], 'Tous niveaux', 10, '488226088', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '488226088');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : le superwoman', array['Tutos & conseils']::text[], 'Tous niveaux', 9, '490492412', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '490492412');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : le hollow body', array['Tutos & conseils']::text[], 'Tous niveaux', 11, '490491699', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '490491699');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : les burpees', array['Tutos & conseils']::text[], 'Tous niveaux', 10, '490491086', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '490491086');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : les dips', array['Tutos & conseils']::text[], 'Tous niveaux', 10, '491083494', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '491083494');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : les fentes (lunges)', array['Tutos & conseils']::text[], 'Tous niveaux', 7, '491083548', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '491083548');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : le russian twist', array['Tutos & conseils']::text[], 'Tous niveaux', 8, '491701797', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '491701797');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : le sit up', array['Tutos & conseils']::text[], 'Tous niveaux', 11, '493351779', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '493351779');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : le moulin à vent (windmill)', array['Tutos & conseils']::text[], 'Tous niveaux', 11, '493924042', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '493924042');
insert into public.videos (titre, categories, niveau, duree_min, vimeo_id, statut, intensite, zones_corps, avec_materiel, est_vedette)
select 'Tuto : les ciseaux', array['Tutos & conseils']::text[], 'Tous niveaux', 10, '494112096', 'brouillon', 1, '{}'::text[], false, false
where not exists (select 1 from public.videos where split_part(vimeo_id, ':', 1) = '494112096');

commit;
