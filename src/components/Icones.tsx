// Jeu d'icones au trait (stroke), coherent sur toute l'appli. Pas d'emoji
// dans l'interface : ils s'affichent differemment selon les telephones.

type P = { taille?: number; className?: string; epaisseur?: number };

function Svg({ taille = 20, className, epaisseur = 1.8, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const IconeAccueil = (p: P) => (
  <Svg {...p}>
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </Svg>
);
export const IconeSeances = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M10 9.5v5l4.5-2.5z" />
  </Svg>
);
export const IconeProgrammes = (p: P) => (
  <Svg {...p}>
    <path d="M8 3v4M16 3v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    <path d="M8 14h3M8 17h6" />
  </Svg>
);
export const IconeNutrition = (p: P) => (
  <Svg {...p}>
    <path d="M12 7c-3-2.5-8-1-8 4.5C4 17 8 21 10.5 21c.8 0 1-.5 1.5-.5s.7.5 1.5.5C16 21 20 17 20 11.5 20 6 15 4.5 12 7z" />
    <path d="M12 7c0-2 1-4 3-4" />
  </Svg>
);
export const IconeProgres = (p: P) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);
export const IconeCompte = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Svg>
);
export const IconeCoach = (p: P) => (
  <Svg {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
  </Svg>
);
export const IconeSortie = (p: P) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);
export const IconeLecture = (p: P) => (
  <svg width={p.taille ?? 14} height={p.taille ?? 14} viewBox="0 0 12 12" aria-hidden="true" className={p.className}>
    <path d="M2.5 1.2l8 4.8-8 4.8z" fill="currentColor" />
  </svg>
);
export const IconePause = (p: P) => (
  <svg width={p.taille ?? 14} height={p.taille ?? 14} viewBox="0 0 12 12" aria-hidden="true" className={p.className}>
    <rect x="2" y="1.5" width="3" height="9" rx="0.8" fill="currentColor" />
    <rect x="7" y="1.5" width="3" height="9" rx="0.8" fill="currentColor" />
  </svg>
);
export const IconeCoeur = ({ plein, ...p }: P & { plein?: boolean }) => (
  <svg width={p.taille ?? 18} height={p.taille ?? 18} viewBox="0 0 24 24" aria-hidden="true" className={p.className}>
    <path
      d="M12 21s-8-5.2-8-11.2A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 8 2.8C20 15.8 12 21 12 21z"
      fill={plein ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);
export const IconeCoche = (p: P) => (
  <Svg {...p} epaisseur={p.epaisseur ?? 2.6}>
    <path d="M5 12l5 5L20 7" />
  </Svg>
);
export const IconeAlerte = (p: P) => (
  <Svg {...p} epaisseur={p.epaisseur ?? 2.2}>
    <path d="M12 3l10 18H2z" />
    <path d="M12 10v4M12 17.5v.5" />
  </Svg>
);
export const IconeRecherche = (p: P) => (
  <Svg {...p} epaisseur={2}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </Svg>
);
export const IconeFiltres = (p: P) => (
  <Svg {...p} epaisseur={2}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Svg>
);
export const IconeCadeau = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M12 8v13M3 12h18M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
  </Svg>
);
export const IconeFermer = (p: P) => (
  <Svg {...p} epaisseur={2.2}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const IconePleinEcran = (p: P) => (
  <Svg {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Svg>
);
export const IconeVerrou = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const IconeLivre = (p: P) => (
  <Svg {...p}>
    <path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM18 20a2 2 0 0 0 2-2V6" />
  </Svg>
);
export const IconeAmpoule = (p: P) => (
  <Svg {...p}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
  </Svg>
);
export const IconeBol = (p: P) => (
  <Svg {...p}>
    <path d="M3 11h18a9 9 0 0 1-18 0zM7 7c0-2 2-2 2-4M12 7c0-2 2-2 2-4" />
  </Svg>
);
export const IconeChapeau = (p: P) => (
  <Svg {...p}>
    <path d="M2 7l10-4 10 4-10 4zM6 9v5c0 1.7 2.7 3 6 3s6-1.3 6-3V9" />
  </Svg>
);
export const IconeFleche = (p: P) => (
  <Svg {...p} epaisseur={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const IconeRetour = (p: P) => (
  <Svg {...p} epaisseur={2}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Svg>
);
export const IconePlus = (p: P) => (
  <Svg {...p} epaisseur={2}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export function Goutte({ taille = 14, className }: { taille?: number; className?: string }) {
  return (
    <svg width={taille} height={taille * 1.15} viewBox="0 0 14 16" aria-hidden="true" className={className}>
      <path d="M7 0C4 5 1 7.5 1 10.5A6 6 0 0 0 13 10.5C13 7.5 10 5 7 0z" fill="#5bb8d4" />
      <path d="M4.2 10.6a3 3 0 0 0 2.2 2.6" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

// Pictos des badges
export function PictoBadge({ icone, taille = 26, couleur = "#fff" }: { icone: string; taille?: number; couleur?: string }) {
  const commun = {
    width: taille,
    height: taille,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: couleur,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (icone) {
    case "pousse":
      return (
        <svg {...commun}>
          <path d="M12 22V12M12 12c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z" />
        </svg>
      );
    case "calendrier":
      return (
        <svg {...commun}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M9 15l2 2 4-4" />
        </svg>
      );
    case "drapeau":
      return (
        <svg {...commun}>
          <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
        </svg>
      );
    case "cible":
      return (
        <svg {...commun}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );
    case "palette":
      return (
        <svg {...commun}>
          <circle cx="8" cy="8" r="3" />
          <circle cx="16" cy="8" r="3" />
          <circle cx="8" cy="16" r="3" />
          <circle cx="16" cy="16" r="3" />
        </svg>
      );
    case "flamme":
      return (
        <svg {...commun}>
          <path d="M12 22c4 0 7-2.7 7-6.5 0-3.5-2.5-5.5-3.5-8.5-1.5 2-2.5 3-4 3 .5-3-1-6-3.5-8 0 4-5 6.5-5 13.5C3 19.3 7 22 12 22z" />
        </svg>
      );
    case "livre":
      return (
        <svg {...commun}>
          <path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM18 20a2 2 0 0 0 2-2V6" />
        </svg>
      );
    default:
      return (
        <svg {...commun}>
          <path d="M4 19h16M6 15c0-4 2.5-8 6-8s6 4 6 8" />
          <circle cx="12" cy="5" r="2" />
        </svg>
      );
  }
}

// Espace coach
export const IconeBulle = (p: P) => (
  <Svg {...p}>
    <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
  </Svg>
);
export const IconeEtiquetteTag = (p: P) => (
  <Svg {...p}>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
    <circle cx="7.5" cy="7.5" r="1.3" />
  </Svg>
);
export const IconeCible = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" />
  </Svg>
);
export const IconeGroupe = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
    <path d="M16 4.8a3.2 3.2 0 0 1 0 6.4M18 15.4c1.6.7 2.7 2.2 3 4.6" />
  </Svg>
);
