// Extrait l'ID Vimeo depuis un lien colle (https://vimeo.com/123456789,
// https://player.vimeo.com/video/123456789, etc.) ou renvoie tel quel
// si c'est deja juste l'ID.
export function extraireVimeoId(saisie: string): string | null {
  const valeur = saisie.trim();
  if (/^\d+$/.test(valeur)) return valeur;

  const match = valeur.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export function urlEmbedVimeo(vimeoId: string): string {
  return `https://player.vimeo.com/video/${vimeoId}`;
}
