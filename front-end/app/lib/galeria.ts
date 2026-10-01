import { validarArquivoFoto } from "./imagemPerfil";
import { LIMITES } from "./limites";

/**
 * Imagens de uma postagem/projeto na ordem da galeria. O backend devolve `imagens` e,
 * para registros antigos sem galeria, só a URL principal — usada como galeria de 1 item.
 */
export function imagensDaGaleria(imagens?: (string | null)[] | null, principal?: string | null): string[] {
  const lista = (imagens ?? []).filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  if (lista.length === 0 && principal && principal.trim()) lista.push(principal);
  return [...new Set(lista)];
}

/**
 * Valida os arquivos de uma galeria como o ImagemUploadUtil do backend:
 * 1 a 10 arquivos, cada um JPG/PNG/WEBP de até 10 MB. Retorna a mensagem de erro ou null.
 */
export function validarArquivosGaleria(arquivos: { name: string; size: number; type: string }[]): string | null {
  if (arquivos.length === 0) return "Selecione ao menos uma imagem.";
  if (arquivos.length > LIMITES.imagensGaleria) return `Envie no máximo ${LIMITES.imagensGaleria} imagens.`;
  for (const arquivo of arquivos) {
    const erro = validarArquivoFoto(arquivo);
    if (erro) return `${arquivo.name}: ${erro}`;
  }
  return null;
}
