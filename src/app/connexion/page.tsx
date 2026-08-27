"use client";

import { Suspense, useState } from "react";
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
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-1">Just In Form</h1>
        <p className="text-center text-anthracite/60 mb-8">
          {mode === "connexion" ? "Content de te revoir" : "Cree ton compte"}
        </p>

        <form onSubmit={valider} className="rounded-2xl bg-white border border-creme-dark p-6 space-y-4">
          {mode === "inscription" && (
            <div>
              <label className="text-sm font-medium">Prenom</label>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
            />
          </div>

          {erreur && <p className="text-sm text-framboise">{erreur}</p>}

          <button
            type="submit"
            disabled={envoi}
            className="w-full rounded-full bg-framboise text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {mode === "connexion" ? "Se connecter" : "Creer mon compte"}
          </button>
        </form>

        <button
          onClick={() => {
            setErreur(null);
            setMode(mode === "connexion" ? "inscription" : "connexion");
          }}
          className="mt-4 w-full text-center text-sm text-anthracite/60 underline"
        >
          {mode === "connexion" ? "Pas encore de compte ? Inscris-toi" : "Deja un compte ? Connecte-toi"}
        </button>
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
