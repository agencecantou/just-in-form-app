export type Video = {
  id: string;
  titre: string;
  categorie: string;
  duree_min: number;
  niveau: string;
  vimeo_id: string;
  statut: "publie" | "brouillon";
  created_at: string;
};

export type SeanceTerminee = {
  id: string;
  video_id: string;
  utilisateur: string;
  termine_le: string;
  videos?: Pick<Video, "titre" | "categorie">;
};

// Identifiant client de demo, en attendant la vraie authentification.
export const UTILISATEUR_DEMO = "demo";
