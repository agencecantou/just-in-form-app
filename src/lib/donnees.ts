// Chargement des donnees communes a l'espace abonnee (profil + jeu).
// Tolerant : si une table de la migration 011 n'existe pas encore, on
// continue avec une liste vide plutot que de casser l'ecran.

import type { SupabaseClient } from "@supabase/supabase-js";
import { calculerJeu, type EtatJeu, type SeanceJeu } from "@/lib/jeu";
import type { Profile, ProfilSante } from "@/lib/types";

export type DonneesAbonnee = {
  userId: string | null;
  profil: Profile | null;
  prenom: string;
  estCoach: boolean;
  sante: ProfilSante;
  seances: SeanceJeu[];
  jeu: EtatJeu;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sur<T>(p: PromiseLike<{ data: any; error: unknown }>, defaut: T): Promise<T> {
  try {
    const { data, error } = await p;
    if (error || data === null || data === undefined) return defaut;
    return data as T;
  } catch {
    return defaut;
  }
}

export function objectifDepuisProfil(profil: Profile | null): number {
  if (profil?.objectif_hebdo) return profil.objectif_hebdo;
  const f = (profil?.preferences as { frequence?: string } | null)?.frequence;
  if (f?.startsWith("1")) return 1;
  if (f?.startsWith("3")) return 3;
  return 2;
}

export async function chargerAbonnee(supabase: SupabaseClient): Promise<DonneesAbonnee> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      profil: null,
      prenom: "",
      estCoach: false,
      sante: {},
      seances: [],
      jeu: calculerJeu({
        seances: [],
        objectifHebdo: 2,
        inscritLe: null,
        pauseDepuis: null,
        pauseJusquAu: null,
        defis: [],
        defisValides: [],
        lectures: [],
        programmes: [],
        recompenses: [],
      }),
    };
  }

  type LigneSeance = {
    video_id: string;
    termine_le: string;
    videos: { duree_min: number; categories: string[] } | null;
  };
  type LignePV = { programme_id: string; video_id: string; programmes: { id: string; titre: string; statut: string } | null };

  const [profil, seancesBrutes, defis, defisValides, lectures, pv, recompenses] = await Promise.all([
    sur<Profile | null>(supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(), null),
    sur<LigneSeance[]>(
      supabase.from("seances_terminees").select("video_id, termine_le, videos(duree_min, categories)").eq("user_id", user.id),
      []
    ),
    sur(supabase.from("defis").select("*").eq("actif", true), []),
    sur<{ defi_id: string; valide_le: string }[]>(
      supabase.from("defis_valides").select("defi_id, valide_le").eq("user_id", user.id),
      []
    ),
    sur<{ lu_le: string }[]>(supabase.from("contenus_lus").select("lu_le").eq("user_id", user.id), []),
    sur<LignePV[]>(supabase.from("programme_videos").select("programme_id, video_id, programmes(id, titre, statut)"), []),
    sur(supabase.from("recompenses").select("*").eq("actif", true), []),
  ]);

  const seances: SeanceJeu[] = seancesBrutes.map((s) => ({
    video_id: s.video_id,
    termine_le: s.termine_le,
    duree_min: s.videos?.duree_min ?? 0,
    categories: s.videos?.categories ?? [],
  }));

  const parProgramme = new Map<string, { id: string; titre: string; videoIds: string[] }>();
  for (const l of pv) {
    if (!l.programmes || l.programmes.statut !== "publie") continue;
    const p = parProgramme.get(l.programme_id) ?? { id: l.programme_id, titre: l.programmes.titre, videoIds: [] };
    p.videoIds.push(l.video_id);
    parProgramme.set(l.programme_id, p);
  }

  const jeu = calculerJeu({
    seances,
    objectifHebdo: objectifDepuisProfil(profil),
    inscritLe: profil?.created_at ?? user.created_at ?? null,
    pauseDepuis: profil?.pause_depuis ?? null,
    pauseJusquAu: profil?.pause_jusqu_au ?? null,
    defis: defis as EtatJeu["defis"],
    defisValides,
    lectures,
    programmes: [...parProgramme.values()],
    recompenses: recompenses as EtatJeu["recompenses"],
  });

  return {
    userId: user.id,
    profil,
    prenom: profil?.prenom || user.email?.split("@")[0] || "",
    estCoach: profil?.role === "coach",
    sante: (profil?.profil_sante as ProfilSante) ?? {},
    seances,
    jeu,
  };
}

// Alerte a afficher sur une video selon le profil sante de l'abonnee.
export function alerteVideo(
  video: { intensite?: number | null; alerte_sante?: string | null; zones_corps?: string[] },
  sante: ProfilSante
): string | null {
  if (video.alerte_sante) return video.alerte_sante;
  const intense = (video.intensite ?? 2) >= 3;
  if (intense && sante.enceinte) return "Cardio intense : à éviter pendant la grossesse";
  if (intense && sante.vigilance && sante.vigilance.length > 0) return "Séance intense : demande l'avis de ton médecin";
  const douleurs = sante.douleurs ?? [];
  if (intense && douleurs.includes("Genoux") && video.zones_corps?.includes("Bas du corps"))
    return "Attention à tes genoux : choisis les options douces";
  if (intense && douleurs.includes("Dos")) return "Garde le dos protégé : choisis les options douces";
  return null;
}
