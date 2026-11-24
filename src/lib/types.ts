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
  avec_materiel: boolean;
  zones_corps: string[];
  /** 1 douce, 2 moderee, 3 intense (migration 011). */
  intensite?: number | null;
  objectifs?: string[] | null;
  alerte_sante?: string | null;
  created_at: string;
};

export const INTENSITES: Record<number, { label: string; couleur: string }> = {
  1: { label: "Douce", couleur: "#3f8f63" },
  2: { label: "Modérée", couleur: "#fab200" },
  3: { label: "Intense", couleur: "#c23a73" },
};

export const OBJECTIFS_VIDEO = [
  "Perte de poids",
  "Tonification",
  "Souplesse",
  "Reprise en douceur",
] as const;

export type ProfilSante = {
  objectif?: string;
  temps?: number;
  passe?: string;
  douleurs?: string[];
  enceinte?: boolean;
  vigilance?: string[];
  rappel?: string;
  consentement?: boolean;
};

export type Recompense = {
  id: string;
  titre: string;
  description: string;
  seuil_gouttes: number;
  lien_url: string | null;
  image_url: string | null;
  actif: boolean;
  ordre: number;
};

export type Defi = {
  id: string;
  type: "mission" | "defi";
  titre: string;
  description: string;
  mois: string;
  categorie: string | null;
  nombre: number;
  gouttes: number;
  actif: boolean;
};

export type ContenuNutrition = {
  id: string;
  type: "astuce" | "citation" | "conseil" | "recette" | "cours" | "ebook";
  titre: string;
  resume: string;
  contenu: string;
  image_url: string | null;
  lien_url: string | null;
  duree_min: number | null;
  tags: string[];
  prix_public: number | null;
  prix_abonnee: number | null;
  inclus: boolean;
  ordre: number;
  statut: "publie" | "brouillon";
  created_at: string;
};

export const ZONES_CORPS = ["Abdos", "Dos", "Haut du corps", "Bas du corps", "Full body"] as const;

export type Categorie = {
  id: string;
  nom: string;
  ordre: number;
  image_url: string | null;
  created_at: string;
};

// Image d'une video : la sienne si elle en a une, sinon celle de la
// premiere de ses categories qui possede une image par defaut.
export function imageEffectiveVideo(
  video: Pick<Video, "image_url" | "categories">,
  imagesParCategorie: Map<string, string | null>
): string | null {
  if (video.image_url) return video.image_url;
  for (const cat of video.categories ?? []) {
    const img = imagesParCategorie.get(cat);
    if (img) return img;
  }
  return null;
}

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
  photo_url?: string | null;
  preferences?: Record<string, unknown> | null;
  objectif_hebdo?: number | null;
  profil_sante?: ProfilSante | null;
  onboarding_fait?: boolean | null;
  pause_depuis?: string | null;
  pause_jusqu_au?: string | null;
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
  1: { emoji: "🥵", label: "Très dur" },
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
