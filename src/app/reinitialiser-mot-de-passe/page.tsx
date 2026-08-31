"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type StatutVerification = "verification" | "pret" | "echec";

function PageInterieure() {
  const router = useRouter();
  const params = useSearchParams();
  const [statut, setStatut] = useState<StatutVerification>("verification");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reussi, setReussi] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    // Format recommande par Supabase pour eviter qu'un scanner de liens
    // (antivirus, Gmail, etc.) ne consomme le lien a usage unique avant que
    // la personne ne clique elle-meme : la verification se fait ici, cote
    // client, uniquement quand la page s'affiche vraiment dans un
    // navigateur.
    if (tokenHash && type) {
      supabase.auth
        .verifyOtp({
          token_hash: tokenHash,
          type: type as "recovery" | "invite" | "email" | "email_change" | "signup",
        })
        .then(({ error }) => {
          setStatut(error ? "echec" : "pret");
        });
      return;
    }

    // Ancien format (lien direct Supabase avec ?code=) : la session est
    // deja etablie automatiquement par detectSessionInUrl a ce stade.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStatut("pret");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatut("pret");
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (motDePasse.length < 6) {
      setErreur("6 caractères minimum.");
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
            <p className="text-sm">Mot de passe mis à jour. Redirection...</p>
          </div>
        ) : statut === "verification" ? (
          <div className="rounded-2xl bg-white border border-creme-dark p-6 text-center">
            <p className="text-sm text-anthracite/60">Vérification du lien...</p>
          </div>
        ) : statut === "echec" ? (
          <div className="rounded-2xl bg-white border border-creme-dark p-6 text-center space-y-3">
            <p className="text-sm text-anthracite/60">
              Ce lien n&apos;est plus valable (déjà utilisé ou expiré). Demande
              un nouveau lien de réinitialisation.
            </p>
            <a
              href="/mot-de-passe-oublie"
              className="inline-block rounded-full bg-framboise text-white px-5 py-2 text-sm font-semibold"
            >
              Redemander un lien
            </a>
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

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense>
      <PageInterieure />
    </Suspense>
  );
}
