const FORMULES = [
  { nom: "Mensuel", prix: "14,90 €/mois", actuelle: false },
  { nom: "Annuel", prix: "8,90 €/mois", actuelle: true },
  { nom: "2 ans", prix: "6,50 €/mois", actuelle: false },
];

// Espace "Mon compte" : profil, abonnement, progres, preferences.
// TODO : brancher sur Supabase (table subscriptions) + Stripe Billing Portal
// pour le changement d'offre et la resiliation.
export default function MonCompte() {
  return (
    <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-6">Mon compte</h1>

      <nav className="flex gap-2 mb-8 border-b border-creme-dark">
        {["Mon profil", "Mon abonnement", "Mes progres", "Preferences"].map(
          (item, i) => (
            <span
              key={item}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                i === 1
                  ? "border-framboise text-framboise"
                  : "border-transparent text-anthracite/50"
              }`}
            >
              {item}
            </span>
          )
        )}
      </nav>

      <section className="rounded-2xl bg-framboise-light p-5 mb-6">
        <p className="text-sm text-anthracite/60">Formule actuelle</p>
        <p className="text-xl font-semibold text-framboise">
          Annuel, 8,90 €/mois
        </p>
        <p className="text-sm text-anthracite/60 mt-1">
          Tu economises 71 € par an par rapport au mensuel
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {FORMULES.map((f) => (
          <button
            key={f.nom}
            className={`rounded-xl border p-4 text-left ${
              f.actuelle
                ? "border-framboise bg-white"
                : "border-creme-dark bg-white hover:border-framboise/50"
            }`}
          >
            <p className="font-medium">{f.nom}</p>
            <p className="text-sm text-anthracite/60">{f.prix}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button className="rounded-full border border-creme-dark px-5 py-2 text-sm">
          Mettre en pause 3 mois
        </button>
        <button className="rounded-full border border-anthracite/20 px-5 py-2 text-sm text-anthracite/60">
          Resilier mon abonnement
        </button>
      </div>
    </div>
  );
}
