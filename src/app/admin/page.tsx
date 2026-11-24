"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extraireVimeoId } from "@/lib/vimeo";
import { SectionDefis, SectionNutrition, SectionRecompenses } from "./sections-jeu";
import {
  IconeAccueil,
  IconeBulle,
  IconeCadeau,
  IconeCible,
  IconeEtiquetteTag,
  IconeGroupe,
  IconeNutrition,
  IconeProgrammes,
  IconeProgres,
  IconeSeances,
  IconeSortie,
} from "@/components/Icones";
import { INTENSITES, NIVEAUX, OBJECTIFS_VIDEO, ZONES_CORPS, type Avis, type Categorie, type Programme, type ProgrammeVideo, type Video } from "@/lib/types";

type Section = "statistiques" | "avis" | "videos" | "programmes" | "categories" | "nutrition" | "defis" | "recompenses" | "comptes";

const GROUPES: { titre: string; items: { id: Section; label: string; Icone: (p: { taille?: number; epaisseur?: number }) => React.ReactElement }[] }[] = [
  {
    titre: "Suivi",
    items: [
      { id: "statistiques", label: "Tableau de bord", Icone: IconeProgres },
      { id: "avis", label: "Avis des abonnées", Icone: IconeBulle },
    ],
  },
  {
    titre: "Contenus",
    items: [
      { id: "videos", label: "Vidéos", Icone: IconeSeances },
      { id: "programmes", label: "Programmes", Icone: IconeProgrammes },
      { id: "categories", label: "Catégories", Icone: IconeEtiquetteTag },
      { id: "nutrition", label: "Nutrition", Icone: IconeNutrition },
    ],
  },
  {
    titre: "Jeu",
    items: [
      { id: "defis", label: "Défis du mois", Icone: IconeCible },
      { id: "recompenses", label: "Récompenses", Icone: IconeCadeau },
    ],
  },
  {
    titre: "Abonnées",
    items: [{ id: "comptes", label: "Comptes", Icone: IconeGroupe }],
  },
];

const SECTIONS = GROUPES.flatMap((g) => g.items.map((i) => i.id));

