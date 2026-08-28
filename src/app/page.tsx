import { redirect } from "next/navigation";

// La vitrine marketing part sur le futur site WordPress
// (justinform.agencecantou.fr). La racine de l'app renvoie donc directement
// vers la connexion a la plateforme.
export default function Home() {
  redirect("/connexion");
}
