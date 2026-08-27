"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UTILISATEUR_DEMO, type SeanceTerminee } from "@/lib/types";

const FORMULES = [
  { nom: "Mensuel", prix: "14,90 €/mois", actuelle: false },
  { nom: "Annuel", prix: "8,90 €/mois", actuelle: true },
  { nom: "2 ans", prix: "6,50 €/mois", actuelle: false },
];

const OBJECTIFS = ["Perdre du poids", "Se muscler", "Gagner en souplesse", "Se sentir mieux", "Preparation sportive"];

const ONGLETS = ["Mon profil", "Mon abonnement", "Mes progres", "Preferences"] as const;

// Nombre de jours consecutifs avec au moins une seance terminee, en partant
// de la seance la plus recente (pas forcement aujourd'hui).
function calculerSerie(seances: SeanceTerminee[]): number {
  if (seances.length === 0) return 0;

  const dates = new Set(
    seances.map((s) => new Date(s.termine_le).toDateString())
  );
  const datesTriees = [...dates]
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let serie = 1;
  let courante = datesTriees[0];
  for (let i = 1; i < datesTriees.length; i++) {
    const veille = new Date(courante);
    veille.setDate(veille.getDate() - 1);
    if (veille.toDateString() === datesTriees[i].toDateString()) {
      serie++;
      courante = datesTriees[i];
    } else {
      break;
    }
  }
  return serie;
}

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
        .select("*, videos(titre, categories)")
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
          <p className="text-xs text-anthracite/40 mt-4">
            Paiement pas encore branche (pas de Stripe pour l&apos;instant), cet
            onglet est une maquette fonctionnelle en attendant.
          </p>
        </>
      )}

      {onglet === "Mes progres" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl bg-white border border-creme-dark p-4">
              <p className="text-xs text-anthracite/50">Seances terminees</p>
              <p className="text-2xl font-semibold text-framboise">
                {chargement ? "..." : seances.length}
              </p>
            </div>
            <div className="rounded-2xl bg-orange-light p-4">
              <p className="text-xs text-anthracite/60">Serie en cours</p>
              <p className="text-2xl font-semibold text-anthracite">
                {chargement ? "..." : calculerSerie(seances)}
                {!chargement && calculerSerie(seances) >= 2 && " 🔥"}
              </p>
              <p className="text-xs text-anthracite/50">
                jour{calculerSerie(seances) > 1 ? "s" : ""} d&apos;affilee
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-creme-dark p-4 col-span-2 sm:col-span-1">
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
                    <p className="text-xs text-anthracite/50">
                      {s.videos?.categories?.join(", ")}
                    </p>
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

      {onglet === "Mon profil" && <OngletProfil />}

      {onglet === "Preferences" && <OngletPreferences />}
    </div>
  );
}

function OngletProfil() {
  const [objectifs, setObjectifs] = useState<string[]>(["Se sentir mieux"]);

  function toggle(o: string) {
    setObjectifs((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-creme-dark p-5">
        <p className="font-medium text-sm mb-3">Informations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-anthracite/50">Prenom</label>
            <input
              defaultValue="Marie"
              className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-anthracite/50">Email</label>
            <input
              defaultValue="marie@example.com"
              className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-creme-dark p-5">
        <p className="font-medium text-sm mb-1">Objectifs</p>
        <p className="text-xs text-anthracite/50 mb-3">
          Utilises pour te proposer des seances adaptees.
        </p>
        <div className="flex flex-wrap gap-2">
          {OBJECTIFS.map((o) => (
            <button
              key={o}
              onClick={() => toggle(o)}
              className={`rounded-full px-3 py-1.5 text-sm border ${
                objectifs.includes(o)
                  ? "bg-framboise text-white border-framboise"
                  : "bg-white text-anthracite/70 border-creme-dark"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-creme-dark p-5">
        <p className="font-medium text-sm mb-3">Securite</p>
        <button className="text-sm text-anthracite/60 underline">
          Changer de mot de passe
        </button>
        <br />
        <button className="text-sm text-framboise underline mt-2">
          Supprimer mon compte
        </button>
      </section>

      <p className="text-xs text-anthracite/40">
        Cet onglet est une maquette pour l&apos;instant (pas encore relie a un
        vrai compte utilisateur, en attendant l&apos;authentification).
      </p>
    </div>
  );
}

function OngletPreferences() {
  const [rappels, setRappels] = useState(true);
  const [serie, setSerie] = useState(true);
  const [nouveautes, setNouveautes] = useState(true);
  const [newsletter, setNewsletter] = useState(false);

  return (
    <div className="space-y-3">
      <TogglePreference
        titre="Rappels de seance"
        description="Une notification les jours ou tu as prevu de t'entrainer"
        valeur={rappels}
        onChange={setRappels}
      />
      <TogglePreference
        titre="Ne casse pas ta serie 🔥"
        description="Un rappel si tu es sur le point de perdre ta regularite"
        valeur={serie}
        onChange={setSerie}
      />
      <TogglePreference
        titre="Nouvelles videos"
        description="Sois prevenue des qu'une nouvelle seance est publiee"
        valeur={nouveautes}
        onChange={setNouveautes}
      />
      <TogglePreference
        titre="Newsletter"
        description="Actus, conseils et offres de Just In Form"
        valeur={newsletter}
        onChange={setNewsletter}
      />
      <p className="text-xs text-anthracite/40 pt-2">
        Reglages non persistes pour l&apos;instant (maquette), a brancher avec
        l&apos;envoi d&apos;emails/notifications plus tard.
      </p>
    </div>
  );
}

function TogglePreference({
  titre,
  description,
  valeur,
  onChange,
}: {
  titre: string;
  description: string;
  valeur: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl bg-white border border-creme-dark p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{titre}</p>
        <p className="text-xs text-anthracite/50">{description}</p>
      </div>
      <button
        onClick={() => onChange(!valeur)}
        className={`shrink-0 w-11 h-6 rounded-full transition relative ${
          valeur ? "bg-framboise" : "bg-creme-dark"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            valeur ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
