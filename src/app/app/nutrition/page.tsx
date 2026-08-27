// Section Nutrition : recettes, conseils et e-books.
// Volontairement statique pour l'instant, ce sont des articles rediges par
// Justine et non des videos : pas besoin de la meme mecanique que /admin.
// A brancher plus tard sur une vraie source de contenu si Justine en publie
// regulierement (Supabase, ou simple export markdown).

const RESSOURCES = [
  {
    titre: "E-book : Nutrition & Sport",
    type: "E-book",
    resume: "Les bases pour manger juste autour de tes seances, inclus dans ton abonnement.",
  },
  {
    titre: "5 recettes riches en proteines",
    type: "Recette",
    resume: "Des idees simples et rapides pour la semaine.",
  },
  {
    titre: "Bien s'hydrater quand on est sportive",
    type: "Conseil",
    resume: "Quantites, moments-cles, erreurs a eviter.",
  },
];

export default function NutritionPage() {
  return (
    <main className="flex-1 px-6 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Nutrition</h1>
      <p className="text-anthracite/60 mb-6">Recettes, conseils et e-books de Justine.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RESSOURCES.map((r) => (
          <div key={r.titre} className="rounded-2xl bg-white border border-creme-dark p-5">
            <p className="text-xs text-orange font-medium">{r.type}</p>
            <p className="font-semibold mt-1">{r.titre}</p>
            <p className="text-sm text-anthracite/60 mt-1">{r.resume}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-orange-light p-5">
        <p className="text-sm text-anthracite/60">
          Cette section est pour l&apos;instant statique (contenu de demo). On la
          connectera a un vrai espace de gestion si Justine souhaite publier ses
          propres recettes et e-books regulierement.
        </p>
      </div>
    </main>
  );
}
