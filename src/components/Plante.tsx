// La plante de l'abonnee : 6 paliers (graine -> arbre fruitier), un etat
// de soif (0 en forme, 1 a soif, 2 perd ses feuilles) et un "rebond"
// declenche apres une seance. Animations CSS dans globals.css, coupees
// automatiquement si le telephone demande de reduire les animations.

export default function Plante({
  palier,
  soif = 0,
  taille = 150,
  rebond = false,
  gouttes = 1,
  pot = "#92114f",
  label,
}: {
  palier: number;
  soif?: number;
  taille?: number;
  rebond?: boolean;
  gouttes?: number;
  pot?: string;
  label?: string;
}) {
  const s = Math.max(0, Math.min(5, palier));
  const couleurFeuille = soif >= 2 ? "#a9b38a" : soif === 1 ? "#7fae6e" : "#3f8f63";
  const couleurFeuille2 = soif >= 2 ? "#b8c09a" : soif === 1 ? "#8fbb7d" : "#5bb381";
  const affaissement = soif * 14;
  const hauteur = [0, 22, 40, 58, 70, 80][s];
  const sommet = 106 - hauteur;
  const nbFeuilles = Math.max(0, [0, 2, 4, 6, 8, 10][s] - (soif >= 2 ? 2 : 0));

  const feuilles = Array.from({ length: nbFeuilles }, (_, i) => {
    const cote = i % 2 ? 1 : -1;
    const y = 106 - hauteur * ((Math.floor(i / 2) + 1) / (Math.ceil(nbFeuilles / 2) + 0.6));
    const angle = cote > 0 ? -30 + affaissement : 210 - affaissement;
    const rx = i >= nbFeuilles - 2 ? 11 : 13;
    return (
      <g key={i} transform={`translate(80 ${y.toFixed(1)}) rotate(${angle})`}>
        <ellipse
          className="feuille"
          style={{ animationDelay: `${(i * 0.35).toFixed(2)}s` }}
          cx={rx}
          cy="0"
          rx={rx}
          ry={rx * 0.42}
          fill={i % 3 === 1 ? couleurFeuille2 : couleurFeuille}
        />
      </g>
    );
  });

  const fleurs =
    s >= 4 && soif < 2
      ? (s >= 5
          ? [
              [64, sommet - 6],
              [96, sommet + 4],
              [82, sommet + 18],
              [70, sommet + 20],
            ]
          : [[80, sommet - 2]]
        ).map(([x, y], j) => (
          <g key={j} transform={`translate(${x} ${y})`}>
            <g className="fleur" style={{ animationDelay: `${j * 0.8}s` }}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} rx="4" ry="7" transform={`rotate(${a}) translate(0 -6)`} fill={s >= 5 ? "#f2a541" : "#f7b6cb"} />
              ))}
              <circle r="3" fill="#fff3c4" />
            </g>
          </g>
        ))
      : null;

  const nbGouttes = soif === 0 && s > 0 ? Math.max(1, Math.min(3, gouttes)) : 0;

  return (
    <svg
      className={`plante${soif ? " soif" : ""}${rebond ? " rebond" : ""}`}
      viewBox="0 0 160 160"
      width={taille}
      height={taille}
      role="img"
      aria-label={label ?? `Ta plante, palier ${s}`}
    >
      <ellipse cx="80" cy="148" rx="46" ry="6" fill="rgba(146,17,79,.12)" />
      <path d="M48 112 h64 l-8 34 h-48 z" fill={pot} />
      <rect x="44" y="106" width="72" height="10" rx="3" fill={pot} style={{ filter: "brightness(.82)" }} />
      <path d="M58 124 h44" stroke="#f9c8df" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <ellipse cx="80" cy="108" rx="30" ry="4" fill="#5a3b2b" />
      {s === 0 ? (
        <ellipse cx="80" cy="103" rx="7" ry="5" fill="#8a6a4a" />
      ) : (
        <g className="balance">
          <path
            d={`M80 106 C 80 ${106 - hauteur * 0.5}, 78 ${sommet + 10}, 80 ${sommet}`}
            stroke="#2f6b4f"
            strokeWidth={s >= 5 ? 6 : 3}
            fill="none"
            strokeLinecap="round"
          />
          {s >= 5 && <circle cx="80" cy={sommet + 2} r="26" fill={couleurFeuille} opacity=".9" />}
          {feuilles}
          {fleurs}
          {s >= 5 && soif < 2 && (
            <>
              <circle cx="70" cy={sommet + 6} r="5" fill="#e0453a" />
              <circle cx="92" cy={sommet + 14} r="5" fill="#e0453a" />
            </>
          )}
        </g>
      )}
      {Array.from({ length: nbGouttes }, (_, d) => (
        <g key={d} transform={`translate(${[116, 58, 96][d]} ${[22, 14, 8][d]})`}>
          <path className="goutte" style={{ animationDelay: `${d * 0.5}s` }} d="M0 0 q6 10 0 14 q-6 -4 0 -14z" fill="#5bb8d4" />
        </g>
      ))}
      {soif >= 1 && (
        <g transform="translate(118 30)" opacity=".85">
          <path d="M0 0 q6 10 0 14 q-6 -4 0 -14z" fill="none" stroke="#5bb8d4" strokeWidth="1.8" strokeDasharray="3 3" />
        </g>
      )}
    </svg>
  );
}
