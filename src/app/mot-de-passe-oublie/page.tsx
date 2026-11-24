"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });
    setEnvoi(false);
    if (error) {
      setErreur(error.message);
      return;
    }
    setEnvoye(true);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Just In Form" className="h-16 w-auto mx-auto mb-3" />
        <p className="text-center text-gris mb-8">
          Mot de passe oublie
        </p>

        {envoye ? (
          <div className="verre rounded-2xl p-6 space-y-3 text-center">
            <p className="text-sm">
              Si un compte existe pour <strong>{email}</strong>, un email avec
              un lien de reinitialisation vient de t&apos;etre envoye.
            </p>
            <p className="text-xs text-gris">
              Pense a verifier tes spams si tu ne le vois pas passer.
            </p>
          </div>
        ) : (
          <form onSubmit={valider} className="verre rounded-2xl p-6 space-y-4">
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

            {erreur && <p className="text-sm text-framboise">{erreur}</p>}

            <button
              type="submit"
              disabled={envoi}
              className="btn btn-principal w-full"
            >
              Envoyer le lien de reinitialisation
            </button>
          </form>
        )}

        <Link
          href="/connexion"
          className="mt-5 block text-center text-sm font-semibold text-framboise"
        >
          Retour a la connexion
        </Link>
      </div>
    </div>
  );
}
