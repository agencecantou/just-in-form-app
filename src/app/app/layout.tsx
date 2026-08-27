"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LIENS_BASE = [
  { href: "/app", label: "Seances" },
  { href: "/app/programmes", label: "Programmes" },
  { href: "/app/nutrition", label: "Nutrition" },
  { href: "/compte", label: "Mon compte" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [estCoach, setEstCoach] = useState(false);

  useEffect(() => {
    async function charger() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("prenom, role")
        .eq("id", user.id)
        .maybeSingle();
      setPrenom(profile?.prenom || user.email?.split("@")[0] || "");
      setEstCoach(profile?.role === "coach");
    }
    charger();
  }, []);

  async function deconnexion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  const liens = estCoach ? [...LIENS_BASE, { href: "/admin", label: "Espace coach" }] : LIENS_BASE;

  return (
    <div className="flex-1 flex flex-col sm:flex-row">
      {/* Sur mobile : barre horizontale scrollable. Sur desktop : sidebar verticale. */}
      <aside className="flex flex-row sm:flex-col gap-1 sm:w-56 overflow-x-auto border-b sm:border-b-0 sm:border-r border-creme-dark bg-white px-3 sm:px-4 py-3 sm:py-6">
        <p className="hidden sm:block mb-1 px-2 text-lg font-semibold text-framboise">
          Just In Form
        </p>
        {prenom && (
          <p className="hidden sm:block mb-4 px-2 text-xs text-anthracite/50">
            Salut {prenom}
          </p>
        )}
        {liens.map((lien) => (
          <Link
            key={lien.href}
            href={lien.href}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
              pathname === lien.href
                ? "bg-framboise-light text-framboise font-medium"
                : "text-anthracite/70 hover:bg-creme"
            }`}
          >
            {lien.label}
          </Link>
        ))}
        <button
          onClick={deconnexion}
          className="shrink-0 whitespace-nowrap sm:mt-auto rounded-lg px-3 py-2 text-left text-sm text-anthracite/40 hover:bg-creme"
        >
          Se deconnecter
        </button>
      </aside>

      {children}
    </div>
  );
}
