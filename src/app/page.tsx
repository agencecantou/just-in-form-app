import Link from "next/link";

const CATEGORIES = [
  { nom: "Piloxing", desc: "Boxe, pilates et danse" },
  { nom: "HIIT", desc: "Cardio intense, resultats rapides" },
  { nom: "Animal Flow", desc: "Mobilite et renforcement au poids du corps" },
  { nom: "Pilates", desc: "Gainage et posture" },
  { nom: "Yoga", desc: "Etirements et respiration" },
  { nom: "Nutrition", desc: "Recettes et e-books" },
];

const FORMULES = [
  { nom: "Mensuel", prix: "14,90 €", periode: "/mois" },
  { nom: "3 mois", prix: "11,90 €", periode: "/mois" },
  { nom: "Annuel", prix: "8,90 €", periode: "/mois" },
  { nom: "2 ans", prix: "6,50 €", periode: "/mois" },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* Barre du haut */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <span className="font-semibold text-framboise">Just In Form</span>
        <Link
          href="/connexion"
          className="rounded-full border border-anthracite/20 px-4 py-1.5 text-sm hover:bg-creme"
        >
          Se connecter
        </Link>
      </header>

      {/* Hero */}
      <section className="bg-anthracite text-creme px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl flex flex-col items-center text-center gap-6">
          <span className="rounded-full bg-framboise px-4 py-1 text-sm font-medium">
            Essai gratuit 7 jours
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Ta salle de sport, ta cuisine, ton rythme.
          </h1>
          <p className="max-w-xl text-lg text-creme/80">
            Des cours de sport en video et un accompagnement nutrition avec
            Justine, a suivre ou tu veux, quand tu veux.
          </p>
          <Link
            href="/app"
            className="rounded-full bg-orange px-8 py-3 font-semibold text-anthracite hover:opacity-90 transition"
          >
            Commencer mon essai gratuit
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-16 mx-auto max-w-5xl">
        <h2 className="text-2xl font-semibold text-center mb-10">
          Un catalogue de cours pour tous les objectifs
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {CATEGORIES.map((c) => (
            <div
              key={c.nom}
              className="rounded-2xl bg-white border border-creme-dark p-5"
            >
              <p className="font-semibold text-framboise">{c.nom}</p>
              <p className="text-sm text-anthracite/70">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Formules */}
      <section className="px-6 py-16 bg-framboise-light">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold text-center mb-10">
            Une formule pour chaque rythme
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FORMULES.map((f) => (
              <div
                key={f.nom}
                className="rounded-2xl bg-white p-5 text-center shadow-sm"
              >
                <p className="text-sm text-anthracite/70">{f.nom}</p>
                <p className="text-2xl font-semibold text-framboise">
                  {f.prix}
                </p>
                <p className="text-xs text-anthracite/50">{f.periode}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-anthracite/60">
        Just In Form, coaching sportif et nutrition en ligne
      </footer>
    </main>
  );
}
