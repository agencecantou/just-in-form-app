import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase cote serveur (Server Components, Route Handlers).
// Lit/ecrit les cookies de session pour garder l'utilisateur connecte.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appele depuis un Server Component : ignore, le middleware
            // se charge du rafraichissement de session.
          }
        },
      },
    }
  );
}
