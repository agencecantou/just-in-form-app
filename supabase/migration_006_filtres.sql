-- Migration 006 : filtres video demandes par Justine (materiel, zones du
-- corps). A coller dans Supabase > SQL Editor > New query, puis "Run".

alter table public.videos add column if not exists avec_materiel boolean not null default false;
alter table public.videos add column if not exists zones_corps text[] not null default '{}'::text[];
