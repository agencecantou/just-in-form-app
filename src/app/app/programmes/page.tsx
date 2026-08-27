"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UTILISATEUR_DEMO, type Programme, type ProgrammeVideo, type Video } from "@/lib/types";
import { LecteurVideo } from "../page";

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [chargement, setChargement] = useState(true);
  const [programmeOuvert, setProgrammeOuvert] = useState<Programme | null>(null);
  const [videosDuProgramme, setVideosDuProgramme] = useState<ProgrammeVideo[]>([]);
  const [videoOuverte, setVideoOuverte] = useState<Video | null>(null);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("programmes")
        .select("*")
        .eq("statut", "publie")
        .order("created_at", { ascending: false });
      setProgrammes((data as Programme[]) ?? []);
      setChargement(false);
    }
    charger();
  }, []);

  async function ouvrirProgramme(programme: Programme) {
    setProgrammeOuvert(programme);
    const supabase = createClient();
    const { data } = await supabase
      .from("programme_videos")
      .select("*, videos(id, titre, categories, duree_min, niveau, vimeo_id)")
      .eq("programme_id", programme.id)
      .order("ordre", { ascending: true });
    setVideosDuProgramme((data as ProgrammeVideo[]) ?? []);
  }

  async function marquerTerminee(video: Video) {
    const supabase = createClient();
    await supabase
      .from("seances_terminees")
      .insert({ video_id: video.id, utilisateur: UTILISATEUR_DEMO });
    setVideoOuverte(null);
  }

  return (
    <main className="flex-1 px-6 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Les programmes</h1>
      <p className="text-anthracite/60 mb-6">
        Des plans guides sur plusieurs semaines pour progresser pas a pas.
      </p>

      {chargement ? (
        <p className="text-sm text-anthracite/50">Chargement...</p>
      ) : programmes.length === 0 ? (
        <p className="text-sm text-anthracite/50">
          Aucun programme publie pour le moment, reviens bientot.
        </p>
      ) : !programmeOuvert ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {programmes.map((p) => (
            <button
              key={p.id}
              onClick={() => ouvrirProgramme(p)}
              className="text-left rounded-2xl bg-white border border-creme-dark p-5 hover:border-framboise/50"
            >
              <p className="font-semibold">{p.titre}</p>
              <p className="text-sm text-anthracite/60 mt-1">{p.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setProgrammeOuvert(null)}
            className="text-sm text-anthracite/50 underline mb-4"
          >
            ← Tous les programmes
          </button>
          <h2 className="text-xl font-semibold">{programmeOuvert.titre}</h2>
          <p className="text-anthracite/60 mb-4">{programmeOuvert.description}</p>

          {videosDuProgramme.length === 0 ? (
            <p className="text-sm text-anthracite/50">
              Ce programme n&apos;a pas encore de seances.
            </p>
          ) : (
            <div className="space-y-2">
              {videosDuProgramme.map((pv, i) =>
                pv.videos ? (
                  <button
                    key={pv.id}
                    onClick={() => setVideoOuverte(pv.videos as Video)}
                    className="w-full text-left rounded-xl bg-white border border-creme-dark p-4 flex items-center justify-between hover:border-framboise/50"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        Seance {i + 1} : {pv.videos.titre}
                      </p>
                      <p className="text-xs text-anthracite/50">
                        {pv.videos.categories?.join(", ")} &middot; {pv.videos.duree_min} min
                      </p>
                    </div>
                    <span className="text-framboise text-sm">Lire ▶</span>
                  </button>
                ) : null
              )}
            </div>
          )}
        </div>
      )}

      {videoOuverte && (
        <LecteurVideo
          video={videoOuverte}
          onFermer={() => setVideoOuverte(null)}
          onTerminee={() => marquerTerminee(videoOuverte)}
        />
      )}
    </main>
  );
}
