"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { urlEmbedVimeo } from "@/lib/vimeo";
import { CATEGORIES, RESSENTIS, type Video } from "@/lib/types";

type FiltreDuree = "toutes" | "court" | "moyen" | "long";

const FILTRES_DUREE: { valeur: FiltreDuree; label: string }[] = [
  { valeur: "toutes", label: "Toutes durees" },
  { valeur: "court", label: "< 15 min" },
  { valeur: "moyen", label: "15 a 30 min" },
  { valeur: "long", label: "> 30 min" },
];

function correspondDuree(video: Video, filtre: FiltreDuree) {
  if (filtre === "toutes") return true;
  if (filtre === "court") return video.duree_min < 15;
  if (filtre === "moyen") return video.duree_min >= 15 && video.duree_min <= 30;
  return video.duree_min > 30;
}

// Regroupe les ressentis par video et garde la valeur la plus frequente
// (le "ressenti dominant"), plutot qu'une moyenne numerique peu parlante
// sur une echelle d'emojis.
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

// Regle du challenge : 5 seances terminees ou plus sur un meme niveau ->
// on propose une video du niveau superieur pas encore faite.
const NIVEAUX_PROGRESSION = ["Debutant", "Intermediaire", "Avance"];

function calculerSuggestionNiveau(
  toutesVideos: Video[],
  seancesAvecNiveau: (string | undefined)[],
  terminees: Set<string>
): Video | null {
  for (let i = 0; i < NIVEAUX_PROGRESSION.length - 1; i++) {
    const niveauActuel = NIVEAUX_PROGRESSION[i];
    const niveauSuivant = NIVEAUX_PROGRESSION[i + 1];
    const nbSeances = seancesAvecNiveau.filter((n) => n === niveauActuel).length;
    if (nbSeances >= 5) {
      const candidate = toutesVideos.find(
        (v) => v.niveau === niveauSuivant && !terminees.has(v.id)
      );
      if (candidate) return candidate;
    }
  }
  return null;
}

export default function AppHome() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [chargement, setChargement] = useState(true);
  const [videoOuverte, setVideoOuverte] = useState<Video | null>(null);
  const [terminees, setTerminees] = useState<Set<string>>(new Set());
  const [niveauxSeances, setNiveauxSeances] = useState<(string | undefined)[]>([]);
  const [ressentiParVideo, setRessentiParVideo] = useState<
    Map<string, { valeur: number; total: number }>
  >(new Map());
  const [filtreCategorie, setFiltreCategorie] = useState<string | null>(null);
  const [filtreDuree, setFiltreDuree] = useState<FiltreDuree>("toutes");

  async function charger() {
    setChargement(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [{ data: videosData }, { data: seancesData }, { data: ressentisData }] =
      await Promise.all([
        supabase.from("videos").select("*").eq("statut", "publie").order("created_at", { ascending: false }),
        user
          ? supabase.from("seances_terminees").select("video_id, videos(niveau)").eq("user_id", user.id)
          : Promise.resolve({ data: [] as { video_id: string; videos: { niveau: string } | null }[] }),
        supabase.from("ressentis").select("video_id, valeur"),
      ]);

    setVideos((videosData as Video[]) ?? []);
    const seances = (seancesData ?? []) as { video_id: string; videos: { niveau: string } | null }[];
    setTerminees(new Set(seances.map((s) => s.video_id)));
    setNiveauxSeances(seances.map((s) => s.videos?.niveau));
    setRessentiParVideo(calculerRessentiParVideo(ressentisData ?? []));
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  const videosVedette = videos.filter((v) => v.est_vedette);
  const videosAffichees = videos.filter(
    (v) =>
      (!filtreCategorie || v.categories?.includes(filtreCategorie)) &&
      correspondDuree(v, filtreDuree)
  );
  const suggestionNiveau = calculerSuggestionNiveau(videos, niveauxSeances, terminees);

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
            {suggestionNiveau && (
              <button
                onClick={() => setVideoOuverte(suggestionNiveau)}
                className="w-full text-left mb-6 rounded-2xl bg-anthracite text-creme p-5 hover:opacity-90"
              >
                <p className="text-sm font-medium text-orange">🏆 Pret a te challenger ?</p>
                <p className="font-semibold mt-1">
                  Tu enchaines les seances, essaie {suggestionNiveau.titre} (niveau {suggestionNiveau.niveau})
                </p>
              </button>
            )}

            {videosVedette.length > 0 && !filtreCategorie && filtreDuree === "toutes" && (
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
                      ressenti={ressentiParVideo.get(v.id)}
                      onClick={() => setVideoOuverte(v)}
                      accent
                    />
                  ))}
                </div>
              </div>
            )}

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
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setFiltreCategorie(c)}
                  className={`rounded-full px-3 py-1.5 text-sm border ${
                    filtreCategorie === c
                      ? "bg-framboise text-white border-framboise"
                      : "bg-white text-anthracite/70 border-creme-dark"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videosAffichees.map((v) => (
                <CarteVideo
                  key={v.id}
                  video={v}
                  terminee={terminees.has(v.id)}
                  ressenti={ressentiParVideo.get(v.id)}
                  onClick={() => setVideoOuverte(v)}
                />
              ))}
              {videosAffichees.length === 0 && (
                <p className="text-sm text-anthracite/50">
                  Aucune seance ne correspond a ces filtres pour le moment.
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
          onTerminee={charger}
        />
      )}
    </>
  );
}

function CarteVideo({
  video,
  terminee,
  ressenti,
  onClick,
  accent,
}: {
  video: Video;
  terminee: boolean;
  ressenti?: { valeur: number; total: number };
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
      <p className={`text-xs mt-1 ${accent ? "text-white/70" : "text-anthracite/40"}`}>
        {ressenti ? `${RESSENTIS[ressenti.valeur].emoji} ${RESSENTIS[ressenti.valeur].label}` : "Pas encore de ressenti"}
        {ressenti ? ` (${ressenti.total})` : ""} &middot; {video.vues} vue{video.vues > 1 ? "s" : ""}
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
  const [etape, setEtape] = useState<"lecture" | "ressenti">("lecture");
  const [valeurRessenti, setValeurRessenti] = useState<number | null>(null);
  const [messageAvis, setMessageAvis] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("increment_vues", { p_video_id: video.id }).then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  async function validerRessenti() {
    if (!valeurRessenti) return;
    setEnvoi(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setEnvoi(false);
      return;
    }

    await supabase.from("seances_terminees").insert({ video_id: video.id, user_id: user.id });
    await supabase.from("ressentis").insert({ video_id: video.id, user_id: user.id, valeur: valeurRessenti });
    if (messageAvis.trim()) {
      await supabase.from("avis").insert({ video_id: video.id, user_id: user.id, message: messageAvis.trim() });
    }

    setEnvoi(false);
    onTerminee();
    onFermer();
  }

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

        {etape === "lecture" ? (
          <div className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold">{video.titre}</p>
              <p className="text-sm text-anthracite/50">
                {video.categories?.join(", ")} &middot; {video.duree_min} min
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEtape("ressenti")}
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
                Laisser un avis a Justine{" "}
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
                onClick={() => setEtape("lecture")}
                className="rounded-full border border-creme-dark px-4 py-2 text-sm"
              >
                Retour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
