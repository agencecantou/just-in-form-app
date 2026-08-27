# Just In Form, plateforme

Squelette Next.js pour la refonte de la plateforme Just In Form (site vitrine
+ app abonnees + espace coach). Design system en framboise / orange / creme,
dans la continuite des 4 maquettes HTML deja validees.

## Stack

- Next.js 16 (App Router) + Tailwind v4
- Supabase (auth, base de donnees, RLS)
- Stripe (abonnements, essai gratuit, webhooks)
- Vimeo (video protegee) a brancher

## Demarrer en local

```
npm install
cp .env.example .env.local   # puis remplir les cles, voir plus bas
npm run dev
```

Ouvre http://localhost:3000

## Pages du squelette

- `/` : vitrine marketing (hero, categories de cours, formules)
- `/app` : espace abonnee (dashboard, seances)
- `/compte` : mon compte (abonnement, pause, resiliation)
- `/admin` : back-office coach (dashboard, ajout video)

Tout est statique pour l'instant, l'auth et les donnees Supabase restent a
brancher (voir `src/lib/supabase/`).

## Mise en ligne, etape par etape

1. **GitHub** : cree un repo (prive de preference) `just-in-form-app`, puis
   depuis ce dossier :
   ```
   git remote add origin <url-du-repo>
   git push -u origin main
   ```
2. **Vercel** : connecte-toi avec ton compte GitHub sur vercel.com, "Add New
   Project", importe le repo. Vercel detecte Next.js automatiquement, rien a
   configurer a part les variables d'environnement (etape 6).
3. **Supabase** : cree un projet sur supabase.com, region Europe (Frankfurt),
   recupere l'URL et les cles dans Project Settings > API.
4. **Stripe** : reste en mode Test au depart, cree les 4 produits/prix
   (mensuel, 3 mois, annuel, 2 ans), recupere les cles dans Developers > API
   keys.
5. **Vimeo** : cree une app sur developer.vimeo.com (compte OTT/Pro
   necessaire pour l'upload API et la protection des videos), genere un
   token avec les scopes private, video_files et edit.
6. **Variables d'environnement** : renseigne `.env.local` en local, et copie
   les memes valeurs dans Vercel > Project Settings > Environment Variables.
7. **Domaine** : plus tard, `app.just-in-form.fr` pourra pointer vers Vercel
   en CNAME, le site vitrine WordPress reste sur le domaine principal.
