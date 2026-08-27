const STATS = [
  { label: "Abonnees actives", valeur: "0" },
  { label: "Revenus / mois", valeur: "0 €" },
  { label: "Essais en cours", valeur: "0" },
  { label: "Resiliations (30j)", valeur: "0" },
];

// Back-office coach (Justine). TODO : proteger cette route avec un role
// "coach" dans Supabase (RLS), distinct des abonnees.
export default function Admin() {
  return (
    <div className="flex-1 flex">
      <aside className="hidden sm:flex w-56 flex-col gap-1 bg-anthracite text-creme px-4 py-6">
        <p className="mb-4 px-2 text-lg font-semibold">Espace coach</p>
        {["Tableau de bord", "Mes videos", "Programmes", "Abonnees", "Codes promo"].map(
          (item, i) => (
            <a
              key={item}
              href="#"
              className={`rounded-lg px-3 py-2 text-sm ${
                i === 0 ? "bg-orange text-anthracite font-medium" : "text-creme/70 hover:bg-white/10"
              }`}
            >
              {item}
            </a>
          )
        )}
      </aside>

      <main className="flex-1 px-6 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Tableau de bord</h1>
          <button className="rounded-full bg-framboise text-white px-5 py-2 text-sm font-semibold">
            + Ajouter une video
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white border border-creme-dark p-4">
              <p className="text-xs text-anthracite/50">{s.label}</p>
              <p className="text-xl font-semibold text-framboise">{s.valeur}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-orange-light p-5">
          <p className="font-medium">Aucune donnee pour le moment</p>
          <p className="text-sm text-anthracite/60">
            Ce tableau de bord s&apos;alimentera automatiquement des que
            Supabase est connecte (table subscriptions + payments).
          </p>
        </div>
      </main>
    </div>
  );
}
