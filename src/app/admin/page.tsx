"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extraireVimeoId } from "@/lib/vimeo";
import {
  NIVEAUX,
  ZONES_CORPS,
  type Avis,
  type Categorie,
  type Programme,
  type ProgrammeVideo,
  type Video,
} from "@/lib/types";

export default function Admin() {
  const [section, setSection] = useState<
    "videos" | "programmes" | "categories" | "comptes" | "avis"
  >("videos");

  return (
    <div className="flex-1 flex flex-col sm:flex-row">
      <aside className="flex flex-row sm:flex-col gap-1 sm:w-56 overflow-x-auto bg-anthracite text-creme px-3 sm:px-4 py-3 sm:py-6">
        <p className="hidden sm:block mb-4 px-2 text-lg font-semibold">Espace coach</p>
        <button
          onClick={() => setSection("videos")}
          className={`shrink-0 whitespace-nowrap text-left rounded-lg px-3 py-2 text-sm ${
            section === "videos"
              ? "bg-orange text-anthracite font-medium"
              : "text-creme/70 hover:bg-white/10"
          }`}
        >
          Mes videos
        </button>
        <button
          onClick={() => setSection("programmes")}
          className={`shrink-0 whitespace-nowrap text-left rounded-lg px-3 py-2 text-sm ${
            section === "programmes"
              ? "bg-orange text-anthracite font-medium"
              : "text-creme/70 hover:bg-white/10"
          }`}
        >
          Programmes
        </button>
        <button
          onClick={() => setSection("categories")}
          className={`shrink-0 whitespace-nowrap text-left rounded-lg px-3 py-2 text-sm ${
            section === "categories"
              ? "bg-orange text-anthracite font-medium"
              : "text-creme/70 hover:bg-white/10"
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setSection("comptes")}
          className={`shrink-0 whitespace-nowrap text-left rounded-lg px-3 py-2 text-sm ${
            section === "comptes"
              ? "bg-orange text-anthracite font-medium"
              : "text-creme/70 hover:bg-white/10"
          }`}
        >
          Comptes
        </button>
        <button
          onClick={() => setSection("avis")}
          className={`shrink-0 whitespace-nowrap text-left rounded-lg px-3 py-2 text-sm ${
            section === "avis"
              ? "bg-orange text-anthracite font-medium"
              : "text-creme/70 hover:bg-white/10"
          }`}
        >
          Avis des abonnees
        </button>
        <a
          href="/app"
          className="shrink-0 whitespace-nowrap sm:mt-auto rounded-lg px-3 py-2 text-sm text-creme/70 hover:bg-white/10"
        >
          Voir cote abonnee
        </a>
      </aside>

      {section === "videos" && <SectionVideos />}
      {section === "programmes" && <SectionProgrammes />}
      {section === "categories" && <SectionCategories />}
      {section === "comptes" && <SectionComptes />}
      {section === "avis" && <SectionAvis />}
    </div>
  );
}

function SectionComptes() {
  const [email, setEmail] = useState("");
  const [prenom, setPrenom] = useState("");
  const [role, setRole] = useState<"abonnee" | "coach">("abonnee");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  async function creerCompte(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setSucces(null);
    if (!email.trim()) {
      setErreur("Email requis.");
      return;
    }
    setEnvoi(true);
    const reponse = await fetch("/api/admin/creer-compte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), prenom: prenom.trim(), role }),
    });
    const resultat = await reponse.json();
    setEnvoi(false);

    if (!reponse.ok) {
      setErreur(resultat.erreur || "Une erreur est survenue.");
      return;
    }
    setSucces(`Invitation envoyee a ${email.trim()}.`);
    setEmail("");
    setPrenom("");
    setRole("abonnee");
  }

  return (
    <main className="flex-1 px-6 py-8 max-w-lg">
      <h1 className="text-2xl font-semibold mb-1">Comptes</h1>
      <p className="text-anthracite/60 mb-6">
        Cree un compte pour une abonnee (ou un autre coach) sans qu&apos;elle
        ait besoin de s&apos;inscrire elle-meme. Un email d&apos;invitation
        lui est envoye pour qu&apos;elle definisse son mot de passe.
      </p>

      <form onSubmit={creerCompte} className="rounded-2xl bg-white border border-creme-dark p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            Prenom <span className="text-anthracite/40 font-normal">(optionnel)</span>
          </label>
          <input
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Type de compte</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "abonnee" | "coach")}
            className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
          >
            <option value="abonnee">Abonnee</option>
            <option value="coach">Coach</option>
          </select>
        </div>

        {erreur && <p className="text-sm text-framboise">{erreur}</p>}
        {succes && <p className="text-sm text-framboise">{succes}</p>}

        <button
          type="submit"
          disabled={envoi}
          className="rounded-full bg-framboise text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {envoi ? "Envoi..." : "Envoyer l'invitation"}
        </button>
      </form>
    </main>
  );
}

function SectionCategories() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [nouveau, setNouveau] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [renommage, setRenommage] = useState<{ id: string; nom: string } | null>(null);
  const [uploadEnCoursId, setUploadEnCoursId] = useState<string | null>(null);

  async function charger() {
    setChargement(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("ordre", { ascending: true });
    setCategories((data as Categorie[]) ?? []);
    setChargement(false);
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ajouter() {
    if (!nouveau.trim()) return;
    setErreur(null);
    const supabase = createClient();
    const ordreMax = categories.reduce((m, c) => Math.max(m, c.ordre), -1);
    const { error } = await supabase
      .from("categories")
      .insert({ nom: nouveau.trim(), ordre: ordreMax + 1 });
    if (error) {
      setErreur(error.message);
      return;
    }
    setNouveau("");
    charger();
  }

  async function renommer() {
    if (!renommage || !renommage.nom.trim()) return;
    const supabase = createClient();
    await supabase
      .from("categories")
      .update({ nom: renommage.nom.trim() })
      .eq("id", renommage.id);
    setRenommage(null);
    charger();
  }

  async function supprimer(id: string) {
    const supabase = createClient();
    await supabase.from("categories").delete().eq("id", id);
    charger();
  }

  async function uploaderImageCategorie(id: string, fichier: File) {
    setUploadEnCoursId(id);
    setErreur(null);
    const supabase = createClient();
    const chemin = `categories/${Date.now()}-${fichier.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("images").upload(chemin, fichier);
    if (error) {
      setErreur(error.message);
      setUploadEnCoursId(null);
      return;
    }
    const { data } = supabase.storage.from("images").getPublicUrl(chemin);
    await supabase.from("categories").update({ image_url: data.publicUrl }).eq("id", id);
    setUploadEnCoursId(null);
    charger();
  }

  async function supprimerImageCategorie(id: string) {
    const supabase = createClient();
    await supabase.from("categories").update({ image_url: null }).eq("id", id);
    charger();
  }

  return (
    <main className="flex-1 px-6 py-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Categories</h1>
      <p className="text-anthracite/60 mb-6">
        Gere la liste des categories utilisees pour classer les videos, sans
        avoir besoin de repasser par le developpement. Chaque categorie peut
        avoir une image par defaut : si une video n&apos;a pas sa propre
        image, celle de sa premiere categorie avec une image sera utilisee.
      </p>

      <div className="rounded-2xl bg-white border border-creme-dark p-5 mb-6 flex gap-3">
        <input
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ajouter()}
          placeholder="Nouvelle categorie (ex : Renforcement)"
          className="flex-1 rounded-lg border border-creme-dark px-3 py-2 text-sm"
        />
        <button
          onClick={ajouter}
          className="rounded-full bg-framboise text-white px-5 py-2 text-sm font-semibold"
        >
          Ajouter
        </button>
      </div>
      {erreur && <p className="text-sm text-framboise mb-4">{erreur}</p>}

      {chargement ? (
        <p className="text-sm text-anthracite/50">Chargement...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-anthracite/50">Aucune categorie pour le moment.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="rounded-xl bg-white border border-creme-dark p-3 flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="flex items-center gap-3 min-w-0">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image_url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-creme-dark shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-creme border border-creme-dark shrink-0" />
                )}
                {renommage?.id === c.id ? (
                  <input
                    autoFocus
                    value={renommage.nom}
                    onChange={(e) => setRenommage({ id: c.id, nom: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && renommer()}
                    className="flex-1 rounded-lg border border-creme-dark px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium truncate">{c.nom}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {renommage?.id === c.id ? (
                  <>
                    <button onClick={renommer} className="text-xs underline text-framboise">
                      Valider
                    </button>
                    <button
                      onClick={() => setRenommage(null)}
                      className="text-xs underline text-anthracite/40"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <label className="text-xs underline text-anthracite/60 cursor-pointer">
                      {uploadEnCoursId === c.id ? "Envoi..." : c.image_url ? "Changer l'image" : "Ajouter une image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadEnCoursId === c.id}
                        onChange={(e) => {
                          const fichier = e.target.files?.[0];
                          if (fichier) uploaderImageCategorie(c.id, fichier);
                        }}
                      />
                    </label>
                    {c.image_url && (
                      <button
                        onClick={() => supprimerImageCategorie(c.id)}
                        className="text-xs underline text-anthracite/40"
                      >
                        Retirer l&apos;image
                      </button>
                    )}
                    <button
                      onClick={() => setRenommage({ id: c.id, nom: c.nom })}
                      className="text-xs underline text-anthracite/60"
                    >
                      Renommer
                    </button>
                    <button
                      onClick={() => supprimer(c.id)}
                      className="text-xs underline text-anthracite/40"
                    >
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function SectionAvis() {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("avis")
        .select("*, videos(titre), profiles(prenom, email)")
        .order("created_at", { ascending: false });
      setAvis((data as Avis[]) ?? []);
      setChargement(false);
    }
    charger();
  }, []);

  return (
    <main className="flex-1 px-6 py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Avis des abonnees</h1>
      <p className="text-anthracite/60 mb-6">
        Les messages libres laisses apres une seance, prives (non visibles des autres abonnees).
      </p>

      {chargement ? (
        <p className="text-sm text-anthracite/50">Chargement...</p>
      ) : avis.length === 0 ? (
        <p className="text-sm text-anthracite/50">Aucun avis pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {avis.map((a) => (
            <div key={a.id} className="rounded-xl bg-white border border-creme-dark p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-medium">
                  {a.profiles?.prenom || a.profiles?.email || "Abonnee"}
                  {a.videos?.titre && (
                    <span className="text-anthracite/50 font-normal"> · {a.videos.titre}</span>
                  )}
                </p>
                <p className="text-xs text-anthracite/40">
                  {new Date(a.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <p className="text-sm text-anthracite/70 mt-2">{a.message}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function SectionVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [banqueOuverte, setBanqueOuverte] = useState(false);
  const [banqueImages, setBanqueImages] = useState<string[]>([]);
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<string[]>([]);
  const [zonesSelectionnees, setZonesSelectionnees] = useState<string[]>([]);
  const [avecMateriel, setAvecMateriel] = useState(false);
  const [dureeMin, setDureeMin] = useState(20);
  const [niveau, setNiveau] = useState<string>(NIVEAUX[0]);
  const [lienVimeo, setLienVimeo] = useState("");
  const [estVedette, setEstVedette] = useState(false);
  const [videoEnEdition, setVideoEnEdition] = useState<Video | null>(null);

  async function chargerVideos() {
    setChargement(true);
    const supabase = createClient();
    const [{ data, error }, { data: cats }] = await Promise.all([
      supabase.from("videos").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("ordre", { ascending: true }),
    ]);

    if (error) setErreur(error.message);
    else setVideos(data as Video[]);
    setCategories((cats as Categorie[]) ?? []);
    setChargement(false);
  }

  useEffect(() => {
    chargerVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ouvrirBanque() {
    setBanqueOuverte(true);
    const supabase = createClient();
    const { data } = await supabase.storage.from("images").list("videos", {
      sortBy: { column: "created_at", order: "desc" },
    });
    const urls = (data ?? [])
      .filter((f) => f.name)
      .map(
        (f) => supabase.storage.from("images").getPublicUrl(`videos/${f.name}`).data.publicUrl
      );
    setBanqueImages(urls);
  }

  async function uploaderImage(fichier: File) {
    setUploadEnCours(true);
    setErreur(null);
    const supabase = createClient();
    const chemin = `videos/${Date.now()}-${fichier.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("images").upload(chemin, fichier);
    setUploadEnCours(false);
    if (error) {
      setErreur(error.message);
      return;
    }
    const { data } = supabase.storage.from("images").getPublicUrl(chemin);
    setImageUrl(data.publicUrl);
  }

  function toggleCategorie(cat: string) {
    setCategoriesSelectionnees((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleZone(zone: string) {
    setZonesSelectionnees((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  }

  function reinitialiserFormulaire() {
    setTitre("");
    setDescription("");
    setImageUrl(null);
    setLienVimeo("");
    setDureeMin(20);
    setCategoriesSelectionnees([]);
    setZonesSelectionnees([]);
    setAvecMateriel(false);
    setEstVedette(false);
    setVideoEnEdition(null);
  }

  function commencerEdition(video: Video) {
    setVideoEnEdition(video);
    setTitre(video.titre);
    setDescription(video.description ?? "");
    setImageUrl(video.image_url ?? null);
    setCategoriesSelectionnees(video.categories ?? []);
    setZonesSelectionnees(video.zones_corps ?? []);
    setAvecMateriel(video.avec_materiel ?? false);
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
      description: description.trim() || null,
      image_url: imageUrl,
      categories: categoriesSelectionnees,
      zones_corps: zonesSelectionnees,
      avec_materiel: avecMateriel,
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
            {categories.length === 0 && (
              <p className="text-xs text-anthracite/50">
                Aucune categorie, cree-les d&apos;abord dans l&apos;onglet Categories.
              </p>
            )}
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleCategorie(c.nom)}
                className={`rounded-full px-3 py-1.5 text-sm border ${
                  categoriesSelectionnees.includes(c.nom)
                    ? "bg-framboise text-white border-framboise"
                    : "bg-white text-anthracite/70 border-creme-dark"
                }`}
              >
                {c.nom}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">
            Zones du corps <span className="text-anthracite/40 font-normal">(optionnel, plusieurs possibles)</span>
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ZONES_CORPS.map((z) => (
              <button
                type="button"
                key={z}
                onClick={() => toggleZone(z)}
                className={`rounded-full px-3 py-1.5 text-sm border ${
                  zonesSelectionnees.includes(z)
                    ? "bg-framboise text-white border-framboise"
                    : "bg-white text-anthracite/70 border-creme-dark"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={avecMateriel}
            onChange={(e) => setAvecMateriel(e.target.checked)}
          />
          Nécessite du matériel
        </label>

        <div>
          <label className="text-sm font-medium">
            Description <span className="text-anthracite/40 font-normal">(visible par l&apos;abonnee)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Ce que contient la video, le materiel necessaire, les points d'attention..."
            className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Image</label>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="w-20 h-20 rounded-lg object-cover border border-creme-dark"
              />
            )}
            <label className="rounded-full border border-creme-dark px-4 py-2 text-sm cursor-pointer hover:border-framboise/50">
              {uploadEnCours ? "Envoi..." : "Envoyer une image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadEnCours}
                onChange={(e) => {
                  const fichier = e.target.files?.[0];
                  if (fichier) uploaderImage(fichier);
                }}
              />
            </label>
            <button
              type="button"
              onClick={ouvrirBanque}
              className="rounded-full border border-creme-dark px-4 py-2 text-sm hover:border-framboise/50"
            >
              Choisir dans la banque
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="text-xs underline text-anthracite/40"
              >
                Retirer
              </button>
            )}
          </div>

          {banqueOuverte && (
            <div className="mt-3 rounded-xl border border-creme-dark p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-anthracite/60">
                  Images deja envoyees
                </p>
                <button
                  type="button"
                  onClick={() => setBanqueOuverte(false)}
                  className="text-xs underline text-anthracite/40"
                >
                  Fermer
                </button>
              </div>
              {banqueImages.length === 0 ? (
                <p className="text-xs text-anthracite/50">
                  Aucune image envoyee pour l&apos;instant.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {banqueImages.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt=""
                      onClick={() => {
                        setImageUrl(url);
                        setBanqueOuverte(false);
                      }}
                      className={`w-16 h-16 rounded-lg object-cover border cursor-pointer ${
                        imageUrl === url ? "border-framboise" : "border-creme-dark"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
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
                  {v.avec_materiel && " · Materiel"}
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
  const [estLancement, setEstLancement] = useState(false);

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
    if (estLancement) {
      await supabase.from("programmes").update({ est_lancement: false }).eq("est_lancement", true);
    }
    const { data } = await supabase
      .from("programmes")
      .insert({ titre: titre.trim(), description: description.trim(), est_lancement: estLancement })
      .select()
      .single();
    setTitre("");
    setDescription("");
    setEstLancement(false);
    await chargerTout();
    if (data) {
      setProgrammeActifId(data.id);
      chargerVideosDuProgramme(data.id);
    }
  }

  // Un seul programme de lancement a la fois : on decoche les autres avant
  // de cocher celui-ci.
  async function definirCommeLancement(programme: Programme) {
    const supabase = createClient();
    if (!programme.est_lancement) {
      await supabase.from("programmes").update({ est_lancement: false }).eq("est_lancement", true);
      await supabase.from("programmes").update({ est_lancement: true }).eq("id", programme.id);
    } else {
      await supabase.from("programmes").update({ est_lancement: false }).eq("id", programme.id);
    }
    chargerTout();
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={estLancement}
            onChange={(e) => setEstLancement(e.target.checked)}
          />
          Programme de lancement{" "}
          <span className="text-anthracite/40">
            (propose automatiquement a toute personne qui n&apos;a encore termine aucune seance)
          </span>
        </label>
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
                <p className="font-medium text-sm">
                  {p.titre}
                  {p.est_lancement && (
                    <span className="ml-2 text-xs text-orange">🚀 Lancement</span>
                  )}
                </p>
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
                    <p className="font-semibold">
                      {programmeActif.titre}
                      {programmeActif.est_lancement && (
                        <span className="ml-2 text-xs text-orange">🚀 Lancement</span>
                      )}
                    </p>
                    <p className="text-sm text-anthracite/50">{programmeActif.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => definirCommeLancement(programmeActif)}
                      className="text-xs underline text-anthracite/60"
                    >
                      {programmeActif.est_lancement
                        ? "Retirer du lancement"
                        : "Definir comme lancement"}
                    </button>
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
