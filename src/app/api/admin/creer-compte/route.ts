import { NextResponse } from "next/server";
import { createClient as createClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";

// Cree un compte abonnee (ou coach) depuis l'espace coach, sans passer par
// l'inscription publique. Envoie un email d'invitation : la personne clique
// sur le lien et definit son mot de passe via /reinitialiser-mot-de-passe.
export async function POST(request: Request) {
  const { email, prenom, role } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ erreur: "Email requis." }, { status: 400 });
  }
  if (role !== "abonnee" && role !== "coach") {
    return NextResponse.json({ erreur: "Role invalide." }, { status: 400 });
  }

  // Verifie que l'appelant est bien connecte et coach avant toute action.
  const supabaseServeur = await createClientServeur();
  const {
    data: { user },
  } = await supabaseServeur.auth.getUser();
  if (!user) {
    return NextResponse.json({ erreur: "Non connecte." }, { status: 401 });
  }
  const { data: profil } = await supabaseServeur
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profil?.role !== "coach") {
    return NextResponse.json({ erreur: "Reserve au coach." }, { status: 403 });
  }

  let admin;
  try {
    admin = creerClientAdmin();
  } catch (e) {
    return NextResponse.json(
      { erreur: e instanceof Error ? e.message : "Configuration serveur manquante." },
      { status: 500 }
    );
  }

  const origine = new URL(request.url).origin;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { prenom: prenom || "" },
    redirectTo: `${origine}/reinitialiser-mot-de-passe`,
  });

  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 400 });
  }

  // Le profil est cree automatiquement en "abonnee" par le trigger,
  // on ajuste le role si un compte coach a ete demande.
  if (role === "coach" && data.user) {
    await admin.from("profiles").update({ role: "coach" }).eq("id", data.user.id);
  }

  return NextResponse.json({ ok: true });
}
