import { createClient } from "@supabase/supabase-js";

// Client Supabase avec la cle service_role : a n'utiliser QUE dans du code
// serveur (route handlers), jamais dans un composant "use client" ni dans
// une variable NEXT_PUBLIC_*. Cette cle contourne totalement les RLS.
export function creerClientAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cleService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cleService) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local (voir .env.example)."
    );
  }
  return createClient(url, cleService, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
