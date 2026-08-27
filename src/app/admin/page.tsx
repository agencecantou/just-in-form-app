"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extraireVimeoId } from "@/lib/vimeo";
import { CATEGORIES, NIVEAUX, type Programme, type ProgrammeVideo, type Video } from "@/lib/types";

export default function Admin() {
  const [section, setSection] = useState<"videos" | "programmes">("videos");

  return (
    <div className="flex-1 flex">
      <aside className="hidden sm:flex w-56 flex-col gap-1 bg-anthracite text-creme px-4 py-6">
        <p className="mb-4 px-2 text-lg font-semibold">Espace coach</p>
        <button
          onClick={() => setSection("videos")}
          className={`text-left rounded-lg px-3 py-2 text-sm ${
            section === "videos"
              ? "bg-orange text-anthracite font-medium"
              : "text-creme/70 hover:bg-white/10"
          }`}
        >
          Mes videos
        </button>
        <button
          onClick={() => setSection("programmes")}
          className={`text-left rounded-lg px-3 py-2 text-sm ${
            section === "programmes"
              ? "bg-orange text-anthracite font-medium"
              : "text-creme/70 hover:bg-white/10"
          }`}
        >
          Programmes
        </button>
        <a href="/app" className="mt-auto rounded-lg px-3 py-2 text-sm text-creme/70 hover:bg-white/10">
          Voir cote abonnee
        </a>
      </aside>

      {section === "videos" ? <SectionVideos /> : <SectionProgrammes />}
    </div>
  );
}

function SectionVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const [titre, setTitre] = useState("");
  const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<string[]>([]);
  const [dureeMin, setDureeMin] = useState(20);
  const [niveau, setNiveau] = useState<string>(NIVEAUX[0]);
  const [lienVimeo, setLienVimeo] = useState("");
  const [estVedette, setEstVedette] = useState(false);
  const [videoEnEdition, setVideoEnEdition] = useState<Video | null>(null);

  async function chargerVideos() {
    setChargement(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setErreur(error.message);
    else setVideos(data as Video[]);
    setChargement(false);
  }

  useEffect(() => {
    chargerVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCategorie(cat: string) {
    setCategoriesSelectionnees((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function reinitialiserFormulaire() {
    setTitre("");
    setLienVimeo("");
    setDureeMin(20);
    setCategoriesSelectionnees([]);
    setEstVedette(false);
    setVideoEnEdition(null);
  }

  function commencerEdition(video: Video) {
    setVideoEnEdition(video);
    setTitre(video.titre);
    setCategoriesSelectionnees(video.categories ?? []);
    setDureeMin(video.duree_min);
    setNiveau(video.niveau);
    setLienVimeo(`https://vimeo.com/${video.vimeo_id}`);
    setEstVedette(video.est_vedette);
    setErreur(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function ajouterVideo(
    e: React.MouseEvent<HTMLButtonElement>,
    statut: "publie" | "brouillon"
  ) {
    e.preventDefault();
    setErreur(null);

    const vimeoId = extraireVimeoId(lienVimeo);
    if (!vimeoId) {
      setErreur("Lien ou identifiant Vimeo invalide.");
      return;
    }
    if (!titre.trim()) {
      setErreur("Le titre est obligatoire.");
      return;
    }
    if (categoriesSelectionnees.length === 0) {
      setErreur("Choisis au moins une categorie.");
      return;
    }

    setEnvoi(true);
    const supabase = createClient();
    const donnees = {
      titre: titre.trim(),
      categories: categoriesSelectionnees,
      duree_min: dureeMin,
      niveau,
      vimeo_id: vimeoId,
      statut,
      est_vedette: estVedette,
    };

    const { error } = videoEnEdition
      ? await supabase.from("videos").update(donnees).eq("id", videoEnEdition.id)
      : await supabase.from("videos").insert(donnees);
    setEnvoi(false);

    if (error) {
      setErreur(error.message);
      return;
    }

    reinitialiserFormulaire();
    chargerVideos();
  }

  async function changerStatut(video: Video) {
    const nouveauStatut = video.statut === "publie" ? "brouillon" : "publie";
    const supabase = createClient();
    await supabase.from("videos").update({ statut: nouveauStatut }).eq("id", video.id);
    chargerVideos();
  }

  async function changerVedette(video: Video) {
    const supabase = createClient();
    await supabase.from("videos").update({ est_vedette: !video.est_vedette }).eq("id", video.id);
    chargerVideos();
  }

  async function supprimerVideo(id: string) {
    const supabase = createClient();
    await supabase.from("videos").delete().eq("id", id);
    chargerVideos();
  }

  return (
    <main className="flex-1 px-6 py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">
        {videoEnEdition ? `Modifier : ${videoEnEdition.titre}` : "Ajouter une video"}
      </h1>

      <form className="rounded-2xl bg-white border border-creme-dark p-5 mb-8 space-y-4">
        <div>
          <label className="text-sm font-medium">Titre</label>
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex : HIIT debutant 20 min"
            className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Categories <span className="text-anthracite/40 font-normal">(plusieurs possibles, ex : Mix)</span>
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggleCategorie(c)}
                className={`rounded-full px-3 py-1.5 text-sm border ${
                  categoriesSelectionnees.includes(c)
                    ? "bg-framboise text-white border-framboise"
                    : "bg-white text-anthracite/70 border-creme-dark"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Niveau</label>
            <select
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
            >
              {NIVEAUX.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Duree (minutes)</label>
            <input
              type="number"
              min={1}
              value={dureeMin}
              onChange={(e) => setDureeMin(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Lien Vimeo</label>
          <input
            value={lienVimeo}
            onChange={(e) => setLienVimeo(e.target.value)}
            placeholder="https://vimeo.com/123456789"
            className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={estVedette}
            onChange={(e) => setEstVedette(e.target.checked)}
          />
          Mettre en avant (recommandee sur l&apos;accueil de l&apos;app)
        </label>

        {erreur && <p className="text-sm text-framboise">{erreur}</p>}

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            disabled={envoi}
            onClick={(e) => ajouterVideo(e, "publie")}
            className="rounded-full bg-framboise text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {videoEnEdition ? "Enregistrer et publier" : "Publier"}
          </button>
          <button
            type="button"
            disabled={envoi}
            onClick={(e) => ajouterVideo(e, "brouillon")}
            className="rounded-full border border-creme-dark px-5 py-2 text-sm disabled:opacity-50"
          >
            Enregistrer en brouillon
          </button>
          {videoEnEdition && (
            <button
              type="button"
              onClick={reinitialiserFormulaire}
              className="rounded-full px-5 py-2 text-sm text-anthracite/50 underline"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <h2 className="text-lg font-semibold mb-3">Mes videos</h2>
      {chargement ? (
        <p className="text-sm text-anthracite/50">Chargement...</p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-anthracite/50">Aucune video pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {videos.map((v) => (
            <div
              key={v.id}
              className="rounded-xl bg-white border border-creme-dark p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium">
                  {v.titre}
                  {v.est_vedette && (
                    <span className="ml-2 text-xs text-orange">★ En avant</span>
                  )}
                </p>
                <p className="text-sm text-anthracite/50">
                  {v.categories?.join(", ")} &middot; {v.duree_min} min &middot; {v.niveau}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    v.statut === "publie"
                      ? "bg-framboise-light text-framboise"
                      : "bg-creme-dark text-anthracite/60"
                  }`}
                >
                  {v.statut === "publie" ? "Publiee" : "Brouillon"}
                </span>
                <button
                  onClick={() => commencerEdition(v)}
                  className="text-xs underline text-anthracite/60"
                >
                  Modifier
                </button>
                <button
                  onClick={() => changerVedette(v)}
                  className="text-xs underline text-anthracite/60"
                >
                  {v.est_vedette ? "Retirer de la une" : "Mettre en avant"}
                </button>
                <button
                  onClick={() => changerStatut(v)}
                  className="text-xs underline text-anthracite/60"
                >
                  {v.statut === "publie" ? "Depublier" : "Publier"}
                </button>
                <button
                  onClick={() => supprimerVideo(v.id)}
                  className="text-xs underline text-anthracite/40"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function SectionProgrammes() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [chargement, setChargement] = useState(true);
  const [programmeActifId, setProgrammeActifId] = useState<string | null>(null);
  const [videosDuProgramme, setVideosDuProgramme] = useState<ProgrammeVideo[]>([]);

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");

  async function chargerTout() {
    setChargement(true);
    const supabase = createClient();
    const [{ data: prog }, { data: vids }] = await Promise.all([
      supabase.from("programmes").select("*").order("created_at", { ascending: false }),
      supabase
        .from("videos")
        .select("*")
        .eq("statut", "publie")
        .order("titre", { ascending: true }),
    ]);
    setProgrammes((prog as Programme[]) ?? []);
    setVideos((vids as Video[]) ?? []);
    setChargement(false);
  }

  useEffect(() => {
    chargerTout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function chargerVideosDuProgramme(programmeId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("programme_videos")
      .select("*, videos(id, titre, categories, duree_min, niveau, vimeo_id)")
      .eq("programme_id", programmeId)
      .order("ordre", { ascending: true });
    setVideosDuProgramme((data as ProgrammeVideo[]) ?? []);
  }

  async function creerProgramme() {
    if (!titre.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("programmes")
      .insert({ titre: titre.trim(), description: description.trim() })
      .select()
      .single();
    setTitre("");
    setDescription("");
    await chargerTout();
    if (data) {
      setProgrammeActifId(data.id);
      chargerVideosDuProgramme(data.id);
    }
  }

  async function changerStatutProgramme(programme: Programme) {
    const supabase = createClient();
    const nouveauStatut = programme.statut === "publie" ? "brouillon" : "publie";
    await supabase.from("programmes").update({ statut: nouveauStatut }).eq("id", programme.id);
    chargerTout();
  }

  async function supprimerProgramme(id: string) {
    const supabase = createClient();
    await supabase.from("programmes").delete().eq("id", id);
    if (programmeActifId === id) setProgrammeActifId(null);
    chargerTout();
  }

  async function ajouterVideoAuProgramme(videoId: string) {
    if (!programmeActifId) return;
    const supabase = createClient();
    await supabase.from("programme_videos").insert({
      programme_id: programmeActifId,
      video_id: videoId,
      ordre: videosDuProgramme.length,
    });
    chargerVideosDuProgramme(programmeActifId);
  }

  async function retirerVideoDuProgramme(programmeVideoId: string) {
    const supabase = createClient();
    await supabase.from("programme_videos").delete().eq("id", programmeVideoId);
    if (programmeActifId) chargerVideosDuProgramme(programmeActifId);
  }

  async function deplacerVideo(index: number, direction: -1 | 1) {
    const cible = index + direction;
    if (cible < 0 || cible >= videosDuProgramme.length) return;
    const a = videosDuProgramme[index];
    const b = videosDuProgramme[cible];
    const supabase = createClient();
    await Promise.all([
      supabase.from("programme_videos").update({ ordre: b.ordre }).eq("id", a.id),
      supabase.from("programme_videos").update({ ordre: a.ordre }).eq("id", b.id),
    ]);
    if (programmeActifId) chargerVideosDuProgramme(programmeActifId);
  }

  const programmeActif = programmes.find((p) => p.id === programmeActifId);
  const idsDejaAjoutes = new Set(videosDuProgramme.map((pv) => pv.video_id));

  return (
    <main className="flex-1 px-6 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Programmes</h1>

      <div className="rounded-2xl bg-white border border-creme-dark p-5 mb-8 space-y-3">
        <p className="font-medium text-sm">Creer un programme</p>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex : 3 semaines pour reprendre en douceur"
          className="w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Courte description du programme"
          rows={2}
          className="w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
        />
        <button
          onClick={creerProgramme}
          className="rounded-full bg-framboise text-white px-5 py-2 text-sm font-semibold"
        >
          Creer
        </button>
      </div>

      {chargement ? (
        <p className="text-sm text-anthracite/50">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-2">
            {programmes.length === 0 && (
              <p className="text-sm text-anthracite/50">Aucun programme pour le moment.</p>
            )}
            {programmes.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProgrammeActifId(p.id);
                  chargerVideosDuProgramme(p.id);
                }}
                className={`w-full text-left rounded-xl border p-3 ${
                  programmeActifId === p.id
                    ? "border-framboise bg-framboise-light"
                    : "border-creme-dark bg-white"
                }`}
              >
                <p className="font-medium text-sm">{p.titre}</p>
                <span
                  className={`text-xs ${
                    p.statut === "publie" ? "text-framboise" : "text-anthracite/40"
                  }`}
                >
                  {p.statut === "publie" ? "Publie" : "Brouillon"}
                </span>
              </button>
            ))}
          </div>

          <div>
            {!programmeActif ? (
              <p className="text-sm text-anthracite/50">
                Choisis ou cree un programme pour lui associer des seances.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{programmeActif.titre}</p>
                    <p className="text-sm text-anthracite/50">{programmeActif.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => changerStatutProgramme(programmeActif)}
                      className="text-xs underline text-anthracite/60"
                    >
                      {programmeActif.statut === "publie" ? "Depublier" : "Publier"}
                    </button>
                    <button
                      onClick={() => supprimerProgramme(programmeActif.id)}
                      className="text-xs underline text-anthracite/40"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Seances du programme</p>
                  {videosDuProgramme.length === 0 ? (
                    <p className="text-sm text-anthracite/50">
                      Aucune seance ajoutee, choisis-en une ci-dessous.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {videosDuProgramme.map((pv, i) => (
                        <div
                          key={pv.id}
                          className="rounded-xl bg-white border border-creme-dark p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {i + 1}. {pv.videos?.titre}
                            </p>
                            <p className="text-xs text-anthracite/50">
                              {pv.videos?.categories?.join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deplacerVideo(i, -1)}
                              disabled={i === 0}
                              className="text-xs disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => deplacerVideo(i, 1)}
                              disabled={i === videosDuProgramme.length - 1}
                              className="text-xs disabled:opacity-30"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => retirerVideoDuProgramme(pv.id)}
                              className="text-xs underline text-anthracite/40"
                            >
                              Retirer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Ajouter une seance publiee</p>
                  <div className="flex flex-wrap gap-2">
                    {videos
                      .filter((v) => !idsDejaAjoutes.has(v.id))
                      .map((v) => (
                        <button
                          key={v.id}
                          onClick={() => ajouterVideoAuProgramme(v.id)}
                          className="rounded-full border border-creme-dark px-3 py-1.5 text-xs hover:border-framboise"
                        >
                          + {v.titre}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
