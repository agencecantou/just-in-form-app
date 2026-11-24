"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { createClient } from "@/lib/supabase/client";
import { urlEmbedVimeo } from "@/lib/vimeo";
import { RESSENTIS, type Video } from "@/lib/types";
import type { EtatJeu } from "@/lib/jeu";
import { alerteVideo } from "@/lib/donnees";
import { useAbonnee } from "@/components/EspaceAbonnee";
import Plante from "@/components/Plante";
import { Intensite, libelleNiveau } from "@/components/CarteVideo";
import {
  Goutte,
  IconeAlerte,
  IconeCadeau,
  IconeCoeur,
  IconeFermer,
  IconeLecture,
  IconePause,
  IconePleinEcran,
  PictoBadge,
} from "@/components/Icones";

// La seance ne compte (et ne rapporte des gouttes) qu'a partir de la
// moitie de la video : les gouttes gardent ainsi leur valeur.
const SEUIL_TERMINER = 0.5;

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
  const { donnees, rafraichir } = useAbonnee();
  const [etape, setEtape] = useState<"lecture" | "ressenti">("lecture");
  const [avant, setAvant] = useState<EtatJeu | null>(null);
  const [apres, setApres] = useState<EtatJeu | null>(null);
  const [maxAtteint, setMaxAtteint] = useState(0);
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
      setMaxAtteint((m) => (data.seconds > m ? data.seconds : m));
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
          setMaxAtteint(progression.position_secondes);
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
    setAvant(donnees?.jeu ?? null);
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
    const nouvelles = await rafraichir();
    if (nouvelles) setApres(nouvelles.jeu);
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

  function fermerSansRessenti() {
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
  const peutTerminer = dureeSecondes > 0 && maxAtteint >= dureeSecondes * SEUIL_TERMINER;
  const alerte = alerteVideo(video, donnees?.sante ?? {});

  return (
    <div
      className="fixed inset-0 z-50 bg-encre/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && etape === "lecture") fermer();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={video.titre}
    >
      <div className="apparition w-full sm:max-w-3xl max-h-[100dvh] overflow-y-auto bg-creme sm:rounded-2xl rounded-t-2xl shadow-2xl">
        {etape === "lecture" ? (
          <>
            <div ref={conteneurRef} className="relative aspect-video bg-encre sm:rounded-t-2xl overflow-hidden">
              <iframe
                ref={iframeRef}
                src={urlEmbedVimeo(video.vimeo_id, { controls: 0, title: 0, byline: 0, portrait: 0 })}
                className="w-full h-full pointer-events-none"
                allow="autoplay; fullscreen; picture-in-picture"
                title={video.titre}
              />
              <div className="absolute inset-0 flex flex-col justify-end" onClick={togglerLecture}>
                {!enLecture && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="h-16 w-16 rounded-full bg-white/95 flex items-center justify-center text-framboise shadow-lg">
                      <IconeLecture taille={20} />
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={togglerFavori}
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${favori ? "bg-white text-framboise" : "bg-black/40 text-white"}`}
                    aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                    aria-pressed={favori}
                  >
                    <IconeCoeur plein={favori} />
                  </button>
                  <button type="button" onClick={fermer} className="h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center" aria-label="Fermer">
                    <IconeFermer taille={18} />
                  </button>
                </div>
                <div
                  className="bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10 flex flex-col gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    ref={barreRef}
                    onPointerDown={onBarrePointerDown}
                    onPointerMove={onBarrePointerMove}
                    onPointerUp={onBarrePointerUp}
                    className="relative h-2 cursor-pointer touch-none rounded-full bg-white/25"
                    role="slider"
                    aria-label="Position dans la vidéo"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(dureeSecondes)}
                    aria-valuenow={Math.round(positionAffichee)}
                  >
                    <div className="h-full rounded-full bg-jaune" style={{ width: `${progressionPct}%` }} />
                    <span className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 bg-white/70" style={{ left: `${SEUIL_TERMINER * 100}%` }} aria-hidden="true" />
                  </div>
                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={togglerLecture} className="h-9 w-9 flex items-center justify-center" aria-label={enLecture ? "Pause" : "Lecture"}>
                        {enLecture ? <IconePause taille={14} /> : <IconeLecture taille={14} />}
                      </button>
                      <span className="text-white/80 tabular-nums">
                        {formaterTemps(positionAffichee)} / {formaterTemps(dureeSecondes)}
                      </span>
                    </div>
                    <button type="button" onClick={togglerPleinEcran} className="h-9 w-9 flex items-center justify-center" aria-label={pleinEcran ? "Quitter le plein écran" : "Plein écran"}>
                      <IconePleinEcran taille={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="etiquette text-feuille-dark">{video.categories?.join(" · ")}</p>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">{video.titre}</h2>
                  <p className="mt-1 flex items-center gap-3 text-sm text-gris">
                    {video.duree_min} min · {libelleNiveau(video.niveau)} <Intensite niveau={video.intensite} />
                  </p>
                </div>
                <button
                  onClick={marquerCommeTerminee}
                  disabled={!peutTerminer}
                  className="btn btn-principal"
                  title={peutTerminer ? undefined : "Disponible à partir de la moitié de la séance"}
                >
                  Séance terminée
                </button>
              </div>
              {!peutTerminer && (
                <p className="text-[12.5px] text-gris -mt-2">
                  Le bouton s&apos;active à mi-séance : tes gouttes récompensent un vrai effort.
                </p>
              )}
              {alerte && (
                <p className="flex items-start gap-2 rounded-xl bg-jaune-light px-3.5 py-2.5 text-sm font-semibold text-[#7a4a00]">
                  <IconeAlerte taille={16} className="mt-0.5 shrink-0" />
                  {alerte}
                </p>
              )}
              {video.description && <p className="text-[15px] leading-relaxed text-encre/80 whitespace-pre-line">{video.description}</p>}
            </div>
          </>
        ) : (
          <EcranBravo
            prenom={donnees?.prenom ?? ""}
            avant={avant}
            apres={apres}
            valeurRessenti={valeurRessenti}
            setValeurRessenti={setValeurRessenti}
            messageAvis={messageAvis}
            setMessageAvis={setMessageAvis}
            envoi={envoi}
            onValider={validerRessenti}
            onFermer={fermerSansRessenti}
          />
        )}
      </div>
    </div>
  );
}

function EcranBravo({
  prenom,
  avant,
  apres,
  valeurRessenti,
  setValeurRessenti,
  messageAvis,
  setMessageAvis,
  envoi,
  onValider,
  onFermer,
}: {
  prenom: string;
  avant: EtatJeu | null;
  apres: EtatJeu | null;
  valeurRessenti: number | null;
  setValeurRessenti: (v: number) => void;
  messageAvis: string;
  setMessageAvis: (v: string) => void;
  envoi: boolean;
  onValider: () => void;
  onFermer: () => void;
}) {
  const etat = apres ?? avant;
  const gagnees = avant && apres ? apres.gouttes - avant.gouttes : null;
  const semaineValidee = !!(avant && apres && avant.semaineCourante.statut !== "validee" && apres.semaineCourante.statut === "validee");
  const nouveauPalier = !!(avant && apres && apres.palier > avant.palier);
  const badgeGagne =
    avant && apres
      ? apres.badges.find((b) => b.compte > (avant.badges.find((x) => x.id === b.id)?.compte ?? 0)) ?? null
      : null;
  const recompenseDebloquee =
    avant && apres ? apres.recompenses.find((r) => r.debloquee && !avant.recompenses.find((x) => x.id === r.id)?.debloquee) ?? null : null;

  return (
    <div className="relative overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center gap-3">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(250,178,0,.32),transparent_70%)]" />
      <svg width="320" height="200" viewBox="0 0 320 200" className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2" aria-hidden="true">
        <circle className="etincelle" cx="40" cy="60" r="5" fill="#fab200" />
        <circle className="etincelle" style={{ animationDelay: ".6s" }} cx="280" cy="40" r="4" fill="#92114f" />
        <circle className="etincelle" style={{ animationDelay: "1.1s" }} cx="268" cy="170" r="6" fill="#5bb8d4" />
        <circle className="etincelle" style={{ animationDelay: "1.6s" }} cx="58" cy="168" r="4" fill="#3f8f63" />
      </svg>

      {etat && (
        <div className="relative">
          <Plante palier={etat.palier} soif={0} taille={190} rebond gouttes={3} label="Ta plante prend une feuille" />
        </div>
      )}

      <h2 className="relative titre-ecran text-[30px]">Bravo{prenom ? ` ${prenom}` : ""} !</h2>

      {gagnees !== null && (
        <p className="relative flex items-center gap-2 text-[15px] font-bold text-eau-dark">
          <Goutte taille={14} />
          {gagnees > 0 ? `+${gagnees} goutte${gagnees > 1 ? "s" : ""}` : "Séance enregistrée (2 séances récompensées par jour maximum)"}
        </p>
      )}

      <div className="relative flex flex-col items-center gap-2 w-full max-w-md">
        {semaineValidee && (
          <p className="w-full rounded-xl bg-framboise text-white px-4 py-3 text-sm font-bold">Semaine validée, ton objectif est atteint !</p>
        )}
        {nouveauPalier && apres && (
          <p className="w-full rounded-xl bg-menthe text-feuille-dark px-4 py-3 text-sm font-bold">Ta plante grandit : {apres.nomPalier.toLowerCase()} !</p>
        )}
        {recompenseDebloquee && (
          <p className="w-full rounded-xl bg-jaune-light text-[#6b4300] px-4 py-3 text-sm font-bold flex items-center justify-center gap-2">
            <IconeCadeau taille={18} /> Débloqué : {recompenseDebloquee.titre}
          </p>
        )}
        {badgeGagne && (
          <div className="verre w-full rounded-xl p-3 flex items-center gap-3 text-left">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: badgeGagne.couleur }}>
              <PictoBadge icone={badgeGagne.icone} taille={22} />
              {badgeGagne.repetable && badgeGagne.compte > 1 && (
                <span className="absolute -top-2 -right-2 rounded-md bg-encre px-1.5 py-0.5 text-[11px] font-extrabold text-white">×{badgeGagne.compte}</span>
              )}
            </span>
            <span>
              <span className="block text-sm font-bold">Badge « {badgeGagne.titre} »</span>
              <span className="block text-xs text-gris">{badgeGagne.compte > 1 ? `${badgeGagne.compte}e fois, ta collection s'agrandit` : badgeGagne.description}</span>
            </span>
          </div>
        )}
        {!recompenseDebloquee && apres?.prochaineRecompense && (
          <div className="w-full text-left">
            <p className="text-xs font-semibold text-gris mb-1.5">
              Encore {apres.prochaineRecompense.restant} goutte{apres.prochaineRecompense.restant > 1 ? "s" : ""} pour : {apres.prochaineRecompense.titre}
            </p>
            <div className="jauge">
              <i
                style={{
                  width: `${Math.min(100, (apres.gouttes / Math.max(1, apres.prochaineRecompense.seuil_gouttes)) * 100)}%`,
                  background: "#fab200",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="relative verre w-full max-w-md rounded-xl p-4 mt-2 text-left">
        <p className="text-sm font-bold mb-2.5">Comment c&apos;était ?</p>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(RESSENTIS)
            .reverse()
            .map(([valeur, { label }]) => (
              <button
                key={valeur}
                onClick={() => setValeurRessenti(Number(valeur))}
                aria-pressed={valeurRessenti === Number(valeur)}
                className="choix choix-doux justify-center !px-1 !text-[12.5px]"
              >
                {label}
              </button>
            ))}
        </div>
        <label className="block text-sm font-semibold mt-4 mb-1.5" htmlFor="avis-justine">
          Un mot pour Justine <span className="font-normal text-gris">(facultatif)</span>
        </label>
        <textarea id="avis-justine" value={messageAvis} onChange={(e) => setMessageAvis(e.target.value)} rows={2} className="champ" />
      </div>

      <div className="relative flex flex-wrap justify-center gap-2 mt-1">
        <button onClick={onValider} disabled={!valeurRessenti || envoi} className="btn btn-principal">
          Valider
        </button>
        <button onClick={onFermer} className="btn btn-clair">
          Plus tard
        </button>
      </div>
    </div>
  );
}
