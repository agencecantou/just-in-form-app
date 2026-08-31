"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { imageEffectiveVideo, type Categorie, type Programme, type Video } from "@/lib/types";
import CarteVideo from "@/components/CarteVideo";
import LecteurVideo from "@/components/LecteurVideo";

// Regle du challenge : 5 seances terminees ou plus sur un meme niveau ->
// on propose une video du niveau superieur pas encore faite.
// Les valeurs doivent correspondre exactement a NIVEAUX dans lib/types.ts
// (stockees sans accent en base).
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

// Jours consecutifs avec au moins une seance terminee.
function calculerSerie(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniques = [...new Set(dates.map((d) => new Date(d).toDateString()))]
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());
  let serie = 1;
  let courante = uniques[0];
  for (let i = 1; i < uniques.length; i++) {
    const veille = new Date(courante);
    veille.setDate(veille.getDate() - 1);
    if (veille.toDateString() === uniques[i].toDateString()) {
      serie++;
      courante = uniques[i];
    } else break;
  }
  return serie;
}

function formaterDuree(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

type EnCours = {
  video: Video;
  positionSecondes: number;
};

type ProgrammeEnCours = {
  titre: string;
  id: string;
  fait: number;
  total: number;
};

export default function AppHome() {
  const [prenom, setPrenom] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [videoOuverte, setVideoOuverte] = useState<Video | null>(null);
  const [terminees, setTerminees] = useState<Set<string>>(new Set());
  const [niveauxSeances, setNiveauxSeances] = useState<(string | undefined)[]>([]);
  const [datesTerminees, setDatesTerminees] = useState<string[]>([]);
  const [seancesCeMois, setSeancesCeMois] = useState<{ minutes: number; nombre: number }>({
    minutes: 0,
    nombre: 0,
  });
  const [programmeLancement, setProgrammeLancement] = useState<Programme | null>(null);
  const [programmeEnCours, setProgrammeEnCours] = useState<ProgrammeEnCours | null>(null);
  const [enCours, setEnCours] = useState<EnCours[]>([]);

  async function charger() {
    setChargement(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [
      { data: videosData },
      { data: seancesData },
      { data: profile },
      { data: programmeLancementData },
      { data: progressionData },
      { data: programmeVideosData },
      { data: categoriesData },
    ] = await Promise.all([
      supabase.from("videos").select("*").eq("statut", "publie").order("created_at", { ascending: false }),
      user
        ? supabase
            .from("seances_terminees")
            .select("video_id, termine_le, videos(niveau, duree_min)")
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] as { video_id: string; termine_le: string; videos: { niveau: string; duree_min: number } | null }[] }),
      user ? supabase.from("profiles").select("prenom").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("programmes").select("*").eq("est_lancement", true).eq("statut", "publie").maybeSingle(),
      user
        ? supabase
            .from("progression_videos")
            .select("video_id, position_secondes, updated_at, videos(*)")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [] as { video_id: string; position_secondes: number; videos: Video | null }[] }),
      supabase.from("programme_videos").select("programme_id, video_id, programmes(id, titre, statut)"),
      supabase.from("categories").select("*"),
    ]);

    const toutesVideos = (videosData as Video[]) ?? [];
    setVideos(toutesVideos);
    setCategories((categoriesData as Categorie[]) ?? []);
    setPrenom(profile?.prenom ?? "");

    type SeanceLigne = { video_id: string; termine_le: string; videos: { niveau: string; duree_min: number } | null };
    const seances = (seancesData ?? []) as SeanceLigne[];
    setTerminees(new Set(seances.map((s) => s.video_id)));
    setNiveauxSeances(seances.map((s) => s.videos?.niveau));
    setDatesTerminees(seances.map((s) => s.termine_le));

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const duMois = seances.filter((s) => new Date(s.termine_le) >= debutMois);
    setSeancesCeMois({
      nombre: duMois.length,
      minutes: duMois.reduce((total, s) => total + (s.videos?.duree_min ?? 0), 0),
    });

    setProgrammeLancement((programmeLancementData as Programme) ?? null);

    type ProgressionLigne = { video_id: string; position_secondes: number; videos: Video | null };
    const progression = ((progressionData ?? []) as ProgressionLigne[]).filter((p) => p.videos);
    setEnCours(
      progression.map((p) => ({ video: p.videos as Video, positionSecondes: p.position_secondes }))
    );

    type ProgrammeVideoLigne = {
      programme_id: string;
      video_id: string;
      programmes: { id: string; titre: string; statut: string } | null;
    };
    const pv = (programmeVideosData ?? []) as unknown as ProgrammeVideoLigne[];
    const termineesSet = new Set(seances.map((s) => s.video_id));
    const parProgramme = new Map<string, { titre: string; fait: number; total: number }>();
    for (const ligne of pv) {
      if (!ligne.programmes || ligne.programmes.statut !== "publie") continue;
      const entree = parProgramme.get(ligne.programme_id) ?? {
        titre: ligne.programmes.titre,
        fait: 0,
        total: 0,
      };
      entree.total += 1;
      if (termineesSet.has(ligne.video_id)) entree.fait += 1;
      parProgramme.set(ligne.programme_id, entree);
    }
    let meilleur: ProgrammeEnCours | null = null;
    for (const [id, v] of parProgramme) {
      if (v.fait > 0 && v.fait < v.total) {
        if (!meilleur || v.fait > meilleur.fait) {
          meilleur = { id, titre: v.titre, fait: v.fait, total: v.total };
        }
      }
    }
    setProgrammeEnCours(meilleur);

    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  const imagesParCategorie = new Map(categories.map((c) => [c.nom, c.image_url]));
  const videosVedette = videos.filter((v) => v.est_vedette);
  const suggestionNiveau = calculerSuggestionNiveau(videos, niveauxSeances, terminees);
  const serie = calculerSerie(datesTerminees);
  const reprise = enCours.find((e) => !terminees.has(e.video.id));
  const autresEnCours = enCours.filter((e) => e.video.id !== reprise?.video.id && !terminees.has(e.video.id));

  return (
    <>
      <main className="flex-1 px-6 py-8 max-w-4xl">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-2xl font-semibold">
            {prenom ? `Salut ${prenom}` : terminees.size === 0 ? "Bienvenue !" : "Salut !"} 👋
          </h1>
          {prenom && (
            <span className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-framboise text-white font-semibold">
              {prenom.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="text-anthracite/60 mb-6">
          {terminees.size === 0
            ? "Prête à démarrer ta première séance ?"
            : "Prête pour ta séance du jour ?"}
        </p>

        {chargement ? (
          <p className="text-sm text-anthracite/50">Chargement...</p>
        ) : videos.length === 0 ? (
          <div className="rounded-2xl bg-orange-light p-5">
            <p className="font-medium">Aucune séance publiée pour le moment</p>
            <p className="text-sm text-anthracite/60">
              Ajoute une vidéo depuis l&apos;espace coach pour la voir apparaître ici.
            </p>
          </div>
        ) : (
          <>
            {reprise && (
              <button
                onClick={() => setVideoOuverte(reprise.video)}
                className="block w-full text-left mb-6 rounded-2xl bg-anthracite text-creme p-5 hover:opacity-90"
              >
                <p className="text-xs font-medium text-orange uppercase tracking-wide">
                  Reprendre où tu t&apos;es arrêtée
                </p>
                <p className="font-semibold text-lg mt-1">{reprise.video.titre}</p>
                <p className="text-sm text-creme/70 mt-1">
                  Il te reste{" "}
                  {Math.max(1, reprise.video.duree_min - Math.round(reprise.positionSecondes / 60))} minutes
                </p>
                <div className="h-1.5 bg-creme/20 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-orange rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((reprise.positionSecondes / 60 / Math.max(1, reprise.video.duree_min)) * 100))}%`,
                    }}
                  />
                </div>
                <span className="inline-block mt-3 rounded-full bg-orange text-anthracite text-sm font-semibold px-4 py-2">
                  ▶ Reprendre la séance
                </span>
              </button>
            )}

            {terminees.size === 0 && programmeLancement && (
              <Link
                href={`/app/programmes?programme=${programmeLancement.id}`}
                className="block mb-6 rounded-2xl bg-orange-light p-5 hover:opacity-90"
              >
                <p className="text-sm font-medium text-framboise">🚀 Pour bien démarrer</p>
                <p className="font-semibold mt-1">{programmeLancement.titre}</p>
                {programmeLancement.description && (
                  <p className="text-sm text-anthracite/60 mt-1">{programmeLancement.description}</p>
                )}
              </Link>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="rounded-2xl bg-white border border-creme-dark p-4">
                <p className="text-2xl font-semibold text-framboise">{seancesCeMois.nombre}</p>
                <p className="text-xs text-anthracite/50 mt-1">séances ce mois-ci</p>
              </div>
              <div className="rounded-2xl bg-white border border-creme-dark p-4">
                <p className="text-2xl font-semibold text-framboise">{formaterDuree(seancesCeMois.minutes)}</p>
                <p className="text-xs text-anthracite/50 mt-1">d&apos;entraînement</p>
              </div>
              <div className="rounded-2xl bg-white border border-creme-dark p-4">
                <p className="text-2xl font-semibold text-framboise">
                  {serie} {serie >= 2 && "🔥"}
                </p>
                <p className="text-xs text-anthracite/50 mt-1">jours d&apos;affilée</p>
              </div>
              <div className="rounded-2xl bg-white border border-creme-dark p-4">
                <p className="text-2xl font-semibold text-framboise">
                  {programmeEnCours ? `${programmeEnCours.fait}/${programmeEnCours.total}` : "—"}
                </p>
                <p className="text-xs text-anthracite/50 mt-1">
                  {programmeEnCours ? programmeEnCours.titre : "programme en cours"}
                </p>
              </div>
            </div>

            {suggestionNiveau && (
              <button
                onClick={() => setVideoOuverte(suggestionNiveau)}
                className="w-full text-left mb-6 rounded-2xl bg-anthracite text-creme p-5 hover:opacity-90"
              >
                <p className="text-sm font-medium text-orange">🏆 Prête à te challenger ?</p>
                <p className="font-semibold mt-1">
                  Tu enchaînes les séances, essaie {suggestionNiveau.titre} (niveau {suggestionNiveau.niveau})
                </p>
              </button>
            )}

            {videosVedette.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-anthracite/60 mb-3">★ Recommandées pour toi</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videosVedette.map((v) => (
                    <CarteVideo
                      key={v.id}
                      video={v}
                      terminee={terminees.has(v.id)}
                      onClick={() => setVideoOuverte(v)}
                      image={imageEffectiveVideo(v, imagesParCategorie)}
                      accent
                    />
                  ))}
                </div>
              </div>
            )}

            {autresEnCours.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-anthracite/60 mb-3">Séances non terminées</h2>
                <div className="space-y-2">
                  {autresEnCours.map((e) => (
                    <button
                      key={e.video.id}
                      onClick={() => setVideoOuverte(e.video)}
                      className="w-full text-left rounded-xl bg-white border border-creme-dark p-3 flex items-center justify-between hover:border-framboise/50"
                    >
                      <div>
                        <p className="font-medium text-sm">{e.video.titre}</p>
                        <p className="text-xs text-anthracite/50">
                          {e.video.categories?.join(", ")} · {e.video.duree_min} min
                        </p>
                      </div>
                      <span className="text-framboise text-sm">Reprendre ▶</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-anthracite/60">Toutes les séances</h2>
              <Link href="/app/seances" className="text-sm text-framboise font-medium">
                Tout voir →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {videos.slice(0, 6).map((v) => (
                <CarteVideo
                  key={v.id}
                  video={v}
                  terminee={terminees.has(v.id)}
                  onClick={() => setVideoOuverte(v)}
                  image={imageEffectiveVideo(v, imagesParCategorie)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {videoOuverte && (
        <LecteurVideo video={videoOuverte} onFermer={() => setVideoOuverte(null)} onTerminee={charger} />
      )}
    </>
  );
}
