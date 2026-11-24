"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function FormulaireConnexion() {
  const router = useRouter();
  const params = useSearchParams();
  const suivant = params.get("suivant") || "/app";

  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [prenom, setPrenom] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    const supabase = createClient();

    if (mode === "connexion") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
      });
      setEnvoi(false);
      if (error) {
        setErreur("Email ou mot de passe incorrect.");
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: motDePasse,
        options: { data: { prenom } },
      });
      setEnvoi(false);
      if (error) {
        setErreur(error.message);
        return;
      }
    }

    router.push(suivant);
    router.refresh();
  }

  return (
    <div className="flex-1 grid lg:grid-cols-[1.05fr_1fr] min-h-screen">
      <div className="relative hidden lg:flex flex-col justify-end overflow-hidden bg-framboise p-12 text-white">
        <div className="absolute -right-24 -top-24 h-[30rem] w-[30rem] rounded-full bg-jaune/30" />
        <div className="absolute left-10 bottom-40 h-56 w-56 rounded-full bg-rose/20" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/justine-kick.webp" alt="Justine en séance de piloxing" className="absolute right-6 bottom-0 h-[78%] w-auto object-contain" />
        <div className="relative max-w-sm">
          <p className="titre-ecran text-[44px]">Ta salle de sport, à la maison.</p>
          <p className="mt-4 text-white/85 font-medium leading-relaxed">
            Plus de 100 séances avec Justine, des programmes guidés, la nutrition, et une plante qui grandit avec ta régularité.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Just In Form" className="h-16 w-auto mx-auto mb-3" />
        <p className="text-center text-gris mb-8">
          {mode === "connexion" ? "Content de te revoir" : "Crée ton compte"}
        </p>

        <form onSubmit={valider} className="verre rounded-2xl p-6 flex flex-col gap-4">
          {mode === "inscription" && (
            <div>
              <label className="text-sm font-semibold">Prénom</label>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="champ mt-1.5"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="champ mt-1.5"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="champ mt-1.5"
            />
          </div>

          {erreur && <p className="text-sm text-framboise">{erreur}</p>}

          <button
            type="submit"
            disabled={envoi}
            className="btn btn-principal w-full"
          >
            {mode === "connexion" ? "Se connecter" : "Créer mon compte"}
          </button>

          {mode === "connexion" && (
            <Link
              href="/mot-de-passe-oublie"
              className="block text-center text-[13px] font-semibold text-gris hover:text-framboise"
            >
              Mot de passe oublié ?
            </Link>
          )}
        </form>

        <button
          onClick={() => {
            setErreur(null);
            setMode(mode === "connexion" ? "inscription" : "connexion");
          }}
          className="mt-5 w-full text-center text-sm font-semibold text-framboise"
        >
          {mode === "connexion" ? "Pas encore de compte ? Inscris-toi" : "Déjà un compte ? Connecte-toi"}
        </button>
      </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <FormulaireConnexion />
    </Suspense>
  );
}
