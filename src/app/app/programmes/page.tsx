"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Programme, ProgrammeVideo, Video } from "@/lib/types";
import { Chargement, EnTete, Page, useAbonnee } from "@/components/EspaceAbonnee";
import LecteurVideo from "@/components/LecteurVideo";
import { IconeCoche, IconeLecture, IconeRetour, PictoBadge } from "@/components/Icones";

function ProgrammesInterieur() {
  const params = useSearchParams();
  const programmeCible = params.get("programme");
  const { donnees } = useAbonnee();

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [chargement, setChargement] = useState(true);
  const [programmeOuvert, setProgrammeOuvert] = useState<Programme | null>(null);
  const [videosDuProgramme, setVideosDuProgramme] = useState<ProgrammeVideo[]>([]);
  const [videoOuverte, setVideoOuverte] = useState<Video | null>(null);

  useEffect(() => {
    async function charger() {
      const { data } = await createClient().from("programmes").select("*").eq("statut", "publie").order("created_at", { ascending: false });
      const liste = (data as Programme[]) ?? [];
      setProgrammes(liste);
      setChargement(false);
      if (programmeCible) {
        const cible = liste.find((p) => p.id === programmeCible);
        if (cible) ouvrirProgramme(cible);
      }
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programmeCible]);

  async function ouvrirProgramme(programme: Programme) {
    setProgrammeOuvert(programme);
    const { data } = await createClient()
      .from("programme_videos")
      .select("*, videos(*)")
      .eq("programme_id", programme.id)
      .order("ordre", { ascending: true });
    setVideosDuProgramme((data as ProgrammeVideo[]) ?? []);
  }

  const terminees = new Set((donnees?.seances ?? []).map((s) => s.video_id));
  const etat = (id: string) => donnees?.jeu.programmes.find((p) => p.id === id);

  return (
    <Page>
      {!programmeOuvert ? (
        <>
          <EnTete titre="Les programmes" sousTitre="Des plans guidés, séance après séance, pour progresser sans te poser de question." />
          {chargement ? (
            <Chargement />
          ) : programmes.length === 0 ? (
            <p className="text-sm text-gris">Aucun programme publié pour le moment, reviens bientôt.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {programmes.map((p) => {
                const e = etat(p.id);
                const pct = e ? Math.round((e.fait / Math.max(1, e.total)) * 100) : 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => ouvrirProgramme(p)}
                    className="verre text-left rounded-2xl p-5 flex flex-col gap-3 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(146,17,79,.45)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-framboise">
                        <PictoBadge icone="drapeau" taille={20} />
                      </span>
                      {e?.termine && <span className="text-[12px] font-bold text-feuille-dark">Terminé</span>}
                      {p.est_lancement && !e?.termine && <span className="text-[12px] font-bold text-[#8a5a00]">Pour bien démarrer</span>}
                    </div>
                    <p className="text-lg font-extrabold tracking-tight leading-snug">{p.titre}</p>
                    {p.description && <p className="text-sm text-gris leading-relaxed line-clamp-3">{p.description}</p>}
                    {e && (
                      <div className="mt-auto">
                        <div className="jauge">
                          <i style={{ width: `${pct}%`, background: "#92114f" }} />
                        </div>
                        <p className="text-xs text-gris mt-1.5">
                          {e.fait} séance{e.fait > 1 ? "s" : ""} sur {e.total}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="max-w-3xl">
          <button onClick={() => setProgrammeOuvert(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-gris mb-5 hover:text-encre">
            <IconeRetour taille={16} /> Tous les programmes
          </button>
          <EnTete titre={programmeOuvert.titre} sousTitre={programmeOuvert.description} />
          {videosDuProgramme.length === 0 ? (
            <p className="text-sm text-gris">Ce programme n&apos;a pas encore de séances.</p>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {videosDuProgramme.map((pv, i) => {
                if (!pv.videos) return null;
                const faite = terminees.has(pv.videos.id);
                const prochaine = !faite && videosDuProgramme.slice(0, i).every((x) => x.videos && terminees.has(x.videos.id));
                return (
                  <li key={pv.id}>
                    <button
                      onClick={() => setVideoOuverte(pv.videos as Video)}
                      className={`w-full text-left rounded-xl p-4 flex items-center gap-4 transition ${
                        prochaine ? "bg-white border-[1.5px] border-framboise shadow-[0_12px_28px_-16px_rgba(146,17,79,.6)]" : "verre hover:border-framboise/40"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg chiffre text-sm ${
                          faite ? "bg-feuille text-white" : prochaine ? "bg-framboise text-white" : "bg-encre/5 text-gris"
                        }`}
                      >
                        {faite ? <IconeCoche taille={16} /> : i + 1}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold leading-snug">{pv.videos.titre}</span>
                        <span className="block text-[13px] text-gris mt-0.5">
                          {pv.videos.categories?.join(" · ")} · {pv.videos.duree_min} min
                        </span>
                      </span>
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${prochaine ? "bg-framboise text-white" : "text-framboise"}`}>
                        <IconeLecture taille={12} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {videoOuverte && (
        <LecteurVideo
          video={videoOuverte}
          onFermer={() => setVideoOuverte(null)}
          onTerminee={() => {
            if (programmeOuvert) ouvrirProgramme(programmeOuvert);
          }}
        />
      )}
    </Page>
  );
}

export default function ProgrammesPage() {
  return (
    <Suspense>
      <ProgrammesInterieur />
    </Suspense>
  );
}
