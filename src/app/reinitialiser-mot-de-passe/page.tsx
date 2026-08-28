"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reussi, setReussi] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Le lien recu par email cree une session "recovery" cote client des
    // l'arrivee sur la page (detectSessionInUrl de @supabase/ssr).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setPret(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPret(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (motDePasse.length < 6) {
      setErreur("6 caracteres minimum.");
      return;
    }
    setEnvoi(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setEnvoi(false);
    if (error) {
      setErreur(error.message);
      return;
    }
    setReussi(true);
    setTimeout(() => {
      router.push("/app");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-1">Just In Form</h1>
        <p className="text-center text-anthracite/60 mb-8">
          Nouveau mot de passe
        </p>

        {reussi ? (
          <div className="rounded-2xl bg-white border border-creme-dark p-6 text-center">
            <p className="text-sm">Mot de passe mis a jour. Redirection...</p>
          </div>
        ) : !pret ? (
          <div className="rounded-2xl bg-white border border-creme-dark p-6 text-center">
            <p className="text-sm text-anthracite/60">
              Ouvre cette page depuis le lien recu par email pour definir un
              nouveau mot de passe.
            </p>
          </div>
        ) : (
          <form onSubmit={valider} className="rounded-2xl bg-white border border-creme-dark p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirmation</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
              />
            </div>

            {erreur && <p className="text-sm text-framboise">{erreur}</p>}

            <button
              type="submit"
              disabled={envoi}
              className="w-full rounded-full bg-framboise text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              Valider le nouveau mot de passe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
