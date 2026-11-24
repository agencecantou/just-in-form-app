"use client";

// Nutrition : la deuxieme casquette de Justine (dieteticienne-nutritionniste).
// Contenus geres depuis l'espace coach (table contenus_nutrition) :
// astuces du jour, fiches conseil, recettes, cours debloques une lecon par
// semaine, e-books. Lire une fiche rapporte une goutte (2 par semaine max).

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ContenuNutrition } from "@/lib/types";
import { lundiDe } from "@/lib/jeu";
import { Chargement, EnTete, Page, useAbonnee } from "@/components/EspaceAbonnee";
import {
  Goutte,
  IconeAmpoule,
  IconeBol,
  IconeChapeau,
  IconeCoche,
  IconeFermer,
  IconeLivre,
  IconeVerrou,
} from "@/components/Icones";

type Onglet = "tout" | "conseil" | "recette" | "cours" | "ebook";

const ONGLETS: { valeur: Onglet; label: string }[] = [
  { valeur: "tout", label: "Tout" },
  { valeur: "cours", label: "Cours" },
  { valeur: "conseil", label: "Conseils" },
  { valeur: "recette", label: "Recettes" },
  { valeur: "ebook", label: "E-books" },
];

function jourDeLAnnee(d = new Date()) {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
}

function prix(n: number | null) {
  if (n === null || n === undefined) return null;
  return `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2 })} €`;
}

