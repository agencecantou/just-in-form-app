"use client";

// Accueil guide a la premiere connexion, tire du "Questionnaire Profil
// Sante" de Justine. Une question par ecran. Les reponses reglent
// l'objectif de la semaine, la seance du jour et les alertes d'intensite.

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ProfilSante } from "@/lib/types";
import { IconeAlerte, IconeRetour } from "@/components/Icones";

const OBJECTIFS = [
  "Perdre du poids",
  "Me muscler et me sculpter",
  "M'assouplir et me détendre",
  "Garder la forme pendant ma grossesse",
  "Me remettre en forme après bébé",
  "Remettre du sport dans mon quotidien",
];
const TEMPS = [15, 30, 45, 60];
const PASSES = ["Je n'ai jamais fait de sport", "Je n'en fais plus depuis plus d'un an", "J'en fais de temps en temps", "J'en fais régulièrement"];
const VIGILANCE = [
  "Hypertension",
  "Diabète",
  "Traitement pour le cœur ou les artères",
  "Je fume (ou j'ai arrêté depuis moins de 2 ans)",
  "Antécédents familiaux d'infarctus ou d'AVC",
];
const SIGNAUX = ["Douleur dans la poitrine à l'effort", "Palpitations", "Malaise ou vertiges", "Essoufflement inhabituel"];
const DOULEURS = ["Cervicales", "Épaules", "Coudes", "Dos", "Poignets", "Hanches", "Genoux", "Chevilles"];
const RAPPELS = ["Jamais", "La veille", "Le matin", "L'après-midi"];

