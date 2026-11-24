"use client";

import { useMemo, useState } from "react";
import { cleJour, formaterDuree, lundiDe, phraseSoif, GOUTTES, PALIERS } from "@/lib/jeu";
import { Chargement, EnTete, Page, useAbonnee } from "@/components/EspaceAbonnee";
import Plante from "@/components/Plante";
import { Goutte, IconeCadeau, IconeVerrou, PictoBadge } from "@/components/Icones";

type Periode = "semaine" | "mois" | "trimestre" | "annee";
const PERIODES: { valeur: Periode; label: string }[] = [
  { valeur: "semaine", label: "Semaine" },
  { valeur: "mois", label: "Mois" },
  { valeur: "trimestre", label: "Trimestre" },
  { valeur: "annee", label: "Année" },
];
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function debutPeriode(p: Periode, d = new Date()) {
  if (p === "semaine") return lundiDe(d);
  if (p === "mois") return new Date(d.getFullYear(), d.getMonth(), 1);
  if (p === "trimestre") return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
  return new Date(d.getFullYear(), 0, 1);
}

function precedente(p: Periode, debut: Date) {
  const d = new Date(debut);
  if (p === "semaine") d.setDate(d.getDate() - 7);
  else if (p === "mois") d.setMonth(d.getMonth() - 1);
  else if (p === "trimestre") d.setMonth(d.getMonth() - 3);
  else d.setFullYear(d.getFullYear() - 1);
  return d;
}

