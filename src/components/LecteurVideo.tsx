"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { urlEmbedVimeo } from "@/lib/vimeo";
import { RESSENTIS, type Video } from "@/lib/types";

// En dessous de ce seuil, pas la peine de proposer une reprise (on considere
// que la video vient d'etre lancee).
const SEUIL_REPRISE_SECONDES = 5;
const INTERVALLE_SAUVEGARDE_MS = 5000;

export default function LecteurVideo({
  video,
  onFermer,
  onTerminee,
}: {
  video: Video;
  onFermer: () => void;
  onTerminee: () => void;
}) {
  const [etape, setEtape] = useState<"lecture" | "ressenti">("lecture");
  const [valeurRessenti, setValeurRessenti] = useState<number | null>(null);
  const [messageAvis, setMessageAvis] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const derniereSauvegardeRef = useRef(0);
  const positionRef = useRef(0);
  const positionDepartRef = useRef(0);
  const userIdRef = useRef<string | null>(null);
  const dejaMarqueeRef = useRef(false);

  // Recupere l'utilisateur, incremente les vues et charge une eventuelle
  // reprise (derniere position enregistree pour cette video).
  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userIdRef.current = user?.id ?? null;

      supabase.rpc("increment_vues", { p_video_id: video.id }).then(() => {});

      if (user) {
        const { data } = await supabase
          .from("progression_videos")
          .select("position_secondes")
          .eq("user_id", user.id)
          .eq("video_id", video.id)
          .maybeSingle();
        if (data?.position_secondes) {
          positionDepartRef.current = data.position_secondes;
        }
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  // Ecoute les evenements du lecteur Vimeo (protocole postMessage officiel,
  // pas besoin de librairie externe) : pret, avancement, fin de lecture.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== "https://player.vimeo.com") return;
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;

      let data: { event?: string; data?: { seconds?: number } };
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }

      if (data.event === "ready") {
        envoyer({ method: "addEventListener", value: "timeupdate" });
        envoyer({ method: "addEventListener", value: "ended" });
        if (positionDepartRef.current > SEUIL_REPRISE_SECONDES) {
          envoyer({ method: "setCurrentTime", value: positionDepartRef.current });
        }
      }

      if (data.event === "timeupdate" && data.data?.seconds !== undefined) {
        positionRef.current = data.data.seconds;
        const maintenant = Date.now();
        if (maintenant - derniereSauvegardeRef.current > INTERVALLE_SAUVEGARDE_MS) {
          derniereSauvegardeRef.current = maintenant;
          sauvegarderPosition(data.data.seconds);
        }
      }

      if (data.event === "ended") {
        marquerCommeTerminee();
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function envoyer(message: Record<string, unknown>) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify(message),
      "https://player.vimeo.com"
    );
  }

  async function sauvegarderPosition(secondes: number) {
    if (!userIdRef.current) return;
    const supabase = createClient();
    await supabase.from("progression_videos").upsert(
      {
        user_id: userIdRef.current,
        video_id: video.id,
        position_secondes: Math.round(secondes),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,video_id" }
    );
  }

  // Utilisee a la fois par le bouton "Marquer comme terminee" et par la fin
  // naturelle de la video (evenement "ended") : idempotente via la ref.
  async function marquerCommeTerminee() {
    if (dejaMarqueeRef.current) {
      setEtape("ressenti");
      return;
    }
    dejaMarqueeRef.current = true;
    if (userIdRef.current) {
      const supabase = createClient();
      await supabase
        .from("seances_terminees")
        .insert({ video_id: video.id, user_id: userIdRef.current });
      await supabase
        .from("progression_videos")
        .delete()
        .eq("user_id", userIdRef.current)
        .eq("video_id", video.id);
    }
    setEtape("ressenti");
  }

  async function validerRessenti() {
    if (!valeurRessenti || !userIdRef.current) return;
    setEnvoi(true);
    const supabase = createClient();
    await supabase
      .from("ressentis")
      .insert({ video_id: video.id, user_id: userIdRef.current, valeur: valeurRessenti });
    if (messageAvis.trim()) {
      await supabase
        .from("avis")
        .insert({ video_id: video.id, user_id: userIdRef.current, message: messageAvis.trim() });
    }
    setEnvoi(false);
    onTerminee();
    onFermer();
  }

  function fermer() {
    if (positionRef.current > SEUIL_REPRISE_SECONDES && !dejaMarqueeRef.current) {
      sauvegarderPosition(positionRef.current);
    }
    onTerminee();
    onFermer();
  }

  return (
    <div
      className="fixed inset-0 bg-anthracite/80 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) fermer();
      }}
    >
      <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full">
        <div className="aspect-video bg-anthracite">
          <iframe
            ref={iframeRef}
            src={`${urlEmbedVimeo(video.vimeo_id)}?api=1&player_id=jif-player`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>

        {etape === "lecture" ? (
          <div className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold">{video.titre}</p>
              <p className="text-sm text-anthracite/50">
                {video.categories?.join(", ")} · {video.duree_min} min
              </p>
              {video.description && (
                <p className="text-sm text-anthracite/70 mt-2 max-w-md">
                  {video.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={marquerCommeTerminee}
                className="rounded-full bg-framboise text-white px-4 py-2 text-sm font-semibold"
              >
                Marquer comme terminée
              </button>
              <button
                onClick={fermer}
                className="rounded-full border border-creme-dark px-4 py-2 text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium">Comment tu te sens ?</p>
            <div className="flex gap-2">
              {Object.entries(RESSENTIS).map(([valeur, { emoji, label }]) => (
                <button
                  key={valeur}
                  onClick={() => setValeurRessenti(Number(valeur))}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-xl border p-3 text-xs ${
                    valeurRessenti === Number(valeur)
                      ? "border-framboise bg-framboise-light"
                      : "border-creme-dark"
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium">
                Laisser un avis à Justine{" "}
                <span className="text-anthracite/40 font-normal">(optionnel)</span>
              </label>
              <textarea
                value={messageAvis}
                onChange={(e) => setMessageAvis(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={validerRessenti}
                disabled={!valeurRessenti || envoi}
                className="rounded-full bg-framboise text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Valider
              </button>
              <button
                onClick={fermer}
                className="rounded-full border border-creme-dark px-4 py-2 text-sm"
              >
                Plus tard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
