import { RESSENTIS, type Video } from "@/lib/types";

export default function CarteVideo({
  video,
  terminee,
  ressenti,
  onClick,
  accent,
  progression,
  image,
}: {
  video: Video;
  terminee: boolean;
  ressenti?: { valeur: number; total: number };
  onClick: () => void;
  accent?: boolean;
  /** Pourcentage 0-100 si la video a ete commencee mais pas terminee. */
  progression?: number;
  /** Image resolue (video ou, a defaut, image de categorie). Fallback sur video.image_url si non fournie. */
  image?: string | null;
}) {
  const imageAffichee = image !== undefined ? image : video.image_url;
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border overflow-hidden transition ${
        accent
          ? "bg-framboise text-white border-framboise"
          : "bg-white border-creme-dark hover:border-framboise/50"
      }`}
    >
      {imageAffichee && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageAffichee} alt="" className="w-full h-32 object-cover" />
      )}
      {progression !== undefined && progression > 0 && (
        <div className="h-1 bg-creme-dark">
          <div className="h-full bg-orange" style={{ width: `${progression}%` }} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <p className={`text-xs font-medium ${accent ? "text-white/80" : "text-framboise"}`}>
            {video.categories?.join(" · ")}
          </p>
          {terminee && (
            <span className={`text-xs ${accent ? "text-white/70" : "text-anthracite/40"}`}>
              ✓ Terminée
            </span>
          )}
        </div>
        <p className="font-semibold">{video.titre}</p>
        <p className={`text-sm ${accent ? "text-white/70" : "text-anthracite/50"}`}>
          {video.duree_min} min · {video.niveau}
        </p>
        <p className={`text-xs mt-1 ${accent ? "text-white/70" : "text-anthracite/40"}`}>
          {ressenti
            ? `${RESSENTIS[ressenti.valeur].emoji} ${RESSENTIS[ressenti.valeur].label}`
            : "Pas encore de ressenti"}
          {ressenti ? ` (${ressenti.total})` : ""} · {video.vues} vue{video.vues > 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}
