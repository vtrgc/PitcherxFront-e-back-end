/**
 * Regras de upload de vídeo do backend (UploadUtil): .mp4, .webm, .mov ou .mkv,
 * até 256 MB cada e no máximo 10 por envio.
 */
export const EXTENSOES_VIDEO = [".mp4", ".webm", ".mov", ".mkv"] as const;
export const ACCEPT_VIDEO = "video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv";
export const TAMANHO_MAXIMO_VIDEO = 256 * 1024 * 1024;
export const QUANTIDADE_MAXIMA_VIDEOS = 10;

export function validarArquivosVideo(arquivos: { name: string; size: number }[], maximo = QUANTIDADE_MAXIMA_VIDEOS): string | null {
  if (arquivos.length > maximo) return `Envie no máximo ${maximo} vídeo${maximo === 1 ? "" : "s"}.`;
  for (const a of arquivos) {
    const nome = a.name.toLowerCase();
    if (!EXTENSOES_VIDEO.some((ext) => nome.endsWith(ext))) return `"${a.name}" não é um vídeo aceito (use MP4, WEBM, MOV ou MKV).`;
    if (a.size > TAMANHO_MAXIMO_VIDEO) return `"${a.name}" passa de 256 MB.`;
    if (a.size === 0) return `"${a.name}" está vazio.`;
  }
  return null;
}

/** Junta a lista de vídeos com o vídeo principal (sem repetir e sem vazios). */
export function videosDaGaleria(videos?: (string | null)[] | null, principal?: string | null): string[] {
  const lista = [...(videos ?? []), principal].filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return [...new Set(lista.map((v) => v.trim()))];
}
