import { INTENSITES, RESSENTIS, type Video } from "@/lib/types";
import { IconeAlerte, IconeCoche, IconeCoeur, IconeLecture } from "@/components/Icones";

// Fonds de secours quand ni la video ni sa categorie n'ont d'image.
const FONDS = [
  "linear-gradient(135deg,#fbe4ee,#f9c8df)",
  "linear-gradient(135deg,#fdf0c7,#f9c8df)",
  "linear-gradient(135deg,#dff1e9,#f6f0ea)",
  "linear-gradient(135deg,#e2f0f6,#dff1e9)",
];

export function Intensite({ niveau, clair = false }: { niveau?: number | null; clair?: boolean }) {
  const n = niveau ?? 2;
  const info = INTENSITES[n] ?? INTENSITES[2];
  return (
    <span className="inline-flex items-center gap-1.5" title={`Intensité ${info.label.toLowerCase()}`}>
      <span className="flex gap-[3px]" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-[5px] w-3.5 rounded-sm"
            style={{ background: i <= n ? info.couleur : clair ? "rgba(255,255,255,.3)" : "rgba(43,29,36,.12)" }}
          />
        ))}
      </span>
      <span className="sr-only">Intensité {info.label}</span>
    </span>
  );
}

export default function CarteVideo({
  video,
  terminee,
  ressenti,
  onClick,
  progression,
  image,
  alerte,
  favori,
}: {
  video: Video;
  terminee: boolean;
  ressenti?: { valeur: number; total: number };
  onClick: () => void;
  accent?: boolean;
  /** Pourcentage 0-100 si la video a ete commencee mais pas terminee. */
  progression?: number;
  /** Image resolue (video ou, a defaut, image de categorie). */
  image?: string | null;
  alerte?: string | null;
  favori?: boolean;
}) {
  const imageAffichee = image !== undefined ? image : video.image_url;
  const fond = FONDS[(video.titre?.length ?? 0) % FONDS.length];
  return (
    <button
      onClick={onClick}
      className="group verre text-left rounded-2xl overflow-hidden flex flex-col transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(146,17,79,.45)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: fond }}>
        {imageAffichee && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageAffichee} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <span className="absolute left-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-framboise opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0">
          <IconeLecture taille={13} />
        </span>
        {terminee && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold text-feuille-dark">
            <IconeCoche taille={12} /> Terminée
          </span>
        )}
        {favori && (
          <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-framboise">
            <IconeCoeur plein taille={15} />
          </span>
        )}
        {progression !== undefined && progression > 0 && !terminee && (
          <span className="absolute left-0 right-0 bottom-0 h-1 bg-white/40">
            <span className="block h-full bg-jaune" style={{ width: `${progression}%` }} />
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-1 sm:gap-1.5 flex-1">
        <p className="etiquette text-feuille-dark truncate">{video.categories?.join(" · ")}</p>
        <p className="font-extrabold text-[14px] sm:text-[16px] leading-snug tracking-tight">{video.titre}</p>
        <div className="mt-auto pt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[12px] sm:text-[12.5px] text-gris">
          <span>
            {video.duree_min} min · {video.niveau === "Debutant" ? "Débutant" : video.niveau === "Intermediaire" ? "Intermédiaire" : video.niveau === "Avance" ? "Avancé" : video.niveau}
          </span>
          <Intensite niveau={video.intensite} />
        </div>
        {ressenti && (
          <p className="text-[12px] text-gris">
            Ressenti : {RESSENTIS[ressenti.valeur]?.label.toLowerCase()} ({ressenti.total})
          </p>
        )}
        {alerte && (
          <p className="mt-1 flex items-start gap-1.5 rounded-lg bg-jaune-light px-2.5 py-1.5 text-[12px] font-semibold text-[#7a4a00]">
            <IconeAlerte taille={14} className="mt-px shrink-0" />
            {alerte}
          </p>
        )}
      </div>
    </button>
  );
}

export function libelleNiveau(n: string) {
  return n === "Debutant" ? "Débutant" : n === "Intermediaire" ? "Intermédiaire" : n === "Avance" ? "Avancé" : n;
}
