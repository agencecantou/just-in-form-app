"use client";

// Coquille de l'espace abonnee : menu a gauche sur ordinateur, barre
// d'onglets en bas sur telephone, et un contexte qui charge une seule fois
// le profil et l'etat du jeu (plante, gouttes, badges) pour toutes les pages.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { chargerAbonnee, type DonneesAbonnee } from "@/lib/donnees";
import Plante from "@/components/Plante";
import {
  Goutte,
  IconeAccueil,
  IconeCoach,
  IconeCompte,
  IconeNutrition,
  IconeProgrammes,
  IconeProgres,
  IconeSeances,
  IconeSortie,
} from "@/components/Icones";

type Contexte = {
  donnees: DonneesAbonnee | null;
  rafraichir: () => Promise<DonneesAbonnee | null>;
};

const ContexteAbonnee = createContext<Contexte>({ donnees: null, rafraichir: async () => null });

export function useAbonnee() {
  return useContext(ContexteAbonnee);
}

const LIENS = [
  { href: "/app", label: "Accueil", Icone: IconeAccueil, mobile: true },
  { href: "/app/seances", label: "Séances", Icone: IconeSeances, mobile: true },
  { href: "/app/programmes", label: "Programmes", Icone: IconeProgrammes, mobile: false },
  { href: "/app/nutrition", label: "Nutrition", Icone: IconeNutrition, mobile: true },
  { href: "/app/progres", label: "Mes progrès", court: "Progrès", Icone: IconeProgres, mobile: true },
];

function estActif(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function EspaceAbonnee({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [donnees, setDonnees] = useState<DonneesAbonnee | null>(null);

  const rafraichir = useCallback(async () => {
    const d = await chargerAbonnee(createClient());
    setDonnees(d);
    return d;
  }, []);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  // Premiere connexion : accueil guide (profil sante) avant tout.
  useEffect(() => {
    const p = donnees?.profil;
    if (p && p.role !== "coach" && p.onboarding_fait === false && pathname !== "/bienvenue") {
      router.replace("/bienvenue");
    }
  }, [donnees, pathname, router]);

  async function deconnexion() {
    await createClient().auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  const jeu = donnees?.jeu;

  return (
    <ContexteAbonnee.Provider value={{ donnees, rafraichir }}>
      <div className="flex-1 flex min-h-screen">
        <aside className="verre hidden lg:flex sticky top-4 m-4 mr-0 h-[calc(100vh-2rem)] w-60 shrink-0 flex-col rounded-2xl px-3 py-5">
          <Link href="/app" className="flex items-center gap-3 px-3 mb-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-10 w-10 object-contain" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight">Just in Form</span>
              <span className="block text-[11px] text-gris font-medium">Sport &amp; santé</span>
            </span>
          </Link>

          <nav aria-label="Navigation principale" className="flex flex-col gap-1">
            {LIENS.map(({ href, label, Icone }) => {
              const actif = estActif(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={actif ? "page" : undefined}
                  className={`flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold transition ${
                    actif ? "bg-framboise text-white shadow-[0_8px_18px_-10px_rgba(146,17,79,.8)]" : "text-[#5c4a53] hover:bg-framboise/5 hover:text-encre"
                  }`}
                >
                  <Icone taille={19} epaisseur={actif ? 2 : 1.8} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            {jeu && (
              <Link href="/app/progres" className="rounded-xl bg-white/70 p-3 flex items-center gap-3 hover:bg-white transition">
                <Plante palier={jeu.palier} soif={jeu.soif} taille={46} gouttes={1} />
                <span className="leading-tight">
                  <span className="flex items-center gap-1.5 text-sm font-extrabold text-eau-dark">
                    <Goutte taille={12} /> {jeu.gouttes} gouttes
                  </span>
                  <span className="block text-[11px] text-gris mt-0.5">{jeu.nomPalier}</span>
                </span>
              </Link>
            )}
            {donnees?.estCoach && (
              <Link href="/admin" className="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold bg-encre text-white hover:bg-black">
                <IconeCoach taille={18} />
                Espace coach
              </Link>
            )}
            <div className="filet pt-2 flex flex-col gap-1">
              <Link
                href="/compte"
                aria-current={pathname === "/compte" ? "page" : undefined}
                className={`flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold ${
                  pathname === "/compte" ? "bg-framboise text-white" : "text-[#5c4a53] hover:bg-framboise/5"
                }`}
              >
                <IconeCompte taille={19} />
                Mon compte
              </Link>
              <button onClick={deconnexion} className="flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium text-gris hover:bg-framboise/5 text-left">
                <IconeSortie taille={18} />
                Se déconnecter
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 pb-28 lg:pb-10">{children}</div>

        <nav
          aria-label="Navigation principale"
          className="verre lg:hidden fixed left-3 right-3 bottom-3 z-40 h-16 rounded-2xl flex items-stretch justify-around px-1"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {[...LIENS.filter((l) => l.mobile), { href: "/compte", label: "Compte", Icone: IconeCompte, mobile: true, court: undefined }].map(
            ({ href, label, court, Icone }) => {
              const actif = estActif(pathname, href) || (href === "/app/seances" && pathname.startsWith("/app/programmes"));
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={actif ? "page" : undefined}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10.5px] ${actif ? "text-framboise font-bold" : "text-gris font-semibold"}`}
                >
                  <Icone taille={22} epaisseur={actif ? 2.1 : 1.8} />
                  {court ?? label}
                </Link>
              );
            }
          )}
        </nav>
      </div>
    </ContexteAbonnee.Provider>
  );
}

// En-tete commun des pages
export function EnTete({
  titre,
  sousTitre,
  droite,
}: {
  titre: React.ReactNode;
  sousTitre?: React.ReactNode;
  droite?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 mb-6 lg:mb-8">
      <div className="min-w-0">
        <h1 className="titre-ecran text-[28px] sm:text-[34px]">{titre}</h1>
        {sousTitre && <p className="text-gris font-medium mt-1.5">{sousTitre}</p>}
      </div>
      {droite}
    </header>
  );
}

export function Page({ children, large = false }: { children: React.ReactNode; large?: boolean }) {
  return (
    <main className={`mx-auto w-full ${large ? "max-w-[1180px]" : "max-w-[1080px]"} px-4 sm:px-6 lg:px-10 pt-6 lg:pt-10`}>
      {children}
    </main>
  );
}

export function Chargement() {
  return (
    <div className="flex items-center gap-3 text-sm text-gris py-10" role="status">
      <span className="h-4 w-4 rounded-full border-2 border-framboise border-t-transparent animate-spin" />
      Chargement…
    </div>
  );
}
