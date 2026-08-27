import Stripe from "stripe";

// Client Stripe cote serveur uniquement (jamais importe dans un composant client).
// Necessite STRIPE_SECRET_KEY dans .env.local (voir .env.example).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});
