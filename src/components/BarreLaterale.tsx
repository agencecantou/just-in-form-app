"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SeanceTerminee } from "@/lib/types";

const LIENS_BASE = [
  { href: "/app", label: "Accueil", icone: "🏠" },
  { href: "/app/seances", label: "Séances", icone: "🎬" },
  { href: "/app/programmes", label: "Programmes", icone: "📅" },
  { href: "/app/nutrition", label: "Nutrition", icone: "🥗" },
  { href: "/app/progres", label: "Mes progrès", icone: "📈" },
];

// Nombre de jours consecutifs avec au moins une seance terminee, en partant
// de la seance la plus recente. Duplique volontairement le calcul de
// /compte : petit utilitaire, pas besoin de le partager pour l'instant.
function calculerSerie(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniques = [...new Set(dates.map((d) => new Date(d).toDateString()))]
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let serie = 1;
  let courante = uniques[0];
  for (let i = 1; i < uniques.length; i++) {
    const veille = new Date(courante);
    veille.setDate(veille.getDate() - 1);
    if (veille.toDateString() === uniques[i].toDateString()) {
      serie++;
      courante = uniques[i];
    } else {
      break;
    }
  }
  return serie;
}

export default function BarreLaterale({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [estCoach, setEstCoach] = useState(false);
  const [serie, setSerie] = useState(0);

  useEffect(() => {
    async function charger() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: profile }, { data: seances }] = await Promise.all([
        supabase.from("profiles").select("prenom, role").eq("id", user.id).maybeSingle(),
        supabase
          .from("seances_terminees")
          .select("termine_le")
          .eq("user_id", user.id),
      ]);
      setPrenom(profile?.prenom || user.email?.split("@")[0] || "");
      setEstCoach(profile?.role === "coach");
      setSerie(calculerSerie(((seances as Pick<SeanceTerminee, "termine_le">[]) ?? []).map((s) => s.termine_le)));
    }
    charger();
  }, []);

  async function deconnexion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  const liens = estCoach ? [...LIENS_BASE, { href: "/admin", label: "Espace coach", icone: "🛠️" }] : LIENS_BASE;

  return (
    <div className="flex-1 flex flex-col sm:flex-row bg-creme min-h-screen">
      {/* Sur mobile : barre horizontale scrollable. Sur desktop : sidebar verticale. */}
      <aside className="flex flex-row sm:flex-col gap-1 sm:w-60 overflow-x-auto border-b sm:border-b-0 sm:border-r border-creme-dark bg-white px-3 sm:px-4 py-3 sm:py-6 shrink-0">
        <p className="hidden sm:block mb-1 px-2 text-xl font-semibold text-anthracite">
          Just in <span className="font-serif italic text-framboise">Form</span>
        </p>
        {prenom && (
          <p className="hidden sm:block mb-4 px-2 text-xs text-anthracite/50">
            Salut {prenom}
          </p>
        )}
        {liens.map((lien) => {
          const actif =
            lien.href === "/app" ? pathname === "/app" : pathname === lien.href || pathname.startsWith(lien.href + "/");
          return (
            <Link
              key={lien.href}
              href={lien.href}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm flex items-center gap-2 transition ${
                actif
                  ? "bg-framboise text-white font-semibold"
                  : "text-anthracite/60 hover:bg-creme font-medium"
              }`}
            >
              <span>{lien.icone}</span>
              {lien.label}
            </Link>
          );
        })}
        {serie >= 2 && (
          <div className="hidden sm:block sm:mt-auto rounded-2xl bg-anthracite text-creme p-4">
            <p className="text-xs text-orange font-medium">Série en cours 🔥</p>
            <p className="text-2xl font-semibold mt-1">{serie} jours</p>
            <p className="text-xs text-creme/70 mt-1">Continue comme ça !</p>
          </div>
        )}

        <Link
          href="/compte"
          className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm flex items-center gap-2 ${
            serie >= 2 ? "sm:mt-2" : "sm:mt-auto"
          } ${
            pathname === "/compte" ? "bg-framboise text-white font-semibold" : "text-anthracite/60 hover:bg-creme font-medium"
          }`}
        >
          <span>⚙️</span>
          Mon compte
        </Link>
        <button
          onClick={deconnexion}
          className="shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm text-anthracite/40 hover:bg-creme"
        >
          Se déconnecter
        </button>
      </aside>

      {children}
    </div>
  );
}
