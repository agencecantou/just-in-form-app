"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type SeanceLigne = {
  video_id: string;
  termine_le: string;
  videos: { duree_min: number; categories: string[] } | null;
};

type Badge = {
  id: string;
  emoji: string;
  titre: string;
  obtenu: boolean;
};

// Le lundi de la semaine contenant `date`.
function lundiDeLaSemaine(date: Date) {
  const d = new Date(date);
  const jour = d.getDay(); // 0 = dimanche
  const decalage = jour === 0 ? -6 : 1 - jour;
  d.setDate(d.getDate() + decalage);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculerMeilleureSerie(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniques = [...new Set(dates.map((d) => new Date(d).toDateString()))]
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());
  let meilleure = 1;
  let courante = 1;
  for (let i = 1; i < uniques.length; i++) {
    const veille = new Date(uniques[i]);
    veille.setDate(veille.getDate() - 1);
    if (veille.toDateString() === uniques[i - 1].toDateString()) {
      courante++;
      meilleure = Math.max(meilleure, courante);
    } else {
      courante = 1;
    }
  }
  return meilleure;
}

function formaterDuree(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export default function ProgresPage() {
  const [chargement, setChargement] = useState(true);
  const [minutesParJour, setMinutesParJour] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [totalSeances, setTotalSeances] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setChargement(false);
        return;
      }

      const [{ data: seancesData }, { data: programmeVideosData }] = await Promise.all([
        supabase
          .from("seances_terminees")
          .select("video_id, termine_le, videos(duree_min, categories)")
          .eq("user_id", user.id),
        supabase.from("programme_videos").select("programme_id, video_id, programmes(statut)"),
      ]);

      const seances = (seancesData ?? []) as unknown as SeanceLigne[];
      const dates = seances.map((s) => s.termine_le);

      // Repartition de la semaine en cours (lundi -> dimanche).
      const lundi = lundiDeLaSemaine(new Date());
      const dimanche = new Date(lundi);
      dimanche.setDate(dimanche.getDate() + 7);
      const minutes = [0, 0, 0, 0, 0, 0, 0];
      for (const s of seances) {
        const d = new Date(s.termine_le);
        if (d >= lundi && d < dimanche) {
          const index = (d.getDay() + 6) % 7; // lundi = 0
          minutes[index] += s.videos?.duree_min ?? 0;
        }
      }
      setMinutesParJour(minutes);

      const meilleureSerie = calculerMeilleureSerie(dates);
      const totalSeances = seances.length;
      const totalMinutesEntrainement = seances.reduce((total, s) => total + (s.videos?.duree_min ?? 0), 0);
      setTotalSeances(totalSeances);
      setTotalMinutes(totalMinutesEntrainement);
      const totalPiloxing = seances.filter((s) => s.videos?.categories?.includes("Piloxing")).length;
      const leveTot = seances.some((s) => new Date(s.termine_le).getHours() < 8);

      type ProgrammeVideoLigne = { programme_id: string; video_id: string; programmes: { statut: string } | null };
      const pv = (programmeVideosData ?? []) as unknown as ProgrammeVideoLigne[];
      const termineesSet = new Set(seances.map((s) => s.video_id));
      const parProgramme = new Map<string, { fait: number; total: number }>();
      for (const ligne of pv) {
        if (!ligne.programmes || ligne.programmes.statut !== "publie") continue;
        const entree = parProgramme.get(ligne.programme_id) ?? { fait: 0, total: 0 };
        entree.total += 1;
        if (termineesSet.has(ligne.video_id)) entree.fait += 1;
        parProgramme.set(ligne.programme_id, entree);
      }
      const programmesTermines = [...parProgramme.values()].filter((v) => v.total > 0 && v.fait === v.total).length;

      setBadges([
        { id: "serie", emoji: "🔥", titre: "5 jours d'affilée", obtenu: meilleureSerie >= 5 },
        { id: "piloxing", emoji: "🥊", titre: "10 Piloxing", obtenu: totalPiloxing >= 10 },
        { id: "leve-tot", emoji: "🌅", titre: "Lève-tôt", obtenu: leveTot },
        { id: "100-seances", emoji: "💯", titre: "100 séances", obtenu: totalSeances >= 100 },
        { id: "programmes-x3", emoji: "🏆", titre: "Programme terminé x3", obtenu: programmesTermines >= 3 },
      ]);

      setChargement(false);
    }
    charger();
  }, []);

  const maxMinutes = Math.max(1, ...minutesParJour);

  return (
    <main className="flex-1 px-6 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Mes progrès</h1>
      <p className="text-anthracite/60 mb-6">Ta régularité paie, continue !</p>

      {chargement ? (
        <p className="text-sm text-anthracite/50">Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl bg-white border border-creme-dark p-4">
              <p className="text-2xl font-semibold text-framboise">{totalSeances}</p>
              <p className="text-xs text-anthracite/50 mt-1">vidéos réalisées</p>
            </div>
            <div className="rounded-2xl bg-white border border-creme-dark p-4">
              <p className="text-2xl font-semibold text-framboise">{formaterDuree(totalMinutes)}</p>
              <p className="text-xs text-anthracite/50 mt-1">d&apos;entraînement au total</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-creme-dark p-6 mb-8">
            <p className="font-semibold mb-6">Ta semaine d&apos;entraînement</p>
            <div className="grid grid-cols-7 gap-3 items-end h-40">
              {JOURS.map((jour, i) => {
                const minutes = minutesParJour[i];
                const hauteur = minutes > 0 ? Math.max(12, Math.round((minutes / maxMinutes) * 100)) : 0;
                return (
                  <div key={jour} className="flex flex-col items-center h-full justify-end gap-2">
                    <div
                      className={`w-full rounded-lg ${minutes > 0 ? "bg-framboise" : "bg-framboise-light"}`}
                      style={{ height: `${Math.max(4, hauteur)}%` }}
                      title={minutes > 0 ? `${minutes} min` : "Repos"}
                    />
                    <span className="text-xs text-anthracite/50">{jour}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <h2 className="font-semibold mb-3">Tes badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`rounded-2xl border p-4 text-center ${
                  b.obtenu ? "bg-white border-creme-dark" : "bg-creme border-creme-dark opacity-50"
                }`}
              >
                <p className="text-2xl mb-2">{b.emoji}</p>
                <p className="text-xs font-medium">{b.titre}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
