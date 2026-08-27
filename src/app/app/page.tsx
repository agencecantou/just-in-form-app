"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { urlEmbedVimeo } from "@/lib/vimeo";
import { UTILISATEUR_DEMO, type Video } from "@/lib/types";

export default function AppHome() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [chargement, setChargement] = useState(true);
  const [videoOuverte, setVideoOuverte] = useState<Video | null>(null);
  const [terminees, setTerminees] = useState<Set<string>>(new Set());

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

  return (
    <div className="flex-1 flex">
      <aside className="hidden sm:flex w-56 flex-col gap-1 border-r border-creme-dark bg-white px-4 py-6">
        <p className="mb-4 px-2 text-lg font-semibold text-framboise">
          Just In Form
        </p>
        <a href="/app" className="rounded-lg bg-framboise-light px-3 py-2 text-sm font-medium text-framboise">
          Seances
        </a>
        <a href="/compte" className="rounded-lg px-3 py-2 text-sm text-anthracite/70 hover:bg-creme">
          Mon compte
        </a>
        <a href="/admin" className="mt-auto rounded-lg px-3 py-2 text-sm text-anthracite/40 hover:bg-creme">
          Espace coach
        </a>
      </aside>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((v) => (
              <button
                key={v.id}
                onClick={() => setVideoOuverte(v)}
                className="text-left rounded-2xl bg-white border border-creme-dark p-4 hover:border-framboise/50 transition"
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs text-framboise font-medium">{v.categorie}</p>
                  {terminees.has(v.id) && (
                    <span className="text-xs text-anthracite/40">✓ Terminee</span>
                  )}
                </div>
                <p className="font-semibold">{v.titre}</p>
                <p className="text-sm text-anthracite/50">
                  {v.duree_min} min &middot; {v.niveau}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>

      {videoOuverte && (
        <div className="fixed inset-0 bg-anthracite/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full">
            <div className="aspect-video bg-anthracite">
              <iframe
                src={urlEmbedVimeo(videoOuverte.vimeo_id)}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{videoOuverte.titre}</p>
                <p className="text-sm text-anthracite/50">
                  {videoOuverte.categorie} &middot; {videoOuverte.duree_min} min
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => marquerTerminee(videoOuverte)}
                  className="rounded-full bg-framboise text-white px-4 py-2 text-sm font-semibold"
                >
                  Marquer comme terminee
                </button>
                <button
                  onClick={() => setVideoOuverte(null)}
                  className="rounded-full border border-creme-dark px-4 py-2 text-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
