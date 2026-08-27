"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { urlEmbedVimeo } from "@/lib/vimeo";
import { CATEGORIES, UTILISATEUR_DEMO, type Video } from "@/lib/types";

export default function AppHome() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [chargement, setChargement] = useState(true);
  const [videoOuverte, setVideoOuverte] = useState<Video | null>(null);
  const [terminees, setTerminees] = useState<Set<string>>(new Set());
  const [filtre, setFiltre] = useState<string | null>(null);

  async function charger() {
    setChargement(true);
    const supabase = createClient();
    const [{ data: videosData }, { data: seancesData }] = await Promise.all([
      supabase
        .from("videos")
        .select("*")
        .eq("statut", "publie")
        .order("created_at", { ascending: false }),
      supabase
        .from("seances_terminees")
        .select("video_id")
        .eq("utilisateur", UTILISATEUR_DEMO),
    ]);

    setVideos((videosData as Video[]) ?? []);
    setTerminees(new Set((seancesData ?? []).map((s) => s.video_id as string)));
    setChargement(false);
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function marquerTerminee(video: Video) {
    const supabase = createClient();
    await supabase
      .from("seances_terminees")
      .insert({ video_id: video.id, utilisateur: UTILISATEUR_DEMO });
    setTerminees((prev) => new Set(prev).add(video.id));
    setVideoOuverte(null);
  }

  const videosVedette = videos.filter((v) => v.est_vedette);
  const videosAffichees = filtre
    ? videos.filter((v) => v.categories?.includes(filtre))
    : videos;

  return (
    <>
      <main className="flex-1 px-6 py-8 max-w-4xl">
        <h1 className="text-2xl font-semibold mb-1">Salut ! 👋</h1>
        <p className="text-anthracite/60 mb-6">
          {terminees.size} seance{terminees.size > 1 ? "s" : ""} terminee
          {terminees.size > 1 ? "s" : ""}, continue comme ca.
        </p>

        {chargement ? (
          <p className="text-sm text-anthracite/50">Chargement...</p>
        ) : videos.length === 0 ? (
          <div className="rounded-2xl bg-orange-light p-5">
            <p className="font-medium">Aucune seance publiee pour le moment</p>
            <p className="text-sm text-anthracite/60">
              Ajoute une video depuis l&apos;espace coach pour la voir apparaitre ici.
            </p>
          </div>
        ) : (
          <>
            {videosVedette.length > 0 && !filtre && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-anthracite/60 mb-3">
                  ★ Recommandees pour toi
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videosVedette.map((v) => (
                    <CarteVideo
                      key={v.id}
                      video={v}
                      terminee={terminees.has(v.id)}
                      onClick={() => setVideoOuverte(v)}
                      accent
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFiltre(null)}
                className={`rounded-full px-3 py-1.5 text-sm border ${
                  filtre === null
                    ? "bg-anthracite text-white border-anthracite"
                    : "bg-white text-anthracite/70 border-creme-dark"
                }`}
              >
                Toutes
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setFiltre(c)}
                  className={`rounded-full px-3 py-1.5 text-sm border ${
                    filtre === c
                      ? "bg-framboise text-white border-framboise"
                      : "bg-white text-anthracite/70 border-creme-dark"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videosAffichees.map((v) => (
                <CarteVideo
                  key={v.id}
                  video={v}
                  terminee={terminees.has(v.id)}
                  onClick={() => setVideoOuverte(v)}
                />
              ))}
              {videosAffichees.length === 0 && (
                <p className="text-sm text-anthracite/50">
                  Aucune seance dans cette categorie pour le moment.
                </p>
              )}
            </div>
          </>
        )}
      </main>

      {videoOuverte && (
        <LecteurVideo
          video={videoOuverte}
          onFermer={() => setVideoOuverte(null)}
          onTerminee={() => marquerTerminee(videoOuverte)}
        />
      )}
    </>
  );
}

function CarteVideo({
  video,
  terminee,
  onClick,
  accent,
}: {
  video: Video;
  terminee: boolean;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border p-4 transition ${
        accent
          ? "bg-framboise text-white border-framboise"
          : "bg-white border-creme-dark hover:border-framboise/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <p className={`text-xs font-medium ${accent ? "text-white/80" : "text-framboise"}`}>
          {video.categories?.join(" · ")}
        </p>
        {terminee && (
          <span className={`text-xs ${accent ? "text-white/70" : "text-anthracite/40"}`}>
            ✓ Terminee
          </span>
        )}
      </div>
      <p className="font-semibold">{video.titre}</p>
      <p className={`text-sm ${accent ? "text-white/70" : "text-anthracite/50"}`}>
        {video.duree_min} min &middot; {video.niveau}
      </p>
    </button>
  );
}

export function LecteurVideo({
  video,
  onFermer,
  onTerminee,
}: {
  video: Video;
  onFermer: () => void;
  onTerminee: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-anthracite/80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full">
        <div className="aspect-video bg-anthracite">
          <iframe
            src={urlEmbedVimeo(video.vimeo_id)}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold">{video.titre}</p>
            <p className="text-sm text-anthracite/50">
              {video.categories?.join(", ")} &middot; {video.duree_min} min
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onTerminee}
              className="rounded-full bg-framboise text-white px-4 py-2 text-sm font-semibold"
            >
              Marquer comme terminee
            </button>
            <button
              onClick={onFermer}
              className="rounded-full border border-creme-dark px-4 py-2 text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
