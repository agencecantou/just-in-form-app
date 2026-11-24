"use client";

// Espace coach : les contenus qui font vivre le jeu (defis du mois,
// recompenses) et la partie Nutrition. Tables creees par la migration 011.

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Categorie, ContenuNutrition, Defi, Recompense } from "@/lib/types";
import { Goutte } from "@/components/Icones";

// ---------------------------------------------------------------- outils

function EnTeteSection({ titre, texte }: { titre: string; texte: string }) {
  return (
    <>
      <h1 className="titre-ecran text-[28px] sm:text-[34px] mb-2">{titre}</h1>
      <p className="text-gris font-medium mb-7 max-w-2xl">{texte}</p>
    </>
  );
}

function Champ({ label, aide, children }: { label: string; aide?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-bold">
        {label} {aide && <span className="text-gris/80 font-normal">({aide})</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Statut({ actif, oui = "En ligne", non = "Masqué" }: { actif: boolean; oui?: string; non?: string }) {
  return (
    <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${actif ? "bg-menthe text-feuille-dark" : "bg-encre/5 text-gris"}`}>{actif ? oui : non}</span>
  );
}

function MiniLien({ onClick, children, discret }: { onClick: () => void; children: React.ReactNode; discret?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`text-xs underline ${discret ? "text-gris/80" : "text-gris hover:text-encre"}`}>
      {children}
    </button>
  );
}

async function envoyerImage(dossier: string, fichier: File): Promise<string | null> {
  const supabase = createClient();
  const chemin = `${dossier}/${Date.now()}-${fichier.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const { error } = await supabase.storage.from("images").upload(chemin, fichier);
  if (error) return null;
  return supabase.storage.from("images").getPublicUrl(chemin).data.publicUrl;
}

function ChampImage({ valeur, onChange, dossier }: { valeur: string; onChange: (v: string) => void; dossier: string }) {
  const [envoi, setEnvoi] = useState(false);
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {valeur && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={valeur} alt="" className="w-16 h-16 rounded-lg object-cover border border-encre/10" />
      )}
      <label className="btn btn-clair cursor-pointer">
        {envoi ? "Envoi..." : valeur ? "Changer l'image" : "Envoyer une image"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={envoi}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setEnvoi(true);
            const url = await envoyerImage(dossier, f);
            setEnvoi(false);
            if (url) onChange(url);
          }}
        />
      </label>
      {valeur && (
        <MiniLien onClick={() => onChange("")} discret>
          Retirer
        </MiniLien>
      )}
    </div>
  );
}

const tableAbsente = (message?: string) => !!message && /relation|does not exist|schema cache|Could not find/i.test(message);

function AlerteMigration() {
  return (
    <p className="rounded-xl bg-jaune-light px-4 py-3 text-sm font-semibold text-[#7a4a00] mb-6">
      Cette partie attend la mise à jour de la base (migration 011). Elle s&apos;activera dès qu&apos;elle sera passée.
    </p>
  );
}

// ---------------------------------------------------------------- defis

function moisCourant() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const libelleMois = (iso: string) => new Date(iso.slice(0, 7) + "-01T00:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

type FormDefi = {
  type: "mission" | "defi";
  titre: string;
  description: string;
  mois: string;
  categorie: string;
  nombre: number;
  gouttes: number;
  actif: boolean;
};
const DEFI_VIDE: FormDefi = { type: "mission", titre: "", description: "", mois: moisCourant(), categorie: "", nombre: 4, gouttes: 5, actif: true };

export function SectionDefis() {
  const [defis, setDefis] = useState<Defi[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [absente, setAbsente] = useState(false);
  const [form, setForm] = useState<FormDefi>(DEFI_VIDE);
  const [edition, setEdition] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [nbValides, setNbValides] = useState<Record<string, number>>({});

  async function charger() {
    const supabase = createClient();
    const [{ data, error }, { data: cats }, { data: valides }] = await Promise.all([
      supabase.from("defis").select("*").order("mois", { ascending: false }),
      supabase.from("categories").select("*").order("ordre", { ascending: true }),
      supabase.from("defis_valides").select("defi_id"),
    ]);
    setAbsente(tableAbsente(error?.message));
    setDefis((data as Defi[]) ?? []);
    setCategories((cats as Categorie[]) ?? []);
    const compte: Record<string, number> = {};
    for (const v of (valides as { defi_id: string }[]) ?? []) compte[v.defi_id] = (compte[v.defi_id] ?? 0) + 1;
    setNbValides(compte);
    setChargement(false);
  }
  useEffect(() => {
    charger();
  }, []);

  const maj = <K extends keyof FormDefi>(k: K, v: FormDefi[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!form.titre.trim()) return setErreur("Le titre est obligatoire.");
    setEnvoi(true);
    const donnees = {
      type: form.type,
      titre: form.titre.trim(),
      description: form.description.trim(),
      mois: `${form.mois}-01`,
      categorie: form.type === "mission" ? form.categorie || null : null,
      nombre: form.type === "mission" ? Math.max(1, form.nombre) : 1,
      gouttes: Math.max(0, form.gouttes),
      actif: form.actif,
    };
    const supabase = createClient();
    const { error } = edition ? await supabase.from("defis").update(donnees).eq("id", edition) : await supabase.from("defis").insert(donnees);
    setEnvoi(false);
    if (error) return setErreur(error.message);
    setForm({ ...DEFI_VIDE, mois: form.mois });
    setEdition(null);
    charger();
  }

  function modifier(d: Defi) {
    setEdition(d.id);
    setForm({
      type: d.type,
      titre: d.titre,
      description: d.description ?? "",
      mois: d.mois.slice(0, 7),
      categorie: d.categorie ?? "",
      nombre: d.nombre,
      gouttes: d.gouttes,
      actif: d.actif,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function basculer(d: Defi) {
    await createClient().from("defis").update({ actif: !d.actif }).eq("id", d.id);
    charger();
  }
  async function supprimer(d: Defi) {
    if (!confirm(`Supprimer « ${d.titre} » ?`)) return;
    await createClient().from("defis").delete().eq("id", d.id);
    charger();
  }

  const parMois = defis.reduce<Record<string, Defi[]>>((acc, d) => {
    (acc[d.mois.slice(0, 7)] ??= []).push(d);
    return acc;
  }, {});

  return (
    <section className="w-full max-w-4xl">
      <EnTeteSection
        titre="Défis du mois"
        texte="Une mission se valide toute seule quand l'abonnée a fait le nombre de séances demandé dans le mois. Un défi (tenir la planche 2 minutes...) est validé par l'abonnée elle-même."
      />
      {absente && <AlerteMigration />}

      <form onSubmit={enregistrer} className="verre rounded-2xl p-5 sm:p-6 mb-8 space-y-4">
        <p className="text-lg font-extrabold tracking-tight">{edition ? "Modifier" : "Nouveau défi ou mission"}</p>
        <div className="grid grid-cols-2 gap-2 max-w-sm">
          {(["mission", "defi"] as const).map((t) => (
            <button type="button" key={t} onClick={() => maj("type", t)} aria-pressed={form.type === t} className="choix choix-doux justify-center">
              {t === "mission" ? "Mission (séances)" : "Défi (à valider)"}
            </button>
          ))}
        </div>
        <Champ label="Titre">
          <input
            value={form.titre}
            onChange={(e) => maj("titre", e.target.value)}
            placeholder={form.type === "mission" ? "Ex : 4 séances de mobilité" : "Ex : Tenir la planche 2 minutes"}
            className="champ"
          />
        </Champ>
        <Champ label="Description" aide="optionnel">
          <textarea value={form.description} onChange={(e) => maj("description", e.target.value)} rows={2} className="champ" />
        </Champ>
        <div className="grid gap-4 sm:grid-cols-3">
          <Champ label="Mois">
            <input type="month" value={form.mois} onChange={(e) => maj("mois", e.target.value)} className="champ" />
          </Champ>
          {form.type === "mission" && (
            <Champ label="Nombre de séances">
              <input type="number" min={1} value={form.nombre} onChange={(e) => maj("nombre", Number(e.target.value))} className="champ" />
            </Champ>
          )}
          <Champ label="Gouttes gagnées">
            <input type="number" min={0} value={form.gouttes} onChange={(e) => maj("gouttes", Number(e.target.value))} className="champ" />
          </Champ>
        </div>
        {form.type === "mission" && (
          <Champ label="Catégorie de séance" aide="vide = toutes les séances comptent">
            <select value={form.categorie} onChange={(e) => maj("categorie", e.target.value)} className="champ max-w-sm">
              <option value="">Toutes les séances</option>
              {categories.map((c) => (
                <option key={c.id} value={c.nom}>
                  {c.nom}
                </option>
              ))}
            </select>
          </Champ>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.actif} onChange={(e) => maj("actif", e.target.checked)} className="accent-[#92114f]" />
          Visible par les abonnées
        </label>
        {erreur && <p className="text-sm font-semibold text-framboise">{erreur}</p>}
        <div className="flex gap-3 flex-wrap">
          <button type="submit" disabled={envoi} className="btn btn-principal">
            {edition ? "Enregistrer" : "Ajouter"}
          </button>
          {edition && (
            <button
              type="button"
              onClick={() => {
                setEdition(null);
                setForm(DEFI_VIDE);
              }}
              className="btn text-gris underline"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      {chargement ? (
        <p className="text-sm text-gris">Chargement...</p>
      ) : defis.length === 0 ? (
        <p className="text-sm text-gris">Aucun défi pour le moment.</p>
      ) : (
        Object.entries(parMois).map(([mois, liste]) => (
          <div key={mois} className="mb-6">
            <h2 className="text-lg font-extrabold tracking-tight mb-3 first-letter:uppercase">{libelleMois(mois)}</h2>
            <div className="space-y-2.5">
              {liste.map((d) => (
                <div key={d.id} className="verre rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-bold">{d.titre}</p>
                    <p className="text-sm text-gris flex items-center gap-1.5 flex-wrap">
                      {d.type === "mission"
                        ? `Mission · ${d.nombre} séance${d.nombre > 1 ? "s" : ""}${d.categorie ? ` de ${d.categorie}` : ""}`
                        : "Défi à valider"}
                      <span>·</span>
                      <Goutte taille={12} /> {d.gouttes}
                      {d.type === "defi" && (
                        <>
                          <span>·</span> validé par {nbValides[d.id] ?? 0} abonnée{(nbValides[d.id] ?? 0) > 1 ? "s" : ""}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Statut actif={d.actif} />
                    <MiniLien onClick={() => modifier(d)}>Modifier</MiniLien>
                    <MiniLien onClick={() => basculer(d)}>{d.actif ? "Masquer" : "Afficher"}</MiniLien>
                    <MiniLien onClick={() => supprimer(d)} discret>
                      Supprimer
                    </MiniLien>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

// ---------------------------------------------------------------- recompenses

type FormRecompense = { titre: string; description: string; seuil_gouttes: number; lien_url: string; image_url: string; actif: boolean; ordre: number };
const RECOMPENSE_VIDE: FormRecompense = { titre: "", description: "", seuil_gouttes: 30, lien_url: "", image_url: "", actif: true, ordre: 0 };

export function SectionRecompenses() {
  const [liste, setListe] = useState<Recompense[]>([]);
  const [chargement, setChargement] = useState(true);
  const [absente, setAbsente] = useState(false);
  const [form, setForm] = useState<FormRecompense>(RECOMPENSE_VIDE);
  const [edition, setEdition] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function charger() {
    const { data, error } = await createClient().from("recompenses").select("*").order("seuil_gouttes", { ascending: true });
    setAbsente(tableAbsente(error?.message));
    setListe((data as Recompense[]) ?? []);
    setChargement(false);
  }
  useEffect(() => {
    charger();
  }, []);

  const maj = <K extends keyof FormRecompense>(k: K, v: FormRecompense[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!form.titre.trim()) return setErreur("Le titre est obligatoire.");
    setEnvoi(true);
    const donnees = {
      titre: form.titre.trim(),
      description: form.description.trim(),
      seuil_gouttes: Math.max(1, form.seuil_gouttes),
      lien_url: form.lien_url.trim() || null,
      image_url: form.image_url || null,
      actif: form.actif,
      ordre: form.ordre,
    };
    const supabase = createClient();
    const { error } = edition ? await supabase.from("recompenses").update(donnees).eq("id", edition) : await supabase.from("recompenses").insert(donnees);
    setEnvoi(false);
    if (error) return setErreur(error.message);
    setForm(RECOMPENSE_VIDE);
    setEdition(null);
    charger();
  }

  function modifier(r: Recompense) {
    setEdition(r.id);
    setForm({
      titre: r.titre,
      description: r.description ?? "",
      seuil_gouttes: r.seuil_gouttes,
      lien_url: r.lien_url ?? "",
      image_url: r.image_url ?? "",
      actif: r.actif,
      ordre: r.ordre ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function basculer(r: Recompense) {
    await createClient().from("recompenses").update({ actif: !r.actif }).eq("id", r.id);
    charger();
  }
  async function supprimer(r: Recompense) {
    if (!confirm(`Supprimer « ${r.titre} » ?`)) return;
    await createClient().from("recompenses").delete().eq("id", r.id);
    charger();
  }

  return (
    <section className="w-full max-w-4xl">
      <EnTeteSection
        titre="Récompenses"
        texte="Ce que les abonnées débloquent en cumulant des gouttes (1 par séance, 2 par semaine validée, plus les défis et lectures). Une fois débloquée, une récompense reste acquise."
      />
      {absente && <AlerteMigration />}

      <form onSubmit={enregistrer} className="verre rounded-2xl p-5 sm:p-6 mb-8 space-y-4">
        <p className="text-lg font-extrabold tracking-tight">{edition ? "Modifier la récompense" : "Nouvelle récompense"}</p>
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Champ label="Titre">
            <input value={form.titre} onChange={(e) => maj("titre", e.target.value)} placeholder="Ex : E-book recettes d'été offert" className="champ" />
          </Champ>
          <Champ label="Gouttes nécessaires">
            <input type="number" min={1} value={form.seuil_gouttes} onChange={(e) => maj("seuil_gouttes", Number(e.target.value))} className="champ" />
          </Champ>
        </div>
        <p className="text-[12.5px] text-gris -mt-2">Repère : une abonnée régulière (2 séances par semaine) gagne environ 15 gouttes par mois.</p>
        <Champ label="Description" aide="ce que l'abonnée lit avant de débloquer">
          <textarea value={form.description} onChange={(e) => maj("description", e.target.value)} rows={2} className="champ" />
        </Champ>
        <Champ label="Lien" aide="fichier, page ou vidéo secrète, visible une fois débloquée">
          <input value={form.lien_url} onChange={(e) => maj("lien_url", e.target.value)} placeholder="https://..." className="champ" />
        </Champ>
        <Champ label="Image" aide="optionnel">
          <ChampImage valeur={form.image_url} onChange={(v) => maj("image_url", v)} dossier="recompenses" />
        </Champ>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.actif} onChange={(e) => maj("actif", e.target.checked)} className="accent-[#92114f]" />
          Visible par les abonnées
        </label>
        {erreur && <p className="text-sm font-semibold text-framboise">{erreur}</p>}
        <div className="flex gap-3 flex-wrap">
          <button type="submit" disabled={envoi} className="btn btn-principal">
            {edition ? "Enregistrer" : "Ajouter"}
          </button>
          {edition && (
            <button
              type="button"
              onClick={() => {
                setEdition(null);
                setForm(RECOMPENSE_VIDE);
              }}
              className="btn text-gris underline"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      {chargement ? (
        <p className="text-sm text-gris">Chargement...</p>
      ) : liste.length === 0 ? (
        <p className="text-sm text-gris">Aucune récompense pour le moment.</p>
      ) : (
        <ol className="space-y-2.5">
          {liste.map((r) => (
            <li key={r.id} className="verre rounded-xl p-4 flex items-center gap-4 flex-wrap">
              <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-eau/15 text-eau-dark">
                <Goutte taille={14} />
                <span className="chiffre text-lg leading-none mt-0.5">{r.seuil_gouttes}</span>
              </span>
              <div className="flex-1 min-w-[12rem]">
                <p className="font-bold">{r.titre}</p>
                {r.description && <p className="text-sm text-gris line-clamp-2">{r.description}</p>}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Statut actif={r.actif} />
                <MiniLien onClick={() => modifier(r)}>Modifier</MiniLien>
                <MiniLien onClick={() => basculer(r)}>{r.actif ? "Masquer" : "Afficher"}</MiniLien>
                <MiniLien onClick={() => supprimer(r)} discret>
                  Supprimer
                </MiniLien>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- nutrition

const TYPES: { id: ContenuNutrition["type"]; label: string; pluriel: string }[] = [
  { id: "cours", label: "Cours", pluriel: "Cours" },
  { id: "conseil", label: "Conseil", pluriel: "Conseils" },
  { id: "recette", label: "Recette", pluriel: "Recettes" },
  { id: "ebook", label: "E-book", pluriel: "E-books" },
  { id: "astuce", label: "Astuce du jour", pluriel: "Astuces" },
  { id: "citation", label: "Citation", pluriel: "Citations" },
];

type FormNutrition = {
  type: ContenuNutrition["type"];
  titre: string;
  resume: string;
  contenu: string;
  image_url: string;
  lien_url: string;
  duree_min: string;
  tags: string;
  prix_public: string;
  prix_abonnee: string;
  inclus: boolean;
  ordre: number;
};
const NUTRITION_VIDE: FormNutrition = {
  type: "cours",
  titre: "",
  resume: "",
  contenu: "",
  image_url: "",
  lien_url: "",
  duree_min: "",
  tags: "",
  prix_public: "",
  prix_abonnee: "",
  inclus: true,
  ordre: 0,
};

const nombreOuNull = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

export function SectionNutrition() {
  const [contenus, setContenus] = useState<ContenuNutrition[]>([]);
  const [chargement, setChargement] = useState(true);
  const [absente, setAbsente] = useState(false);
  const [filtre, setFiltre] = useState<ContenuNutrition["type"]>("cours");
  const [form, setForm] = useState<FormNutrition>(NUTRITION_VIDE);
  const [edition, setEdition] = useState<string | null>(null);
  const [formOuvert, setFormOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function charger() {
    const { data, error } = await createClient()
      .from("contenus_nutrition")
      .select("*")
      .order("ordre", { ascending: true })
      .order("created_at", { ascending: true });
    setAbsente(tableAbsente(error?.message));
    setContenus((data as ContenuNutrition[]) ?? []);
    setChargement(false);
  }
  useEffect(() => {
    charger();
  }, []);

  const maj = <K extends keyof FormNutrition>(k: K, v: FormNutrition[K]) => setForm((f) => ({ ...f, [k]: v }));
  const court = form.type === "astuce" || form.type === "citation";

  function nouveau() {
    setEdition(null);
    setForm({ ...NUTRITION_VIDE, type: filtre, ordre: contenus.filter((c) => c.type === filtre).length + 1 });
    setFormOuvert(true);
    setErreur(null);
  }

  function modifier(c: ContenuNutrition) {
    setEdition(c.id);
    setForm({
      type: c.type,
      titre: c.titre,
      resume: c.resume ?? "",
      contenu: c.contenu ?? "",
      image_url: c.image_url ?? "",
      lien_url: c.lien_url ?? "",
      duree_min: c.duree_min?.toString() ?? "",
      tags: (c.tags ?? []).join(", "),
      prix_public: c.prix_public?.toString() ?? "",
      prix_abonnee: c.prix_abonnee?.toString() ?? "",
      inclus: c.inclus,
      ordre: c.ordre ?? 0,
    });
    setFormOuvert(true);
    setErreur(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function enregistrer(statut: "publie" | "brouillon") {
    setErreur(null);
    if (!form.titre.trim()) return setErreur(court ? "Le texte est obligatoire." : "Le titre est obligatoire.");
    setEnvoi(true);
    const donnees = {
      type: form.type,
      titre: form.titre.trim(),
      resume: form.resume.trim(),
      contenu: form.contenu.trim(),
      image_url: form.image_url || null,
      lien_url: form.lien_url.trim() || null,
      duree_min: nombreOuNull(form.duree_min),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      prix_public: form.type === "ebook" ? nombreOuNull(form.prix_public) : null,
      prix_abonnee: form.type === "ebook" ? nombreOuNull(form.prix_abonnee) : null,
      inclus: form.type === "ebook" ? form.inclus : true,
      ordre: form.ordre,
      statut,
    };
    const supabase = createClient();
    const { error } = edition
      ? await supabase.from("contenus_nutrition").update(donnees).eq("id", edition)
      : await supabase.from("contenus_nutrition").insert(donnees);
    setEnvoi(false);
    if (error) return setErreur(error.message);
    setFiltre(form.type);
    setEdition(null);
    setFormOuvert(false);
    charger();
  }

  async function basculer(c: ContenuNutrition) {
    await createClient()
      .from("contenus_nutrition")
      .update({ statut: c.statut === "publie" ? "brouillon" : "publie" })
      .eq("id", c.id);
    charger();
  }
  async function supprimer(c: ContenuNutrition) {
    if (!confirm(`Supprimer « ${c.titre.slice(0, 60)} » ?`)) return;
    await createClient().from("contenus_nutrition").delete().eq("id", c.id);
    charger();
  }
  async function deplacer(c: ContenuNutrition, sens: -1 | 1) {
    const liste = contenus.filter((x) => x.type === c.type);
    const i = liste.findIndex((x) => x.id === c.id);
    if (!liste[i + sens]) return;
    [liste[i], liste[i + sens]] = [liste[i + sens], liste[i]];
    const supabase = createClient();
    // On renumerote toute la rubrique : l'ordre reste propre meme si des
    // contenus avaient le meme numero.
    await Promise.all(
      liste
        .map((x, n) =>
          x.ordre === n + 1
            ? null
            : supabase
                .from("contenus_nutrition")
                .update({ ordre: n + 1 })
                .eq("id", x.id),
        )
        .filter(Boolean),
    );
    charger();
  }

  const affiches = contenus.filter((c) => c.type === filtre);

  return (
    <section className="w-full max-w-4xl">
      <EnTeteSection
        titre="Nutrition"
        texte="Les cours publiés se débloquent un par semaine (S1, S2...) à partir de l'inscription, dans l'ordre de la liste. L'astuce et la citation du jour tournent automatiquement sur l'accueil des abonnées."
      />
      {absente && <AlerteMigration />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="defile flex gap-1.5 overflow-x-auto">
          {TYPES.map((t) => (
            <button key={t.id} onClick={() => setFiltre(t.id)} aria-pressed={filtre === t.id} className="choix shrink-0">
              {t.pluriel}
              <span className="opacity-60">{contenus.filter((c) => c.type === t.id).length}</span>
            </button>
          ))}
        </div>
        {!formOuvert && (
          <button onClick={nouveau} className="btn btn-principal">
            Ajouter
          </button>
        )}
      </div>

      {formOuvert && (
        <div className="verre rounded-2xl p-5 sm:p-6 mb-8 space-y-4">
          <p className="text-lg font-extrabold tracking-tight">{edition ? "Modifier" : "Nouveau contenu"}</p>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button type="button" key={t.id} onClick={() => maj("type", t.id)} aria-pressed={form.type === t.id} className="choix choix-doux">
                {t.label}
              </button>
            ))}
          </div>
          {court ? (
            <Champ label={form.type === "citation" ? "Citation" : "Astuce"}>
              <textarea value={form.titre} onChange={(e) => maj("titre", e.target.value)} rows={3} className="champ" />
            </Champ>
          ) : (
            <>
              <Champ label="Titre">
                <input value={form.titre} onChange={(e) => maj("titre", e.target.value)} className="champ" />
              </Champ>
              <Champ label="Résumé" aide="une ou deux phrases, visibles sur la carte">
                <textarea value={form.resume} onChange={(e) => maj("resume", e.target.value)} rows={2} className="champ" />
              </Champ>
              {form.type !== "ebook" && (
                <Champ label="Contenu" aide="laisse une ligne vide entre deux paragraphes">
                  <textarea value={form.contenu} onChange={(e) => maj("contenu", e.target.value)} rows={10} className="champ" />
                </Champ>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Champ label={form.type === "ebook" ? "Lien de téléchargement" : "Lien"} aide="optionnel">
                  <input value={form.lien_url} onChange={(e) => maj("lien_url", e.target.value)} placeholder="https://..." className="champ" />
                </Champ>
                <Champ label={form.type === "recette" ? "Temps de préparation (min)" : "Temps de lecture (min)"} aide="optionnel">
                  <input inputMode="numeric" value={form.duree_min} onChange={(e) => maj("duree_min", e.target.value)} className="champ" />
                </Champ>
              </div>
              <Champ label="Mots-clés" aide="séparés par des virgules">
                <input value={form.tags} onChange={(e) => maj("tags", e.target.value)} placeholder="Ex : petit-déjeuner, protéines" className="champ" />
              </Champ>
              {form.type === "ebook" && (
                <div className="grid gap-4 sm:grid-cols-3 items-end">
                  <Champ label="Prix public (€)">
                    <input inputMode="decimal" value={form.prix_public} onChange={(e) => maj("prix_public", e.target.value)} className="champ" />
                  </Champ>
                  <Champ label="Prix abonnée (€)">
                    <input inputMode="decimal" value={form.prix_abonnee} onChange={(e) => maj("prix_abonnee", e.target.value)} className="champ" />
                  </Champ>
                  <label className="flex items-center gap-2 text-sm min-h-11">
                    <input type="checkbox" checked={form.inclus} onChange={(e) => maj("inclus", e.target.checked)} className="accent-[#92114f]" />
                    Inclus dans l&apos;abonnement
                  </label>
                </div>
              )}
              <Champ label={form.type === "ebook" ? "Couverture" : "Image"} aide="optionnel">
                <ChampImage valeur={form.image_url} onChange={(v) => maj("image_url", v)} dossier="nutrition" />
              </Champ>
            </>
          )}
          {erreur && <p className="text-sm font-semibold text-framboise">{erreur}</p>}
          <div className="flex gap-3 flex-wrap">
            <button type="button" disabled={envoi} onClick={() => enregistrer("publie")} className="btn btn-principal">
              Publier
            </button>
            <button type="button" disabled={envoi} onClick={() => enregistrer("brouillon")} className="btn btn-clair">
              Enregistrer en brouillon
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOuvert(false);
                setEdition(null);
              }}
              className="btn text-gris underline"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {chargement ? (
        <p className="text-sm text-gris">Chargement...</p>
      ) : affiches.length === 0 ? (
        <p className="text-sm text-gris">Rien dans cette rubrique pour le moment.</p>
      ) : (
        <ol className="space-y-2">
          {affiches.map((c, i) => (
            <li key={c.id} className="verre rounded-xl p-3.5 sm:p-4 flex items-center gap-3 flex-wrap">
              {filtre === "cours" && (
                <span className="chiffre text-sm text-gris w-9 shrink-0" title="Semaine où le cours se débloque">
                  {c.statut === "publie" ? `S${affiches.slice(0, i + 1).filter((x) => x.statut === "publie").length}` : ""}
                </span>
              )}
              {c.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-[12rem]">
                <p className={`font-bold ${filtre === "astuce" || filtre === "citation" ? "text-sm font-semibold line-clamp-2" : ""}`}>{c.titre}</p>
                {c.type === "ebook" && (
                  <p className="text-[12.5px] text-gris">
                    {c.inclus ? "Inclus" : "Payant"}
                    {c.prix_public != null && ` · ${c.prix_public} € public`}
                    {c.prix_abonnee != null && ` · ${c.prix_abonnee} € abonnée`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Statut actif={c.statut === "publie"} oui="Publié" non="Brouillon" />
                {filtre === "cours" && (
                  <>
                    <button
                      type="button"
                      onClick={() => deplacer(c, -1)}
                      disabled={i === 0}
                      className="text-xs text-gris disabled:opacity-30"
                      aria-label="Monter"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => deplacer(c, 1)}
                      disabled={i === affiches.length - 1}
                      className="text-xs text-gris disabled:opacity-30"
                      aria-label="Descendre"
                    >
                      ↓
                    </button>
                  </>
                )}
                <MiniLien onClick={() => modifier(c)}>Modifier</MiniLien>
                <MiniLien onClick={() => basculer(c)}>{c.statut === "publie" ? "Dépublier" : "Publier"}</MiniLien>
                <MiniLien onClick={() => supprimer(c)} discret>
                  Supprimer
                </MiniLien>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
