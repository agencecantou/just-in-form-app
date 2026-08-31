"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ZONES_CORPS, imageEffectiveVideo, type Categorie, type Video } from "@/lib/types";
import CarteVideo from "@/components/CarteVideo";
import LecteurVideo from "@/components/LecteurVideo";

type FiltreDuree = "toutes" | "court" | "moyen" | "long" | "tres-long";
type FiltreMateriel = "tous" | "sans" | "avec";

const FILTRES_DUREE: { valeur: FiltreDuree; label: string }[] = [
  { valeur: "toutes", label: "Toutes durées" },
  { valeur: "court", label: "< 15 min" },
  { valeur: "moyen", label: "15 à 30 min" },
  { valeur: "long", label: "30 à 45 min" },
  { valeur: "tres-long", label: "> 45 min" },
];

function correspondDuree(video: Video, filtre: FiltreDuree) {
  if (filtre === "toutes") return true;
  if (filtre === "court") return video.duree_min < 15;
  if (filtre === "moyen") return video.duree_min >= 15 && video.duree_min <= 30;
  if (filtre === "long") return video.duree_min > 30 && video.duree_min <= 45;
  return video.duree_min > 45;
}

function correspondMateriel(video: Video, filtre: FiltreMateriel) {
  if (filtre === "tous") return true;
  if (filtre === "sans") return !video.avec_materiel;
  return video.avec_materiel;
}

// Regroupe les ressentis par video et garde la valeur la plus frequente.
function calculerRessentiParVideo(ressentis: { video_id: string; valeur: number }[]) {
  const parVideo = new Map<string, number[]>();
  for (const r of ressentis) {
    const liste = parVideo.get(r.video_id) ?? [];
    liste.push(r.valeur);
    parVideo.set(r.video_id, liste);
  }
  const resultat = new Map<string, { valeur: number; total: number }>();
  for (const [videoId, valeurs] of parVideo) {
    const comptes = new Map<number, number>();
    for (const v of valeurs) comptes.set(v, (comptes.get(v) ?? 0) + 1);
    let valeurDominante = valeurs[0];
    let max = 0;
    for (const [v, c] of comptes) {
      if (c > max) {
        max = c;
        valeurDominante = v;
      }
    }
    resultat.set(videoId, { valeur: valeurDominante, total: valeurs.length });
  }
  return resultat;
}

