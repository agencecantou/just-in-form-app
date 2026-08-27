const SEANCES = [
  { titre: "HIIT debutant 20 min", categorie: "HIIT", duree: "20 min" },
  { titre: "Pilates dos et gainage", categorie: "Pilates", duree: "30 min" },
  { titre: "Animal Flow mobilite", categorie: "Animal Flow", duree: "25 min" },
  { titre: "Piloxing energie", categorie: "Piloxing", duree: "35 min" },
];

// Espace abonnee. TODO : proteger cette route (verifier la session Supabase
// et l'abonnement actif) une fois l'auth branchee, cf lib/supabase/server.ts
export default function AppHome() {
  return (
    <div className="flex-1 flex">
      <aside className="hidden sm:flex w-56 flex-col gap-1 border-r border-creme-dark bg-white px-4 py-6">
        <p className="mb-4 px-2 text-lg font-semibold text-framboise">
          Just In Form
        </p>
        {["Accueil", "Seances", "Programmes", "Nutrition", "Progres"].map(
          (item, i) => (
            <a
              key={item}
              href="#"
              className={`rounded-lg px-3 py-2 text-sm ${
                i === 0
                  ? "bg-framboise-light text-framboise font-medium"
                  : "text-anthracite/70 hover:bg-creme"
              }`}
            >
              {item}
            </a>
          )
        )}
        <a
          href="/compte"
          className="mt-auto rounded-lg px-3 py-2 text-sm text-anthracite/70 hover:bg-creme"
        >
          Mon compte
        </a>
      </aside>

      <main className="flex-1 px-6 py-8 max-w-4xl">
        <h1 className="text-2xl font-semibold mb-1">Salut Justine ! 👋</h1>
        <p className="text-anthracite/60 mb-6">
          3 seances cette semaine, continue comme ca.
        </p>

        <div className="rounded-2xl bg-anthracite text-creme p-6 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-creme/70">Reprendre la seance</p>
            <p className="text-lg font-semibold">HIIT debutant 20 min</p>
          </div>
          <button className="rounded-full bg-orange px-5 py-2 text-sm font-semibold text-anthracite">
            Reprendre
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SEANCES.map((s) => (
            <div
              key={s.titre}
              className="rounded-2xl bg-white border border-creme-dark p-4"
            >
              <p className="text-xs text-framboise font-medium">
                {s.categorie}
              </p>
              <p className="font-semibold">{s.titre}</p>
              <p className="text-sm text-anthracite/50">{s.duree}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
