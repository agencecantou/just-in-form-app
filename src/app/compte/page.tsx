"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const FORMULES = [
  { nom: "Mensuel", prix: "14,90 €/mois", actuelle: false },
  { nom: "Annuel", prix: "8,90 €/mois", actuelle: true },
  { nom: "2 ans", prix: "6,50 €/mois", actuelle: false },
];

const OBJECTIFS = ["Perdre du poids", "Se muscler", "Gagner en souplesse", "Se sentir mieux", "Préparation sportive"];

const ONGLETS = ["Mon profil", "Mon abonnement", "Préférences"] as const;

const FREQUENCES = ["1 séance/semaine", "2 séances/semaine", "3+ séances/semaine"];

type Preferences = {
  rappels: boolean;
  serie: boolean;
  nouveautes: boolean;
  newsletter: boolean;
  objectifs: string[];
  frequence: string | null;
};

const PREFERENCES_DEFAUT: Preferences = {
  rappels: true,
  serie: true,
  nouveautes: true,
  newsletter: false,
  objectifs: ["Se sentir mieux"],
  frequence: null,
};

export default function MonCompte() {
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]>("Mon profil");
  const [chargement, setChargement] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [prenom, setPrenom] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(PREFERENCES_DEFAUT);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setChargement(false);
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("prenom, photo_url, preferences")
        .eq("id", user.id)
        .maybeSingle();
      setPrenom(profile?.prenom ?? "");
      setPhotoUrl(profile?.photo_url ?? null);
      if (profile?.preferences && Object.keys(profile.preferences).length > 0) {
        setPreferences({ ...PREFERENCES_DEFAUT, ...profile.preferences });
      }
      setChargement(false);
    }
    charger();
  }, []);

  return (
    <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-6">Mon compte</h1>

      {chargement ? (
        <p className="text-sm text-anthracite/50">Chargement...</p>
      ) : !userId ? (
        <p className="text-sm text-anthracite/50">
          Connecte-toi pour accéder à ton compte.
        </p>
      ) : (
        <>
          <nav className="flex gap-2 mb-8 border-b border-creme-dark">
            {ONGLETS.map((item) => (
              <button
                key={item}
                onClick={() => setOnglet(item)}
                className={`px-3 py-2 text-sm font-medium border-b-2 ${
                  onglet === item
                    ? "border-framboise text-framboise"
                    : "border-transparent text-anthracite/50"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          {onglet === "Mon abonnement" && (
            <>
              <section className="rounded-2xl bg-framboise-light p-5 mb-6">
                <p className="text-sm text-anthracite/60">Formule actuelle</p>
                <p className="text-xl font-semibold text-framboise">Annuel, 8,90 €/mois</p>
                <p className="text-sm text-anthracite/60 mt-1">
                  Tu économises 71 € par an par rapport au mensuel
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
                  Résilier mon abonnement
                </button>
              </div>
              <p className="text-xs text-anthracite/40 mt-4">
                Le paiement en ligne (Stripe) arrive bientôt : cet onglet
                affiche pour l&apos;instant une formule de démonstration.
              </p>
            </>
          )}

          {onglet === "Mon profil" && (
            <OngletProfil
              userId={userId}
              prenom={prenom}
              email={email}
              photoUrl={photoUrl}
              objectifs={preferences.objectifs}
              frequence={preferences.frequence}
              onEnregistre={(p, photo, objectifs, frequence) => {
                setPrenom(p);
                setPhotoUrl(photo);
                setPreferences((prev) => ({ ...prev, objectifs, frequence }));
              }}
            />
          )}

          {onglet === "Préférences" && (
            <OngletPreferences userId={userId} preferences={preferences} onChange={setPreferences} />
          )}
        </>
      )}
    </div>
  );
}

function OngletProfil({
  userId,
  prenom,
  email,
  photoUrl,
  objectifs,
  frequence,
  onEnregistre,
}: {
  userId: string;
  prenom: string;
  email: string;
  photoUrl: string | null;
  objectifs: string[];
  frequence: string | null;
  onEnregistre: (prenom: string, photoUrl: string | null, objectifs: string[], frequence: string | null) => void;
}) {
  const [prenomSaisi, setPrenomSaisi] = useState(prenom);
  const [objectifsSaisis, setObjectifsSaisis] = useState<string[]>(objectifs);
  const [frequenceSaisie, setFrequenceSaisie] = useState<string | null>(frequence);
  const [photo, setPhoto] = useState<string | null>(photoUrl);
  const [enregistrement, setEnregistrement] = useState(false);
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const inputFichierRef = useRef<HTMLInputElement>(null);

  useEffect(() => setPrenomSaisi(prenom), [prenom]);
  useEffect(() => setObjectifsSaisis(objectifs), [objectifs]);
  useEffect(() => setFrequenceSaisie(frequence), [frequence]);
  useEffect(() => setPhoto(photoUrl), [photoUrl]);

  function toggleObjectif(o: string) {
    setObjectifsSaisis((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));
  }

  async function choisirPhoto(fichier: File) {
    setUploadEnCours(true);
    const supabase = createClient();
    const extension = fichier.name.split(".").pop();
    const chemin = `photos-profil/${userId}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("images").upload(chemin, fichier, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("images").getPublicUrl(chemin);
      setPhoto(data.publicUrl);
    }
    setUploadEnCours(false);
  }

  async function enregistrer() {
    setEnregistrement(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ prenom: prenomSaisi, photo_url: photo })
      .eq("id", userId);
    if (!error) {
      // Les objectifs vivent dans le meme champ preferences que l'onglet
      // Preferences : on ne touche que la cle objectifs pour ne pas ecraser
      // le reste.
      const { data: profil } = await supabase.from("profiles").select("preferences").eq("id", userId).maybeSingle();
      await supabase
        .from("profiles")
        .update({
          preferences: { ...(profil?.preferences ?? {}), objectifs: objectifsSaisis, frequence: frequenceSaisie },
        })
        .eq("id", userId);
      onEnregistre(prenomSaisi, photo, objectifsSaisis, frequenceSaisie);
      setMessage("Profil enregistré.");
    } else {
      setMessage("Erreur pendant l'enregistrement, réessaie.");
    }
    setEnregistrement(false);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-creme-dark p-5">
        <p className="font-medium text-sm mb-3">Photo de profil</p>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-framboise-light overflow-hidden flex items-center justify-center text-framboise font-semibold text-xl shrink-0">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              prenomSaisi.charAt(0).toUpperCase() || "?"
            )}
          </div>
          <div>
            <input
              ref={inputFichierRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const fichier = e.target.files?.[0];
                if (fichier) choisirPhoto(fichier);
              }}
            />
            <button
              onClick={() => inputFichierRef.current?.click()}
              disabled={uploadEnCours}
              className="rounded-full border border-creme-dark px-4 py-2 text-sm disabled:opacity-50"
            >
              {uploadEnCours ? "Envoi..." : "Changer la photo"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-creme-dark p-5">
        <p className="font-medium text-sm mb-3">Informations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-anthracite/50">Prénom</label>
            <input
              value={prenomSaisi}
              onChange={(e) => setPrenomSaisi(e.target.value)}
              className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-anthracite/50">Email</label>
            <input
              key={email}
              defaultValue={email}
              disabled
              className="mt-1 w-full rounded-lg border border-creme-dark px-3 py-2 text-sm bg-creme text-anthracite/60"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-creme-dark p-5">
        <p className="font-medium text-sm mb-1">Objectifs</p>
        <p className="text-xs text-anthracite/50 mb-3">
          Utilisés pour te proposer des séances adaptées.
        </p>
        <div className="flex flex-wrap gap-2">
          {OBJECTIFS.map((o) => (
            <button
              key={o}
              onClick={() => toggleObjectif(o)}
              className={`rounded-full px-3 py-1.5 text-sm border ${
                objectifsSaisis.includes(o)
                  ? "bg-framboise text-white border-framboise"
                  : "bg-white text-anthracite/70 border-creme-dark"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-creme-dark p-5">
        <p className="font-medium text-sm mb-1">Fréquence souhaitée</p>
        <p className="text-xs text-anthracite/50 mb-3">
          Le rythme que tu vises, pour t&apos;aider à rester régulière.
        </p>
        <div className="flex flex-wrap gap-2">
          {FREQUENCES.map((f) => (
            <button
              key={f}
              onClick={() => setFrequenceSaisie(f)}
              className={`rounded-full px-3 py-1.5 text-sm border ${
                frequenceSaisie === f
                  ? "bg-framboise text-white border-framboise"
                  : "bg-white text-anthracite/70 border-creme-dark"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-creme-dark p-5">
        <p className="font-medium text-sm mb-3">Sécurité</p>
        <a href="/mot-de-passe-oublie" className="text-sm text-anthracite/60 underline">
          Changer de mot de passe
        </a>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={enregistrer}
          disabled={enregistrement}
          className="rounded-full bg-framboise text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {enregistrement ? "Enregistrement..." : "Enregistrer"}
        </button>
        {message && <p className="text-sm text-anthracite/60">{message}</p>}
      </div>
    </div>
  );
}

function OngletPreferences({
  userId,
  preferences,
  onChange,
}: {
  userId: string;
  preferences: Preferences;
  onChange: (p: Preferences) => void;
}) {
  async function changer(cle: keyof Preferences, valeur: boolean) {
    const suivant = { ...preferences, [cle]: valeur };
    onChange(suivant);
    const supabase = createClient();
    const { data: profil } = await supabase.from("profiles").select("preferences").eq("id", userId).maybeSingle();
    await supabase
      .from("profiles")
      .update({ preferences: { ...(profil?.preferences ?? {}), [cle]: valeur } })
      .eq("id", userId);
  }

  return (
    <div className="space-y-3">
      <TogglePreference
        titre="Rappels de séance"
        description="Une notification les jours où tu as prévu de t'entraîner"
        valeur={preferences.rappels}
        onChange={(v) => changer("rappels", v)}
      />
      <TogglePreference
        titre="Ne casse pas ta série 🔥"
        description="Un rappel si tu es sur le point de perdre ta régularité"
        valeur={preferences.serie}
        onChange={(v) => changer("serie", v)}
      />
      <TogglePreference
        titre="Nouvelles vidéos"
        description="Sois prévenue dès qu'une nouvelle séance est publiée"
        valeur={preferences.nouveautes}
        onChange={(v) => changer("nouveautes", v)}
      />
      <TogglePreference
        titre="Newsletter"
        description="Actus, conseils et offres de Just In Form"
        valeur={preferences.newsletter}
        onChange={(v) => changer("newsletter", v)}
      />
      <p className="text-xs text-anthracite/40 pt-2">
        L&apos;envoi effectif des emails/notifications arrivera avec le
        système de paiement, mais tes préférences sont déjà sauvegardées.
      </p>
    </div>
  );
}

function TogglePreference({
  titre,
  description,
  valeur,
  onChange,
}: {
  titre: string;
  description: string;
  valeur: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl bg-white border border-creme-dark p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{titre}</p>
        <p className="text-xs text-anthracite/50">{description}</p>
      </div>
      <button
        onClick={() => onChange(!valeur)}
        className={`shrink-0 w-11 h-6 rounded-full transition relative ${
          valeur ? "bg-framboise" : "bg-creme-dark"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            valeur ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
