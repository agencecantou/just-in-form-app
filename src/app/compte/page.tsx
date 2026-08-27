"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UTILISATEUR_DEMO, type SeanceTerminee } from "@/lib/types";

const FORMULES = [
  { nom: "Mensuel", prix: "14,90 €/mois", actuelle: false },
  { nom: "Annuel", prix: "8,90 €/mois", actuelle: true },
  { nom: "2 ans", prix: "6,50 €/mois", actuelle: false },
];

const ONGLETS = ["Mon profil", "Mon abonnement", "Mes progres", "Preferences"] as const;

export default function MonCompte() {
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]>("Mes progres");
  const [seances, setSeances] = useState<SeanceTerminee[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("seances_terminees")
        .select("*, videos(titre, categorie)")
        .eq("utilisateur", UTILISATEUR_DEMO)
        .order("termine_le", { ascending: false });
      setSeances((data as SeanceTerminee[]) ?? []);
      setChargement(false);
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-6">Mon compte</h1>

      <nav className="flex gap-2 mb-8 border-b border-creme-dark">
        {ONGLETS.map((item) => (
          <button
            key={item}
            onClick={() => setOnglet(item)}
            className={`px-3 py-2 text-sm font-medium border-b-2 ${
              onglet === item
                ? "border-framboise text-framboise"
                : "border-transparent text-anthracite/50"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {onglet === "Mon abonnement" && (
        <>
          <section className="rounded-2xl bg-framboise-light p-5 mb-6">
            <p className="text-sm text-anthracite/60">Formule actuelle</p>
            <p className="text-xl font-semibold text-framboise">
              Annuel, 8,90 €/mois
            </p>
            <p className="text-sm text-anthracite/60 mt-1">
              Tu economises 71 € par an par rapport au mensuel
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {FORMULES.map((f) => (
              <button
                key={f.nom}
                className={`rounded-xl border p-4 text-left ${
                  f.actuelle
                    ? "border-framboise bg-white"
                    : "border-creme-dark bg-white hover:border-framboise/50"
                }`}
              >
                <p className="font-medium">{f.nom}</p>
                <p className="text-sm text-anthracite/60">{f.prix}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="rounded-full border border-creme-dark px-5 py-2 text-sm">
              Mettre en pause 3 mois
            </button>
            <button className="rounded-full border border-anthracite/20 px-5 py-2 text-sm text-anthracite/60">
              Resilier mon abonnement
            </button>
          </div>
        </>
      )}

      {onglet === "Mes progres" && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl bg-white border border-creme-dark p-4">
              <p className="text-xs text-anthracite/50">Seances terminees</p>
              <p className="text-2xl font-semibold text-framboise">
                {chargement ? "..." : seances.length}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-creme-dark p-4">
              <p className="text-xs text-anthracite/50">Derniere seance</p>
              <p className="text-sm font-medium mt-1">
                {seances[0]
                  ? new Date(seances[0].termine_le).toLocaleDateString("fr-FR")
                  : "Aucune pour le moment"}
              </p>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-anthracite/60 mb-3">
            Historique
          </h2>
          {chargement ? (
            <p className="text-sm text-anthracite/50">Chargement...</p>
          ) : seances.length === 0 ? (
            <p className="text-sm text-anthracite/50">
              Termine une seance depuis l&apos;app pour la voir apparaitre ici.
            </p>
          ) : (
            <div className="space-y-2">
              {seances.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl bg-white border border-creme-dark p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">{s.videos?.titre}</p>
                    <p className="text-xs text-anthracite/50">{s.videos?.categorie}</p>
                  </div>
                  <p className="text-xs text-anthracite/40">
                    {new Date(s.termine_le).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {onglet === "Mon profil" && (
        <p className="text-sm text-anthracite/50">
          A venir : informations personnelles, objectifs et securite du compte.
        </p>
      )}

      {onglet === "Preferences" && (
        <p className="text-sm text-anthracite/50">
          A venir : rappels de seance, notifications et newsletter.
        </p>
      )}
    </div>
  );
}
