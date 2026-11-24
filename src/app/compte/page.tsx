"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Chargement, EnTete, Page, useAbonnee } from "@/components/EspaceAbonnee";
import { objectifDepuisProfil } from "@/lib/donnees";
import { IconeAlerte } from "@/components/Icones";

const ONGLETS = ["Mon profil", "Mon rythme", "Mon abonnement", "Préférences"] as const;

type Preferences = {
  rappels: boolean;
  serie: boolean;
  nouveautes: boolean;
  newsletter: boolean;
};

const PREFERENCES_DEFAUT: Preferences = { rappels: true, serie: true, nouveautes: true, newsletter: false };

function aujourdhuiISO(decalageJours = 0) {
  const d = new Date();
  d.setDate(d.getDate() + decalageJours);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MonCompte() {
  const { donnees, rafraichir } = useAbonnee();
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]>("Mon profil");
  const [email, setEmail] = useState("");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  if (!donnees) {
    return (
      <Page>
        <Chargement />
      </Page>
    );
  }
  if (!donnees.userId || !donnees.profil) {
    return (
      <Page>
        <p className="text-sm text-gris">Connecte-toi pour accéder à ton compte.</p>
      </Page>
    );
  }

  return (
    <Page>
      <EnTete titre="Mon compte" />
      <nav className="defile -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto mb-6" aria-label="Rubriques du compte">
        {ONGLETS.map((o) => (
          <button key={o} onClick={() => setOnglet(o)} aria-pressed={onglet === o} className="choix shrink-0">
            {o}
          </button>
        ))}
      </nav>
      <div className="max-w-3xl">
        {onglet === "Mon profil" && <OngletProfil email={email} onEnregistre={rafraichir} />}
        {onglet === "Mon rythme" && <OngletRythme onEnregistre={rafraichir} />}
        {onglet === "Mon abonnement" && (
          <section className="verre rounded-2xl p-6">
            <h2 className="text-lg font-extrabold tracking-tight">Ton abonnement</h2>
            <p className="text-[15px] text-encre/80 mt-2 leading-relaxed">
              Ton accès à toutes les séances, aux programmes et à la nutrition est actif. Le paiement en ligne (formule mensuelle sans engagement, trimestrielle ou
              annuelle) arrive très bientôt sur la plateforme.
            </p>
            <p className="text-sm text-gris mt-3">Une question sur ton abonnement ? Écris à Justine : contact@just-in-form.fr</p>
          </section>
        )}
        {onglet === "Préférences" && <OngletPreferences />}
      </div>
    </Page>
  );
}