export default function Admin() {
  const [section, setSectionEtat] = useState<Section>("statistiques");

  // La section active suit l'ancre de l'URL (#videos...) pour survivre a un
  // rechargement et permettre les liens directs.
  useEffect(() => {
    const lire = () => {
      const ancre = window.location.hash.replace("#", "") as Section;
      if (SECTIONS.includes(ancre)) setSectionEtat(ancre);
    };
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, []);

  function setSection(s: Section) {
    setSectionEtat(s);
    history.replaceState(null, "", `#${s}`);
    window.scrollTo({ top: 0 });
  }

  async function deconnexion() {
    await createClient().auth.signOut();
    window.location.href = "/connexion";
  }

  return (
    <div className="flex-1 flex min-h-screen">
      <aside className="verre hidden lg:flex sticky top-4 m-4 mr-0 h-[calc(100vh-2rem)] w-60 shrink-0 flex-col rounded-2xl px-3 py-5 overflow-y-auto">
        <div className="flex items-center gap-3 px-3 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-10 w-10 object-contain" />
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight">Just in Form</span>
            <span className="block text-[11px] text-gris font-medium">Espace coach</span>
          </span>
        </div>
        <nav aria-label="Espace coach" className="flex flex-col gap-5">
          {GROUPES.map((g) => (
            <div key={g.titre}>
              <p className="etiquette text-gris/80 px-3 mb-1.5">{g.titre}</p>
              <div className="flex flex-col gap-0.5">
                {g.items.map(({ id, label, Icone }) => {
                  const actif = section === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSection(id)}
                      aria-current={actif ? "page" : undefined}
                      className={`flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-semibold text-left transition ${
                        actif ? "bg-framboise text-white shadow-[0_8px_18px_-10px_rgba(146,17,79,.8)]" : "text-[#5c4a53] hover:bg-framboise/5 hover:text-encre"
                      }`}
                    >
                      <Icone taille={18} epaisseur={actif ? 2 : 1.8} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto pt-5 flex flex-col gap-1 filet">
          <a href="/app" className="flex items-center gap-3 h-10 px-3 mt-2 rounded-xl text-sm font-semibold bg-encre text-white hover:bg-black">
            <IconeAccueil taille={18} /> Voir côté abonnée
          </a>
          <button onClick={deconnexion} className="flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium text-gris hover:bg-framboise/5 text-left">
            <IconeSortie taille={18} /> Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 pb-12">
        <header className="lg:hidden sticky top-0 z-30 verre border-x-0 border-t-0 px-4 pt-3 pb-2.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
              <span className="text-[15px] font-extrabold tracking-tight">Espace coach</span>
            </span>
            <a href="/app" className="text-[13px] font-bold text-framboise">
              Côté abonnée
            </a>
          </div>
          <nav aria-label="Espace coach" className="defile flex gap-1.5 overflow-x-auto -mx-4 px-4">
            {GROUPES.flatMap((g) => g.items).map(({ id, label }) => (
              <button key={id} onClick={() => setSection(id)} aria-pressed={section === id} className="choix choix-doux shrink-0 whitespace-nowrap">
                {label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1080px] px-4 sm:px-6 lg:px-10 pt-6 lg:pt-10">
          {section === "statistiques" && <SectionStatistiques allerA={setSection} />}
          {section === "avis" && <SectionAvis />}
          {section === "videos" && <SectionVideos />}
          {section === "programmes" && <SectionProgrammes />}
          {section === "categories" && <SectionCategories />}
          {section === "nutrition" && <SectionNutrition />}
          {section === "defis" && <SectionDefis />}
          {section === "recompenses" && <SectionRecompenses />}
          {section === "comptes" && <SectionComptes />}
        </main>
      </div>
    </div>
  );
}

// Le lundi de la semaine contenant `date`.
function lundiDeLaSemaine(date: Date) {
  const d = new Date(date);
  const jour = d.getDay(); // 0 = dimanche
  const decalage = jour === 0 ? -6 : 1 - jour;
  d.setDate(d.getDate() + decalage);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formaterDureeStat(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

type AbonneeStat = {
  id: string;
  prenom: string | null;
  email: string | null;
  created_at: string;
  objectif_hebdo: number | null;
  pause_jusqu_au: string | null;
};

function SectionStatistiques({ allerA }: { allerA: (s: Section) => void }) {
  const [chargement, setChargement] = useState(true);
  const [abonnees, setAbonnees] = useState<AbonneeStat[]>([]);
  const [nbVideosPubliees, setNbVideosPubliees] = useState(0);
  const [seances, setSeances] = useState<{ user_id: string; termine_le: string; duree: number }[]>([]);
  const [videoPlusVue, setVideoPlusVue] = useState<{ titre: string; vues: number } | null>(null);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      const supabase = createClient();
      const [{ data: profils }, { count: nbVideos }, { data: lignes }, { data: videosTop }] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "abonnee"),
        supabase.from("videos").select("id", { count: "exact", head: true }).eq("statut", "publie"),
        supabase.from("seances_terminees").select("user_id, termine_le, videos(duree_min)"),
        supabase.from("videos").select("titre, vues").order("vues", { ascending: false }).limit(1),
      ]);
      setAbonnees((profils as AbonneeStat[]) ?? []);
      setNbVideosPubliees(nbVideos ?? 0);
      type SeanceLigne = { user_id: string; termine_le: string; videos: { duree_min: number } | null };
      setSeances(
        ((lignes ?? []) as unknown as SeanceLigne[])
          .filter((l) => l.user_id)
          .map((l) => ({ user_id: l.user_id, termine_le: l.termine_le, duree: l.videos?.duree_min ?? 0 })),
      );
      setVideoPlusVue(((videosTop ?? []) as { titre: string; vues: number }[])[0] ?? null);
      setChargement(false);
    }
    charger();
  }, []);

  const maintenant = new Date();
  const lundi = lundiDeLaSemaine(maintenant);
  const semaine = seances.filter((s) => new Date(s.termine_le) >= lundi);
  const activesSemaine = new Set(semaine.map((s) => s.user_id)).size;
  const nb = abonnees.length;
  const minutesTotal = seances.reduce((t, s) => t + s.duree, 0);

  // 8 dernieres semaines : nombre de seances, et part de semaines ou
  // l'abonnee a tenu son objectif (la "regularite").
  const semaines = Array.from({ length: 8 }, (_, i) => {
    const debut = new Date(lundi);
    debut.setDate(debut.getDate() - 7 * (7 - i));
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 7);
    const liste = seances.filter((s) => {
      const d = new Date(s.termine_le);
      return d >= debut && d < fin;
    });
    return { debut, fin, liste };
  });
  const maxSemaine = Math.max(1, ...semaines.map((s) => s.liste.length));

  let semainesPossibles = 0;
  let semainesTenues = 0;
  for (const a of abonnees) {
    const inscrite = new Date(a.created_at);
    const objectif = a.objectif_hebdo || 2;
    for (const s of semaines.slice(0, 7)) {
      if (s.fin <= inscrite) continue;
      semainesPossibles++;
      if (s.liste.filter((x) => x.user_id === a.id).length >= objectif) semainesTenues++;
    }
  }
  const regularite = semainesPossibles ? Math.round((semainesTenues / semainesPossibles) * 100) : 0;

  const derniere = new Map<string, Date>();
  for (const s of seances) {
    const d = new Date(s.termine_le);
    const actuelle = derniere.get(s.user_id);
    if (!actuelle || d > actuelle) derniere.set(s.user_id, d);
  }
  const quatorzeJours = 14 * 86400000;
  const aRelancer = abonnees
    .filter((a) => !(a.pause_jusqu_au && new Date(a.pause_jusqu_au) >= maintenant))
    .map((a) => ({ a, der: derniere.get(a.id) ?? null }))
    .filter(({ a, der }) =>
      der ? maintenant.getTime() - der.getTime() > quatorzeJours : maintenant.getTime() - new Date(a.created_at).getTime() > 7 * 86400000,
    )
    .sort((x, y) => (x.der?.getTime() ?? 0) - (y.der?.getTime() ?? 0));

  const formatJour = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <section className="w-full">
      <h1 className="titre-ecran text-[28px] sm:text-[34px] mb-2">Tableau de bord</h1>
      <p className="text-gris font-medium mb-7 max-w-2xl">L&apos;activité de tes abonnées, et celles qui ont besoin d&apos;un petit mot.</p>

      {chargement ? (
        <p className="text-sm text-gris">Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Stat valeur={`${activesSemaine}/${nb}`} label="actives cette semaine" />
            <Stat valeur={`${regularite}%`} label="de semaines où l'objectif est tenu (7 dernières)" />
            <Stat
              valeur={String(semaine.length)}
              label={`séance${semaine.length > 1 ? "s" : ""} depuis lundi, ${formaterDureeStat(semaine.reduce((t, s) => t + s.duree, 0))}`}
            />
            <Stat valeur={String(aRelancer.length)} label={aRelancer.length > 1 ? "abonnées à relancer" : "abonnée à relancer"} accent={aRelancer.length > 0} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] mb-6">
            <div className="verre rounded-2xl p-5">
              <p className="font-extrabold tracking-tight mb-1">Séances par semaine</p>
              <p className="text-[13px] text-gris mb-5">Les 8 dernières semaines, la dernière est en cours.</p>
              <div className="flex items-end gap-2 h-36">
                {semaines.map((s, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                    <span className="text-[11px] font-bold text-gris">{s.liste.length}</span>
                    <span
                      className="w-full rounded-md"
                      style={{ height: `${Math.max(4, (s.liste.length / maxSemaine) * 100)}%`, background: i === 7 ? "#92114f" : "rgba(146,17,79,.28)" }}
                    />
                    <span className="text-[10.5px] text-gris whitespace-nowrap">{formatJour(s.debut)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="verre rounded-2xl p-5">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <p className="font-extrabold tracking-tight">À relancer</p>
                <button onClick={() => allerA("comptes")} className="text-[13px] font-bold text-framboise">
                  Comptes
                </button>
              </div>
              <p className="text-[13px] text-gris mb-4">Aucune séance depuis plus de 14 jours (hors pause).</p>
              {aRelancer.length === 0 ? (
                <p className="text-sm font-semibold text-feuille-dark">Tout le monde bouge, bravo !</p>
              ) : (
                <ul className="flex flex-col divide-y divide-encre/5 max-h-64 overflow-y-auto -mx-1 px-1">
                  {aRelancer.map(({ a, der }) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block text-sm font-bold truncate">{a.prenom || a.email || "Abonnée"}</span>
                        <span className="block text-[12px] text-gris">{der ? `Dernière séance le ${formatJour(der)}` : "Pas encore de séance"}</span>
                      </span>
                      {a.email && (
                        <a
                          href={`mailto:${a.email}?subject=${encodeURIComponent("On reprend ensemble ?")}`}
                          className="btn btn-clair !min-h-9 !text-xs shrink-0"
                        >
                          Écrire
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Stat valeur={String(nb)} label="abonnées" petit />
            <Stat valeur={String(nbVideosPubliees)} label="vidéos publiées" petit />
            <Stat valeur={String(seances.length)} label="séances réalisées au total" petit />
            <Stat valeur={formaterDureeStat(minutesTotal)} label="de sport au total" petit />
          </div>

          {videoPlusVue && (
            <div className="rounded-2xl bg-jaune-light p-5 mt-4">
              <p className="text-[13px] font-bold text-[#7a4a00]">Vidéo la plus regardée</p>
              <p className="font-extrabold mt-1">{videoPlusVue.titre}</p>
              <p className="text-sm text-gris">
                {videoPlusVue.vues} vue{videoPlusVue.vues > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ valeur, label, accent, petit }: { valeur: string; label: string; accent?: boolean; petit?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? "bg-framboise text-white" : "verre"}`}>
      <p className={`chiffre ${petit ? "text-2xl" : "text-3xl"} ${accent ? "" : "text-framboise"}`}>{valeur}</p>
      <p className={`text-[12.5px] mt-1 leading-snug ${accent ? "text-white/85" : "text-gris"}`}>{label}</p>
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
    setSucces(`Invitation envoyée à ${email.trim()}.`);
    setEmail("");
    setPrenom("");
    setRole("abonnee");
  }

  return (
    <section className="w-full max-w-lg">
      <h1 className="titre-ecran text-[28px] sm:text-[34px] mb-2">Comptes</h1>
      <p className="text-gris font-medium mb-7 max-w-2xl">
        Crée un compte pour une abonnée (ou un autre coach) sans qu&apos;elle ait besoin de s&apos;inscrire elle-même. Un email d&apos;invitation lui est envoyé
        pour qu&apos;elle choisisse son mot de passe.
      </p>

      <form onSubmit={creerCompte} className="verre rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-sm font-bold">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="champ mt-1.5" />
        </div>
        <div>
          <label className="text-sm font-bold">
            Prénom <span className="text-gris/80 font-normal">(optionnel)</span>
          </label>
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className="champ mt-1.5" />
        </div>
        <div>
          <label className="text-sm font-bold">Type de compte</label>
          <select value={role} onChange={(e) => setRole(e.target.value as "abonnee" | "coach")} className="champ mt-1.5">
            <option value="abonnee">Abonnée</option>
            <option value="coach">Coach</option>
          </select>
        </div>

        {erreur && <p className="text-sm text-framboise">{erreur}</p>}
        {succes && <p className="text-sm text-framboise">{succes}</p>}

        <button type="submit" disabled={envoi} className="btn btn-principal disabled:opacity-50">
          {envoi ? "Envoi..." : "Envoyer l'invitation"}
        </button>
      </form>
    </section>
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
    const { data } = await supabase.from("categories").select("*").order("ordre", { ascending: true });
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
    const { error } = await supabase.from("categories").insert({ nom: nouveau.trim(), ordre: ordreMax + 1 });
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
    await supabase.from("categories").update({ nom: renommage.nom.trim() }).eq("id", renommage.id);
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
    <section className="w-full max-w-2xl">
      <h1 className="titre-ecran text-[28px] sm:text-[34px] mb-2">Catégories</h1>
      <p className="text-gris font-medium mb-7 max-w-2xl">
        Les catégories servent à classer les vidéos. Chaque catégorie peut avoir une image par défaut : si une vidéo n&apos;a pas sa propre image, celle de sa
        première catégorie avec une image est utilisée.
      </p>

      <div className="verre rounded-2xl p-5 mb-6 flex gap-3">
        <input
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ajouter()}
          placeholder="Nouvelle catégorie (ex : Renforcement)"
          className="flex-1 rounded-lg border border-encre/10 px-3 py-2 text-sm"
        />
        <button onClick={ajouter} className="btn btn-principal">
          Ajouter
        </button>
      </div>
      {erreur && <p className="text-sm text-framboise mb-4">{erreur}</p>}

      {chargement ? (
        <p className="text-sm text-gris">Chargement...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-gris">Aucune catégorie pour le moment.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="verre rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-encre/10 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-creme border border-encre/10 shrink-0" />
                )}
                {renommage?.id === c.id ? (
                  <input
                    autoFocus
                    value={renommage.nom}
                    onChange={(e) => setRenommage({ id: c.id, nom: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && renommer()}
                    className="flex-1 rounded-lg border border-encre/10 px-2 py-1 text-sm"
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
                    <button onClick={() => setRenommage(null)} className="text-xs underline text-gris/80">
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <label className="text-xs underline text-gris cursor-pointer">
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
                      <button onClick={() => supprimerImageCategorie(c.id)} className="text-xs underline text-gris/80">
                        Retirer l&apos;image
                      </button>
                    )}
                    <button onClick={() => setRenommage({ id: c.id, nom: c.nom })} className="text-xs underline text-gris">
                      Renommer
                    </button>
                    <button onClick={() => supprimer(c.id)} className="text-xs underline text-gris/80">
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionAvis() {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      const supabase = createClient();
      const { data } = await supabase.from("avis").select("*, videos(titre), profiles(prenom, email)").order("created_at", { ascending: false });
      setAvis((data as Avis[]) ?? []);
      setChargement(false);
    }
    charger();
  }, []);

  return (
    <section className="w-full max-w-3xl">
      <h1 className="titre-ecran text-[28px] sm:text-[34px] mb-2">Avis des abonnées</h1>
      <p className="text-gris font-medium mb-7 max-w-2xl">Les messages laissés après une séance. Ils sont privés : seule toi les lis.</p>

      {chargement ? (
        <p className="text-sm text-gris">Chargement...</p>
      ) : avis.length === 0 ? (
        <p className="text-sm text-gris">Aucun avis pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {avis.map((a) => (
            <div key={a.id} className="verre rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-bold">
                  {a.profiles?.prenom || a.profiles?.email || "Abonnée"}
                  {a.videos?.titre && <span className="text-gris font-normal"> · {a.videos.titre}</span>}
                </p>
                <p className="text-xs text-gris/80">{new Date(a.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <p className="text-sm text-gris mt-2">{a.message}</p>
            </div>
          ))}
        </div>
      )}
    </section>
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
  const [intensite, setIntensite] = useState(2);
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [alerteSante, setAlerteSante] = useState("");
  const [infoVimeo, setInfoVimeo] = useState<string | null>(null);
  const [formOuvert, setFormOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtreCat, setFiltreCat] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"" | "publie" | "brouillon">("");

  // Des qu'un lien Vimeo est colle, on va chercher le titre, la duree et la
  // miniature publiques (oEmbed) pour pre-remplir le formulaire.
  async function lireVimeo(lien: string) {
    const id = extraireVimeoId(lien);
    if (!id) return;
    setInfoVimeo("Lecture des infos Vimeo...");
    try {
      const url = `https://vimeo.com/${id.replace(":", "/")}`;
      const r = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=960`);
      if (!r.ok) throw new Error();
      const d = (await r.json()) as { title?: string; duration?: number; thumbnail_url?: string };
      if (d.title && !titre.trim()) setTitre(d.title);
      if (d.duration) setDureeMin(Math.max(1, Math.round(d.duration / 60)));
      if (d.thumbnail_url && !imageUrl) setImageUrl(d.thumbnail_url);
      setInfoVimeo("Titre, durée et miniature récupérés depuis Vimeo.");
    } catch {
      setInfoVimeo("Infos Vimeo indisponibles (vidéo privée ?) : remplis à la main.");
    }
  }

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
    const urls = (data ?? []).filter((f) => f.name).map((f) => supabase.storage.from("images").getPublicUrl(`videos/${f.name}`).data.publicUrl);
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
    setCategoriesSelectionnees((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function toggleZone(zone: string) {
    setZonesSelectionnees((prev) => (prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]));
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
    setIntensite(2);
    setObjectifs([]);
    setAlerteSante("");
    setInfoVimeo(null);
    setFormOuvert(false);
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
    setLienVimeo(`https://vimeo.com/${video.vimeo_id.replace(":", "/")}`);
    setEstVedette(video.est_vedette);
    setIntensite(video.intensite ?? 2);
    setObjectifs(video.objectifs ?? []);
    setAlerteSante(video.alerte_sante ?? "");
    setInfoVimeo(null);
    setFormOuvert(true);
    setErreur(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function ajouterVideo(e: React.MouseEvent<HTMLButtonElement>, statut: "publie" | "brouillon") {
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
      setErreur("Choisis au moins une catégorie.");
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
      intensite,
      objectifs,
      alerte_sante: alerteSante.trim() || null,
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
    if (!confirm("Supprimer définitivement cette vidéo ? L'historique des abonnées sur cette séance sera perdu.")) return;
    const supabase = createClient();
    await supabase.from("videos").delete().eq("id", id);
    chargerVideos();
  }

  return (
    <section className="w-full max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="titre-ecran text-[28px] sm:text-[34px]">Vidéos</h1>
          <p className="text-gris font-medium mt-1.5">
            {videos.filter((v) => v.statut === "publie").length} publiées, {videos.filter((v) => v.statut !== "publie").length} en brouillon
          </p>
        </div>
        {!formOuvert && (
          <button onClick={() => setFormOuvert(true)} className="btn btn-principal">
            Ajouter une vidéo
          </button>
        )}
      </div>

      {formOuvert && (
        <form className="verre rounded-2xl p-5 sm:p-6 mb-8 space-y-4">
          <p className="text-lg font-extrabold tracking-tight">{videoEnEdition ? `Modifier : ${videoEnEdition.titre}` : "Nouvelle vidéo"}</p>
          <div>
            <label className="text-sm font-bold">Lien Vimeo</label>
            <input
              value={lienVimeo}
              onChange={(e) => setLienVimeo(e.target.value)}
              onBlur={(e) => lireVimeo(e.target.value)}
              onPaste={(e) => lireVimeo(e.clipboardData.getData("text"))}
              placeholder="https://vimeo.com/123456789"
              className="champ mt-1.5"
            />
            <p className="text-[12.5px] text-gris mt-1.5">
              {infoVimeo ??
                "Colle le lien : titre, durée et miniature se remplissent tout seuls. Vidéo non répertoriée : colle le lien complet (avec la fin après le dernier /)."}
            </p>
          </div>

          <div>
            <label className="text-sm font-bold">Titre</label>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : HIIT débutant 20 min" className="champ mt-1.5" />
          </div>

          <div>
            <label className="text-sm font-bold">
              Catégories <span className="text-gris/80 font-normal">(plusieurs possibles, ex : Mix)</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.length === 0 && <p className="text-xs text-gris">Aucune catégorie : crée-les d&apos;abord dans l&apos;onglet Catégories.</p>}
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleCategorie(c.nom)}
                  aria-pressed={categoriesSelectionnees.includes(c.nom)}
                  className="choix choix-doux"
                >
                  {c.nom}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold">
              Zones du corps <span className="text-gris/80 font-normal">(optionnel, plusieurs possibles)</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ZONES_CORPS.map((z) => (
                <button type="button" key={z} onClick={() => toggleZone(z)} aria-pressed={zonesSelectionnees.includes(z)} className="choix choix-doux">
                  {z}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={avecMateriel} onChange={(e) => setAvecMateriel(e.target.checked)} />
            Nécessite du matériel
          </label>

          <div>
            <label className="text-sm font-bold">
              Description <span className="text-gris/80 font-normal">(visible par l&apos;abonnée)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ce que contient la vidéo, le matériel nécessaire, les points d'attention..."
              className="champ mt-1.5"
            />
          </div>

          <div>
            <label className="text-sm font-bold">Image</label>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover border border-encre/10" />
              )}
              <label className="btn btn-clair cursor-pointer">
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
              <button type="button" onClick={ouvrirBanque} className="btn btn-clair">
                Choisir dans la banque
              </button>
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl(null)} className="text-xs underline text-gris/80">
                  Retirer
                </button>
              )}
            </div>

            {banqueOuverte && (
              <div className="mt-3 rounded-xl border border-encre/10 bg-white/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gris">Images déjà envoyées</p>
                  <button type="button" onClick={() => setBanqueOuverte(false)} className="text-xs underline text-gris/80">
                    Fermer
                  </button>
                </div>
                {banqueImages.length === 0 ? (
                  <p className="text-xs text-gris">Aucune image envoyée pour l&apos;instant.</p>
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
                        className={`w-16 h-16 rounded-lg object-cover border cursor-pointer ${imageUrl === url ? "border-framboise" : "border-encre/10"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold">Niveau</label>
              <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className="champ mt-1.5">
                {NIVEAUX.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold">Durée (minutes)</label>
              <input type="number" min={1} value={dureeMin} onChange={(e) => setDureeMin(Number(e.target.value))} className="champ mt-1.5" />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold">Intensité</label>
            <div className="mt-2 grid grid-cols-3 gap-2 max-w-md">
              {[1, 2, 3].map((n) => (
                <button type="button" key={n} onClick={() => setIntensite(n)} aria-pressed={intensite === n} className="choix choix-doux justify-center">
                  {INTENSITES[n].label}
                </button>
              ))}
            </div>
            <p className="text-[12.5px] text-gris mt-1.5">Sert aux alertes santé (grossesse, douleurs) et à la suggestion « Envie de douceur ».</p>
          </div>

          <div>
            <label className="text-sm font-bold">
              Objectifs <span className="text-gris/80 font-normal">(optionnel)</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {OBJECTIFS_VIDEO.map((o) => (
                <button
                  type="button"
                  key={o}
                  onClick={() => setObjectifs((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]))}
                  aria-pressed={objectifs.includes(o)}
                  className="choix choix-doux"
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold">
              Alerte santé <span className="text-gris/80 font-normal">(optionnel, affichée sur la séance)</span>
            </label>
            <input
              value={alerteSante}
              onChange={(e) => setAlerteSante(e.target.value)}
              placeholder="Ex : Déconseillée pendant la grossesse"
              className="champ mt-1.5"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={estVedette} onChange={(e) => setEstVedette(e.target.checked)} />
            Mettre en avant (recommandée sur l&apos;accueil de l&apos;appli)
          </label>

          {erreur && <p className="text-sm text-framboise">{erreur}</p>}

          <div className="flex gap-3 flex-wrap">
            <button type="button" disabled={envoi} onClick={(e) => ajouterVideo(e, "publie")} className="btn btn-principal disabled:opacity-50">
              {videoEnEdition ? "Enregistrer et publier" : "Publier"}
            </button>
            <button type="button" disabled={envoi} onClick={(e) => ajouterVideo(e, "brouillon")} className="btn btn-clair disabled:opacity-50">
              Enregistrer en brouillon
            </button>
            <button type="button" onClick={reinitialiserFormulaire} className="btn text-gris underline">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une vidéo"
          className="champ !w-full sm:!w-72"
        />
        <select value={filtreCat} onChange={(e) => setFiltreCat(e.target.value)} className="champ !w-auto">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.nom}>
              {c.nom}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {(
            [
              ["", "Toutes"],
              ["publie", "Publiées"],
              ["brouillon", "Brouillons"],
            ] as const
          ).map(([val, label]) => (
            <button key={val} onClick={() => setFiltreStatut(val)} aria-pressed={filtreStatut === val} className="choix !min-h-11">
              {label}
            </button>
          ))}
        </div>
      </div>

      {chargement ? (
        <p className="text-sm text-gris">Chargement...</p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-gris">Aucune vidéo pour le moment.</p>
      ) : (
        <div className="space-y-2">
          {videos
            .filter((v) => !filtreCat || v.categories?.includes(filtreCat))
            .filter((v) => !filtreStatut || v.statut === filtreStatut)
            .filter(
              (v) =>
                !recherche.trim() ||
                v.titre
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .includes(
                    recherche
                      .trim()
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, ""),
                  ),
            )
            .map((v) => (
              <div key={v.id} className="verre rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {v.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.image_url} alt="" className="w-16 h-11 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="w-16 h-11 rounded-lg bg-rose/50 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold">
                      {v.titre}
                      {v.est_vedette && <span className="ml-2 text-xs font-bold text-[#8a5a00]">★ En avant</span>}
                    </p>
                    <p className="text-sm text-gris">
                      {v.categories?.join(", ")} &middot; {v.duree_min} min &middot; {INTENSITES[v.intensite ?? 2]?.label}
                      {v.avec_materiel && " · Matériel"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span
                    className={`rounded-md px-2 py-1 text-[11px] font-bold ${v.statut === "publie" ? "bg-menthe text-feuille-dark" : "bg-encre/5 text-gris"}`}
                  >
                    {v.statut === "publie" ? "Publiée" : "Brouillon"}
                  </span>
                  <button onClick={() => commencerEdition(v)} className="text-xs underline text-gris">
                    Modifier
                  </button>
                  <button onClick={() => changerVedette(v)} className="text-xs underline text-gris">
                    {v.est_vedette ? "Retirer de la une" : "Mettre en avant"}
                  </button>
                  <button onClick={() => changerStatut(v)} className="text-xs underline text-gris">
                    {v.statut === "publie" ? "Dépublier" : "Publier"}
                  </button>
                  <button onClick={() => supprimerVideo(v.id)} className="text-xs underline text-gris/80">
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
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
      supabase.from("videos").select("*").eq("statut", "publie").order("titre", { ascending: true }),
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
    <section className="w-full max-w-5xl">
      <h1 className="titre-ecran text-[28px] sm:text-[34px] mb-6">Programmes</h1>

      <div className="verre rounded-2xl p-5 mb-8 space-y-3">
        <p className="font-bold text-sm">Créer un programme</p>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : 3 semaines pour reprendre en douceur" className="champ" />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Courte description du programme"
          rows={2}
          className="champ"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={estLancement} onChange={(e) => setEstLancement(e.target.checked)} />
          Programme de lancement <span className="text-gris/80">(propose automatiquement a toute personne qui n&apos;a encore termine aucune seance)</span>
        </label>
        <button onClick={creerProgramme} className="btn btn-principal">
          Créer
        </button>
      </div>

      {chargement ? (
        <p className="text-sm text-gris">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-2">
            {programmes.length === 0 && <p className="text-sm text-gris">Aucun programme pour le moment.</p>}
            {programmes.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProgrammeActifId(p.id);
                  chargerVideosDuProgramme(p.id);
                }}
                className={`w-full text-left rounded-xl border p-3 ${programmeActifId === p.id ? "border-framboise bg-white" : "border-encre/10 bg-white/60"}`}
              >
                <p className="font-bold text-sm">
                  {p.titre}
                  {p.est_lancement && <span className="ml-2 text-xs font-bold text-[#8a5a00]">🚀 Lancement</span>}
                </p>
                <span className={`text-xs ${p.statut === "publie" ? "text-framboise" : "text-gris/80"}`}>{p.statut === "publie" ? "Publié" : "Brouillon"}</span>
              </button>
            ))}
          </div>

          <div>
            {!programmeActif ? (
              <p className="text-sm text-gris">Choisis ou crée un programme pour lui associer des séances.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {programmeActif.titre}
                      {programmeActif.est_lancement && <span className="ml-2 text-xs font-bold text-[#8a5a00]">🚀 Lancement</span>}
                    </p>
                    <p className="text-sm text-gris">{programmeActif.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => definirCommeLancement(programmeActif)} className="text-xs underline text-gris">
                      {programmeActif.est_lancement ? "Retirer du lancement" : "Définir comme lancement"}
                    </button>
                    <button onClick={() => changerStatutProgramme(programmeActif)} className="text-xs underline text-gris">
                      {programmeActif.statut === "publie" ? "Dépublier" : "Publier"}
                    </button>
                    <button onClick={() => supprimerProgramme(programmeActif.id)} className="text-xs underline text-gris/80">
                      Supprimer
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold mb-2">Séances du programme</p>
                  {videosDuProgramme.length === 0 ? (
                    <p className="text-sm text-gris">Aucune séance ajoutée, choisis-en une ci-dessous.</p>
                  ) : (
                    <div className="space-y-2">
                      {videosDuProgramme.map((pv, i) => (
                        <div key={pv.id} className="verre rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold">
                              {i + 1}. {pv.videos?.titre}
                            </p>
                            <p className="text-xs text-gris">{pv.videos?.categories?.join(", ")}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => deplacerVideo(i, -1)} disabled={i === 0} className="text-xs disabled:opacity-30">
                              ↑
                            </button>
                            <button onClick={() => deplacerVideo(i, 1)} disabled={i === videosDuProgramme.length - 1} className="text-xs disabled:opacity-30">
                              ↓
                            </button>
                            <button onClick={() => retirerVideoDuProgramme(pv.id)} className="text-xs underline text-gris/80">
                              Retirer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold mb-2">Ajouter une séance publiée</p>
                  <div className="flex flex-wrap gap-2">
                    {videos
                      .filter((v) => !idsDejaAjoutes.has(v.id))
                      .map((v) => (
                        <button key={v.id} onClick={() => ajouterVideoAuProgramme(v.id)} className="btn btn-clair !min-h-9 !text-xs">
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
    </section>
  );
}
