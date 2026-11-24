"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OBJECTIFS_VIDEO, ZONES_CORPS, imageEffectiveVideo, type Categorie, type Video } from "@/lib/types";
import { alerteVideo } from "@/lib/donnees";
import { Chargement, EnTete, Page, useAbonnee } from "@/components/EspaceAbonnee";
import CarteVideo from "@/components/CarteVideo";
import LecteurVideo from "@/components/LecteurVideo";
import { IconeFiltres, IconeFleche, IconeRecherche } from "@/components/Icones";

type FiltreDuree = "toutes" | "court" | "moyen" | "long" | "tres-long";
type FiltreMateriel = "tous" | "sans" | "avec";

const FILTRES_DUREE: { valeur: FiltreDuree; label: string }[] = [
  { valeur: "court", label: "Moins de 15 min" },
  { valeur: "moyen", label: "15 à 30 min" },
  { valeur: "long", label: "30 à 45 min" },
  { valeur: "tres-long", label: "Plus de 45 min" },
];

function correspondDuree(video: Video, filtre: FiltreDuree) {
  if (filtre === "toutes") return true;
  if (filtre === "court") return video.duree_min < 15;
  if (filtre === "moyen") return video.duree_min >= 15 && video.duree_min <= 30;
  if (filtre === "long") return video.duree_min > 30 && video.duree_min <= 45;
  return video.duree_min > 45;
}

function sansAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Regroupe les ressentis par video et garde la valeur la plus frequente.
function calculerRessentiParVideo(ressentis: { video_id: string; valeur: number }[]) {
  const parVideo = new Map<string, number[]>();
  for (const r of ressentis) parVideo.set(r.video_id, [...(parVideo.get(r.video_id) ?? []), r.valeur]);
  const resultat = new Map<string, { valeur: number; total: number }>();
  for (const [videoId, valeurs] of parVideo) {
    const comptes = new Map<number, number>();
    for (const v of valeurs) comptes.set(v, (comptes.get(v) ?? 0) + 1);
    const dominante = [...comptes.entries()].sort((a, b) => b[1] - a[1])[0][0];
    resultat.set(videoId, { valeur: dominante, total: valeurs.length });
  }
  return resultat;
}

