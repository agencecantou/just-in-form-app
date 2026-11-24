"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { imageEffectiveVideo, type Categorie, type ContenuNutrition, type Programme, type Video } from "@/lib/types";
import { alerteVideo } from "@/lib/donnees";
import { phraseSoif } from "@/lib/jeu";
import { Chargement, Page, useAbonnee } from "@/components/EspaceAbonnee";
import CarteVideo, { Intensite } from "@/components/CarteVideo";
import LecteurVideo from "@/components/LecteurVideo";
import Plante from "@/components/Plante";
import { Goutte, IconeCadeau, IconeFleche, IconeLecture } from "@/components/Icones";

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

type EnCours = { video: Video; positionSecondes: number };

function jourDeLAnnee(d = new Date()) {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
}

export default function AppHome() {
  const { donnees } = useAbonnee();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [programmeLancement, setProgrammeLancement] = useState<Programme | null>(null);
  const [ordreProgrammes, setOrdreProgrammes] = useState<Map<string, string[]>>(new Map());
  const [enCours, setEnCours] = useState<EnCours[]>([]);
  const [astuces, setAstuces] = useState<ContenuNutrition[]>([]);
  const [chargement, setChargement] = useState(true);
  const [videoOuverte, setVideoOuverte] = useState<Video | null>(null);

  async function charger() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [v, c, pl, pv, prog, ast] = await Promise.all([
      supabase.from("videos").select("*").eq("statut", "publie").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("ordre", { ascending: true }),
      supabase.from("programmes").select("*").eq("est_lancement", true).eq("statut", "publie").maybeSingle(),
      supabase.from("programme_videos").select("programme_id, video_id, ordre").order("ordre", { ascending: true }),
      user
        ? supabase
            .from("progression_videos")
            .select("video_id, position_secondes, updated_at, videos(*)")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from("contenus_nutrition").select("*").in("type", ["astuce", "citation"]).eq("statut", "publie"),
    ]);
    setVideos((v.data as Video[]) ?? []);
    setCategories((c.data as Categorie[]) ?? []);
    setProgrammeLancement((pl.data as Programme) ?? null);
    const ordre = new Map<string, string[]>();
    for (const l of (pv.data ?? []) as { programme_id: string; video_id: string }[]) {
      ordre.set(l.programme_id, [...(ordre.get(l.programme_id) ?? []), l.video_id]);
    }
    setOrdreProgrammes(ordre);
    type Ligne = { position_secondes: number; videos: Video | null };
    setEnCours(
      ((prog.data ?? []) as unknown as Ligne[]).filter((p) => p.videos).map((p) => ({ video: p.videos as Video, positionSecondes: p.position_secondes }))
    );
    setAstuces(ast.error ? [] : ((ast.data as ContenuNutrition[]) ?? []));
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  const jeu = donnees?.jeu;
  const terminees = useMemo(() => new Set((donnees?.seances ?? []).map((s) => s.video_id)), [donnees]);
  const imagesParCategorie = new Map(categories.map((c) => [c.nom, c.image_url]));
  const parId = new Map(videos.map((v) => [v.id, v]));
  const sante = donnees?.sante ?? {};

  // --- La seance du jour : on decide pour elle.
  const choix = useMemo(() => {
    const libres = videos.filter((v) => !terminees.has(v.id) && !v.categories?.includes("Tutos & conseils"));
    const reprise = enCours.find((e) => !terminees.has(e.video.id));
    if (reprise) return { video: reprise.video, raison: "Reprends où tu t'es arrêtée", reprise };

    const enCoursProg = jeu?.programmes.filter((p) => p.fait > 0 && !p.termine).sort((a, b) => b.fait - a.fait)[0];
    if (enCoursProg) {
      const ids = ordreProgrammes.get(enCoursProg.id) ?? enCoursProg.videoIds;
      const suivante = ids.map((id) => parId.get(id)).find((v) => v && !terminees.has(v.id));
      if (suivante) return { video: suivante, raison: `${enCoursProg.titre} · séance ${enCoursProg.fait + 1} sur ${enCoursProg.total}` };
    }
    if (terminees.size === 0 && programmeLancement) {
      const premiere = (ordreProgrammes.get(programmeLancement.id) ?? []).map((id) => parId.get(id)).find(Boolean);
      if (premiere) return { video: premiere, raison: `Pour bien démarrer · ${programmeLancement.titre}` };
    }
    const temps = sante.temps ?? 30;
    const adaptee = libres.filter(
      (v) => v.est_vedette || (v.duree_min <= temps + 10 && !(sante.enceinte && (v.intensite ?? 2) >= 3))
    );
    const liste = adaptee.length > 0 ? adaptee : libres;
    if (liste.length === 0) return videos[0] ? { video: videos[0], raison: "À refaire sans modération" } : null;
    const vedettes = liste.filter((v) => v.est_vedette);
    const pool = vedettes.length > 0 ? vedettes : liste;
    return { video: pool[jourDeLAnnee() % pool.length], raison: "Choisie pour toi aujourd'hui" };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, terminees, enCours, jeu, ordreProgrammes, programmeLancement]);

  const autres = useMemo(() => {
    const libres = videos.filter((v) => !terminees.has(v.id) && v.id !== choix?.video.id && !v.categories?.includes("Tutos & conseils"));
    const courte = libres.filter((v) => v.duree_min < 15).sort((a, b) => b.duree_min - a.duree_min)[0];
    const douce = libres.find(
      (v) => v.id !== courte?.id && ((v.intensite ?? 2) === 1 || v.categories?.some((c) => c.startsWith("Mobilit")))
    );
    return { courte, douce };
  }, [videos, terminees, choix]);

  const astuce = astuces.filter((a) => a.type === "astuce");
  const citations = astuces.filter((a) => a.type === "citation");
  const astuceDuJour = astuce.length ? astuce[jourDeLAnnee() % astuce.length] : null;
  const citationDuJour = citations.length ? citations[jourDeLAnnee() % citations.length] : null;
  const defisDuMois = (jeu?.defis ?? []).filter((d) => d.estDuMois);
  const nbParCategorie = (nom: string) => videos.filter((v) => v.categories?.includes(nom)).length;
  const categoriesVisibles = categories.filter((c) => nbParCategorie(c.nom) > 0 && c.nom !== "Tutos & conseils");

  const heure = new Date().getHours();
  const salut = heure < 5 || heure >= 18 ? "Bonsoir" : "Salut";

  if (!donnees || chargement) {
    return (
      <Page>
        <Chargement />
      </Page>
    );
  }

  const video = choix?.video;

  return (
    <Page large>
      <header className="flex items-end justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="titre-ecran text-[30px] sm:text-[38px]">
            {salut} {donnees.prenom}
          </h1>
          <p className="text-gris font-medium mt-1.5">
            {terminees.size === 0 ? "Prête pour ta toute première séance ?" : "Prête pour ta séance du jour ?"}
          </p>
        </div>
        <Link href="/compte" className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-rose text-framboise font-extrabold text-lg" aria-label="Mon compte">
          {donnees.profil?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={donnees.profil.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            donnees.prenom.charAt(0).toUpperCase()
          )}
        </Link>
      </header>

      <div className="grid gap-5 lg:gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(300px,1fr)]">
        {/* Colonne principale */}
        <div className="flex flex-col gap-5 lg:gap-6 min-w-0">
          {/* Plante : en premier sur mobile */}
          {jeu && (
            <Link href="/app/progres" className="verre lg:hidden rounded-2xl p-4 pr-5 flex items-center gap-3">
              <Plante palier={jeu.palier} soif={jeu.soif} taille={112} />
              <span className="flex-1 min-w-0">
                <span className="etiquette text-feuille">{jeu.nomPalier}</span>
                <span className="block text-[17px] font-extrabold leading-tight mt-1">{phraseSoif(jeu.soif, jeu.enPause)}</span>
                <span className="mt-2 flex items-center gap-1.5 text-sm font-bold text-eau-dark">
                  <Goutte taille={12} /> {jeu.gouttes} gouttes
                </span>
                {jeu.prochainPalier && (
                  <span className="block text-xs text-gris mt-1">
                    Encore {jeu.prochainPalier.restant} semaine{jeu.prochainPalier.restant > 1 ? "s" : ""} validée{jeu.prochainPalier.restant > 1 ? "s" : ""}
                  </span>
                )}
              </span>
            </Link>
          )}

          {/* Seance du jour */}
          {video ? (
            <section aria-labelledby="seance-jour" className="relative overflow-hidden rounded-2xl bg-framboise text-white shadow-[0_24px_50px_-24px_rgba(146,17,79,.8)]">
              {(() => {
                const img = imageEffectiveVideo(video, imagesParCategorie);
                return img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity" />
                ) : null;
              })()}
              <div className="absolute inset-0 bg-[linear-gradient(100deg,#92114f_30%,rgba(146,17,79,.55)_70%,rgba(146,17,79,.15))]" />
              <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-jaune/35 blur-[2px]" />
              <div className="relative p-6 sm:p-8 flex flex-col gap-3 min-h-[240px] justify-end">
                <p className="text-[13px] font-semibold text-white/85">{choix?.raison}</p>
                <h2 id="seance-jour" className="titre-ecran text-[28px] sm:text-[36px] max-w-[18ch]">
                  {video.titre}
                </h2>
                <p className="flex items-center gap-3 text-sm text-white/85 font-medium">
                  {video.categories?.join(" · ")} · {video.duree_min} min <Intensite niveau={video.intensite} clair />
                </p>
                {choix?.reprise && (
                  <div className="max-w-xs h-1.5 rounded-full bg-white/25 overflow-hidden">
                    <div
                      className="h-full bg-jaune"
                      style={{
                        width: `${Math.min(100, Math.round((choix.reprise.positionSecondes / 60 / Math.max(1, video.duree_min)) * 100))}%`,
                      }}
                    />
                  </div>
                )}
                {alerteVideo(video, sante) && (
                  <p className="max-w-md rounded-lg bg-white/15 px-3 py-2 text-[13px] font-semibold">{alerteVideo(video, sante)}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button onClick={() => setVideoOuverte(video)} className="btn btn-blanc">
                    <IconeLecture taille={12} /> {choix?.reprise ? "Reprendre" : "C'est parti"}
                  </button>
                  {autres.courte && (
                    <button onClick={() => setVideoOuverte(autres.courte!)} className="btn border border-white/40 text-white hover:bg-white/10">
                      Pas le temps ? {autres.courte.duree_min} min
                    </button>
                  )}
                  {autres.douce && (
                    <button onClick={() => setVideoOuverte(autres.douce!)} className="btn border border-white/40 text-white hover:bg-white/10">
                      Envie de douceur
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <div className="verre rounded-2xl p-6">
              <p className="font-bold">Aucune séance publiée pour le moment</p>
              <p className="text-sm text-gris mt-1">Les vidéos de Justine arrivent très vite.</p>
            </div>
          )}

          {/* Objectif de la semaine + recompense */}
          {jeu && (
            <div className="grid gap-5 sm:grid-cols-2">
              <section className="verre rounded-2xl p-5 flex items-center gap-4">
                <div
                  className="relative h-[76px] w-[76px] shrink-0 rounded-full"
                  style={{
                    background: `conic-gradient(#92114f 0 ${Math.min(100, (jeu.semaineCourante.nombre / jeu.objectif) * 100)}%, rgba(146,17,79,.12) 0)`,
                  }}
                  role="img"
                  aria-label={`${Math.min(jeu.semaineCourante.nombre, jeu.objectif)} séance(s) sur ${jeu.objectif} cette semaine`}
                >
                  <span className="absolute inset-[9px] rounded-full bg-white flex items-center justify-center chiffre text-lg">
                    {Math.min(jeu.semaineCourante.nombre, jeu.objectif)}/{jeu.objectif}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-snug">
                    {jeu.semaineCourante.statut === "validee"
                      ? "Semaine validée !"
                      : `Objectif : ${jeu.objectif} séance${jeu.objectif > 1 ? "s" : ""} cette semaine`}
                  </p>
                  <div className="flex gap-1 mt-2.5">
                    {JOURS.map((j, i) => {
                      const auj = (new Date().getDay() + 6) % 7 === i;
                      const fait = jeu.joursSemaine[i] > 0;
                      return (
                        <span
                          key={i}
                          className={`h-7 w-7 rounded-lg text-[11px] font-bold flex items-center justify-center ${
                            fait ? "bg-framboise text-white" : auj ? "border-[1.5px] border-framboise text-framboise bg-white" : "bg-encre/5 text-gris"
                          }`}
                        >
                          {j}
                        </span>
                      );
                    })}
                  </div>
                  {jeu.jokerDisponible && jeu.semaineCourante.statut !== "validee" && (
                    <p className="text-[11.5px] text-gris mt-2">Joker du mois encore disponible</p>
                  )}
                </div>
              </section>

              <section className="verre rounded-2xl p-5 flex flex-col justify-center gap-2.5">
                {jeu.prochaineRecompense ? (
                  <>
                    <p className="flex items-center gap-2 text-[13px] font-bold text-[#8a5a00]">
                      <IconeCadeau taille={17} /> Prochaine récompense
                    </p>
                    <p className="text-[15px] font-bold leading-snug">{jeu.prochaineRecompense.titre}</p>
                    <div className="jauge">
                      <i style={{ width: `${Math.min(100, (jeu.gouttes / Math.max(1, jeu.prochaineRecompense.seuil_gouttes)) * 100)}%`, background: "#fab200" }} />
                    </div>
                    <p className="text-xs text-gris">
                      Encore {jeu.prochaineRecompense.restant} goutte{jeu.prochaineRecompense.restant > 1 ? "s" : ""}, soit environ{" "}
                      {Math.max(1, Math.ceil(jeu.prochaineRecompense.restant / 1.5))} séance
                      {Math.ceil(jeu.prochaineRecompense.restant / 1.5) > 1 ? "s" : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[15px] font-bold">Toutes les récompenses sont débloquées</p>
                    <Link href="/app/progres" className="text-sm font-semibold text-framboise">
                      Voir mes récompenses
                    </Link>
                  </>
                )}
              </section>
            </div>
          )}

          {/* Explorer */}
          {categoriesVisibles.length > 0 && (
            <section aria-labelledby="explorer">
              <div className="flex items-baseline justify-between mb-3">
                <h2 id="explorer" className="text-lg font-extrabold tracking-tight">
                  Explorer par discipline
                </h2>
                <Link href="/app/seances" className="text-sm font-semibold text-framboise inline-flex items-center gap-1">
                  {videos.length} séances <IconeFleche taille={15} />
                </Link>
              </div>
              <div className="defile -mx-4 px-4 flex gap-3 overflow-x-auto snap-x lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
                {categoriesVisibles.slice(0, 8).map((c) => (
                  <Link
                    key={c.id}
                    href={`/app/seances?categorie=${encodeURIComponent(c.nom)}`}
                    className="group relative snap-start shrink-0 w-40 lg:w-auto h-32 rounded-2xl overflow-hidden bg-rose"
                  >
                    {c.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-encre/75 via-encre/10 to-transparent" />
                    <span className="absolute left-3 bottom-3 right-3 text-white">
                      <span className="block font-extrabold leading-tight">{c.nom}</span>
                      <span className="block text-[11.5px] text-white/80 font-medium">{nbParCategorie(c.nom)} séances</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Reprendre d'autres seances */}
          {enCours.filter((e) => !terminees.has(e.video.id) && e.video.id !== video?.id).length > 0 && (
            <section>
              <h2 className="text-lg font-extrabold tracking-tight mb-3">Séances commencées</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {enCours
                  .filter((e) => !terminees.has(e.video.id) && e.video.id !== video?.id)
                  .slice(0, 3)
                  .map((e) => (
                    <CarteVideo
                      key={e.video.id}
                      video={e.video}
                      terminee={false}
                      progression={Math.min(100, Math.round((e.positionSecondes / 60 / Math.max(1, e.video.duree_min)) * 100))}
                      image={imageEffectiveVideo(e.video, imagesParCategorie)}
                      alerte={alerteVideo(e.video, sante)}
                      onClick={() => setVideoOuverte(e.video)}
                    />
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* Colonne laterale */}
        <aside className="flex flex-col gap-5 lg:gap-6 min-w-0">
          {jeu && (
            <Link href="/app/progres" className="verre hidden lg:flex rounded-2xl p-6 flex-col items-center text-center gap-2 hover:shadow-[0_18px_40px_-18px_rgba(146,17,79,.4)] transition">
              <Plante palier={jeu.palier} soif={jeu.soif} taille={180} />
              <span className="etiquette text-feuille">
                Palier {jeu.palier} · {jeu.nomPalier}
              </span>
              <span className="text-xl font-extrabold tracking-tight">{phraseSoif(jeu.soif, jeu.enPause)}</span>
              <span className="flex items-center gap-1.5 text-[15px] font-bold text-eau-dark">
                <Goutte taille={13} /> {jeu.gouttes} gouttes
              </span>
              <span className="w-full jauge mt-2">
                <i style={{ width: `${Math.round(jeu.progresPalier * 100)}%`, background: "linear-gradient(90deg,#8fd3e6,#3f8f63)" }} />
              </span>
              <span className="text-[13px] text-gris">
                {jeu.prochainPalier
                  ? `Encore ${jeu.prochainPalier.restant} semaine${jeu.prochainPalier.restant > 1 ? "s" : ""} validée${jeu.prochainPalier.restant > 1 ? "s" : ""} : ${jeu.prochainPalier.nom.toLowerCase()}`
                  : "Ta plante a atteint son plus beau palier"}
              </span>
            </Link>
          )}

          {defisDuMois.map((d) => (
            <section key={d.id} className="verre rounded-2xl p-5 flex flex-col gap-2.5">
              <p className="text-[13px] font-bold text-framboise">
                {d.type === "mission" ? "Mission" : "Défi"} de {new Date().toLocaleDateString("fr-FR", { month: "long" })}
              </p>
              <p className="text-base font-bold leading-snug">{d.titre}</p>
              {d.description && <p className="text-[13px] text-gris">{d.description}</p>}
              {d.type === "mission" ? (
                <>
                  <div className="flex gap-1.5" aria-label={`${d.actuel} sur ${d.nombre}`}>
                    {Array.from({ length: Math.min(d.nombre, 12) }, (_, i) => (
                      <span key={i} className={`h-2 flex-1 rounded-sm ${i < d.actuel ? "bg-framboise" : "bg-encre/10"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gris">
                    {d.valide ? "Mission accomplie" : `${d.actuel} sur ${d.nombre}`} · +{d.gouttes} gouttes
                  </p>
                </>
              ) : (
                <DefiPerso defi={d} />
              )}
            </section>
          ))}

          {(astuceDuJour || citationDuJour) && (
            <Link href="/app/nutrition" className="verre rounded-2xl p-5 flex flex-col gap-2 hover:shadow-[0_18px_40px_-18px_rgba(63,143,99,.45)] transition">
              <p className="text-[13px] font-bold text-feuille-dark">L&apos;astuce santé du jour</p>
              {astuceDuJour && <p className="text-[15px] font-bold leading-snug">{astuceDuJour.titre}</p>}
              {astuceDuJour?.resume && <p className="text-[13px] text-gris leading-relaxed">{astuceDuJour.resume}</p>}
              {citationDuJour && <p className="text-[13px] italic text-gris filet pt-2 mt-1">« {citationDuJour.titre} »</p>}
            </Link>
          )}
        </aside>
      </div>

      {videoOuverte && <LecteurVideo video={videoOuverte} onFermer={() => setVideoOuverte(null)} onTerminee={charger} />}
    </Page>
  );
}

function DefiPerso({ defi }: { defi: { id: string; valide: boolean; gouttes: number } }) {
  const { donnees, rafraichir } = useAbonnee();
  const [envoi, setEnvoi] = useState(false);
  if (defi.valide) return <p className="text-sm font-bold text-feuille-dark">Défi relevé, bravo ! +{defi.gouttes} gouttes</p>;
  return (
    <button
      disabled={envoi || !donnees?.userId}
      onClick={async () => {
        setEnvoi(true);
        await createClient().from("defis_valides").insert({ user_id: donnees!.userId, defi_id: defi.id });
        await rafraichir();
        setEnvoi(false);
      }}
      className="btn btn-clair self-start"
    >
      J&apos;ai réussi (+{defi.gouttes} gouttes)
    </button>
  );
}