export default function ProgresPage() {
  const { donnees } = useAbonnee();
  const [periode, setPeriode] = useState<Periode>("mois");
  const [voirRegles, setVoirRegles] = useState(false);

  const stats = useMemo(() => {
    if (!donnees) return null;
    const maintenant = new Date();
    const debut = debutPeriode(periode, maintenant);
    const avantDebut = precedente(periode, debut);
    const dans = (a: Date, b: Date) => donnees.seances.filter((s) => {
      const t = new Date(s.termine_le);
      return t >= a && t < b;
    });
    const courantes = dans(debut, new Date(maintenant.getTime() + 86400000));
    const passees = dans(avantDebut, debut);
    const parJour = new Map<string, { n: number; min: number }>();
    for (const s of donnees.seances) {
      const k = cleJour(new Date(s.termine_le));
      const v = parJour.get(k) ?? { n: 0, min: 0 };
      v.n++;
      v.min += s.duree_min;
      parJour.set(k, v);
    }
    return {
      debut,
      nombre: courantes.length,
      minutes: courantes.reduce((t, s) => t + s.duree_min, 0),
      ecart: courantes.length - passees.length,
      parJour,
    };
  }, [donnees, periode]);

  if (!donnees || !stats) {
    return (
      <Page>
        <Chargement />
      </Page>
    );
  }
  const jeu = donnees.jeu;
  const nomPeriode = { semaine: "cette semaine", mois: "ce mois-ci", trimestre: "ce trimestre", annee: "cette année" }[periode];
  const nomPrecedente = { semaine: "la semaine dernière", mois: "le mois dernier", trimestre: "le trimestre dernier", annee: "l'an dernier" }[periode];

  return (
    <Page large>
      <EnTete
        titre="Mes progrès"
        sousTitre={jeu.totalSeances === 0 ? "Ta première séance fera germer ta plante" : "Ta régularité paie, continue comme ça"}
        droite={
          <div className="verre flex rounded-xl p-1 gap-1" role="tablist" aria-label="Période">
            {PERIODES.map((p) => (
              <button
                key={p.valeur}
                role="tab"
                aria-selected={periode === p.valeur}
                onClick={() => setPeriode(p.valeur)}
                className={`h-9 px-3 sm:px-4 rounded-lg text-[13px] font-semibold transition ${periode === p.valeur ? "bg-framboise text-white" : "text-gris hover:text-encre"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { v: String(stats.nombre), l: `séance${stats.nombre > 1 ? "s" : ""} ${nomPeriode}`, c: "#92114f" },
          { v: formaterDuree(stats.minutes), l: "d'entraînement", c: "#92114f" },
          jeu.serieSemaines > 0
            ? { v: String(jeu.serieSemaines), l: `semaine${jeu.serieSemaines > 1 ? "s" : ""} active${jeu.serieSemaines > 1 ? "s" : ""} d'affilée`, c: "#2f6b4f" }
            : { v: String(jeu.semainesValidees), l: `semaine${jeu.semainesValidees > 1 ? "s" : ""} validée${jeu.semainesValidees > 1 ? "s" : ""} au total`, c: "#2f6b4f" },
          { v: String(jeu.gouttes), l: "gouttes gagnées", c: "#1d6f86" },
        ].map((x, i) => (
          <div key={i} className="verre rounded-2xl p-4 sm:p-5">
            <p className="chiffre text-[28px] sm:text-[32px] leading-none" style={{ color: x.c }}>
              {x.v}
            </p>
            <p className="text-[13px] text-gris font-medium mt-2">{x.l}</p>
          </div>
        ))}
      </div>
      {stats.ecart !== 0 && (
        <p className="text-sm text-gris -mt-3 mb-6">
          {Math.abs(stats.ecart)} séance{Math.abs(stats.ecart) > 1 ? "s" : ""} {stats.ecart > 0 ? "de plus" : "de moins"} que {nomPrecedente}
        </p>
      )}

      <div className="grid gap-5 lg:gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)] mb-6">
        <section className="verre rounded-2xl p-5 sm:p-6 min-w-0" aria-label="Activité">
          {periode === "semaine" && <VueSemaine parJour={stats.parJour} debut={stats.debut} />}
          {periode === "mois" && <VueMois parJour={stats.parJour} debut={stats.debut} />}
          {(periode === "trimestre" || periode === "annee") && (
            <VueSemaines semaines={jeu.semaines} debut={stats.debut} objectif={jeu.objectif} annee={periode === "annee"} />
          )}
        </section>

        <section className="verre rounded-2xl p-5 sm:p-6 flex flex-col" aria-labelledby="titre-jardin">
          <div className="flex items-baseline justify-between">
            <h2 id="titre-jardin" className="text-lg font-extrabold tracking-tight">
              Mon jardin
            </h2>
            <button onClick={() => setVoirRegles((v) => !v)} className="text-[13px] font-semibold text-framboise" aria-expanded={voirRegles}>
              Règles du jeu
            </button>
          </div>
          <div className="flex items-end justify-around gap-2 flex-1 my-4 min-h-[170px] content-center self-stretch py-2">
            {jeu.jardin.slice(-3).map((j, i, arr) => {
              const enCours = i === arr.length - 1;
              return (
                <div key={`${j.annee}-${j.t}`} className="flex flex-col items-center gap-1">
                  <Plante
                    palier={enCours ? jeu.palier : Math.max(j.palier, j.validees > 0 ? 1 : 0)}
                    soif={enCours ? jeu.soif : 0}
                    taille={enCours ? 160 : 112}
                    gouttes={enCours ? 1 : 0}
                    pot={enCours ? "#92114f" : "#c9a4b6"}
                  />
                  <span className={`text-xs font-bold ${enCours ? "text-framboise" : "text-gris"}`}>
                    T{j.t} {j.annee}
                    {enCours ? " · en cours" : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[13px] text-gris">
            {phraseSoif(jeu.soif, jeu.enPause)}.{" "}
            {jeu.prochainPalier
              ? `Encore ${jeu.prochainPalier.restant} semaine${jeu.prochainPalier.restant > 1 ? "s" : ""} validée${jeu.prochainPalier.restant > 1 ? "s" : ""} pour passer au palier « ${jeu.prochainPalier.nom.toLowerCase()} ».`
              : "Elle a atteint son plus beau palier."}
          </p>
          {voirRegles && (
            <div className="apparition mt-4 filet pt-4 text-[13px] leading-relaxed text-encre/80 flex flex-col gap-2">
              <p>
                <b>Gouttes</b> : +{GOUTTES.parSeance} par séance terminée ({GOUTTES.maxSeancesParJour} par jour maximum), +{GOUTTES.parSemaineValidee} par
                semaine validée, les gouttes des missions et défis du mois, +{GOUTTES.parLecture} par fiche nutrition lue ({GOUTTES.maxLecturesParSemaine} par semaine).
              </p>
              <p>
                <b>Plante</b> : elle grandit avec tes semaines validées ({PALIERS.slice(1).map((p) => `${p.nom.toLowerCase()} ${p.seuil}`).join(", ")}).
              </p>
              <p>
                <b>Semaine manquée</b> : elle a soif, puis perd des feuilles. Après 3 semaines, elle redescend d&apos;un palier. Une semaine validée suffit à la
                remettre d&apos;aplomb, et tes gouttes restent acquises.
              </p>
              <p>
                <b>Joker</b> : une semaine pardonnée par mois, automatiquement. En vacances ou en pause ? Active le mode pause dans ton compte.
              </p>
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="titre-badges" className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 id="titre-badges" className="text-lg font-extrabold tracking-tight">
            Mes badges
          </h2>
          <span className="text-[13px] text-gris">Un badge obtenu reste à toi pour toujours</span>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {jeu.badges.map((b) => {
            const obtenu = b.compte > 0;
            return (
              <div key={b.id} className={`verre rounded-2xl p-4 flex flex-col gap-3 ${obtenu ? "" : "opacity-80"}`}>
                <div className="flex items-start justify-between">
                  <span
                    className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={
                      obtenu
                        ? { background: b.couleur, boxShadow: `0 10px 20px -10px ${b.couleur}` }
                        : { background: "rgba(255,255,255,.7)", border: "1.5px dashed rgba(146,17,79,.3)" }
                    }
                  >
                    <PictoBadge icone={b.icone} taille={24} couleur={obtenu ? "#fff" : "#b38aa0"} />
                    {b.repetable && b.compte > 0 && (
                      <span className="absolute -top-2 -right-2.5 rounded-md bg-encre px-1.5 py-0.5 text-[11.5px] font-extrabold text-white">×{b.compte}</span>
                    )}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold leading-snug">{b.titre}</p>
                  <p className="text-[12px] text-gris mt-0.5 leading-snug">
                    {obtenu && !b.repetable
                      ? b.obtenuLe
                        ? `Obtenu le ${b.obtenuLe.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
                        : "Obtenu"
                      : b.description}
                  </p>
                </div>
                {(b.repetable || !obtenu) && (
                  <div>
                    <div className="jauge !h-1.5">
                      <i style={{ width: `${Math.min(100, (b.progres.actuel / Math.max(1, b.progres.cible)) * 100)}%`, background: b.couleur }} />
                    </div>
                    <p className="text-[11.5px] text-gris mt-1">
                      {b.repetable && obtenu ? "Prochain : " : ""}
                      {b.progres.actuel} / {b.progres.cible}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {jeu.recompenses.length > 0 && (
        <section aria-labelledby="titre-recompenses">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="titre-recompenses" className="text-lg font-extrabold tracking-tight">
              Mes récompenses
            </h2>
            <span className="flex items-center gap-1.5 text-sm font-bold text-eau-dark">
              <Goutte taille={12} /> {jeu.gouttes}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {jeu.recompenses.map((r) => (
              <div key={r.id} className={`rounded-2xl p-5 flex gap-4 items-start ${r.debloquee ? "bg-jaune-light border border-jaune/40" : "verre"}`}>
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${r.debloquee ? "bg-jaune text-encre" : "bg-encre/5 text-gris"}`}>
                  {r.debloquee ? <IconeCadeau taille={22} /> : <IconeVerrou taille={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug">{r.titre}</p>
                  {r.description && <p className="text-[13px] text-gris mt-1">{r.description}</p>}
                  {r.debloquee ? (
                    r.lien_url ? (
                      <a href={r.lien_url} target="_blank" rel="noreferrer" className="btn btn-sombre mt-3 !min-h-9 !text-[13px]">
                        En profiter
                      </a>
                    ) : (
                      <p className="text-[13px] font-bold text-[#6b4300] mt-2">Débloquée ! Justine te l&apos;envoie.</p>
                    )
                  ) : (
                    <>
                      <div className="jauge mt-3">
                        <i style={{ width: `${Math.min(100, (jeu.gouttes / r.seuil_gouttes) * 100)}%`, background: "#fab200" }} />
                      </div>
                      <p className="text-[12px] text-gris mt-1">
                        {jeu.gouttes} / {r.seuil_gouttes} gouttes
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}

function VueSemaine({ parJour, debut }: { parJour: Map<string, { n: number; min: number }>; debut: Date }) {
  const jours = JOURS.map((_, i) => {
    const d = new Date(debut);
    d.setDate(d.getDate() + i);
    return { d, ...(parJour.get(cleJour(d)) ?? { n: 0, min: 0 }) };
  });
  const max = Math.max(30, ...jours.map((j) => j.min));
  return (
    <>
      <h2 className="text-lg font-extrabold tracking-tight mb-5">Ta semaine</h2>
      <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-44">
        {jours.map((j, i) => (
          <div key={i} className="flex flex-col items-center justify-end h-full gap-2">
            {j.min > 0 && <span className="text-[11px] font-bold text-framboise">{j.min}′</span>}
            <div
              className={`w-full max-w-12 rounded-md ${j.min > 0 ? "bg-framboise" : "bg-encre/[.06]"}`}
              style={{ height: `${j.min > 0 ? Math.max(14, (j.min / max) * 100) : 6}%` }}
              title={j.min > 0 ? `${j.min} min` : "Repos"}
            />
            <span className="text-[11px] font-semibold text-gris">{JOURS[i]}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function VueMois({ parJour, debut }: { parJour: Map<string, { n: number; min: number }>; debut: Date }) {
  const decalage = (debut.getDay() + 6) % 7;
  const nbJours = new Date(debut.getFullYear(), debut.getMonth() + 1, 0).getDate();
  const aujourdHui = cleJour(new Date());
  return (
    <>
      <h2 className="text-lg font-extrabold tracking-tight mb-4 first-letter:uppercase">
        {debut.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
      </h2>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[11px] font-bold text-gris mb-1.5">
        {JOURS.map((j) => (
          <span key={j}>{j}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: decalage }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {Array.from({ length: nbJours }, (_, i) => {
          const d = new Date(debut.getFullYear(), debut.getMonth(), i + 1);
          const k = cleJour(d);
          const v = parJour.get(k);
          const auj = k === aujourdHui;
          const futur = d > new Date();
          return (
            <span
              key={k}
              title={v ? `${v.n} séance${v.n > 1 ? "s" : ""}, ${v.min} min` : undefined}
              className={`h-10 sm:h-11 rounded-lg flex items-center justify-center text-[12px] font-bold ${
                v ? "bg-framboise text-white" : futur ? "text-gris/50" : "bg-encre/[.05] text-gris"
              } ${auj ? "ring-2 ring-jaune ring-offset-1" : ""}`}
            >
              {i + 1}
            </span>
          );
        })}
      </div>
    </>
  );
}

function VueSemaines({
  semaines,
  debut,
  objectif,
  annee,
}: {
  semaines: { lundi: Date; nombre: number; statut: string }[];
  debut: Date;
  objectif: number;
  annee: boolean;
}) {
  const fin = new Date(debut);
  fin.setMonth(fin.getMonth() + (annee ? 12 : 3));
  const liste = semaines.filter((s) => s.lundi >= lundiDe(debut) && s.lundi < fin);
  const max = Math.max(objectif + 1, ...liste.map((s) => s.nombre));
  const couleur = (st: string) =>
    st === "validee" ? "#92114f" : st === "joker" ? "#fab200" : st === "pause" ? "#5bb8d4" : st === "en_cours" ? "#f4a7c8" : "rgba(43,29,36,.12)";
  return (
    <>
      <h2 className="text-lg font-extrabold tracking-tight mb-1">Tes semaines</h2>
      <p className="text-[13px] text-gris mb-5">Une barre par semaine, la ligne marque ton objectif de {objectif} séance{objectif > 1 ? "s" : ""}.</p>
      {liste.length === 0 ? (
        <p className="text-sm text-gris">Pas encore de semaine sur cette période.</p>
      ) : (
        <div className="relative h-44">
          <span className="absolute left-0 right-0 border-t border-dashed border-framboise/40" style={{ bottom: `${(objectif / max) * 100}%` }} />
          <div className={`absolute inset-0 flex items-end ${annee ? "gap-[3px]" : "gap-2"}`}>
            {liste.map((s) => (
              <div
                key={s.lundi.toISOString()}
                className="flex-1 rounded-t-[4px] min-h-[4px]"
                style={{ height: `${Math.max(3, (s.nombre / max) * 100)}%`, background: couleur(s.statut) }}
                title={`Semaine du ${s.lundi.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} : ${s.nombre} séance${s.nombre > 1 ? "s" : ""}`}
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-[12px] text-gris font-semibold">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-framboise" /> Validée</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-jaune" /> Joker</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-eau" /> Pause</span>
      </div>
    </>
  );
}
