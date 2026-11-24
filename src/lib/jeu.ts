// Moteur "ludique" de Just In Form.
//
// Tout est CALCULE a partir de l'historique (seances terminees, defis,
// lectures) : rien n'est stocke, donc rien ne se desynchronise et les
// regles peuvent evoluer sans migration.
//
// Regles (validees dans le zoning de novembre 2026) :
// - Objectif de la semaine choisi par l'abonnee (1, 2 ou 3 seances).
// - Gouttes : +1 par seance terminee (2 par jour maximum), +2 par semaine
//   validee, + les gouttes des defis et missions du mois, +1 par lecture
//   nutrition (2 par semaine maximum).
// - Plante : 6 paliers selon le nombre de semaines validees.
// - Semaine manquee : 1 = la plante a soif, 2 = elle perd des feuilles,
//   3 ou plus = elle redescend d'un palier (jamais sous la pousse).
//   Une semaine validee suffit a la remettre d'aplomb.
// - 1 semaine "joker" par mois, utilisee automatiquement.
// - Mode pause (vacances, blessure, grossesse) : semaines gelees.
// - Les badges obtenus ne disparaissent jamais ; ceux qu'on peut refaire
//   ont un compteur (x N).

export type SeanceJeu = {
  video_id: string;
  termine_le: string;
  duree_min: number;
  categories: string[];
};

export type DefiJeu = {
  id: string;
  type: "mission" | "defi";
  titre: string;
  description: string;
  mois: string;
  categorie: string | null;
  nombre: number;
  gouttes: number;
};

export type RecompenseJeu = {
  id: string;
  titre: string;
  description: string;
  seuil_gouttes: number;
  lien_url: string | null;
};

export type EntreeJeu = {
  seances: SeanceJeu[];
  objectifHebdo: number;
  inscritLe: string | null;
  pauseDepuis: string | null;
  pauseJusquAu: string | null;
  defis: DefiJeu[];
  defisValides: { defi_id: string; valide_le: string }[];
  lectures: { lu_le: string }[];
  programmes: { id: string; titre: string; videoIds: string[] }[];
  recompenses: RecompenseJeu[];
  maintenant?: Date;
};

export type StatutSemaine = "validee" | "manquee" | "joker" | "pause" | "en_cours";

export type Semaine = {
  lundi: Date;
  cle: string;
  nombre: number;
  minutes: number;
  statut: StatutSemaine;
};

export type Badge = {
  id: string;
  titre: string;
  description: string;
  icone: "pousse" | "calendrier" | "drapeau" | "cible" | "palette" | "pilates" | "flamme" | "livre";
  couleur: string;
  /** Nombre de fois obtenu (0 = pas encore). */
  compte: number;
  repetable: boolean;
  /** Progression vers la prochaine obtention. */
  progres: { actuel: number; cible: number };
  obtenuLe: Date | null;
};

export const PALIERS = [
  { seuil: 0, nom: "Graine" },
  { seuil: 1, nom: "Pousse" },
  { seuil: 4, nom: "Jeune plante" },
  { seuil: 8, nom: "Plante feuillue" },
  { seuil: 12, nom: "En fleurs" },
  { seuil: 24, nom: "Arbre fruitier" },
] as const;

export const GOUTTES = {
  parSeance: 1,
  maxSeancesParJour: 2,
  parSemaineValidee: 2,
  parLecture: 1,
  maxLecturesParSemaine: 2,
};

// ---------------------------------------------------------------- dates