function Bienvenue() {
  const router = useRouter();
  const params = useSearchParams();
  const modification = params.get("modifier") === "1";
  const [etape, setEtape] = useState(0);
  const [prenom, setPrenom] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [objectif, setObjectif] = useState<string>("");
  const [seances, setSeances] = useState(2);
  const [temps, setTemps] = useState(30);
  const [passe, setPasse] = useState("");
  const [enceinte, setEnceinte] = useState(false);
  const [vigilance, setVigilance] = useState<string[]>([]);
  const [douleurs, setDouleurs] = useState<string[]>([]);
  const [rappel, setRappel] = useState("Le matin");
  const [consentement, setConsentement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    async function charger() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setPrenom(data?.prenom || "");
      const s = (data?.profil_sante ?? {}) as ProfilSante;
      if (s.objectif) setObjectif(s.objectif);
      if (data?.objectif_hebdo) setSeances(data.objectif_hebdo);
      if (s.temps) setTemps(s.temps);
      if (s.passe) setPasse(s.passe);
      setEnceinte(!!s.enceinte);
      setVigilance(s.vigilance ?? []);
      setDouleurs(s.douleurs ?? []);
      if (s.rappel) setRappel(s.rappel);
      setConsentement(!!s.consentement);
    }
    charger();
  }, []);

  useEffect(() => {
    if (objectif.includes("grossesse")) setEnceinte(true);
  }, [objectif]);

  const basculer = (liste: string[], set: (v: string[]) => void, v: string) => set(liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]);
  const signalAlerte = vigilance.some((v) => SIGNAUX.includes(v));

  async function terminer() {
    if (!userId) return;
    setEnvoi(true);
    setErreur(null);
    const sante: ProfilSante = consentement
      ? { objectif, temps, passe, enceinte, vigilance, douleurs, rappel, consentement: true }
      : { objectif, temps, passe, rappel, consentement: false };
    const supabase = createClient();
    const { data: actuel } = await supabase.from("profiles").select("preferences").eq("id", userId).maybeSingle();
    const preferences = {
      ...((actuel?.preferences as Record<string, unknown>) ?? {}),
      frequence: seances === 1 ? "1 séance/semaine" : seances === 2 ? "2 séances/semaine" : "3+ séances/semaine",
      rappels: rappel !== "Jamais",
    };
    const { error } = await supabase
      .from("profiles")
      .update({ objectif_hebdo: seances, profil_sante: sante, onboarding_fait: true, preferences })
      .eq("id", userId);
    setEnvoi(false);
    if (error) {
      setErreur("L'enregistrement n'a pas fonctionné. Réessaie dans un instant.");
      return;
    }
    router.push(modification ? "/compte" : "/app");
    router.refresh();
  }

  const ecrans = [
    {
      titre: modification ? "Ton objectif principal" : `Bienvenue${prenom ? ` ${prenom}` : ""} ! Quel est ton objectif principal ?`,
      aide: "Justine adapte tes suggestions de séances à ce que tu cherches.",
      valide: !!objectif,
      corps: (
        <div className="grid gap-2 sm:grid-cols-2">
          {OBJECTIFS.map((o) => (
            <button key={o} onClick={() => setObjectif(o)} aria-pressed={objectif === o} className="choix choix-doux !min-h-14 !justify-start !text-[14.5px] !px-4">
              {o}
            </button>
          ))}
        </div>
      ),
    },
    {
      titre: "Combien de séances par semaine ?",
      aide: "C'est ton objectif de la semaine : ta plante grandit à chaque semaine validée. Tu pourras le changer quand tu veux.",
      valide: true,
      corps: (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => (
              <button key={n} onClick={() => setSeances(n)} aria-pressed={seances === n} className="choix choix-doux !min-h-20 !flex-col !justify-center">
                <span className="chiffre text-3xl">{n === 3 ? "3+" : n}</span>
                <span className="text-xs font-semibold">séance{n > 1 ? "s" : ""}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-gris mt-3">Justine recommande 3 séances, mais mieux vaut un objectif tenu qu&apos;un objectif ambitieux.</p>
        </>
      ),
    },
    {
      titre: "Combien de temps par séance ?",
      aide: "On te proposera des séances qui rentrent dans ton emploi du temps.",
      valide: true,
      corps: (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TEMPS.map((t) => (
            <button key={t} onClick={() => setTemps(t)} aria-pressed={temps === t} className="choix choix-doux !min-h-16 !text-base !font-bold !justify-center">
              {t === 60 ? "1 h ou +" : `${t} min`}
            </button>
          ))}
        </div>
      ),
    },
    {
      titre: "Et ton passé sportif ?",
      aide: "Aucun jugement : ça nous aide à te proposer le bon niveau.",
      valide: !!passe,
      corps: (
        <div className="grid gap-2">
          {PASSES.map((p) => (
            <button key={p} onClick={() => setPasse(p)} aria-pressed={passe === p} className="choix choix-doux !min-h-14 !justify-start !text-[14.5px] !px-4">
              {p}
            </button>
          ))}
        </div>
      ),
    },
    {
      titre: "Ta santé, en toute confidentialité",
      aide: "Pour afficher des alertes sur les séances intenses. Seule Justine y a accès.",
      valide: true,
      corps: (
        <div className="flex flex-col gap-5">
          <label className="flex items-center gap-3 text-[15px] font-semibold">
            <input type="checkbox" checked={enceinte} onChange={(e) => setEnceinte(e.target.checked)} className="h-5 w-5 accent-[#92114f]" />
            Je suis enceinte
          </label>
          <fieldset>
            <legend className="text-sm font-bold mb-2">Es-tu concernée par…</legend>
            <div className="flex flex-wrap gap-1.5">
              {[...VIGILANCE, ...SIGNAUX].map((v) => (
                <button key={v} onClick={() => basculer(vigilance, setVigilance, v)} aria-pressed={vigilance.includes(v)} className="choix choix-doux">
                  {v}
                </button>
              ))}
            </div>
          </fieldset>
          {signalAlerte && (
            <p className="flex items-start gap-2 rounded-xl bg-jaune-light px-4 py-3 text-sm font-semibold text-[#7a4a00]">
              <IconeAlerte taille={18} className="mt-0.5 shrink-0" />
              Avant de reprendre le sport, parles-en à ton médecin. Commence par les séances douces en attendant son feu vert.
            </p>
          )}
          <fieldset>
            <legend className="text-sm font-bold mb-2">Des douleurs à l&apos;effort ?</legend>
            <div className="flex flex-wrap gap-1.5">
              {DOULEURS.map((d) => (
                <button key={d} onClick={() => basculer(douleurs, setDouleurs, d)} aria-pressed={douleurs.includes(d)} className="choix choix-doux">
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ),
    },
    {
      titre: "Dernière chose : tes rappels",
      aide: "Quand veux-tu qu'on te rappelle ta séance ?",
      valide: true,
      corps: (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RAPPELS.map((r) => (
              <button key={r} onClick={() => setRappel(r)} aria-pressed={rappel === r} className="choix choix-doux !min-h-12 !justify-center">
                {r}
              </button>
            ))}
          </div>
          <label className="flex items-start gap-3 rounded-xl bg-white/70 p-4 text-[13.5px] leading-relaxed">
            <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#92114f]" />
            J&apos;accepte que Just in Form recueille et traite les données relatives à ma santé pour construire mon programme sportif personnalisé. Sans ton accord, tes
            réponses santé ne sont pas enregistrées.
          </label>
          {erreur && <p className="text-sm font-semibold text-framboise">{erreur}</p>}
        </div>
      ),
    },
  ];

  const e = ecrans[etape];
  const derniere = etape === ecrans.length - 1;

  return (
    <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:py-14">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Just In Form" className="h-11 w-11 object-contain" />
          <span className="text-sm font-semibold text-gris">
            {etape + 1} / {ecrans.length}
          </span>
        </div>
        <div className="jauge mb-8">
          <i style={{ width: `${((etape + 1) / ecrans.length) * 100}%`, background: "#92114f" }} />
        </div>
        <section key={etape} className="apparition verre rounded-2xl p-6 sm:p-8">
          <h1 className="titre-ecran text-[26px] sm:text-[32px]">{e.titre}</h1>
          <p className="text-gris font-medium mt-2 mb-6">{e.aide}</p>
          {e.corps}
        </section>
        <div className="flex items-center justify-between mt-5">
          {etape > 0 ? (
            <button onClick={() => setEtape(etape - 1)} className="btn btn-clair">
              <IconeRetour taille={16} /> Retour
            </button>
          ) : (
            <span />
          )}
          {derniere ? (
            <button onClick={terminer} disabled={envoi} className="btn btn-principal">
              {modification ? "Enregistrer" : "C'est parti !"}
            </button>
          ) : (
            <button onClick={() => setEtape(etape + 1)} disabled={!e.valide} className="btn btn-principal">
              Continuer
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function BienvenuePage() {
  return (
    <Suspense>
      <Bienvenue />
    </Suspense>
  );
}