export default function SeancesPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [videoOuverte, setVideoOuverte] = useState<Video | null>(null);
  const [terminees, setTerminees] = useState<Set<string>>(new Set());
  const [ressentiParVideo, setRessentiParVideo] = useState<
    Map<string, { valeur: number; total: number }>
  >(new Map());
  const [progressionParVideo, setProgressionParVideo] = useState<Map<string, number>>(new Map());
  const [filtreCategorie, setFiltreCategorie] = useState<string | null>(null);
  const [filtreDuree, setFiltreDuree] = useState<FiltreDuree>("toutes");
  const [filtreMateriel, setFiltreMateriel] = useState<FiltreMateriel>("tous");
  const [filtreZone, setFiltreZone] = useState<string | null>(null);
  const [cacherTerminees, setCacherTerminees] = useState(false);

  async function charger() {
    setChargement(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [
      { data: videosData },
      { data: seancesData },
      { data: ressentisData },
      { data: categoriesData },
      { data: progressionData },
    ] = await Promise.all([
      supabase.from("videos").select("*").eq("statut", "publie").order("created_at", { ascending: false }),
      user
        ? supabase.from("seances_terminees").select("video_id").eq("user_id", user.id)
        : Promise.resolve({ data: [] as { video_id: string }[] }),
      supabase.from("ressentis").select("video_id, valeur"),
      supabase.from("categories").select("*").order("ordre", { ascending: true }),
      user
        ? supabase.from("progression_videos").select("video_id, position_secondes").eq("user_id", user.id)
        : Promise.resolve({ data: [] as { video_id: string; position_secondes: number }[] }),
    ]);

    const toutesVideos = (videosData as Video[]) ?? [];
    setVideos(toutesVideos);
    const seances = (seancesData ?? []) as { video_id: string }[];
    setTerminees(new Set(seances.map((s) => s.video_id)));
    setRessentiParVideo(calculerRessentiParVideo(ressentisData ?? []));
    setCategories((categoriesData as Categorie[]) ?? []);

    const progressionMap = new Map<string, number>();
    for (const p of (progressionData ?? []) as { video_id: string; position_secondes: number }[]) {
      const video = toutesVideos.find((v) => v.id === p.video_id);
      if (video) {
        progressionMap.set(p.video_id, Math.min(100, Math.round((p.position_secondes / 60 / Math.max(1, video.duree_min)) * 100)));
      }
    }
    setProgressionParVideo(progressionMap);

    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  const imagesParCategorie = new Map(categories.map((c) => [c.nom, c.image_url]));

  const videosAffichees = videos.filter(
    (v) =>
      (!filtreCategorie || v.categories?.includes(filtreCategorie)) &&
      (!filtreZone || v.zones_corps?.includes(filtreZone)) &&
      correspondDuree(v, filtreDuree) &&
      correspondMateriel(v, filtreMateriel) &&
      (!cacherTerminees || !terminees.has(v.id))
  );

  return (
    <main className="flex-1 px-6 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Les séances</h1>
      <p className="text-anthracite/60 mb-6">Filtre par discipline, durée ou niveau</p>

      {chargement ? (
        <p className="text-sm text-anthracite/50">Chargement...</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              onClick={() => setFiltreCategorie(null)}
              className={`rounded-full px-3 py-1.5 text-sm border ${
                filtreCategorie === null
                  ? "bg-anthracite text-white border-anthracite"
                  : "bg-white text-anthracite/70 border-creme-dark"
              }`}
            >
              Toutes
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFiltreCategorie(c.nom)}
                className={`rounded-full px-3 py-1.5 text-sm border ${
                  filtreCategorie === c.nom
                    ? "bg-framboise text-white border-framboise"
                    : "bg-white text-anthracite/70 border-creme-dark"
                }`}
              >
                {c.nom}
              </button>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {FILTRES_DUREE.map((f) => (
              <button
                key={f.valeur}
                onClick={() => setFiltreDuree(f.valeur)}
                className={`rounded-full px-3 py-1.5 text-xs border ${
                  filtreDuree === f.valeur
                    ? "bg-orange text-anthracite border-orange font-medium"
                    : "bg-white text-anthracite/60 border-creme-dark"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {(
              [
                { valeur: "tous", label: "Matériel : tous" },
                { valeur: "sans", label: "Sans matériel" },
                { valeur: "avec", label: "Avec matériel" },
              ] as const
            ).map((f) => (
              <button
                key={f.valeur}
                onClick={() => setFiltreMateriel(f.valeur)}
                className={`rounded-full px-3 py-1.5 text-xs border ${
                  filtreMateriel === f.valeur
                    ? "bg-orange text-anthracite border-orange font-medium"
                    : "bg-white text-anthracite/60 border-creme-dark"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              onClick={() => setFiltreZone(null)}
              className={`rounded-full px-3 py-1.5 text-xs border ${
                filtreZone === null
                  ? "bg-anthracite text-white border-anthracite"
                  : "bg-white text-anthracite/60 border-creme-dark"
              }`}
            >
              Toutes zones
            </button>
            {ZONES_CORPS.map((z) => (
              <button
                key={z}
                onClick={() => setFiltreZone(z)}
                className={`rounded-full px-3 py-1.5 text-xs border ${
                  filtreZone === z
                    ? "bg-anthracite text-white border-anthracite"
                    : "bg-white text-anthracite/60 border-creme-dark"
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          <label className="mb-6 flex items-center gap-2 text-sm text-anthracite/70">
            <input
              type="checkbox"
              checked={cacherTerminees}
              onChange={(e) => setCacherTerminees(e.target.checked)}
            />
            Cacher les séances déjà terminées
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {videosAffichees.map((v) => (
              <CarteVideo
                key={v.id}
                video={v}
                terminee={terminees.has(v.id)}
                ressenti={ressentiParVideo.get(v.id)}
                progression={progressionParVideo.get(v.id)}
                image={imageEffectiveVideo(v, imagesParCategorie)}
                onClick={() => setVideoOuverte(v)}
              />
            ))}
            {videosAffichees.length === 0 && (
              <p className="text-sm text-anthracite/50">
                Aucune séance ne correspond à ces filtres pour le moment.
              </p>
            )}
          </div>
        </>
      )}

      {videoOuverte && (
        <LecteurVideo video={videoOuverte} onFermer={() => setVideoOuverte(null)} onTerminee={charger} />
      )}
    </main>
  );
}
