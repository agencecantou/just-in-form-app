import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Protege /app, /compte et /admin : redirige vers /connexion si personne
// n'est connectee. /admin est en plus reserve au role "coach" (verifie via
// la table profiles). La securite fine (RLS) reste a durcir plus tard.
//
// INTERRUPTEUR TEMPORAIRE : mettre a false pour desactiver toute la
// protection par connexion (demo client par exemple). Remettre a true pour
// reactiver l'authentification normalement.
const AUTH_ACTIVE = false;

export async function middleware(request: NextRequest) {
  if (!AUTH_ACTIVE) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const zonesProtegees = ["/app", "/compte", "/admin"];
  const estProtege = zonesProtegees.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (estProtege && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("suivant", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "coach") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/connexion" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/app",
    "/app/:path*",
    "/compte",
    "/compte/:path*",
    "/admin",
    "/admin/:path*",
    "/connexion",
  ],
};
