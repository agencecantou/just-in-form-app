export type Video = {
  id: string;
  titre: string;
  categories: string[];
  duree_min: number;
  niveau: string;
  vimeo_id: string;
  statut: "publie" | "brouillon";
  est_vedette: boolean;
  created_at: string;
};

export type SeanceTerminee = {
  id: string;
  video_id: string;
  utilisateur: string;
  termine_le: string;
  videos?: Pick<Video, "titre" | "categories">;
};

export type Programme = {
  id: string;
  titre: string;
  description: string;
  statut: "publie" | "brouillon";
  created_at: string;
};

export type ProgrammeVideo = {
  id: string;
  programme_id: string;
  video_id: string;
  ordre: number;
  videos?: Pick<Video, "id" | "titre" | "categories" | "duree_min" | "niveau" | "vimeo_id">;
};

// Liste de reference des categories de cours, dans l'ordre d'affichage.
export const CATEGORIES = [
  "Echauffement",
  "HIIT",
  "Pilates",
  "Animal Flow",
  "Piloxing",
  "Yoga",
  "Mix",
] as const;

export const NIVEAUX = ["Tous niveaux", "Debutant", "Intermediaire", "Avance"] as const;

// Identifiant client de demo, en attendant la vraie authentification.
export const UTILISATEUR_DEMO = "demo";