export function lundiDe(date: Date): Date {
  const d = new Date(date);
  const jour = d.getDay();
  d.setDate(d.getDate() + (jour === 0 ? -6 : 1 - jour));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function cleJour(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ajouterJours(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function debutMois(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function trimestreDe(date: Date) {
  return { annee: date.getFullYear(), t: Math.floor(date.getMonth() / 3) + 1 };
}

// --------------------------------------------------------------- calcul

export function calculerJeu(e: EntreeJeu) {
  const maintenant = e.maintenant ?? new Date();
  const objectif = Math.min(7, Math.max(1, e.objectifHebdo || 2));
  const seances = [...e.seances].sort(
    (a, b) => new Date(a.termine_le).getTime() - new Date(b.termine_le).getTime()
  );
  const lundiCourant = lundiDe(maintenant);

  // --- semaines
  const parSemaine = new Map<string, { nombre: number; minutes: number }>();
  for (const s of seances) {
    const cle = cleJour(lundiDe(new Date(s.termine_le)));
    const v = parSemaine.get(cle) ?? { nombre: 0, minutes: 0 };
    v.nombre += 1;
    v.minutes += s.duree_min || 0;
    parSemaine.set(cle, v);
  }

  const candidatsDebut = [lundiCourant];
  if (e.inscritLe) candidatsDebut.push(lundiDe(new Date(e.inscritLe)));
  if (seances[0]) candidatsDebut.push(lundiDe(new Date(seances[0].termine_le)));
  const premierLundi = new Date(Math.min(...candidatsDebut.map((d) => d.getTime())));
  const pauseFin = e.pauseJusquAu ? new Date(e.pauseJusquAu + "T23:59:59") : null;

  const semaines: Semaine[] = [];
  const jokersUtilises = new Set<string>();
  for (let l = new Date(premierLundi); l <= lundiCourant; l = ajouterJours(l, 7)) {
    const cle = cleJour(l);
    const v = parSemaine.get(cle) ?? { nombre: 0, minutes: 0 };
    let statut: StatutSemaine;
    if (v.nombre >= objectif) statut = "validee";
    else if (l.getTime() === lundiCourant.getTime()) statut = "en_cours";
    else if (estEnPause(l, e.pauseDepuis, e.pauseJusquAu)) statut = "pause";
    else {
      const mois = `${l.getFullYear()}-${l.getMonth()}`;
      if (!jokersUtilises.has(mois)) {
        jokersUtilises.add(mois);
        statut = "joker";
      } else statut = "manquee";
    }
    semaines.push({ lundi: new Date(l), cle, nombre: v.nombre, minutes: v.minutes, statut });
  }

  const semaineCourante = semaines[semaines.length - 1];
  const passees = semaines.slice(0, -1);
  const semainesValidees = semaines.filter((s) => s.statut === "validee").length;

  let manqueesDAffilee = 0;
  for (let i = passees.length - 1; i >= 0; i--) {
    if (passees[i].statut === "manquee") manqueesDAffilee++;
    else break;
  }
  // Pas de reproche si la semaine en cours est deja validee.
  if (semaineCourante.statut === "validee") manqueesDAffilee = 0;

  // Serie de semaines actives (validee, joker ou pause comptent)
  let serieSemaines = semaineCourante.statut === "validee" ? 1 : 0;
  for (let i = passees.length - 1; i >= 0; i--) {
    const st = passees[i].statut;
    if (st === "validee") serieSemaines++;
    else if (st === "joker" || st === "pause") continue;
    else break;
  }

  // --- plante
  let palierBase = 0;
  PALIERS.forEach((p, i) => {
    if (semainesValidees >= p.seuil) palierBase = i;
  });
  if (seances.length > 0 && palierBase === 0) palierBase = 1;
  const palier = manqueesDAffilee >= 3 && palierBase > 1 ? palierBase - 1 : palierBase;
  const soif = manqueesDAffilee === 0 ? 0 : manqueesDAffilee === 1 ? 1 : 2;
  const prochain = PALIERS[palier + 1] ?? null;
  const restantPalier = prochain ? Math.max(0, prochain.seuil - semainesValidees) : 0;
  const progresPalier = prochain
    ? Math.min(
        1,
        (semainesValidees - PALIERS[palierBase].seuil) /
          Math.max(1, prochain.seuil - PALIERS[palierBase].seuil)
      )
    : 1;

  // --- missions et defis du mois
  const valides = new Map(e.defisValides.map((d) => [d.defi_id, d.valide_le]));
  const defisEtat = e.defis.map((d) => {
    const debut = new Date(d.mois + "T00:00:00");
    const fin = new Date(debut.getFullYear(), debut.getMonth() + 1, 1);
    let actuel = 0;
    let valideLe: string | null = valides.get(d.id) ?? null;
    if (d.type === "mission") {
      const duMois = seances.filter((s) => {
        const t = new Date(s.termine_le);
        return t >= debut && t < fin && (!d.categorie || s.categories?.includes(d.categorie));
      });
      actuel = duMois.length;
      if (actuel >= d.nombre && !valideLe) valideLe = duMois[d.nombre - 1].termine_le;
    } else {
      actuel = valideLe ? d.nombre : 0;
    }
    const estDuMois = debut.getTime() === debutMois(maintenant).getTime();
    return { ...d, actuel: Math.min(actuel, d.nombre), valide: !!valideLe, valideLe, estDuMois };
  });

  // --- gouttes
  const parJour = new Map<string, number>();
  for (const s of seances) {
    const cle = cleJour(new Date(s.termine_le));
    parJour.set(cle, (parJour.get(cle) ?? 0) + 1);
  }
  let gouttesSeances = 0;
  for (const n of parJour.values()) gouttesSeances += Math.min(n, GOUTTES.maxSeancesParJour) * GOUTTES.parSeance;
  const gouttesSemaines = semainesValidees * GOUTTES.parSemaineValidee;
  const gouttesDefis = defisEtat.filter((d) => d.valide).reduce((t, d) => t + d.gouttes, 0);
  const lecturesParSemaine = new Map<string, number>();
  for (const l of e.lectures) {
    const cle = cleJour(lundiDe(new Date(l.lu_le)));
    lecturesParSemaine.set(cle, (lecturesParSemaine.get(cle) ?? 0) + 1);
  }
  let gouttesLectures = 0;
  for (const n of lecturesParSemaine.values())
    gouttesLectures += Math.min(n, GOUTTES.maxLecturesParSemaine) * GOUTTES.parLecture;
  const gouttes = gouttesSeances + gouttesSemaines + gouttesDefis + gouttesLectures;

  // --- recompenses
  const recompenses = [...e.recompenses]
    .sort((a, b) => a.seuil_gouttes - b.seuil_gouttes)
    .map((r) => ({ ...r, debloquee: gouttes >= r.seuil_gouttes, restant: Math.max(0, r.seuil_gouttes - gouttes) }));
  const prochaineRecompense = recompenses.find((r) => !r.debloquee) ?? null;

  // --- programmes termines
  const terminees = new Set(seances.map((s) => s.video_id));
  const programmesEtat = e.programmes
    .filter((p) => p.videoIds.length > 0)
    .map((p) => {
      const fait = p.videoIds.filter((id) => terminees.has(id)).length;
      return { ...p, fait, total: p.videoIds.length, termine: fait === p.videoIds.length };
    });
  const programmesTermines = programmesEtat.filter((p) => p.termine).length;

  // --- badges
  const categoriesVues = new Set(seances.flatMap((s) => s.categories ?? []));
  const nbPilates = seances.filter((s) => s.categories?.includes("Pilates")).length;
  let blocs4 = 0;
  let courant = 0;
  for (const s of passees.concat(semaineCourante.statut === "validee" ? [semaineCourante] : [])) {
    if (s.statut === "validee") {
      courant++;
      if (courant % 4 === 0) blocs4++;
    } else if (s.statut === "manquee") courant = 0;
  }
  const premiereSemaineValidee = semaines.find((s) => s.statut === "validee");
  const nbDefis = defisEtat.filter((d) => d.valide).length;
  const nbLectures = e.lectures.length;

  const badges: Badge[] = [
    {
      id: "premiere",
      titre: "Première séance",
      description: "Le plus dur, c'est de commencer.",
      icone: "pousse",
      couleur: "#f4a7c8",
      compte: seances.length > 0 ? 1 : 0,
      repetable: false,
      progres: { actuel: Math.min(1, seances.length), cible: 1 },
      obtenuLe: seances[0] ? new Date(seances[0].termine_le) : null,
    },
    {
      id: "semaine",
      titre: "Semaine validée",
      description: `${objectif} séance${objectif > 1 ? "s" : ""} dans la semaine.`,
      icone: "calendrier",
      couleur: "#fab200",
      compte: semainesValidees,
      repetable: true,
      progres: { actuel: Math.min(semaineCourante.nombre, objectif), cible: objectif },
      obtenuLe: premiereSemaineValidee ? premiereSemaineValidee.lundi : null,
    },
    {
      id: "serie4",
      titre: "4 semaines d'affilée",
      description: "Un mois complet sans lâcher.",
      icone: "flamme",
      couleur: "#c23a73",
      compte: blocs4,
      repetable: true,
      progres: { actuel: courant % 4, cible: 4 },
      obtenuLe: null,
    },
    {
      id: "programme",
      titre: "Programme terminé",
      description: "Toutes les séances d'un programme.",
      icone: "drapeau",
      couleur: "#92114f",
      compte: programmesTermines,
      repetable: true,
      progres: (() => {
        const enCours = programmesEtat.filter((p) => !p.termine).sort((a, b) => b.fait - a.fait)[0];
        return enCours ? { actuel: enCours.fait, cible: enCours.total } : { actuel: 0, cible: 1 };
      })(),
      obtenuLe: null,
    },
    {
      id: "defi",
      titre: "Défi du mois",
      description: "Mission ou défi relevé.",
      icone: "cible",
      couleur: "#3f8f63",
      compte: nbDefis,
      repetable: true,
      progres: (() => {
        const d = defisEtat.find((x) => x.estDuMois && !x.valide);
        return d ? { actuel: d.actuel, cible: d.nombre } : { actuel: 0, cible: 1 };
      })(),
      obtenuLe: null,
    },
    {
      id: "touche",
      titre: "Touche-à-tout",
      description: "5 disciplines différentes testées.",
      icone: "palette",
      couleur: "#5bb8d4",
      compte: categoriesVues.size >= 5 ? 1 : 0,
      repetable: false,
      progres: { actuel: Math.min(5, categoriesVues.size), cible: 5 },
      obtenuLe: null,
    },
    {
      id: "pilates",
      titre: "10 séances de Pilates",
      description: "Le gainage profond devient une habitude.",
      icone: "pilates",
      couleur: "#b38aa0",
      compte: Math.floor(nbPilates / 10),
      repetable: true,
      progres: { actuel: nbPilates % 10, cible: 10 },
      obtenuLe: null,
    },
    {
      id: "lecture",
      titre: "Curieuse de nutrition",
      description: "10 fiches ou leçons lues.",
      icone: "livre",
      couleur: "#2f6b4f",
      compte: Math.floor(nbLectures / 10),
      repetable: true,
      progres: { actuel: nbLectures % 10, cible: 10 },
      obtenuLe: null,
    },
  ];

  // --- jardin : une plante par trimestre
  const jardin = new Map<string, { annee: number; t: number; validees: number }>();
  for (const s of semaines) {
    const { annee, t } = trimestreDe(s.lundi);
    const cle = `${annee}-T${t}`;
    const v = jardin.get(cle) ?? { annee, t, validees: 0 };
    if (s.statut === "validee") v.validees++;
    jardin.set(cle, v);
  }
  const jardinListe = [...jardin.values()].map((j) => {
    let p = 0;
    PALIERS.forEach((x, i) => {
      if (j.validees >= Math.min(x.seuil, 12)) p = Math.min(i, 4);
    });
    if (j.validees >= 12) p = 5;
    return { ...j, palier: p };
  });

  // Jours de la semaine en cours (lundi = 0)
  const joursSemaine = [0, 0, 0, 0, 0, 0, 0];
  for (const s of seances) {
    const t = new Date(s.termine_le);
    if (t >= lundiCourant && t < ajouterJours(lundiCourant, 7)) joursSemaine[(t.getDay() + 6) % 7]++;
  }

  return {
    objectif,
    semaines,
    semaineCourante,
    joursSemaine,
    semainesValidees,
    manqueesDAffilee,
    serieSemaines,
    jokerDisponible: !jokersUtilises.has(`${maintenant.getFullYear()}-${maintenant.getMonth()}`),
    enPause: !!(pauseFin && pauseFin >= maintenant && (!e.pauseDepuis || new Date(e.pauseDepuis + "T00:00:00") <= maintenant)),
    palier,
    nomPalier: PALIERS[palier].nom,
    soif,
    prochainPalier: prochain ? { nom: prochain.nom, restant: restantPalier } : null,
    progresPalier,
    gouttes,
    detailGouttes: {
      seances: gouttesSeances,
      semaines: gouttesSemaines,
      defis: gouttesDefis,
      lectures: gouttesLectures,
    },
    defis: defisEtat,
    recompenses,
    prochaineRecompense,
    programmes: programmesEtat,
    programmesTermines,
    badges,
    jardin: jardinListe,
    totalSeances: seances.length,
    totalMinutes: seances.reduce((t, s) => t + (s.duree_min || 0), 0),
  };
}

// Une semaine est "en pause" si elle chevauche la periode de pause.
function estEnPause(lundi: Date, depuis: string | null, jusquAu: string | null) {
  if (!jusquAu) return false;
  const fin = new Date(jusquAu + "T23:59:59");
  const debut = depuis ? new Date(depuis + "T00:00:00") : lundiDe(new Date());
  return lundi <= fin && ajouterJours(lundi, 6) >= debut;
}

export type EtatJeu = ReturnType<typeof calculerJeu>;

export function phraseSoif(soif: number, enPause: boolean) {
  if (enPause) return "Ta plante se repose avec toi";
  if (soif === 0) return "Ta plante est en pleine forme";
  if (soif === 1) return "Ta plante a un peu soif";
  return "Ta plante perd quelques feuilles";
}

export function formaterDuree(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}