function SeancesInterieur() {
  const params = useSearchParams();
  const { donnees } = useAbonnee();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [videoOuverte, setVideoOuverte] = useState<Video | null>(null);
  const [ressentiParVideo, setRessentiParVideo] = useState<Map<string, { valeur: number; total: number }>>(new Map());
  const [progressionParVideo, setProgressionParVideo] = useState<Map<string, number>>(new Map());
  const [favoris, setFavoris] = useState<Set<string>>(new Set());

  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState<string | null>(params.get("categorie"));
  const [filtreDuree, setFiltreDuree] = useState<FiltreDuree>("toutes");
  const [filtreMateriel, setFiltreMateriel] = useState<FiltreMateriel>("tous");
  const [filtreZone, setFiltreZone] = useState<string | null>(null);
  const [filtreObjectif, setFiltreObjectif] = useState<string | null>(null);
  const [cacherTerminees, setCacherTerminees] = useState(false);
  const [favorisSeulement, setFavorisSeulement] = useState(false);
  const [panneauOuvert, setPanneauOuvert] = useState(false);

  async function charger() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [v, r, c, p, f] = await Promise.all([
      supabase.from("videos").select("*").eq("statut", "publie").order("created_at", { ascending: false }),
      supabase.from("ressentis").select("video_id, valeur"),
      supabase.from("categories").select("*").order("ordre", { ascending: true }),
      user ? supabase.from("progression_videos").select("video_id, position_secondes").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      user ? supabase.from("favoris").select("video_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    const toutes = (v.data as Video[]) ?? [];
    setVideos(toutes);
    setRessentiParVideo(calculerRessentiParVideo(r.data ?? []));
    setCategories((c.data as Categorie[]) ?? []);
    const prog = new Map<string, number>();
    for (const x of (p.data ?? []) as { video_id: string; position_secondes: number }[]) {
      const vid = toutes.find((y) => y.id === x.video_id);
      if (vid) prog.set(x.video_id, Math.min(100, Math.round((x.position_secondes / 60 / Math.max(1, vid.duree_min)) * 100)));
    }
    setProgressionParVideo(prog);
    setFavoris(new Set(((f.data ?? []) as { video_id: string }[]).map((x) => x.video_id)));
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  const terminees = useMemo(() => new Set((donnees?.seances ?? []).map((s) => s.video_id)), [donnees]);
  const imagesParCategorie = new Map(categories.map((c) => [c.nom, c.image_url]));
  const categoriesUtiles = categories.filter((c) => videos.some((v) => v.categories?.includes(c.nom)));
  const aDesObjectifs = videos.some((v) => (v.objectifs?.length ?? 0) > 0);
  const aDesZones = videos.some((v) => (v.zones_corps?.length ?? 0) > 0);

  const q = sansAccents(recherche.trim());
  const affichees = videos.filter(
    (v) =>
      (!q || sansAccents(`${v.titre} ${v.categories?.join(" ")} ${v.description ?? ""}`).includes(q)) &&
      (!filtreCategorie || v.categories?.includes(filtreCategorie)) &&
      (!filtreZone || v.zones_corps?.includes(filtreZone)) &&
      (!filtreObjectif || v.objectifs?.includes(filtreObjectif)) &&
      correspondDuree(v, filtreDuree) &&
      (filtreMateriel === "tous" || (filtreMateriel === "sans" ? !v.avec_materiel : v.avec_materiel)) &&
      (!cacherTerminees || !terminees.has(v.id)) &&
      (!favorisSeulement || favoris.has(v.id))
  );

  const nbFiltres =
    (filtreDuree !== "toutes" ? 1 : 0) +
    (filtreMateriel !== "tous" ? 1 : 0) +
    (filtreZone ? 1 : 0) +
    (filtreObjectif ? 1 : 0) +
    (cacherTerminees ? 1 : 0) +
    (favorisSeulement ? 1 : 0);

  function reinitialiser() {
    setFiltreDuree("toutes");
    setFiltreMateriel("tous");
    setFiltreZone(null);
    setFiltreObjectif(null);
    setCacherTerminees(false);
    setFavorisSeulement(false);
    setFiltreCategorie(null);
    setRecherche("");
  }

  const groupe = (titre: string, contenu: React.ReactNode) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-gris">{titre}</p>
      <div className="flex flex-wrap gap-1.5">{contenu}</div>
    </div>
  );

  return (
    <Page large>
      <EnTete
        titre="Les séances"
        sousTitre={`${videos.length} vidéos de Justine, à faire quand tu veux`}
        droite={
          <Link href="/app/programmes" className="btn btn-clair">
            Les programmes guidés <IconeFleche taille={16} />
          </Link>
        }
      />

      {chargement ? (
        <Chargement />
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <label className="verre flex-1 flex items-center gap-2.5 rounded-xl px-3.5 h-12">
              <IconeRecherche taille={18} className="text-gris shrink-0" />
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Pilates, abdos, live…"
                aria-label="Rechercher une séance"
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-gris/70"
              />
            </label>
            <button
              onClick={() => setPanneauOuvert((o) => !o)}
              aria-expanded={panneauOuvert}
              className={`btn h-12 ${nbFiltres > 0 ? "btn-principal" : "btn-clair"}`}
            >
              <IconeFiltres taille={18} />
              <span className="hidden sm:inline">Filtres</span>
              {nbFiltres > 0 && <span className="chiffre">{nbFiltres}</span>}
            </button>
          </div>

          <div className="defile -mx-4 px-4 sm:mx-0 sm:px-0 flex sm:flex-wrap gap-1.5 overflow-x-auto mb-4">
            <button className="choix shrink-0" aria-pressed={filtreCategorie === null} onClick={() => setFiltreCategorie(null)}>
              Toutes
            </button>
            {categoriesUtiles.map((c) => (
              <button
                key={c.id}
                className="choix shrink-0"
                aria-pressed={filtreCategorie === c.nom}
                onClick={() => setFiltreCategorie(filtreCategorie === c.nom ? null : c.nom)}
              >
                {c.nom}
              </button>
            ))}
          </div>

          {panneauOuvert && (
            <div className="verre apparition rounded-2xl p-5 mb-5 grid gap-5 sm:grid-cols-2">
              {groupe(
                "Durée",
                FILTRES_DUREE.map((f) => (
                  <button key={f.valeur} className="choix choix-doux" aria-pressed={filtreDuree === f.valeur} onClick={() => setFiltreDuree(filtreDuree === f.valeur ? "toutes" : f.valeur)}>
                    {f.label}
                  </button>
                ))
              )}
              {groupe(
                "Matériel",
                (["sans", "avec"] as const).map((m) => (
                  <button key={m} className="choix choix-doux" aria-pressed={filtreMateriel === m} onClick={() => setFiltreMateriel(filtreMateriel === m ? "tous" : m)}>
                    {m === "sans" ? "Sans matériel" : "Avec matériel"}
                  </button>
                ))
              )}
              {aDesZones &&
                groupe(
                  "Zone du corps",
                  ZONES_CORPS.map((z) => (
                    <button key={z} className="choix choix-doux" aria-pressed={filtreZone === z} onClick={() => setFiltreZone(filtreZone === z ? null : z)}>
                      {z}
                    </button>
                  ))
                )}
              {aDesObjectifs &&
                groupe(
                  "Objectif",
                  OBJECTIFS_VIDEO.map((o) => (
                    <button key={o} className="choix choix-doux" aria-pressed={filtreObjectif === o} onClick={() => setFiltreObjectif(filtreObjectif === o ? null : o)}>
                      {o}
                    </button>
                  ))
                )}
              {groupe(
                "Affichage",
                <>
                  <button className="choix choix-doux" aria-pressed={cacherTerminees} onClick={() => setCacherTerminees((x) => !x)}>
                    Cacher les terminées
                  </button>
                  <button className="choix choix-doux" aria-pressed={favorisSeulement} onClick={() => setFavorisSeulement((x) => !x)}>
                    Mes favoris
                  </button>
                </>
              )}
              <div className="sm:col-span-2 flex justify-between items-center filet pt-4">
                <span className="text-sm text-gris">
                  {affichees.length} séance{affichees.length > 1 ? "s" : ""}
                </span>
                <button onClick={reinitialiser} className="text-sm font-semibold text-framboise">
                  Tout réinitialiser
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            {affichees.map((v) => (
              <CarteVideo
                key={v.id}
                video={v}
                terminee={terminees.has(v.id)}
                ressenti={ressentiParVideo.get(v.id)}
                progression={progressionParVideo.get(v.id)}
                image={imageEffectiveVideo(v, imagesParCategorie)}
                alerte={alerteVideo(v, donnees?.sante ?? {})}
                favori={favoris.has(v.id)}
                onClick={() => setVideoOuverte(v)}
              />
            ))}
          </div>
          {affichees.length === 0 && (
            <div className="verre rounded-2xl p-6 text-center">
              <p className="font-bold">Aucune séance ne correspond</p>
              <button onClick={reinitialiser} className="text-sm font-semibold text-framboise mt-2">
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </>
      )}

      {videoOuverte && <LecteurVideo video={videoOuverte} onFermer={() => setVideoOuverte(null)} onTerminee={charger} />}
    </Page>
  );
}

export default function SeancesPage() {
  return (
    <Suspense>
      <SeancesInterieur />
    </Suspense>
  );
}