function Carte({ titre, aide, children }: { titre: string; aide?: string; children: React.ReactNode }) {
  return (
    <section className="verre rounded-2xl p-5 sm:p-6">
      <h2 className="font-extrabold tracking-tight">{titre}</h2>
      {aide && <p className="text-[13px] text-gris mt-1">{aide}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function OngletProfil({ email, onEnregistre }: { email: string; onEnregistre: () => void }) {
  const { donnees } = useAbonnee();
  const profil = donnees!.profil!;
  const sante = donnees!.sante;
  const [prenom, setPrenom] = useState(profil.prenom ?? "");
  const [photo, setPhoto] = useState<string | null>(profil.photo_url ?? null);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState("");
  const fichierRef = useRef<HTMLInputElement>(null);

  async function choisirPhoto(fichier: File) {
    setEnvoiPhoto(true);
    const supabase = createClient();
    const chemin = `photos-profil/${profil.id}-${Date.now()}.${fichier.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("images").upload(chemin, fichier, { upsert: true });
    if (!error) setPhoto(supabase.storage.from("images").getPublicUrl(chemin).data.publicUrl);
    setEnvoiPhoto(false);
  }

  async function enregistrer() {
    setEnregistrement(true);
    const { error } = await createClient().from("profiles").update({ prenom, photo_url: photo }).eq("id", profil.id);
    setMessage(error ? "Erreur pendant l'enregistrement, réessaie." : "Profil enregistré.");
    setEnregistrement(false);
    if (!error) onEnregistre();
  }

  return (
    <div className="flex flex-col gap-4">
      <Carte titre="Mes informations">
        <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-rose flex items-center justify-center text-framboise text-2xl font-extrabold">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                prenom.charAt(0).toUpperCase() || "?"
              )}
            </div>
            <input ref={fichierRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && choisirPhoto(e.target.files[0])} />
            <button onClick={() => fichierRef.current?.click()} disabled={envoiPhoto} className="btn btn-clair">
              {envoiPhoto ? "Envoi…" : "Changer la photo"}
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mt-5">
          <label className="text-sm font-semibold">
            Prénom
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className="champ mt-1.5" />
          </label>
          <label className="text-sm font-semibold">
            Email
            <input value={email} disabled className="champ mt-1.5 !bg-creme text-gris" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button onClick={enregistrer} disabled={enregistrement} className="btn btn-principal">
            {enregistrement ? "Enregistrement…" : "Enregistrer"}
          </button>
          {message && <p className="text-sm text-gris">{message}</p>}
        </div>
      </Carte>

      <Carte titre="Mon profil santé" aide="Il règle tes suggestions de séances et les alertes d'intensité. Seule Justine y a accès.">
        {Object.keys(sante).length === 0 ? (
          <p className="text-sm text-gris">Tu n&apos;as pas encore rempli ton profil.</p>
        ) : (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
            {sante.objectif && (
              <div>
                <dt className="text-gris text-xs font-semibold">Objectif</dt>
                <dd className="font-semibold">{sante.objectif}</dd>
              </div>
            )}
            {sante.temps && (
              <div>
                <dt className="text-gris text-xs font-semibold">Temps par séance</dt>
                <dd className="font-semibold">{sante.temps === 60 ? "1 h ou +" : `${sante.temps} min`}</dd>
              </div>
            )}
            {sante.passe && (
              <div>
                <dt className="text-gris text-xs font-semibold">Passé sportif</dt>
                <dd className="font-semibold">{sante.passe}</dd>
              </div>
            )}
            {(sante.douleurs?.length ?? 0) > 0 && (
              <div>
                <dt className="text-gris text-xs font-semibold">Douleurs à surveiller</dt>
                <dd className="font-semibold">{sante.douleurs!.join(", ")}</dd>
              </div>
            )}
          </dl>
        )}
        <Link href="/bienvenue?modifier=1" className="btn btn-clair mt-5">
          Modifier mon profil santé
        </Link>
      </Carte>

      <Carte titre="Sécurité">
        <Link href="/mot-de-passe-oublie" className="text-sm font-semibold text-framboise">
          Changer de mot de passe
        </Link>
      </Carte>
    </div>
  );
}

function OngletRythme({ onEnregistre }: { onEnregistre: () => void }) {
  const { donnees } = useAbonnee();
  const profil = donnees!.profil!;
  const [objectif, setObjectif] = useState(objectifDepuisProfil(profil));
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const pauseActive = !!(profil.pause_jusqu_au && profil.pause_jusqu_au >= aujourdhuiISO());

  async function changerObjectif(n: number) {
    setObjectif(n);
    const supabase = createClient();
    const prefs = { ...((profil.preferences as Record<string, unknown>) ?? {}), frequence: n === 1 ? "1 séance/semaine" : n === 2 ? "2 séances/semaine" : "3+ séances/semaine" };
    const { error } = await supabase.from("profiles").update({ objectif_hebdo: n, preferences: prefs }).eq("id", profil.id);
    if (error) await supabase.from("profiles").update({ preferences: prefs }).eq("id", profil.id);
    setMessage("Objectif enregistré.");
    onEnregistre();
  }

  async function pause(semaines: number | null) {
    setEnvoi(true);
    const maj = semaines === null ? { pause_depuis: null, pause_jusqu_au: null } : { pause_depuis: aujourdhuiISO(), pause_jusqu_au: aujourdhuiISO(semaines * 7 - 1) };
    const { error } = await createClient().from("profiles").update(maj).eq("id", profil.id);
    setEnvoi(false);
    setMessage(error ? "Le mode pause n'est pas encore disponible, réessaie bientôt." : semaines === null ? "Bon retour ! Ta plante t'attendait." : "Pause activée, profite bien.");
    onEnregistre();
  }

  return (
    <div className="flex flex-col gap-4">
      <Carte titre="Mon objectif de la semaine" aide="Ta plante grandit à chaque semaine où tu l'atteins. Mieux vaut un objectif tenu qu'un objectif ambitieux.">
        <div className="grid grid-cols-3 gap-2 max-w-md">
          {[1, 2, 3].map((n) => (
            <button key={n} onClick={() => changerObjectif(n)} aria-pressed={objectif === n} className="choix choix-doux !min-h-16 !flex-col !justify-center">
              <span className="chiffre text-2xl">{n === 3 ? "3+" : n}</span>
              <span className="text-xs">séance{n > 1 ? "s" : ""}</span>
            </button>
          ))}
        </div>
      </Carte>

      <Carte titre="Mode pause" aide="Vacances, blessure, grossesse : tes semaines sont gelées, ta plante ne s'assèche pas et tu ne perds rien.">
        {pauseActive ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold">
              En pause jusqu&apos;au{" "}
              {new Date(profil.pause_jusqu_au + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </p>
            <button onClick={() => pause(null)} disabled={envoi} className="btn btn-principal">
              Reprendre maintenant
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 4, 8].map((s) => (
              <button key={s} onClick={() => pause(s)} disabled={envoi} className="btn btn-clair">
                {s === 1 ? "1 semaine" : `${s} semaines`}
              </button>
            ))}
          </div>
        )}
        {donnees?.sante.enceinte && !pauseActive && (
          <p className="mt-4 flex items-start gap-2 text-[13px] text-gris">
            <IconeAlerte taille={15} className="mt-0.5 shrink-0" />
            Pendant ta grossesse, les séances intenses sont signalées. Tu peux aussi mettre en pause à tout moment.
          </p>
        )}
      </Carte>
      {message && <p className="text-sm font-semibold text-feuille-dark">{message}</p>}
    </div>
  );
}

function OngletPreferences() {
  const { donnees } = useAbonnee();
  const profil = donnees!.profil!;
  const [prefs, setPrefs] = useState<Preferences>({ ...PREFERENCES_DEFAUT, ...((profil.preferences as Partial<Preferences>) ?? {}) });

  async function changer(cle: keyof Preferences, valeur: boolean) {
    setPrefs((p) => ({ ...p, [cle]: valeur }));
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("preferences").eq("id", profil.id).maybeSingle();
    await supabase.from("profiles").update({ preferences: { ...(data?.preferences ?? {}), [cle]: valeur } }).eq("id", profil.id);
  }

  const lignes: { cle: keyof Preferences; titre: string; description: string }[] = [
    { cle: "rappels", titre: "Rappels de séance", description: "Un petit mot les jours où tu as prévu de t'entraîner" },
    { cle: "serie", titre: "Ta plante a soif", description: "Un rappel quand ta semaine n'est pas encore validée" },
    { cle: "nouveautes", titre: "Nouvelles vidéos", description: "Sois prévenue dès qu'une nouvelle séance est publiée" },
    { cle: "newsletter", titre: "Newsletter", description: "Actus, conseils et offres de Just In Form" },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      {lignes.map((l) => (
        <div key={l.cle} className="verre rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">{l.titre}</p>
            <p className="text-[13px] text-gris">{l.description}</p>
          </div>
          <button
            role="switch"
            aria-checked={prefs[l.cle]}
            aria-label={l.titre}
            onClick={() => changer(l.cle, !prefs[l.cle])}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${prefs[l.cle] ? "bg-framboise" : "bg-encre/15"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${prefs[l.cle] ? "left-6" : "left-1"}`} />
          </button>
        </div>
      ))}
      <p className="text-xs text-gris pt-2">L&apos;envoi des emails et notifications arrive avec le paiement en ligne, tes préférences sont déjà sauvegardées.</p>
    </div>
  );
}
