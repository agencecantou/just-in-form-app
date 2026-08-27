"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/app", label: "Seances" },
  { href: "/app/programmes", label: "Programmes" },
  { href: "/app/nutrition", label: "Nutrition" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 flex">
      <aside className="hidden sm:flex w-56 flex-col gap-1 border-r border-creme-dark bg-white px-4 py-6">
        <p className="mb-4 px-2 text-lg font-semibold text-framboise">
          Just In Form
        </p>
        {LIENS.map((lien) => (
          <Link
            key={lien.href}
            href={lien.href}
            className={`rounded-lg px-3 py-2 text-sm ${
              pathname === lien.href
                ? "bg-framboise-light text-framboise font-medium"
                : "text-anthracite/70 hover:bg-creme"
            }`}
          >
            {lien.label}
          </Link>
        ))}
        <Link
          href="/compte"
          className={`rounded-lg px-3 py-2 text-sm ${
            pathname === "/compte"
              ? "bg-framboise-light text-framboise font-medium"
              : "text-anthracite/70 hover:bg-creme"
          }`}
        >
          Mon compte
        </Link>
        <Link
          href="/admin"
          className="mt-auto rounded-lg px-3 py-2 text-sm text-anthracite/40 hover:bg-creme"
        >
          Espace coach
        </Link>
      </aside>

      {children}
    </div>
  );
}
