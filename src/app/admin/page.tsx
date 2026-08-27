"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extraireVimeoId } from "@/lib/vimeo";
import type { Video } from "@/lib/types";

const CATEGORIES = ["HIIT", "Pilates", "Animal Flow", "Piloxing", "Yoga", "Nutrition"];
const NIVEAUX = ["Tous niveaux", "Debutant", "Intermediaire", "Avance"];

export default function Admin() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIES[0]);
  const [dureeMin, setDureeMin] = useState(20);
  const [niveau, setNiveau] = useState(NIVEAUX[0]);
  const [lienVimeo, setLienVimeo] = useState("");

  async function chargerVideos() {
    setChargement(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setErreur(error.message);
    else setVideos(data as Video[]);
    setChargement(false);
  }

  useEffect(() => {
    chargerVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ajouterVideo(
    e: React.MouseEvent<HTMLButtonElement>,
    statut: "publie" | "brouillon"
  ) {
    e.preventDefault();
    setErreur(null);

    const vimeoId = extraireVimeoId(lienVimeo);
    if (!vimeoId) {
      setErreur("Lien ou identifiant Vimeo invalide.");
      return;
    }
    if (!titre.trim()) {
      setErreur("Le titre est obligatoire.");
      return;
    }

    setEnvoi(true);
    const supabase = createClient();
    const { error } = await supabase.from("videos").insert({
      titre: titre.trim(),
      categorie,
      duree_min: dureeMin,
      niveau,
      vimeo_id: vimeoId,
      statut,
    });
    setEnvoi(false);

    if (error) {
      setErreur(error.message);
      return;
    }

    setTitre("");
    setLienVimeo("");
    setDureeMin(20);
    chargerVideos();
  }

  async function changerStatut(video: Video) {
    const nouveauStatut = video.statut === "publie" ? "brouillon" : "publie";
    const supabase = createClient();
    await supabase.from("videos").update({ statut: nouveauStatut }).eq("id", video.id);
    chargerVideos();
  }

  async function supprimerVideo(id: string) {
    const supabase = createClient();
    await supabase.from("videos").delete().eq("id", id);
    chargerVideos();
  }

  return (
    <div className="flex-1 flex">
      <aside className="hidden sm:flex w-56 flex-col gap-1 bg-anthracite text-creme px-4 py-6">
        <p className="mb-4 px-2 text-lg font-semibold">Espace coach</p>
        <a href="/admin" className="rounded-lg bg-orange px-3 py-2 text-sm font-medium text-anthracite">
          Mes videos
        </a>
        <a href="/app" className="rounded-lg px-3 py-2 text-sm text-creme/70 hover:bg-white/10">
          Voir cote abonnee
        </a>
      </aside>

      <main className="flex-1 px-6 py-8 max-w-3xl">
        <h1 className="text-2xl font-semibold mb-6">Ajouter une video</h1>

        <form className="rounded-2xl bg-white border border-creme-dark p-5 mb-8 space-y-4">
          <div>
            <label className="text-sm font-medium">Titre</label>
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : HIIT debutant 20 min"
              className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Categorie</label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Niveau</label>
              <select
                value={niveau}
                onChange={(e) => setNiveau(e.target.value)}
                className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
              >
                {NIVEAUX.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Duree (minutes)</label>
              <input
                type="number"
                min={1}
                value={dureeMin}
                onChange={(e) => setDureeMin(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Lien Vimeo</label>
              <input
                value={lienVimeo}
                onChange={(e) => setLienVimeo(e.target.value)}
                placeholder="https://vimeo.com/123456789"
                className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
              />
            </div>
          </div>

          {erreur && <p className="text-sm text-framboise">{erreur}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={envoi}
              onClick={(e) => ajouterVideo(e, "publie")}
              className="rounded-full bg-framboise text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Publier
            </button>
            <button
              type="button"
              disabled={envoi}
              onClick={(e) => ajouterVideo(e, "brouillon")}
              className="rounded-full border border-creme-dark px-5 py-2 text-sm disabled:opacity-50"
            >
              Enregistrer en brouillon
            </button>
          </div>
        </form>

        <h2 className="text-lg font-semibold mb-3">Mes videos</h2>
        {chargement ? (
          <p className="text-sm text-anthracite/50">Chargement...</p>
        ) : videos.length === 0 ? (
          <p className="text-sm text-anthracite/50">Aucune video pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {videos.map((v) => (
              <div
                key={v.id}
                className="rounded-xl bg-white border border-creme-dark p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{v.titre}</p>
                  <p className="text-sm text-anthracite/50">
                    {v.categorie} &middot; {v.duree_min} min &middot; {v.niveau}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      v.statut === "publie"
                        ? "bg-framboise-light text-framboise"
                        : "bg-creme-dark text-anthracite/60"
                    }`}
                  >
                    {v.statut === "publie" ? "Publiee" : "Brouillon"}
                  </span>
                  <button
                    onClick={() => changerStatut(v)}
                    className="text-xs underline text-anthracite/60"
                  >
                    {v.statut === "publie" ? "Depublier" : "Publier"}
                  </button>
                  <button
                    onClick={() => supprimerVideo(v.id)}
                    className="text-xs underline text-anthracite/40"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