export default function NutritionPage() {
  const { donnees, rafraichir } = useAbonnee();
  const [contenus, setContenus] = useState<ContenuNutrition[]>([]);
  const [lus, setLus] = useState<Set<string>>(new Set());
  const [chargement, setChargement] = useState(true);
  const [indisponible, setIndisponible] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("tout");
  const [ouvert, setOuvert] = useState<ContenuNutrition | null>(null);

  async function charger() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [c, l] = await Promise.all([
      supabase.from("contenus_nutrition").select("*").eq("statut", "publie").order("ordre", { ascending: true }),
      user ? supabase.from("contenus_lus").select("contenu_id").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
    ]);
    if (c.error) setIndisponible(true);
    setContenus((c.data as ContenuNutrition[]) ?? []);
    setLus(new Set(((l.data ?? []) as { contenu_id: string }[]).map((x) => x.contenu_id)));
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  async function marquerLu(c: ContenuNutrition) {
    if (!donnees?.userId || lus.has(c.id)) return;
    setLus((s) => new Set(s).add(c.id));
    await createClient().from("contenus_lus").insert({ user_id: donnees.userId, contenu_id: c.id });
    rafraichir();
  }

  const astuces = contenus.filter((c) => c.type === "astuce");
  const citations = contenus.filter((c) => c.type === "citation");
  const astuce = astuces.length ? astuces[jourDeLAnnee() % astuces.length] : null;
  const citation = citations.length ? citations[jourDeLAnnee() % citations.length] : null;

  // Cours : une nouvelle lecon debloquee chaque lundi depuis l'inscription.
  const cours = contenus.filter((c) => c.type === "cours");
  const nbCoursDebloques = useMemo(() => {
    const debut = donnees?.profil?.created_at ? lundiDe(new Date(donnees.profil.created_at)) : lundiDe(new Date());
    const semaines = Math.floor((lundiDe(new Date()).getTime() - debut.getTime()) / (7 * 86400000));
    return Math.max(1, semaines + 1);
  }, [donnees]);
  const coursLus = cours.filter((c) => lus.has(c.id)).length;

  const conseils = contenus.filter((c) => c.type === "conseil");
  const recettes = contenus.filter((c) => c.type === "recette");
  const ebooks = contenus.filter((c) => c.type === "ebook");

  const voir = (o: Onglet) => onglet === "tout" || onglet === o;

  return (
    <Page large>
      <EnTete titre="Nutrition" sousTitre="Les conseils de Justine, diététicienne-nutritionniste" />

      {chargement ? (
        <Chargement />
      ) : indisponible ? (
        <div className="verre rounded-2xl p-6">
          <p className="font-bold">La section nutrition arrive très bientôt</p>
          <p className="text-sm text-gris mt-1">Justine prépare ses fiches conseil, ses recettes et ses cours.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {(astuce || citation) && (
            <section className="verre rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/justine-portrait.webp" alt="Justine Dorléans" className="h-20 w-20 rounded-full object-cover object-top border-[3px] border-white shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-feuille-dark">L&apos;astuce santé du jour</p>
                {astuce && <p className="text-[19px] font-extrabold tracking-tight leading-snug mt-1">{astuce.titre}</p>}
                {astuce?.resume && <p className="text-[14px] text-gris mt-1.5 leading-relaxed">{astuce.resume}</p>}
                {citation && <p className="text-[13px] italic text-gris mt-3">« {citation.titre} »</p>}
              </div>
              {astuce && (
                <button onClick={() => marquerLu(astuce)} disabled={lus.has(astuce.id)} className="btn btn-clair shrink-0">
                  {lus.has(astuce.id) ? (
                    <>
                      <IconeCoche taille={15} /> Lue
                    </>
                  ) : (
                    <>
                      <Goutte taille={12} /> J&apos;ai lu, +1 goutte
                    </>
                  )}
                </button>
              )}
            </section>
          )}

          <div className="defile -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Rubriques">
            {ONGLETS.map((o) => (
              <button key={o.valeur} role="tab" aria-selected={onglet === o.valeur} aria-pressed={onglet === o.valeur} className="choix shrink-0" onClick={() => setOnglet(o.valeur)}>
                {o.label}
              </button>
            ))}
          </div>

          {voir("cours") && cours.length > 0 && (
            <section aria-labelledby="titre-cours" className="verre rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h2 id="titre-cours" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
                  <IconeChapeau taille={20} className="text-framboise" /> Cours de nutrition
                </h2>
                <span className="text-sm font-bold text-framboise">
                  {coursLus} sur {cours.length} lu{coursLus > 1 ? "s" : ""}
                </span>
              </div>
              <div className="jauge mb-4">
                <i style={{ width: `${(coursLus / Math.max(1, cours.length)) * 100}%`, background: "#92114f" }} />
              </div>
              <ol className="grid gap-2 sm:grid-cols-2">
                {cours.map((c, i) => {
                  const debloque = i < nbCoursDebloques;
                  const lu = lus.has(c.id);
                  const date = new Date(lundiDe(new Date()).getTime() + (i - nbCoursDebloques + 1) * 7 * 86400000);
                  return (
                    <li key={c.id}>
                      <button
                        disabled={!debloque}
                        onClick={() => setOuvert(c)}
                        className={`w-full text-left rounded-xl px-3.5 py-3 flex items-center gap-3 transition ${
                          lu ? "bg-menthe" : debloque ? "bg-white border-[1.5px] border-framboise" : "bg-white/45"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                            lu ? "bg-feuille text-white" : debloque ? "bg-framboise text-white" : "bg-encre/5 text-gris"
                          }`}
                        >
                          {lu ? <IconeCoche taille={14} /> : debloque ? i + 1 : <IconeVerrou taille={14} />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className={`block text-sm font-semibold leading-snug ${debloque ? "" : "text-gris"}`}>{c.titre}</span>
                          <span className="block text-[11.5px] text-gris">
                            {lu
                              ? "Lu"
                              : debloque
                                ? `${c.duree_min ?? 5} min de lecture`
                                : `Disponible le ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {voir("recette") && recettes.length > 0 && (
            <section aria-labelledby="titre-recettes">
              <h2 id="titre-recettes" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight mb-3">
                <IconeBol taille={20} className="text-[#a86f00]" /> Recettes
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {recettes.map((r) => (
                  <button key={r.id} onClick={() => setOuvert(r)} className="verre group text-left rounded-2xl overflow-hidden flex flex-col">
                    <div className="relative aspect-[16/10] bg-[linear-gradient(135deg,#fdf0c7,#dff1e9)] overflow-hidden">
                      {r.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      )}
                      {lus.has(r.id) && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold text-feuille-dark">
                          <IconeCoche taille={12} /> Testée
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-extrabold leading-snug">{r.titre}</p>
                      <p className="text-[12.5px] text-gris mt-1">
                        {[r.duree_min ? `${r.duree_min} min` : null, ...(r.tags ?? [])].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {voir("conseil") && conseils.length > 0 && (
            <section aria-labelledby="titre-conseils">
              <h2 id="titre-conseils" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight mb-3">
                <IconeAmpoule taille={20} className="text-feuille-dark" /> Fiches conseil
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {conseils.map((c) => (
                  <button key={c.id} onClick={() => setOuvert(c)} className="verre text-left rounded-xl p-4 flex gap-3 items-start">
                    <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${lus.has(c.id) ? "bg-feuille" : "bg-framboise"}`} />
                    <span>
                      <span className="block font-bold leading-snug">{c.titre}</span>
                      {c.resume && <span className="block text-[13px] text-gris mt-1 line-clamp-2">{c.resume}</span>}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {voir("ebook") && ebooks.length > 0 && (
            <section aria-labelledby="titre-ebooks">
              <h2 id="titre-ebooks" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight mb-3">
                <IconeLivre taille={20} className="text-eau-dark" /> E-books
              </h2>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 xl:grid-cols-6">
                {ebooks.map((e, i) => {
                  const fonds = ["#92114f", "#3f8f63", "#fab200", "#1d6f86"];
                  const recompense = donnees?.jeu.recompenses.find((r) => r.titre.toLowerCase().includes(e.titre.toLowerCase()));
                  return (
                    <button key={e.id} onClick={() => setOuvert(e)} className="text-left flex flex-col gap-2 group">
                      <span
                        className="relative aspect-[3/4] rounded-xl overflow-hidden flex items-end p-4 shadow-[0_16px_30px_-18px_rgba(43,29,36,.6)] transition group-hover:-translate-y-1"
                        style={{ background: e.image_url ? undefined : fonds[i % fonds.length] }}
                      >
                        {e.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={e.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <span className={`text-lg font-extrabold leading-tight ${i % 4 === 2 ? "text-encre" : "text-white"}`}>{e.titre}</span>
                        )}
                      </span>
                      <span className="text-sm font-bold leading-snug">{e.titre}</span>
                      <span className="text-[12.5px] font-semibold text-gris">
                        {e.inclus
                          ? "Inclus dans ton abonnement"
                          : recompense?.debloquee
                            ? "Débloqué avec tes gouttes"
                            : recompense
                              ? `${recompense.seuil_gouttes} gouttes ou ${prix(e.prix_abonnee ?? e.prix_public) ?? ""}`
                              : [prix(e.prix_abonnee), prix(e.prix_public)].filter(Boolean)[0] ?? ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {contenus.filter((c) => c.type !== "astuce" && c.type !== "citation").length === 0 && (
            <div className="verre rounded-2xl p-6">
              <p className="font-bold">Justine prépare ses contenus</p>
              <p className="text-sm text-gris mt-1">Fiches conseil, recettes et cours arrivent très vite.</p>
            </div>
          )}
        </div>
      )}

      {ouvert && (
        <FicheNutrition
          contenu={ouvert}
          lu={lus.has(ouvert.id)}
          onLu={() => marquerLu(ouvert)}
          onFermer={() => setOuvert(null)}
          recompenseDebloquee={!!donnees?.jeu.recompenses.find((r) => r.debloquee && r.titre.toLowerCase().includes(ouvert.titre.toLowerCase()))}
        />
      )}
    </Page>
  );
}

function FicheNutrition({
  contenu,
  lu,
  onLu,
  onFermer,
  recompenseDebloquee,
}: {
  contenu: ContenuNutrition;
  lu: boolean;
  onLu: () => void;
  onFermer: () => void;
  recompenseDebloquee: boolean;
}) {
  const paragraphes = contenu.contenu.split(/\n{2,}/).filter((p) => p.trim());
  const accesEbook = contenu.type !== "ebook" || contenu.inclus || recompenseDebloquee;
  return (
    <div
      className="fixed inset-0 z-50 bg-encre/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onFermer()}
      role="dialog"
      aria-modal="true"
      aria-label={contenu.titre}
    >
      <article className="apparition w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto bg-creme rounded-t-2xl sm:rounded-2xl">
        {contenu.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={contenu.image_url} alt="" className="w-full aspect-[16/8] object-cover" />
        )}
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="titre-ecran text-[26px]">{contenu.titre}</h2>
            <button onClick={onFermer} className="h-10 w-10 shrink-0 rounded-full bg-encre/5 flex items-center justify-center" aria-label="Fermer">
              <IconeFermer taille={18} />
            </button>
          </div>
          {contenu.resume && <p className="text-gris font-medium mt-2">{contenu.resume}</p>}
          <div className="mt-5 flex flex-col gap-4 text-[15.5px] leading-relaxed text-encre/85">
            {paragraphes.length > 0 ? paragraphes.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>) : null}
          </div>
          {contenu.type === "ebook" && (
            <div className="mt-6 rounded-xl bg-white/80 p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                {accesEbook ? "Cet e-book est à toi" : `Prix abonnée : ${prix(contenu.prix_abonnee ?? contenu.prix_public) ?? "bientôt"}`}
              </p>
              {contenu.lien_url && (
                <a href={contenu.lien_url} target="_blank" rel="noreferrer" className="btn btn-principal">
                  {accesEbook ? "Télécharger" : "Je le veux"}
                </a>
              )}
            </div>
          )}
          {contenu.type !== "ebook" && (
            <div className="mt-7 flex flex-wrap gap-2">
              <button onClick={onLu} disabled={lu} className="btn btn-principal">
                {lu ? (
                  <>
                    <IconeCoche taille={15} /> {contenu.type === "recette" ? "Testée" : "Lu"}
                  </>
                ) : (
                  <>
                    <Goutte taille={12} /> {contenu.type === "recette" ? "Je l'ai testée" : "J'ai lu"} · +1 goutte
                  </>
                )}
              </button>
              <button onClick={onFermer} className="btn btn-clair">
                Fermer
              </button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
