-- Image par defaut pour chaque categorie, utilisee comme visuel de repli
-- pour les videos qui n'ont pas leur propre image.
alter table public.categories add column if not exists image_url text;
