export type Video = {
  id: string;
  titre: string;
  description: string | null;
  image_url: string | null;
  categories: string[];
  duree_min: number;
  niveau: string;
  vimeo_id: string;
  statut: "publie" | "brouillon";
  est_vedette: boolean;
  vues: number;
  created_at: string;
};

export type Categorie = {
  id: string;
  nom: string;
  ordre: number;
  created_at: string;
};

export type SeanceTerminee = {
  id: string;
  video_id: string;
  utilisateur: string;
  user_id?: string | null;
  termine_le: string;
  videos?: Pick<Video, "titre" | "categories" | "niveau">;
};

export type Profile = {
  id: string;
  email: string | null;
  prenom: string | null;
  role: "abonnee" | "coach";
  created_at: string;
};

export type Ressenti = {
  id: string;
  video_id: string;
  user_id: string;
  valeur: number;
  created_at: string;
};

export type Avis = {
  id: string;
  video_id: string | null;
  user_id: string | null;
  message: string;
  created_at: string;
  videos?: Pick<Video, "titre">;
  profiles?: Pick<Profile, "prenom" | "email">;
};

// 4 emojis de ressenti apres une seance, du plus dur au plus facile.
export const RESSENTIS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "🥵", label: "Tres dur" },
  2: { emoji: "😓", label: "Difficile" },
  3: { emoji: "🙂", label: "Normal" },
  4: { emoji: "😌", label: "Facile" },
};

export type Programme = {
  id: string;
  titre: string;
  description: string;
  statut: "publie" | "brouillon";
  est_lancement: boolean;
  created_at: string;
};

export type ProgrammeVideo = {
  id: string;
  programme_id: string;
  video_id: string;
  ordre: number;
  videos?: Pick<Video, "id" | "titre" | "categories" | "duree_min" | "niveau" | "vimeo_id">;
};

export const NIVEAUX = ["Tous niveaux", "Debutant", "Intermediaire", "Avance"] as const;

// Identifiant client de demo, en attendant la vraie authentification.
export const UTILISATEUR_DEMO = "demo";
