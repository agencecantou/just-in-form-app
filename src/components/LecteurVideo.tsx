"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { createClient } from "@/lib/supabase/client";
import { urlEmbedVimeo } from "@/lib/vimeo";
import { RESSENTIS, type Video } from "@/lib/types";

// En dessous de ce seuil, pas la peine de proposer une reprise (on considere
// que la video vient d'etre lancee).
const SEUIL_REPRISE_SECONDES = 5;
const INTERVALLE_SAUVEGARDE_MS = 5000;

function formaterTemps(secondes: number) {
  const s = Math.max(0, Math.round(secondes));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

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

  // Etat du lecteur custom (les controles natifs Vimeo sont masques).
  const [enLecture, setEnLecture] = useState(false);
  const [positionAffichee, setPositionAffichee] = useState(0);
  const [dureeSecondes, setDureeSecondes] = useState(video.duree_min * 60);
  const [favori, setFavori] = useState(false);
  const [pleinEcran, setPleinEcran] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const barreRef = useRef<HTMLDivElement>(null);
  // Instance du lecteur Vimeo officiel (@vimeo/player) : gere elle-meme tout
  // le protocole postMessage (handshake, requetes/reponses), plus fiable
  // qu'une reimplementation maison de ce protocole.
  const playerRef = useRef<Player | null>(null);
  const derniereSauvegardeRef = useRef(0);
  const positionRef = useRef(0);
  const positionDepartRef = useRef(0);
  const userIdRef = useRef<string | null>(null);
  const dejaMarqueeRef = useRef(false);
  const glissementRef = useRef(false);
  // La position sauvegardee peut arriver avant ou apres que le lecteur soit
  // pret (selon la vitesse du reseau) : on ne tente le seek que quand les
  // deux sont prets, et une seule fois.
  const lecteurPretRef = useRef(false);
  const positionChargeeRef = useRef(false);
  const repriseEnvoyeeRef = useRef(false);

  function tenterReprise() {
    if (!lecteurPretRef.current || !positionChargeeRef.current || repriseEnvoyeeRef.current) return;
    repriseEnvoyeeRef.current = true;
    if (positionDepartRef.current > SEUIL_REPRISE_SECONDES) {
      playerRef.current?.setCurrentTime(positionDepartRef.current).catch(() => {});
      setPositionAffichee(positionDepartRef.current);
      positionRef.current = positionDepartRef.current;
    }
  }

  // Cree le lecteur Vimeo et branche ses evenements (pret, avancement,
  // lecture/pause, fin).
  useEffect(() => {
    if (!iframeRef.current) return;
    const player = new Player(iframeRef.current);
    playerRef.current = player;

    player.on("play", () => setEnLecture(true));
    player.on("pause", () => setEnLecture(false));
    player.on("timeupdate", (data: { seconds: number }) => {
      positionRef.current = data.seconds;
      if (!glissementRef.current) setPositionAffichee(data.seconds);
      const maintenant = Date.now();
      if (maintenant - derniereSauvegardeRef.current > INTERVALLE_SAUVEGARDE_MS) {
        derniereSauvegardeRef.current = maintenant;
        sauvegarderPosition(data.seconds);
      }
    });
    player.on("ended", () => {
      marquerCommeTerminee();
    });

    player.getDuration().then((d) => {
      if (d > 0) setDureeSecondes(d);
    });

    player.ready().then(() => {
      lecteurPretRef.current = true;
      tenterReprise();
    });

    return () => {
      playerRef.current = null;
      player.destroy().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  // Recupere l'utilisateur, incremente les vues, charge une eventuelle
  // reprise et l'etat favori pour cette video.
  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userIdRef.current = user?.id ?? null;

      supabase.rpc("increment_vues", { p_video_id: video.id }).then(() => {});

      if (user) {
        const [{ data: progression }, { data: favorisData }] = await Promise.all([
          supabase
            .from("progression_videos")
            .select("position_secondes")
            .eq("user_id", user.id)
            .eq("video_id", video.id)
            .maybeSingle(),
          supabase
            .from("favoris")
            .select("id")
            .eq("user_id", user.id)
            .eq("video_id", video.id)
            .maybeSingle(),
        ]);
        if (progression?.position_secondes) {
          positionDepartRef.current = progression.position_secondes;
        }
        setFavori(!!favorisData);
      }
      positionChargeeRef.current = true;
      tenterReprise();
    }
    init();
  }, [video.id]);

  // Suit le plein ecran reel du navigateur (bouton custom, touche Echap, etc.)
  useEffect(() => {
    function onChange() {
      setPleinEcran(document.fullscreenElement === conteneurRef.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

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

  // Utilisee a la fois par le bouton "Terminer la seance" et par la fin
  // naturelle de la video (evenement "ended") : idempotente via la ref.
  async function marquerCommeTerminee() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
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
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (positionRef.current > SEUIL_REPRISE_SECONDES && !dejaMarqueeRef.current) {
      sauvegarderPosition(positionRef.current);
    }
    onTerminee();
    onFermer();
  }

  function togglerLecture() {
    if (enLecture) {
      playerRef.current?.pause().catch(() => {});
    } else {
      playerRef.current?.play().catch(() => {});
    }
  }

  async function togglerFavori() {
    if (!userIdRef.current) return;
    const supabase = createClient();
    const nouvelEtat = !favori;
    setFavori(nouvelEtat);
    if (nouvelEtat) {
      await supabase.from("favoris").insert({ user_id: userIdRef.current, video_id: video.id });
    } else {
      await supabase
        .from("favoris")
        .delete()
        .eq("user_id", userIdRef.current)
        .eq("video_id", video.id);
    }
  }

  function togglerPleinEcran() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      conteneurRef.current?.requestFullscreen().catch(() => {});
    }
  }

  function positionDepuisPointeur(clientX: number) {
    const el = barreRef.current;
    if (!el || dureeSecondes <= 0) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * dureeSecondes;
  }

  function onBarrePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    glissementRef.current = true;
    setPositionAffichee(positionDepuisPointeur(e.clientX));
  }

  function onBarrePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!glissementRef.current) return;
    setPositionAffichee(positionDepuisPointeur(e.clientX));
  }

  function onBarrePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!glissementRef.current) return;
    glissementRef.current = false;
    const nouvelle = positionDepuisPointeur(e.clientX);
    positionRef.current = nouvelle;
    playerRef.current?.setCurrentTime(nouvelle).catch(() => {});
    sauvegarderPosition(nouvelle);
  }

  const progressionPct = dureeSecondes > 0 ? Math.min(100, (positionAffichee / dureeSecondes) * 100) : 0;

  return (
    <div
      className="fixed inset-0 bg-anthracite/80 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) fermer();
      }}
    >
      <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full">
        <div ref={conteneurRef} className="relative aspect-video bg-anthracite">
          <iframe
            ref={iframeRef}
            src={`${urlEmbedVimeo(video.vimeo_id)}?controls=0&title=0&byline=0&portrait=0`}
            className="w-full h-full pointer-events-none"
            allow="autoplay; picture-in-picture"
          />

          {/* Overlay custom (clic = play/pause) */}
          <div
            className="absolute inset-0 flex flex-col justify-end"
            onClick={togglerLecture}
          >
            {!enLecture && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center text-2xl text-anthracite">
                  ▶
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglerFavori();
              }}
              className="absolute top-3 right-3 h-9 w-9 rounded-full bg-anthracite/50 flex items-center justify-center text-lg"
              aria-label="Favori"
            >
              {favori ? "❤️" : "🤍"}
            </button>

            <div
              className="bg-gradient-to-t from-anthracite/90 to-transparent px-3 pb-3 pt-8 flex flex-col gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                ref={barreRef}
                onPointerDown={onBarrePointerDown}
                onPointerMove={onBarrePointerMove}
                onPointerUp={onBarrePointerUp}
                className="h-1.5 bg-white/30 rounded-full cursor-pointer relative touch-none"
              >
                <div
                  className="h-full bg-orange rounded-full"
                  style={{ width: `${progressionPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={togglerLecture} className="text-base">
                    {enLecture ? "⏸" : "▶"}
                  </button>
                  <span className="text-white/70">
                    {formaterTemps(positionAffichee)} / {formaterTemps(dureeSecondes)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={marquerCommeTerminee}
                    className="rounded-full bg-framboise px-3 py-1 text-xs font-semibold"
                  >
                    ✓ Terminer
                  </button>
                  <button type="button" onClick={togglerPleinEcran} className="text-base">
                    {pleinEcran ? "⤡" : "⤢"}
                  </button>
                </div>
              </div>
            </div>
          </div>
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
