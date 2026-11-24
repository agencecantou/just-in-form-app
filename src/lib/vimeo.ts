// Extrait l'ID Vimeo depuis un lien colle (https://vimeo.com/123456789,
// https://player.vimeo.com/video/123456789, etc.) ou renvoie tel quel
// si c'est deja juste l'ID.
//
// Video "non repertoriee" : Vimeo ajoute un code prive au lien
// (vimeo.com/123456789/abcdef1234 ou ...?h=abcdef1234). On le garde sous
// la forme "123456789:abcdef1234" dans la colonne vimeo_id.
export function extraireVimeoId(saisie: string): string | null {
  const valeur = saisie.trim();
  if (/^\d+(:[a-f0-9]+)?$/i.test(valeur)) return valeur;

  const match = valeur.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-f0-9]{6,}))?/i);
  if (!match) return null;
  const hash = match[2] ?? valeur.match(/[?&]h=([a-f0-9]+)/i)?.[1];
  return hash ? `${match[1]}:${hash}` : match[1];
}

export function urlEmbedVimeo(vimeoId: string, parametres: Record<string, string | number> = {}): string {
  const [id, hash] = vimeoId.split(":");
  const p = new URLSearchParams();
  if (hash) p.set("h", hash);
  for (const [k, v] of Object.entries(parametres)) p.set(k, String(v));
  const q = p.toString();
  return `https://player.vimeo.com/video/${id}${q ? `?${q}` : ""}`;
}
